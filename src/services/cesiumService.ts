import * as Cesium from 'cesium';
import { 
  GHAT_LOCATIONS, 
  BRIDGES, 
  PROJECT_BOUNDARIES, 
  RAJAMAHENDRAVARAM_DEFAULT_CENTER 
} from '../config/locations';
import { 
  GhatLocation, 
  BaseImageryProvider, 
  LayerVisibilityState,
  LightingPreset,
  MeasurementState
} from '../types/gis';
import { SimulationMode } from '../types/simulation';

// Initialize Cesium Ion token if available
const ionToken = import.meta.env.VITE_CESIUM_ION_TOKEN;
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
  private tourInterval: any = null;
  private isMeasuring: boolean = false;
  private measurePoints: Cesium.Cartesian3[] = [];
  private measureEntities: Cesium.Entity[] = [];
  private onMeasurementUpdate: ((state: MeasurementState) => void) | null = null;
  private google3DTileset: Cesium.Cesium3DTileset | null = null;
  private currentBaseImagery: BaseImageryProvider = 'osm';
  private terrainStatus: { hasWorldTerrain: boolean; message: string } = {
    hasWorldTerrain: false,
    message: 'WGS84 Ellipsoid (Fallback Mode Active)'
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
      scene3DOnly: true,
      shouldAnimate: true,
      baseLayer: false,
      terrainProvider: new Cesium.EllipsoidTerrainProvider(),
      requestRenderMode: false,
    });

    log('3. Adding OpenStreetMap base imagery layer...');
    const osmProvider = new Cesium.OpenStreetMapImageryProvider({
      url: 'https://tile.openstreetmap.org/',
      credit: '© OpenStreetMap contributors (ODbL)'
    });
    const baseLayer = viewer.imageryLayers.addImageryProvider(osmProvider);
    baseLayer.errorEvent.addEventListener(() => {
      console.warn('[CesiumService] Primary basemap tile warning handled; keeping fallback surface.');
    });

    this.viewer = viewer;

    log('4. Optimizing scene rendering...');
    viewer.scene.globe.enableLighting = true;
    viewer.scene.globe.depthTestAgainstTerrain = false;
    viewer.scene.highDynamicRange = true;
    viewer.scene.fog.enabled = true;
    viewer.scene.fog.density = 0.00015;
    // Command-center deep navy slate base color so failed/loading tiles never display a pitch black abyss
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0b1329');

    log('5. Setting up terrain with fallback...');
    await this.setupTerrainWithFallback(viewer);

    log('6. Flying to initial position...');
    this.flyToInitialPosition(false);

    log('7. Creating spatial layers...');
    this.createBoundaryLayers();
    this.createBridgeLayers();
    this.createGhatLocationMarkers();
    this.createEmergencyEvacuationCorridor();
    this.createDemElevationGrid();
    this.createWaterFlowVectors();
    this.createCrowdDensityOverlay();

    log('8. Setting up interaction handlers...');
    this.setupInteractionHandlers(onLocationSelect);

    log('9. initializeViewer complete!');
    return { viewer, terrainStatus: this.terrainStatus };
  }

  /**
   * Graceful terrain loader with fallback to WGS84 Ellipsoid
   */
  private async setupTerrainWithFallback(viewer: Cesium.Viewer): Promise<void> {
    try {
      // Only attempt Ion terrain if an explicit user token was provided in environment variables
      if (ionToken && ionToken.trim().length > 10) {
        try {
          const terrain = await Cesium.createWorldTerrainAsync({
            requestWaterMask: true,
            requestVertexNormals: true
          });
          viewer.terrainProvider = terrain;
          this.terrainStatus = {
            hasWorldTerrain: true,
            message: 'Cesium World Terrain 3D Mesh (Active with Water Mask)'
          };
          viewer.scene.globe.depthTestAgainstTerrain = true;
          return;
        } catch (innerErr) {
          console.warn('[CesiumService] Ion World Terrain failed, falling back to Ellipsoid:', innerErr);
        }
      }

      // Default reliable Ellipsoid fallback (instant, offline-capable, stable)
      viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
      this.terrainStatus = {
        hasWorldTerrain: false,
        message: 'Standard WGS84 Ellipsoid + Synthetic DEM Elevation Profile (Active Fallback)'
      };
    } catch (err) {
      console.warn('[CesiumService] Terrain setup encountered exception, using fallback:', err);
      viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
      this.terrainStatus = {
        hasWorldTerrain: false,
        message: 'Standard WGS84 Ellipsoid (Fallback Mode Active)'
      };
    }
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
          credit: '© OpenStreetMap contributors (ODbL)'
        });
        break;

      case 'esri_satellite':
      case 'arcgis_world':
      case 'sentinel_aerial':
        newProvider = new Cesium.UrlTemplateImageryProvider({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          credit: '© Esri World Imagery, Maxar, Earthstar Geographics'
        });
        break;

      case 'esri_topo':
        newProvider = new Cesium.UrlTemplateImageryProvider({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
          credit: '© Esri World Topographic Map, HERE, Garmin'
        });
        break;

      case 'dark_canvas':
        newProvider = new Cesium.UrlTemplateImageryProvider({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
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
          text: `[${markerBadge}] ${location.name}\n${location.teluguName || ''}`,
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
   * Create emergency evacuation corridor route from Pushkar Ghat to Arts College
   */
  private createEmergencyEvacuationCorridor(): void {
    if (!this.viewer) return;

    const evacRouteCoords = [
      [81.7774, 16.9984], // Pushkar Ghat
      [81.7795, 16.9990], // Pushkar Chowk
      [81.7830, 17.0010], // Main arterial road
      [81.7865, 17.0030], // Hospital junction
      [81.7890, 17.0050], // Arts College Grounds
    ];

    const flatCoords: number[] = [];
    evacRouteCoords.forEach(([lon, lat]) => {
      flatCoords.push(lon, lat, 18);
    });

    const evacEntity = this.viewer.entities.add({
      id: 'emergency-evac-corridor-1',
      name: 'Primary Evacuation Corridor: Pushkar Ghat -> Arts College Grounds',
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

    const latitudes = [16.985, 16.995, 17.005, 17.015];
    const longitudes = [81.760, 81.770, 81.780, 81.790];

    latitudes.forEach((lat, idx) => {
      const line = this.viewer!.entities.add({
        id: `dem-lat-line-${idx}`,
        name: `DEM Transect Lat ${lat.toFixed(3)}°N`,
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArray([
            81.755, lat,
            81.795, lat
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
            lon, 16.980,
            lon, 17.020
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

    const vectorPositions = [
      { start: [81.765, 17.012], end: [81.768, 17.006] },
      { start: [81.769, 17.003], end: [81.772, 16.997] },
      { start: [81.773, 16.994], end: [81.776, 16.988] },
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
      { center: [81.7774, 16.9984], radius: 180, color: '#f59e0b', label: 'Pushkar Ghat Density Hub (SIMULATED)' },
      { center: [81.7725, 17.0062], radius: 240, color: '#10b981', label: 'Kotilingala Bathing Buffer (SIMULATED)' },
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
        destination: Cesium.Cartesian3.fromDegrees(81.7798, 16.9962, 380),
        orientation: {
          heading: Cesium.Math.toRadians(315),
          pitch: Cesium.Math.toRadians(-32),
          roll: 0,
        },
        duration: 2.2,
      });
    } else if (mode === 'MONSOON_FLOOD') {
      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(81.7920, 16.9750, 1200),
        orientation: {
          heading: Cesium.Math.toRadians(315),
          pitch: Cesium.Math.toRadians(-26),
          roll: 0,
        },
        duration: 2.2,
      });
    } else if (mode === 'EMERGENCY_EVAC') {
      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(81.7925, 17.0010, 750),
        orientation: {
          heading: Cesium.Math.toRadians(330),
          pitch: Cesium.Math.toRadians(-38),
          roll: 0,
        },
        duration: 2.2,
      });
    } else if (mode === 'VIP_MOVEMENT') {
      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(81.7810, 16.9950, 340),
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
      { name: 'Godavari Pushkar Ghat (Sacred Center)', pos: [81.7798, 16.9962, 380], h: 315, p: -32 },
      { name: 'Three Historic Godavari Bridges', pos: [81.7950, 16.9720, 1250], h: 310, p: -30 },
      { name: 'Kotilingala Bathing Ghat (570m)', pos: [81.7758, 17.0040, 480], h: 325, p: -30 },
      { name: 'Saraswati Ghat & Harathi Pavilion', pos: [81.7695, 17.0100, 420], h: 310, p: -28 },
      { name: 'Arts College Emergency Safe Zone', pos: [81.7915, 17.0025, 600], h: 335, p: -40 },
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
  }
}

// Export singleton instance
export const cesiumService = new CesiumService();
