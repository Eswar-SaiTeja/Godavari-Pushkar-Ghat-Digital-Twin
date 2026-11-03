import React, { useState } from 'react';
import { TopHeader } from './TopHeader';
import { Sidebar } from './Sidebar';
import { StatusCards } from './StatusCards';
import { CesiumViewer } from '../cesium/CesiumViewer';
import { LayerControls } from '../cesium/LayerControls';
import { LocationInfoPanel } from '../panels/LocationInfoPanel';
import { SimulationToolbar } from '../panels/SimulationToolbar';
import { ModuleDetailModal } from '../panels/ModuleDetailModal';
import { 
  LayerVisibilityState, 
  BaseImageryProvider, 
  GhatLocation 
} from '../../types/gis';
import { 
  SidebarModuleId, 
  ModuleDefinition,
  SimulationMode
} from '../../types/simulation';
import { GHAT_LOCATIONS } from '../../config/locations';
import { cesiumService } from '../../services/cesiumService';
import { useSimulationTime } from '../../hooks/useSimulationTime';

export const DashboardLayout: React.FC = () => {
  // Mobile & Layout Navigation States
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isLayersPanelOpen, setIsLayersPanelOpen] = useState<boolean>(false);

  // Active Module & Modal Inspector
  const [activeModuleId, setActiveModuleId] = useState<SidebarModuleId>('overview');
  const [inspectedModule, setInspectedModule] = useState<ModuleDefinition | null>(null);

  // Selected GIS Location (Pushkar Ghat selected by default for Day 1 discovery)
  const [selectedLocation, setSelectedLocation] = useState<GhatLocation | null>(GHAT_LOCATIONS[0]);

  // Base Imagery & Layers
  const [baseImagery, setBaseImagery] = useState<BaseImageryProvider>('osm');
  const [layers, setLayers] = useState<LayerVisibilityState>({
    boundaries: true,
    ghats: true,
    bridges: true,
    emergencyZones: true,
    demElevationGrid: true,
    waterFlowVectors: true,
    crowdDensityHeatmap: true,
    satelliteOverlay: false,
    labels3D: true,
  });

  // Terrain Status
  const [terrainStatus, setTerrainStatus] = useState<{ hasWorldTerrain: boolean; message: string }>({
    hasWorldTerrain: false,
    message: 'Standard WGS84 Ellipsoid (Fallback Mode Active)'
  });

  // Simulation Clock & Synthetic Telemetry Hook
  const {
    isPlaying,
    playbackSpeed,
    simulationMode,
    simulatedTime,
    simulatedDevoteeCount,
    simulatedRiverLevel,
    simulatedDischarge,
    togglePlayPause,
    setPlaybackSpeed,
    setSimulationMode,
    resetClock,
  } = useSimulationTime();

  // Handlers
  const handleToggleLayer = (key: keyof LayerVisibilityState) => {
    setLayers(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSelectModule = (module: ModuleDefinition) => {
    setActiveModuleId(module.id);
    // If user clicked 3D Terrain, ensure DEM grid is visible and fly to a vantage view
    if (module.id === 'terrain_3d') {
      setLayers(prev => ({ ...prev, demElevationGrid: true }));
    }
    // If user clicked Crowd Sim, ensure crowd density layer is on
    if (module.id === 'crowd_sim') {
      setLayers(prev => ({ ...prev, crowdDensityHeatmap: true }));
    }
    // If user clicked Flood Sim, ensure water flow vectors are on
    if (module.id === 'flood_sim') {
      setLayers(prev => ({ ...prev, waterFlowVectors: true }));
    }
    // If user clicked Emergency Evacuation, ensure emergency zones are on
    if (module.id === 'evacuation_sim') {
      setLayers(prev => ({ ...prev, emergencyZones: true }));
    }

    // Open module architectural detail inspector
    setInspectedModule(module);
  };

  const handleResetMap = () => {
    cesiumService.flyToInitialPosition();
  };

  const handleSimulationModeChange = (mode: SimulationMode) => {
    setSimulationMode(mode);
    cesiumService.flyToScenario(mode);
    if (mode === 'PUSHKARAM_PEAK') {
      setLayers(prev => ({ ...prev, crowdDensityHeatmap: true, ghats: true }));
    } else if (mode === 'MONSOON_FLOOD') {
      setLayers(prev => ({ ...prev, waterFlowVectors: true, demElevationGrid: true }));
    } else if (mode === 'EMERGENCY_EVAC') {
      setLayers(prev => ({ ...prev, emergencyZones: true }));
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#050811] flex flex-col font-sans select-none">
      {/* 1. Top Header */}
      <TopHeader
        simulationTime={simulatedTime}
        simulationMode={simulationMode}
        onSimulationModeChange={handleSimulationModeChange}
        onResetMap={handleResetMap}
        onToggleLayersPanel={() => setIsLayersPanelOpen(prev => !prev)}
        isLayersPanelOpen={isLayersPanelOpen}
        onToggleSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        terrainStatusMessage={terrainStatus.message}
      />

      {/* Main Body: Sidebar + Cesium Map Viewport */}
      <div className="relative flex-1 w-full h-[calc(100vh-4rem)] flex overflow-hidden">
        {/* 2. Left Sidebar Navigation */}
        <Sidebar
          activeModule={activeModuleId}
          onSelectModule={handleSelectModule}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        />

        {/* 3. Main Full-Screen Cesium Globe Viewport */}
        <main className={`relative flex-1 h-full transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-72'
        }`}>
          {/* Cesium 3D Globe Viewer */}
          <CesiumViewer
            layers={layers}
            onSelectLocation={setSelectedLocation}
            onTerrainStatusResolved={setTerrainStatus}
          />

          {/* Floating Telemetry Status Cards (Top-Left of map viewport) */}
          <StatusCards
            riverLevelMsl={simulatedRiverLevel}
            devoteeCount={simulatedDevoteeCount}
            terrainStatusMessage={terrainStatus.message}
          />

          {/* Floating Layer Controls Popover */}
          <LayerControls
            layers={layers}
            onToggleLayer={handleToggleLayer}
            baseImagery={baseImagery}
            onChangeBaseImagery={setBaseImagery}
            isOpen={isLayersPanelOpen}
            onClose={() => setIsLayersPanelOpen(false)}
          />

          {/* 4. Right-Side Location Information Panel */}
          <LocationInfoPanel
            selectedLocation={selectedLocation}
            onSelectLocation={setSelectedLocation}
            onClose={() => setSelectedLocation(null)}
          />

          {/* 5. Bottom Floating Simulation Control Panel */}
          <SimulationToolbar
            isPlaying={isPlaying}
            onTogglePlayPause={togglePlayPause}
            playbackSpeed={playbackSpeed}
            onSelectPlaybackSpeed={setPlaybackSpeed}
            simulatedTime={simulatedTime}
            onResetClock={resetClock}
            devoteeCount={simulatedDevoteeCount}
            riverLevelMsl={simulatedRiverLevel}
            dischargeCusecs={simulatedDischarge}
            onResetMap={handleResetMap}
          />

          {/* Module Detail / Architecture Inspector Modal */}
          <ModuleDetailModal
            module={inspectedModule}
            onClose={() => setInspectedModule(null)}
          />
        </main>
      </div>
    </div>
  );
};
