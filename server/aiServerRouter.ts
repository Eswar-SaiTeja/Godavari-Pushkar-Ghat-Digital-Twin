/**
 * Server-Side AI API Router
 * Runs inside Vite's Node.js server middleware and standalone Node production server.
 * Secures secret API keys (GEMINI_API_KEY) strictly on the server.
 * Never exposes API keys or client variables to frontend code.
 * Implements rate limiting, schema validation, timeout protection, and official Google Gen AI SDK integration.
 */

import { IncomingMessage, ServerResponse } from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { defaultRateLimiter } from '../src/ai/safety/rateLimiter';
import { aiSecurityGuard } from '../src/ai/safety/aiSecurityGuard';

// Load server-side .env configuration
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Helper to parse JSON body from IncomingMessage
function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1e6) { // 1MB limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  const allowedOrigin = process.env.CORS_ORIGIN || '*';
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-force-retry');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(data));
}

/**
 * Sanitize error messages to eliminate any possibility of API key exposure
 */
export function sanitizeErrorMessage(msg: string): string {
  if (!msg) return '';
  return msg
    .replace(/key=[A-Za-z0-9._-]+/gi, 'key=[REDACTED]')
    .replace(/AQ\.[A-Za-z0-9._-]+/g, '[REDACTED_API_KEY]')
    .replace(/AIza[A-Za-z0-9._-]+/g, '[REDACTED_API_KEY]');
}

// ============================================================================
// CIRCUIT BREAKER & HTTP 429 QUOTA EXHAUSTION HANDLING
// ============================================================================

export interface QuotaCircuitBreakerState {
  quotaExhausted: boolean;
  circuitBreakerActive: boolean;
  retryDelaySeconds: number;
  retryAfterFormatted: string;
  resetTimestamp: string | null;
  resetTimestampMs: number;
  quotaMetric: string;
  quotaLimit: number;
  model: string;
  lastCheckedAt: string | null;
  lastErrorMessage: string;
  source: 'google_rpc_retry_info' | 'message_regex' | 'fallback_cooldown';
}

export const circuitBreakerState: QuotaCircuitBreakerState = {
  quotaExhausted: false,
  circuitBreakerActive: false,
  retryDelaySeconds: 0,
  retryAfterFormatted: '0s',
  resetTimestamp: null,
  resetTimestampMs: 0,
  quotaMetric: 'generativelanguage.googleapis.com/generate_content_free_tier_requests',
  quotaLimit: 20,
  model: 'gemini-3.5-flash',
  lastCheckedAt: null,
  lastErrorMessage: '',
  source: 'fallback_cooldown'
};

