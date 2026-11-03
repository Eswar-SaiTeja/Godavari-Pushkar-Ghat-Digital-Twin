import React from 'react';
import { 
  Waves, 
  Users, 
  Mountain, 
  ChevronUp, 
  ChevronDown,
  Activity
} from 'lucide-react';
import { Badge } from '../common/Badge';

interface StatusCardsProps {
  riverLevelMsl: number;
  devoteeCount: number;
  terrainStatusMessage: string;
}

export const StatusCards: React.FC<StatusCardsProps> = ({
  riverLevelMsl,
  devoteeCount,
  terrainStatusMessage,
}) => {
  const [isExpanded, setIsExpanded] = React.useState<boolean>(true);

  return (
    <div className="absolute top-20 left-4 lg:left-80 z-10 select-none hidden md:block">
      {/* Toggle header */}
      <button
        onClick={() => setIsExpanded(prev => !prev)}
        className="glass-panel px-3 py-1 rounded-t-xl border border-b-0 border-cyan-500/30 flex items-center gap-2 text-xs font-mono text-cyan-300 hover:text-cyan-200 transition-colors shadow-panel"
      >
        <Activity className="w-3.5 h-3.5 text-cyan-400" />
        <span className="font-bold uppercase tracking-wider">Godavari Twin Telemetry</span>
        <Badge variant="amber" size="sm">SIMULATED</Badge>
        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
      </button>

      {/* Expanded Cards Grid */}
      {isExpanded && (
        <div className="glass-panel rounded-b-xl rounded-tr-xl border border-cyan-500/30 p-2.5 shadow-panel grid grid-cols-3 gap-2 w-[480px] animate-in fade-in duration-200">
          {/* Card 1: River Water Level */}
          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Waves className="w-3 h-3 text-sky-400" />
                River Gauge
              </span>
              <span className="text-amber-400 font-bold">DEMO</span>
            </div>
            <div className="text-base font-bold font-mono text-sky-300 mt-1">
              {riverLevelMsl} <span className="text-xs text-slate-400">m MSL</span>
            </div>
            <div className="text-[9px] text-emerald-400 font-mono mt-0.5">
              Normal Bathing Tier
            </div>
          </div>

          {/* Card 2: Simulated Crowd */}
          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3 text-cyan-400" />
                Active Crowd
              </span>
              <span className="text-amber-400 font-bold">SIM</span>
            </div>
            <div className="text-base font-bold font-mono text-cyan-300 mt-1">
              {devoteeCount.toLocaleString()} <span className="text-xs text-slate-400">devotees</span>
            </div>
            <div className="text-[9px] text-cyan-400 font-mono mt-0.5">
              Pushkar Ghat Steps
            </div>
          </div>

          {/* Card 3: DEM & Mesh */}
          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Mountain className="w-3 h-3 text-emerald-400" />
                Terrain Mesh
              </span>
              <span className="text-emerald-400 font-bold">ACTIVE</span>
            </div>
            <div className="text-xs font-bold font-mono text-slate-200 mt-1 truncate">
              WGS84 Ellipsoid
            </div>
            <div className="text-[9px] text-slate-400 font-mono mt-0.5 truncate" title={terrainStatusMessage}>
              30m SRTM Profile
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
