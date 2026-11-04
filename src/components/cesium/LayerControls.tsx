import React, { useState } from 'react';
import { 
  Layers, 
  Eye, 
  EyeOff, 
  Map as MapIcon, 
  Mountain, 
  Users, 
  Waves, 
  ShieldAlert, 
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';
import { LayerVisibilityState, BaseImageryProvider } from '../../types/gis';
import { cesiumService } from '../../services/cesiumService';
import { FloatingPanel } from '../common/FloatingPanel';

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
  const [providerNotification, setProviderNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  const googleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_3D_TILES_KEY;
  const hasGoogleKey = Boolean(googleKey && typeof googleKey === 'string' && googleKey.trim().length > 10);

  const baseLayerOptions: { id: BaseImageryProvider; label: string; desc: string; badge?: string; badgeColor?: string }[] = [
    { 
      id: 'osm', 
      label: 'OpenStreetMap', 
      desc: 'Topographic cartography (No Key)',
      badge: 'DEFAULT',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
    },
    { 
      id: 'esri_satellite', 
      label: 'Satellite Aerial', 
      desc: 'Photorealistic imagery (No Key)',
      badge: 'HIGH-RES',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    },
    { 
      id: 'dark_canvas', 
      label: 'Dark Canvas', 
      desc: 'High-contrast command HUD (No Key)',
      badge: 'HUD',
      badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/40'
    },
    { 
      id: 'esri_topo', 
      label: 'Esri Topo', 
      desc: 'Urban streets & contour grid (No Key)',
    },
    { 
      id: 'google_3d_tiles', 
      label: 'Google 3D Tiles', 
      desc: hasGoogleKey ? 'Photorealistic 3D Mesh' : 'API Key Required in .env',
      badge: hasGoogleKey ? 'READY' : 'KEY REQUIRED',
      badgeColor: hasGoogleKey ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    },
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

  const handleBaseLayerSelect = async (provider: BaseImageryProvider) => {
    if (provider === 'google_3d_tiles' && !hasGoogleKey) {
      setProviderNotification('Google Photorealistic 3D Tiles requires a valid Google Maps API Key configured in your environment (VITE_GOOGLE_MAPS_API_KEY). OpenStreetMap remains active.');
      onChangeBaseImagery('osm');
      await cesiumService.setBaseImagery('osm');
      return;
    }

    setProviderNotification(null);
    const result = await cesiumService.setBaseImagery(provider);
    onChangeBaseImagery(result.activeProvider);
    if (!result.success && result.message) {
      setProviderNotification(result.message);
    }
  };

  return (
    <FloatingPanel
      id="gis_layers_panel"
      title="GIS Layers & Basemaps"
      subtitle="Spatial Overlays • Free Movement"
      icon={<Layers className="w-4 h-4" />}
      defaultPosition={{ x: 300, y: 76 }}
      defaultSize={{ width: 330, height: 'auto' }}
      minWidth={280}
      maxWidth={520}
      maxHeight={740}
      isOpen={isOpen}
      onClose={onClose}
      resizable={true}
    >
      {/* Vector & Spatial Overlays */}
      <div className="space-y-1.5 mb-3.5">
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
                  ? 'bg-slate-800/80 text-slate-100 border border-slate-700/70 hover:border-cyan-500/40'
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
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
            Base Imagery Provider
          </span>
          <span className="text-[9px] font-mono text-cyan-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> No Watermarks
          </span>
        </div>

        {providerNotification && (
          <div className="mb-2 p-2 rounded-lg bg-amber-950/60 border border-amber-500/40 text-[10px] font-mono text-amber-200 flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 flex-shrink-0 text-amber-400 mt-0.5" />
            <span>{providerNotification}</span>
          </div>
        )}

        <div className="space-y-1.5">
          {baseLayerOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleBaseLayerSelect(opt.id)}
              className={`w-full p-2 rounded-lg text-left text-[11px] font-mono transition-all border flex items-center justify-between ${
                baseImagery === opt.id
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-400/60 shadow-glow-sm'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="truncate mr-2">
                <div className="font-semibold truncate">{opt.label}</div>
                <div className="text-[9px] text-slate-400 truncate mt-0.5">{opt.desc}</div>
              </div>
              {opt.badge && (
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border tracking-wider flex-shrink-0 ${opt.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                  {opt.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </FloatingPanel>
  );
};