export function formatQuotaDuration(seconds: number): string {
  if (seconds <= 0) return '0s';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

function parseDurationString(str: string): number {
  if (!str) return 0;
  let total = 0;
  const hMatch = str.match(/(\d+)\s*h(?:ours?)?/i);
  const mMatch = str.match(/(\d+)\s*m(?:in(?:utes?)?)?/i);
  const sMatch = str.match(/([\d.]+)\s*s(?:ec(?:onds?)?)?/i);

  if (hMatch) total += parseInt(hMatch[1], 10) * 3600;
  if (mMatch) total += parseInt(mMatch[1], 10) * 60;
  if (sMatch) total += parseFloat(sMatch[1]);

  if (!hMatch && !mMatch && !sMatch) {
    const rawNumber = parseFloat(str);
    if (!isNaN(rawNumber)) total = rawNumber;
  }
  return total;
}

/**
 * Parses Google Gemini quota failure errors (HTTP 429 RESOURCE_EXHAUSTED).
 * Extracts Google RPC RetryInfo, QuotaFailure violations, metric, limit, and retry delay.
 */
export function parseQuotaErrorDetails(err: any): {
  isQuota: boolean;
  retryDelaySeconds: number;
  retryAfterFormatted: string;
  quotaMetric: string;
  quotaLimit: number;
  model: string;
  source: 'google_rpc_retry_info' | 'message_regex' | 'fallback_cooldown';
  rawError: string;
} {
  const rawMsg = err?.message || String(err || '');
  const status = err?.status || err?.code || err?.error?.code || err?.error?.status;
  const sanitized = sanitizeErrorMessage(rawMsg);

  // Check if error represents HTTP 429 quota exhaustion
  const isQuota = 
    status === 429 || 
    status === 'RESOURCE_EXHAUSTED' || 
    err?.error?.status === 'RESOURCE_EXHAUSTED' ||
    sanitized.includes('429') ||
    sanitized.includes('RESOURCE_EXHAUSTED') ||
    sanitized.includes('quota') ||
    sanitized.includes('Quota exceeded') ||
    sanitized.includes('Free Tier');

  if (!isQuota) {
    return {
      isQuota: false,
      retryDelaySeconds: 0,
      retryAfterFormatted: '0s',
      quotaMetric: '',
      quotaLimit: 0,
      model: '',
      source: 'fallback_cooldown',
      rawError: sanitized
    };
  }

  let retryDelaySeconds = 0;
  let quotaMetric = 'generativelanguage.googleapis.com/generate_content_free_tier_requests';
  let quotaLimit = 20;
  let detectedModel = 'gemini-3.5-flash';
  let source: 'google_rpc_retry_info' | 'message_regex' | 'fallback_cooldown' = 'fallback_cooldown';

  // 1. Inspect error object and JSON-encoded error message for details array
  let details: any[] = [];
  if (Array.isArray(err?.details)) {
    details = err.details;
  } else if (Array.isArray(err?.error?.details)) {
    details = err.error.details;
  } else {
    try {
      const parsed = JSON.parse(rawMsg);
      if (Array.isArray(parsed?.error?.details)) {
        details = parsed.error.details;
      } else if (Array.isArray(parsed?.details)) {
        details = parsed.details;
      }
    } catch {}
  }

  // Check Google RPC RetryInfo inside details
  for (const item of details) {
    const type = item?.['@type'] || '';
    if (type.includes('RetryInfo') && item?.retryDelay) {
      const delay = parseDurationString(String(item.retryDelay));
      if (delay > 0) {
        retryDelaySeconds = delay;
        source = 'google_rpc_retry_info';
      }
    }
    if (type.includes('QuotaFailure') && Array.isArray(item?.violations)) {
      const v = item.violations[0];
      if (v?.quotaMetric) quotaMetric = v.quotaMetric;
      if (v?.quotaValue) quotaLimit = parseInt(v.quotaValue, 10) || quotaLimit;
      if (v?.quotaDimensions?.model) detectedModel = v.quotaDimensions.model;
    }
  }

  // 2. Fallback to parsing text regex from error message if not extracted from details
  if (retryDelaySeconds === 0) {
    const retryMatch = sanitized.match(/Please retry in\s+([0-9.hmsd]+)/i);
    if (retryMatch && retryMatch[1]) {
      const delay = parseDurationString(retryMatch[1]);
      if (delay > 0) {
        retryDelaySeconds = delay;
        source = 'message_regex';
      }
    }
  }

  const metricMatch = sanitized.match(/metric:\s*([^,\n]+)/i);
  if (metricMatch && metricMatch[1]) quotaMetric = metricMatch[1].trim();

  const limitMatch = sanitized.match(/limit:\s*(\d+)/i);
  if (limitMatch && limitMatch[1]) quotaLimit = parseInt(limitMatch[1], 10);

  const modelMatch = sanitized.match(/model:\s*([a-zA-Z0-9_.-]+)/i);
  if (modelMatch && modelMatch[1]) detectedModel = modelMatch[1].trim();

  // If daily Free Tier limit without explicit seconds, default to 300s (5m) cooldown window
  if (retryDelaySeconds === 0) {
    retryDelaySeconds = 300;
    source = 'fallback_cooldown';
  }

  return {
    isQuota: true,
    retryDelaySeconds: Math.round(retryDelaySeconds),
    retryAfterFormatted: formatQuotaDuration(retryDelaySeconds),
    quotaMetric,
    quotaLimit,
    model: detectedModel,
    source,
    rawError: sanitized
  };
}

export function recordQuotaExhaustion(parsed: ReturnType<typeof parseQuotaErrorDetails>): QuotaCircuitBreakerState {
  const now = Date.now();
  const resetMs = now + parsed.retryDelaySeconds * 1000;
  
  circuitBreakerState.quotaExhausted = true;
  circuitBreakerState.circuitBreakerActive = true;
  circuitBreakerState.retryDelaySeconds = parsed.retryDelaySeconds;
  circuitBreakerState.retryAfterFormatted = parsed.retryAfterFormatted;
  circuitBreakerState.resetTimestampMs = resetMs;
  circuitBreakerState.resetTimestamp = new Date(resetMs).toISOString();
  circuitBreakerState.quotaMetric = parsed.quotaMetric;
  circuitBreakerState.quotaLimit = parsed.quotaLimit;
  circuitBreakerState.model = parsed.model;
  circuitBreakerState.lastCheckedAt = new Date().toISOString();
  circuitBreakerState.lastErrorMessage = parsed.rawError;
  circuitBreakerState.source = parsed.source;

  return { ...circuitBreakerState };
}

export function resetCircuitBreaker(): void {
  circuitBreakerState.quotaExhausted = false;
  circuitBreakerState.circuitBreakerActive = false;
  circuitBreakerState.retryDelaySeconds = 0;
  circuitBreakerState.retryAfterFormatted = '0s';
  circuitBreakerState.resetTimestamp = null;
  circuitBreakerState.resetTimestampMs = 0;
  circuitBreakerState.lastErrorMessage = '';
}

export function checkCircuitBreaker(forceBypass: boolean = false): {
  isOpen: boolean;
  remainingSeconds: number;
  formatted: string;
  quotaState: QuotaCircuitBreakerState;
} {
  if (forceBypass) {
    return {
      isOpen: false,
      remainingSeconds: 0,
      formatted: '',
      quotaState: { ...circuitBreakerState, circuitBreakerActive: false }
    };
  }

  if (!circuitBreakerState.quotaExhausted) {
    return {
      isOpen: false,
      remainingSeconds: 0,
      formatted: '',
      quotaState: { ...circuitBreakerState, circuitBreakerActive: false }
    };
  }

  const now = Date.now();
  if (now >= circuitBreakerState.resetTimestampMs) {
    // Cooldown elapsed! Breaker resets
    resetCircuitBreaker();
    return {
      isOpen: false,
      remainingSeconds: 0,
      formatted: '',
      quotaState: { ...circuitBreakerState, circuitBreakerActive: false }
    };
  }

  const remainingSeconds = Math.max(1, Math.round((circuitBreakerState.resetTimestampMs - now) / 1000));
  const formatted = formatQuotaDuration(remainingSeconds);
  circuitBreakerState.retryDelaySeconds = remainingSeconds;
  circuitBreakerState.retryAfterFormatted = formatted;
  circuitBreakerState.circuitBreakerActive = true;

  return {
    isOpen: true,
    remainingSeconds,
    formatted,
    quotaState: { ...circuitBreakerState, retryDelaySeconds: remainingSeconds, retryAfterFormatted: formatted }
  };
}

export interface RetryConfig {
  maxAttempts: number;         // default: 3
  initialDelayMs: number;      // default: 1000
  backoffFactor: number;       // default: 2
  maxTransientDelayMs: number; // default: 15000
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  backoffFactor: 2,
  maxTransientDelayMs: 15000
};

let cachedGenAI: GoogleGenAI | null = null;
let cachedKey: string | null = null;

function getGenAIClient(apiKey: string): GoogleGenAI {
  if (cachedGenAI && cachedKey === apiKey) {
    return cachedGenAI;
  }
  cachedGenAI = new GoogleGenAI({ apiKey });
  cachedKey = apiKey;
  return cachedGenAI;
}

/**
 * Make external Google Gemini API request via official Google Gen AI SDK (@google/genai)
 * Implements exponential backoff retry for transient limits (<=15s) and circuit breaker trip for daily quota.
 */
async function callGeminiApiWithSDK(
  apiKey: string,
  model: string,
  promptText: string,
  systemInstruction?: string,
  jsonOutput: boolean = true,
  timeoutMs: number = 25000,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<{ text: string; parsedPayload?: any; modelUsed: string; latencyMs: number }> {
  const startTime = performance.now();
  const ai = getGenAIClient(apiKey);
  const currentModel = model || 'gemini-3.5-flash';

  let lastError: any = null;

  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    for (const tryJsonMode of [jsonOutput, false]) {
      try {
        const config: any = {
          systemInstruction: systemInstruction || undefined,
          temperature: 0.2
        };
        if (tryJsonMode) {
          config.responseMimeType = 'application/json';
        }

        const callPromise = ai.models.generateContent({
          model: currentModel,
          contents: promptText,
          config
        });

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Gemini request timed out after ${timeoutMs}ms`)), timeoutMs);
        });

        const response = await Promise.race([callPromise, timeoutPromise]);
        const latencyMs = Math.round(performance.now() - startTime);
        const text = response.text || '';

        let parsedPayload: any = null;
        if (text) {
          try {
            parsedPayload = JSON.parse(text);
          } catch {
            const match = text.match(/```(?:json)?([\s\S]*?)```/);
            if (match) {
              try { parsedPayload = JSON.parse(match[1].trim()); } catch {}
            }
          }
        }

        // Success! Reset circuit breaker if it was previously active
        if (circuitBreakerState.quotaExhausted) {
          resetCircuitBreaker();
        }

        return {
          text,
          parsedPayload,
          modelUsed: currentModel,
          latencyMs
        };
      } catch (err: any) {
        lastError = err;
        const quotaInfo = parseQuotaErrorDetails(err);

        // If quota exhaustion detected
        if (quotaInfo.isQuota) {
          recordQuotaExhaustion(quotaInfo);

          // If retry delay is longer than short transient threshold (> 15s),
          // such as Google Free Tier daily quota (e.g. 24m or 1489s),
          // DO NOT backoff loop! Retrying immediately wastes resources.
          if (quotaInfo.retryDelaySeconds > 15) {
            console.warn(`[AIServerRouter] Daily Gemini quota limit reached (${quotaInfo.retryAfterFormatted}). Trip circuit breaker.`);
            throw err;
          }

          // Short transient rate limit (<= 15s) -> backoff retry if attempts remain
          if (attempt < retryConfig.maxAttempts) {
            const backoffMs = Math.min(
              retryConfig.maxTransientDelayMs,
              Math.max(quotaInfo.retryDelaySeconds * 1000, retryConfig.initialDelayMs * Math.pow(retryConfig.backoffFactor, attempt - 1))
            );
            console.warn(`[AIServerRouter] Transient rate limit detected. Backing off for ${backoffMs}ms (attempt ${attempt}/${retryConfig.maxAttempts})...`);
            await new Promise(r => setTimeout(r, backoffMs));
            break; // Break inner loop to retry outer attempt
          } else {
            throw err;
          }
        }

        // Transient 503 or overload check
        const status = err?.status || err?.code;
        const isTransient503 = status === 503 || err?.message?.includes('high demand') || err?.message?.includes('503');
        if (tryJsonMode && isTransient503) {
          continue; // Retry in text mode immediately
        }

        if (isTransient503 && attempt < retryConfig.maxAttempts) {
          const backoffMs = Math.min(
            retryConfig.maxTransientDelayMs,
            retryConfig.initialDelayMs * Math.pow(retryConfig.backoffFactor, attempt - 1)
          );
          console.warn(`[AIServerRouter] Transient 503 detected. Backing off for ${backoffMs}ms (attempt ${attempt}/${retryConfig.maxAttempts})...`);
          await new Promise(r => setTimeout(r, backoffMs));
          break;
        }

        // Non-transient error: stop retrying
        throw err;
      }
    }
  }

  throw lastError;
}

/**
 * Generate server-side mock fallback payload
 */
function generateServerMockResponse(service: string, sanitizedPrompt: string, _userContext: any) {
  const pLower = sanitizedPrompt.toLowerCase();
  let actionType: any = 'NONE';
  let summary = '';
  let recommendations: string[] = [];
  let payload: any = {};

  if (service === 'CrowdPrediction' || service === 'predict-crowd') {
    summary = 'Multi-horizon crowd forecast: Ingress along Main Pushkar Arch projects +12.4% net accumulation over 30 minutes. Density at Pushkar Tier 2 steps projected at 2.4 pax/m² with low surge probability (0.28).';
    recommendations = [
      'Pre-position crowd stewards at Pushkar tiered stairs',
      'Maintain pedestrian diversion corridor towards Kotilingala sector',
      'Monitor Gate 1 ingress turnstile clicker rates'
    ];
    payload = {
      forecastHorizonMinutes: 30,
      overallTrend: 'RISING',
      totalProjectedDevotees: 51200,
      identifiedBottlenecks: ['Pushkar Ghat Tier 2 Steps', 'North Arch Ingress Ramp'],
      uncertaintyRange: { lower: 48500, median: 51200, upper: 53900, confidence: 0.95 }
    };
  } else if (service === 'AnomalyDetection' || service === 'detect-anomalies') {
    summary = 'Anomaly scan completed across 7 ghat sectors. System operational health score is 82/100. 1 moderate density concentration alert identified.';
    recommendations = ['Divert subsequent pilgrim cohorts toward Markandeya Ghat holding area.'];
    payload = {
      totalAnomaliesDetected: 1,
      criticalCount: 0,
      systemHealthScore: 82,
      anomalies: [
        {
          anomalyId: 'anom-srv-crowd-density',
          title: 'Elevated Devotee Density at Bathing Tier',
          category: 'CROWD_SURGE',
          severity: 'MODERATE',
          location: 'Pushkar Ghat North Steps',
          detectedAt: new Date().toISOString(),
          observedValue: '2.1 pax/m²',
          expectedBaseline: '1.4 - 1.8 pax/m²',
          confidence: 0.91,
          recommendedAction: 'Divert subsequent pilgrim cohorts toward Markandeya Ghat holding area.'
        }
      ]
    };
  } else if (service === 'EvacuationOptimization' || service === 'evacuation-advice') {
    actionType = 'EVACUATION_ROUTE_MOD';
    summary = 'AI Evacuation Egress Optimizer evaluated multi-path dynamic routing. A* pathfinding shows +43.1% clearance time improvement by directing Sector 1 devotees through VIP Corridor to Municipal Stadium.';
    recommendations = [
      'Human Commander approval required before deploying route signs or opening VIP gates',
      'Alert AP Police stewards at VIP barrier checkpoint'
    ];
    payload = {
      affectedZone: 'Pushkar Main Ghat (North Steps)',
      baselineClearanceMinutes: 32.0,
      aiOptimizedClearanceMinutes: 18.2,
      efficiencyGainPercent: 43.1,
      primaryCorridor: 'VIP Riverbank Corridor to Municipal Stadium',
      bottlenecksAvoided: ['Main Pushkar Arch Choke-Point', 'Bazaar Street Bottleneck']
    };
  } else if (service === 'ResourceRecommendation' || service === 'resource-allocation') {
    actionType = 'RESOURCE_REALLOCATION';
    summary = 'Multi-Criteria Decision Analysis (MCDA) recommends pre-positioning APSP Police Unit 04 and SDRF Rescue Boat 02 to Sector 1 for surge buffer.';
    recommendations = [
      'Requires Watch Commander confirmation before dispatch assignment',
      'Dispatch travel ETA estimated at 3.5 minutes'
    ];
    payload = {
      overallDeficitSummary: 'Sector 1 (Pushkar Ghat) bathing perimeter requires standby water rescue and crowd control reinforcement.',
      recommendations: [
        {
          resourceId: 'res-sdrf-02',
          resourceName: 'SDRF Water Rescue Craft 02',
          category: 'FIRE_RESCUE',
          currentZone: 'Kotilingala Reserve Muster',
          targetZone: 'Pushkar Main Ghat',
          travelEtaMinutes: 2.0,
          mcdaScore: 92.4,
          justification: 'High water-safety suitability near active bathing tier'
        }
      ]
    };
  } else if (service === 'FloodIntelligence' || service === 'flood-intelligence') {
    summary = 'Godavari hydrological status is SAFE. Current water level is 13.80m MSL (3.70m below danger mark of 17.50m MSL). Dowleswaram barrage discharge steady at 325,000 cusecs.';
    recommendations = [
      'Maintain SDRF river safety buoys at 15m distance from shoreline',
      'Monitor CWC Bhadrachalam upstream telemetry'
    ];
    payload = {
      cwcWaterLevelMsl: 13.80,
      dangerLevelMsl: 17.50,
      warningLevelMsl: 16.00,
      submergenceRiskLevel: 'SAFE',
      upstreamDischargeCusecs: 325000,
      barrageDischargeStatus: '325,000 cusecs discharged via 68 barrage bays.'
    };
  } else if (service === 'PublicAnnouncement' || service === 'generate-announcement') {
    actionType = 'PUBLIC_ALERT';
    summary = 'Drafted trilingual public address script in Telugu, English, and Hindi. Human Commander approval strictly required before broadcast.';
    recommendations = [
      'Commander must verify script accuracy before release to PA speaker towers'
    ];
    payload = {
      announcementId: `PA-${Date.now().toString().slice(-6)}`,
      targetPAZones: ['Pushkar Ghat Main PA Tower', 'North Ramp Cluster'],
      teluguScript: 'భక్తులందరికీ విజ్ఞప్తి: ఘాట్ మెట్లు తడిగా ఉన్నందున దయచేసి నెమ్మదిగా నడవండి. తొందరపడవద్దు.',
      englishScript: 'Attention devotees: Bathing steps are wet and slippery. Please step carefully and follow volunteer guidance.',
      hindiScript: 'सभी श्रद्धालुओं से अनुरोध है: घाट की सीढ़ियां गीली हैं, कृपया सावधानी से चलें और धक्का-मुक्की न करें।',
      priorityLevel: 'ROUTINE',
      audioReady: true
    };
  } else {
    // Default Command Assistant (JARVIS)
    if (pLower.includes('crowd') || pLower.includes('density') || pLower.includes('people')) {
      summary = 'Current simulated population across Godavari ghat corridor is 48,250 devotees. Pushkar Ghat North holds the highest density at 2.33 pax/m² (93% capacity).';
      recommendations = ['Divert subsequent northbound arrivals to Kotilingala Ghat.'];
    } else if (pLower.includes('flood') || pLower.includes('water') || pLower.includes('river')) {
      summary = 'Godavari river gauge at Pushkar Ghat stands at 13.80m MSL (0.70m below warning level of 14.50m MSL). Dowleswaram discharge is 325,000 cusecs.';
      recommendations = ['Maintain continuous CWC sensor polling every 15 minutes.'];
    } else if (pLower.includes('incident') || pLower.includes('emergency')) {
      summary = 'Currently 2 active simulated incidents under emergency triage: 1 Dehydration / Heat Exhaustion at Sector 1, and 1 Queue Pressure at North Arch.';
      recommendations = ['Dispatch Medical Squad 01 and Police Unit 04.'];
    } else {
      summary = 'Digital Twin operational command telemetry is nominal. Total monitored devotees: 48,250; active incidents: 2; available emergency teams: 18 units; river gauge: 13.80m MSL.';
      recommendations = ['Review active sector densities in the Overview Command Center.'];
    }
    payload = {
      intent: 'DIGITAL_TWIN_SUMMARY',
      directAnswer: summary,
      suggestedFollowUps: [
        'What is the crowd density at Pushkar Ghat North?',
        'Show all available medical teams',
        'Compare evacuation routes for Sector 1',
        'Check Godavari water level and flood risk'
      ]
    };
  }

  const humanApprovalReq = aiSecurityGuard.evaluateHumanApprovalRequirement(actionType, summary, payload);

  return {
    id: `srv-ai-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    service,
    summary,
    payload,
    dataReferences: [
      {
        id: 'ref-wgs84',
        source: 'Survey of India / OpenStreetMap Rajamahendravaram',
        category: 'GIS',
        classification: 'VERIFIED',
        timestamp: new Date().toISOString()
      },
      {
        id: 'ref-cwc',
        source: 'CWC Godavari River Basin Gauge & Dowleswaram Barrage',
        category: 'HYDROLOGY',
        classification: 'SIMULATED',
        timestamp: new Date().toISOString()
      }
    ],
    recommendations,
    confidence: {
      score: 0.94,
      level: 'HIGH',
      rationale: 'Deterministic operational model grounded in verified GIS landmarks and CWC hydrological thresholds.',
      uncertainties: []
    },
    timestamp: new Date().toISOString(),
    dataClassification: 'SIMULATED',
    humanApproval: humanApprovalReq,
    missingOrUnavailableData: [
      'SIMULATED FALLBACK: Deterministic mock response generated by local simulator engine. Google Gemini API unavailable or quota limit reached.'
    ],
    provider: 'server-mock',
    model: 'godavari-twin-mock-v1',
    isSimulatedMock: true,
    latencyMs: 35
  };
}

/**
 * Main HTTP Request Handler for /api/ai/*
 */
export async function handleAIRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url || '';
  if (!url.startsWith('/api/ai')) {
    return false;
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    const allowedOrigin = process.env.CORS_ORIGIN || '*';
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-force-retry');
    res.end();
    return true;
  }

  // Rate Limiting check
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const rateLimit = defaultRateLimiter.checkLimit(clientIp);
  res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());
  res.setHeader('X-RateLimit-Reset', rateLimit.resetSeconds.toString());

  if (!rateLimit.allowed) {
    sendJson(res, 429, {
      error: 'Rate limit exceeded. Too many AI requests from this client.',
      retryAfterSeconds: rateLimit.resetSeconds,
      code: 'RATE_LIMIT_EXCEEDED'
    });
    return true;
  }

  // Read backend secret environment variables (Strictly server-side, never exposed to client)
  const geminiApiKey = process.env.GEMINI_API_KEY || '';
  const geminiModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
  const configuredProvider = geminiApiKey ? 'gemini' : (process.env.AI_PROVIDER || 'mock');

  try {
    // 1. Health check & Provider Connection Verification
    if (url.startsWith('/api/ai/health') && req.method === 'GET') {
      const forceRetry = url.includes('force=true') || req.headers['x-force-retry'] === 'true';
      const breaker = checkCircuitBreaker(forceRetry);

      let isConnected = false;
      let activeProvider = 'mock';
      let model = 'godavari-twin-mock-v1';
      let message = 'Running on built-in Mock AI Engine (Zero-config offline mode). GEMINI_API_KEY not configured in server environment.';
      let geminiPingLatencyMs = 0;
      let isSimulatedMock = true;

      if (geminiApiKey) {
        // If Circuit Breaker is active and this is not a manual force retry:
        // Shields Google API from repeated calls during quota exhaustion.
        if (breaker.isOpen && !forceRetry) {
          isConnected = true;
          activeProvider = 'mock';
          model = 'godavari-twin-mock-v1';
          isSimulatedMock = true;
          message = `Google Gemini Free Tier daily quota limit reached (HTTP 429 RESOURCE_EXHAUSTED). Circuit breaker active preventing repeated calls. Auto-retry available in ~${breaker.formatted}. Operating on Mock AI Engine (SIMULATED).`;
        } else {
          // Probe Gemini API (either normal check or operator manual retry)
          try {
            const t0 = performance.now();
            const testPing = await callGeminiApiWithSDK(
              geminiApiKey,
              geminiModel,
              'Reply with one word: READY',
              undefined,
              false,
              15000
            );
            geminiPingLatencyMs = Math.round(performance.now() - t0);

            isConnected = true;
            activeProvider = 'gemini';
            model = testPing.modelUsed;
            isSimulatedMock = false;
            message = `Google Gemini Generative AI connected successfully via official Google Gen AI SDK (${testPing.modelUsed}).`;
          } catch (err: any) {
            isConnected = true;
            activeProvider = 'mock';
            isSimulatedMock = true;
            const quotaInfo = parseQuotaErrorDetails(err);
            const sanitizedErr = sanitizeErrorMessage(err.message || String(err));
            const status = err?.status || err?.code;
            const isInvalidKey = status === 400 || status === 401 || status === 403 || sanitizedErr.includes('API key not valid');

            if (quotaInfo.isQuota) {
              const recorded = recordQuotaExhaustion(quotaInfo);
              message = `Google Gemini Free Tier daily quota limit reached (HTTP 429 RESOURCE_EXHAUSTED: ${quotaInfo.quotaLimit} req/day). Auto-retry in ~${recorded.retryAfterFormatted}. Operating on Mock AI Engine (SIMULATED).`;
            } else if (isInvalidKey) {
              message = `Invalid Google Gemini API key: authentication rejected by Google. Operating on Mock AI Engine.`;
            } else if (status === 503 || sanitizedErr.includes('high demand')) {
              message = `Google Gemini service temporarily unavailable (503 high demand). Operating on Mock AI Engine.`;
            } else {
              message = `Gemini connection check failed: ${sanitizedErr}. Operating on Mock AI Engine.`;
            }
          }
        }
      } else {
        isConnected = true;
        isSimulatedMock = true;
      }

      sendJson(res, 200, {
        connected: isConnected,
        activeProvider,
        configuredProvider,
        model,
        hasSecretKeyConfigured: !!geminiApiKey,
        geminiPingLatencyMs: geminiPingLatencyMs || undefined,
        isSimulatedMock,
        quotaState: circuitBreakerState.quotaExhausted ? { ...circuitBreakerState } : undefined,
        message,
        securityPosture: {
          keysExposedToClient: false,
          serverSideOnly: true,
          rateLimitingActive: true,
          humanApprovalRequiredForActions: true
        },
        availableFeatures: [
          'Command Assistant (JARVIS)',
          'Multi-Horizon Crowd Forecast (15/30/60m)',
          'Bottleneck & Anomaly Detection',
          'MCDA Resource & Ambulance Dispatch',
          'A* Evacuation Route Optimization',
          'Godavari Hydrology & Flood Assessment',
          '8-Category Situation Reports (SITREP)',
          'Multilingual PA Public Announcements'
        ],
        timestamp: new Date().toISOString()
      });
      return true;
    }

    // 2. Human Action Authorization endpoint
    if (url === '/api/ai/approve-action' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { auditId, decision, reviewer, notes } = body;

      if (!auditId || !decision || !reviewer) {
        sendJson(res, 400, { error: 'Missing required approval fields (auditId, decision, reviewer).' });
        return true;
      }

      try {
        const updated = aiSecurityGuard.processHumanDecision(auditId, reviewer, decision, notes);
        if (!updated) {
          sendJson(res, 404, { error: 'Audit log entry not found.' });
          return true;
        }
        sendJson(res, 200, { success: true, updatedEntry: updated });
        return true;
      } catch (err: any) {
        sendJson(res, 403, { error: err.message });
        return true;
      }
    }

    // 3. Inference Endpoints: /api/ai/command, /api/ai/predict-crowd, /api/ai/detect-anomalies, etc.
    if (req.method === 'POST') {
      const body = await parseJsonBody(req);
      const prompt = body.prompt || body.query || '';
      
      // Map URL path or body.service to service name
      let service = body.service || 'CommandAssistant';
      if (url.includes('/predict-crowd')) service = 'CrowdPrediction';
      else if (url.includes('/detect-anomalies')) service = 'AnomalyDetection';
      else if (url.includes('/evacuation-advice')) service = 'EvacuationOptimization';
      else if (url.includes('/resource-allocation')) service = 'ResourceRecommendation';
      else if (url.includes('/flood-intelligence')) service = 'FloodIntelligence';
      else if (url.includes('/generate-report')) service = 'ReportGeneration';
      else if (url.includes('/generate-announcement')) service = 'PublicAnnouncement';

      const userContext = body.userContext || { userId: 'anonymous-operator', role: 'OPERATOR' };

      // Prompt validation and security sanitization
      const validation = aiSecurityGuard.validateInputPrompt(prompt || service);
      if (!validation.isValid) {
        sendJson(res, 400, {
          error: validation.error,
          securityFlags: validation.securityFlags
        });
        return true;
      }

      let result: any;

      // Execute Google Gemini API when key is configured
      if (geminiApiKey) {
        const breaker = checkCircuitBreaker();

        if (breaker.isOpen) {
          // Circuit breaker active: prevent calling Google API, serve immediate SIMULATED mock response
          result = generateServerMockResponse(service, validation.sanitizedText, userContext);
          result.missingOrUnavailableData = [
            `Google Gemini Free Tier daily quota exhausted (HTTP 429). Circuit breaker active for next ${breaker.formatted}. Evaluated via local simulation engine.`
          ];
          result.dataClassification = 'SIMULATED';
          result.isSimulatedMock = true;
          result.quotaState = breaker.quotaState;
        } else {
          try {
            const systemInstruction = body.systemPrompt || 
              `You are Godavari Pushkar Ghat 3D Digital Twin AI Copilot (Rajamahendravaram). ` +
              `Synthesize structured, evidence-backed operational intelligence. ` +
              `Classify simulated inputs as SIMULATED. Ground decisions in GIS and safety benchmarks. ` +
              `Output strictly valid JSON matching { summary: string, recommendations: string[], payload: object }.`;

            const contextData = body.contextSummary 
              ? `Telemetry Context:\n${body.contextSummary}\n\n`
              : `Live Twin Telemetry: Devotees=250; Pushkar Ghat=3.8 pax/m² (HIGH); CWC River Gauge=13.8m MSL (SAFE vs 17.5m Danger); Barrage Outflow=325,000 cusecs; Medical Squads=3 available.\n\n`;

            const geminiPrompt = `${contextData}Service: ${service}\nRequest: ${validation.sanitizedText}`;

            const geminiRes = await callGeminiApiWithSDK(
              geminiApiKey,
              geminiModel,
              geminiPrompt,
              systemInstruction,
              true,
              25000
            );

            const parsedPayload = geminiRes.parsedPayload || {};
            const responseText = geminiRes.text;

            // Build validated AIStructuredResponse
            result = generateServerMockResponse(service, validation.sanitizedText, userContext);
            result.summary = parsedPayload.summary || parsedPayload.directAnswer || (responseText ? responseText.slice(0, 300) : result.summary);
            if (parsedPayload.recommendations && Array.isArray(parsedPayload.recommendations)) {
              result.recommendations = parsedPayload.recommendations;
            }
            if (parsedPayload.payload && typeof parsedPayload.payload === 'object') {
              result.payload = { ...result.payload, ...parsedPayload.payload };
            }
            if (parsedPayload.directAnswer) {
              result.payload.directAnswer = parsedPayload.directAnswer;
            }
            result.provider = 'gemini';
            result.model = geminiRes.modelUsed;
            result.isSimulatedMock = false;
            result.latencyMs = geminiRes.latencyMs;
          } catch (err: any) {
            const quotaInfo = parseQuotaErrorDetails(err);
            const sanitizedErr = sanitizeErrorMessage(err.message || String(err));
            console.warn('[AIServerRouter] Real Gemini inference failed, engaging Mock fallback:', sanitizedErr);
            
            result = generateServerMockResponse(service, validation.sanitizedText, userContext);
            result.dataClassification = 'SIMULATED';
            result.isSimulatedMock = true;

            if (quotaInfo.isQuota) {
              const recorded = recordQuotaExhaustion(quotaInfo);
              result.missingOrUnavailableData = [
                `Google Gemini API daily quota reached (HTTP 429 RESOURCE_EXHAUSTED). Circuit breaker engaged for next ${recorded.retryAfterFormatted}. Operating on local simulated fallback.`
              ];
              result.quotaState = recorded;
            } else {
              result.missingOrUnavailableData.push(`Gemini API call failed (${sanitizedErr}). Gracefully evaluated via server fallback.`);
            }
          }
        }
      } else {
        // Deterministic local mock engine
        result = generateServerMockResponse(service, validation.sanitizedText, userContext);
        result.dataClassification = 'SIMULATED';
        result.isSimulatedMock = true;
      }

      sendJson(res, 200, result);
      return true;
    }

    sendJson(res, 404, { error: `Endpoint not found: ${url}` });
    return true;
  } catch (err: any) {
    const sanitizedErr = sanitizeErrorMessage(err.message || String(err));
    console.error('[AIServerRouter] Internal error:', sanitizedErr);
    sendJson(res, 500, { 
      error: 'Internal AI Server Error', 
      message: sanitizedErr 
    });
    return true;
  }
}
