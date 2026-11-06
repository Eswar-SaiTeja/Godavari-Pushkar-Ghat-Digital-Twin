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

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
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

  public async testConnection(): Promise<AIProviderHealth> {
    try {
      const res = await fetch(`${this.baseUrl}/api/ai/health`);
      if (res.ok) {
        const data = await res.json();
        return {
          connected: data.connected,
          activeProvider: data.activeProvider,
          providerName: data.activeProvider === 'gemini' 
            ? 'Google Gemini Generative AI (Server-Verified)' 
            : data.activeProvider === 'openai' 
            ? 'OpenAI API (Server-Verified)' 
            : 'Godavari Twin Mock AI Engine (Active)',
          model: data.model,
          message: data.message,
          availableFeatures: [
            'Command Assistant',
            'Crowd Surge Prediction',
            'Flow Stalling & Bottleneck Detection',
            'Resource & Ambulance Dispatch Matching',
            'Evacuation Egress Optimization',
            'Godavari Flood Risk Intelligence',
            'Executive Situation Reports',
            'Bilingual PA Broadcast Scripts'
          ]
        };
      }
    } catch (err: any) {
      console.warn('[ServerClientAIProvider] Health check failed, falling back to local mock:', err.message);
    }

    // Gracefully fallback to mock provider health
    return mockAIProvider.testConnection();
  }

  public async generateStructured<T>(
    service: string,
    prompt: string,
    systemPrompt: string,
    contextSummary: string,
    options?: GenerateOptions
  ): Promise<AIStructuredResponse<T>> {
    const timeoutMs = options?.timeoutMs || 10000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/api/ai/command`, {
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
      console.warn(`[ServerClientAIProvider] Request to /api/ai/command failed (${err.message}). Falling back to local Mock Provider.`);

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
