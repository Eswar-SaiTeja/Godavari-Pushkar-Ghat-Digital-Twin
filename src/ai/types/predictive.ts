/**
 * AI Predictive Intelligence Engine - Type Definitions
 * Godavari Pushkar Ghat 3D Digital Twin – Rajamahendravaram
 */

import { DataClassification, HumanApprovalRequirement } from '../types/ai';

// ==========================================
// MODULE 1: CROWD PREDICTION TYPES
// ==========================================

export type ForecastHorizonMinutes = 15 | 30 | 60;

export interface PredictionUncertaintyRange {
  lowerBound: number;       // e.g. 5th percentile / -1.96 standard errors
  medianForecast: number;   // Expected statistical forecast
  upperBound: number;       // e.g. 95th percentile / +1.96 standard errors
  confidenceLevel: number;  // 0.90 or 0.95
}

export interface SurgeAlert {
  isSurgeDetected: boolean;
  surgeProbability: number; // 0.0 to 1.0
  severity: 'NORMAL' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  projectedRateOfChange: number; // % increase over baseline
  surgeTriggerTimeMinutes: number; // In how many minutes surge will peak
  rationale: string;
}

export interface ZoneCrowdForecast {
  zoneId: string;
  zoneName: string;
  currentObservedPopulation: number;
  currentDensityPaxPerSqM: number;
  forecastHorizonMinutes: ForecastHorizonMinutes;
  projectedPopulation: number;
  projectedDensityPaxPerSqM: number;
  uncertaintyRange: PredictionUncertaintyRange;
  surgeAlert: SurgeAlert;
  inflowRatePaxPerMin: number;
  outflowRatePaxPerMin: number;
  netFlowPaxPerMin: number;
  historicalBaselineMean: number;
  evaluationMape?: number;
}

export interface CrowdPredictionForecastReport {
  forecastId: string;
  timestamp: string;
  forecastHorizonMinutes: ForecastHorizonMinutes;
  methodology: 'STATISTICAL_WEIGHTED_MOVING_AVERAGE' | 'EXPONENTIAL_SMOOTHING' | 'HOLT_WINTERS';
  dataClassification: DataClassification;
  totalSimulatedDevoteesNow: number;
  totalProjectedDevotees: number;
  projectedGrowthPercent: number;
  zoneForecasts: ZoneCrowdForecast[];
  highRiskZones: string[];
  operationalAdvisories: string[];
  disclaimer: string;
}

// ==========================================
// MODULE 2: ANOMALY DETECTION TYPES
// ==========================================

export type AnomalyCategory = 
  | 'CROWD_DENSITY_SPIKE'
  | 'FLOW_IMBALANCE'
  | 'QUEUE_SURGE'
  | 'POPULATION_JUMP'
  | 'INCIDENT_FREQUENCY'
  | 'RESOURCE_SHORTAGE'
  | 'DISPATCH_WORKLOAD';

export type AnomalySeverity = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface SupportingMeasurement {
  metricName: string;
  observedValue: number | string;
  expectedBaseline: number | string;
  unit: string;
  zScoreOrDeviation: number;
  thresholdExceeded: number | string;
}

export interface StructuredAnomaly {
  anomalyId: string;
  detectedAt: string;
  affectedZoneId: string;
  affectedZoneName: string;
  coordinates: [number, number];
  category: AnomalyCategory;
  severity: AnomalySeverity;
  title: string;
  description: string;
  confidence: number;
  supportingMeasurements: SupportingMeasurement[];
  recommendedInvestigation: string;
  dataClassification: DataClassification;
  detectionAlgorithm: string;
}

export interface AnomalyScanReport {
  scanId: string;
  timestamp: string;
  totalAnomaliesDetected: number;
  criticalCount: number;
  highCount: number;
  moderateCount: number;
  lowCount: number;
  systemHealthScore: number; // 0 to 100
  anomalies: StructuredAnomaly[];
  detectionMethod: string;
  cctvIntegrationStatus: 'NO_CCTV_CONNECTED_SIMULATION_ONLY';
}

// ==========================================
// MODULE 3: RESOURCE ALLOCATION TYPES
// ==========================================

export interface MCDAScoreBreakdown {
  incidentPriorityScore: number;    // Weight: 0.25
  categoryMatchScore: number;       // Weight: 0.25
  availabilityScore: number;        // Weight: 0.15
  workloadScore: number;            // Weight: 0.10
  distanceTravelTimeScore: number;  // Weight: 0.15
  zoneDeficitScore: number;         // Weight: 0.10
  totalCompositeScore: number;      // 0 to 100
}

export interface ResourceCandidateRecommendation {
  resourceId: string;
  resourceName: string;
  category: string;
  currentZoneId: string;
  currentZoneName: string;
  targetIncidentId: string;
  targetZoneId: string;
  distanceMeters: number;
  estimatedTravelTimeMinutes: number;
  suitabilityScore: number; // 0 to 100
  mcdaBreakdown: MCDAScoreBreakdown;
  recommendationRank: number;
  heuristicJustification: string;
}

