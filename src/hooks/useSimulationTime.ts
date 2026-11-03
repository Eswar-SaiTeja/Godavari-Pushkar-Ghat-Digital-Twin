import { useState, useEffect } from 'react';
import { SimulationMode } from '../types/simulation';

export function useSimulationTime() {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [simulationMode, setSimulationMode] = useState<SimulationMode>('LIVE_OVERVIEW');
  const [simulatedTime, setSimulatedTime] = useState<Date>(new Date());
  
  // Simulated dynamic telemetry metrics
  const [simulatedDevoteeCount, setSimulatedDevoteeCount] = useState<number>(18240);
  const [simulatedRiverLevel, setSimulatedRiverLevel] = useState<number>(13.8); // MSL in meters
  const [simulatedDischarge] = useState<number>(325000); // cusecs

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setSimulatedTime(prev => new Date(prev.getTime() + 1000 * playbackSpeed));
      
      // Add subtle dynamic variance to demo telemetry
      setSimulatedDevoteeCount(prev => {
        const delta = Math.floor((Math.random() - 0.48) * 15 * playbackSpeed);
        return Math.max(8000, Math.min(48000, prev + delta));
      });

      setSimulatedRiverLevel(prev => {
        const delta = (Math.random() - 0.5) * 0.005;
        return Number((prev + delta).toFixed(2));
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  const togglePlayPause = () => setIsPlaying(prev => !prev);

  const resetClock = () => {
    setSimulatedTime(new Date());
  };

  return {
    isPlaying,
    playbackSpeed,
    simulationMode,
    simulatedTime,
    simulatedDevoteeCount,
    simulatedRiverLevel,
    simulatedDischarge,
    togglePlayPause,
    setPlaybackSpeed,
    setSimulationMode,
    resetClock,
  };
}
