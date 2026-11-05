import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Play, 
  Pause, 
  RotateCcw, 
  DoorOpen, 
  BarChart3, 
  Eye, 
  Download,
  AlertCircle
} from 'lucide-react';
import { FloatingPanel } from '../common/FloatingPanel';
import { emergencyEngine } from '../../services/emergencyDetectionEngine';
import { crowdEngine } from '../../services/crowdSimulation';
import { EmergencyCommandMetrics, EmergencyIncident } from '../../types/emergency';
import { SimulationGate } from '../../types/crowd';

interface EmergencyCommandCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAgentInspector: () => void;
  onOpenScenarioBuilder: () => void;
}

export const EmergencyCommandCenter: React.FC<EmergencyCommandCenterProps> = ({
  isOpen,
  onClose,
  onOpenAgentInspector,
  onOpenScenarioBuilder,
}) => {
  const [metrics, setMetrics] = useState<EmergencyCommandMetrics>({
    activeIncidentCount: 1,
    currentCrowdPopulation: 250,
    totalEvacuatedCount: 0,
    evacuationCompletionPct: 0,
    remainingPopulation: 250,
    assistanceRequiredCount: 22,
    averageReactionDelaySeconds: 2.15,
    averageEvacuationTimeSeconds: 0,
    exitGateUtilization: {},
    maxCrowdDensity: 1.85,
    activeBottlenecksCount: 0,
    emergencyVehiclePriorityActive: true,
    isEmergencyActive: false,
    elapsedEvacuationSeconds: 0,
  });

  const [incidents, setIncidents] = useState<EmergencyIncident[]>([]);
  const [gates, setGates] = useState<SimulationGate[]>([]);
  const [isEmergencyActive, setIsEmergencyActive] = useState<boolean>(false);
  const densityThreshold = 3.2;

  // Subscribe to emergency engine updates
  useEffect(() => {
    emergencyEngine.setOnMetricsUpdate((newMetrics) => {
      setMetrics(newMetrics);
      setIsEmergencyActive(newMetrics.isEmergencyActive);
      setIncidents(emergencyEngine.getIncidents());
      setGates(crowdEngine.getGates());
    });

    setIncidents(emergencyEngine.getIncidents());
    setGates(crowdEngine.getGates());
    setIsEmergencyActive(emergencyEngine.getIsEmergencyActive());
  }, []);

  const handleStartEmergency = () => {
    emergencyEngine.startEmergency();
    setIsEmergencyActive(true);
    setIncidents(emergencyEngine.getIncidents());
    setGates(crowdEngine.getGates());
  };

  const handlePause = () => {
    emergencyEngine.pauseEmergency();
  };

  const handleResume = () => {
    emergencyEngine.resumeEmergency();
  };

  const handleReset = () => {
    emergencyEngine.resetEmergency();
    setIsEmergencyActive(false);
    setIncidents(emergencyEngine.getIncidents());
    setGates(crowdEngine.getGates());
  };

  const handleAcknowledge = (id: string) => {
    emergencyEngine.acknowledgeIncident(id);
    setIncidents(emergencyEngine.getIncidents());
  };

  const handleResolve = (id: string) => {
    emergencyEngine.resolveIncident(id);
    setIncidents(emergencyEngine.getIncidents());
    setGates(crowdEngine.getGates());
  };

  const handleInjectPreset = (presetIndex: number) => {
    emergencyEngine.triggerIncident(presetIndex);
    setIncidents(emergencyEngine.getIncidents());
    setGates(crowdEngine.getGates());
  };

  const handleToggleGate = (gateId: string) => {
    crowdEngine.toggleGate(gateId);
    emergencyEngine.triggerDynamicRerouting();
    setGates(crowdEngine.getGates());
  };

  const handleExportJSON = () => {
    const jsonStr = emergencyEngine.exportScenarioAnalyticsJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `godavari_evac_analytics_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <FloatingPanel
      id="emergency_command_center"
      title="INTELLIGENT EMERGENCY COMMAND CENTER"
      subtitle="Dynamic Incident Detection, Evacuation Routing & Age-Aware Simulation"
      icon={<ShieldAlert className="w-5 h-5 text-rose-400" />}
      isOpen={isOpen}
      onClose={onClose}
      defaultPosition={{ x: 380, y: 76 }}
      defaultSize={{ width: 560, height: 'auto' }}
      minWidth={460}
      maxWidth={720}
      maxHeight={780}
      headerExtra={
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase ${
            isEmergencyActive 
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' 
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          }`}>
            {isEmergencyActive ? 'DRILL ACTIVE' : 'STANDBY'}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] font-mono text-cyan-300 border border-slate-700">
            SIMULATED
          </span>
        </div>
      }
    >
      <div className="space-y-4 text-xs font-sans">
        {/* Safety Disclaimer Banner */}
        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200/90 flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-tight">
            <span className="font-semibold text-amber-300">DEMONSTRATION DIGITAL TWIN:</span> All crowd behavior, reaction times, and evacuation paths are research approximations for the Godavari Pushkar Ghat and do not constitute certified municipal evacuation orders.
          </div>
        </div>

        {/* Master Control Bar */}
        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            {!isEmergencyActive ? (
              <button
                onClick={handleStartEmergency}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs shadow-lg shadow-rose-900/30 transition-colors"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>START EVACUATION DRILL</span>
              </button>
            ) : (
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={handlePause}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs transition-colors"
                  title="Pause Simulation"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </button>
                <button
                  onClick={handleResume}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs transition-colors"
                  title="Resume Simulation"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume</span>
                </button>
              </div>
            )}
            <button
              onClick={handleReset}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs border border-slate-700 transition-colors"
              title="Reset drill to default state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenAgentInspector}
              className="flex items-center space-x-1 px-2 py-1.5 rounded bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60 font-mono text-[11px] transition-colors"
              title="Inspect individual pedestrian agents"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Agent Inspector</span>
            </button>
            <button
              onClick={onOpenScenarioBuilder}
              className="flex items-center space-x-1 px-2 py-1.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60 font-mono text-[11px] transition-colors"
              title="Compare Scenarios A, B, and C"
            >
              <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Scenarios & Analytics</span>
            </button>
          </div>
        </div>

        {/* Live Simulation KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Evacuation Progress */}
          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Evacuation Progress</div>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <span className="text-lg font-mono font-bold text-emerald-400">
                {metrics.evacuationCompletionPct}%
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                ({metrics.totalEvacuatedCount}/{metrics.currentCrowdPopulation})
              </span>
            </div>
            {/* Mini Progress Bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${metrics.evacuationCompletionPct}%` }}
              />
            </div>
          </div>

          {/* Remaining Population */}
          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80">
            <div className="text-[10px] font-mono text-slate-400 uppercase">In Hazard Area</div>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <span className={`text-lg font-mono font-bold ${
                metrics.remainingPopulation > 0 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {metrics.remainingPopulation}
              </span>
              <span className="text-[10px] font-mono text-slate-400">devotees</span>
            </div>
            <div className="text-[9px] font-mono text-slate-400 mt-1">
              Time: {metrics.elapsedEvacuationSeconds}s elapsed
            </div>
          </div>

          {/* Assistance Required */}
          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Requires Assistance</div>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <span className="text-lg font-mono font-bold text-rose-400">
                {metrics.assistanceRequiredCount}
              </span>
              <span className="text-[10px] font-mono text-slate-400">seniors / kids</span>
            </div>
            <div className="text-[9px] font-mono text-slate-400 mt-1">
              Escort priority active
            </div>
          </div>

          {/* Max Density */}
          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Peak Crowd Density</div>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <span className={`text-lg font-mono font-bold ${
                metrics.maxCrowdDensity >= densityThreshold ? 'text-rose-400' : 'text-cyan-400'
              }`}>
                {metrics.maxCrowdDensity}
              </span>
              <span className="text-[10px] font-mono text-slate-400">pax/m²</span>
            </div>
            <div className="text-[9px] font-mono text-slate-400 mt-1">
              Limit: {densityThreshold} pax/m²
            </div>
          </div>
        </div>

        {/* Exit Gates Real-time Throughput & Dynamic Toggles */}
        <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-slate-200">
              <DoorOpen className="w-4 h-4 text-cyan-400" />
              <span>EVACUATION EXITS & FLOW THROUGHPUT (SIMULATED)</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Click gate to toggle blockage</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {gates.map(gate => {
              const util = metrics.exitGateUtilization[gate.id];
              const isBlocked = !gate.isOpen;
              return (
                <div 
                  key={gate.id}
                  onClick={() => handleToggleGate(gate.id)}
                  className={`p-2 rounded border cursor-pointer transition-all ${
                    isBlocked 
                      ? 'bg-rose-950/40 border-rose-800/60 hover:bg-rose-950/60' 
                      : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold text-[11px] text-slate-200 truncate">
                      {gate.name}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                      isBlocked ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {isBlocked ? 'BLOCKED' : 'OPEN'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1">
                    <span>Assigned: {util?.throughput ?? 0} devotees</span>
                    <span>Cap: {gate.capacityPerHour.toLocaleString()} /hr</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Incident Triage & Live Monitoring */}
        <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-slate-200">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>DYNAMIC INCIDENT MONITOR ({incidents.filter(i => i.status !== 'RESOLVED').length} Active)</span>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleInjectPreset(0)}
                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-amber-300 border border-slate-700"
                title="Inject Electrical Fire incident"
              >
                + Fire
              </button>
              <button
                onClick={() => handleInjectPreset(1)}
                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-cyan-300 border border-slate-700"
                title="Inject River Flood Surge incident"
              >
                + Flood
              </button>
              <button
                onClick={() => handleInjectPreset(3)}
                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-rose-300 border border-slate-700"
                title="Inject Gate Congestion incident"
              >
                + Gate Jam
              </button>
            </div>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {incidents.length === 0 ? (
              <div className="text-center py-4 text-slate-400 font-mono text-[11px]">
                No active incidents detected. Pushkar Ghat perimeter clear.
              </div>
            ) : (
              incidents.map(inc => {
                let badgeBg = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
                if (inc.severity === 'HIGH') badgeBg = 'bg-orange-500/20 text-orange-300 border-orange-500/40';
                if (inc.severity === 'MODERATE') badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/40';

                return (
                  <div 
                    key={inc.id}
                    className="p-2 rounded bg-slate-950/60 border border-slate-800 flex flex-col space-y-1"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${badgeBg}`}>
                            {inc.severity}
                          </span>
                          <span className="font-mono font-bold text-[11px] text-slate-100">
                            {inc.title}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                          {inc.description}
                        </p>
                      </div>

                      <div className="flex flex-col items-end space-y-1 shrink-0">
                        <span className="text-[9px] font-mono text-slate-400">
                          {inc.timestamp}
                        </span>
                        {inc.status === 'ACTIVE' && (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleAcknowledge(inc.id)}
                              className="px-1.5 py-0.5 rounded bg-amber-900/60 hover:bg-amber-800 text-amber-200 text-[9px] font-mono"
                            >
                              Ack
                            </button>
                            <button
                              onClick={() => handleResolve(inc.id)}
                              className="px-1.5 py-0.5 rounded bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 text-[9px] font-mono"
                            >
                              Resolve
                            </button>
                          </div>
                        )}
                        {inc.status === 'ACKNOWLEDGED' && (
                          <button
                            onClick={() => handleResolve(inc.id)}
                            className="px-1.5 py-0.5 rounded bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 text-[9px] font-mono"
                          >
                            Resolve
                          </button>
                        )}
                        {inc.status === 'RESOLVED' && (
                          <span className="text-[9px] font-mono text-slate-400">
                            RESOLVED
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Data Export */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-[10px] font-mono text-slate-400">
            Emergency Vehicle Access Corridor: <span className="text-emerald-400 font-bold">CLEAR & ACTIVE</span>
          </div>
          <button
            onClick={handleExportJSON}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] border border-slate-700 transition-colors"
          >
            <Download className="w-3 h-3 text-cyan-400" />
            <span>Export Drill Log (JSON)</span>
          </button>
        </div>
      </div>
    </FloatingPanel>
  );
};