export interface ResourceAllocationPlan {
  planId: string;
  timestamp: string;
  totalRecommendations: number;
  recommendations: ResourceCandidateRecommendation[];
  humanApprovalRequirement: HumanApprovalRequirement;
  dataClassification: DataClassification;
  summary: string;
}

// ==========================================
// MODULE 4: EVACUATION OPTIMIZER TYPES
// ==========================================

export interface AgeGroupEgressPerformance {
  cohort: 'CHILDREN' | 'YOUNG' | 'ADULTS' | 'SENIORS';
  assumedSpeedMps: number;
  populationInZone: number;
  assistanceRequiredCount: number;
  estimatedClearanceMinutes: number;
}

export interface EvacuationRouteOption {
  routeId: string;
  routeName: string;
  pathCoordinates: [number, number][];
  totalDistanceMeters: number;
  nominalCapacityPaxPerMin: number;
  currentCongestionFactor: number;
  isBlocked: boolean;
  estimatedClearanceMinutes: number;
  ageCohortClearanceTimes: Record<string, number>;
  primaryExitPoint: string;
}

export interface EvacuationOptimizationComparison {
  comparisonId: string;
  timestamp: string;
  affectedZoneId: string;
  affectedZoneName: string;
  baselineScenario: {
    name: string;
    totalClearanceMinutes: number;
    bottleneckCount: number;
    activeCorridorNames: string[];
    riskScore: number;
  };
  aiOptimizedScenario: {
    name: string;
    totalClearanceMinutes: number;
    bottleneckCount: number;
    activeCorridorNames: string[];
    efficiencyImprovementPercent: number;
    riskScore: number;
    recommendedDiversions: string[];
  };
  ageGroupCohorts?: AgeGroupEgressPerformance[];
  alternativeExitConfigurations: Array<{
    configurationName: string;
    description: string;
    estimatedClearanceMinutes: number;
    capacityGainPaxPerMin: number;
  }>;
  validationMethod: 'A_STAR_GRAPH_VALIDATED';
  humanApprovalRequirement: HumanApprovalRequirement;
}

// ==========================================
// MODULE 5: FLOOD INTELLIGENCE TYPES
// ==========================================

export type FloodRiskLevel = 'SAFE' | 'ADVISORY' | 'WARNING' | 'DANGER' | 'EXTREME_DANGER';

export interface HistoricalFloodBenchmark {
  year: number;
  floodEventName: string;
  peakGaugeMsl: number;
  peakDischargeCusecs: number;
  inundatedAreaDescription: string;
}

export interface GhatStepExposureProfile {
  ghatId: string;
  ghatName: string;
  stepName: string;
  crestElevationMsl: number;
  currentFreeboardMeters: number; // Distance between water and step crest
  isSubmerged: boolean;
  submergenceThresholdMsl: number;
  exposureStatus: 'DRY_AND_SAFE' | 'NEAR_CREST_MONITORING' | 'SUBMERGED_CLOSED';
}

export interface FloodScenarioProfile {
  scenarioId: string;
  name: string;
  simulatedWaterLevelMsl: number;
  waterLevelDeltaMeters: number;
  simulatedDischargeCusecs: number;
  simulatedRainfallMm24h: number;
  riskLevel: FloodRiskLevel;
  submergedStepsCount: number;
  inundatedGhatNames: string[];
  recommendedOperations: string[];
}

export interface FloodIntelligenceAssessment {
  assessmentId: string;
  timestamp: string;
  currentWaterLevelMsl: number;
  cwcRiverGaugeMsl?: number;
  cwcWarningLevelMsl: number;
  cwcDangerLevelMsl: number;
  cwcExtremeDangerLevelMsl: number;
  upstreamDischargeCusecs: number;
  rainfallPast24hMm: number;
  waterLevelTrendCmPerHour: number;
  trendDirection: 'RISING' | 'STEADY' | 'RECEDING';
  overallRiskLevel: FloodRiskLevel;
  stepExposureProfiles: GhatStepExposureProfile[];
  historicalBenchmarks: HistoricalFloodBenchmark[];
  simulatedScenarios: FloodScenarioProfile[];
  dataConnectionStatus: 'DEMONSTRATION_MODE_EXTERNAL_FEEDS_UNCONNECTED';
  dataClassification?: string;
  externalFeedsConnected?: boolean;
  confidenceIntervalPercent?: number;
  regulatoryDisclaimer: string;
}

// ==========================================
// MODULE 7: PREDICTIVE EVALUATION AUDIT TYPES
// ==========================================

export interface PredictionEvaluationRecord {
  recordId: string;
  serviceName: 'CROWD_PREDICTION' | 'ANOMALY_DETECTION' | 'RESOURCE_ALLOCATION' | 'EVACUATION_OPTIMIZER' | 'FLOOD_INTELLIGENCE';
  timestamp: string;
  inputDatasetSignature: string;
  forecastHorizonMinutes: number;
  predictedMetricName: string;
  predictedValue: number;
  actualObservedValue: number | null;
  absoluteError: number | null;
  percentageErrorMape: number | null;
  evaluationMethod: string;
  dataQualityLimitations: string[];
  isSyntheticTestDataset: boolean;
}
