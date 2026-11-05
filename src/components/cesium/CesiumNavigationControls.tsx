import React, { useState } from 'react';
import { 
  Plus, 
  Minus, 
  RotateCcw, 
  RotateCw, 
  ChevronUp, 
  ChevronDown, 
  Compass, 
  Home, 
  Ruler, 
  Video, 
  Sun, 
  Sunset, 
  Moon, 
  X,
  Search,
  Scan,
  MapPin
} from 'lucide-react';
import { cesiumService } from '../../services/cesiumService';
import { LightingPreset, MeasurementState, GhatLocation } from '../../types/gis';
import { GHAT_LOCATIONS } from '../../config/locations';

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
  const [isTourActive, setIsTourActive] = useState<boolean>(false);
  const [tourStep, setTourStep] = useState<string>('');
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('DAY');
  const [sceneMode, setSceneMode] = useState<'3D' | '2D'>('3D');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [measurement, setMeasurement] = useState<MeasurementState>({
    isActive: false,
    startPoint: null,
    endPoint: null,
    distanceMeters: null,
  });

  const toggle2D3D = () => {
    const nextMode = cesiumService.toggle2D3D();
    setSceneMode(nextMode);
  };

  const handleZoomToAll = () => {
    cesiumService.zoomToAllGisLayers();
  };

  const handleSelectLocation = (loc: GhatLocation) => {
    cesiumService.flyToLocation(loc);
    setIsSearchOpen(false);
  };

  const toggleTour = () => {
    if (isTourActive) {
      cesiumService.stopTour();
      setIsTourActive(false);
      setTourStep('');
    } else {
      setIsTourActive(true);
      cesiumService.startTour(
        (siteName, stepIdx) => {
          setTourStep(`Stop ${stepIdx}/5: ${siteName}`);
        },
        () => {
          setIsTourActive(false);
          setTourStep('');
        }
      );
    }
  };

  const toggleMeasurement = () => {
    const active = cesiumService.toggleMeasurement((state) => {
      setMeasurement(state);
    });
    if (!active) {
      setMeasurement({
        isActive: false,
        startPoint: null,
        endPoint: null,
        distanceMeters: null,
      });
    }
  };

  const cycleLighting = () => {
    let next: LightingPreset = 'DAY';
    if (lightingPreset === 'DAY') next = 'SUNSET_HARATHI';
    else if (lightingPreset === 'SUNSET_HARATHI') next = 'NIGHT_COMMAND';
    else next = 'DAY';

    setLightingPreset(next);
    cesiumService.setLightingPreset(next);
  };

  return (
    <>
      {/* Top Banner when Measurement is Active */}
      {measurement.isActive && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 glass-panel px-4 py-2 rounded-xl border border-cyan-400/60 shadow-glow-cyan text-xs font-mono text-slate-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 select-none">
          <div className="flex items-center gap-1.5 text-cyan-300">
            <Ruler className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="font-bold">GIS 3D RULER:</span>
          </div>

          <div>
            {!measurement.startPoint && (
              <span className="text-amber-300">Click first point on Godavari riverfront or bridge</span>
            )}
            {measurement.startPoint && !measurement.endPoint && (
              <span className="text-cyan-300">Click second point to measure distance</span>
            )}
            {measurement.distanceMeters !== null && (
              <span className="text-emerald-300 font-bold">
                Distance: {measurement.distanceMeters.toLocaleString()} m ({(measurement.distanceMeters / 1000).toFixed(2)} km)
              </span>
            )}
          </div>

          <button
            onClick={toggleMeasurement}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 ml-2"
            title="Exit Ruler"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Banner when Tour is Active */}
      {isTourActive && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 glass-panel px-4 py-2 rounded-xl border border-amber-400/60 shadow-panel text-xs font-mono text-slate-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 select-none">
          <div className="flex items-center gap-1.5 text-amber-300">
            <Video className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="font-bold">CINEMATIC RIVER TOUR:</span>
          </div>
          <span className="text-cyan-300 font-semibold">{tourStep}</span>
          <button
            onClick={toggleTour}
            className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold hover:bg-amber-500/30"
          >
            Stop Tour
          </button>
        </div>
      )}

      {/* Location Search Floating Dropdown */}
      {isSearchOpen && (
        <div className="absolute top-20 right-16 z-30 w-80 glass-panel rounded-xl border border-cyan-400/50 shadow-glow-cyan p-3 text-slate-100 animate-in fade-in slide-in-from-right-2">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/60">
            <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" />
              FLY TO LANDMARK (WGS84)
            </span>
            <button
              onClick={() => setIsSearchOpen(false)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search verified ghats, bridges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1 no-scrollbar">
            {GHAT_LOCATIONS.filter(g => 
              g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (g.teluguName && g.teluguName.includes(searchQuery))
            ).map((ghat) => (
              <button
                key={ghat.id}
                onClick={() => handleSelectLocation(ghat)}
                className="w-full p-2 rounded-lg bg-slate-900/70 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 text-left transition-all flex items-start justify-between group"
              >
                <div>
                  <div className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                    <span>{ghat.name}</span>
                  </div>
                  {ghat.teluguName && (
                    <div className="text-[10px] text-cyan-400/80 ml-4 font-sans">{ghat.teluguName}</div>
                  )}
                  <div className="text-[9px] font-mono text-slate-400 ml-4">
                    {ghat.coordinates.latitude.toFixed(4)}°N, {ghat.coordinates.longitude.toFixed(4)}°E
                  </div>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold border ${
                  ghat.verificationStatus === 'VERIFIED'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {ghat.verificationStatus}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Right Controls Stack */}
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
            title="Zoom In (+)"
          >
            <Plus className="w-4 h-4" />
          </button>

          <button
            onClick={() => cesiumService.zoomOut()}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 transition-colors"
            title="Zoom Out (-)"
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

          {/* 2D / 3D Scene Mode Toggle */}
          <button
            onClick={toggle2D3D}
            className={`p-2 rounded-lg font-mono font-bold text-xs transition-colors flex items-center justify-center ${
              sceneMode === '3D'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50'
            }`}
            title={`Current View: ${sceneMode}. Click to switch to ${sceneMode === '3D' ? '2D Orthographic' : '3D Globe'}`}
          >
            {sceneMode}
          </button>

          {/* Zoom to All GIS Layers */}
          <button
            onClick={handleZoomToAll}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 transition-colors"
            title="Zoom to All GIS Layers & River Boundaries"
          >
            <Scan className="w-4 h-4" />
          </button>

          {/* Quick Location Search */}
          <button
            onClick={() => setIsSearchOpen(prev => !prev)}
            className={`p-2 rounded-lg transition-colors ${
              isSearchOpen
                ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/60'
                : 'bg-slate-800/80 text-slate-200 hover:bg-cyan-500/20 hover:text-cyan-300'
            }`}
            title="Search Verified Landmarks & Ghats"
          >
            <Search className="w-4 h-4" />
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

        {/* GIS Tool Extensions (Ruler, Tour, Lighting) */}
        <div className="glass-panel rounded-xl border border-cyan-500/30 flex flex-col p-1 gap-1 shadow-panel">
          {/* Distance Ruler */}
          <button
            onClick={toggleMeasurement}
            className={`p-2 rounded-lg transition-all ${
              measurement.isActive
                ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/60 shadow-glow-sm'
                : 'bg-slate-800/80 text-slate-200 hover:bg-cyan-500/20 hover:text-cyan-300'
            }`}
            title="3D Distance Measurement Ruler"
          >
            <Ruler className="w-4 h-4" />
          </button>

          {/* Cinematic Tour */}
          <button
            onClick={toggleTour}
            className={`p-2 rounded-lg transition-all ${
              isTourActive
                ? 'bg-amber-500/30 text-amber-300 border border-amber-400/60 shadow-panel'
                : 'bg-slate-800/80 text-slate-200 hover:bg-amber-500/20 hover:text-amber-300'
            }`}
            title="Cinematic Riverfront Tour"
          >
            <Video className="w-4 h-4" />
          </button>

          {/* Sun Lighting Toggle */}
          <button
            onClick={cycleLighting}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 transition-colors"
            title={`Lighting: ${lightingPreset} (Click to switch Day / Harathi / Night)`}
          >
            {lightingPreset === 'DAY' && <Sun className="w-4 h-4 text-amber-400" />}
            {lightingPreset === 'SUNSET_HARATHI' && <Sunset className="w-4 h-4 text-rose-400" />}
            {lightingPreset === 'NIGHT_COMMAND' && <Moon className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>

        {/* Mini Attitude & Altitude Indicator */}
        <div className="glass-panel px-2 py-1 rounded-md border border-slate-700/60 text-[9px] font-mono text-slate-300 flex flex-col items-center">
          <span className="text-cyan-400 font-bold">{altitudeMeters > 1000 ? `${(altitudeMeters/1000).toFixed(1)}k` : altitudeMeters}m</span>
          <span className="text-slate-400">{pitchDeg}° tilt</span>
        </div>
      </div>
    </>
  );
};
