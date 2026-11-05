import React, { useState, useEffect } from 'react';
import { 
  User, 
  MapPin, 
  Clock, 
  Navigation, 
  Search, 
  Compass, 
  Activity, 
  Zap
} from 'lucide-react';
import { FloatingPanel } from '../common/FloatingPanel';
import { crowdEngine } from '../../services/crowdSimulation';
import { cesiumService } from '../../services/cesiumService';
import { PedestrianAgent } from '../../types/crowd';

interface AgentInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AgentInspectorModal: React.FC<AgentInspectorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedAgent, setSelectedAgent] = useState<PedestrianAgent | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'SENIORS' | 'CHILDREN' | 'ASSISTANCE'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Update selected agent telemetry every 200ms
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      const current = crowdEngine.getSelectedAgent();
      if (current) {
        setSelectedAgent({ ...current });
      } else {
        // Fallback to first available agent if none selected
        const all = crowdEngine.getAllAgents();
        if (all.length > 0 && !selectedAgent) {
          crowdEngine.selectAgent(all[0].id);
          setSelectedAgent({ ...all[0] });
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleSelectAgent = (agentId: string) => {
    crowdEngine.selectAgent(agentId);
    const agent = crowdEngine.getSelectedAgent();
    if (agent) {
      setSelectedAgent({ ...agent });
    }
  };

  const handleFocusCamera = () => {
    if (!selectedAgent || !cesiumService.viewer) return;
    cesiumService.viewer.camera.flyTo({
      destination: (window as any).Cesium?.Cartesian3.fromDegrees(
        selectedAgent.position.longitude,
        selectedAgent.position.latitude,
        selectedAgent.position.height + 65
      ),
      duration: 1.2,
    });
  };

  // Filter agents list for selection
  const allAgents = crowdEngine.getAllAgents();
  const filteredAgents = allAgents.filter(a => {
    if (searchQuery.trim() !== '') {
      if (!a.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    }
    if (filterType === 'SENIORS') return a.ageGroup === 'SENIORS';
    if (filterType === 'CHILDREN') return a.ageGroup === 'CHILDREN';
    if (filterType === 'ASSISTANCE') return a.requiresAssistance;
    return true;
  });

  return (
    <FloatingPanel
      id="agent_inspector_modal"
      title="SIMULATED PEDESTRIAN AGENT INSPECTOR"
      subtitle="Age-Aware Individual Telemetry, Behavior States & Reaction Profiling"
      icon={<User className="w-5 h-5 text-cyan-400" />}
      isOpen={isOpen}
      onClose={onClose}
      defaultPosition={{ x: 420, y: 110 }}
      defaultSize={{ width: 480, height: 'auto' }}
      minWidth={420}
      maxWidth={620}
      maxHeight={740}
      headerExtra={
        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] font-mono text-cyan-300 border border-slate-700">
          SIMULATED AGENTS
        </span>
      }
    >
      <div className="space-y-3.5 text-xs font-sans">
        {/* Agent Selector & Quick Filters */}
        <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center space-x-1.5">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by Agent ID (e.g. ped_agent_42)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-slate-950/80 border border-slate-700/80 rounded px-2 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center space-x-1">
            {(['ALL', 'SENIORS', 'CHILDREN', 'ASSISTANCE'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  filterType === f
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                }`}
              >
                {f}
              </button>
            ))}
            <span className="text-[10px] font-mono text-slate-400 ml-auto">
              ({filteredAgents.length} agents)
            </span>
          </div>

          {/* Quick select dropdown */}
          <select
            value={selectedAgent?.id || ''}
            onChange={(e) => handleSelectAgent(e.target.value)}
            className="w-full bg-slate-950/90 border border-slate-700 rounded px-2 py-1.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            {filteredAgents.slice(0, 100).map(a => (
              <option key={a.id} value={a.id}>
                {a.id} • [{a.ageGroup}] • State: {a.behaviorState} {a.requiresAssistance ? '(Assistance Needed)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Agent Telemetry Dossier */}
        {selectedAgent ? (
          <div className="space-y-3">
            {/* Header Identity Card */}
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono font-bold text-white">
                    Agent {selectedAgent.id.replace('ped_agent_', '#')}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    selectedAgent.ageGroup === 'SENIORS' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                    selectedAgent.ageGroup === 'CHILDREN' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                    selectedAgent.ageGroup === 'YOUNG' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' :
                    'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  }`}>
                    {selectedAgent.ageGroup}
                  </span>
                  {selectedAgent.requiresAssistance && (
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-mono font-bold">
                      ASSISTANCE REQUIRED
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-1">
                  Group ID: {selectedAgent.groupId || 'Independent Devotee'}
                </div>
              </div>

              <button
                onClick={handleFocusCamera}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-bold text-xs transition-colors shadow-lg shadow-cyan-900/20"
                title="Fly Cesium camera to 3D position"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Fly to Agent</span>
              </button>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 gap-2">
              {/* Behavior State */}
              <div className="p-2.5 rounded bg-slate-900/70 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center space-x-1">
                  <Activity className="w-3 h-3 text-cyan-400" />
                  <span>Behavior State</span>
                </div>
                <div className="font-mono font-bold text-xs mt-1 text-slate-100 flex items-center space-x-1.5">
                  <span className={`w-2 h-2 rounded-full ${
                    selectedAgent.behaviorState === 'EVACUATED' ? 'bg-emerald-400' :
                    selectedAgent.behaviorState === 'EVACUATING' ? 'bg-cyan-400 animate-pulse' :
                    selectedAgent.behaviorState === 'NEEDS_ASSISTANCE' ? 'bg-rose-400 animate-ping' :
                    selectedAgent.behaviorState === 'REACTING' ? 'bg-amber-400' :
                    'bg-slate-400'
                  }`} />
                  <span>{selectedAgent.behaviorState}</span>
                </div>
              </div>

              {/* Walking Speed */}
              <div className="p-2.5 rounded bg-slate-900/70 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center space-x-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Current Speed</span>
                </div>
                <div className="font-mono font-bold text-xs mt-1 text-slate-100">
                  {selectedAgent.speed.toFixed(2)} m/s{' '}
                  <span className="text-[10px] font-normal text-slate-400">
                    (Target: {selectedAgent.targetSpeed.toFixed(2)})
                  </span>
                </div>
              </div>

              {/* Reaction Delay */}
              <div className="p-2.5 rounded bg-slate-900/70 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-rose-400" />
                  <span>Reaction Delay</span>
                </div>
                <div className="font-mono font-bold text-xs mt-1 text-slate-100">
                  {selectedAgent.reactionDelaySeconds.toFixed(2)} s
                </div>
                <div className="text-[9px] font-mono text-slate-400 mt-0.5">
                  Elapsed: {selectedAgent.elapsedSinceAlert.toFixed(1)}s
                </div>
              </div>

              {/* Assigned Exit */}
              <div className="p-2.5 rounded bg-slate-900/70 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center space-x-1">
                  <Navigation className="w-3 h-3 text-emerald-400" />
                  <span>Assigned Exit</span>
                </div>
                <div className="font-mono font-bold text-[11px] mt-1 text-slate-100 truncate">
                  {selectedAgent.assignedExitId || 'Pending Assignment'}
                </div>
              </div>
            </div>

            {/* Position & Evacuation Status */}
            <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1.5 font-mono text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center space-x-1">
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  <span>Coordinates (WGS84):</span>
                </span>
                <span className="text-slate-200">
                  {selectedAgent.position.longitude.toFixed(6)}°E, {selectedAgent.position.latitude.toFixed(6)}°N
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center space-x-1">
                  <Activity className="w-3 h-3 text-emerald-400" />
                  <span>Ground Elevation:</span>
                </span>
                <span className="text-slate-200">
                  {selectedAgent.position.height.toFixed(1)} m MSL (SIMULATED)
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                <span className="text-slate-400">Evacuation Status:</span>
                <span className={`font-bold ${selectedAgent.isEvacuated ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {selectedAgent.isEvacuated ? `EVACUATED (${selectedAgent.evacuationTimeSeconds}s)` : 'IN HAZARD ZONE'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 font-mono text-xs">
            No agent currently selected. Select an agent from the dropdown above or click on a moving agent on the Cesium map.
          </div>
        )}
      </div>
    </FloatingPanel>
  );
};
