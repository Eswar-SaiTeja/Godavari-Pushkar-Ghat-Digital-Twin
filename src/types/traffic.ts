export type VehicleType = 
  | 'CAR' 
  | 'BUS' 
  | 'EMERGENCY_AMBULANCE' 
  | 'EMERGENCY_POLICE' 
  | 'TWO_WHEELER';

export type CongestionLevel = 'FREE_FLOW' | 'MODERATE' | 'HEAVY' | 'BLOCKED';

export interface VehicleAgent {
  id: string;
  type: VehicleType;
  position: {
    longitude: number;
    latitude: number;
    height: number;
  };
  heading: number; // degrees
  speed: number; // km/h
  targetSpeed: number;
  isEmergency: boolean;
  sirenActive: boolean;
  currentRoadId: string;
  currentSegmentIndex: number;
  path: [number, number][]; // road polyline coords
  progressPct: number; // 0 to 1 on current segment
  hasArrived: boolean;
}

export interface RoadSegment {
  id: string;
  name: string;
  speedLimitKmph: number;
  lengthMeters: number;
  capacityVehicles: number;
  currentVehicleCount: number;
  congestionLevel: CongestionLevel;
  coordinates: [number, number][]; // [[lon, lat], ...]
  isBridge: boolean;
}

export interface TrafficMetrics {
  totalActiveVehicles: number;
  byType: Record<VehicleType, number>;
  averageSpeedKmph: number;
  congestedSegmentsCount: number;
  emergencyVehiclesActive: number;
  overallCongestionLevel: CongestionLevel;
  bridgeTrafficVolume: number;
}
