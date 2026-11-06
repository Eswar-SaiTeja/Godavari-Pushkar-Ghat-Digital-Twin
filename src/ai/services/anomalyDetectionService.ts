/**
 * Anomaly Detection AI Service
 * Scans real-time digital twin streams for crowd surges, flow stalling, and gridlock.
 */

import { providerManager } from '../providers/providerManager';
import { digitalTwinContextBridge } from '../core/digitalTwinContextBridge';
import { SYSTEM_PROMPTS } from '../prompts/systemPrompts';
import { 
  AnomalyDetectionRequest, 
  AnomalyDetectionPayload, 
  AIStructuredResponse 
} from '../types/ai';

export class AnomalyDetectionService {
  public async scanAnomalies(
    request?: AnomalyDetectionRequest,
    userContext?: { userId: string; role: string }
  ): Promise<AIStructuredResponse<AnomalyDetectionPayload>> {
    const provider = providerManager.getProvider();
    const contextSummary = digitalTwinContextBridge.getContextSummaryForPrompt();
    const prompt = `Perform complete spatial and operational anomaly scan across Godavari riverfront sectors. Sensitivity: ${request?.sensitivityThreshold || 'NORMAL'}.`;

    return provider.generateStructured<AnomalyDetectionPayload>(
      'AnomalyDetection',
      prompt,
      SYSTEM_PROMPTS.ANOMALY_DETECTION,
      contextSummary,
      { userContext }
    );
  }
}

export const anomalyDetectionService = new AnomalyDetectionService();
