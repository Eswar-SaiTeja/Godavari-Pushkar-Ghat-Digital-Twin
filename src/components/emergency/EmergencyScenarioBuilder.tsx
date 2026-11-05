import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Play, 
  FileText, 
  Download
} from 'lucide-react';
import { FloatingPanel } from '../common/FloatingPanel';
import { emergencyEngine } from '../../services/emergencyDetectionEngine';
import { crowdEngine } from '../../services/crowdSimulation';

interface EmergencyScenarioBuilderProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyScenarioBuilder: React.FC<EmergencyScenarioBuilderProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'SCENARIOS' | 'TIMELINE' | 'EXPORT'>('SCENARIOS');
  const [activeScenario, setActiveScenario] = useState<'A' | 'B' | 'C' | null>(null);
  const [timelineLog, setTimelineLog] = useState<Array<{ id: string; timestamp: string; type: string; message: string }>>([]);
  const [simMetrics, setSimMetrics] = useState({
    evacuated: 0,
    total: 250,
    elapsed: 0,
    completionPct: 0,
  });

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      const agents = crowdEngine.getAllAgents();
      const evacuated = agents.filter(a => a.isEvacuated).length;
      const total = agents.length;
      setTimelineLog(emergencyEngine.getHistoryLog());
      setSimMetrics({
        evacuated,
        total,
        elapsed: crowdEngine.getAlertDurationSeconds(),
        completionPct: total > 0 ? Number(((evacuated / total) * 100).toFixed(1)) : 0,
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleLaunchScenario = (sc: 'A' | 'B' | 'C') => {
    setActiveScenario(sc);
    emergencyEngine.loadScenario(sc, { population: 250, seed: 101 });
    setTimelineLog(emergencyEngine.getHistoryLog());
  };

  const handleExportJSON = () => {
    const jsonStr = emergencyEngine.exportScenarioAnalyticsJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `godavari_scenario_analytics_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const csvStr = emergencyEngine.exportScenarioAnalyticsCSV();
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `godavari_scenario_data_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <FloatingPanel
      id="emergency_scenario_builder"
      title="EMERGENCY SCENARIO COMPARISON & ANALYTICS ENGINE"
      subtitle="Deterministic Multi-Route Egress Evaluation • Scenarios A, B & C"
      icon={<BarChart3 className="w-5 h-5 text-indigo-400" />}
      isOpen={isOpen}
      onClose={onClose}
      defaultPosition={{ x: 340, y: 88 }}
      defaultSize={{ width: 580, height: 'auto' }}
      minWidth={480}
      maxWidth={760}
      maxHeight={780}
      headerExtra={
        <div className="flex items-center space-x-1.5">
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] font-mono text-cyan-300 border border-slate-700">
            DETERMINISTIC EVALUATION
          </span>
        </div>
      }
    >
      <div className="space-y-3.5 text-xs font-sans">
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('SCENARIOS')}
            className={`px-3 py-1.5 rounded font-mono text-xs transition-colors ${
              activeTab === 'SCENARIOS'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Scenario Matrix (A / B / C)
          </button>
          <button
            onClick={() => setActiveTab('TIMELINE')}
            className={`px-3 py-1.5 rounded font-mono text-xs transition-colors ${
              activeTab === 'TIMELINE'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Incident Timeline Log
          </button>
          <button
            onClick={() => setActiveTab('EXPORT')}
            className={`px-3 py-1.5 rounded font-mono text-xs transition-colors ${
              activeTab === 'EXPORT'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Data & Report Export
          </button>
        </div>

        {/* Tab 1: Scenarios Matrix */}
        {activeTab === 'SCENARIOS' && (
          <div className="space-y-3">
            <div className="text-[11px] text-slate-300 leading-snug">
              Compare evacuation performance using <span className="font-mono text-cyan-300 font-bold">identical initial population (250 devotees)</span> and fixed PRNG seed <span className="font-mono text-amber-300 font-bold">(Seed: 101)</span> to isolate the impact of gate closures and hazard blockages.
            </div>

            {/* Scenario Cards */}
            <div className="grid grid-cols-1 gap-2.5">
              {/* Scenario A */}
              <div className={`p-3 rounded-lg border transition-all ${
                activeScenario === 'A'
                  ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-950/20'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold text-[10px]">
                        SCENARIO A
                      </span>
                      <span className="font-mono font-bold text-slate-100 text-xs">
                        Optimal Evacuation – All 4 Exits Functional
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Pushkar Main Gate, Kotilingala North, Markandeya South, and Arts College Emergency Gate fully operational. Unrestricted crowd distribution.
                    </p>
                  </div>
                  <button
                    onClick={() => handleLaunchScenario('A')}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs shrink-0 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Run Drill A</span>
                  </button>
                </div>
              </div>

              {/* Scenario B */}
              <div className={`p-3 rounded-lg border transition-all ${
                activeScenario === 'B'
                  ? 'bg-amber-950/40 border-amber-500/60 shadow-lg shadow-amber-950/20'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold text-[10px]">
                        SCENARIO B
                      </span>
                      <span className="font-mono font-bold text-slate-100 text-xs">
                        Partial Blockage – Pushkar Main Gate Closed
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Simulated electrical fire obstructs South Concourse and Pushkar Main Gate. Dynamic A* reroutes ~85 devotees north towards Kotilingala and east towards Arts College.
                    </p>
                  </div>
                  <button
                    onClick={() => handleLaunchScenario('B')}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-mono font-bold text-xs shrink-0 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Run Drill B</span>
                  </button>
                </div>
              </div>

              {/* Scenario C */}
              <div className={`p-3 rounded-lg border transition-all ${
                activeScenario === 'C'
                  ? 'bg-rose-950/40 border-rose-500/60 shadow-lg shadow-rose-950/20'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono font-bold text-[10px]">
                        SCENARIO C
                      </span>
                      <span className="font-mono font-bold text-slate-100 text-xs">
                        Critical Emergency – Flood Surge & Barrier Breach
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Simulated Godavari flood surge submerges lower steps, barrier failure blocks promenade. Severe bottleneck with elevated senior & children assistance needs.
                    </p>
                  </div>
                  <button
                    onClick={() => handleLaunchScenario('C')}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs shrink-0 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Run Drill C</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Current Active Run Telemetry */}
            {activeScenario && (
              <div className="p-3 rounded-lg bg-slate-950/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-cyan-300 text-xs">
                    ACTIVE SCENARIO {activeScenario} TELEMETRY
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Elapsed: {simMetrics.elapsed.toFixed(1)}s
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                    <div className="text-[10px] font-mono text-slate-400">Evacuated</div>
                    <div className="text-sm font-mono font-bold text-emerald-400 mt-0.5">
                      {simMetrics.evacuated} / {simMetrics.total}
                    </div>
                  </div>
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                    <div className="text-[10px] font-mono text-slate-400">Clearance Rate</div>
                    <div className="text-sm font-mono font-bold text-cyan-400 mt-0.5">
                      {simMetrics.completionPct}%
                    </div>
                  </div>
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                    <div className="text-[10px] font-mono text-slate-400">Status</div>
                    <div className="text-sm font-mono font-bold text-amber-400 mt-0.5">
                      {simMetrics.completionPct >= 100 ? 'COMPLETE' : 'IN PROGRESS'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Timeline Log */}
        {activeTab === 'TIMELINE' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Chronological Event History (Last 50 entries)</span>
              <span className="font-mono text-slate-500">Auto-updating</span>
            </div>

            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {timelineLog.length === 0 ? (
                <div className="text-center py-8 text-slate-400 font-mono text-xs">
                  No timeline entries recorded yet. Launch a scenario to begin logging events.
                </div>
              ) : (
                timelineLog.map(log => (
                  <div 
                    key={log.id}
                    className="p-2 rounded bg-slate-900/80 border border-slate-800 flex items-start space-x-2"
                  >
                    <span className="font-mono text-[10px] text-cyan-400 shrink-0 mt-0.5">
                      {log.timestamp}
                    </span>
                    <div className="flex-1">
                      <span className="font-mono font-bold text-[10px] text-slate-200">
                        [{log.type}]
                      </span>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        {log.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Data & Export */}
        {activeTab === 'EXPORT' && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="font-mono font-bold text-slate-200 text-xs flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>EXPORT SIMULATED EVACUATION DATASETS</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Export real-time simulation metrics, gate flow rates, age group distributions, and incident logs formatted for quantitative safety analysis.
              </p>
              <div className="flex items-center space-x-2 pt-2">
                <button
                  onClick={handleExportJSON}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download JSON Log</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono font-bold text-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Download CSV Summary</span>
                </button>
              </div>
            </div>

            <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-[10px] font-mono text-slate-400 space-y-1">
              <div>• Deterministic Seed: <span className="text-cyan-300">101</span></div>
              <div>• Data Classification: <span className="text-amber-300">SIMULATED / DEMO ONLY</span></div>
              <div>• Spatial Reference: <span className="text-slate-300">WGS84 EPSG:4326 (Rajamahendravaram)</span></div>
            </div>
          </div>
        )}
      </div>
    </FloatingPanel>
  );
};
