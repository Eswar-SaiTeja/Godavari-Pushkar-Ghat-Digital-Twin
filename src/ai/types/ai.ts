/**
 * AI Intelligence Foundation - Type Definitions
 * Godavari Pushkar Ghat 3D Digital Twin & Intelligent Simulator
 */

export type AIProviderType = 'mock' | 'gemini' | 'openai' | 'server';

export type DataClassification = 
  | 'VERIFIED'             // Authoritative GIS, CWC gauge records, survey maps
  | 'ADMIN_CONFIGURED'     // Static thresholds, shift assignments configured by admin
  | 'SIMULATED'            // Real-time crowd engine, traffic engine, simulated incidents
  | 'AI_INFERRED';         // Predictive ML outputs, heuristic estimates, extrapolated trends

export interface DataReference {
  id: string;
  source: string;                     // e.g. 'Survey of India / OpenStreetMap', 'Cesium CWC Gauge', 'Crowd Engine'
  category: 'GIS' | 'HYDROLOGY' | 'CROWD' | 'TRAFFIC' | 'INCIDENT' | 'RESOURCE' | 'WEATHER';
  classification: DataClassification;
  timestamp: string;
  metric?: string;
  value?: string | number;
  confidence?: number;                // 0.0 to 1.0
  notes?: string;
}

export type OperationalActionType = 
  | 'DISPATCH'
  | 'EVACUATION_ROUTE_MOD'
  | 'PUBLIC_ALERT'
  | 'RESOURCE_REALLOCATION'
  | 'NONE';

export interface HumanApprovalRequirement {
  requiresApproval: boolean;
  actionType: OperationalActionType;
  actionTitle?: string;
  rationale?: string;
  proposedPayload?: any;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_REQUIRED';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  details?: string;
}

export interface AIQuotaState {
  quotaExhausted: boolean;
  circuitBreakerActive: boolean;
  retryDelaySeconds: number;
  retryAfterFormatted: string;
  resetTimestamp: string | null;
  quotaMetric?: string;
  quotaLimit?: number;
  model?: string;
  lastCheckedAt?: string;
  source?: string;
}

export interface AIConfidence {
  score: number;                      // 0.0 - 1.0
  level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  rationale: string;
  uncertainties: string[];
}

export interface AIStructuredResponse<T = any> {
  id: string;
  service: string;
  summary: string;
  payload: T;
  dataReferences: DataReference[];
  recommendations: string[];
  confidence: AIConfidence;
  timestamp: string;
  dataClassification: DataClassification;
  humanApproval: HumanApprovalRequirement;
  missingOrUnavailableData: string[];
  provider: string;
  model: string;
  latencyMs: number;
  isSimulatedMock?: boolean;
  quotaState?: AIQuotaState;
}

// User RBAC roles for AI Operations
export type UserRole = 'OPERATOR' | 'DISPATCHER' | 'COMMANDER' | 'ADMIN';

export interface UserContext {
  userId: string;
  name: string;
  role: UserRole;
  department?: string;
}

// Audit Log Entry
export interface AIAuditLogEntry {
  id: string;
  timestamp: string;
  user: UserContext;
  service: string;
  query: string;
  responseSummary: string;
  requiresHumanApproval: boolean;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_REQUIRED';
  dataClassifications: DataClassification[];
  provider: string;
  latencyMs: number;
  securityFlags?: string[];
}

// Connection Health
export interface AIProviderHealth {
  connected: boolean;
  activeProvider: AIProviderType;
  providerName: string;
  model: string;
  serverUrl?: string;
  latencyMs?: number;
  message: string;
  error?: string;
  rateLimitRemaining?: number;
  rateLimitResetSeconds?: number;
  hasSecretKeyConfigured?: boolean;
  quotaState?: AIQuotaState;
  isSimulatedMock?: boolean;
  availableFeatures: string[];
}

// Specific Service Request & Payload Types

// 1. Command Assistant
export interface CommandAssistantQuery {
  prompt: string;
  sessionHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  contextScope?: 'ALL' | 'CROWD' | 'TRAFFIC' | 'DISPATCH' | 'FLOOD' | 'GIS';
}

export interface CommandAssistantPayload {
  intent: string;
  directAnswer: string;
  suggestedFollowUps: string[];
  visualHighlights?: Array<{
    entityId: string;
    entityType: 'GHAT' | 'BRIDGE' | 'ZONE' | 'RESOURCE' | 'INCIDENT';
    colorHex: string;
    label: string;
  }>;
}

// 2. Crowd Prediction
export interface CrowdPredictionRequest {
  horizonMinutes: 15 | 30 | 60 | 120;
  targetGhatId?: string;
  simulatedTime?: string;
}

export interface GhatCrowdForecast {
  ghatId: string;
  ghatName: string;
  currentDensity: number;             // pax/m2
  projectedDensity: number;
  projectedCount: number;
  surgeProbability: number;           // 0.0 - 1.0
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  estimatedPeakTime: string;
}

