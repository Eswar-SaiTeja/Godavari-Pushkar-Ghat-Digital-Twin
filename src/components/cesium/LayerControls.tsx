import React from 'react';
import { 
  Layers, 
  Eye, 
  EyeOff, 
  Map as MapIcon, 
  Mountain, 
  Users, 
  Waves, 
  ShieldAlert, 
  X,
  Sparkles
} from 'lucide-react';
import { LayerVisibilityState, BaseImageryProvider } from '../../types/gis';
import { cesiumService } from '../../services/cesiumService';

interface LayerControlsProps {
  layers: LayerVisibilityState;
  onToggleLayer: (layerKey: keyof LayerVisibilityState) => void;
  baseImagery: BaseImageryProvider;
  onChangeBaseImagery: (provider: BaseImageryProvider) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const LayerControls: React.FC<LayerControlsProps> = ({
  layers,
  onToggleLayer,
  baseImagery,
  onChangeBaseImagery,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const baseLayerOptions: { id: BaseImageryProvider; label: string; desc: string }[] = [
    { id: 'osm', label: 'OpenStreetMap', desc: 'Standard topographic cartography' },
    { id: 'carto_dark', label: 'Carto Dark Matter', desc: 'High-contrast command-center mode' },
    { id: 'carto_voyager', label: 'Carto Voyager', desc: 'Detailed urban street & riverfront' },
    { id: 'arcgis_world', label: 'Satellite Aerial', desc: 'Photorealistic high-res satellite' },
  ];

  const layerItems: { key: keyof LayerVisibilityState; label: string; icon: React.ReactNode; color: string }[] = [
    { key: 'boundaries', label: 'Project Boundary Area', icon: <MapIcon className="w-4 h-4" />, color: 'text-cyan-400' },
    { key: 'ghats', label: 'Bathing Ghats & Landmarks', icon: <Sparkles className="w-4 h-4" />, color: 'text-cyan-300' },
    { key: 'bridges', label: 'Godavari Historic Bridges', icon: <Layers className="w-4 h-4" />, color: 'text-blue-400' },
    { key: 'emergencyZones', label: 'Evacuation Corridors', icon: <ShieldAlert className="w-4 h-4" />, color: 'text-rose-400' },
    { key: 'demElevationGrid', label: 'DEM Elevation Grid (3D)', icon: <Mountain className="w-4 h-4" />, color: 'text-emerald-400' },
    { key: 'waterFlowVectors', label: 'River Velocity Vectors', icon: <Waves className="w-4 h-4" />, color: 'text-sky-400' },
    { key: 'crowdDensityHeatmap', label: 'Crowd Density Rings (Simulated)', icon: <Users className="w-4 h-4" />, color: 'text-amber-400' },
    { key: 'labels3D', label: '3D Spatial Pin Labels', icon: <Eye className="w-4 h-4" />, color: 'text-slate-300' },
  ];

  const handleBaseLayerSelect = (provider: BaseImageryProvider) => {
    onChangeBaseImagery(provider);
    cesiumService.setBaseImagery(provider);
  };

  return (
    <div className="absolute top-20 left-4 lg:left-80 z-20 w-80 glass-panel rounded-xl border border-cyan-500/30 p-4 shadow-panel select-none animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-3">
        <div className="flex items-center gap-2 text-cyan-300">
          <Layers className="w-4 h-4" />
          <span className="text-xs font-mono font-bold tracking-wider uppercase">
            GIS Layers & Basemaps
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Layer Toggles */}
      <div className="space-y-1.5 mb-4">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
          Vector & Spatial Overlays
        </span>
        {layerItems.map((item) => {
          const isEnabled = layers[item.key];
          return (
            <button
              key={item.key}
              onClick={() => onToggleLayer(item.key)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isEnabled
                  ? 'bg-slate-800/80 text-slate-100 border border-slate-700/70'
                  : 'bg-slate-900/40 text-slate-400 border border-transparent hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={isEnabled ? item.color : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </div>
              <div className={`p-1 rounded ${isEnabled ? 'text-cyan-400' : 'text-slate-400'}`}>
                {isEnabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Base Imagery Selector */}
      <div className="pt-2 border-t border-slate-700/60">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-2">
          Base Imagery Provider
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {baseLayerOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleBaseLayerSelect(opt.id)}
              className={`p-2 rounded-lg text-left text-[11px] font-mono transition-all border ${
                baseImagery === opt.id
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-400/60 shadow-glow-sm'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="font-semibold truncate">{opt.label}</div>
              <div className="text-[9px] text-slate-400 truncate mt-0.5">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
