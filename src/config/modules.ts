import { ModuleDefinition, BookmarkView } from '../types/simulation';

export const SIDEBAR_MODULES: ModuleDefinition[] = [
  {
    id: 'overview',
    label: 'Overview & Globe',
    shortDesc: '3D Digital Twin Command Center and primary spatial view',
    iconName: 'Globe2',
    status: 'ACTIVE_DAY1',
    badgeLabel: 'CORE',
    details: {
      overview: 'Interactive 3D geospatial twin of Rajamahendravaram Godavari riverfront, high-resolution vector layers, and spatial entity inspector.',
      plannedPhase: 'Day 1 Production Ready',
      keyMetrics: [
        { label: 'Riverfront Coverage', value: '6.8', unit: 'km' },
        { label: 'Active Vector Layers', value: '8', unit: 'layers' },
        { label: 'Bathing Ghats Tracked', value: '5', unit: 'ghats' },
        { label: 'Historic Bridges', value: '3', unit: 'structures' },
      ]
    }
  },
  {
    id: 'terrain_3d',
    label: '3D Terrain & DEM',
    shortDesc: 'Elevation contours, bathymetry, and terrain mesh analysis',
    iconName: 'MountainSnow',
    status: 'ACTIVE_DAY1',
    badgeLabel: 'ACTIVE',
    details: {
      overview: 'Digital Elevation Model (DEM) layer with fallback mesh, contour visualization, slope steepness indicators, and riverbed profile tools.',
      plannedPhase: 'Day 1 Core Available (Fallback Ellipsoid / DEM Grid Active)',
      keyMetrics: [
        { label: 'DEM Source', value: 'SRTM 30m / Ellipsoid Fallback' },
        { label: 'Vertical Exaggeration', value: '1.25', unit: 'x' },
        { label: 'Godavari Bed Depth', value: '-8.5 to -14', unit: 'm MSL' },
        { label: 'Ghat Crest Elevation', value: '+16.5 to +18.2', unit: 'm MSL' },
      ]
    }
  },
  {
    id: 'crowd_sim',
    label: 'Crowd Simulation',
    shortDesc: 'Pilgrim density dynamics, bottleneck detection, and flow vectors',
    iconName: 'Users',
    status: 'ACTIVE_DAY1',
    badgeLabel: 'ACTIVE',
    details: {
      overview: 'Agent-based pilgrim mobility forecasting for auspicious Pushkaram muhurtham hours. Simulates queue buffering, step congestion, and safe exit rates.',
      plannedPhase: 'Day 2 Active: Agent-based Cellular Automata & Age Dynamics',
      keyMetrics: [
        { label: 'Simulated Pushkaram Density', value: '3.4', unit: 'devotees/m²' },
        { label: 'Peak Hour Throughput', value: '45,000', unit: 'pax/hr (DEMO)' },
        { label: 'Avg Bathing Time', value: '12.5', unit: 'minutes' },
        { label: 'Bottleneck Risk Level', value: 'Moderate (Monitored)' },
      ]
    }
  },
  {
    id: 'traffic_sim',
    label: 'Traffic & Ingress',
    shortDesc: 'Arterial road corridor flow, bridge bottlenecks, and parking hubs',
    iconName: 'Car',
    status: 'ACTIVE_DAY1',
    badgeLabel: 'ACTIVE',
    details: {
      overview: 'Vehicular movement simulation over the Godavari Road-cum-Rail bridge, Kotilingala link road, and outer ring road parking staging lots.',
      plannedPhase: 'Day 2 Active: Micro-traffic A* Routing & Emergency Escort',
      keyMetrics: [
        { label: 'Active Monitored Corridors', value: '4 Primary Roads' },
        { label: 'Emergency Escort Priority', value: '108 Siren Dispatch' },
        { label: 'Simulated Bridge Flow', value: '70 Vehicles Capacity' },
      ]
    }
  },
  {
    id: 'flood_sim',
    label: 'Flood & Hydrodynamic',
    shortDesc: 'Godavari discharge inundation levels and monsoon surge models',
    iconName: 'Waves',
    status: 'SIMULATED_PREVIEW',
    badgeLabel: 'SIMULATED',
    details: {
      overview: 'Hydrodynamic water level elevation contours modeling 10-year, 25-year, and 50-year Godavari flood discharge events at Sir Arthur Cotton Barrage upstream/downstream.',
      plannedPhase: 'Phase 2: 2D Shallow Water Equations Simulation (Preview Active)',
      keyMetrics: [
        { label: 'Current Demo Water Level', value: '13.8', unit: 'm MSL (DEMO)' },
        { label: 'Danger Warning Mark', value: '17.25', unit: 'm MSL' },
        { label: 'Simulated River Discharge', value: '3.2 Lakh', unit: 'cusecs (DEMO)' },
        { label: 'Inundation Step Reach', value: 'Tier 3 (Safe)' },
      ]
    }
  },
  {
    id: 'evacuation_sim',
    label: 'Emergency Evacuation',
    shortDesc: 'Rapid crowd dispersal paths, emergency corridors, and assembly zones',
    iconName: 'ShieldAlert',
    status: 'ACTIVE_DAY1',
    badgeLabel: 'ACTIVE',
    details: {
      overview: 'Dynamic route optimization for emergency evacuation from riverfront ghat steps to inland assembly grounds (Arts College, Stadium, and Station grounds).',
      plannedPhase: 'Day 2 Active: Scenario Comparison & Evacuation Intelligence',
      keyMetrics: [
        { label: 'Primary Evacuation Corridor', value: 'Pushkar Chowk to Arts College' },
        { label: 'Simulated Clearance Time', value: '48.5s - 142.5s' },
        { label: 'Assembly Zone Capacity', value: '1,20,000 Persons' },
        { label: 'Deterministic Scenarios', value: 'Scenarios A, B, and C' },
      ]
    }
  },
  {
    id: 'boat_movement',
    label: 'Boat Movement & River Patrol',
    shortDesc: 'SDRF patrol craft, pilgrim ferry tracks, and deep-water boundary',
    iconName: 'Ship',
    status: 'SIMULATED_PREVIEW',
    badgeLabel: 'SIMULATED',
    details: {
      overview: 'GPS telemetry simulation for SDRF rescue speedboats, tourism catamarans, and floating safety barrier patrol routes across the 2.8 km river breadth.',
      plannedPhase: 'Phase 2: AIS Vessel Telemetry Simulator (Preview Active)',
      keyMetrics: [
        { label: 'Active Patrol Craft', value: '6', unit: 'vessels (SIMULATED)' },
        { label: 'Patrol Speed Limit', value: '12', unit: 'knots' },
        { label: 'Safety Net Zone Distance', value: '45', unit: 'meters from ghat' },
      ]
    }
  },
  {
    id: 'live_monitoring',
    label: 'Live Monitoring (Simulated)',
    shortDesc: 'Simulated CCTV telemetry, gate counters, and environmental sensors',
    iconName: 'Activity',
    status: 'SIMULATED_PREVIEW',
    badgeLabel: 'SIMULATED FEED',
    details: {
      overview: 'Command center synthetic dashboard displaying simulated environmental parameters, river velocity probes, and simulated gate passenger counts. (Note: Marked simulated per project protocol).',
      plannedPhase: 'Phase 4: Real-time IoT Ingestion Engine (Synthetic Demo Active)',
      keyMetrics: [
        { label: 'Data Feed Mode', value: 'SYNTHETIC_SIMULATED' },
        { label: 'Simulated Telemetry Sensors', value: '14 Active Nodes' },
        { label: 'Sensor Heartbeat Rate', value: '1.0', unit: 'sec' },
      ]
    }
  },
  {
    id: 'data_management',
    label: 'Data & GIS Layers',
    shortDesc: 'Spatial datasets, GeoJSON boundaries, and coordinate systems',
    iconName: 'Database',
    status: 'ACTIVE_DAY1',
    badgeLabel: 'ACTIVE',
    details: {
      overview: 'Inspection of imported GIS vector boundaries, CRS projections (EPSG:4326 WGS84), and DEM elevation rasters.',
      plannedPhase: 'Day 1 Active',
      keyMetrics: [
        { label: 'Spatial Projection', value: 'EPSG:4326 (WGS84)' },
        { label: 'Boundary Entities', value: '1 MultiPolygon' },
        { label: 'Point Entities', value: '8 GeoPoints' },
        { label: 'Bridge Polyline Paths', value: '3 Polylines' },
      ]
    }
  },
  {
    id: 'settings',
    label: 'System Settings',
    shortDesc: 'Rendering fidelity, lighting, Cesium configuration, and display themes',
    iconName: 'Settings',
    status: 'ACTIVE_DAY1',
    badgeLabel: 'CONFIG',
    details: {
      overview: 'Graphics quality settings, sun lighting simulation, atmospheric fog, terrain exaggeration, and Cesium Ion access token configuration.',
      plannedPhase: 'Day 1 Active',
      keyMetrics: [
        { label: 'Render Engine', value: 'CesiumJS WebGL 2.0' },
        { label: 'Atmosphere Fog', value: 'Enabled' },
        { label: 'Depth Testing', value: 'Terrain Aware' },
        { label: 'Target Frame Rate', value: '60 FPS' },
      ]
    }
  }
];

