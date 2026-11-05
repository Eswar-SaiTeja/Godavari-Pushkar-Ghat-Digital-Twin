import { IncidentSeverity, IncidentType } from './emergency';

export type ResourceCategory = 
  | 'POLICE'
  | 'MEDICAL'
  | 'AMBULANCE'
  | 'FIRST_AID'
  | 'FIRE_RESCUE'
  | 'EMERGENCY_VEHICLE'
  | 'VOLUNTEER'
  | 'WATER_STATION'
  | 'PUBLIC_TOILET'
  | 'TEMPORARY_SHELTER';

export type ResourceStatus = 
  | 'AVAILABLE' 
  | 'DEPLOYED' 
  | 'BUSY' 
  | 'OFFLINE' 
  | 'NEEDS_REPLENISHMENT';

export type ZoneDensityClassification = 
  | 'LOW' 
  | 'MODERATE' 
  | 'HIGH' 
  | 'CRITICAL';

export type DispatchStatus = 
  | 'REPORTED' 
  | 'ACKNOWLEDGED' 
  | 'ASSIGNED' 
  | 'DISPATCHED' 
  | 'ON_SCENE' 
  | 'RESOLVED';

export type FacilityAvailability = 
  | 'OPERATIONAL' 
  | 'LIMITED' 
  | 'MAINTENANCE' 
  | 'CLOSED';

export interface EventResource {
  id: string;
  category: ResourceCategory;
  name: string;
  teluguName?: string;
  coordinates: {
    latitude: number;
    longitude: number;
    height?: number;
  };
  status: ResourceStatus;
  assignedZoneId: string;
  deploymentStatus: string;
  contactRef: string;
  personnelCount: number;
  equipment: string[];
  verificationStatus: 'VERIFIED' | 'APPROXIMATE' | 'SYNTHETIC_DEMO';
  dataSource: string;
  lastStatusUpdate: string;
}

export interface OperationalZone {
  id: string;
  name: string;
  teluguName?: string;
  polygon: [number, number][]; // [lon, lat] pairs in WGS84 EPSG:4326
  center: {
    latitude: number;
    longitude: number;
  };
  capacityAssumption: number; // Configurable pilgrim capacity limit
  currentSimulatedPopulation: number;
  inflowRate: number; // pilgrims/minute
  outflowRate: number; // pilgrims/minute
  densityClassification: ZoneDensityClassification;
  assignedResourceIds: string[];
  activeIncidentIds: string[];
  color: string;
  averageWaitingTimeMinutes: number;
  queueEstimationCount: number;
  isCongestionAlert: boolean;
}

export interface DispatchAssignment {
  id: string;
  incidentId: string;
  incidentTitle: string;
  incidentType: IncidentType;
  incidentSeverity: IncidentSeverity;
  incidentCoordinates: [number, number, number]; // [lon, lat, height]
  resourceId: string;
  resourceName: string;
  resourceCategory: ResourceCategory;
  status: DispatchStatus;
  assignedTimestamp: string;
  dispatchedTimestamp?: string;
  onSceneTimestamp?: string;
  resolvedTimestamp?: string;
  distanceMeters: number;
  estimatedArrivalMinutes: number;
  routeCoordinates?: [number, number][];
  notes: string;
}

export interface OperationsLogEvent {
  id: string;
  timestamp: string;
  simulationTime: string;
  category: 'INCIDENT' | 'DISPATCH' | 'RESOURCE' | 'ZONE' | 'FACILITY' | 'SYSTEM';
  title: string;
  description: string;
  relatedId?: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  isSimulated: boolean;
}

export interface PublicFacility {
  id: string;
  category: 'WATER' | 'TOILET' | 'REST_AREA' | 'INFO_CENTRE' | 'PARKING' | 'SHELTER';
  name: string;
  teluguName?: string;
  coordinates: {
    latitude: number;
    longitude: number;
    height?: number;
  };
  capacity: number;
  currentUsage: number;
  availability: FacilityAvailability;
  maintenanceStatus: string;
  assignedZoneId: string;
  lastInspection: string;
}

export interface OperationsCommandMetrics {
  totalSimulatedVisitors: number;
  currentCrowdPopulation: number;
  activeIncidentCount: number;
  availableEmergencyTeams: number;
  activeMedicalStations: number;
  ambulanceAvailability: {
    available: number;
    total: number;
    dispatched: number;
  };
  policeDeploymentStatus: {
    onDuty: number;
    patrolUnits: number;
    checkPosts: number;
  };
  criticalZoneCount: number;
  totalResources: number;
  resourceAvailabilityPct: number;
  averageResponseTimeMinutes: number;
  lastUpdated: string;
}
