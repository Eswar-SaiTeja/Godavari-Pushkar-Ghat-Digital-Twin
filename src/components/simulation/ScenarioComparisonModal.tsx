import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  BarChart3, 
  DoorOpen, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  Clock 
} from 'lucide-react';
import { scenarioEngine } from '../../services/scenarioEngine';
import { ScenarioComparisonResult } from '../../types/scenario';

interface ScenarioComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScenarioComparisonModal: React.FC<ScenarioComparisonModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [comparisonResult, setComparisonResult] = useState<ScenarioComparisonResult>(() => 
    scenarioEngine.runComparison()
  );
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('SCENARIO_C');
  const [isRunningBenchmark, setIsRunningBenchmark] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleRunBenchmark = () => {
    setIsRunningBenchmark(true);
    setTimeout(() => {
      setComparisonResult(scenarioEngine.runComparison());
      setIsRunningBenchmark(false);
    }, 600);
  };

  const handleExportCSV = () => {
    scenarioEngine.downloadCSV(comparisonResult);
  };

  const handleExportJSON = () => {
    scenarioEngine.downloadJSON(comparisonResult);
  };

  const scenarios = Object.values(comparisonResult.scenarios);
  const selectedSc = comparisonResult.scenarios[selectedScenarioId] || scenarios[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] glass-panel rounded-2xl border border-cyan-500/30 flex flex-col shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 bg-slate-900/90 border-b border-cyan-500/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-mono font-bold tracking-wider text-slate-100 uppercase">
                  Scenario Comparison & Evacuation Intelligence Engine
                </h2>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  SIMULATED
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                Fair comparison with identical devotee population (350 pax), identical random seed (42), and age profiles
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunBenchmark}
              disabled={isRunningBenchmark}
              className="py-1.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-glow-cyan"
            >
              <Play className="w-3.5 h-3.5" />
              {isRunningBenchmark ? 'Benchmarking...' : 'Re-Run Benchmark'}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {/* Executive Summary Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-500/40">
            <div className="flex items-center gap-2 text-cyan-300 font-mono font-bold text-xs mb-1.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              Automated GIS Evacuation Insight & Recommendation
            </div>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              {comparisonResult.summaryAnalysis.executiveSummary}
            </p>
          </div>

          {/* Scenario Selector Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {scenarios.map((sc) => {
              const isSelected = sc.scenarioId === selectedScenarioId;
              return (
                <div
                  key={sc.scenarioId}
                  onClick={() => setSelectedScenarioId(sc.scenarioId)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-cyan-950/80 border-cyan-400 shadow-glow-sm'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 font-bold">
                        {sc.scenarioId.replace('_', ' ')}
                      </span>
                      {sc.scenarioId === 'SCENARIO_C' && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                          OPTIMAL PLAN
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-xs text-slate-100 font-mono mb-2">
                      {sc.scenarioName}
                    </h3>
                  </div>

                  {/* High level stats */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Evacuation Time:</span>
                      <strong className={sc.scenarioId === 'SCENARIO_C' ? 'text-emerald-400' : 'text-slate-200'}>
                        {sc.completionTimeSeconds}s
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Peak Density:</span>
                      <strong className={sc.peakDensityDevoteesPerSqm > 3 ? 'text-rose-400' : 'text-cyan-300'}>
                        {sc.peakDensityDevoteesPerSqm} pax/m²
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bottleneck Duration:</span>
                      <strong className={sc.bottleneckDurationSeconds > 40 ? 'text-rose-400' : 'text-slate-200'}>
                        {sc.bottleneckDurationSeconds}s
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Metric Comparative Charts */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-xs font-mono font-bold tracking-wider text-slate-300 uppercase flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Comparative Metrics Benchmark (Side-by-Side)
            </h3>

            {/* Metric 1: Evacuation Completion Time Bar Chart */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Evacuation Completion Time (Lower is Better):</span>
                <span className="text-slate-400">Target: &lt; 60 seconds</span>
              </div>
              <div className="space-y-1.5 font-mono text-[11px]">
                {scenarios.map((sc) => {
                  const pct = Math.round((sc.completionTimeSeconds / 150) * 100);
                  const isOptimal = sc.scenarioId === 'SCENARIO_C';
                  return (
                    <div key={sc.scenarioId} className="space-y-0.5">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>{sc.scenarioId.replace('_', ' ')}</span>
                        <span className={isOptimal ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                          {sc.completionTimeSeconds} seconds ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOptimal ? 'bg-emerald-400' : sc.scenarioId === 'SCENARIO_B' ? 'bg-cyan-400' : 'bg-rose-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Metric 2: Peak Devotee Density */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Peak Crowd Density along Steps (Lower is Safer):</span>
                <span className="text-slate-400">Safety Cap: &lt; 2.5 pax/m²</span>
              </div>
              <div className="space-y-1.5 font-mono text-[11px]">
                {scenarios.map((sc) => {
                  const pct = Math.round((sc.peakDensityDevoteesPerSqm / 5.0) * 100);
                  const isSafe = sc.peakDensityDevoteesPerSqm <= 2.0;
                  return (
                    <div key={sc.scenarioId} className="space-y-0.5">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>{sc.scenarioId.replace('_', ' ')}</span>
                        <span className={isSafe ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                          {sc.peakDensityDevoteesPerSqm} pax/m²
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isSafe ? 'bg-emerald-400' : sc.peakDensityDevoteesPerSqm < 3.0 ? 'bg-amber-400' : 'bg-rose-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected Scenario Gate Utilization Table */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold tracking-wider text-slate-200 uppercase flex items-center gap-2">
                <DoorOpen className="w-4 h-4 text-cyan-400" />
                Gate Egress Utilization: {selectedSc.scenarioName}
              </h3>
              <span className="text-[10px] text-slate-400">
                Total Evacuated: {selectedSc.totalEvacuated} / {selectedSc.totalPopulation}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                    <th className="pb-2">Gate Name</th>
                    <th className="pb-2">Throughput</th>
                    <th className="pb-2">Capacity Utilization</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-[11px]">
                  {Object.entries(selectedSc.gateUtilization).map(([gateId, util]) => (
                    <tr key={gateId} className="hover:bg-slate-800/30">
                      <td className="py-2 font-medium text-slate-200">{util.name}</td>
                      <td className="py-2 text-cyan-300">{util.throughput} devotees</td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div 
                              className={`h-full ${util.utilizationPct > 80 ? 'bg-amber-400' : 'bg-cyan-400'}`} 
                              style={{ width: `${util.utilizationPct}%` }} 
                            />
                          </div>
                          <span>{util.utilizationPct}%</span>
                        </div>
                      </td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          util.throughput > 0 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                            : 'bg-slate-800 text-slate-500'
                        }`}>
                          {util.throughput > 0 ? 'ACTIVE EXIT' : 'CLOSED'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>All values are SIMULATED demonstration outputs. Not for unverified emergency certification.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" /> Export CSV
            </button>

            <button
              onClick={handleExportJSON}
              className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" /> Export JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
