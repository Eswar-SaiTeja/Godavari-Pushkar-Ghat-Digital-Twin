/**
 * AI Operations Reporting - Type Definitions
 * Godavari Pushkar Ghat 3D Digital Twin - Rajamahendravaram
 */

import { DataClassification } from './ai';

export type ReportPeriodKey = 
  | 'LAST_1_HOUR' 
  | 'LAST_4_HOURS' 
  | 'LAST_12_HOURS' 
  | 'DAILY_24_HOURS' 
  | 'FULL_SIMULATION' 
  | 'CUSTOM';

export type ReportCategory = 
  | 'DAILY_OPERATIONS'
  | 'CROWD_MANAGEMENT'
  | 'INCIDENT_SUMMARY'
  | 'DISPATCH_PERFORMANCE'
  | 'RESOURCE_UTILIZATION'
  | 'ZONE_WISE_STATUS'
  | 'EVACUATION_SCENARIO_COMPARISON'
  | 'ANOMALY_SUMMARY';

export type ReportApprovalStatus = 'DRAFT' | 'APPROVED' | 'ARCHIVED' | 'REJECTED';

export interface ReportExportRecord {
  format: 'PDF' | 'CSV' | 'JSON';
  exportedAt: string;
  exportedBy: string;
  filename: string;
}

export interface MetricEntry {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  changePct?: number;
  trend?: 'UP' | 'DOWN' | 'STABLE';
  classification: DataClassification;
}

export interface IncidentSummaryData {
  totalIncidents: number;
  activeCount: number;
  resolvedCount: number;
  criticalCount: number;
  avgResponseMinutes: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  recentIncidents: Array<{
    id: string;
    title: string;
    severity: string;
    zoneName: string;
    status: string;
    reportedAt: string;
    responseMinutes: number;
  }>;
}

export interface ResourceSummaryData {
  totalResources: number;
  deployedCount: number;
  availableCount: number;
  utilizationPercent: number;
  byCategory: Record<string, { total: number; deployed: number; available: number }>;
  criticalDeficits: string[];
}

export interface ZoneStatusData {
  zoneId: string;
  zoneName: string;
  currentPopulation: number;
  capacity: number;
  densityPaxPerM2: number;
  utilizationPct: number;
  densityClass: string;
  inflowRate: number;
  outflowRate: number;
  queueLength: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}

export interface EvacuationComparisonData {
  affectedZone: string;
  baselineClearanceMinutes: number;
  aiOptimizedClearanceMinutes: number;
  efficiencyGainPercent: number;
  primaryEvacuationCorridor: string;
  bottlenecksAvoided: string[];
}

export interface AnomalySummaryData {
  totalAnomalies: number;
  criticalCount: number;
  systemHealthScore: number;
  detectedAnomalies: Array<{
    id: string;
    title: string;
    category: string;
    severity: string;
    location: string;
    observedValue: string;
    expectedBaseline: string;
  }>;
}

export interface FloodSummaryData {
  cwcRiverLevelMsl: number;
  warningLevelMsl: number;
  dangerLevelMsl: number;
  barrageDischargeCusecs: number;
  riskStatus: string;
  inundationWarning: string;
}

export interface OperationsReport {
  reportId: string;
  category: ReportCategory;
  categoryTitle: string;
  reportingPeriod: {
    periodKey: ReportPeriodKey;
    periodLabel: string;
    startTime: string;
    endTime: string;
    durationHours: number;
  };
  dataSources: string[];
  dataClassification: DataClassification;
  generationTimestamp: string;
  approvalStatus: ReportApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
  reviewNotes?: string;
  keyMetrics: MetricEntry[];
  incidentSummary: IncidentSummaryData;
  resourceSummary: ResourceSummaryData;
  zoneStatus: ZoneStatusData[];
  evacuationComparison?: EvacuationComparisonData;
  anomalySummary?: AnomalySummaryData;
  floodSummary?: FloodSummaryData;
  identifiedIssues: string[];
  recommendations: string[];
  missingData: string[];
  executiveSummary: string;
  complianceNotes: string;
  exportHistory: ReportExportRecord[];
}
