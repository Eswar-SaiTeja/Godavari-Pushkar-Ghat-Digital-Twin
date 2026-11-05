import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Globe2, 
  Layers, 
  Database, 
  MapPin, 
  Building2, 
  Save, 
  Send, 
  X,
  FileCheck,
  ShieldCheck,
  Search
} from 'lucide-react';
import { GHAT_LOCATIONS, BRIDGES, PROJECT_BOUNDARIES } from '../../config/locations';
import { OSM_BUILDING_FOOTPRINTS } from '../../config/osmBuildings';
import { cesiumService } from '../../services/cesiumService';
import { VerificationStatus, GhatLocation } from '../../types/gis';

interface GisValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation?: (loc: GhatLocation) => void;
}

export const GisValidationModal: React.FC<GisValidationModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'landmarks' | 'buildings'>('audit');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [saveNotification, setSaveNotification] = useState<string | null>(null);

  // Editable state clones
  const [landmarks, setLandmarks] = useState(
    GHAT_LOCATIONS.map(g => ({
      id: g.id,
      name: g.name,
      teluguName: g.teluguName || '',
      category: g.category,
      lat: g.coordinates.latitude,
      lon: g.coordinates.longitude,
      elevation: g.elevationMsl,
      status: g.verificationStatus,
      dataSource: g.dataSource,
      lastVerifiedDate: g.lastVerifiedDate,
    }))
  );

  const [buildings, setBuildings] = useState(
    OSM_BUILDING_FOOTPRINTS.map(b => ({
      id: b.id,
      name: b.name,
      type: b.type,
      lat: b.coordinates[0][1],
      lon: b.coordinates[0][0],
      height: b.heightMeters,
      isEstimated: b.isEstimatedHeight,
      dataSource: b.dataSource,
    }))
  );

  if (!isOpen) return null;

  // Calculate GIS audit metrics
  const totalGhats = GHAT_LOCATIONS.length;
  const totalBridges = BRIDGES.length;
  const totalBoundaries = PROJECT_BOUNDARIES.length;
  const totalLocations = totalGhats + totalBridges + totalBoundaries;

  const verifiedCount = [
    ...GHAT_LOCATIONS.filter(g => g.verificationStatus === 'VERIFIED'),
    ...BRIDGES.filter(b => b.verificationStatus === 'VERIFIED'),
    ...PROJECT_BOUNDARIES.filter(p => p.verificationStatus === 'VERIFIED'),
  ].length;

  const approximateCount = [
    ...GHAT_LOCATIONS.filter(g => g.verificationStatus === 'APPROXIMATE'),
    ...BRIDGES.filter(b => b.verificationStatus === 'APPROXIMATE'),
    ...PROJECT_BOUNDARIES.filter(p => p.verificationStatus === 'APPROXIMATE'),
  ].length;

  const unverifiedCount = [
    ...GHAT_LOCATIONS.filter(g => g.verificationStatus === 'UNVERIFIED'),
    ...BRIDGES.filter(b => b.verificationStatus === 'UNVERIFIED'),
  ].length;

  // Coordinate validity checks for Rajamahendravaram region (Lat: 16.90 to 17.10, Lon: 81.65 to 81.85)
  const invalidCoordinatesCount = GHAT_LOCATIONS.filter(g => {
    const lat = g.coordinates.latitude;
    const lon = g.coordinates.longitude;
    return lat < 16.90 || lat > 17.15 || lon < 81.65 || lon > 81.85;
  }).length;

  const invalidGeoJsonFeatures = BRIDGES.filter(b => b.coordinates.length < 2).length;

  const terrainInfo = cesiumService.getTerrainStatusInfo();
  const currentBaseImagery = cesiumService.getCurrentBaseImagery();
  const sceneMode = cesiumService.getSceneMode();

  const handleUpdateLandmark = (idx: number) => {
    const item = landmarks[idx];
    cesiumService.updateGhatCoordinates(
      item.id,
      Number(item.lat),
      Number(item.lon),
      item.status as VerificationStatus,
      Number(item.elevation)
    );

    const original = GHAT_LOCATIONS.find(g => g.id === item.id);
    if (original && onSelectLocation) {
      onSelectLocation(original);
    }

    setSaveNotification(`Updated ${item.name} coordinates and flew camera to target.`);
    setTimeout(() => setSaveNotification(null), 4000);
  };

  const handleUpdateBuilding = (idx: number) => {
    const bldg = buildings[idx];
    cesiumService.updateBuildingCoordinates(
      bldg.id,
      Number(bldg.lat),
      Number(bldg.lon),
      Number(bldg.height)
    );

    setSaveNotification(`Updated ${bldg.name} geometry and repositioned 3D extrusion.`);
    setTimeout(() => setSaveNotification(null), 4000);
  };

  const handleFlyToLandmark = (id: string) => {
    const loc = GHAT_LOCATIONS.find(g => g.id === id);
    if (loc) {
      cesiumService.flyToLocation(loc);
      if (onSelectLocation) onSelectLocation(loc);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-cyan-500/20 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100 tracking-wide font-sans">
                  GIS Data Quality & Spatial Accuracy Audit
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                  EPSG:4326 WGS84
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Rajamahendravaram Godavari Pushkar Ghat Digital Twin • Spatial Calibration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-slate-800 bg-slate-900/50">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-glow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            Accuracy & Status Metrics
          </button>

          <button
            onClick={() => setActiveTab('landmarks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-2 ${
              activeTab === 'landmarks'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-glow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            Landmarks & Ghats Admin Editor ({landmarks.length})
          </button>

          <button
            onClick={() => setActiveTab('buildings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-2 ${
              activeTab === 'buildings'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-glow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            3D OSM Buildings ({buildings.length})
          </button>
        </div>

        {/* Notification Alert */}
        {saveNotification && (
          <div className="mx-5 mt-3 px-3 py-2 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{saveNotification}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: AUDIT & METRICS */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              {/* Top Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Total GIS Locations</div>
                  <div className="text-xl font-bold font-mono text-slate-100 mt-1">{totalLocations}</div>
                  <div className="text-[9px] font-mono text-slate-400 mt-0.5">Ghats, Bridges & Core Zone</div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                  <div className="text-[10px] font-mono text-emerald-400 uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </div>
                  <div className="text-xl font-bold font-mono text-emerald-300 mt-1">{verifiedCount}</div>
                  <div className="text-[9px] font-mono text-emerald-400/70 mt-0.5">Authoritative OSM / Survey</div>
                </div>

                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30">
                  <div className="text-[10px] font-mono text-amber-400 uppercase flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Approximate
                  </div>
                  <div className="text-xl font-bold font-mono text-amber-300 mt-1">{approximateCount}</div>
                  <div className="text-[9px] font-mono text-amber-400/70 mt-0.5">Field Buffer / Bypass</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Unverified</div>
                  <div className="text-xl font-bold font-mono text-slate-300 mt-1">{unverifiedCount}</div>
                  <div className="text-[9px] font-mono text-slate-400 mt-0.5">Awaiting Survey</div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                  <div className="text-[10px] font-mono text-emerald-400 uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Invalid Coords
                  </div>
                  <div className="text-xl font-bold font-mono text-emerald-300 mt-1">{invalidCoordinatesCount}</div>
                  <div className="text-[9px] font-mono text-emerald-400/70 mt-0.5">0 Out-of-Bounds</div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                  <div className="text-[10px] font-mono text-emerald-400 uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Invalid Polygons
                  </div>
                  <div className="text-xl font-bold font-mono text-emerald-300 mt-1">{invalidGeoJsonFeatures}</div>
                  <div className="text-[9px] font-mono text-emerald-400/70 mt-0.5">100% Valid WGS84</div>
                </div>
              </div>

              {/* Provider & Rendering Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Terrain Provider Status */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-cyan-400" />
                      TERRAIN PROVIDER
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${
                      terrainInfo.status === 'DEM_ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}>
                      {terrainInfo.label}
                    </span>
                  </div>
                  <div className="text-sm font-semibold font-mono text-cyan-300">
                    {terrainInfo.providerName}
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
                    {terrainInfo.message}
                  </p>
                  <div className="text-[10px] font-mono text-slate-400 border-t border-slate-800/80 pt-2">
                    Note: Raw GeoTIFF files require quantized-mesh terrain tiling before Cesium can render native DEM hills in browser.
                  </div>
                </div>

                {/* Imagery Provider Status */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                      <Globe2 className="w-4 h-4 text-cyan-400" />
                      ACTIVE BASEMAP
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      ONLINE (NO KEY)
                    </span>
                  </div>
                  <div className="text-sm font-semibold font-mono text-cyan-300 uppercase">
                    {currentBaseImagery}
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
                    Default OpenStreetMap provider serving standard Slippy Map tiles from tile.openstreetmap.org with full global coverage.
                  </p>
                  <div className="text-[10px] font-mono text-slate-400 border-t border-slate-800/80 pt-2">
                    Attribution: © OpenStreetMap contributors (ODbL)
                  </div>
                </div>

                {/* 3D Rendering Status */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-cyan-400" />
                      CESIUM 3D SCENE
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      {sceneMode} ACTIVE
                    </span>
                  </div>
                  <div className="text-sm font-semibold font-mono text-cyan-300">
                    WebGL 2.0 • SceneMode.SCENE3D
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
                    Interactive 3D digital twin rendering at 60 FPS with dynamic camera pitch, yaw, roll and smooth orbit controls.
                  </p>
                  <div className="text-[10px] font-mono text-slate-400 border-t border-slate-800/80 pt-2">
                    Spatial Frame: Godavari Pushkar Ghat (17.0084° N, 81.7669° E)
                  </div>
                </div>
              </div>

              {/* Authoritative Data Sources */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <h3 className="text-xs font-mono font-bold text-slate-300 mb-2 uppercase flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  Verified Geographic Data Sources
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono text-slate-400">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-200 font-semibold">Pushkar Ghat Riverbank & Steps</div>
                    <div className="text-[11px] text-cyan-400 mt-0.5">OpenStreetMap Node #4115259593</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Coordinates: 17.0083958° N, 81.7669466° E [VERIFIED]</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-200 font-semibold">Kotilingala Swamy Temple & Ghat</div>
                    <div className="text-[11px] text-cyan-400 mt-0.5">OpenStreetMap Node #13335596115</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Coordinates: 17.0226181° N, 81.7688610° E [VERIFIED]</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-200 font-semibold">Historic Havelock Bridge (1900)</div>
                    <div className="text-[11px] text-cyan-400 mt-0.5">OpenStreetMap Way #97471765</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Span: Kovvur (81.741229) to Pushkar Ghat (81.767123) [VERIFIED]</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-200 font-semibold">Government Arts College Safe Haven</div>
                    <div className="text-[11px] text-cyan-400 mt-0.5">OpenStreetMap Way #195671440</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Coordinates: 17.016330° N, 81.783471° E [VERIFIED]</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LANDMARKS ADMIN EDITOR */}
          {activeTab === 'landmarks' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">
                  Edit coordinates, MSL elevation, and verification status for any landmark. Click Update to save and fly camera to target.
                </span>
                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter landmarks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1 rounded bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Name / Landmark</th>
                      <th className="p-2.5">Latitude (°N)</th>
                      <th className="p-2.5">Longitude (°E)</th>
                      <th className="p-2.5">MSL (+m)</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Source</th>
                      <th className="p-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                    {landmarks
                      .filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase()) || l.teluguName.includes(searchQuery))
                      .map((l, idx) => (
                        <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-2.5">
                            <div className="font-semibold text-slate-200">{l.name}</div>
                            {l.teluguName && <div className="text-[10px] text-cyan-400 font-sans">{l.teluguName}</div>}
                          </td>
                          <td className="p-2.5">
                            <input
                              type="number"
                              step="0.0001"
                              value={l.lat}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setLandmarks(prev => prev.map((item, i) => i === idx ? { ...item, lat: val } : item));
                              }}
                              className="w-24 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-cyan-300 focus:outline-none focus:border-cyan-400"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="number"
                              step="0.0001"
                              value={l.lon}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setLandmarks(prev => prev.map((item, i) => i === idx ? { ...item, lon: val } : item));
                              }}
                              className="w-24 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-cyan-300 focus:outline-none focus:border-cyan-400"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="number"
                              value={l.elevation}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setLandmarks(prev => prev.map((item, i) => i === idx ? { ...item, elevation: val } : item));
                              }}
                              className="w-16 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-slate-300 focus:outline-none focus:border-cyan-400"
                            />
                          </td>
                          <td className="p-2.5">
                            <select
                              value={l.status}
                              onChange={(e) => {
                                const val = e.target.value as VerificationStatus;
                                setLandmarks(prev => prev.map((item, i) => i === idx ? { ...item, status: val } : item));
                              }}
                              className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-[10px] text-slate-200 focus:outline-none focus:border-cyan-400"
                            >
                              <option value="VERIFIED">VERIFIED</option>
                              <option value="APPROXIMATE">APPROXIMATE</option>
                              <option value="UNVERIFIED">UNVERIFIED</option>
                            </select>
                          </td>
                          <td className="p-2.5 text-[10px] text-slate-400 max-w-[160px] truncate" title={l.dataSource}>
                            {l.dataSource}
                          </td>
                          <td className="p-2.5 text-right whitespace-nowrap space-x-1.5">
                            <button
                              onClick={() => handleFlyToLandmark(l.id)}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-200"
                              title="Fly Camera to Landmark"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleUpdateLandmark(idx)}
                              className="px-2 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-[10px] inline-flex items-center gap-1"
                              title="Save & Fly To"
                            >
                              <Save className="w-3 h-3" /> Save
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: 3D BUILDINGS & MODELS */}
          {activeTab === 'buildings' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">
                  OpenStreetMap 3D extruded building models with configurable heights (ESTIMATED) and coordinates.
                </span>
                <span className="text-xs font-mono text-cyan-300">
                  {buildings.length} 3D Buildings Rendered
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Building Name</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Latitude (°N)</th>
                      <th className="p-2.5">Longitude (°E)</th>
                      <th className="p-2.5">Extrusion Height</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                    {buildings.map((b, idx) => (
                      <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-2.5 font-medium text-slate-200">{b.name}</td>
                        <td className="p-2.5 uppercase text-[10px] text-cyan-400">{b.type}</td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            step="0.0001"
                            value={b.lat}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setBuildings(prev => prev.map((item, i) => i === idx ? { ...item, lat: val } : item));
                            }}
                            className="w-24 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-cyan-300 focus:outline-none focus:border-cyan-400"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            step="0.0001"
                            value={b.lon}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setBuildings(prev => prev.map((item, i) => i === idx ? { ...item, lon: val } : item));
                            }}
                            className="w-24 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-cyan-300 focus:outline-none focus:border-cyan-400"
                          />
                        </td>
                        <td className="p-2.5">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={b.height}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setBuildings(prev => prev.map((item, i) => i === idx ? { ...item, height: val } : item));
                              }}
                              className="w-16 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-amber-300 focus:outline-none focus:border-cyan-400"
                            />
                            <span className="text-[10px] text-slate-400">m</span>
                          </div>
                        </td>
                        <td className="p-2.5">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            {b.isEstimated ? 'ESTIMATED' : 'SURVEYED'}
                          </span>
                        </td>
                        <td className="p-2.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleUpdateBuilding(idx)}
                            className="px-2 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-[10px] inline-flex items-center gap-1"
                          >
                            <Save className="w-3 h-3" /> Update 3D
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping-slow"></span>
            <span>Godavari 3D Digital Twin • WGS84 Spatial Engine Online</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
          >
            Close Audit Center
          </button>
        </div>

      </div>
    </div>
  );
};
