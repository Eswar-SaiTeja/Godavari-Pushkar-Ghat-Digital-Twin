import React, { useState } from 'react';
import { 
  Send, 
  ShieldCheck, 
  Users, 
  Compass, 
  BookOpen, 
  AlertTriangle,
  Maximize2,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { GhatLocation } from '../../types/gis';
import { GHAT_LOCATIONS } from '../../config/locations';
import { Badge } from '../common/Badge';
import { cesiumService } from '../../services/cesiumService';
import { FloatingPanel } from '../common/FloatingPanel';

interface LocationInfoPanelProps {
  selectedLocation: GhatLocation | null;
  onSelectLocation: (loc: GhatLocation | null) => void;
  onClose: () => void;
}

export const LocationInfoPanel: React.FC<LocationInfoPanelProps> = ({
  selectedLocation,
  onSelectLocation,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isCompact, setIsCompact] = useState<boolean>(true);

  if (!selectedLocation) return null;

  const currentOccupancyPct = Math.round(
    (selectedLocation.pushkaramCapacity.currentSimulatedOccupancy / 
     selectedLocation.pushkaramCapacity.peakCapacityHourly) * 100
  );

  const getStatusVariant = (status: GhatLocation['status']) => {
    switch (status) {
      case 'OPTIMAL': return 'emerald';
      case 'MODERATE': return 'cyan';
      case 'CONGESTED': return 'amber';
      case 'RESTRICTED': return 'rose';
      default: return 'cyan';
    }
  };

  const handleFlyTo = () => {
    cesiumService.flyToLocation(selectedLocation);
  };

  const filteredLocations = GHAT_LOCATIONS.filter(loc => {
    const matchesSearch = loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (loc.teluguName && loc.teluguName.includes(searchQuery));
    const matchesCategory = categoryFilter === 'all' || loc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Default to right side beneath SimulationHUD (y: 196) so they never overlap
  const defaultRightX = typeof window !== 'undefined' ? Math.max(16, window.innerWidth - 390) : 1100;
  const defaultRightY = typeof window !== 'undefined' ? (window.innerHeight < 800 ? 160 : 196) : 196;

  return (
    <FloatingPanel
      id="location_info_panel"
      title={selectedLocation.name}
      subtitle={`${selectedLocation.category.toUpperCase()} ZONE • MSL +${selectedLocation.elevationMsl}m`}
      icon={<Compass className="w-4 h-4" />}
      defaultPosition={{ x: defaultRightX, y: defaultRightY }}
      defaultSize={{ width: 370, height: 'auto' }}
      minWidth={300}
      maxWidth={520}
      maxHeight={780}
      isOpen={Boolean(selectedLocation)}
      onClose={onClose}
      resizable={true}
      headerExtra={
        <button
          onClick={() => setIsCompact(prev => !prev)}
          className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors"
          title={isCompact ? 'Expand Full Directory' : 'Collapse to Compact View'}
        >
          {isCompact ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      }
    >
      {/* COMPACT VIEW MODE (Default state - prevents covering map) */}
      {isCompact ? (
        <div className="space-y-2.5">
          {selectedLocation.teluguName && (
            <p className="text-xs text-cyan-400 font-sans -mt-1 font-medium">
              {selectedLocation.teluguName}
            </p>
          )}

          {/* Quick Density & Occupancy Bar */}
          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                Crowd: {selectedLocation.pushkaramCapacity.currentSimulatedOccupancy.toLocaleString()} pax
              </span>
              <Badge variant={getStatusVariant(selectedLocation.status)} size="sm">
                {selectedLocation.status}
              </Badge>
            </div>

            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden relative">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  currentOccupancyPct > 80 ? 'bg-rose-500' :
                  currentOccupancyPct > 60 ? 'bg-amber-400' : 'bg-cyan-400'
                }`}
                style={{ width: `${Math.min(100, currentOccupancyPct)}%` }}
              />
            </div>

            <div className="flex justify-between text-[9px] font-mono text-slate-400">
              <span>Occupancy: {currentOccupancyPct}%</span>
              <span>Cap: {selectedLocation.pushkaramCapacity.peakCapacityHourly.toLocaleString()} /hr</span>
            </div>
          </div>

          {/* Compact Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleFlyTo}
              className="flex-1 py-1.5 px-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-glow-cyan"
            >
              <Send className="w-3.5 h-3.5" />
              Fly Camera
            </button>

            <button
              onClick={() => setIsCompact(false)}
              className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono border border-slate-700 transition-colors flex items-center gap-1"
            >
              <Search className="w-3 h-3" />
              Directory ({GHAT_LOCATIONS.length})
            </button>
          </div>
        </div>
      ) : (
        /* EXPANDED FULL DIRECTORY MODE */
        <>
          {/* Search & Quick Directory */}
          <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 mb-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Compass className="w-3 h-3 text-cyan-400" />
                Ghat & Landmark Directory
              </span>
              <div className="flex items-center gap-1.5">
                <Badge variant={getStatusVariant(selectedLocation.status)} size="sm">
                  {selectedLocation.status}
                </Badge>
                <button
                  onClick={() => setIsCompact(true)}
                  className="text-[9px] font-mono text-cyan-400 hover:text-cyan-300 underline ml-1"
                >
                  Compact
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ghats, temples, rescue posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-400/50"
              />
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar text-[10px] font-mono">
              {['all', 'ghat', 'emergency', 'command'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2 py-0.5 rounded capitalize transition-all border ${
                    categoryFilter === cat
                      ? 'bg-cyan-500/30 text-cyan-300 border-cyan-400/50 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {cat === 'all' ? 'All Sites' : cat}
                </button>
              ))}
            </div>

            {/* Scrollable quick pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {filteredLocations.map((loc) => {
                const isCurrent = loc.id === selectedLocation.id;
                return (
                  <button
                    key={loc.id}
                    onClick={() => {
                      onSelectLocation(loc);
                      cesiumService.flyToLocation(loc);
                    }}
                    className={`px-2 py-1 rounded text-[10px] font-mono whitespace-nowrap transition-all border ${
                      isCurrent
                        ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400/60 font-bold'
                        : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {loc.name.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Details Body */}
          <div className="space-y-3.5">
            {selectedLocation.teluguName && (
              <p className="text-xs text-cyan-400 font-sans -mt-1 font-medium">
                {selectedLocation.teluguName}
              </p>
            )}

            {/* Spatial Coordinates Grid */}
            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 font-mono text-[11px]">
              <div>
                <div className="text-slate-400 text-[9px] uppercase">Latitude</div>
                <div className="text-slate-200 font-semibold">{selectedLocation.coordinates.latitude.toFixed(4)}° N</div>
              </div>
              <div>
                <div className="text-slate-400 text-[9px] uppercase">Longitude</div>
                <div className="text-slate-200 font-semibold">{selectedLocation.coordinates.longitude.toFixed(4)}° E</div>
              </div>
              <div>
                <div className="text-slate-400 text-[9px] uppercase">Elevation (MSL)</div>
                <div className="text-cyan-400 font-semibold">+{selectedLocation.elevationMsl}m (DEMO)</div>
              </div>
            </div>

            {/* Simulated Pilgrim Capacity & Occupancy Meter */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-cyan-500/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  Simulated Devotee Density
                </span>
                <Badge variant="amber" size="sm">SIMULATED</Badge>
              </div>

              <div className="flex items-baseline justify-between font-mono">
                <div>
                  <span className="text-xl font-bold text-cyan-300">
                    {selectedLocation.pushkaramCapacity.currentSimulatedOccupancy.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 ml-1">in zone</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Cap: {selectedLocation.pushkaramCapacity.peakCapacityHourly.toLocaleString()} /hr
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${
                    currentOccupancyPct > 80 ? 'bg-rose-500' :
                    currentOccupancyPct > 60 ? 'bg-amber-400' : 'bg-cyan-400'
                  }`}
                  style={{ width: `${Math.min(100, currentOccupancyPct)}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>Occupancy: {currentOccupancyPct}%</span>
                <span>Safety Threshold: {selectedLocation.pushkaramCapacity.safetyThresholdPct}%</span>
              </div>
            </div>

            {/* Description & Historical Significance */}
            <div className="space-y-2 text-xs text-slate-300">
              <p className="leading-relaxed">
                {selectedLocation.description}
              </p>

              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 mb-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  Pushkaram Significance
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  {selectedLocation.historicalSignificance}
                </p>
              </div>
            </div>

            {/* Riverfront Length & Facilities */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="text-slate-400">Riverfront Step Span:</span>
                <span className="font-mono font-semibold text-cyan-300">
                  {selectedLocation.riverfrontLengthMeters > 0 
                    ? `${selectedLocation.riverfrontLengthMeters} meters` 
                    : 'Inland Safe Zone'}
                </span>
              </div>

              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                Integrated Facilities & Safety Posts
              </span>

              <div className="flex flex-wrap gap-1.5">
                {selectedLocation.facilities.map((fac, idx) => (
                  <span 
                    key={idx}
                    className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-[10px] text-slate-300 flex items-center gap-1"
                  >
                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                    {fac}
                  </span>
                ))}
              </div>
            </div>

            {/* Simulated Protocol Disclaimer */}
            <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-500/30 flex items-start gap-2 text-[10px] text-amber-300/90 font-mono">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
              <span>
                NOTICE: Telemetry and crowd counts are SIMULATED for digital-twin architectural modeling and planning exercises.
              </span>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center gap-2">
            <button
              onClick={handleFlyTo}
              className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-glow-cyan"
            >
              <Send className="w-3.5 h-3.5" />
              Fly Camera to Ghat
            </button>

            <button
              onClick={() => cesiumService.flyToInitialPosition()}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 transition-colors"
              title="Return to Overview"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}
    </FloatingPanel>
  );
};

