import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Activity, 
  Waves, 
  Car, 
  ShieldAlert, 
  Radio, 
  TrendingUp, 
  Sparkles, 
  Compass, 
  Maximize2, 
  MapPin, 
  Clock, 
  ChevronRight, 
  Send, 
  ArrowUpRight, 
  ArrowDownRight,
  Globe2
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { eventOperationsEngine } from '../../services/eventOperationsEngine';
import { emergencyEngine } from '../../services/emergencyDetectionEngine';
import { dispatchEngine } from '../../services/dispatchEngine';
import { crowdPredictionEngine } from '../../ai/predictive/crowdPredictionEngine';
import { anomalyDetectionEngine } from '../../ai/predictive/anomalyDetectionEngine';
import { floodIntelligenceEngine } from '../../ai/predictive/floodIntelligenceEngine';
import { evacuationRouteOptimizer } from '../../ai/predictive/evacuationRouteOptimizer';
import { cesiumService } from '../../services/cesiumService';
import { GHAT_LOCATIONS } from '../../config/locations';
import { ForecastHorizonMinutes } from '../../ai/types/predictive';

export interface OverviewDashboardProps {
  onSwitchTo3DMap: () => void;
  onOpenOperations: (tab?: string) => void;
  onOpenEmergency: () => void;
  onOpenAICopilot: (tab?: string) => void;
  onOpenCrowdControls: () => void;
  onOpenTrafficControls: () => void;
  onOpenScenarioModal: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  onSwitchTo3DMap,
  onOpenOperations,
  onOpenEmergency,
  onOpenAICopilot,
  onOpenCrowdControls,
  onOpenTrafficControls,
  onOpenScenarioModal,
}) => {
  // Horizon selector for crowd prediction
  const [selectedHorizon, setSelectedHorizon] = useState<ForecastHorizonMinutes>(30);
  const [liveMetrics, setLiveMetrics] = useState(() => eventOperationsEngine.getOperationsMetrics());
  const [zones, setZones] = useState(() => eventOperationsEngine.getZones());
  const [incidents, setIncidents] = useState(() => emergencyEngine.getIncidents());
  const [dispatches, setDispatches] = useState(() => dispatchEngine.getDispatches());
  
  // Predictive Engine Telemetry
  const [forecastReport, setForecastReport] = useState(() => crowdPredictionEngine.generateForecast(30));
  const [anomalyScan, setAnomalyScan] = useState(() => anomalyDetectionEngine.scanSubsystems());
  const [floodAssessment, setFloodAssessment] = useState(() => floodIntelligenceEngine.evaluateFloodRisk());
  const [evacComparison, _setEvacComparison] = useState(() => evacuationRouteOptimizer.optimizeEvacuationRoutes());

  // Periodically refresh data from live simulation engines
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveMetrics(eventOperationsEngine.getOperationsMetrics());
      setZones(eventOperationsEngine.getZones());
      setIncidents(emergencyEngine.getIncidents());
      setDispatches(dispatchEngine.getDispatches());
      setAnomalyScan(anomalyDetectionEngine.scanSubsystems());
      setFloodAssessment(floodIntelligenceEngine.evaluateFloodRisk());
    }, 2500);

    return () => clearInterval(timer);
  }, []);

  const handleHorizonChange = (h: ForecastHorizonMinutes) => {
    setSelectedHorizon(h);
    setForecastReport(crowdPredictionEngine.generateForecast(h));
  };

  const handleFlyToGhat = (ghatId: string) => {
    onSwitchTo3DMap();
    setTimeout(() => {
      cesiumService.flyToGhat(ghatId);
    }, 150);
  };

  const handleFocusIncident = (incidentId: string) => {
    onSwitchTo3DMap();
    setTimeout(() => {
      cesiumService.flyToIncident(incidentId);
    }, 150);
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-[#050811] text-slate-100 p-3 md:p-6 space-y-6 custom-scrollbar select-none">
      {/* ============================================================ */}
      {/* 1. TOP SUMMARY CARDS (7 KPI TILES)                           */}
      {/* ============================================================ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/40 shadow-glow-sm">
              <Activity className="w-4 h-4 text-cyan-300" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold tracking-wider text-slate-100 uppercase font-sans">
                Godavari Digital Twin Command Overview
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Real-Time Telemetry & Simulation Foundation • Rajamahendravaram, AP
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="amber" size="sm">SIMULATED DATA</Badge>
            <button
              onClick={onSwitchTo3DMap}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-600/30 hover:from-cyan-500/30 hover:to-blue-600/40 text-cyan-200 border border-cyan-400/40 shadow-glow-sm text-xs font-bold transition-all flex items-center gap-1.5 group"
            >
              <Maximize2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span>Full 3D Globe</span>
            </button>
          </div>
        </div>

        {/* 7 KPI Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {/* Card 1: Total Pilgrims */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-800/90 hover:border-cyan-500/40 transition-all shadow-panel group">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono uppercase mb-1">
              <span>Total Pilgrims</span>
              <Users className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-xl md:text-2xl font-bold font-mono text-slate-100">
              {liveMetrics.totalSimulatedVisitors.toLocaleString()}
            </div>
            <div className="text-[10px] text-cyan-400 flex items-center gap-1 mt-1 font-mono">
              <TrendingUp className="w-3 h-3" />
              <span>+4.2% Ingress Rate</span>
            </div>
          </div>

          {/* Card 2: Active Crowd Density */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-800/90 hover:border-cyan-500/40 transition-all shadow-panel group">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono uppercase mb-1">
              <span>Crowd Density</span>
              <Activity className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-xl md:text-2xl font-bold font-mono text-cyan-300">
              1.85 <span className="text-xs font-normal text-slate-400">pax/m²</span>
            </div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Safe Operational Band</span>
            </div>
          </div>

          {/* Card 3: River Water Level */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-800/90 hover:border-sky-500/40 transition-all shadow-panel group">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono uppercase mb-1">
              <span>River Gauge</span>
              <Waves className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-xl md:text-2xl font-bold font-mono text-sky-300">
              {floodAssessment.currentWaterLevelMsl} <span className="text-xs font-normal text-slate-400">m MSL</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-mono">
              Warning: 16.0m • Danger: 17.5m
            </div>
          </div>

          {/* Card 4: Godavari Flow Rate */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-800/90 hover:border-sky-500/40 transition-all shadow-panel group">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono uppercase mb-1">
              <span>Barrage Discharge</span>
              <Waves className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-xl md:text-2xl font-bold font-mono text-emerald-300">
              325K <span className="text-xs font-normal text-slate-400">cusecs</span>
            </div>
            <div className="text-[10px] text-emerald-400 mt-1 font-mono">
              Steady Downstream Release
            </div>
          </div>

          {/* Card 5: Active Vehicles */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-800/90 hover:border-emerald-500/40 transition-all shadow-panel group">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono uppercase mb-1">
              <span>Active Vehicles</span>
              <Car className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-xl md:text-2xl font-bold font-mono text-slate-100">
              342 <span className="text-xs font-normal text-slate-400">vehicles</span>
            </div>
            <div className="text-[10px] text-emerald-400 mt-1 font-mono">
              Road Bridge LOS: C (Stable)
            </div>
          </div>

          {/* Card 6: Active Incidents */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-800/90 hover:border-rose-500/40 transition-all shadow-panel group">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono uppercase mb-1">
              <span>Active Incidents</span>
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className={`text-xl md:text-2xl font-bold font-mono ${incidents.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {incidents.filter(i => i.status === 'ACTIVE').length}
            </div>
            <div className="text-[10px] text-rose-400/90 mt-1 font-mono">
              {incidents.filter(i => i.severity === 'CRITICAL').length} Critical Emergency
            </div>
          </div>

          {/* Card 7: Available Emergency Resources */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-800/90 hover:border-cyan-500/40 transition-all shadow-panel group">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono uppercase mb-1">
              <span>Field Units Ready</span>
              <Radio className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-xl md:text-2xl font-bold font-mono text-cyan-300">
              {liveMetrics.availableEmergencyTeams}
            </div>
            <div className="text-[10px] text-cyan-400/90 mt-1 font-mono">
              Ambulances: {liveMetrics.ambulanceAvailability.available}/{liveMetrics.ambulanceAvailability.total}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. MAIN DASHBOARD: 3D PREVIEW, CROWD DENSITY, GATES & TRAFFIC */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Interactive 3D Digital Twin Preview Stage (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 shadow-panel flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-sans">
                  Interactive 3D Digital Twin Viewport
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  OPENSTREETMAP + DEM
                </span>
                <button
                  onClick={onSwitchTo3DMap}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all flex items-center gap-1"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Expand 3D</span>
                </button>
              </div>
            </div>

            {/* Embedded 3D Stage / Visualization Portal */}
            <div className="relative my-3 rounded-xl overflow-hidden bg-gradient-to-b from-[#091124] to-[#040817] border border-cyan-500/20 h-[280px] sm:h-[320px] flex items-center justify-center group">
              {/* Decorative Cesium Grid Overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#08334415_1px,transparent_1px),linear-gradient(to_bottom,#08334415_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
              
              {/* Radar Radial Scanner Effect */}
              <div className="absolute w-[340px] h-[340px] rounded-full border border-cyan-500/20 flex items-center justify-center animate-ping-slow pointer-events-none">
                <div className="w-[200px] h-[200px] rounded-full border border-cyan-400/30" />
              </div>

              {/* Central Geographic Beacon */}
              <div className="relative z-10 flex flex-col items-center text-center p-6 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center shadow-glow-cyan text-cyan-300 group-hover:scale-105 transition-transform">
                  <Globe2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-100 font-sans tracking-wide">
                    Godavari Riverfront Digital Twin
                  </h4>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    17.0084° N, 81.7669° E • WGS84 Ellipsoid Ground Plane
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                  {GHAT_LOCATIONS.slice(0, 4).map((g) => (
                    <button
                      key={g.id}
                      onClick={() => handleFlyToGhat(g.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-slate-700/80 text-[11px] font-mono transition-colors flex items-center gap-1"
                    >
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      <span>{g.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Viewport Telemetry Badge */}
              <div className="absolute bottom-2.5 left-2.5 z-10 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[10px] font-mono text-slate-300 flex items-center gap-2">
                <span className="text-cyan-400">ALT: 1,450m</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">PITCH: -38°</span>
                <span className="text-slate-600">|</span>
                <span className="text-emerald-400 font-bold">19 FPS (OPT)</span>
              </div>

              <div className="absolute bottom-2.5 right-2.5 z-10">
                <button
                  onClick={onSwitchTo3DMap}
                  className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-glow-cyan transition-all"
                >
                  Enter 3D Viewport →
                </button>
              </div>
            </div>

            {/* Quick Controls Bar underneath preview */}
            <div className="grid grid-cols-4 gap-2 pt-1 text-center">
              <button
                onClick={onOpenCrowdControls}
                className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-slate-300 hover:text-cyan-300 transition-colors text-xs font-mono"
              >
                Crowd Controls
              </button>
              <button
                onClick={onOpenTrafficControls}
                className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-slate-300 hover:text-emerald-300 transition-colors text-xs font-mono"
              >
                Traffic Controls
              </button>
              <button
                onClick={onOpenEmergency}
                className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-slate-300 hover:text-rose-300 transition-colors text-xs font-mono"
              >
                Emergency Center
              </button>
              <button
                onClick={() => onOpenAICopilot('chat')}
                className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-slate-300 hover:text-purple-300 transition-colors text-xs font-mono flex items-center justify-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>AI Copilot</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Zone-wise Density & Gate Flow Rates (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Zone-Wise Utilization */}
          <div className="p-4 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 shadow-panel space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-sans">
                  Ghat Zone-Wise Crowd Density
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">7 SECTORS ACTIVE</span>
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {zones.map((zone) => {
                const occupancyPercent = Math.min(100, Math.round((zone.currentSimulatedPopulation / zone.capacityAssumption) * 100));
                const isCritical = occupancyPercent >= 75;
                const isHigh = occupancyPercent >= 50;
                return (
                  <div 
                    key={zone.id} 
                    className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-cyan-500/30 transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-200">
                        <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{zone.name}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-slate-300">{zone.currentSimulatedPopulation.toLocaleString()} pax</span>
                        <Badge variant={isCritical ? 'rose' : isHigh ? 'amber' : 'emerald'} size="sm">
                          {occupancyPercent}%
                        </Badge>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          isCritical ? 'bg-rose-500 shadow-glow-rose' : isHigh ? 'bg-amber-500' : 'bg-cyan-500'
                        }`}
                        style={{ width: `${occupancyPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gate Entry & Exit Statistics */}
          <div className="p-4 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 shadow-panel space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-sans">
                  Gate Entry & Exit Flow Rates
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">PAX / MINUTE</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                <span className="text-[10px] text-slate-400 block font-sans">Main Pushkar Arch</span>
                <div className="flex items-center justify-between font-bold">
                  <span className="text-emerald-400 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" /> 450 IN</span>
                  <span className="text-amber-400 flex items-center gap-0.5"><ArrowDownRight className="w-3 h-3" /> 380 OUT</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                <span className="text-[10px] text-slate-400 block font-sans">Kotilingala Egress</span>
                <div className="flex items-center justify-between font-bold">
                  <span className="text-emerald-400 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" /> 320 IN</span>
                  <span className="text-amber-400 flex items-center gap-0.5"><ArrowDownRight className="w-3 h-3" /> 290 OUT</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                <span className="text-[10px] text-slate-400 block font-sans">South Temple Ramp</span>
                <div className="flex items-center justify-between font-bold">
                  <span className="text-emerald-400 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" /> 180 IN</span>
                  <span className="text-amber-400 flex items-center gap-0.5"><ArrowDownRight className="w-3 h-3" /> 340 OUT</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                <span className="text-[10px] text-slate-400 block font-sans">VIP River Corridor</span>
                <div className="flex items-center justify-between font-bold">
                  <span className="text-emerald-400 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" /> 110 IN</span>
                  <span className="text-amber-400 flex items-center gap-0.5"><ArrowDownRight className="w-3 h-3" /> 210 OUT</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. INTELLIGENCE SECTION (AI PREDICTIONS, BOTTLENECK & FLOOD) */}
      {/* ============================================================ */}
      <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-r from-slate-950/90 via-slate-900/90 to-purple-950/20 border border-purple-500/30 shadow-[0_8px_30px_rgba(147,51,234,0.1)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-purple-500/20">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/20 border border-purple-400/40 shadow-glow-sm">
              <Sparkles className="w-4 h-4 text-purple-300 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-sans flex items-center gap-2">
                <span>AI Intelligence & Predictive Operations Foundation</span>
                <Badge variant="amber" size="sm">PREDICTIVE ENGINES ACTIVE</Badge>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Multi-Agent Social-Force Forecasting • 7-Anomaly Z-Score Scanner • CWC Hydrology
              </p>
            </div>
          </div>

          {/* Horizon Selector */}
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-[10px] text-slate-400 uppercase">Forecast Horizon:</span>
            {([15, 30, 60] as const).map((h) => (
              <button
                key={h}
                onClick={() => handleHorizonChange(h)}
                className={`px-2.5 py-1 rounded-lg border transition-all ${
                  selectedHorizon === h
                    ? 'bg-purple-500/30 text-purple-200 border-purple-400 font-bold shadow-glow-sm'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                +{h}m
              </button>
            ))}
          </div>
        </div>

        {/* Intelligence Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card A: Crowd Prediction (+Horizon) */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-cyan-300 font-mono uppercase">Crowd Forecast (+{selectedHorizon}m)</span>
              <span className="text-[9px] font-mono text-slate-400">95% CI</span>
            </div>
            <div className="text-2xl font-bold font-mono text-slate-100">
              {forecastReport.totalProjectedDevotees.toLocaleString()}
            </div>
            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>Lower: {Math.round(forecastReport.totalProjectedDevotees * 0.9).toLocaleString()}</span>
              <span>Upper: {Math.round(forecastReport.totalProjectedDevotees * 1.1).toLocaleString()}</span>
            </div>
            <p className="text-[10px] text-cyan-400/90 font-mono italic">
              {forecastReport.operationalAdvisories[0] || 'Crowd growth rate steady across riverfront sectors.'}
            </p>
          </div>

          {/* Card B: Bottleneck & Anomaly Detection */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-amber-300 font-mono uppercase">Bottleneck Scanner</span>
              <Badge variant={anomalyScan.systemHealthScore >= 80 ? 'emerald' : 'amber'} size="sm">
                HEALTH {anomalyScan.systemHealthScore}%
              </Badge>
            </div>
            <div className="text-2xl font-bold font-mono text-amber-400">
              {anomalyScan.totalAnomaliesDetected} <span className="text-xs font-normal text-slate-400">active alert(s)</span>
            </div>
            <div className="text-[10px] text-slate-300 font-mono truncate" title={anomalyScan.anomalies[0]?.title}>
              ⚠️ {anomalyScan.anomalies[0]?.title || 'No active flow bottleneck detected'}
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Z-Score Deviation Scanner active across all 7 operational categories.
            </p>
          </div>

          {/* Card C: Evacuation Readiness */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-emerald-300 font-mono uppercase">Evacuation Readiness</span>
              <button
                onClick={onOpenScenarioModal}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 underline font-mono"
                title="Open Scenario Comparison Modal"
              >
                +{evacComparison.aiOptimizedScenario.efficiencyImprovementPercent}% GAIN
              </button>
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-300">
              {evacComparison.aiOptimizedScenario.totalClearanceMinutes} <span className="text-xs font-normal text-slate-400">mins clearance</span>
            </div>
            <div className="text-[10px] text-slate-300 font-mono">
              Baseline: {evacComparison.baselineScenario.totalClearanceMinutes}m → AI VIP: {evacComparison.aiOptimizedScenario.totalClearanceMinutes}m
            </div>
            <p className="text-[10px] text-emerald-400/90 font-mono">
              Multi-corridor load balancing into Municipal Stadium safe grounds.
            </p>
          </div>

          {/* Card D: Flood & River Hydrology */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-sky-300 font-mono uppercase">Flood & Hydrology</span>
              <Badge variant="blue" size="sm">CWC VERIFIED</Badge>
            </div>
            <div className="text-2xl font-bold font-mono text-sky-300">
              {floodAssessment.currentWaterLevelMsl} <span className="text-xs font-normal text-slate-400">m MSL</span>
            </div>
            <div className="text-[10px] text-slate-300 font-mono">
              Dowleswaram Discharge: 325K cusecs
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              All lower tiers above submergence safety limit; SDRF boats deployed.
            </p>
          </div>
        </div>

        {/* AI Situational Briefing Banner */}
        <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-purple-200">
              <strong>JARVIS Copilot:</strong> Devotee ingress remains steady along Main Bazaar Road. Flow imbalance at Pushkar Chowk Ingress monitored. Egress corridor to Municipal Stadium is fully cleared.
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => onOpenAICopilot('reports')}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 text-[11px] font-bold"
              title="Generate Operational SITREP Report"
            >
              Operations SITREP →
            </button>
            <button
              onClick={() => onOpenAICopilot('announcements')}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold"
              title="Open Multilingual PA Generator"
            >
              PA Broadcast →
            </button>
            <button
              onClick={() => onOpenAICopilot('chat')}
              className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-400/30 text-[11px] font-bold"
            >
              Ask JARVIS →
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. ACTIVITY SECTION: INCIDENTS, DISPATCHES & TIMELINE        */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Incidents */}
        <div className="p-4 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 shadow-panel space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-sans">
                Active Emergencies
              </h3>
            </div>
            <button
              onClick={onOpenEmergency}
              className="text-[11px] text-rose-400 hover:text-rose-300 font-mono font-bold flex items-center gap-1"
            >
              <span>Command View</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {incidents.slice(0, 3).map((inc) => (
              <div 
                key={inc.id}
                className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 truncate max-w-[200px]">{inc.title}</span>
                  <Badge variant={inc.severity === 'CRITICAL' ? 'rose' : 'amber'} size="sm">
                    {inc.severity}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1">{inc.description}</p>
                <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-slate-500">
                  <span>Affected: ~{inc.affectedPopulation} pax</span>
                  <button
                    onClick={() => handleFocusIncident(inc.id)}
                    className="text-cyan-400 hover:text-cyan-300 font-bold"
                  >
                    Locate in 3D →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Dispatch Records */}
        <div className="p-4 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 shadow-panel space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-sans">
                Latest Dispatch Records
              </h3>
            </div>
            <button
              onClick={() => onOpenOperations('dispatch')}
              className="text-[11px] text-amber-400 hover:text-amber-300 font-mono font-bold flex items-center gap-1"
            >
              <span>Dispatch Desk</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {dispatches.length > 0 ? (
              dispatches.slice(0, 3).map((disp) => (
                <div key={disp.id} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 truncate">{disp.resourceName}</span>
                    <Badge variant={disp.status === 'DISPATCHED' ? 'amber' : 'emerald'} size="sm">
                      {disp.status}
                    </Badge>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                    <span>ETA: {disp.estimatedArrivalMinutes} mins</span>
                    <span className="text-slate-500 truncate max-w-[150px]">{disp.incidentTitle}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-xs font-mono text-slate-400">
                All field emergency units currently on primary standby.
              </div>
            )}
          </div>
        </div>

        {/* System Alerts & Operational Timeline */}
        <div className="p-4 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 shadow-panel space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-sans">
                System Activity Timeline
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">LIVE FEED</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-0.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-cyan-400 font-bold">CROWD_SIMULATOR</span>
                <span className="text-slate-500">Just now</span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans">
                Updated social-force velocity calculations across 8,420 Pushkar Ghat agents.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-0.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-emerald-400 font-bold">HYDRO_TELEMETRY</span>
                <span className="text-slate-500">2 mins ago</span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans">
                CWC gauge benchmark validated at 13.80m MSL; barrage discharge steady.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-0.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-purple-400 font-bold">AI_JARVIS</span>
                <span className="text-slate-500">5 mins ago</span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans">
                Generated +30m crowd forecast report with 95% confidence intervals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
