export type SimulationMode = 
  | 'LIVE_OVERVIEW' 
  | 'PUSHKARAM_PEAK' 
  | 'MONSOON_FLOOD' 
  | 'EMERGENCY_EVAC' 
  | 'VIP_MOVEMENT';

export type SidebarModuleId = 
  | 'overview' 
  | 'terrain_3d' 
  | 'crowd_sim' 
  | 'traffic_sim' 
  | 'flood_sim' 
  | 'evacuation_sim' 
  | 'event_ops'
  | 'boat_movement' 
  | 'live_monitoring' 
  | 'data_management' 
  | 'settings';

export interface ModuleDefinition {
  id: SidebarModuleId;
  label: string;
  shortDesc: string;
  iconName: string;
  status: 'ACTIVE_DAY1' | 'SIMULATED_PREVIEW' | 'COMING_SOON';
  badgeLabel?: string;
  details?: {
    overview: string;
    plannedPhase: string;
    keyMetrics: { label: string; value: string; unit?: string }[];
  };
}

export interface SimulationTelemetry {
  currentTime: string;
  playbackSpeed: number;
  isPlaying: boolean;
  activeScenario: SimulationMode;
  simulatedCrowdTotal: number;
  simulatedWaterLevelMeters: number; // MSL DEMO
  simulatedFlowRateCusecs: number; // DEMO
  weatherCondition: {
    tempC: number;
    humidityPct: number;
    windKmph: number;
    windDirection: string;
  };
  demStatus: {
    resolution: string;
    provider: string;
    hasActiveTerrain: boolean;
    demSourceLabel: string;
    elevationRange: string;
  };
  systemStatus: {
    engine: string;
    fps: number;
    gpuVendor?: string;
    networkPingMs: number;
    dataIntegrity: 'STABLE (DEMO)' | 'ACTIVE' | 'CALIBRATING';
  };
}

export interface BookmarkView {
  id: string;
  name: string;
  description: string;
  category: 'ghat' | 'overview' | 'bridge' | 'evacuation';
  camera: {
    longitude: number;
    latitude: number;
    height: number;
    heading: number;
    pitch: number;
    roll: number;
  };
}
