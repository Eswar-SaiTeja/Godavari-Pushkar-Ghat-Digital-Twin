/**
 * Server Client AI Provider
 * Connects frontend React components to backend server-side AI endpoints (/api/ai/*).
 * Never exposes secret API keys to the browser.
 * Handles timeouts, network degradation, and graceful local mock fallback.
 */

import { AIProvider, GenerateOptions } from './aiProviderInterface';
import { AIStructuredResponse, AIProviderHealth, AIProviderType } from '../types/ai';
import { mockAIProvider } from './mockAIProvider';

export class ServerClientAIProvider implements AIProvider {
  public readonly id: AIProviderType = 'server';
  public readonly name = 'Godavari Twin Server-Side AI Gateway';
  public readonly modelName = 'server-routed-llm';
  private baseUrl: string;

  constructor(baseUrl?: string) {
    if (baseUrl !== undefined) {
      this.baseUrl = baseUrl.replace(/\/+$/, '');
    } else if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_BASE_URL) {
      this.baseUrl = String((import.meta as any).env.VITE_API_BASE_URL).replace(/\/+$/, '');
    } else {
      this.baseUrl = '';
    }
  }

  public async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/ai/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' }
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async testConnection(force: boolean = false): Promise<AIProviderHealth> {
    try {
      const url = `${this.baseUrl}/api/ai/health${force ? '?force=true' : ''}`;
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (force) headers['x-force-retry'] = 'true';

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        return {
          connected: data.connected,
          activeProvider: data.activeProvider,
          providerName: data.activeProvider === 'gemini' 
            ? `Google Gemini Generative AI (${data.model})` 
            : data.activeProvider === 'openai' 
            ? `OpenAI API (${data.model})` 
            : 'Godavari Twin Mock AI Engine (SIMULATED)',
          model: data.model,
          message: data.message,
          hasSecretKeyConfigured: data.hasSecretKeyConfigured,
          quotaState: data.quotaState,
          isSimulatedMock: data.isSimulatedMock,
          latencyMs: data.geminiPingLatencyMs,
          availableFeatures: [
            'Command Assistant (JARVIS)',
            'Multi-Horizon Crowd Forecast (15/30/60m)',
            'Bottleneck & Anomaly Detection',
            'MCDA Resource & Ambulance Dispatch',
            'A* Evacuation Route Optimization',
            'Godavari Hydrology & Flood Assessment',
            '8-Category Situation Reports (SITREP)',
            'Multilingual PA Public Announcements'
          ]
        };
      }
    } catch (err: any) {
      console.warn('[ServerClientAIProvider] Health check failed, falling back to local mock:', err.message);
    }

    // Gracefully fallback to mock provider health
    return mockAIProvider.testConnection();
  }

  /**
   * Explicit manual retry button handler: forces bypassing server circuit breaker
   */
  public async retryConnection(): Promise<AIProviderHealth> {
    return this.testConnection(true);
  }

  public async generateStructured<T>(
    service: string,
    prompt: string,
    systemPrompt: string,
    contextSummary: string,
    options?: GenerateOptions
  ): Promise<AIStructuredResponse<T>> {
    const timeoutMs = options?.timeoutMs || 25000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Determine target endpoint based on service
    let endpoint = '/api/ai/command';
    if (service === 'CrowdPrediction') endpoint = '/api/ai/predict-crowd';
    else if (service === 'AnomalyDetection') endpoint = '/api/ai/detect-anomalies';
    else if (service === 'EvacuationOptimization') endpoint = '/api/ai/evacuation-advice';
    else if (service === 'ResourceRecommendation') endpoint = '/api/ai/resource-allocation';
    else if (service === 'FloodIntelligence') endpoint = '/api/ai/flood-intelligence';
    else if (service === 'ReportGeneration') endpoint = '/api/ai/generate-report';
    else if (service === 'PublicAnnouncement') endpoint = '/api/ai/generate-announcement';

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          service,
          prompt,
          systemPrompt,
          contextSummary,
          userContext: options?.userContext
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with HTTP ${response.status}`);
      }

      return await response.json();
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn(`[ServerClientAIProvider] Request to ${endpoint} failed (${err.message}). Falling back to local Mock Provider.`);

      // Seamless fallback to deterministic local mock provider
      const fallback = await mockAIProvider.generateStructured<T>(
        service,
        prompt,
        systemPrompt,
        contextSummary,
        options
      );

      fallback.missingOrUnavailableData.push(`Server gateway unavailable (${err.message}). Evaluated via embedded mock engine.`);
      return fallback;
    }
  }

  /**
   * Submit human commander decision for pending operational action
   */
  public async submitHumanDecision(auditId: string, reviewer: any, decision: 'APPROVED' | 'REJECTED', notes?: string) {
    const response = await fetch(`${this.baseUrl}/api/ai/approve-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auditId, reviewer, decision, notes })
    });
    return response.json();
  }
}

export const serverClientAIProvider = new ServerClientAIProvider();
