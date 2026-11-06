import React from 'react';
import { 
  Waves, 
  Users, 
  Globe2, 
  Activity
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { DraggableHUDWrapper } from '../common/DraggableHUDWrapper';

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
  const defaultPos = { x: 76, y: 76 };

  return (
    <DraggableHUDWrapper
      panelId="telemetry_hud"
      defaultPosition={defaultPos}
      title="Telemetry HUD"
      icon={<Activity className="w-3.5 h-3.5 text-cyan-400" />}
      badge={<Badge variant="amber" size="sm">SIMULATED</Badge>}
      minimizedContent={
        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-300">
          <span className="flex items-center gap-1 text-sky-300">
            <Waves className="w-3 h-3 text-sky-400" /> {riverLevelMsl}m MSL
          </span>
          <span className="flex items-center gap-1 text-cyan-300">
            <Users className="w-3 h-3 text-cyan-400" /> {devoteeCount.toLocaleString()} pax
          </span>
          <span className="text-emerald-400 font-bold">WGS84</span>
        </div>
      }
    >
      {/* Expanded Cards Grid */}
      <div className="grid grid-cols-3 gap-1.5 w-[380px] max-w-full">
        {/* Card 1: River Water Level */}
        <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <Waves className="w-3 h-3 text-sky-400" />
              River Gauge
            </span>
            <span className="text-amber-400 font-bold">DEMO</span>
          </div>
          <div className="text-sm font-bold font-mono text-sky-300 mt-0.5">
            {riverLevelMsl} <span className="text-[10px] text-slate-400 font-normal">m MSL</span>
          </div>
          <div className="text-[8px] text-slate-400 font-mono mt-0.5 truncate" title="Synthetic simulation value - not certified gauge">
            Unverified Gauge
          </div>
        </div>

        {/* Card 2: Simulated Crowd */}
        <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3 text-cyan-400" />
              Crowd Load
            </span>
            <span className="text-amber-400 font-bold">SIM</span>
          </div>
          <div className="text-sm font-bold font-mono text-cyan-300 mt-0.5">
            {devoteeCount.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">pax</span>
          </div>
          <div className="text-[8px] text-cyan-400 font-mono mt-0.5 truncate">
            Pushkar Steps
          </div>
        </div>

        {/* Card 3: Base Terrain Provider */}
        <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <Globe2 className="w-3 h-3 text-emerald-400" />
              Terrain
            </span>
            <span className="text-emerald-400 font-bold">FALLBACK</span>
          </div>
          <div className="text-[11px] font-bold font-mono text-slate-200 mt-0.5 truncate" title={terrainStatusMessage}>
            WGS84 Ellipsoid
          </div>
          <div className="text-[8px] text-amber-400 font-mono mt-0.5 truncate">
            No 3D Mesh
          </div>
        </div>
      </div>
    </DraggableHUDWrapper>
  );
};
