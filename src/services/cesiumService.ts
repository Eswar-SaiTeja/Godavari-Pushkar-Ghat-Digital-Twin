import * as Cesium from 'cesium';
import { 
  GHAT_LOCATIONS, 
  BRIDGES, 
  PROJECT_BOUNDARIES, 
  RAJAMAHENDRAVARAM_DEFAULT_CENTER 
} from '../config/locations';
import { OSM_BUILDING_FOOTPRINTS } from '../config/osmBuildings';
import { 
  GhatLocation, 
  BaseImageryProvider, 
  LayerVisibilityState,
  LightingPreset,
  MeasurementState,
  TerrainStatusInfo
} from '../types/gis';
import { SimulationMode } from '../types/simulation';
import { eventOperationsEngine } from './eventOperationsEngine';
import { EventResource, OperationalZone, DispatchAssignment } from '../types/operations';
import { EmergencyIncident } from '../types/emergency';
import { emergencyEngine } from './emergencyDetectionEngine';

// Initialize Cesium Ion token if available
const ionToken = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_CESIUM_ION_TOKEN) || '';
if (ionToken && ionToken.trim() !== '') {
  Cesium.Ion.defaultAccessToken = ionToken;
}

export class CesiumService {
  public viewer: Cesium.Viewer | null = null;
  private handler: Cesium.ScreenSpaceEventHandler | null = null;
  private ghatEntities: Map<string, Cesium.Entity> = new Map();
  private bridgeEntities: Map<string, Cesium.Entity> = new Map();
  private boundaryEntities: Map<string, Cesium.Entity> = new Map();
  private emergencyEntities: Map<string, Cesium.Entity> = new Map();
  private demGridEntities: Cesium.Entity[] = [];
  private waterFlowEntities: Cesium.Entity[] = [];
  private crowdDensityEntities: Cesium.Entity[] = [];
  private buildingEntities: Cesium.Entity[] = [];
  private customModelEntities: Map<string, Cesium.Entity> = new Map();
  private riverWaterEntities: Cesium.Entity[] = [];
  private resourceEntities: Map<string, Cesium.Entity> = new Map();
  private zoneEntities: Map<string, Cesium.Entity> = new Map();
  private dispatchRouteEntities: Map<string, Cesium.Entity> = new Map();
  private onResourceSelectCallback?: (resource: EventResource) => void;
  private onZoneSelectCallback?: (zone: OperationalZone) => void;
  private onIncidentSelectCallback?: (incident: EmergencyIncident) => void;
  private tourInterval: any = null;
  private isMeasuring: boolean = false;
  private measurePoints: Cesium.Cartesian3[] = [];
  private measureEntities: Cesium.Entity[] = [];
  private onMeasurementUpdate: ((state: MeasurementState) => void) | null = null;
  private google3DTileset: Cesium.Cesium3DTileset | null = null;
  private currentBaseImagery: BaseImageryProvider = 'osm';
  private terrainStatusInfo: TerrainStatusInfo = {
    status: 'ELLIPSOID_FALLBACK',
    label: 'ELLIPSOID FALLBACK ACTIVE',
    message: 'WGS84 Ellipsoid Standard Elevation (Active Fallback - Copernicus DEM GLO-30 TIF requires quantized-mesh tiling)',
    providerName: 'WGS84 Ellipsoid'
  };
  private terrainStatus: { hasWorldTerrain: boolean; message: string } = {
    hasWorldTerrain: false,
    message: 'WGS84 Ellipsoid (Active Fallback)'
  };

  /**
   * Initializes the Cesium Viewer with optimal GIS command-center parameters
   */
  public async initializeViewer(
    container: HTMLElement, 
    onLocationSelect?: (location: GhatLocation | null) => void
  ): Promise<{ viewer: Cesium.Viewer; terrainStatus: { hasWorldTerrain: boolean; message: string } }> {
    const log = (m: string) => {
      let el = document.getElementById('debug-log');
      if (el) el.innerText += '\n[CesiumService] ' + m;
    };
    log('1. Starting initializeViewer...');
    // Clean up if already exists
    this.destroy();

    log('2. Creating Viewer instance with baseLayer=false and Ellipsoid terrain...');
    const viewer = new Cesium.Viewer(container, {
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      navigationHelpButton: false,
      scene3DOnly: false,
      shouldAnimate: true,
      baseLayer: false,
      terrainProvider: new Cesium.EllipsoidTerrainProvider(),
      requestRenderMode: false,
    });

    log('3. Adding OpenStreetMap base imagery layer...');
    const osmProvider = new Cesium.OpenStreetMapImageryProvider({
      url: 'https://tile.openstreetmap.org/',
      maximumLevel: 19,
      credit: '© OpenStreetMap contributors (ODbL)'
    });
    const baseLayer = viewer.imageryLayers.addImageryProvider(osmProvider);
    baseLayer.errorEvent.addEventListener(() => {
      console.warn('[CesiumService] Primary basemap tile warning handled; keeping fallback surface.');
    });

    this.viewer = viewer;

    log('4. Optimizing scene rendering & caching...');
    viewer.scene.globe.enableLighting = true;
    viewer.scene.globe.depthTestAgainstTerrain = false;
    viewer.scene.highDynamicRange = false;
    viewer.scene.fog.enabled = true;
    viewer.scene.fog.density = 0.00015;
    // Command-center deep navy slate base color so failed/loading tiles never display a pitch black abyss
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0b1329');

    // Buffer-free tile caching and smooth zoom bounds
    viewer.scene.globe.maximumScreenSpaceError = 2;
    viewer.scene.globe.tileCacheSize = 1000;
    viewer.scene.globe.preloadAncestors = true;
    viewer.scene.globe.preloadSiblings = true;
    viewer.scene.globe.loadingDescendantLimit = 20;
    viewer.scene.screenSpaceCameraController.minimumZoomDistance = 30.0;
    viewer.scene.screenSpaceCameraController.maximumZoomDistance = 60000.0;
    viewer.scene.screenSpaceCameraController.inertiaZoom = 0.5;
    viewer.scene.screenSpaceCameraController.enableCollisionDetection = true;

    log('5. Setting up terrain with fallback...');
    await this.setupTerrainWithFallback(viewer);

    log('6. Flying to initial position...');
    this.flyToInitialPosition(false);

    log('7. Creating spatial layers safely...');
    const safeInit = (name: string, fn: () => void) => {
      try {
        fn();
      } catch (err) {
        console.warn(`[CesiumService] Non-critical warning in ${name}:`, err);
      }
    };

    safeInit('River Water Surface', () => this.createRiverWaterSurface?.());
    safeInit('Boundary Layers', () => this.createBoundaryLayers?.());
    safeInit('Bridge Layers', () => this.createBridgeLayers?.());
    safeInit('Buildings 3D', () => this.createBuildings3D?.());
    safeInit('Ghat Location Markers', () => this.createGhatLocationMarkers?.());
    safeInit('Emergency Evacuation Corridor', () => this.createEmergencyEvacuationCorridor?.());
    safeInit('DEM Elevation Grid', () => this.createDemElevationGrid?.());
    safeInit('Water Flow Vectors', () => this.createWaterFlowVectors?.());
    safeInit('Crowd Density Overlay', () => this.createCrowdDensityOverlay?.());
    safeInit('Operational Zone Layers', () => this.createOperationalZoneLayers?.());
    safeInit('Resource Layers', () => this.createResourceLayers?.());

    log('8. Setting up interaction handlers...');
    this.setupInteractionHandlers(onLocationSelect);

    log('9. initializeViewer complete!');
    return { viewer, terrainStatus: this.terrainStatus };
  }

