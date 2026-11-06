import React, { useEffect, useRef, useState } from 'react';
import { cesiumService } from '../../services/cesiumService';
import { crowdEngine } from '../../services/crowdSimulation';
import { trafficEngine } from '../../services/trafficSimulation';
import { emergencyEngine } from '../../services/emergencyDetectionEngine';
import { GhatLocation, LayerVisibilityState } from '../../types/gis';
import { CesiumNavigationControls } from './CesiumNavigationControls';
import { CameraHUD } from './CameraHUD';
import { Globe } from 'lucide-react';

interface CesiumViewerProps {
  layers: LayerVisibilityState;
  onSelectLocation: (loc: GhatLocation | null) => void;
  onTerrainStatusResolved: (status: { hasWorldTerrain: boolean; message: string }) => void;
}

export const CesiumViewer: React.FC<CesiumViewerProps> = ({
  layers,
  onSelectLocation,
  onTerrainStatusResolved,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [telemetry, setTelemetry] = useState<{
    longitude: number;
    latitude: number;
    altitudeMeters: number;
    headingDeg: number;
    pitchDeg: number;
  }>({
    longitude: 81.7669,
    latitude: 17.0084,
    altitudeMeters: 1450,
    headingDeg: 320,
    pitchDeg: -38,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [initError, setInitError] = useState<string | null>(null);

  // Initialize Cesium Viewer
  useEffect(() => {
    let isMounted = true;
    let telemetryTimer: any = null;

    const logDebug = (msg: string) => {
      console.log(msg);
      let el = document.getElementById('debug-log');
      if (!el) {
        el = document.createElement('div');
        el.id = 'debug-log';
        el.style.display = 'none';
        document.body.appendChild(el);
      }
      el.innerText += '\n' + msg;
    };

    logDebug('[CesiumViewer] Mounting, container exists: ' + !!containerRef.current);
    if (!containerRef.current) return;

    logDebug('[CesiumViewer] Calling initializeViewer...');
    cesiumService.initializeViewer(containerRef.current, (loc) => {
      if (isMounted) {
        onSelectLocation(loc);
      }
    })
      .then(({ terrainStatus }) => {
        logDebug('[CesiumViewer] initializeViewer RESOLVED successfully!');
        if (!isMounted) return;
        setIsLoading(false);
        onTerrainStatusResolved(terrainStatus);

        // Attach crowd, traffic and emergency simulation engines to viewer
        if (cesiumService.viewer) {
          crowdEngine.setViewer(cesiumService.viewer);
          trafficEngine.setViewer(cesiumService.viewer);
          emergencyEngine.setViewer(cesiumService.viewer);
          crowdEngine.start();
          trafficEngine.start();
        }

        // Start telemetry polling for camera HUD
        telemetryTimer = setInterval(() => {
          const t = cesiumService.getCameraTelemetry();
          if (t && isMounted) {
            setTelemetry(t);
          }
        }, 300);
      })
      .catch((err) => {
        logDebug('[CesiumViewer] initializeViewer REJECTED: ' + (err?.stack || err?.message || err));
        console.error('[CesiumViewer] Failed to initialize Cesium Viewer:', err);
        if (isMounted) {
          setIsLoading(false);
          setInitError('Failed to initialize Cesium 3D Globe: ' + (err?.message || err));
        }
      });

    return () => {
      isMounted = false;
      if (telemetryTimer) clearInterval(telemetryTimer);
      crowdEngine.destroy();
      trafficEngine.destroy();
      emergencyEngine.destroy();
      cesiumService.destroy();
    };
  }, []);

  // Update layer visibility when state changes
  useEffect(() => {
    cesiumService.updateLayerVisibility(layers);
  }, [layers]);

  // Responsive canvas resizing to prevent zero-height collapse
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      cesiumService.resize();
    });
    observer.observe(containerRef.current);
    window.addEventListener('resize', () => cesiumService.resize());

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', () => cesiumService.resize());
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#050811]">
      {/* Cesium canvas container */}
      <div 
        ref={containerRef} 
        className="w-full h-full cesium-viewer" 
        style={{ width: '100%', height: '100%' }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-[#050811] flex flex-col items-center justify-center z-30">
          <div className="relative flex items-center justify-center w-20 h-20 mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping-slow" />
            <div className="absolute inset-0 rounded-full border-t-2 border-cyan-400 animate-spin" />
            <Globe className="w-8 h-8 text-cyan-400 animate-pulse" />
          </div>
          <h2 className="text-sm font-mono font-bold text-cyan-300 tracking-wider uppercase mb-1">
            Initializing Godavari 3D Digital Twin
          </h2>
          <p className="text-xs font-mono text-slate-400">
            Centering Rajamahendravaram • Loading OSM & Terrain Providers...
          </p>
        </div>
      )}

      {/* Error Fallback */}
      {initError && (
        <div className="absolute inset-0 bg-[#050811]/95 flex flex-col items-center justify-center z-40 p-6 text-center">
          <div className="text-rose-400 text-lg font-bold font-mono mb-2">
            Cesium Initialization Alert
          </div>
          <p className="text-sm text-slate-300 max-w-md font-mono mb-4">
            {initError}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold rounded-lg text-xs"
          >
            Retry Globe Engine
          </button>
        </div>
      )}

      {/* Navigation Controls Component (Right side) */}
      <CesiumNavigationControls 
        headingDeg={telemetry.headingDeg}
        pitchDeg={telemetry.pitchDeg}
        altitudeMeters={telemetry.altitudeMeters}
      />

      {/* Draggable Real-Time Spatial Camera HUD */}
      <CameraHUD telemetry={telemetry} />
    </div>
  );
};
