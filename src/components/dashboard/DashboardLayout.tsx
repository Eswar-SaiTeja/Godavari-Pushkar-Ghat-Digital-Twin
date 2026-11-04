import React, { useState, useEffect } from 'react';
import { TopHeader } from './TopHeader';
import { Sidebar } from './Sidebar';
import { StatusCards } from './StatusCards';
import { CesiumViewer } from '../cesium/CesiumViewer';
import { LayerControls } from '../cesium/LayerControls';
import { LocationInfoPanel } from '../panels/LocationInfoPanel';
import { SimulationToolbar } from '../panels/SimulationToolbar';
import { ModuleDetailModal } from '../panels/ModuleDetailModal';
import { SimulationHUD } from '../simulation/SimulationHUD';
import { CrowdControlsPanel } from '../simulation/CrowdControlsPanel';
import { TrafficControlsPanel } from '../simulation/TrafficControlsPanel';
import { ScenarioComparisonModal } from '../simulation/ScenarioComparisonModal';
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
import { CrowdMetrics } from '../../types/crowd';
import { TrafficMetrics } from '../../types/traffic';
import { GHAT_LOCATIONS } from '../../config/locations';
import { cesiumService } from '../../services/cesiumService';
import { crowdEngine } from '../../services/crowdSimulation';
import { trafficEngine } from '../../services/trafficSimulation';
import { useSimulationTime } from '../../hooks/useSimulationTime';