  /**
   * Graceful terrain loader with Copernicus DEM check and fallback to WGS84 Ellipsoid
   */
  private async setupTerrainWithFallback(viewer: Cesium.Viewer): Promise<void> {
    const copernicusDemUrl = import.meta.env.VITE_COPERNICUS_DEM_URL || '/terrain/copernicus';

    try {
      // 1. Try local/configured Copernicus DEM GLO-30 quantized-mesh terrain tiles
      if (copernicusDemUrl && copernicusDemUrl !== '/terrain/copernicus') {
        try {
          const terrainProvider = await Cesium.CesiumTerrainProvider.fromUrl(copernicusDemUrl, {
            requestWaterMask: true,
            requestVertexNormals: true
          });
          viewer.terrainProvider = terrainProvider;
          viewer.scene.globe.depthTestAgainstTerrain = true;
          this.terrainStatusInfo = {
            status: 'DEM_ACTIVE',
            label: 'DEM TERRAIN ACTIVE',
            message: 'Copernicus DEM GLO-30 Elevation Model (30m Resolution Active)',
            providerName: 'Copernicus GLO-30 DEM'
          };
          this.terrainStatus = {
            hasWorldTerrain: true,
            message: this.terrainStatusInfo.message
          };
          return;
        } catch (e) {
          console.info('[CesiumService] Configured Copernicus DEM URL unavailable, testing standard fallbacks.');
        }
      }

      // 2. Only attempt Ion terrain if an explicit user token was provided in environment variables
      if (ionToken && ionToken.trim().length > 10) {
        try {
          const terrain = await Cesium.createWorldTerrainAsync({
            requestWaterMask: true,
            requestVertexNormals: true
          });
          viewer.terrainProvider = terrain;
          viewer.scene.globe.depthTestAgainstTerrain = true;
          this.terrainStatusInfo = {
            status: 'DEM_ACTIVE',
            label: 'DEM TERRAIN ACTIVE',
            message: 'Cesium World Terrain 3D Mesh (Active with Water Mask)',
            providerName: 'Cesium World Terrain'
          };
          this.terrainStatus = {
            hasWorldTerrain: true,
            message: this.terrainStatusInfo.message
          };
          return;
        } catch (innerErr) {
          console.warn('[CesiumService] Ion World Terrain failed, falling back to Ellipsoid:', innerErr);
        }
      }

      // 3. Transparent Ellipsoid fallback with honest status indicator
      viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
      this.terrainStatusInfo = {
        status: 'ELLIPSOID_FALLBACK',
        label: 'ELLIPSOID FALLBACK ACTIVE',
        message: 'WGS84 Ellipsoid Standard Elevation (Active Fallback - Copernicus DEM GLO-30 GeoTIFF requires quantized-mesh tiling)',
        providerName: 'WGS84 Ellipsoid'
      };
      this.terrainStatus = {
        hasWorldTerrain: false,
        message: this.terrainStatusInfo.message
      };
    } catch (err) {
      console.warn('[CesiumService] Terrain setup encountered exception, using fallback:', err);
      viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
      this.terrainStatusInfo = {
        status: 'ELLIPSOID_FALLBACK',
        label: 'ELLIPSOID FALLBACK ACTIVE',
        message: 'Standard WGS84 Ellipsoid (Fallback Mode Active)',
        providerName: 'WGS84 Ellipsoid'
      };
      this.terrainStatus = {
        hasWorldTerrain: false,
        message: this.terrainStatusInfo.message
      };
    }
  }

  public getTerrainStatusInfo(): TerrainStatusInfo {
    return this.terrainStatusInfo;
  }

  /**
   * Flies camera to default Pushkar Ghat perspective
   */
  public flyToInitialPosition(animate: boolean = true): void {
    if (!this.viewer) return;

    const { longitude, latitude, height, heading, pitch, roll } = RAJAMAHENDRAVARAM_DEFAULT_CENTER;
    const destination = Cesium.Cartesian3.fromDegrees(longitude, latitude, height);
    const orientation = {
      heading: Cesium.Math.toRadians(heading),
      pitch: Cesium.Math.toRadians(pitch),
      roll: Cesium.Math.toRadians(roll),
    };

    if (animate) {
      this.viewer.camera.flyTo({
        destination,
        orientation,
        duration: 2.0,
      });
    } else {
      this.viewer.camera.setView({
        destination,
        orientation,
      });
    }
  }

