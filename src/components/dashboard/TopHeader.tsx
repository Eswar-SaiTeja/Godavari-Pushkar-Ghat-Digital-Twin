import React from 'react';
import { 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Layers, 
  Activity, 
  Clock, 
  Menu, 
  Sparkles, 
  Database, 
  Radio,
  CheckCircle2,
  Users,
  Car,
  BarChart3,
  ShieldAlert,
  User,
  LayoutGrid
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { SimulationMode } from '../../types/simulation';
import { hudPositionManager } from '../../services/hudPositionManager';

interface TopHeaderProps {
  simulationTime: Date;
  simulationMode: SimulationMode;
  onSimulationModeChange: (mode: SimulationMode) => void;
  onResetMap: () => void;
  onToggleLayersPanel: () => void;
  isLayersPanelOpen: boolean;
  onToggleSidebar: () => void;
  terrainStatusMessage: string;
  onToggleCrowdPanel?: () => void;
  isCrowdPanelOpen?: boolean;
  onToggleTrafficPanel?: () => void;
  isTrafficPanelOpen?: boolean;
  onToggleScenarioModal?: () => void;
  onToggleEmergencyCommandCenter?: () => void;
  isEmergencyCommandCenterOpen?: boolean;
  onToggleOperationsCommandCenter?: () => void;
  isOperationsCommandCenterOpen?: boolean;
  onToggleAgentInspector?: () => void;
  isAgentInspectorOpen?: boolean;
  onToggleGisValidation?: () => void;
  isGisValidationOpen?: boolean;
  onToggleAICopilot?: () => void;
  isAICopilotOpen?: boolean;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  simulationTime,
  simulationMode,
  onSimulationModeChange,
  onResetMap,
  onToggleLayersPanel,
  isLayersPanelOpen,
  onToggleSidebar,
  terrainStatusMessage,
  onToggleCrowdPanel,
  isCrowdPanelOpen,
  onToggleTrafficPanel,
  isTrafficPanelOpen,
  onToggleScenarioModal,
  onToggleEmergencyCommandCenter,
  isEmergencyCommandCenterOpen,
  onToggleOperationsCommandCenter,
  isOperationsCommandCenterOpen,
  onToggleAgentInspector,
  isAgentInspectorOpen,
  onToggleGisValidation,
  isGisValidationOpen,
  onToggleAICopilot,
  isAICopilotOpen,
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState<boolean>(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.warn('Error attempting to enable fullscreen:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        });
      }
    }
  };

  React.useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const formatIST = (date: Date) => {
    return date.toLocaleTimeString('en-IN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <header className="h-16 w-full glass-panel border-b border-cyan-500/20 px-3 md:px-5 flex items-center justify-between z-30 select-none shadow-lg">
      {/* Left: Mobile trigger & Project Branding */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-cyan-400 border border-cyan-500/30 transition-colors lg:hidden focus:outline-none"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 via-blue-600/30 to-slate-900 border border-cyan-400/40 shadow-glow-sm">
            <Radio className="w-5 h-5 text-cyan-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-base font-bold tracking-wider text-slate-100 uppercase font-sans">
                Godavari Pushkar Ghat
              </h1>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-widest text-cyan-300 bg-cyan-950/80 border border-cyan-500/30 rounded">
                3D DIGITAL TWIN
              </span>
            </div>
            <p className="text-[10px] md:text-xs text-slate-400 flex items-center gap-1.5 font-mono">
              <span className="text-cyan-400 font-medium">Rajamahendravaram</span>
              <span>•</span>
              <span className="text-slate-300">AP, India</span>
              <span className="hidden md:inline text-slate-500">|</span>
              <span className="hidden md:inline text-emerald-400 font-semibold">17.0084° N, 81.7669° E [VERIFIED]</span>
            </p>
          </div>
        </div>
      </div>

      {/* Middle: Simulation Scenario Selector & DEM Badge */}
      <div className="hidden lg:flex items-center gap-3">
        {/* Terrain Provider Status */}
        <div 
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900/90 border border-slate-700/60 text-[11px] font-mono text-slate-300 cursor-help"
          title={terrainStatusMessage}
        >
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">TERRAIN:</span>
          <span className="text-cyan-300 font-semibold truncate max-w-[210px]">
            WGS84 Ellipsoid (Active Fallback)
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping-slow"></span>
        </div>

        {/* Scenario Mode Dropdown */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900/90 border border-cyan-500/30 text-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <label htmlFor="sim-mode" className="text-[11px] font-mono text-slate-400 uppercase">
            Mode:
          </label>
          <select
            id="sim-mode"
            value={simulationMode}
            onChange={(e) => onSimulationModeChange(e.target.value as SimulationMode)}
            className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer pr-1"
          >
            <option value="LIVE_OVERVIEW" className="bg-slate-900 text-slate-200">
              Overview (Baseline)
            </option>
            <option value="PUSHKARAM_PEAK" className="bg-slate-900 text-slate-200">
              Pushkaram Peak Day (Simulated)
            </option>
            <option value="MONSOON_FLOOD" className="bg-slate-900 text-slate-200">
              Monsoon Surge (Simulated)
            </option>
            <option value="EMERGENCY_EVAC" className="bg-slate-900 text-slate-200">
              Evacuation Drill (Simulated)
            </option>
            <option value="VIP_MOVEMENT" className="bg-slate-900 text-slate-200">
              VIP Egress Corridor (Simulated)
            </option>
          </select>
          <Badge variant="amber" size="sm">DEMO</Badge>
        </div>
      </div>

      {/* Right: Clock, Telemetry Status & Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Live Simulation Clock */}
        <div className="flex flex-col items-end px-2 py-0.5 rounded bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs md:text-sm font-mono font-bold text-cyan-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{formatIST(simulationTime)}</span>
            <span className="text-[10px] text-slate-400">IST</span>
          </div>
          <span className="text-[9px] text-slate-400 font-mono hidden sm:inline">
            {formatDate(simulationTime)}
          </span>
        </div>

        {/* Engine Status */}
        <div className="hidden xl:flex items-center gap-1.5">
          <Badge variant="emerald" pulse>
            <Activity className="w-3 h-3" />
            CESIUM 3D ONLINE
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {onToggleAICopilot && (
            <button
              onClick={onToggleAICopilot}
              className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
                isAICopilotOpen 
                  ? 'bg-purple-500/20 text-purple-300 border-purple-400/60 shadow-glow-sm' 
                  : 'bg-slate-800/80 text-purple-300 border-purple-500/30 hover:bg-purple-950/40 hover:border-purple-400/60'
              }`}
              title="Toggle Day 5 AI Intelligence Copilot"
            >
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              <span className="hidden lg:inline font-mono font-semibold">JARVIS Copilot</span>
            </button>
          )}

          {onToggleOperationsCommandCenter && (
            <button
              onClick={onToggleOperationsCommandCenter}
              className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
                isOperationsCommandCenterOpen 
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60 shadow-glow-sm' 
                  : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:text-cyan-400 hover:border-cyan-500/40'
              }`}
              title="Toggle Day 4 Event Operations Command Center"
            >
              <Radio className="w-4 h-4 text-cyan-400" />
              <span className="hidden lg:inline font-mono font-semibold">Operations</span>
            </button>
          )}

          {onToggleEmergencyCommandCenter && (
            <button
              onClick={onToggleEmergencyCommandCenter}
              className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
                isEmergencyCommandCenterOpen 
                  ? 'bg-rose-500/20 text-rose-300 border-rose-400/60 shadow-glow-sm animate-pulse' 
                  : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:text-rose-400 hover:border-rose-500/40'
              }`}
              title="Toggle Intelligent Emergency Command Center"
            >
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span className="hidden lg:inline font-mono font-semibold">Evacuation</span>
            </button>
          )}

          {onToggleAgentInspector && (
            <button
              onClick={onToggleAgentInspector}
              className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
                isAgentInspectorOpen 
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60 shadow-glow-sm' 
                  : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:text-cyan-400 hover:border-cyan-500/40'
              }`}
              title="Inspect Individual Pedestrian Agents"
            >
              <User className="w-4 h-4 text-cyan-400" />
              <span className="hidden lg:inline font-mono font-semibold">Agent</span>
            </button>
          )}

          {onToggleCrowdPanel && (
            <button
              onClick={onToggleCrowdPanel}
              className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
                isCrowdPanelOpen 
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60 shadow-glow-sm' 
                  : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:text-cyan-400 hover:border-cyan-500/40'
              }`}
              title="Toggle Crowd Simulation Controls"
            >
              <Users className="w-4 h-4 text-cyan-400" />
              <span className="hidden lg:inline font-mono font-semibold">Crowd</span>
            </button>
          )}

          {onToggleTrafficPanel && (
            <button
              onClick={onToggleTrafficPanel}
              className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
                isTrafficPanelOpen 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60 shadow-glow-sm' 
                  : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:text-emerald-400 hover:border-emerald-500/40'
              }`}
              title="Toggle Traffic Simulation Controls"
            >
              <Car className="w-4 h-4 text-emerald-400" />
              <span className="hidden lg:inline font-mono font-semibold">Traffic</span>
            </button>
          )}

          {onToggleScenarioModal && (
            <button
              onClick={onToggleScenarioModal}
              className="p-2 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60 hover:text-amber-400 hover:border-amber-500/40 transition-colors flex items-center gap-1.5 text-xs"
              title="Compare Evacuation Scenarios"
            >
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span className="hidden lg:inline font-mono font-semibold">Scenarios</span>
            </button>
          )}

          {onToggleGisValidation && (
            <button
              onClick={onToggleGisValidation}
              className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
                isGisValidationOpen 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60 shadow-glow-sm' 
                  : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:text-emerald-400 hover:border-emerald-500/40'
              }`}
              title="Open GIS Data Quality & WGS84 Accuracy Audit Panel"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="hidden xl:inline font-mono font-semibold">GIS Audit</span>
            </button>
          )}

          <button
            onClick={onToggleLayersPanel}
            className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
              isLayersPanelOpen 
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60 shadow-glow-sm' 
                : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:text-cyan-400 hover:border-cyan-500/40'
            }`}
            title="Toggle GIS Layers Panel"
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline font-mono font-semibold">Layers</span>
          </button>

          <button
            onClick={() => hudPositionManager.resetAllPositions()}
            className="p-2 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60 hover:text-amber-400 hover:border-amber-500/40 transition-colors flex items-center gap-1.5 text-xs"
            title="Reset All Floating HUD Panels to Default Layout"
          >
            <LayoutGrid className="w-4 h-4 text-amber-400" />
            <span className="hidden 2xl:inline font-mono font-semibold">Reset HUDs</span>
          </button>

          <button
            onClick={onResetMap}
            className="p-2 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
            title="Reset Map to Pushkar Ghat"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