export const DashboardLayout: React.FC = () => {
  // Mobile & Layout Navigation States
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isLayersPanelOpen, setIsLayersPanelOpen] = useState<boolean>(false);

  // Active Module & Modal Inspector
  const [activeModuleId, setActiveModuleId] = useState<SidebarModuleId>('overview');
  const [inspectedModule, setInspectedModule] = useState<ModuleDefinition | null>(null);

  // Day 2 Interactive Simulation Panel States
  const [isCrowdPanelOpen, setIsCrowdPanelOpen] = useState<boolean>(false);
  const [isTrafficPanelOpen, setIsTrafficPanelOpen] = useState<boolean>(false);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState<boolean>(false);
  const [isCrowdSimRunning, setIsCrowdSimRunning] = useState<boolean>(true);
  const [isTrafficSimRunning, setIsTrafficSimRunning] = useState<boolean>(true);
  const [isEmergencyAlert, setIsEmergencyAlert] = useState<boolean>(false);
  const [crowdMetrics, setCrowdMetrics] = useState<CrowdMetrics | null>(null);
  const [trafficMetrics, setTrafficMetrics] = useState<TrafficMetrics | null>(null);

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

  // Subscribe to live crowd and traffic engine metric streams
  useEffect(() => {
    crowdEngine.setOnMetricsUpdate((metrics) => {
      setCrowdMetrics(metrics);
    });
    trafficEngine.setOnMetricsUpdate((metrics) => {
      setTrafficMetrics(metrics);
    });
  }, []);

  // Handlers
  const handleToggleLayer = (key: keyof LayerVisibilityState) => {
    setLayers(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSelectModule = (module: ModuleDefinition) => {
    setActiveModuleId(module.id);

    // Day 2 Interactive Modules
    if (module.id === 'crowd_sim') {
      setIsCrowdPanelOpen(true);
      setLayers(prev => ({ ...prev, crowdDensityHeatmap: true }));
      return;
    }
    if (module.id === 'traffic_sim') {
      setIsTrafficPanelOpen(true);
      return;
    }
    if (module.id === 'evacuation_sim') {
      setIsScenarioModalOpen(true);
      setLayers(prev => ({ ...prev, emergencyZones: true }));
      return;
    }

    // Day 1 GIS Views
    if (module.id === 'terrain_3d') {
      setLayers(prev => ({ ...prev, demElevationGrid: true }));
    }
    if (module.id === 'flood_sim') {
      setLayers(prev => ({ ...prev, waterFlowVectors: true }));
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
      setIsCrowdPanelOpen(true);
    } else if (mode === 'MONSOON_FLOOD') {
      setLayers(prev => ({ ...prev, waterFlowVectors: true, demElevationGrid: true }));
    } else if (mode === 'EMERGENCY_EVAC') {
      setLayers(prev => ({ ...prev, emergencyZones: true }));
      setIsScenarioModalOpen(true);
    }
  };

  // Crowd Simulation Control Handlers
  const handleToggleCrowdPlay = () => {
    if (isCrowdSimRunning) {
      crowdEngine.pause();
      setIsCrowdSimRunning(false);
    } else {
      crowdEngine.start();
      setIsCrowdSimRunning(true);
    }
  };

  const handleResetCrowd = () => {
    crowdEngine.reset();
    setIsEmergencyAlert(false);
  };

  const handleTriggerEmergencyAlert = () => {
    crowdEngine.triggerEmergencyAlert();
    setIsEmergencyAlert(true);
  };

  const handleClearEmergencyAlert = () => {
    crowdEngine.clearEmergencyAlert();
    setIsEmergencyAlert(false);
  };

  // Traffic Simulation Control Handlers
  const handleToggleTrafficPlay = () => {
    if (isTrafficSimRunning) {
      trafficEngine.pause();
      setIsTrafficSimRunning(false);
    } else {
      trafficEngine.start();
      setIsTrafficSimRunning(true);
    }
  };

  const handleResetTraffic = () => {
    trafficEngine.reset();
  };

  const handleDispatchEmergency = () => {
    trafficEngine.dispatchEmergencyAmbulance();
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
        onToggleCrowdPanel={() => setIsCrowdPanelOpen(prev => !prev)}
        isCrowdPanelOpen={isCrowdPanelOpen}
        onToggleTrafficPanel={() => setIsTrafficPanelOpen(prev => !prev)}
        isTrafficPanelOpen={isTrafficPanelOpen}
        onToggleScenarioModal={() => setIsScenarioModalOpen(true)}
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

          {/* Floating Simulation HUD (Real-time telemetry ribbon) */}
          <SimulationHUD
            crowdMetrics={crowdMetrics}
            trafficMetrics={trafficMetrics}
            isCrowdActive={true}
            isTrafficActive={true}
            isEmergencyAlert={isEmergencyAlert}
          />

          {/* Draggable GIS Layers & Basemaps Panel */}
          <LayerControls
            layers={layers}
            onToggleLayer={handleToggleLayer}
            baseImagery={baseImagery}
            onChangeBaseImagery={setBaseImagery}
            isOpen={isLayersPanelOpen}
            onClose={() => setIsLayersPanelOpen(false)}
          />

          {/* Draggable Location Information Panel */}
          <LocationInfoPanel
            selectedLocation={selectedLocation}
            onSelectLocation={setSelectedLocation}
            onClose={() => setSelectedLocation(null)}
          />

          {/* Draggable Crowd Simulation & Age Management Panel */}
          <CrowdControlsPanel
            isOpen={isCrowdPanelOpen}
            onClose={() => setIsCrowdPanelOpen(false)}
            isRunning={isCrowdSimRunning}
            onTogglePlayPause={handleToggleCrowdPlay}
            onReset={handleResetCrowd}
            isEmergencyAlert={isEmergencyAlert}
            onTriggerAlert={handleTriggerEmergencyAlert}
            onClearAlert={handleClearEmergencyAlert}
          />

          {/* Draggable Traffic Simulation Controls Panel */}
          <TrafficControlsPanel
            isOpen={isTrafficPanelOpen}
            onClose={() => setIsTrafficPanelOpen(false)}
            isRunning={isTrafficSimRunning}
            onTogglePlayPause={handleToggleTrafficPlay}
            onReset={handleResetTraffic}
            onDispatchEmergency={handleDispatchEmergency}
          />

          {/* Scenario Comparison & Evacuation Intelligence Modal */}
          <ScenarioComparisonModal
            isOpen={isScenarioModalOpen}
            onClose={() => setIsScenarioModalOpen(false)}
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
            onOpenCrowdControls={() => setIsCrowdPanelOpen(prev => !prev)}
            onOpenTrafficControls={() => setIsTrafficPanelOpen(prev => !prev)}
            onOpenScenarioModal={() => setIsScenarioModalOpen(true)}
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
