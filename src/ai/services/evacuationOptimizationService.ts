/**
 * Evacuation Optimization AI Service
 * Dynamically computes optimal egress paths, exit throughput shares, and clearance timelines.
 * Strictly mandates Human Authorization.
 */

import { providerManager } from '../providers/providerManager';
import { digitalTwinContextBridge } from '../core/digitalTwinContextBridge';
import { SYSTEM_PROMPTS } from '../prompts/systemPrompts';
import { 
  EvacuationOptimizationRequest, 
  EvacuationOptimizationPayload, 
  AIStructuredResponse 
} from '../types/ai';

export class EvacuationOptimizationService {
  public async optimizeEvacuation(
    request: EvacuationOptimizationRequest,
    userContext?: { userId: string; role: string }
  ): Promise<AIStructuredResponse<EvacuationOptimizationPayload>> {
    const provider = providerManager.getProvider();
    const contextSummary = digitalTwinContextBridge.getContextSummaryForPrompt();
    const prompt = `Calculate optimal evacuation dispersion routes for zone ${request.evacuationZoneId}. Evacuation Type: ${request.evacuationType}. ${request.blockedCorridors?.length ? `Blocked corridors to avoid: ${request.blockedCorridors.join(', ')}.` : ''}`;

    return provider.generateStructured<EvacuationOptimizationPayload>(
      'EvacuationOptimization',
      prompt,
      SYSTEM_PROMPTS.EVACUATION_OPTIMIZATION,
      contextSummary,
      { userContext }
    );
  }
}

export const evacuationOptimizationService = new EvacuationOptimizationService();
