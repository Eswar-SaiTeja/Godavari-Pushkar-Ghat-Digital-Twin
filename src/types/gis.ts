export type LocationCategory = 
  | 'ghat' 
  | 'bridge' 
  | 'emergency' 
  | 'command' 
  | 'temple' 
  | 'transit';

export type VerificationStatus = 'VERIFIED' | 'APPROXIMATE' | 'UNVERIFIED';

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
  isSimulatedData: boolean;
  verificationStatus: VerificationStatus;
  dataSource: string;
  lastVerifiedDate: string;
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
  verificationStatus: VerificationStatus;
  dataSource: string;
  lastVerifiedDate: string;
}

export interface ProjectBoundary {
  id: string;
  name: string;
  description: string;
  areaSqKm: number;
  coordinates: [number, number][]; // [lon, lat] polygon
  verificationStatus: VerificationStatus;
  dataSource: string;
  lastVerifiedDate: string;
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
  | 'copernicus_glo30'
  | 'cesium_world_terrain' 
  | 'ellipsoid_fallback'
  | 'synthetic_dem_grid';

export type TerrainStatusMode = 
  | 'DEM_ACTIVE'
  | 'ELLIPSOID_FALLBACK'
  | 'LOADING'
  | 'UNAVAILABLE';

export interface TerrainStatusInfo {
  status: TerrainStatusMode;
  label: string;
  message: string;
  providerName: string;
}

export type BuildingType = 
  | 'temple' 
  | 'mandapam' 
  | 'civic' 
  | 'emergency' 
  | 'education' 
  | 'commercial' 
  | 'residential' 
  | 'temporary_tent' 
  | 'heritage';

export interface Building3DFeature {
  id: string;
  name: string;
  teluguName?: string;
  type: BuildingType;
  coordinates: [number, number][]; // Polygon outer boundary in EPSG:4326 [lon, lat]
  baseHeight: number;
  heightMeters: number;
  levels?: number;
  isEstimatedHeight: boolean;
  color: string;
  dataSource: string;
  attribution: string;
  customModelUrl?: string;
}

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
  buildings3D: boolean;
  osmBuildingFootprints: boolean;
  custom3DModels: boolean;
  riverWaterSurface: boolean;
  eventResources: boolean;
  operationalZones: boolean;
  dispatchRoutes: boolean;
}

export interface GisValidationMetrics {
  totalLocations: number;
  verifiedCount: number;
  approximateCount: number;
  unverifiedCount: number;
  invalidCoordinatesCount: number;
  activeTerrainProvider: string;
  activeImageryProvider: string;
  scene3DStatus: string;
}
