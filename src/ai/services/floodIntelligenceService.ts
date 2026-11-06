/**
 * Flood Intelligence AI Service
 * Analyzes Godavari water level against CWC benchmark heights, barrage outflows, and inundation risks.
 */

import { providerManager } from '../providers/providerManager';
import { digitalTwinContextBridge } from '../core/digitalTwinContextBridge';
import { SYSTEM_PROMPTS } from '../prompts/systemPrompts';
import { 
  FloodIntelligenceRequest, 
  FloodIntelligencePayload, 
  AIStructuredResponse 
} from '../types/ai';

export class FloodIntelligenceService {
  public async analyzeFloodRisk(
    request?: FloodIntelligenceRequest,
    userContext?: { userId: string; role: string }
  ): Promise<AIStructuredResponse<FloodIntelligencePayload>> {
    const provider = providerManager.getProvider();
    const contextSummary = digitalTwinContextBridge.getContextSummaryForPrompt();
    const prompt = `Evaluate Godavari river flood and submergence risk for Rajamahendravaram ghats. Upstream discharge: ${request?.upstreamDischargeCusecs || 'standard'} cusecs. Current MSL: ${request?.currentRiverLevelMsl || 'gauge reading'} m.`;

    return provider.generateStructured<FloodIntelligencePayload>(
      'FloodIntelligence',
      prompt,
      SYSTEM_PROMPTS.FLOOD_INTELLIGENCE,
      contextSummary,
      { userContext }
    );
  }
}

export const floodIntelligenceService = new FloodIntelligenceService();
