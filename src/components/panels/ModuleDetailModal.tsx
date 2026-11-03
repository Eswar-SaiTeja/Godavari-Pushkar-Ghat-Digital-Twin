import React from 'react';
import { 
  X,
  Sliders, 
  Clock, 
  Info, 
  ShieldCheck, 
  Sparkles
} from 'lucide-react';
import { ModuleDefinition } from '../../types/simulation';
import { Badge } from '../common/Badge';

interface ModuleDetailModalProps {
  module: ModuleDefinition | null;
  onClose: () => void;
}

export const ModuleDetailModal: React.FC<ModuleDetailModalProps> = ({
  module,
  onClose,
}) => {
  if (!module) return null;

  const isDay1Active = module.status === 'ACTIVE_DAY1';
  const isSimulated = module.status === 'SIMULATED_PREVIEW';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl glass-panel rounded-2xl border border-cyan-500/30 overflow-hidden shadow-panel flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">
                  {module.label}
                </h3>
                {isDay1Active && <Badge variant="cyan">Day 1 Active</Badge>}
                {isSimulated && <Badge variant="amber">Simulated Preview</Badge>}
                {!isDay1Active && !isSimulated && <Badge variant="slate">Design Phase</Badge>}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {module.shortDesc}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Status & Implementation Phase */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono text-slate-300">Phase Status:</span>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-300">
              {module.details?.plannedPhase || 'Active Foundation'}
            </span>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              Module Architectural Scope
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
              {module.details?.overview}
            </p>
          </div>

          {/* Key Metrics & Telemetry Parameters */}
          {module.details?.keyMetrics && module.details.keyMetrics.length > 0 && (
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Engineering Parameters & Metrics
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {module.details.keyMetrics.map((m, idx) => (
                  <div 
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 font-mono"
                  >
                    <div className="text-[10px] text-slate-400 truncate">{m.label}</div>
                    <div className="text-sm font-bold text-cyan-300 mt-0.5">
                      {m.value} {m.unit && <span className="text-xs text-slate-400">{m.unit}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Integrity Protocol Notice */}
          <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-start gap-2.5 text-[11px] font-mono text-cyan-300/90">
            <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-cyan-200">System Protocol: </span>
              In accordance with project integrity standards, live physical sensor networks and telemetry in this environment operate in calibrated simulated mode (marked SIMULATED).
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[10px] font-mono text-slate-400">
            Pushkar Ghat 3D Digital Twin • Rajamahendravaram
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 text-xs font-mono font-bold transition-colors"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
