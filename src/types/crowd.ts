export type AgeGroup = 'CHILDREN' | 'YOUNG' | 'ADULTS' | 'SENIORS';

export type BehaviorState = 
  | 'WALKING'
  | 'RUNNING'
  | 'WAITING'
  | 'RESTING'
  | 'TURNING'
  | 'AVOIDING_OBSTACLE'
  | 'FOLLOWING_GROUP'
  | 'RESPONDING_TO_EMERGENCY'
  | 'REQUESTING_ASSISTANCE';

export type CrowdDensityLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type AgentDisplayFilter = 
  | 'ALL' 
  | 'CHILDREN' 
  | 'YOUNG' 
  | 'ADULTS' 
  | 'SENIORS' 
  | 'ASSISTANCE_REQUIRED';

export interface AgeGroupProfile {
  ageGroup: AgeGroup;
  label: string;
  ageRange: string;
  count: number; // population count
  baseSpeed: number; // m/s
  acceleration: number; // m/s^2
  directionChangeFreq: number; // probability per sec
  obstacleAvoidance: number; // 0.0 to 1.0
  reactionDelayRange: [number, number]; // [min, max] in seconds
  restingProbability: number; // probability per min
  groupBehavior: boolean;
  color: string;
  defaultProportion: number; // 0.0 to 1.0 (sums to 1.0)
}

export interface PedestrianAgent {
  id: string;
  ageGroup: AgeGroup;
  position: {
    longitude: number;
    latitude: number;
    height: number;
  };
  destination: {
    longitude: number;
    latitude: number;
  };
  speed: number; // current speed m/s
  targetSpeed: number;
  behaviorState: BehaviorState;
  groupId: string | null;
  reactionDelaySeconds: number;
  elapsedSinceAlert: number;
  hasRespondedToAlert: boolean;
  requiresAssistance: boolean;
  assignedExitId: string | null;
  pathIndex: number;
  currentPath: [number, number][]; // [[lon, lat], ...]
  isEvacuated: boolean;
  evacuationTimeSeconds: number | null;
}

export interface SimulationGate {
  id: string;
  name: string;
  type: 'ENTRY' | 'EXIT' | 'DUAL';
  coordinates: {
    longitude: number;
    latitude: number;
  };
  capacityPerHour: number; // SIMULATED
  currentFlowRatePerMin: number; // SIMULATED
  widthMeters: number;
  isOpen: boolean;
}

export interface CrowdMetrics {
  totalActivePedestrians: number;
  evacuatedPedestrians: number;
  byAgeGroup: Record<AgeGroup, number>;
  averageWalkingSpeed: number;
  averageReactionDelay: number;
  responsePercentage: number;
  assistanceRequiredCount: number;
  nonResponsiveCount: number;
  currentDensityLevel: CrowdDensityLevel;
  densityValue: number; // people per sq meter
  entryFlowRatePerMin: number; // SIMULATED
  exitFlowRatePerMin: number; // SIMULATED
  activeBottlenecks: { locationName: string; density: number; coordinates: [number, number] }[];
  evacuationCompleteTimeSeconds: number | null;
}
