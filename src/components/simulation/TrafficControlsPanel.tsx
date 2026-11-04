import React, { useState } from 'react';
import { 
  Car, 
  Play, 
  Pause, 
  RotateCcw, 
  Siren, 
  Gauge, 
  Route, 
  AlertTriangle,
  Zap
} from 'lucide-react';
import { trafficEngine } from '../../services/trafficSimulation';
import { FloatingPanel } from '../common/FloatingPanel';

interface TrafficControlsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isRunning: boolean;
  onTogglePlayPause: () => void;
  onReset: () => void;
  onDispatchEmergency: () => void;
}

export const TrafficControlsPanel: React.FC<TrafficControlsPanelProps> = ({
  isOpen,
  onClose,
  isRunning,
  onTogglePlayPause,
  onReset,
  onDispatchEmergency,
}) => {
  const [vehicleCount, setVehicleCount] = useState<number>(120);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [ambulanceDispatched, setAmbulanceDispatched] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleVehicleCountChange = (count: number) => {
    setVehicleCount(count);
    trafficEngine.setVehicleCount(count);
  };

  const handleSpeedChange = (speed: number) => {
    setSpeedMultiplier(speed);
    trafficEngine.setSpeed(speed);
  };

  const handleDispatch = () => {
    onDispatchEmergency();
    setAmbulanceDispatched(true);
    setTimeout(() => setAmbulanceDispatched(false), 4000);
  };

  return (
    <FloatingPanel
      id="traffic_controls_panel"
      title="Traffic & Ingress Intelligence"
      subtitle="Vehicular Flow • Bridge Corridors"
      icon={<Car className="w-4 h-4 text-emerald-400" />}
      defaultPosition={{ x: 20, y: 76 }}
      defaultSize={{ width: 350, height: 'auto' }}
      minWidth={300}
      maxWidth={520}
      maxHeight={740}
      isOpen={isOpen}
      onClose={onClose}
      resizable={true}
    >
      {/* Play/Pause & Reset Bar */}
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
          {isRunning ? 'Pause Traffic' : 'Run Traffic'}
        </button>

        <button
          onClick={onReset}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
          title="Reset Vehicle Fleet (Deterministic Seed 101)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Emergency Vehicle Priority Dispatch */}
      <div className="mb-3 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-rose-300 flex items-center gap-1.5">
            <Siren className="w-4 h-4 text-rose-400 animate-pulse" />
            Priority Emergency Escort
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
            A* Corridors
          </span>
        </div>

        <p className="text-[10px] font-mono text-slate-400 leading-normal">
          Simulate an emergency 108 ambulance entering via Kovvur Road-cum-Rail Bridge. Active siren forces civilian vehicles to yield right-of-way.
        </p>

        <button
          onClick={handleDispatch}
          className={`w-full py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all ${
            ambulanceDispatched
              ? 'bg-rose-600 text-white shadow-glow-rose'
              : 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-md'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          {ambulanceDispatched ? 'SIREN ACTIVE • AMBULANCE RACING' : 'DISPATCH 108 AMBULANCE'}
        </button>
      </div>

      {/* Sliders: Fleet Size & Speed */}
      <div className="space-y-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 font-mono text-[11px] mb-3">
        {/* Fleet Count */}
        <div>
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <Car className="w-3 h-3 text-cyan-400" /> Total Active Vehicles:
            </span>
            <span className="text-cyan-300 font-bold">{vehicleCount}</span>
          </div>
          <input
            type="range"
            min="20"
            max="300"
            step="10"
            value={vehicleCount}
            onChange={(e) => handleVehicleCountChange(parseInt(e.target.value, 10))}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Speed Factor */}
        <div>
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <Gauge className="w-3 h-3 text-emerald-400" /> Simulation Velocity Multiplier:
            </span>
            <span className="text-emerald-300 font-bold">{speedMultiplier.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="4.0"
            step="0.5"
            value={speedMultiplier}
            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
          />
        </div>
      </div>

      {/* Monitored Road Corridors */}
      <div className="space-y-1.5 font-mono text-[10px] text-slate-300">
        <span className="uppercase tracking-wider text-slate-400 block mb-1">
          Monitored Road Corridors
        </span>
        {[
          { name: 'Road-cum-Rail Bridge (Kovvur)', speed: '50 km/h', type: 'Bridge Span' },
          { name: 'Riverfront Pushkar Ghat Road', speed: '35 km/h', type: 'Ghat Link' },
          { name: 'Kotilingala Ghat North Corridor', speed: '40 km/h', type: 'Arterial' },
          { name: 'Arts College Ring Road & Evac Lane', speed: '50 km/h', type: 'Evac Route' },
        ].map((road, idx) => (
          <div key={idx} className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 truncate mr-2">
              <Route className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <span className="truncate">{road.name}</span>
            </div>
            <span className="text-cyan-400 flex-shrink-0">{road.speed}</span>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="mt-3 p-2 rounded-lg bg-amber-950/30 border border-amber-500/30 flex items-start gap-1.5 text-[9px] text-amber-300/90 font-mono">
        <AlertTriangle className="w-3 h-3 flex-shrink-0 text-amber-400 mt-0.5" />
        <span>SIMULATED: Traffic densities and yields are synthetic models for smart city GIS capacity assessment.</span>
      </div>
    </FloatingPanel>
  );
};
