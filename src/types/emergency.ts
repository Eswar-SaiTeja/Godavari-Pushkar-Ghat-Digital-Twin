export type IncidentType = 
  | 'CROWD_CRUSH' 
  | 'GATE_CONGESTION' 
  | 'ROUTE_BLOCKED' 
  | 'FIRE_HAZARD' 
  | 'FLOOD_SURGE' 
  | 'VEHICLE_OBSTRUCTION' 
  | 'STEP_BOTTLENECK';

export type IncidentSeverity = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type IncidentStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface EmergencyIncident {
  id: string;
  type: IncidentType;
  title: string;
  severity: IncidentSeverity;
  coordinates: [number, number, number]; // [lon, lat, height]
  timestamp: string;
  affectedPopulation: number;
  status: IncidentStatus;
  description: string;
  blockedEdge?: { fromNodeId: string; toNodeId: string };
  affectedGateId?: string;
}

export type EvacuationRouteType = 
  | 'PRIMARY' 
  | 'ALTERNATE' 
  | 'BLOCKED' 
  | 'EMERGENCY_CORRIDOR';

export interface EvacuationRoute {
  id: string;
  name: string;
  type: EvacuationRouteType;
  path: [number, number][]; // [[lon, lat], ...]
  distanceMeters: number;
  capacityPerMinute: number;
  currentCongestionFactor: number;
  isBlocked: boolean;
  assignedExitId: string;
}

export interface EmergencyCommandMetrics {
  activeIncidentCount: number;
  currentCrowdPopulation: number;
  totalEvacuatedCount: number;
  evacuationCompletionPct: number;
  remainingPopulation: number;
  assistanceRequiredCount: number;
  averageReactionDelaySeconds: number;
  averageEvacuationTimeSeconds: number;
  exitGateUtilization: Record<string, { name: string; throughput: number; utilizationPct: number; isOpen: boolean }>;
  maxCrowdDensity: number;
  activeBottlenecksCount: number;
  emergencyVehiclePriorityActive: boolean;
  isEmergencyActive: boolean;
  elapsedEvacuationSeconds: number;
}
