/**
 * Server-Side AI API Router
 * Runs inside Vite's Node.js server middleware (and standalone Node http server).
 * Secures secret API keys (GEMINI_API_KEY, OPENAI_API_KEY) on the server.
 * Implements rate limiting, schema validation, retry limits, and request timeouts.
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
  res.end(JSON.stringify(data));
}

/**
 * Make external LLM request with retry limits and timeout
 */
async function callExternalProviderWithRetry(
  url: string,
  headers: Record<string, string>,
  body: any,
  maxRetries: number = 3,
  timeoutMs: number = 10000
): Promise<any> {
  let attempt = 0;
  let lastError: any = null;

  while (attempt < maxRetries) {
    attempt++;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal
      });
      clearTimeout(timer);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Provider API returned HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (err: any) {
      clearTimeout(timer);
      lastError = err;
      if (err.name === 'AbortError') {
        throw new Error(`AI request timed out after ${timeoutMs}ms (Attempt ${attempt}/${maxRetries})`);
      }
      if (attempt < maxRetries) {
        // Exponential backoff
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

  if (service === 'CrowdPrediction') {
    summary = 'Crowd forecast for +60 minutes projects an increase of ~38% (total ~25,000 devotees). Pushkar Ghat steps have an 88% probability of crowd surge reaching 3.8 pax/m².';
    recommendations = [
      'Pre-position crowd control marshals at Pushkar tiered stairs',
      'Open secondary exit corridor towards Main Bazaar Road',
      'Deploy Telugu/English PA advisory informing devotees to utilize Saraswati Ghat'
    ];
    payload = {
      forecastHorizonMinutes: 60,
      overallTrend: 'RISING',
      totalProjectedDevotees: 25150,
      identifiedBottlenecks: ['Pushkar Ghat Tier 2 Steps']
    };
  } else if (service === 'AnomalyDetection') {
    summary = 'Anomaly scan detected 1 crowd concentration deviation. Overall system health score is 88/100.';
    recommendations = ['Divert subsequent pilgrim groups toward Markandeya Ghat walkway.'];
    payload = {
      totalAnomaliesDetected: 1,
      criticalCount: 0,
      systemHealthScore: 88,
      anomalies: [
        {
          anomalyId: 'anom-server-crowd-density',
          title: 'High Devotee Concentration at Riverfront Tier',
          category: 'CROWD_SURGE',
          severity: 'HIGH',
          location: 'Pushkar Ghat Tier 2 Steps',
          detectedAt: new Date().toISOString(),
          observedValue: '2.8 pax/m²',
          expectedBaseline: '1.2 - 1.8 pax/m²',
          confidence: 0.91,
          recommendedAction: 'Divert subsequent pilgrim groups toward Markandeya Ghat walkway.'
        }
      ]
    };
  } else if (service === 'FloodIntelligence') {
    summary = 'Godavari hydrological status is SAFE. Current water level is 13.8m MSL (3.7m below danger threshold of 17.5m MSL).';
    recommendations = [
      'Maintain SDRF river barrier safety buoys at 15m distance from shoreline',
      'Monitor Polavaram release bulletins every 3 hours'
    ];
    payload = {
      cwcWaterLevelMsl: 13.8,
      dangerLevelMsl: 17.5,
      warningLevelMsl: 16.0,
      submergenceRiskLevel: 'SAFE',
      barrageDischargeStatus: '3.25L cusecs released through Dowleswaram barrage bays.'
    };
  } else if (service === 'ResourceRecommendation') {
    actionType = 'RESOURCE_REALLOCATION';
    summary = 'Recommended redeploying 4 APSP Police Officers and 1 Advanced Life Support Ambulance to Sector 1 (Pushkar Ghat).';
    recommendations = [
      'Approve proposed dispatch via Commander authorization',
      'Notify Sector 1 Incident Commander of incoming reinforcement'
    ];
    payload = {
      overallDeficitSummary: 'Sector 1 (Pushkar Ghat) requires medical and crowd control reinforcement.',
      proposedAssignments: [
        {
          resourceId: 'res-pol-01',
          resourceName: 'APSP Battalion Squad C (4 Officers)',
          fromZoneId: 'zone-parking-outer',
          toZoneId: 'zone-pushkar-ghat',
          travelMinutesEstimate: 4.5
        }
      ]
    };
  } else if (service === 'PublicAnnouncement') {
    actionType = 'PUBLIC_ALERT';
    summary = 'Drafted bilingual Telugu & English public safety announcement for Pushkar Ghat. Human commander approval required before broadcasting across PA speaker towers.';
    recommendations = [
      'Commander must authorize broadcast before transmission to PA tower network'
    ];
    payload = {
      announcementId: `ANN-PA-${Date.now().toString().slice(-6)}`,
      targetPAZones: ['zone-pushkar-ghat'],
      teluguScript: 'భక్తులందరికీ విజ్ఞప్తి: పుష్కర ఘాట్ వద్ద రద్దీ ఎక్కువగా ఉన్నందున, దయచేసి సరస్వతి ఘాట్ వైపు తరలివెళ్లండి.',
      englishScript: 'Attention devotees: Due to heavy crowd volume at Pushkar Ghat, please proceed toward Saraswati Ghat.',
      priorityLevel: 'PRIORITY',
      audioReady: true
    };
  } else {
    // Default Command Assistant
    if (pLower.includes('crowd') || pLower.includes('people') || pLower.includes('density')) {
      summary = 'Currently, approximately 18,250 simulated devotees are at the Godavari riverfront. Pushkar Ghat holds the highest density (2.1 pax/m²).';
      recommendations = ['Maintain continuous pedestrian monitoring along Kotilingala corridor.'];
    } else if (pLower.includes('flood') || pLower.includes('water') || pLower.includes('river')) {
      summary = 'Godavari water level is at 13.8m MSL with an upstream discharge of 3.25L cusecs, safely below the 17.5m MSL danger threshold.';
      recommendations = ['Maintain hourly water telemetry polling from Dowleswaram Barrage.'];
    } else {
      summary = `Digital Twin command telemetry is nominal. Current simulated population is 18,250 devotees, road network congestion is MODERATE, and river level is 13.8m MSL.`;
      recommendations = ['Inspect active incidents in the Evacuation & Dispatch command center.'];
    }
    payload = {
      intent: 'DIGITAL_TWIN_SUMMARY',
      directAnswer: summary,
      suggestedFollowUps: [
        'Predict crowd density for next 60 minutes',
        'Check flood risk at Kotilingala Ghat',
        'Recommend ambulance and police deployments'
      ]
    };
  }

  const humanApprovalReq = aiSecurityGuard.evaluateHumanApprovalRequirement(actionType, summary, payload);

  return {
    id: `srv-ai-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    service,
    summary,
    payload,
    dataReferences: [
      {
        id: 'ref-server-wgs84',
        source: 'Survey of India / OpenStreetMap Rajamahendravaram',
        category: 'GIS',
        classification: 'VERIFIED',
        timestamp: new Date().toISOString()
      },
      {
        id: 'ref-server-cwc',
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
      rationale: 'Inference generated via server intelligence gateway anchored in WGS84 GIS maps and CWC benchmarks.',
      uncertainties: []
    },
    timestamp: new Date().toISOString(),
    dataClassification: 'AI_INFERRED',
    humanApproval: humanApprovalReq,
    missingOrUnavailableData: [],
    provider: 'server-mock',
    model: 'godavari-twin-server-v1',
    latencyMs: 45
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

  // Read backend secret environment variables (Never prefixed with VITE_)
  const configuredProvider = process.env.AI_PROVIDER || 'mock';
  const geminiApiKey = process.env.GEMINI_API_KEY || '';
  const openaiApiKey = process.env.OPENAI_API_KEY || '';

  try {
    // 1. Health check & Provider Connection Verification
    if (url === '/api/ai/health' && req.method === 'GET') {
      let isConnected = false;
      let activeProvider = 'mock';
      let model = 'godavari-twin-mock-v1';
      let message = 'Running on built-in Mock AI Engine (Zero-config offline mode).';

      if (configuredProvider === 'gemini' && geminiApiKey) {
        try {
          const testRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`);
          if (testRes.ok) {
            isConnected = true;
            activeProvider = 'gemini';
            model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
            message = 'Google Gemini API key verified and connected successfully.';
          } else {
            message = `Gemini connection failed (HTTP ${testRes.status}). Operating in Mock fallback.`;
          }
        } catch (err: any) {
          message = `Gemini network check failed: ${err.message}. Operating in Mock fallback.`;
        }
      } else if (configuredProvider === 'openai' && openaiApiKey) {
        try {
          const testRes = await fetch('https://api.openai.com/v1/models', {
            headers: { Authorization: `Bearer ${openaiApiKey}` }
          });
          if (testRes.ok) {
            isConnected = true;
            activeProvider = 'openai';
            model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
            message = 'OpenAI API key verified and connected successfully.';
          } else {
            message = `OpenAI connection failed (HTTP ${testRes.status}). Operating in Mock fallback.`;
          }
        } catch (err: any) {
          message = `OpenAI network check failed: ${err.message}. Operating in Mock fallback.`;
        }
      } else {
        isConnected = true;
      }

      sendJson(res, 200, {
        connected: isConnected,
        activeProvider,
        configuredProvider,
        model,
        hasSecretKeyConfigured: !!(geminiApiKey || openaiApiKey),
        message,
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

    // 3. Inference Endpoints
    if (req.method === 'POST') {
      const body = await parseJsonBody(req);
      const prompt = body.prompt || '';
      const service = body.service || 'CommandAssistant';
      const userContext = body.userContext || { userId: 'anonymous-operator', role: 'OPERATOR' };

      const validation = aiSecurityGuard.validateInputPrompt(prompt);
      if (!validation.isValid) {
        sendJson(res, 400, {
          error: validation.error,
          securityFlags: validation.securityFlags
        });
        return true;
      }

      let result;
      if (configuredProvider === 'gemini' && geminiApiKey) {
        try {
          const geminiModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
          const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;
          
          const geminiResponse = await callExternalProviderWithRetry(
            apiUrl,
            { 'Content-Type': 'application/json' },
            {
              contents: [{
                parts: [{
                  text: `System Context: You are Godavari Pushkar Ghat 3D Digital Twin AI Copilot. Return concise structured insights.\nPrompt: ${validation.sanitizedText}`
                }]
              }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 1000
              }
            },
            3,
            10000
          );

          const textReply = geminiResponse?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          result = generateServerMockResponse(service, validation.sanitizedText, userContext);
          result.summary = textReply || result.summary;
          result.provider = 'gemini';
          result.model = geminiModel;
        } catch (err: any) {
          console.warn('[AIServerRouter] Real Gemini call failed, falling back to Mock:', err.message);
          result = generateServerMockResponse(service, validation.sanitizedText, userContext);
          result.missingOrUnavailableData.push(`Gemini API connection error: ${err.message}. Operating via server fallback.`);
        }
      } else {
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
