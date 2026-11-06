/**
 * Digital Twin AI Agent Orchestrator
 * Coordinates multi-step reasoning across predictive, anomaly, and resource engines.
 */

import { crowdPredictionService } from '../services/crowdPredictionService';
import { anomalyDetectionService } from '../services/anomalyDetectionService';
import { floodIntelligenceService } from '../services/floodIntelligenceService';
import { resourceRecommendationService } from '../services/resourceRecommendationService';

export interface ComprehensiveAssessment {
  timestamp: string;
  executiveSummary: string;
  crowdForecast: any;
  anomaliesDetected: any;
  floodRisk: any;
  recommendedResources: any;
  pendingHumanApprovalsCount: number;
  overallSafetyPosture: 'OPTIMAL' | 'ELEVATED' | 'HIGH_ALERT' | 'CRITICAL';
}

export class DigitalTwinAIAgent {
  /**
   * Run a comprehensive multi-service digital twin operational assessment
   */
  public async runComprehensiveAssessment(userContext?: { userId: string; role: string }): Promise<ComprehensiveAssessment> {
    const [crowdRes, anomalyRes, floodRes, resourceRes] = await Promise.all([
      crowdPredictionService.predictCrowd({ horizonMinutes: 60 }, userContext),
      anomalyDetectionService.scanAnomalies({ sensitivityThreshold: 'NORMAL' }, userContext),
      floodIntelligenceService.analyzeFloodRisk({}, userContext),
      resourceRecommendationService.recommendResources({}, userContext),
    ]);

    let posture: 'OPTIMAL' | 'ELEVATED' | 'HIGH_ALERT' | 'CRITICAL' = 'OPTIMAL';
    if (anomalyRes.payload.criticalCount > 0 || crowdRes.payload.overallTrend === 'VOLATILE') {
      posture = 'HIGH_ALERT';
    } else if (anomalyRes.payload.totalAnomaliesDetected > 0 || crowdRes.payload.overallTrend === 'RISING') {
      posture = 'ELEVATED';
    }

    let pendingApprovals = 0;
    if (resourceRes.humanApproval.requiresApproval) pendingApprovals++;

    const summary = `Comprehensive assessment evaluated: Devotee trend is ${crowdRes.payload.overallTrend} (+${crowdRes.payload.totalProjectedDevotees.toLocaleString()} expected). ${anomalyRes.payload.totalAnomaliesDetected} anomaly(s) scanned. Godavari flood risk is ${floodRes.payload.submergenceRiskLevel}. ${pendingApprovals} action(s) awaiting Commander authorization.`;

    return {
      timestamp: new Date().toISOString(),
      executiveSummary: summary,
      crowdForecast: crowdRes.payload,
      anomaliesDetected: anomalyRes.payload,
      floodRisk: floodRes.payload,
      recommendedResources: resourceRes.payload,
      pendingHumanApprovalsCount: pendingApprovals,
      overallSafetyPosture: posture
    };
  }
}

export const digitalTwinAIAgent = new DigitalTwinAIAgent();