  /**
   * Flies camera to a specific ghat location
   */
  public flyToLocation(location: GhatLocation): void {
    if (!this.viewer) return;

    const { destination, orientation } = location.cameraView;
    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        destination.longitude,
        destination.latitude,
        destination.height
      ),
      orientation: {
        heading: Cesium.Math.toRadians(orientation.heading),
        pitch: Cesium.Math.toRadians(orientation.pitch),
        roll: Cesium.Math.toRadians(orientation.roll),
      },
      duration: 2.2,
    });
  }

  /**
   * Sets the base imagery provider with graceful fallback and error handling
   */
  public async setBaseImagery(providerType: BaseImageryProvider): Promise<{ success: boolean; activeProvider: BaseImageryProvider; message?: string }> {
    if (!this.viewer) return { success: false, activeProvider: 'osm' };

    // Clean up any active 3D tileset when switching basemaps
    if (this.google3DTileset) {
      this.viewer.scene.primitives.remove(this.google3DTileset);
      this.google3DTileset = null;
    }

    // Handle Google Photorealistic 3D Tiles
    if (providerType === 'google_3d_tiles') {
      const googleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_3D_TILES_KEY;
      if (!googleKey || typeof googleKey !== 'string' || googleKey.trim().length < 10) {
        console.warn('[CesiumService] Google Maps API key not detected in environment. Reverting to OpenStreetMap.');
        await this.setBaseImagery('osm');
        return {
          success: false,
          activeProvider: 'osm',
          message: 'Google Maps API key is not configured (VITE_GOOGLE_MAPS_API_KEY). Active basemap remained OpenStreetMap.'
        };
      }

      try {
        const tileset = await Cesium.createGooglePhotorealistic3DTileset({
          key: googleKey.trim(),
        });
        if (this.viewer) {
          this.google3DTileset = this.viewer.scene.primitives.add(tileset);
          this.viewer.imageryLayers.removeAll();
          this.currentBaseImagery = 'google_3d_tiles';
          return { success: true, activeProvider: 'google_3d_tiles' };
        }
      } catch (err: any) {
        console.warn('[CesiumService] Google Photorealistic 3D Tiles failed to load. Falling back to OpenStreetMap.', err?.message || '');
        await this.setBaseImagery('osm');
        return {
          success: false,
          activeProvider: 'osm',
          message: 'Unable to initialize Google 3D Tiles with current credentials. Reverted to OpenStreetMap.'
        };
      }
    }

    let newProvider: Cesium.ImageryProvider;
    const cartoKey = import.meta.env.VITE_CARTO_API_KEY;

    switch (providerType) {
      case 'osm':
        newProvider = new Cesium.OpenStreetMapImageryProvider({
          url: 'https://tile.openstreetmap.org/',
          maximumLevel: 19,
          credit: '© OpenStreetMap contributors (ODbL)'
        });
        break;

      case 'esri_satellite':
      case 'arcgis_world':
      case 'sentinel_aerial':
        newProvider = new Cesium.UrlTemplateImageryProvider({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          maximumLevel: 19,
          credit: '© Esri World Imagery, Maxar, Earthstar Geographics'
        });
        break;

      case 'esri_topo':
        newProvider = new Cesium.UrlTemplateImageryProvider({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
          maximumLevel: 19,
          credit: '© Esri World Topographic Map, HERE, Garmin'
        });
        break;

      case 'dark_canvas':
        newProvider = new Cesium.UrlTemplateImageryProvider({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
          maximumLevel: 19,
          credit: '© Esri Dark Gray Canvas'
        });
        break;

      case 'carto_dark':
        if (cartoKey && cartoKey.trim().length > 5) {
          newProvider = new Cesium.UrlTemplateImageryProvider({
            url: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png?api_key=${encodeURIComponent(cartoKey.trim())}`,
            subdomains: ['a', 'b', 'c', 'd'],
            credit: '© CARTO'
          });
        } else {
          // Graceful fallback to Esri Dark Canvas - NO API KEY needed, NO watermarks!
          console.warn('[CesiumService] Carto API key not configured; seamlessly using Esri Dark Canvas fallback.');
          newProvider = new Cesium.UrlTemplateImageryProvider({
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
            credit: '© Esri Dark Gray Canvas (High-Contrast Fallback)'
          });
        }
        break;

      case 'carto_voyager':
        if (cartoKey && cartoKey.trim().length > 5) {
          newProvider = new Cesium.UrlTemplateImageryProvider({
            url: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?api_key=${encodeURIComponent(cartoKey.trim())}`,
            subdomains: ['a', 'b', 'c', 'd'],
            credit: '© CARTO Voyager'
          });
        } else {
          // Graceful fallback to Esri Topo - NO API KEY needed, NO watermarks!
          console.warn('[CesiumService] Carto API key not configured; seamlessly using Esri Topographic fallback.');
          newProvider = new Cesium.UrlTemplateImageryProvider({
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
            credit: '© Esri World Topo Map (Fallback)'
          });
        }
        break;

      default:
        newProvider = new Cesium.OpenStreetMapImageryProvider({
          url: 'https://tile.openstreetmap.org/',
          credit: '© OpenStreetMap contributors'
        });
    }

    try {
      // Replace imagery layer
      this.viewer.imageryLayers.removeAll();
      const imageryLayer = this.viewer.imageryLayers.addImageryProvider(newProvider);
      imageryLayer.errorEvent.addEventListener(() => {
        console.warn('[CesiumService] Imagery tile error caught gracefully. Basemap surface preserved.');
      });
      this.currentBaseImagery = providerType;
      return { success: true, activeProvider: providerType };
    } catch (err: any) {
      console.warn('[CesiumService] Error adding imagery provider, reverting to OpenStreetMap:', err?.message || '');
      this.viewer.imageryLayers.removeAll();
      const fallbackLayer = this.viewer.imageryLayers.addImageryProvider(
        new Cesium.OpenStreetMapImageryProvider({ url: 'https://tile.openstreetmap.org/' })
      );
      fallbackLayer.errorEvent.addEventListener(() => {});
      this.currentBaseImagery = 'osm';
      return { success: false, activeProvider: 'osm', message: 'Failed to load imagery. Reverted to OpenStreetMap.' };
    }
  }

  public getCurrentBaseImagery(): BaseImageryProvider {
    return this.currentBaseImagery;
  }

  /**
   * Create digital twin boundary outline
   */
  private createBoundaryLayers(): void {
    if (!this.viewer) return;

    PROJECT_BOUNDARIES.forEach((b) => {
      const flatCoords: number[] = [];
      b.coordinates.forEach(([lon, lat]) => {
        flatCoords.push(lon, lat);
      });

      const boundaryEntity = this.viewer!.entities.add({
        id: b.id,
        name: b.name,
        polygon: {
          hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
          material: Cesium.Color.fromCssColorString('#00f0ff').withAlpha(0.08),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString('#00f0ff').withAlpha(0.85),
          outlineWidth: 3,
        },
        description: b.description,
      });

      this.boundaryEntities.set(b.id, boundaryEntity);
    });
  }

  /**
   * Create 3D Godavari Bridge polylines
   */
  private createBridgeLayers(): void {
    if (!this.viewer) return;

    BRIDGES.forEach((bridge) => {
      const flatCoords: number[] = [];
      bridge.coordinates.forEach(([lon, lat]) => {
        // Bridge elevation across the Godavari surface
        flatCoords.push(lon, lat, 26);
      });

      let bridgeColor = Cesium.Color.fromCssColorString('#38bdf8'); // Arch bridge electric blue
      if (bridge.status === 'HERITAGE') {
        bridgeColor = Cesium.Color.fromCssColorString('#f59e0b'); // Havelock amber
      } else if (bridge.id === 'road-cum-rail-bridge') {
        bridgeColor = Cesium.Color.fromCssColorString('#10b981'); // Emerald green
      }

      const entity = this.viewer!.entities.add({
        id: bridge.id,
        name: bridge.name,
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArrayHeights(flatCoords),
          width: 7,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.35,
            taperPower: 0.8,
            color: bridgeColor,
          }),
          clampToGround: false,
        },
        description: bridge.description,
      });

      // Add midpoint 3D label
      const midIdx = Math.floor(bridge.coordinates.length / 2);
      const [midLon, midLat] = bridge.coordinates[midIdx];
      this.viewer!.entities.add({
        position: Cesium.Cartesian3.fromDegrees(midLon, midLat, 35),
        label: {
          text: bridge.name,
          font: '11px JetBrains Mono, monospace',
          fillColor: bridgeColor,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(100, 7000),
          pixelOffset: new Cesium.Cartesian2(0, -10),
          backgroundColor: Cesium.Color.fromCssColorString('#0a0f1d').withAlpha(0.75),
          showBackground: true,
          backgroundPadding: new Cesium.Cartesian2(6, 4),
        }
      });

      this.bridgeEntities.set(bridge.id, entity);
    });
  }

  /**
   * Create interactive Ghat markers with GIS labels
   */
  private createGhatLocationMarkers(): void {
    if (!this.viewer) return;

    GHAT_LOCATIONS.forEach((location) => {
      const { longitude, latitude, height } = location.coordinates;
      const position = Cesium.Cartesian3.fromDegrees(longitude, latitude, height);

      let pinColor = Cesium.Color.fromCssColorString('#00f0ff'); // Cyan
      let markerBadge = 'GHAT';

      if (location.category === 'emergency') {
        pinColor = Cesium.Color.fromCssColorString('#ef4444'); // Red emergency
        markerBadge = 'SDRF / RESCUE';
      } else if (location.category === 'command') {
        pinColor = Cesium.Color.fromCssColorString('#8b5cf6'); // Purple command
        markerBadge = 'COMMAND';
      } else if (location.id === 'vip-ghat') {
        pinColor = Cesium.Color.fromCssColorString('#f59e0b'); // Amber VIP
        markerBadge = 'VIP';
      }

      const statusBadge = location.verificationStatus === 'VERIFIED' ? '✓ VERIFIED' :
                          location.verificationStatus === 'APPROXIMATE' ? '≈ APPROX' : '? UNVERIFIED';

      // 3D Point with pulsing glow
      const entity = this.viewer!.entities.add({
        id: location.id,
        name: location.name,
        position,
        point: {
          pixelSize: 14,
          color: pinColor,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: `[${markerBadge} | ${statusBadge}] ${location.name}\n${location.teluguName || ''}`,
          font: '12px Inter, sans-serif',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.fromCssColorString('#050811'),
          outlineWidth: 4,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -16),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(50, 9000),
          backgroundColor: Cesium.Color.fromCssColorString('#0a0f1d').withAlpha(0.85),
          showBackground: true,
          backgroundPadding: new Cesium.Cartesian2(8, 5),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        properties: {
          locationData: location,
        }
      });

      this.ghatEntities.set(location.id, entity);
    });
  }

  /**
   * Create Godavari River water surface polygon (translucent water simulation layer)
   */
  private createRiverWaterSurface(): void {
    if (!this.viewer) return;

    // Verified boundary of Godavari river stretch between Kovvur bank (west) and Rajahmundry ghats (east)
    const riverPolygonCoords = [
      81.7450, 17.0320,
      81.7660, 17.0300,
      81.7695, 17.0226, // Kotilingala
      81.7675, 17.0152, // Saraswati
      81.7670, 17.0084, // Pushkar Ghat
      81.7680, 17.0045, // Markandeya
      81.7695, 16.9969, // Godavari Arch Bridge East
      81.7720, 16.9850, // Southern downstream
      81.7560, 16.9850,
      81.7420, 16.9981, // Godavari Arch Bridge West (Kovvur)
      81.7410, 17.0078, // Havelock Bridge West (Kovvur)
      81.7380, 17.0200,
      81.7450, 17.0320,
    ];

    const waterEntity = this.viewer.entities.add({
      id: 'godavari-river-water-surface',
      name: 'Godavari River Water Surface (Bathymetric Water Body) [VERIFIED]',
      polygon: {
        hierarchy: Cesium.Cartesian3.fromDegreesArray(riverPolygonCoords),
        material: Cesium.Color.fromCssColorString('#0284c7').withAlpha(0.35),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString('#38bdf8').withAlpha(0.7),
        outlineWidth: 2,
        height: 12.5,
      },
      description: 'Godavari River active hydrological flow basin spanning Rajamahendravaram - Kovvur corridor.'
    });

    this.riverWaterEntities.push(waterEntity);
  }

  /**
   * Create 3D extruded footprints for OpenStreetMap & Municipal riverfront buildings
   */
  private createBuildings3D(): void {
    if (!this.viewer) return;

    OSM_BUILDING_FOOTPRINTS.forEach((bldg) => {
      const flatCoords: number[] = [];
      bldg.coordinates.forEach(([lon, lat]) => {
        flatCoords.push(lon, lat);
      });

      const extrudedTop = bldg.baseHeight + bldg.heightMeters;
      const midLon = bldg.coordinates.reduce((sum, c) => sum + c[0], 0) / bldg.coordinates.length;
      const midLat = bldg.coordinates.reduce((sum, c) => sum + c[1], 0) / bldg.coordinates.length;

      const entity = this.viewer!.entities.add({
        id: bldg.id,
        name: bldg.name,
        polygon: {
          hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
          height: bldg.baseHeight,
          extrudedHeight: extrudedTop,
          material: Cesium.Color.fromCssColorString(bldg.color).withAlpha(0.72),
          outline: true,
          outlineColor: Cesium.Color.WHITE.withAlpha(0.85),
          outlineWidth: 1.5,
        },
        description: `${bldg.name} (${bldg.teluguName || ''})\nHeight: ${bldg.heightMeters}m (${bldg.isEstimatedHeight ? 'ESTIMATED' : 'SURVEYED'})\nLevels: ${bldg.levels || 1}\nSource: ${bldg.dataSource}`,
        properties: {
          buildingData: bldg,
        }
      });

      // Spatial 3D hover/proximity label
      this.viewer!.entities.add({
        position: Cesium.Cartesian3.fromDegrees(midLon, midLat, extrudedTop + 3),
        label: {
          text: `[ESTIMATED +${bldg.heightMeters}m] ${bldg.name}`,
          font: '10px JetBrains Mono, monospace',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.fromCssColorString('#050811'),
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(20, 2200),
          backgroundColor: Cesium.Color.fromCssColorString('#0a0f1d').withAlpha(0.8),
          showBackground: true,
          backgroundPadding: new Cesium.Cartesian2(6, 3),
        }
      });

      this.buildingEntities.push(entity);
    });
  }

  /**
   * Load custom 3D model (GLB / glTF) into the digital twin scene
   */
  public async loadCustomModel(options: {
    id: string;
    name: string;
    url: string;
    longitude: number;
    latitude: number;
    height?: number;
    scale?: number;
    heading?: number;
  }): Promise<Cesium.Entity | null> {
    if (!this.viewer) return null;

    try {
      const position = Cesium.Cartesian3.fromDegrees(
        options.longitude,
        options.latitude,
        options.height || 18
      );

      const heading = Cesium.Math.toRadians(options.heading || 0);
      const pitch = 0;
      const roll = 0;
      const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
      const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

      const entity = this.viewer.entities.add({
        id: `custom-model-${options.id}`,
        name: options.name,
        position,
        orientation,
        model: {
          uri: options.url,
          scale: options.scale || 1.0,
          minimumPixelSize: 64,
        },
      });

      this.customModelEntities.set(options.id, entity);
      return entity;
    } catch (err) {
      console.warn('[CesiumService] Custom model loading failed:', err);
      return null;
    }
  }

  /**
   * Admin editable update for building coordinates & heights
   */
  public updateBuildingCoordinates(
    buildingId: string,
    latitude: number,
    longitude: number,
    heightMeters?: number
  ): void {
    const bldg = OSM_BUILDING_FOOTPRINTS.find(b => b.id === buildingId);
    if (!bldg) return;

    const latDelta = latitude - bldg.coordinates[0][1];
    const lonDelta = longitude - bldg.coordinates[0][0];

    bldg.coordinates = bldg.coordinates.map(([lon, lat]) => [lon + lonDelta, lat + latDelta]);
    if (heightMeters !== undefined) {
      bldg.heightMeters = heightMeters;
    }

    const entity = this.buildingEntities.find(e => e.id === buildingId);
    if (entity && this.viewer) {
      const flatCoords: number[] = [];
      bldg.coordinates.forEach(([lon, lat]) => {
        flatCoords.push(lon, lat);
      });
      const extrudedTop = bldg.baseHeight + bldg.heightMeters;

      entity.polygon = new Cesium.PolygonGraphics({
        hierarchy: new Cesium.ConstantProperty(Cesium.Cartesian3.fromDegreesArray(flatCoords)),
        height: new Cesium.ConstantProperty(bldg.baseHeight),
        extrudedHeight: new Cesium.ConstantProperty(extrudedTop),
        material: new Cesium.ColorMaterialProperty(Cesium.Color.fromCssColorString(bldg.color).withAlpha(0.72)),
        outline: new Cesium.ConstantProperty(true),
        outlineColor: new Cesium.ConstantProperty(Cesium.Color.WHITE.withAlpha(0.85)),
        outlineWidth: new Cesium.ConstantProperty(1.5),
      });

      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, 250),
        duration: 1.5,
      });
    }
  }

  /**
   * Create emergency evacuation corridor route from Pushkar Ghat to Arts College
   */
  private createEmergencyEvacuationCorridor(): void {
    if (!this.viewer) return;

    // Verified corridor from Pushkar Ghat (81.766947, 17.008396) eastward to Arts College (81.783471, 17.016330)
    const evacRouteCoords = [
      [81.766947, 17.008396], // Pushkar Ghat
      [81.769200, 17.009100], // Pushkar Chowk
      [81.774500, 17.011800], // Main arterial road
      [81.779200, 17.014200], // College road junction
      [81.783471, 17.016330], // Govt Arts College Grounds
    ];

    const flatCoords: number[] = [];
    evacRouteCoords.forEach(([lon, lat]) => {
      flatCoords.push(lon, lat, 20);
    });

    const evacEntity = this.viewer.entities.add({
      id: 'emergency-evac-corridor-1',
      name: 'Primary Evacuation Corridor: Pushkar Ghat -> Arts College Grounds [VERIFIED]',
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArrayHeights(flatCoords),
        width: 6,
        material: new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.fromCssColorString('#ef4444'),
          dashLength: 20.0,
        }),
      }
    });

    this.emergencyEntities.set('emergency-evac-corridor-1', evacEntity);
  }

  /**
   * Create synthetic 3D DEM elevation grid lines for visual bathymetry/topography inspection
   */
  private createDemElevationGrid(): void {
    if (!this.viewer) return;

    const latitudes = [16.995, 17.005, 17.015, 17.025];
    const longitudes = [81.745, 81.758, 81.770, 81.785];

    latitudes.forEach((lat, idx) => {
      const line = this.viewer!.entities.add({
        id: `dem-lat-line-${idx}`,
        name: `DEM Transect Lat ${lat.toFixed(3)}°N`,
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArray([
            81.740, lat,
            81.790, lat
          ]),
          width: 1,
          material: Cesium.Color.fromCssColorString('#00f0ff').withAlpha(0.25),
        }
      });
      this.demGridEntities.push(line);
    });

    longitudes.forEach((lon, idx) => {
      const line = this.viewer!.entities.add({
        id: `dem-lon-line-${idx}`,
        name: `DEM Transect Lon ${lon.toFixed(3)}°E`,
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArray([
            lon, 16.990,
            lon, 17.030
          ]),
          width: 1,
          material: Cesium.Color.fromCssColorString('#00f0ff').withAlpha(0.25),
        }
      });
      this.demGridEntities.push(line);
    });
  }

  /**
   * Create Godavari hydrodynamic flow direction indicator arrows
   */
  private createWaterFlowVectors(): void {
    if (!this.viewer) return;

    // Verified midstream positions flowing north to south through Godavari channel
    const vectorPositions = [
      { start: [81.753, 17.026], end: [81.756, 17.017] },
      { start: [81.757, 17.015], end: [81.760, 17.006] },
      { start: [81.761, 17.004], end: [81.764, 16.993] },
    ];

    vectorPositions.forEach((v, idx) => {
      const flowVector = this.viewer!.entities.add({
        id: `water-flow-vector-${idx}`,
        name: `Godavari Flow Vector #${idx + 1} (~1.4 m/s SIMULATED)`,
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArray([
            v.start[0], v.start[1],
            v.end[0], v.end[1]
          ]),
          width: 4,
          material: new Cesium.PolylineDashMaterialProperty({
            color: Cesium.Color.fromCssColorString('#38bdf8').withAlpha(0.85),
            dashLength: 16.0,
          }),
        }
      });
      this.waterFlowEntities.push(flowVector);
    });
  }

  /**
   * Create crowd density heatmap overlay rings around Pushkar Ghat and Kotilingala
   */
  private createCrowdDensityOverlay(): void {
    if (!this.viewer) return;

    const zones = [
      { center: [81.766947, 17.008396], radius: 120, color: '#f59e0b', label: 'Pushkar Ghat Density Hub (SIMULATED)' },
      { center: [81.768861, 17.022618], radius: 160, color: '#10b981', label: 'Kotilingala Bathing Buffer (SIMULATED)' },
      { center: [81.767800, 17.004500], radius: 100, color: '#06b6d4', label: 'Markandeya Ghat Density Area (SIMULATED)' },
    ];

    zones.forEach((z, idx) => {
      const circle = this.viewer!.entities.add({
        id: `crowd-overlay-${idx}`,
        name: z.label,
        position: Cesium.Cartesian3.fromDegrees(z.center[0], z.center[1], 16),
        ellipse: {
          semiMinorAxis: z.radius,
          semiMajorAxis: z.radius,
          material: Cesium.Color.fromCssColorString(z.color).withAlpha(0.22),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString(z.color).withAlpha(0.8),
          outlineWidth: 2,
        }
      });
      this.crowdDensityEntities.push(circle);
    });
  }

  /**
   * Create Operational Zone polygons with 3D capacity & population labels
   */
  public createOperationalZoneLayers(): void {
    if (!this.viewer) return;
    this.zoneEntities.forEach(e => this.viewer!.entities.remove(e));
    this.zoneEntities.clear();

    const zones = eventOperationsEngine.getZones();
    zones.forEach((zone) => {
      const flatCoords: number[] = [];
      zone.polygon.forEach(([lon, lat]) => {
        flatCoords.push(lon, lat);
      });

      const zonePolygon = this.viewer!.entities.add({
        id: `zone-entity-${zone.id}`,
        name: zone.name,
        polygon: {
          hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
          material: Cesium.Color.fromCssColorString(zone.color).withAlpha(0.14),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString(zone.color).withAlpha(0.85),
          outlineWidth: 2.5,
          height: 14,
        },
        properties: {
          zoneData: zone,
        }
      });

      // 3D Central status label
      const labelEntity = this.viewer!.entities.add({
        id: `zone-label-${zone.id}`,
        position: Cesium.Cartesian3.fromDegrees(zone.center.longitude, zone.center.latitude, 32),
        label: {
          text: `[ZONE] ${zone.name}\nPop: ${zone.currentSimulatedPopulation.toLocaleString()} / ${zone.capacityAssumption.toLocaleString()} • [${zone.densityClassification}]`,
          font: 'bold 11px Inter, sans-serif',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          fillColor: Cesium.Color.fromCssColorString(zone.color),
          outlineColor: Cesium.Color.fromCssColorString('#050811'),
          outlineWidth: 4,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(80, 8000),
          backgroundColor: Cesium.Color.fromCssColorString('#0a0f1d').withAlpha(0.85),
          showBackground: true,
          backgroundPadding: new Cesium.Cartesian2(8, 4),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        properties: {
          zoneData: zone,
        }
      });

      this.zoneEntities.set(zone.id, zonePolygon);
      this.zoneEntities.set(`label-${zone.id}`, labelEntity);
    });
  }

  /**
   * Create Event Operations Resource pins with category-specific badges
   */
  public createResourceLayers(): void {
    if (!this.viewer) return;
    this.resourceEntities.forEach(e => this.viewer!.entities.remove(e));
    this.resourceEntities.clear();

    const resources = eventOperationsEngine.getResources();
    resources.forEach((res) => {
      const { longitude, latitude } = res.coordinates;
      const height = res.coordinates.height || 18;

      let catColor = '#3b82f6';
      let iconSymbol = 'POLICE';

      switch (res.category) {
        case 'POLICE':
          catColor = '#3b82f6';
          iconSymbol = 'POLICE';
          break;
        case 'MEDICAL':
          catColor = '#ef4444';
          iconSymbol = 'MED HOSPITAL';
          break;
        case 'FIRST_AID':
          catColor = '#ec4899';
          iconSymbol = 'FIRST AID';
          break;
        case 'AMBULANCE':
          catColor = '#f97316';
          iconSymbol = '108 AMBULANCE';
          break;
        case 'FIRE_RESCUE':
          catColor = '#ea580c';
          iconSymbol = 'FIRE & RESCUE';
          break;
        case 'VOLUNTEER':
          catColor = '#10b981';
          iconSymbol = 'VOLUNTEER';
          break;
        case 'WATER_STATION':
          catColor = '#0284c7';
          iconSymbol = 'DRINKING WATER';
          break;
        case 'PUBLIC_TOILET':
          catColor = '#06b6d4';
          iconSymbol = 'BIO-TOILET';
          break;
        case 'TEMPORARY_SHELTER':
          catColor = '#8b5cf6';
          iconSymbol = 'SHELTER';
          break;
        default:
          catColor = '#e2e8f0';
          iconSymbol = res.category;
      }

      const entity = this.viewer!.entities.add({
        id: `res-entity-${res.id}`,
        name: res.name,
        position: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
        point: {
          pixelSize: 13,
          color: Cesium.Color.fromCssColorString(catColor),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: `[${iconSymbol} | ${res.status}]\n${res.name}`,
          font: '10px JetBrains Mono, monospace',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.fromCssColorString('#050811'),
          outlineWidth: 3,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -16),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(20, 6000),
          backgroundColor: Cesium.Color.fromCssColorString('#0a0f1d').withAlpha(0.85),
          showBackground: true,
          backgroundPadding: new Cesium.Cartesian2(6, 4),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        properties: {
          resourceData: res,
        }
      });

      this.resourceEntities.set(res.id, entity);
    });
  }

  public refreshResourceLayers(): void {
    this.createResourceLayers();
  }

  public refreshZoneLayers(): void {
    this.createOperationalZoneLayers();
  }

  public renderDispatchRoute(dispatch: DispatchAssignment): void {
    if (!this.viewer) return;

    const existing = this.dispatchRouteEntities.get(dispatch.id);
    if (existing) {
      this.viewer.entities.remove(existing);
      this.dispatchRouteEntities.delete(dispatch.id);
    }

    const res = eventOperationsEngine.getResourceById(dispatch.resourceId);
    if (!res) return;

    let flatHeights: number[] = [];
    if (dispatch.routeCoordinates && dispatch.routeCoordinates.length >= 2) {
      dispatch.routeCoordinates.forEach(([lon, lat]) => {
        flatHeights.push(lon, lat, 22);
      });
    } else {
      const start = [res.coordinates.longitude, res.coordinates.latitude, 22];
      const end = [dispatch.incidentCoordinates[0], dispatch.incidentCoordinates[1], 22];
      flatHeights = [start[0], start[1], start[2], end[0], end[1], end[2]];
    }

    const isCritical = dispatch.incidentSeverity === 'CRITICAL';
    const glowColor = isCritical ? '#ef4444' : '#f59e0b';

    const routeEntity = this.viewer.entities.add({
      id: `disp-route-${dispatch.id}`,
      name: `Dispatch: ${dispatch.resourceName} -> ${dispatch.incidentTitle}`,
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArrayHeights(flatHeights),
        width: 6,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.35,
          color: Cesium.Color.fromCssColorString(glowColor),
        }),
        clampToGround: false,
      }
    });

    this.dispatchRouteEntities.set(dispatch.id, routeEntity);
  }

  public clearDispatchRoute(dispatchId: string): void {
    if (!this.viewer) return;
    const entity = this.dispatchRouteEntities.get(dispatchId);
    if (entity) {
      this.viewer.entities.remove(entity);
      this.dispatchRouteEntities.delete(dispatchId);
    }
  }

  public flyToIncident(incidentOrId: EmergencyIncident | string): void {
    if (!this.viewer) return;
    const incident = typeof incidentOrId === 'string'
      ? emergencyEngine.getIncidents().find(i => i.id === incidentOrId)
      : incidentOrId;
    if (!incident) return;

    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        incident.coordinates[0],
        incident.coordinates[1],
        260
      ),
      orientation: {
        heading: Cesium.Math.toRadians(325),
        pitch: Cesium.Math.toRadians(-35),
        roll: 0,
      },
      duration: 1.8,
    });
  }

  public flyToResource(resourceOrId: EventResource | string): void {
    if (!this.viewer) return;
    const resource = typeof resourceOrId === 'string' 
      ? eventOperationsEngine.getResourceById(resourceOrId) 
      : resourceOrId;
    if (!resource) return;
    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        resource.coordinates.longitude,
        resource.coordinates.latitude,
        280
      ),
      orientation: {
        heading: Cesium.Math.toRadians(325),
        pitch: Cesium.Math.toRadians(-35),
        roll: 0,
      },
      duration: 1.8,
    });
  }

  public flyToZone(zoneOrId: OperationalZone | string): void {
    if (!this.viewer) return;
    const zone = typeof zoneOrId === 'string'
      ? eventOperationsEngine.getZoneById(zoneOrId)
      : zoneOrId;
    if (!zone) return;
    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        zone.center.longitude,
        zone.center.latitude,
        650
      ),
      orientation: {
        heading: Cesium.Math.toRadians(325),
        pitch: Cesium.Math.toRadians(-40),
        roll: 0,
      },
      duration: 2.0,
    });
  }

  public flyToCoordinates(longitude: number, latitude: number, height: number = 300): void {
    if (!this.viewer) return;
    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
      orientation: {
        heading: Cesium.Math.toRadians(325),
        pitch: Cesium.Math.toRadians(-35),
        roll: 0,
      },
      duration: 1.8,
    });
  }

  /**
   * Sets up screen space mouse click picking on GIS entities
   */
  private setupInteractionHandlers(onLocationSelect?: (location: GhatLocation | null) => void): void {
    if (!this.viewer) return;

    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);

    this.handler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
      if (!this.viewer) return;

      // Check if distance measurement mode is active
      if (this.isMeasuring) {
        const ray = this.viewer.camera.getPickRay(click.position);
        const cartesian = ray ? this.viewer.scene.globe.pick(ray, this.viewer.scene) : null;
        if (cartesian) {
          this.handleMeasurementPoint(cartesian);
        }
        return;
      }

      const pickedObject = this.viewer.scene.pick(click.position);
      if (Cesium.defined(pickedObject) && pickedObject.id) {
        const entity = pickedObject.id as Cesium.Entity;
        
        // Check if entity has incidentData property
        if (entity.properties && entity.properties.hasProperty('incidentData')) {
          const incidentData = entity.properties.getValue(Cesium.JulianDate.now()).incidentData as EmergencyIncident;
          if (this.onIncidentSelectCallback) {
            this.onIncidentSelectCallback(incidentData);
          }
          return;
        }

        // Check if entity has resourceData property
        if (entity.properties && entity.properties.hasProperty('resourceData')) {
          const resourceData = entity.properties.getValue(Cesium.JulianDate.now()).resourceData as EventResource;
          if (this.onResourceSelectCallback) {
            this.onResourceSelectCallback(resourceData);
          }
          return;
        }

        // Check if entity has zoneData property
        if (entity.properties && entity.properties.hasProperty('zoneData')) {
          const zoneData = entity.properties.getValue(Cesium.JulianDate.now()).zoneData as OperationalZone;
          if (this.onZoneSelectCallback) {
            this.onZoneSelectCallback(zoneData);
          }
          return;
        }

        // Check if entity has locationData property
        if (entity.properties && entity.properties.hasProperty('locationData')) {
          const locationData = entity.properties.getValue(Cesium.JulianDate.now()).locationData as GhatLocation;
          if (onLocationSelect) {
            onLocationSelect(locationData);
          }
          return;
        }

        // Check if entity id matches a ghat location id
        const matchedGhat = GHAT_LOCATIONS.find(g => g.id === entity.id);
        if (matchedGhat && onLocationSelect) {
          onLocationSelect(matchedGhat);
          return;
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  public setOnResourceSelect(cb?: (resource: EventResource) => void): void {
    this.onResourceSelectCallback = cb;
  }

  public setOnZoneSelect(cb?: (zone: OperationalZone) => void): void {
    this.onZoneSelectCallback = cb;
  }

  public setOnIncidentSelect(cb?: (incident: EmergencyIncident) => void): void {
    this.onIncidentSelectCallback = cb;
  }

  /**
   * Update layer visibility states dynamically
   */
  public updateLayerVisibility(layers: LayerVisibilityState): void {
    // Boundaries
    this.boundaryEntities.forEach(e => {
      e.show = layers.boundaries;
    });

    // Ghats & Landmarks
    this.ghatEntities.forEach(e => {
      e.show = layers.ghats;
    });

    // Bridges
    this.bridgeEntities.forEach(e => {
      e.show = layers.bridges;
    });

    // Emergency Evacuation
    this.emergencyEntities.forEach(e => {
      e.show = layers.emergencyZones;
    });

    // DEM Grid
    this.demGridEntities.forEach(e => {
      e.show = layers.demElevationGrid;
    });

    // Water Flow Vectors
    this.waterFlowEntities.forEach(e => {
      e.show = layers.waterFlowVectors;
    });

    // Crowd Density Heatmap
    this.crowdDensityEntities.forEach(e => {
      e.show = layers.crowdDensityHeatmap;
    });

    // Labels
    this.ghatEntities.forEach(e => {
      if (e.label) {
        e.label.show = new Cesium.ConstantProperty(layers.labels3D);
      }
    });

    // 3D Extruded Buildings & Pavilions
    this.buildingEntities.forEach(e => {
      e.show = layers.buildings3D && (layers.osmBuildingFootprints !== false);
    });

    // Custom 3D Models
    this.customModelEntities.forEach(e => {
      e.show = layers.custom3DModels !== false;
    });

    // River Water Surface
    this.riverWaterEntities.forEach(e => {
      e.show = layers.riverWaterSurface;
    });

    // Event Operations Resources
    this.resourceEntities.forEach(e => {
      e.show = layers.eventResources !== false;
    });

    // Operational Zones
    this.zoneEntities.forEach(e => {
      e.show = layers.operationalZones !== false;
    });

    // Dispatch Routes
    this.dispatchRouteEntities.forEach(e => {
      e.show = layers.dispatchRoutes !== false;
    });
  }

  /**
   * Switches between 3D globe and 2D orthographic map views
   */
  public toggle2D3D(): '2D' | '3D' {
    if (!this.viewer) return '3D';
    if (this.viewer.scene.mode === Cesium.SceneMode.SCENE3D) {
      this.viewer.scene.morphTo2D(1.2);
      return '2D';
    } else {
      this.viewer.scene.morphTo3D(1.2);
      return '3D';
    }
  }

  /**
   * Queries current scene mode
   */
  public getSceneMode(): '2D' | '3D' {
    if (!this.viewer) return '3D';
    return this.viewer.scene.mode === Cesium.SceneMode.SCENE2D ? '2D' : '3D';
  }

  /**
   * Resizes Cesium canvas to match bounding viewport, preventing zero-height collapse
   */
  public resize(): void {
    if (this.viewer && !this.viewer.isDestroyed()) {
      this.viewer.resize();
    }
  }

  /**
   * Bounding view that frames all verified GIS layers, ghats, bridges and boundaries
   */
  public zoomToAllGisLayers(): void {
    if (!this.viewer) return;
    // Bounding rectangle covering Kovvur west (81.738) to Rajamahendravaram Arts College east (81.788)
    // and southern bridges (16.990) to northern Kotilingala (17.026)
    this.viewer.camera.flyTo({
      destination: Cesium.Rectangle.fromDegrees(81.738, 16.990, 81.788, 17.026),
      duration: 2.0,
    });
  }

  /**
   * Admin coordinate & status updater: dynamically updates landmark position, label and properties
   */
  public updateGhatCoordinates(
    ghatId: string, 
    latitude: number, 
    longitude: number, 
    status: 'VERIFIED' | 'APPROXIMATE' | 'UNVERIFIED',
    elevationMsl?: number
  ): void {
    const targetGhat = GHAT_LOCATIONS.find(g => g.id === ghatId);
    if (targetGhat) {
      targetGhat.coordinates.latitude = latitude;
      targetGhat.coordinates.longitude = longitude;
      if (elevationMsl !== undefined) {
        targetGhat.elevationMsl = elevationMsl;
      }
      targetGhat.verificationStatus = status;
      targetGhat.lastVerifiedDate = '2026-11-05';
      if (status === 'VERIFIED') {
        targetGhat.dataSource = 'Admin Verified Survey Coordinate (EPSG:4326)';
      }
    }

    const entity = this.ghatEntities.get(ghatId);
    if (entity && this.viewer) {
      const height = targetGhat ? targetGhat.coordinates.height : 16;
      entity.position = new Cesium.ConstantPositionProperty(
        Cesium.Cartesian3.fromDegrees(longitude, latitude, height)
      );

      const statusBadge = status === 'VERIFIED' ? '✓ VERIFIED' :
                          status === 'APPROXIMATE' ? '≈ APPROX' : '? UNVERIFIED';

      let markerBadge = 'GHAT';
      if (targetGhat?.category === 'emergency') markerBadge = 'SDRF / RESCUE';
      else if (targetGhat?.category === 'command') markerBadge = 'COMMAND';
      else if (targetGhat?.id === 'vip-ghat') markerBadge = 'VIP';

      if (entity.label && targetGhat) {
        entity.label.text = new Cesium.ConstantProperty(
          `[${markerBadge} | ${statusBadge}] ${targetGhat.name}\n${targetGhat.teluguName || ''}`
        );
      }
    }

    if (targetGhat) {
      this.flyToLocation(targetGhat);
    }
  }

  /**
   * Camera navigation helper methods
   */
  public zoomIn(): void {
    if (!this.viewer) return;
    this.viewer.camera.zoomIn(this.viewer.camera.positionCartographic.height * 0.3);
  }

  public zoomOut(): void {
    if (!this.viewer) return;
    this.viewer.camera.zoomOut(this.viewer.camera.positionCartographic.height * 0.3);
  }

  public rotateLeft(): void {
    if (!this.viewer) return;
    this.viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, Cesium.Math.toRadians(15));
  }

  public rotateRight(): void {
    if (!this.viewer) return;
    this.viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, Cesium.Math.toRadians(-15));
  }

  public tiltUp(): void {
    if (!this.viewer) return;
    this.viewer.camera.lookUp(Cesium.Math.toRadians(10));
  }

  public tiltDown(): void {
    if (!this.viewer) return;
    this.viewer.camera.lookDown(Cesium.Math.toRadians(10));
  }

  public resetNorth(): void {
    if (!this.viewer) return;
    const currentHeading = this.viewer.camera.heading;
    this.viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, currentHeading);
  }

  /**
   * Get current camera telemetry data for HUD display
   */
  public getCameraTelemetry(): {
    longitude: number;
    latitude: number;
    altitudeMeters: number;
    headingDeg: number;
    pitchDeg: number;
  } | null {
    if (!this.viewer) return null;

    const cartographic = Cesium.Cartographic.fromCartesian(this.viewer.camera.position);
    return {
      longitude: Cesium.Math.toDegrees(cartographic.longitude),
      latitude: Cesium.Math.toDegrees(cartographic.latitude),
      altitudeMeters: Math.round(cartographic.height),
      headingDeg: Math.round(Cesium.Math.toDegrees(this.viewer.camera.heading)),
      pitchDeg: Math.round(Cesium.Math.toDegrees(this.viewer.camera.pitch)),
    };
  }

  /**
   * Adjusts lighting preset for day, evening harathi, or night command mode
   */
  public setLightingPreset(preset: LightingPreset): void {
    if (!this.viewer) return;

    const baseDate = new Date();
    baseDate.setUTCFullYear(2026, 10, 3);

    if (preset === 'DAY') {
      baseDate.setUTCHours(8, 30, 0); // 14:00 IST
      this.viewer.scene.globe.enableLighting = true;
      this.viewer.scene.fog.density = 0.0001;
    } else if (preset === 'SUNSET_HARATHI') {
      baseDate.setUTCHours(12, 45, 0); // 18:15 IST (sunset / harathi time)
      this.viewer.scene.globe.enableLighting = true;
      this.viewer.scene.fog.density = 0.00025;
    } else if (preset === 'NIGHT_COMMAND') {
      baseDate.setUTCHours(15, 30, 0); // 21:00 IST
      this.viewer.scene.globe.enableLighting = true;
      this.viewer.scene.fog.density = 0.00015;
    }

    this.viewer.clock.currentTime = Cesium.JulianDate.fromDate(baseDate);
  }

  /**
   * Responds to simulation mode change with camera vantage adjustment
   */
  public flyToScenario(mode: SimulationMode): void {
    if (!this.viewer) return;

    if (mode === 'PUSHKARAM_PEAK') {
      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(81.7685, 17.0065, 380),
        orientation: {
          heading: Cesium.Math.toRadians(320),
          pitch: Cesium.Math.toRadians(-32),
          roll: 0,
        },
        duration: 2.2,
      });
    } else if (mode === 'MONSOON_FLOOD') {
      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(81.7750, 16.9880, 1400),
        orientation: {
          heading: Cesium.Math.toRadians(315),
          pitch: Cesium.Math.toRadians(-26),
          roll: 0,
        },
        duration: 2.2,
      });
    } else if (mode === 'EMERGENCY_EVAC') {
      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(81.7850, 17.0120, 850),
        orientation: {
          heading: Cesium.Math.toRadians(325),
          pitch: Cesium.Math.toRadians(-38),
          roll: 0,
        },
        duration: 2.2,
      });
    } else if (mode === 'VIP_MOVEMENT') {
      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(81.7682, 17.0080, 360),
        orientation: {
          heading: Cesium.Math.toRadians(325),
          pitch: Cesium.Math.toRadians(-35),
          roll: 0,
        },
        duration: 2.2,
      });
    } else {
      this.flyToInitialPosition(true);
    }
  }

  /**
   * Automated Inspection Tour across key Godavari pushkar locations
   */
  public startTour(
    onStepChange: (siteName: string, stepIdx: number) => void,
    onComplete: () => void
  ): void {
    if (!this.viewer) return;
    this.stopTour();

    const tourStops = [
      { name: 'Godavari Pushkar Ghat (Sacred Steps) [VERIFIED]', pos: [81.766947, 17.008396, 340], h: 320, p: -32 },
      { name: 'Historic Godavari Bridges (Havelock & Arch) [VERIFIED]', pos: [81.767123, 17.007046, 750], h: 300, p: -28 },
      { name: 'Kotilingala Bathing Ghat (Heritage Stretch) [VERIFIED]', pos: [81.768861, 17.022618, 420], h: 330, p: -30 },
      { name: 'Saraswati Ghat & Harathi Platform [VERIFIED]', pos: [81.767200, 17.015200, 380], h: 315, p: -28 },
      { name: 'Arts College Emergency Safe Haven [VERIFIED]', pos: [81.783471, 17.016330, 520], h: 335, p: -38 },
    ];

    let currentIdx = 0;

    const executeStop = () => {
      if (currentIdx >= tourStops.length) {
        this.stopTour();
        onComplete();
        return;
      }

      const stop = tourStops[currentIdx];
      onStepChange(stop.name, currentIdx + 1);

      this.viewer!.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(stop.pos[0], stop.pos[1], stop.pos[2]),
        orientation: {
          heading: Cesium.Math.toRadians(stop.h),
          pitch: Cesium.Math.toRadians(stop.p),
          roll: 0,
        },
        duration: 2.8,
      });

      currentIdx++;
    };

    executeStop();
    this.tourInterval = setInterval(executeStop, 6000);
  }

  public stopTour(): void {
    if (this.tourInterval) {
      clearInterval(this.tourInterval);
      this.tourInterval = null;
    }
  }

  /**
   * Interactive Distance Ruler tool
   */
  public toggleMeasurement(onUpdate: (state: MeasurementState) => void): boolean {
    if (this.isMeasuring) {
      this.clearMeasurement();
      return false;
    } else {
      this.startMeasurement(onUpdate);
      return true;
    }
  }

  public startMeasurement(onUpdate: (state: MeasurementState) => void): void {
    this.clearMeasurement();
    this.isMeasuring = true;
    this.onMeasurementUpdate = onUpdate;
    onUpdate({
      isActive: true,
      startPoint: null,
      endPoint: null,
      distanceMeters: null,
    });
  }

  public clearMeasurement(): void {
    this.isMeasuring = false;
    this.measurePoints = [];
    if (this.viewer) {
      this.measureEntities.forEach(e => this.viewer!.entities.remove(e));
    }
    this.measureEntities = [];
    if (this.onMeasurementUpdate) {
      this.onMeasurementUpdate({
        isActive: false,
        startPoint: null,
        endPoint: null,
        distanceMeters: null,
      });
      this.onMeasurementUpdate = null;
    }
  }

  private handleMeasurementPoint(cartesian: Cesium.Cartesian3): void {
    if (!this.viewer) return;

    const carto = Cesium.Cartographic.fromCartesian(cartesian);
    const pointCoord = {
      longitude: Cesium.Math.toDegrees(carto.longitude),
      latitude: Cesium.Math.toDegrees(carto.latitude),
      height: Math.round(carto.height),
    };

    if (this.measurePoints.length === 0) {
      // First Point
      this.measurePoints.push(cartesian);

      const pt1 = this.viewer.entities.add({
        position: cartesian,
        point: {
          pixelSize: 10,
          color: Cesium.Color.fromCssColorString('#00f0ff'),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
        },
        label: {
          text: 'START POINT',
          font: '10px JetBrains Mono, monospace',
          fillColor: Cesium.Color.fromCssColorString('#00f0ff'),
          backgroundColor: Cesium.Color.fromCssColorString('#0a0f1d').withAlpha(0.85),
          showBackground: true,
          pixelOffset: new Cesium.Cartesian2(0, -14),
        }
      });
      this.measureEntities.push(pt1);

      if (this.onMeasurementUpdate) {
        this.onMeasurementUpdate({
          isActive: true,
          startPoint: pointCoord,
          endPoint: null,
          distanceMeters: null,
        });
      }
    } else {
      // Second Point
      const startCartesian = this.measurePoints[0];
      const startCarto = Cesium.Cartographic.fromCartesian(startCartesian);
      const startPointCoord = {
        longitude: Cesium.Math.toDegrees(startCarto.longitude),
        latitude: Cesium.Math.toDegrees(startCarto.latitude),
        height: Math.round(startCarto.height),
      };

      this.measurePoints.push(cartesian);

      const distance = Cesium.Cartesian3.distance(startCartesian, cartesian);

      const pt2 = this.viewer.entities.add({
        position: cartesian,
        point: {
          pixelSize: 10,
          color: Cesium.Color.fromCssColorString('#f59e0b'),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
        },
        label: {
          text: `END POINT (${Math.round(distance)}m)`,
          font: '10px JetBrains Mono, monospace',
          fillColor: Cesium.Color.fromCssColorString('#f59e0b'),
          backgroundColor: Cesium.Color.fromCssColorString('#0a0f1d').withAlpha(0.85),
          showBackground: true,
          pixelOffset: new Cesium.Cartesian2(0, -14),
        }
      });
      this.measureEntities.push(pt2);

      // Connecting line
      const line = this.viewer.entities.add({
        polyline: {
          positions: [startCartesian, cartesian],
          width: 3,
          material: new Cesium.PolylineDashMaterialProperty({
            color: Cesium.Color.fromCssColorString('#00f0ff'),
            dashLength: 12.0,
          }),
        }
      });
      this.measureEntities.push(line);

      // Midpoint measurement label
      const midPoint = Cesium.Cartesian3.midpoint(startCartesian, cartesian, new Cesium.Cartesian3());
      const labelEntity = this.viewer.entities.add({
        position: midPoint,
        label: {
          text: `DISTANCE: ${Math.round(distance).toLocaleString()} m (${(distance / 1000).toFixed(2)} km)`,
          font: 'bold 12px JetBrains Mono, monospace',
          fillColor: Cesium.Color.WHITE,
          backgroundColor: Cesium.Color.fromCssColorString('#050811').withAlpha(0.9),
          showBackground: true,
          outlineColor: Cesium.Color.fromCssColorString('#00f0ff'),
          outlineWidth: 2,
          pixelOffset: new Cesium.Cartesian2(0, -20),
        }
      });
      this.measureEntities.push(labelEntity);

      if (this.onMeasurementUpdate) {
        this.onMeasurementUpdate({
          isActive: true,
          startPoint: startPointCoord,
          endPoint: pointCoord,
          distanceMeters: Math.round(distance),
        });
      }

      // Reset for next pair
      this.measurePoints = [];
    }
  }

  /**
   * Clean up Cesium resources on component unmount
   */
  public destroy(): void {
    this.stopTour();
    this.clearMeasurement();

    if (this.handler && !this.handler.isDestroyed()) {
      this.handler.destroy();
      this.handler = null;
    }

    if (this.google3DTileset && this.viewer) {
      try {
        this.viewer.scene.primitives.remove(this.google3DTileset);
      } catch (e) {}
      this.google3DTileset = null;
    }

    if (this.viewer && !this.viewer.isDestroyed()) {
      this.viewer.destroy();
      this.viewer = null;
    }

    this.ghatEntities.clear();
    this.bridgeEntities.clear();
    this.boundaryEntities.clear();
    this.emergencyEntities.clear();
    this.demGridEntities = [];
    this.waterFlowEntities = [];
    this.crowdDensityEntities = [];
    this.buildingEntities = [];
    this.customModelEntities.clear();
    this.riverWaterEntities = [];
    this.resourceEntities.clear();
    this.zoneEntities.clear();
    this.dispatchRouteEntities.clear();
    this.onResourceSelectCallback = undefined;
    this.onZoneSelectCallback = undefined;
    this.onIncidentSelectCallback = undefined;
  }
}

// Export singleton instance
export const cesiumService = new CesiumService();
