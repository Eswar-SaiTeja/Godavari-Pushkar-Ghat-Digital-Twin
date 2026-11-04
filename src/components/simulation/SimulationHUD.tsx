import React, { useState } from 'react';
import { 
  Users, 
  Car, 
  AlertTriangle, 
  Siren, 
  Activity, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { CrowdMetrics } from '../../types/crowd';
import { TrafficMetrics } from '../../types/traffic';
import { Badge } from '../common/Badge';

interface SimulationHUDProps {
  crowdMetrics: CrowdMetrics | null;
  trafficMetrics: TrafficMetrics | null;
  isCrowdActive: boolean;
  isTrafficActive: boolean;
  isEmergencyAlert: boolean;
}

export const SimulationHUD: React.FC<SimulationHUDProps> = ({
  crowdMetrics,
  trafficMetrics,
  isCrowdActive,
  isTrafficActive,
  isEmergencyAlert,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  if (!isCrowdActive && !isTrafficActive) return null;

  const getDensityVariant = (density: string) => {
    switch (density) {
      case 'CRITICAL': return 'rose';
      case 'HIGH': return 'amber';
      case 'MODERATE': return 'cyan';
      default: return 'emerald';
    }
  };

  const getCongestionVariant = (congestion: string) => {
    switch (congestion) {
      case 'BLOCKED': return 'rose';
      case 'HEAVY': return 'amber';
      case 'MODERATE': return 'cyan';
      default: return 'emerald';
    }
  };

  return (
    <div className="absolute top-20 right-4 lg:right-20 z-20 max-w-sm sm:max-w-md select-none transition-all duration-300">
      <div className="glass-panel rounded-2xl border border-cyan-500/30 p-2.5 sm:p-3 shadow-panel">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
            </span>
            <span className="text-[11px] font-mono font-bold tracking-wider text-cyan-200 uppercase">
              Simulation Intelligence Telemetry
            </span>
            <Badge variant="amber" size="sm">SIMULATED</Badge>
          </div>

          <button
            onClick={() => setIsExpanded(prev => !prev)}
            className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
            title={isExpanded ? 'Collapse HUD' : 'Expand HUD'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Collapsed summary pill */}
        {!isExpanded && (
          <div className="pt-2 flex items-center justify-between text-[10px] font-mono text-slate-300">
            <span>Pedestrians: <strong className="text-cyan-400">{crowdMetrics?.totalActivePedestrians ?? 0}</strong></span>
            <span>Vehicles: <strong className="text-emerald-400">{trafficMetrics?.totalActiveVehicles ?? 0}</strong></span>
            <span>Density: <strong className="text-amber-400">{crowdMetrics?.currentDensityLevel ?? 'NORMAL'}</strong></span>
          </div>
        )}

        {/* Expanded Grid */}
        {isExpanded && (
          <div className="pt-2.5 space-y-2.5">
            {/* Metric Cards Row 1: Crowd & Density */}
            {isCrowdActive && crowdMetrics && (
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                {/* Active Pedestrians */}
                <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-cyan-400" /> Active Crowd
                    </span>
                    <span className="text-[9px] text-cyan-300">
                      {crowdMetrics.averageWalkingSpeed} m/s
                    </span>
                  </div>
                  <div className="text-lg font-bold text-slate-100">
                    {crowdMetrics.totalActivePedestrians.toLocaleString()}
                  </div>
                  {/* Age Breakdown Mini Bar */}
                  <div className="flex gap-1 mt-1 text-[9px] text-slate-400">
                    <span title="Children">Ch: {crowdMetrics.byAgeGroup.CHILDREN}</span>
                    <span>•</span>
                    <span title="Young">Yg: {crowdMetrics.byAgeGroup.YOUNG}</span>
                    <span>•</span>
                    <span title="Adults">Ad: {crowdMetrics.byAgeGroup.ADULTS}</span>
                    <span>•</span>
                    <span title="Seniors">Sn: {crowdMetrics.byAgeGroup.SENIORS}</span>
                  </div>
                </div>

                {/* Density & Bottlenecks */}
                <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                    <span className="flex items-center gap-1">
                      <Activity className="w-3 h-3 text-amber-400" /> Density Level
                    </span>
                    <Badge variant={getDensityVariant(crowdMetrics.currentDensityLevel)} size="sm">
                      {crowdMetrics.currentDensityLevel}
                    </Badge>
                  </div>
                  <div className="text-lg font-bold text-amber-300">
                    {crowdMetrics.densityValue} <span className="text-[10px] font-normal text-slate-400">pax/m²</span>
                  </div>
                  <div className="text-[9px] text-slate-400 mt-1 truncate">
                    Flow: In {crowdMetrics.entryFlowRatePerMin} / Out {crowdMetrics.exitFlowRatePerMin} min
                  </div>
                </div>
              </div>
            )}

            {/* Metric Cards Row 2: Traffic Intelligence */}
            {isTrafficActive && trafficMetrics && (
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                {/* Active Vehicles */}
                <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                    <span className="flex items-center gap-1">
                      <Car className="w-3 h-3 text-emerald-400" /> Active Fleet
                    </span>
                    <span className="text-[9px] text-emerald-400 font-bold">
                      {trafficMetrics.averageSpeedKmph} km/h
                    </span>
                  </div>
                  <div className="text-lg font-bold text-slate-100">
                    {trafficMetrics.totalActiveVehicles}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-1">
                    Bridge Vol: {trafficMetrics.bridgeTrafficVolume} units
                  </div>
                </div>

                {/* Congestion Status */}
                <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                    <span>Road Network</span>
                    <Badge variant={getCongestionVariant(trafficMetrics.overallCongestionLevel)} size="sm">
                      {trafficMetrics.overallCongestionLevel.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 mt-1">
                    <span>Congested Corridors:</span>
                    <span className={trafficMetrics.congestedSegmentsCount > 0 ? 'text-rose-400 font-mono' : 'text-emerald-400 font-mono'}>
                      {trafficMetrics.congestedSegmentsCount}
                    </span>
                  </div>
                  {trafficMetrics.emergencyVehiclesActive > 0 && (
                    <div className="text-[9px] text-rose-300 flex items-center gap-1 mt-1 animate-pulse">
                      <Siren className="w-3 h-3 text-rose-400" /> 108 Ambulance Siren Active
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bottleneck Alert Banner if Critical */}
            {crowdMetrics?.activeBottlenecks && crowdMetrics.activeBottlenecks.length > 0 && (
              <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-500/60 text-rose-200 flex items-center gap-2 text-[10px] font-mono animate-pulse">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <div className="truncate">
                  <strong>BOTTLENECK WARNING:</strong> {crowdMetrics.activeBottlenecks[0].locationName}
                </div>
              </div>
            )}

            {/* Emergency Status Banner */}
            {isEmergencyAlert && (
              <div className="p-2 rounded-xl bg-rose-600 text-white flex items-center justify-between text-xs font-mono font-bold shadow-glow-rose">
                <div className="flex items-center gap-1.5">
                  <Siren className="w-4 h-4 animate-bounce" />
                  <span>EMERGENCY EVACUATION IN PROGRESS</span>
                </div>
                <span className="text-[10px] bg-rose-950/80 px-2 py-0.5 rounded text-rose-200 border border-rose-400/40">
                  {crowdMetrics?.responsePercentage ?? 0}% Responded
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