export const BOOKMARK_VIEWS: BookmarkView[] = [
  {
    id: 'view-pushkar-ghat',
    name: 'Pushkar Ghat Steps',
    description: 'Direct view of the sacred bathing steps and VIP pavilion',
    category: 'ghat',
    camera: {
      longitude: 81.7798,
      latitude: 16.9962,
      height: 360,
      heading: 315,
      pitch: -32,
      roll: 0,
    }
  },
  {
    id: 'view-godavari-bridges',
    name: 'Three Godavari Bridges',
    description: 'Spectacular angle overlooking Havelock, Road-cum-Rail, and Arch Bridges',
    category: 'bridge',
    camera: {
      longitude: 81.7950,
      latitude: 16.9720,
      height: 1250,
      heading: 310,
      pitch: -30,
      roll: 0,
    }
  },
  {
    id: 'view-kotilingala',
    name: 'Kotilingala Ghat',
    description: 'Longest bathing riverfront and Shiva temple precincts',
    category: 'ghat',
    camera: {
      longitude: 81.7760,
      latitude: 17.0035,
      height: 520,
      heading: 325,
      pitch: -30,
      roll: 0,
    }
  },
  {
    id: 'view-overview',
    name: 'Rajahmundry Panorama',
    description: 'High-altitude regional command overview of Godavari curve',
    category: 'overview',
    camera: {
      longitude: 81.7774,
      latitude: 16.9984,
      height: 2800,
      heading: 320,
      pitch: -45,
      roll: 0,
    }
  },
  {
    id: 'view-evac-zone',
    name: 'Evacuation Zone (Arts College)',
    description: 'Safe inland assembly grounds and evacuation corridors',
    category: 'evacuation',
    camera: {
      longitude: 81.7925,
      latitude: 17.0010,
      height: 650,
      heading: 335,
      pitch: -40,
      roll: 0,
    }
  }
];