export interface CrowdPredictionPayload {
  forecastHorizonMinutes: number;
  overallTrend: 'RISING' | 'STABLE' | 'EASING' | 'VOLATILE';
  totalProjectedDevotees: number;
  ghatForecasts: GhatCrowdForecast[];
  identifiedBottlenecks: string[];
}

// 3. Anomaly Detection
export interface AnomalyDetectionRequest {
  sensitivityThreshold?: 'NORMAL' | 'HIGH' | 'MAXIMUM';
  lookbackMinutes?: number;
}

export interface DetectedAnomaly {
  anomalyId: string;
  title: string;
  category: 'CROWD_SURGE' | 'FLOW_STALL' | 'UNUSUAL_DENSITY' | 'WATER_LEVEL_ANOMALY' | 'BOTTLENECK_LOCK';
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  location: string;
  detectedAt: string;
  observedValue: string;
  expectedBaseline: string;
  confidence: number;
  recommendedAction: string;
}

export interface AnomalyDetectionPayload {
  totalAnomaliesDetected: number;
  criticalCount: number;
  anomalies: DetectedAnomaly[];
  systemHealthScore: number;          // 0 - 100
}

// 4. Resource Recommendation
export interface ResourceRecommendationRequest {
  targetZoneId?: string;
  incidentId?: string;
  anticipatedSurge?: boolean;
}

export interface RecommendedResourceAllocation {
  zoneId: string;
  zoneName: string;
  currentResources: number;
  recommendedAdditions: Array<{
    category: 'POLICE' | 'MEDICAL' | 'AMBULANCE' | 'FIRE_RESCUE' | 'SDRF_BOATS' | 'VOLUNTEER';
    quantity: number;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    specificCapabilitiesRequired: string[];
    justification: string;
  }>;
  suggestedRelocationFromZone?: string;
}

export interface ResourceRecommendationPayload {
  overallDeficitSummary: string;
  allocations: RecommendedResourceAllocation[];
  proposedAssignments: Array<{
    resourceId: string;
    resourceName: string;
    fromZoneId: string;
    toZoneId: string;
    travelMinutesEstimate: number;
  }>;
}

// 5. Evacuation Optimization
export interface EvacuationOptimizationRequest {
  evacuationZoneId: string;
  evacuationType: 'PARTIAL' | 'FULL_GHAT' | 'CORRIDOR_CLEAR';
  blockedCorridors?: string[];
}

export interface EvacuationOptimizationPayload {
  affectedZoneId: string;
  estimatedDevoteesToClear: number;
  optimalExitRoutes: Array<{
    corridorId: string;
    corridorName: string;
    estimatedThroughputPaxPerMin: number;
    recommendedSharePercent: number;
    safestTravelDirection: string;
    chokePointWarning?: string;
  }>;
  estimatedClearanceMinutes: number;
  stagingAreaSuggestions: string[];
}

// 6. Flood Intelligence
export interface FloodIntelligenceRequest {
  upstreamDischargeCusecs?: number;
  currentRiverLevelMsl?: number;
  forecastHours?: number;
}

export interface FloodIntelligencePayload {
  cwcWaterLevelMsl: number;
  dangerLevelMsl: number;
  warningLevelMsl: number;
  submergenceRiskLevel: 'SAFE' | 'ALERT' | 'WARNING' | 'DANGER';
  inundationRisks: Array<{
    ghatId: string;
    ghatName: string;
    elevationMsl: number;
    distanceToWaterlineMeters: number;
    submergenceRisk: 'NONE' | 'LOW' | 'MEDIUM' | 'IMMINENT';
    estimatedHoursToSubmergence: number | null;
  }>;
  barrageDischargeStatus: string;
  upstreamRainfallStatus: string;
}

// 7. Report Generation
export interface ReportGenerationRequest {
  format: 'MARKDOWN' | 'JSON' | 'EXECUTIVE_SUMMARY';
  includeSections?: Array<'CROWD' | 'TRAFFIC' | 'INCIDENTS' | 'RESOURCES' | 'HYDROLOGY' | 'DISPATCH_METRICS'>;
}

export interface ReportGenerationPayload {
  reportId: string;
  title: string;
  generatedAt: string;
  content: string;
  executiveSummary: string;
  keyStatistics: Record<string, string | number>;
  activeIncidentsCount: number;
  totalCrowdSimulated: number;
  complianceNotes: string;
}

// 8. Public Announcement
export interface PublicAnnouncementRequest {
  eventType: 'CROWD_DIVERSION' | 'EVACUATION' | 'LOST_CHILD' | 'RIVER_SAFETY' | 'GENERAL_ADVISORY';
  targetLocation: string;
  language: 'TELUGU_AND_ENGLISH' | 'TELUGU' | 'ENGLISH';
  tone: 'CALM' | 'URGENT' | 'INFORMATIONAL';
}

export interface PublicAnnouncementPayload {
  announcementId: string;
  targetPAZones: string[];
  teluguScript: string;
  teluguPhonetic: string;
  englishScript: string;
  broadcastIntervalSeconds: number;
  priorityLevel: 'ROUTINE' | 'PRIORITY' | 'IMMEDIATE';
  audioReady: boolean;
}
