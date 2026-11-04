export type LocationCategory = 
  | 'ghat' 
  | 'bridge' 
  | 'emergency' 
  | 'command' 
  | 'temple' 
  | 'transit';

export interface GhatLocation {
  id: string;
  name: string;
  teluguName?: string;
  category: LocationCategory;
  coordinates: {
    longitude: number;
    latitude: number;
    height: number;
  };
  cameraView: {
    destination: {
      longitude: number;
      latitude: number;
      height: number;
    };
    orientation: {
      heading: number; // in degrees
      pitch: number;   // in degrees
      roll: number;
    };
  };
  description: string;
  historicalSignificance: string;
  pushkaramCapacity: {
    peakCapacityHourly: number; // DEMO
    currentSimulatedOccupancy: number; // SIMULATED
    safetyThresholdPct: number;
  };
  riverfrontLengthMeters: number;
  elevationMsl: number; // DEMO meters above mean sea level
  facilities: string[];
  status: 'OPTIMAL' | 'MODERATE' | 'CONGESTED' | 'RESTRICTED';
  isSimulatedData: true;
}

export interface BridgeFeature {
  id: string;
  name: string;
  type: string;
  lengthMeters: number;
  yearBuilt: number;
  coordinates: [number, number][]; // [lon, lat] pairs
  description: string;
  status: 'ACTIVE' | 'HERITAGE' | 'RAILWAY_ONLY';
}

export interface ProjectBoundary {
  id: string;
  name: string;
  description: string;
  areaSqKm: number;
  coordinates: [number, number][]; // [lon, lat] polygon
}

export type BaseImageryProvider = 
  | 'osm' 
  | 'esri_satellite' 
  | 'esri_topo' 
  | 'dark_canvas' 
  | 'carto_dark' 
  | 'carto_voyager' 
  | 'sentinel_aerial' 
  | 'arcgis_world'
  | 'google_3d_tiles';

export type TerrainProviderType = 
  | 'cesium_world_terrain' 
  | 'ellipsoid_fallback'
  | 'synthetic_dem_grid';

export type LightingPreset = 
  | 'DAY' 
  | 'SUNSET_HARATHI' 
  | 'NIGHT_COMMAND';

export interface MeasurementState {
  isActive: boolean;
  startPoint: { longitude: number; latitude: number; height: number } | null;
  endPoint: { longitude: number; latitude: number; height: number } | null;
  distanceMeters: number | null;
}

export interface LayerVisibilityState {
  boundaries: boolean;
  ghats: boolean;
  bridges: boolean;
  emergencyZones: boolean;
  demElevationGrid: boolean;
  waterFlowVectors: boolean;
  crowdDensityHeatmap: boolean;
  satelliteOverlay: boolean;
  labels3D: boolean;
}
