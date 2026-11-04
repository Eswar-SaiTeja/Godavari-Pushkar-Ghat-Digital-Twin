import React, { useState } from 'react';
import { 
  Users, 
  Play, 
  Pause, 
  RotateCcw, 
  AlertTriangle, 
  ShieldAlert, 
  Filter, 
  Sliders, 
  DoorOpen, 
  DoorClosed,
  CheckCircle2
} from 'lucide-react';
import { AgeGroup, AgentDisplayFilter } from '../../types/crowd';
import { crowdEngine } from '../../services/crowdSimulation';
import { FloatingPanel } from '../common/FloatingPanel';

interface CrowdControlsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isRunning: boolean;
  onTogglePlayPause: () => void;
  onReset: () => void;
  isEmergencyAlert: boolean;
  onTriggerAlert: () => void;
  onClearAlert: () => void;
}

export const CrowdControlsPanel: React.FC<CrowdControlsPanelProps> = ({
  isOpen,
  onClose,
  isRunning,
  onTogglePlayPause,
  onReset,
  isEmergencyAlert,
  onTriggerAlert,
  onClearAlert,
}) => {
  const [activeTab, setActiveTab] = useState<'AGE_GROUPS' | 'GATES' | 'FILTER'>('AGE_GROUPS');
  const [activeFilter, setActiveFilter] = useState<AgentDisplayFilter>('ALL');
  const [ageProfiles, setAgeProfiles] = useState(crowdEngine.getAgeProfiles());
  const [gates, setGates] = useState(crowdEngine.getGates());

  if (!isOpen) return null;

  const handleSpeedChange = (group: AgeGroup, speed: number) => {
    crowdEngine.updateAgeProfile(group, { baseSpeed: speed });
    setAgeProfiles(crowdEngine.getAgeProfiles());
  };

  const handleReactionDelayChange = (group: AgeGroup, maxDelay: number) => {
    const current = ageProfiles[group];
    crowdEngine.updateAgeProfile(group, { reactionDelayRange: [current.reactionDelayRange[0], maxDelay] });
    setAgeProfiles(crowdEngine.getAgeProfiles());
  };

  const handleGateToggle = (gateId: string) => {
    crowdEngine.toggleGate(gateId);
    setGates(crowdEngine.getGates());
  };

  const handleFilterSelect = (filter: AgentDisplayFilter) => {
    setActiveFilter(filter);
    crowdEngine.setDisplayFilter(filter);
  };

  return (
    <FloatingPanel
      id="crowd_controls_panel"
      title="Crowd Simulation & Age Behaviour"
      subtitle="Pedestrian Dynamics • DEMO Mode"
      icon={<Users className="w-4 h-4 text-cyan-400" />}
      defaultPosition={{ x: 20, y: 76 }}
      defaultSize={{ width: 360, height: 'auto' }}
      minWidth={300}
      maxWidth={520}
      maxHeight={740}
      isOpen={isOpen}
      onClose={onClose}
      resizable={true}
    >
      {/* Simulation Master Controls Bar */}
      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/80 border border-slate-800 mb-3">
        <button
          onClick={onTogglePlayPause}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all ${
            isRunning
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
          }`}
        >
          {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {isRunning ? 'Pause Agents' : 'Run Simulation'}
        </button>

        <button
          onClick={onReset}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
          title="Reset Crowd Agents (Deterministic Seed 42)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={isEmergencyAlert ? onClearAlert : onTriggerAlert}
          className={`py-1.5 px-3 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
            isEmergencyAlert
              ? 'bg-rose-600 text-white animate-pulse shadow-glow-rose'
              : 'bg-rose-950/60 text-rose-300 border border-rose-500/40 hover:bg-rose-900/40'
          }`}
          title="Trigger Auspicious Ghat Evacuation Siren"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          {isEmergencyAlert ? 'CLEAR ALERT' : 'EMERGENCY ALERT'}
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center border-b border-slate-800 mb-3 text-[11px] font-mono">
        <button
          onClick={() => setActiveTab('AGE_GROUPS')}
          className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'AGE_GROUPS'
              ? 'border-cyan-400 text-cyan-300 font-bold bg-cyan-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" /> Age Profiles
        </button>
        <button
          onClick={() => setActiveTab('GATES')}
          className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'GATES'
              ? 'border-cyan-400 text-cyan-300 font-bold bg-cyan-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <DoorOpen className="w-3.5 h-3.5" /> Gates ({gates.filter(g => g.isOpen).length}/4)
        </button>
        <button
          onClick={() => setActiveTab('FILTER')}
          className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'FILTER'
              ? 'border-cyan-400 text-cyan-300 font-bold bg-cyan-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Filter className="w-3.5 h-3.5" /> Filter Display
        </button>
      </div>

      {/* Tab 1: Age Groups Management */}
      {activeTab === 'AGE_GROUPS' && (
        <div className="space-y-3">
          {(Object.keys(ageProfiles) as AgeGroup[]).map((groupKey) => {
            const profile = ageProfiles[groupKey];
            return (
              <div
                key={groupKey}
                className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/90 space-y-2 font-mono text-[11px]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: profile.color }}
                    />
                    <span className="font-bold text-slate-200">{profile.label}</span>
                  </div>
                  <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
                    {Math.round(profile.defaultProportion * 100)}% Fleet
                  </span>
                </div>

                {/* Speed Slider */}
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                    <span>Walking Speed:</span>
                    <span className="text-cyan-300 font-bold">{profile.baseSpeed.toFixed(2)} m/s</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.05"
                    value={profile.baseSpeed}
                    onChange={(e) => handleSpeedChange(groupKey, parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                {/* Reaction Delay Slider */}
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                    <span>Reaction Delay (Max):</span>
                    <span className="text-amber-300 font-bold">{profile.reactionDelayRange[1].toFixed(1)}s</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="10.0"
                    step="0.5"
                    value={profile.reactionDelayRange[1]}
                    onChange={(e) => handleReactionDelayChange(groupKey, parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Gates Configuration */}
      {activeTab === 'GATES' && (
        <div className="space-y-2">
          {gates.map((gate) => (
            <div
              key={gate.id}
              className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                gate.isOpen
                  ? 'bg-slate-900/90 border-cyan-500/30'
                  : 'bg-slate-950/60 border-slate-800 opacity-60'
              }`}
            >
              <div>
                <div className="text-xs font-mono font-bold text-slate-200">
                  {gate.name}
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                  Type: {gate.type} • Flow: {gate.currentFlowRatePerMin} pax/min
                </div>
              </div>

              <button
                onClick={() => handleGateToggle(gate.id)}
                className={`py-1 px-2.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition-all ${
                  gate.isOpen
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                }`}
              >
                {gate.isOpen ? <DoorOpen className="w-3.5 h-3.5" /> : <DoorClosed className="w-3.5 h-3.5" />}
                {gate.isOpen ? 'OPEN' : 'CLOSED'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Display Filters */}
      {activeTab === 'FILTER' && (
        <div className="space-y-1.5 font-mono text-xs">
          {[
            { id: 'ALL', label: 'All Pedestrians (Full Crowd)', desc: 'Show all 4 age categories' },
            { id: 'CHILDREN', label: 'Children Only (5–12 yrs)', desc: 'Amber markers • Group followers' },
            { id: 'YOUNG', label: 'Young Only (13–35 yrs)', desc: 'Cyan markers • Fast walkers' },
            { id: 'ADULTS', label: 'Adults Only (36–59 yrs)', desc: 'Blue markers • Standard pacing' },
            { id: 'SENIORS', label: 'Seniors Only (60+ yrs)', desc: 'Purple markers • Assisted speed' },
            { id: 'ASSISTANCE_REQUIRED', label: 'Assistance Required Only', desc: 'Red markers • High priority' },
          ].map((item) => {
            const isSelected = activeFilter === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleFilterSelect(item.id as AgentDisplayFilter)}
                className={`w-full p-2 rounded-lg text-left transition-all border flex items-center justify-between ${
                  isSelected
                    ? 'bg-cyan-950/80 text-cyan-300 border-cyan-400/60 shadow-glow-sm'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div>
                  <div className="font-semibold text-xs">{item.label}</div>
                  <div className="text-[10px] text-slate-400">{item.desc}</div>
                </div>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Simulated Footer Disclaimer */}
      <div className="mt-3 p-2 rounded-lg bg-amber-950/30 border border-amber-500/30 flex items-start gap-1.5 text-[9px] text-amber-300/90 font-mono">
        <AlertTriangle className="w-3 h-3 flex-shrink-0 text-amber-400 mt-0.5" />
        <span>SIMULATED PROFILES: Synthetic cellular mobility models for demonstration and GIS scenario planning only.</span>
      </div>
    </FloatingPanel>
  );
};
