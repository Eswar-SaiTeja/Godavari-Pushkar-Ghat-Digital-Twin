import React from 'react';
import * as Cesium from 'cesium';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Waves, 
  Users, 
  Bookmark
} from 'lucide-react';
import { BOOKMARK_VIEWS } from '../../config/modules';
import { BookmarkView } from '../../types/simulation';
import { cesiumService } from '../../services/cesiumService';

interface SimulationToolbarProps {
  isPlaying: boolean;
  onTogglePlayPause: () => void;
  playbackSpeed: number;
  onSelectPlaybackSpeed: (speed: number) => void;
  simulatedTime: Date;
  onResetClock: () => void;
  devoteeCount: number;
  riverLevelMsl: number;
  dischargeCusecs: number;
  onResetMap: () => void;
}

export const SimulationToolbar: React.FC<SimulationToolbarProps> = ({
  isPlaying,
  onTogglePlayPause,
  playbackSpeed,
  onSelectPlaybackSpeed,
  simulatedTime,
  onResetClock,
  devoteeCount,
  riverLevelMsl,
  dischargeCusecs,
  onResetMap,
}) => {
  const [isBookmarksOpen, setIsBookmarksOpen] = React.useState<boolean>(false);

  const speedOptions = [0.5, 1, 2, 5];

  const handleFlyToBookmark = (bm: BookmarkView) => {
    const { longitude, latitude, height, heading, pitch, roll } = bm.camera;
    if (cesiumService.viewer) {
      cesiumService.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
        orientation: {
          heading: Cesium.Math.toRadians(heading),
          pitch: Cesium.Math.toRadians(pitch),
          roll: Cesium.Math.toRadians(roll),
        },
        duration: 2.2,
      });
    }
    setIsBookmarksOpen(false);
  };

  const formatIST = (date: Date) => {
    return date.toLocaleTimeString('en-IN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[95%] max-w-4xl select-none">
      {/* Bookmarks Flyout Popover */}
      {isBookmarksOpen && (
        <div className="mb-2 p-3 glass-panel rounded-2xl border border-cyan-500/30 shadow-panel animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700/60 mb-2">
            <span className="text-xs font-mono font-bold tracking-wider text-cyan-300 uppercase flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5" />
              Strategic Godavari Camera Angles
            </span>
            <button
              onClick={() => setIsBookmarksOpen(false)}
              className="text-[11px] font-mono text-slate-400 hover:text-slate-200"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {BOOKMARK_VIEWS.map((bm) => (
              <button
                key={bm.id}
                onClick={() => handleFlyToBookmark(bm)}
                className="p-2 rounded-xl bg-slate-900/80 hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-400/50 text-left transition-all group"
              >
                <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 truncate">
                  {bm.name}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  {bm.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Glass Control Bar */}
      <div className="glass-panel rounded-2xl border border-cyan-500/30 p-2 md:p-3 shadow-panel flex flex-wrap items-center justify-between gap-3">
        {/* Left: Playback Controls */}
        <div className="flex items-center gap-2">
          {/* Play/Pause Button */}
          <button
            onClick={onTogglePlayPause}
            className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${
              isPlaying
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-glow-sm hover:bg-cyan-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-400/50 hover:bg-amber-500/30'
            }`}
            title={isPlaying ? 'Pause Simulation Clock' : 'Resume Simulation Clock'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          {/* Speed Selector Buttons */}
          <div className="flex items-center rounded-xl bg-slate-900/80 border border-slate-800 p-0.5">
            {speedOptions.map((spd) => (
              <button
                key={spd}
                onClick={() => onSelectPlaybackSpeed(spd)}
                className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  playbackSpeed === spd
                    ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Time Scrubber Display */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800 font-mono text-xs">
            <span className="text-slate-400 text-[10px]">T:</span>
            <span className="font-bold text-slate-100">{formatIST(simulatedTime)}</span>
            <button
              onClick={onResetClock}
              className="text-slate-400 hover:text-cyan-400 transition-colors ml-1"
              title="Reset Clock to Now"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Center: Live Simulated Telemetry Chips */}
        <div className="hidden md:flex items-center gap-2.5 font-mono text-[11px]">
          {/* Simulated Devotee Load */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Crowd:</span>
            <span className="text-cyan-300 font-bold">{devoteeCount.toLocaleString()}</span>
            <span className="text-[9px] text-amber-400/80">(SIM)</span>
          </div>

          {/* Simulated River Water Level */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800">
            <Waves className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400">Godavari:</span>
            <span className="text-sky-300 font-bold">{riverLevelMsl}m MSL</span>
            <span className="text-[9px] text-amber-400/80">(DEMO)</span>
          </div>

          {/* Discharge Rate */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400">Flow:</span>
            <span className="text-slate-200 font-bold">{(dischargeCusecs/100000).toFixed(2)}L</span>
            <span className="text-[10px] text-slate-400">cusecs</span>
          </div>
        </div>

        {/* Right: View Bookmarks & Quick Reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBookmarksOpen(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all ${
              isBookmarksOpen
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60 shadow-glow-sm'
                : 'bg-slate-900/80 text-slate-300 border-slate-700/60 hover:text-cyan-400 hover:border-cyan-500/40'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Camera Angles</span>
          </button>

          <button
            onClick={onResetMap}
            className="p-1.5 px-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700/60 hover:text-cyan-400 transition-colors flex items-center gap-1"
            title="Reset Map to Pushkar Ghat"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
