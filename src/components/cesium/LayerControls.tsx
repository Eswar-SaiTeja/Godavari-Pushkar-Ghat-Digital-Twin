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
  CheckCircle2,
  Building2,
  Droplets,
  Box,
  Database,
  FileCheck,
  AlertTriangle,
  Radio,
  Activity,
  Compass
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
  onOpenGisValidation?: () => void;
}

export const LayerControls: React.FC<LayerControlsProps> = ({
  layers,
  onToggleLayer,
  baseImagery,
  onChangeBaseImagery,
  isOpen,
  onClose,
  onOpenGisValidation,
}) => {
  const [providerNotification, setProviderNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  const googleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_3D_TILES_KEY;
  const hasGoogleKey = Boolean(googleKey && typeof googleKey === 'string' && googleKey.trim().length > 10);
  const terrainInfo = cesiumService.getTerrainStatusInfo();

  // 1. BASEMAP PROVIDERS
  const baseLayerOptions: { id: BaseImageryProvider; label: string; desc: string; badge?: string; badgeColor?: string }[] = [
    { 
      id: 'osm', 
      label: 'OpenStreetMap (Primary)', 
      desc: 'Topographic cartography • Zero API key • High reliability',
      badge: 'ACTIVE DEFAULT',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    },
    { 
      id: 'esri_satellite', 
      label: 'Esri Satellite Aerial', 
      desc: 'High-resolution photorealistic imagery (No Key)',
      badge: 'HIGH-RES',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
    },
    { 
      id: 'dark_canvas', 
      label: 'Esri Dark Canvas', 
      desc: 'High-contrast command HUD background (No Key)',
      badge: 'COMMAND HUD',
      badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/40'
    },
    { 
      id: 'esri_topo', 
      label: 'Esri Topographic', 
      desc: 'Urban streets & regional contour grid (No Key)',
    },
    { 
      id: 'google_3d_tiles', 
      label: 'Google 3D Tiles (Optional)', 
      desc: hasGoogleKey ? 'Photorealistic 3D Mesh' : 'Optional • Requires external API Key in .env',
      badge: hasGoogleKey ? 'CONFIGURED' : 'KEY REQUIRED',
      badgeColor: hasGoogleKey ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
    },
  ];

  // 2. 3D BUILDINGS & STRUCTURES
  const buildingLayerItems: { key: keyof LayerVisibilityState; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
    { 
      key: 'buildings3D', 
      label: 'OSM 3D Buildings & Pavilions', 
      desc: 'Extruded building footprints (ESTIMATED Heights)', 
      icon: <Building2 className="w-4 h-4" />, 
      color: 'text-amber-400' 
    },
    { 
      key: 'custom3DModels', 
      label: 'Custom 3D Models (GLB / glTF)', 
      desc: 'High-fidelity temple, mandapam & tower models', 
      icon: <Box className="w-4 h-4" />, 
      color: 'text-violet-400' 
    },
  ];

  // 3. GIS VECTOR OVERLAYS
  const gisVectorItems: { key: keyof LayerVisibilityState; label: string; icon: React.ReactNode; color: string }[] = [
    { key: 'operationalZones', label: 'Operational Ghat Zones (7 Sectors)', icon: <Compass className="w-4 h-4" />, color: 'text-indigo-400' },
    { key: 'eventResources', label: 'Field Resources (Police, Medical, Fire)', icon: <Radio className="w-4 h-4" />, color: 'text-orange-400' },
    { key: 'dispatchRoutes', label: 'Active Dispatch Corridors (Simulated)', icon: <Activity className="w-4 h-4" />, color: 'text-emerald-400' },
    { key: 'riverWaterSurface', label: 'Godavari River Water Body', icon: <Droplets className="w-4 h-4" />, color: 'text-sky-400' },
    { key: 'ghats', label: 'Bathing Ghats & Landmarks [VERIFIED]', icon: <Sparkles className="w-4 h-4" />, color: 'text-cyan-300' },
    { key: 'bridges', label: 'Godavari Historic Bridges [VERIFIED]', icon: <Layers className="w-4 h-4" />, color: 'text-blue-400' },
    { key: 'emergencyZones', label: 'Evacuation Routes & Safe Havens', icon: <ShieldAlert className="w-4 h-4" />, color: 'text-rose-400' },
    { key: 'boundaries', label: 'Digital Twin Project Boundary', icon: <MapIcon className="w-4 h-4" />, color: 'text-cyan-400' },
    { key: 'demElevationGrid', label: 'DEM Bathymetric Elevation Grid (3D)', icon: <Mountain className="w-4 h-4" />, color: 'text-emerald-400' },
    { key: 'waterFlowVectors', label: 'Hydrodynamic Flow Direction Vectors', icon: <Waves className="w-4 h-4" />, color: 'text-sky-400' },
    { key: 'crowdDensityHeatmap', label: 'Crowd Density Rings (Simulated)', icon: <Users className="w-4 h-4" />, color: 'text-amber-400' },
    { key: 'labels3D', label: '3D Spatial Pin Labels', icon: <Eye className="w-4 h-4" />, color: 'text-slate-300' },
  ];

  const handleBaseLayerSelect = async (provider: BaseImageryProvider) => {
    if (provider === 'google_3d_tiles' && !hasGoogleKey) {
      setProviderNotification('Google Photorealistic 3D Tiles requires a valid Google Maps API Key configured in .env (VITE_GOOGLE_MAPS_API_KEY). OpenStreetMap remains default active.');
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
      subtitle="Hybrid GIS • Free Spatial Movement"
      icon={<Layers className="w-4 h-4" />}
      defaultPosition={{ x: 300, y: 76 }}
      defaultSize={{ width: 340, height: 'auto' }}
      minWidth={300}
      maxWidth={540}
      maxHeight={780}
      isOpen={isOpen}
      onClose={onClose}
      resizable={true}
    >
      <div className="space-y-4">
        {/* SECTION 1: TERRAIN ELEVATION MODEL */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Database className="w-3 h-3 text-cyan-400" />
              Terrain Elevation Status
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold border ${
              terrainInfo.status === 'DEM_ACTIVE'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}>
              {terrainInfo.label}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-semibold">{terrainInfo.providerName}</span>
              <span className="text-[9px] text-slate-400">EPSG:4326</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-snug">
              {terrainInfo.message}
            </p>
            <div className="text-[9px] text-amber-300/80 flex items-start gap-1 pt-1 border-t border-slate-800/80">
              <AlertTriangle className="w-3 h-3 flex-shrink-0 text-amber-400 mt-0.5" />
              <span>Copernicus DEM GLO-30 GeoTIFF requires offline quantized-mesh tiling for browser 3D hills.</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: 3D BUILDINGS & STRUCTURES */}
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-amber-400" />
            3D Buildings & Infrastructure (Hybrid GIS)
          </span>
          <div className="space-y-1.5">
            {buildingLayerItems.map((item) => {
              const isEnabled = layers[item.key];
              return (
                <button
                  key={item.key}
                  onClick={() => onToggleLayer(item.key)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    isEnabled
                      ? 'bg-slate-800/90 text-slate-100 border border-slate-700/80 hover:border-cyan-500/40'
                      : 'bg-slate-900/40 text-slate-400 border border-transparent hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-start gap-2 text-left">
                    <span className={`mt-0.5 ${isEnabled ? item.color : 'text-slate-400'}`}>
                      {item.icon}
                    </span>
                    <div>
                      <div className="truncate font-semibold">{item.label}</div>
                      <div className="text-[9px] text-slate-400">{item.desc}</div>
                    </div>
                  </div>
                  <div className={`p-1 rounded ${isEnabled ? 'text-cyan-400' : 'text-slate-400'}`}>
                    {isEnabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: GIS VECTOR OVERLAYS */}
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center gap-1">
            <MapIcon className="w-3 h-3 text-cyan-400" />
            GIS Vector Overlays & Corridors
          </span>
          <div className="space-y-1">
            {gisVectorItems.map((item) => {
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
        </div>

        {/* SECTION 4: BASE IMAGERY PROVIDER */}
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

        {/* SECTION 5: GIS AUDIT & EDIT BUTTON */}
        {onOpenGisValidation && (
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={onOpenGisValidation}
              className="w-full py-2 px-3 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/90 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-semibold transition-all flex items-center justify-center gap-2 shadow-panel"
            >
              <FileCheck className="w-4 h-4 text-cyan-400" />
              <span>Open GIS Accuracy & Coordinate Audit</span>
            </button>
          </div>
        )}
      </div>
    </FloatingPanel>
  );
};
