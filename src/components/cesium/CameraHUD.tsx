import React from 'react';
import { Crosshair } from 'lucide-react';
import { DraggableHUDWrapper } from '../common/DraggableHUDWrapper';
import { Badge } from '../common/Badge';

export interface CameraHUDProps {
  telemetry: {
    headingDeg: number;
    pitchDeg: number;
    altitudeMeters: number;
    latitude: number;
    longitude: number;
  };
}

export const CameraHUD: React.FC<CameraHUDProps> = ({ telemetry }) => {
  // Positioned directly below Telemetry HUD (StatusCards at y: 76) on top-left to avoid colliding with bottom SimulationToolbar
  const defaultPos = {
    x: 76,
    y: 172,
  };

  const formattedAlt = telemetry.altitudeMeters > 1000
    ? `${(telemetry.altitudeMeters / 1000).toFixed(2)} km`
    : `${telemetry.altitudeMeters.toFixed(0)} m`;

  return (
    <DraggableHUDWrapper
      panelId="camera_hud"
      defaultPosition={defaultPos}
      title="Camera Spatial HUD"
      icon={<Crosshair className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />}
      badge={<Badge variant="cyan" size="sm">SPATIAL</Badge>}
      minimizedContent={
        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-300">
          <span>ALT: <strong className="text-amber-300">{formattedAlt}</strong></span>
          <span>HDG: <strong className="text-slate-200">{telemetry.headingDeg.toFixed(0)}°</strong></span>
        </div>
      }
    >
      <div className="font-mono text-[10px] text-slate-300 flex items-center gap-2.5 sm:gap-3 py-0.5">
        <div>
          <span className="text-slate-400">LAT:</span>{' '}
          <span className="text-cyan-300 font-bold">{telemetry.latitude.toFixed(5)}°</span>
        </div>
        <span className="text-slate-600">|</span>
        <div>
          <span className="text-slate-400">LON:</span>{' '}
          <span className="text-cyan-300 font-bold">{telemetry.longitude.toFixed(5)}°</span>
        </div>
        <span className="text-slate-600">|</span>
        <div>
          <span className="text-slate-400">ALT:</span>{' '}
          <span className="text-amber-300 font-bold">{formattedAlt}</span>
        </div>
        <span className="text-slate-600">|</span>
        <div>
          <span className="text-slate-400">HDG:</span>{' '}
          <span className="text-slate-200 font-bold">{telemetry.headingDeg.toFixed(0)}°</span>
        </div>
        <span className="text-slate-600">|</span>
        <div>
          <span className="text-slate-400">PITCH:</span>{' '}
          <span className="text-slate-300 font-bold">{telemetry.pitchDeg.toFixed(0)}°</span>
        </div>
      </div>
    </DraggableHUDWrapper>
  );
};
