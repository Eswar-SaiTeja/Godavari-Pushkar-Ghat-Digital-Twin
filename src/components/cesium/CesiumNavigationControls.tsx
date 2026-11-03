import React from 'react';
import { 
  Plus, 
  Minus, 
  RotateCcw, 
  RotateCw, 
  ChevronUp, 
  ChevronDown, 
  Compass, 
  Home 
} from 'lucide-react';
import { cesiumService } from '../../services/cesiumService';

interface CesiumNavigationControlsProps {
  headingDeg?: number;
  pitchDeg?: number;
  altitudeMeters?: number;
}

export const CesiumNavigationControls: React.FC<CesiumNavigationControlsProps> = ({
  headingDeg = 320,
  pitchDeg = -38,
  altitudeMeters = 1450,
}) => {
  return (
    <div className="absolute top-20 right-4 z-20 flex flex-col items-center gap-2 select-none">
      {/* Compass Widget */}
      <button
        onClick={() => cesiumService.resetNorth()}
        className="w-11 h-11 rounded-full glass-panel flex flex-col items-center justify-center border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 shadow-panel transition-all hover:scale-105 active:scale-95 group"
        title="Compass: Click to Orient North"
      >
        <div 
          className="relative transition-transform duration-300"
          style={{ transform: `rotate(${-headingDeg}deg)` }}
        >
          <Compass className="w-6 h-6 text-cyan-300 group-hover:text-cyan-200" />
          <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[8px] font-bold font-mono text-rose-400">
            N
          </span>
        </div>
      </button>

      {/* Primary Zoom & Pan Stack */}
      <div className="glass-panel rounded-xl border border-cyan-500/30 flex flex-col p-1 gap-1 shadow-panel">
        <button
          onClick={() => cesiumService.zoomIn()}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 transition-colors"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          onClick={() => cesiumService.zoomOut()}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 transition-colors"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="h-px bg-slate-700/60 my-0.5" />

        <button
          onClick={() => cesiumService.tiltUp()}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 transition-colors"
          title="Tilt Horizon Up"
        >
          <ChevronUp className="w-4 h-4" />
        </button>

        <button
          onClick={() => cesiumService.tiltDown()}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 transition-colors"
          title="Tilt Overhead Down"
        >
          <ChevronDown className="w-4 h-4" />
        </button>

        <div className="h-px bg-slate-700/60 my-0.5" />

        <button
          onClick={() => cesiumService.rotateLeft()}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 transition-colors"
          title="Orbit Camera Counter-Clockwise"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={() => cesiumService.rotateRight()}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 transition-colors"
          title="Orbit Camera Clockwise"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        <div className="h-px bg-slate-700/60 my-0.5" />

        <button
          onClick={() => cesiumService.flyToInitialPosition()}
          className="p-2 rounded-lg bg-cyan-950/80 hover:bg-cyan-900/90 text-cyan-400 border border-cyan-500/40 hover:text-cyan-200 transition-colors"
          title="Reset to Pushkar Ghat Overview"
        >
          <Home className="w-4 h-4" />
        </button>
      </div>

      {/* Mini Attitude & Altitude Indicator */}
      <div className="glass-panel px-2 py-1 rounded-md border border-slate-700/60 text-[9px] font-mono text-slate-300 flex flex-col items-center">
        <span className="text-cyan-400 font-bold">{altitudeMeters > 1000 ? `${(altitudeMeters/1000).toFixed(1)}k` : altitudeMeters}m</span>
        <span className="text-slate-400">{pitchDeg}° tilt</span>
      </div>
    </div>
  );
};
