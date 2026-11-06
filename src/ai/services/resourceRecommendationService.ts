/**
 * Resource Recommendation AI Service
 * Analyzes active sector incidents and generates optimal resource allocations and 108 ambulance relocations.
 * Strictly mandates Human Authorization.
 */

import { providerManager } from '../providers/providerManager';
import { digitalTwinContextBridge } from '../core/digitalTwinContextBridge';
import { SYSTEM_PROMPTS } from '../prompts/systemPrompts';
import { 
  ResourceRecommendationRequest, 
  ResourceRecommendationPayload, 
  AIStructuredResponse 
} from '../types/ai';

export class ResourceRecommendationService {
  public async recommendResources(
    request?: ResourceRecommendationRequest,
    userContext?: { userId: string; role: string }
  ): Promise<AIStructuredResponse<ResourceRecommendationPayload>> {
    const provider = providerManager.getProvider();
    const contextSummary = digitalTwinContextBridge.getContextSummaryForPrompt();
    const prompt = `Evaluate resource adequacy and recommend optimal redeployments for ${request?.targetZoneId || 'all active sectors'}. ${request?.incidentId ? `Prioritize containment of incident ${request.incidentId}.` : ''}`;

    return provider.generateStructured<ResourceRecommendationPayload>(
      'ResourceRecommendation',
      prompt,
      SYSTEM_PROMPTS.RESOURCE_RECOMMENDATION,
      contextSummary,
      { userContext }
    );
  }
}

export const resourceRecommendationService = new ResourceRecommendationService();
