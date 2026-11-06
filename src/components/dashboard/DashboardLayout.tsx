import React, { useState, useEffect } from 'react';
import { TopHeader } from './TopHeader';
import { GooeyLiquidNav } from '../navigation/GooeyLiquidNav';
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
import { EmergencyCommandCenter } from '../emergency/EmergencyCommandCenter';
import { AgentInspectorModal } from '../emergency/AgentInspectorModal';
import { EmergencyScenarioBuilder } from '../emergency/EmergencyScenarioBuilder';
import { GisValidationModal } from '../panels/GisValidationModal';
import { EventOperationsCommandCenter, TabType as OperationsTabType } from '../operations/EventOperationsCommandCenter';
import { ResourceInspectorModal } from '../operations/ResourceInspectorModal';
import { AICopilotDrawer } from '../ai/AICopilotDrawer';
import { EventResource } from '../../types/operations';
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('nav') === 'expanded') return false;
      if (params.get('nav') === 'collapsed') return true;
    }
    return true; // Default to sleek compact gooey dock
  });
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

  // Day 3 Emergency Command Center & Scenario Builder States
  const [isEmergencyPanelOpen, setIsEmergencyPanelOpen] = useState<boolean>(false);
  const [isAgentInspectorOpen, setIsAgentInspectorOpen] = useState<boolean>(false);
  const [isEmergencyScenarioBuilderOpen, setIsEmergencyScenarioBuilderOpen] = useState<boolean>(false);
  const [isGisValidationOpen, setIsGisValidationOpen] = useState<boolean>(false);

  // Day 4 Event Operations Command Center & Resource States
  const [isOperationsCommandCenterOpen, setIsOperationsCommandCenterOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.has('ops');
    }
    return false;
  });
  const [operationsInitialTab, setOperationsInitialTab] = useState<OperationsTabType>('overview');
  const [selectedResourceForInspection, setSelectedResourceForInspection] = useState<EventResource | null>(null);

  // Day 5 AI Intelligence Foundation Copilot States
  const [isAICopilotOpen, setIsAICopilotOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('ai') === 'open';
    }
    return false;
  });
  const [aiCopilotTab, setAiCopilotTab] = useState<'chat' | 'predictions' | 'anomalies' | 'flood' | 'approvals' | 'audit'>('chat');

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
    buildings3D: true,
    osmBuildingFootprints: true,
    custom3DModels: true,
    riverWaterSurface: true,
    eventResources: true,
    operationalZones: true,
    dispatchRoutes: true,
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

  // Subscribe to live crowd and traffic engine metric streams and Cesium interaction callbacks
  useEffect(() => {
    crowdEngine.setOnMetricsUpdate((metrics) => {
      setCrowdMetrics(metrics);
    });
    trafficEngine.setOnMetricsUpdate((metrics) => {
      setTrafficMetrics(metrics);
    });
    cesiumService.setOnResourceSelect((resource) => {
      setSelectedResourceForInspection(resource);
    });
    cesiumService.setOnIncidentSelect((_incident) => {
      setIsOperationsCommandCenterOpen(true);
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
      setIsEmergencyPanelOpen(true);
      setLayers(prev => ({ ...prev, emergencyZones: true }));
      return;
    }
    if (module.id === 'event_ops') {
      setIsOperationsCommandCenterOpen(true);
      setLayers(prev => ({ ...prev, eventResources: true, operationalZones: true }));
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
      setIsEmergencyPanelOpen(true);
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
        onToggleScenarioModal={() => setIsEmergencyScenarioBuilderOpen(true)}
        onToggleEmergencyCommandCenter={() => setIsEmergencyPanelOpen(prev => !prev)}
        isEmergencyCommandCenterOpen={isEmergencyPanelOpen}
        onToggleOperationsCommandCenter={() => setIsOperationsCommandCenterOpen(prev => !prev)}
        isOperationsCommandCenterOpen={isOperationsCommandCenterOpen}
        onToggleAgentInspector={() => setIsAgentInspectorOpen(prev => !prev)}
        isAgentInspectorOpen={isAgentInspectorOpen}
        onToggleGisValidation={() => setIsGisValidationOpen(prev => !prev)}
        isGisValidationOpen={isGisValidationOpen}
        onToggleAICopilot={() => setIsAICopilotOpen(prev => !prev)}
        isAICopilotOpen={isAICopilotOpen}
      />

      {/* Main Body: Gooey Liquid Navigation + Full-Screen Cesium Map Viewport */}
      <div className="relative flex-1 w-full h-[calc(100vh-4rem)] flex overflow-hidden">
        {/* 2. Floating Gooey Liquid Navigation Dock & Expandable Matrix */}
        <GooeyLiquidNav
          activeModule={activeModuleId}
          onSelectModule={handleSelectModule}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
          onOpenOperationsTab={(tab) => {
            setOperationsInitialTab(tab);
            setIsOperationsCommandCenterOpen(true);
            setActiveModuleId('event_ops');
          }}
          onOpenScenarioModal={() => setIsScenarioModalOpen(true)}
          onOpenGisValidation={() => setIsGisValidationOpen(true)}
          onOpenAICopilot={(tab) => {
            setAiCopilotTab(tab || 'chat');
            setIsAICopilotOpen(true);
          }}
        />

        {/* 3. Main Full-Screen Cesium Globe Viewport */}
        <main className="relative flex-1 w-full h-full">
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
            onOpenGisValidation={() => setIsGisValidationOpen(true)}
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

          {/* Day 3 Intelligent Emergency Command Center */}
          <EmergencyCommandCenter
            isOpen={isEmergencyPanelOpen}
            onClose={() => setIsEmergencyPanelOpen(false)}
            onOpenAgentInspector={() => setIsAgentInspectorOpen(true)}
            onOpenScenarioBuilder={() => setIsEmergencyScenarioBuilderOpen(true)}
          />

          {/* Day 3 Selected Agent Inspector */}
          <AgentInspectorModal
            isOpen={isAgentInspectorOpen}
            onClose={() => setIsAgentInspectorOpen(false)}
          />

          {/* Day 3 Multi-Scenario Builder & Comparative Analytics */}
          <EmergencyScenarioBuilder
            isOpen={isEmergencyScenarioBuilderOpen}
            onClose={() => setIsEmergencyScenarioBuilderOpen(false)}
          />

          {/* Day 4 Intelligent Event Operations Command Center */}
          <EventOperationsCommandCenter
            isOpen={isOperationsCommandCenterOpen}
            initialTab={operationsInitialTab}
            onClose={() => setIsOperationsCommandCenterOpen(false)}
            onInspectResource={(res) => setSelectedResourceForInspection(res)}
            onFlyToZone={(zoneId) => cesiumService.flyToZone(zoneId)}
            onFlyToResource={(resourceId) => cesiumService.flyToResource(resourceId)}
          />

          {/* Day 4 Field Resource Detail Inspector */}
          <ResourceInspectorModal
            resource={selectedResourceForInspection}
            isOpen={!!selectedResourceForInspection}
            onClose={() => setSelectedResourceForInspection(null)}
            onFlyToResource={(resourceId) => cesiumService.flyToResource(resourceId)}
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

          {/* GIS Data Quality & WGS84 Validation Audit Modal */}
          <GisValidationModal
            isOpen={isGisValidationOpen}
            onClose={() => setIsGisValidationOpen(false)}
            onSelectLocation={setSelectedLocation}
          />

          {/* Day 5 AI Intelligence Copilot Drawer */}
          <AICopilotDrawer
            isOpen={isAICopilotOpen}
            onClose={() => setIsAICopilotOpen(false)}
            initialTab={aiCopilotTab}
          />
        </main>
      </div>
    </div>
  );
};
