/**
 * Crowd Prediction AI Service
 * Forecasts crowd surges, density thresholds, and bottleneck probabilities 15-120m ahead.
 */

import { providerManager } from '../providers/providerManager';
import { digitalTwinContextBridge } from '../core/digitalTwinContextBridge';
import { SYSTEM_PROMPTS } from '../prompts/systemPrompts';
import { 
  CrowdPredictionRequest, 
  CrowdPredictionPayload, 
  AIStructuredResponse 
} from '../types/ai';

export class CrowdPredictionService {
  public async predictCrowd(
    request: CrowdPredictionRequest,
    userContext?: { userId: string; role: string }
  ): Promise<AIStructuredResponse<CrowdPredictionPayload>> {
    const provider = providerManager.getProvider();
    const contextSummary = digitalTwinContextBridge.getContextSummaryForPrompt();
    const prompt = `Forecast crowd density and bottleneck probability for horizon: ${request.horizonMinutes} minutes across Godavari ghats. ${request.targetGhatId ? `Focus specifically on ${request.targetGhatId}.` : 'Evaluate all 4 ghat sectors.'}`;

    return provider.generateStructured<CrowdPredictionPayload>(
      'CrowdPrediction',
      prompt,
      SYSTEM_PROMPTS.CROWD_PREDICTION,
      contextSummary,
      { userContext }
    );
  }
}

export const crowdPredictionService = new CrowdPredictionService();
