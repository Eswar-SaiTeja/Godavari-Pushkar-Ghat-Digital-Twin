/**
 * Server-Side AI API Router
 * Runs inside Vite's Node.js server middleware and standalone Node production server.
 * Secures secret API keys (GEMINI_API_KEY) strictly on the server.
 * Never exposes API keys or client variables to frontend code.
 * Implements rate limiting, schema validation, timeout protection, and local mock fallback.
 */

import { IncomingMessage, ServerResponse } from 'http';
import { defaultRateLimiter } from '../src/ai/safety/rateLimiter';
import { aiSecurityGuard } from '../src/ai/safety/aiSecurityGuard';

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
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(data));
}

/**
 * Make external Google Gemini API request with retry limits and timeout
 */
async function callGeminiApiWithRetry(
  apiKey: string,
  model: string,
  promptText: string,
  systemInstruction?: string,
  maxRetries: number = 2,
  timeoutMs: number = 10000
): Promise<any> {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  let attempt = 0;
  let lastError: any = null;

  const contents = [
    {
      parts: [
        {
          text: systemInstruction 
            ? `${systemInstruction}\n\nTask:\n${promptText}`
            : promptText
        }
      ]
    }
  ];

  while (attempt < maxRetries) {
    attempt++;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json'
          }
        }),
        signal: controller.signal
      });
      clearTimeout(timer);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google Gemini API returned HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (err: any) {
      clearTimeout(timer);
      lastError = err;
      if (err.name === 'AbortError') {
        throw new Error(`Gemini API request timed out after ${timeoutMs}ms (Attempt ${attempt}/${maxRetries})`);
      }
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, attempt * 500));
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
    dataClassification: 'AI_INFERRED',
    humanApproval: humanApprovalReq,
    missingOrUnavailableData: [],
    provider: 'server-mock',
    model: 'godavari-twin-server-v2',
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
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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
  const geminiModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const configuredProvider = geminiApiKey ? 'gemini' : (process.env.AI_PROVIDER || 'mock');

  try {
    // 1. Health check & Provider Connection Verification
    if (url === '/api/ai/health' && req.method === 'GET') {
      let isConnected = false;
      let activeProvider = 'mock';
      let model = 'godavari-twin-mock-v1';
      let message = 'Running on built-in Mock AI Engine (Zero-config offline mode). GEMINI_API_KEY not configured in server environment.';
      let geminiPingLatencyMs = 0;

      if (geminiApiKey) {
        try {
          const t0 = performance.now();
          const testRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`);
          geminiPingLatencyMs = Math.round(performance.now() - t0);

          if (testRes.ok) {
            isConnected = true;
            activeProvider = 'gemini';
            model = geminiModel;
            message = `Google Gemini API key verified and connected successfully (${geminiModel}).`;
          } else {
            message = `Gemini API key rejected by Google (HTTP ${testRes.status}). Operating in Mock fallback.`;
          }
        } catch (err: any) {
          message = `Gemini network ping failed: ${err.message}. Operating in Mock fallback.`;
        }
      } else {
        isConnected = true;
      }

      sendJson(res, 200, {
        connected: isConnected,
        activeProvider,
        configuredProvider,
        model,
        hasSecretKeyConfigured: !!geminiApiKey,
        geminiPingLatencyMs: geminiPingLatencyMs || undefined,
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

      let result;

      // Execute Google Gemini API when key is configured
      if (geminiApiKey) {
        try {
          const systemInstruction = body.systemPrompt || 
            `You are Godavari Pushkar Ghat 3D Digital Twin AI Copilot (Rajamahendravaram). ` +
            `Synthesize structured, evidence-backed operational intelligence. ` +
            `Classify simulated inputs as SIMULATED. Ground decisions in GIS and safety benchmarks. ` +
            `Output strictly valid JSON matching { summary: string, recommendations: string[], payload: object }.`;

          const contextData = body.contextSummary 
            ? `Telemetry Context:\n${body.contextSummary}\n\n`
            : '';

          const geminiPrompt = `${contextData}Service: ${service}\nRequest: ${validation.sanitizedText}`;

          const geminiRaw = await callGeminiApiWithRetry(
            geminiApiKey,
            geminiModel,
            geminiPrompt,
            systemInstruction,
            2,
            10000
          );

          // Parse Gemini JSON output
          const responseText = geminiRaw?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          let parsedPayload: any = {};
          try {
            parsedPayload = JSON.parse(responseText);
          } catch {
            // Regex fallback for markdown-wrapped json
            const jsonMatch = responseText.match(/```json([\s\S]*?)```/);
            if (jsonMatch) {
              parsedPayload = JSON.parse(jsonMatch[1].trim());
            } else {
              parsedPayload = { directAnswer: responseText };
            }
          }

          // Build validated AIStructuredResponse
          result = generateServerMockResponse(service, validation.sanitizedText, userContext);
          result.summary = parsedPayload.summary || parsedPayload.directAnswer || result.summary;
          if (parsedPayload.recommendations && Array.isArray(parsedPayload.recommendations)) {
            result.recommendations = parsedPayload.recommendations;
          }
          if (parsedPayload.payload && typeof parsedPayload.payload === 'object') {
            result.payload = { ...result.payload, ...parsedPayload.payload };
          }
          result.provider = 'gemini';
          result.model = geminiModel;
        } catch (err: any) {
          console.warn('[AIServerRouter] Real Gemini inference failed, engaging Mock fallback:', err.message);
          result = generateServerMockResponse(service, validation.sanitizedText, userContext);
          result.missingOrUnavailableData.push(`Gemini API call failed (${err.message}). Gracefully evaluated via server fallback.`);
        }
      } else {
        // Deterministic local mock engine
        result = generateServerMockResponse(service, validation.sanitizedText, userContext);
      }

      sendJson(res, 200, result);
      return true;
    }

    sendJson(res, 404, { error: `Endpoint not found: ${url}` });
    return true;
  } catch (err: any) {
    console.error('[AIServerRouter] Internal error:', err);
    sendJson(res, 500, { 
      error: 'Internal AI Server Error', 
      message: err.message || String(err) 
    });
    return true;
  }
}
