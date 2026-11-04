import { AgeGroup } from './crowd';

export type PredefinedScenarioId = 'SCENARIO_A' | 'SCENARIO_B' | 'SCENARIO_C';

export interface EvacuationGateConfig {
  id: string;
  name: string;
  coordinates: [number, number];
  widthMeters: number;
  capacityPerMinute: number;
  isOpen: boolean;
}

export interface ScenarioConfig {
  id: string;
  name: string;
  description: string;
  totalPopulation: number;
  ageDistribution: Record<AgeGroup, number>; // percentages summing to 100
  gates: EvacuationGateConfig[];
  routesCount: number;
  alertActivationTimeSeconds: number;
  assistanceRequiredPct: number;
  durationSeconds: number;
  randomSeed: number; // For fair, reproducible comparisons
  obstaclePositions?: [number, number][];
}

export interface ScenarioRunMetrics {
  scenarioId: string;
  scenarioName: string;
  totalPopulation: number;
  totalEvacuated: number;
  remainingPopulation: number;
  completionTimeSeconds: number;
  averageReactionTimeSeconds: number;
  responseRatePct: number;
  gateUtilization: Record<string, { name: string; throughput: number; utilizationPct: number }>;
  peakDensityDevoteesPerSqm: number;
  bottleneckDurationSeconds: number;
  averageWaitingTimeSeconds: number;
  evacuationTimeline: { timeSeconds: number; evacuatedCount: number; remainingCount: number; density: number }[];
  isCompleted: boolean;
}

export interface ScenarioComparisonResult {
  timestamp: string;
  baselineScenarioId: string;
  scenarios: Record<string, ScenarioRunMetrics>;
  summaryAnalysis: {
    fastestScenarioId: string;
    lowestBottleneckScenarioId: string;
    safestScenarioId: string;
    executiveSummary: string;
  };
}
