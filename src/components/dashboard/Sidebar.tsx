import React from 'react';
import { 
  Globe2, 
  MountainSnow, 
  Users, 
  Car, 
  Waves, 
  ShieldAlert, 
  Ship, 
  Activity, 
  Database, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  X,
  Compass,
  Radio
} from 'lucide-react';
import { SIDEBAR_MODULES } from '../../config/modules';
import { SidebarModuleId, ModuleDefinition } from '../../types/simulation';
import { Badge } from '../common/Badge';

interface SidebarProps {
  activeModule: SidebarModuleId;
  onSelectModule: (module: ModuleDefinition) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  isOpenMobile,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
}) => {
  const getIcon = (name: string) => {
    switch (name) {
      case 'Globe2': return <Globe2 className="w-5 h-5 flex-shrink-0" />;
      case 'MountainSnow': return <MountainSnow className="w-5 h-5 flex-shrink-0" />;
      case 'Users': return <Users className="w-5 h-5 flex-shrink-0" />;
      case 'Car': return <Car className="w-5 h-5 flex-shrink-0" />;
      case 'Waves': return <Waves className="w-5 h-5 flex-shrink-0" />;
      case 'ShieldAlert': return <ShieldAlert className="w-5 h-5 flex-shrink-0" />;
      case 'Ship': return <Ship className="w-5 h-5 flex-shrink-0" />;
      case 'Activity': return <Activity className="w-5 h-5 flex-shrink-0" />;
      case 'Database': return <Database className="w-5 h-5 flex-shrink-0" />;
      case 'Settings': return <Settings className="w-5 h-5 flex-shrink-0" />;
      default: return <Globe2 className="w-5 h-5 flex-shrink-0" />;
    }
  };

  const getStatusBadge = (mod: ModuleDefinition) => {
    if (mod.status === 'ACTIVE_DAY1') {
      return <Badge variant="cyan" size="sm">ACTIVE</Badge>;
    }
    if (mod.status === 'SIMULATED_PREVIEW') {
      return <Badge variant="amber" size="sm">SIMULATED</Badge>;
    }
    return <Badge variant="slate" size="sm">PLAN</Badge>;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Main Sidebar Element */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 glass-panel border-r border-cyan-500/20 flex flex-col transition-all duration-300 ${
          isOpenMobile ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-16' : 'lg:w-72'}`}
      >
        {/* Sidebar Header / Collapse Button */}
        <div className="flex items-center justify-between p-3 border-b border-slate-800/80">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-bold tracking-wider text-slate-300 uppercase">
                Navigation Modules
              </span>
            </div>
          )}

          {/* Desktop Collapse Toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-cyan-400 border border-slate-700/50 transition-colors ml-auto"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded bg-slate-800 text-slate-400 hover:text-slate-100 lg:hidden ml-auto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modules List */}
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
          {SIDEBAR_MODULES.map((module) => {
            const isActive = activeModule === module.id;
            return (
              <button
                key={module.id}
                onClick={() => {
                  onSelectModule(module);
                  if (isOpenMobile) onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 border border-cyan-400/40 shadow-glow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
                title={isCollapsed ? `${module.label} (${module.status})` : undefined}
              >
                <div className={`p-1.5 rounded-md ${
                  isActive 
                    ? 'bg-cyan-500/30 text-cyan-300' 
                    : 'bg-slate-800/80 text-slate-400 group-hover:text-cyan-400'
                }`}>
                  {getIcon(module.iconName)}
                </div>

                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold truncate tracking-wide">
                        {module.label}
                      </span>
                      {getStatusBadge(module)}
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {module.shortDesc}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer: Digital Twin Telemetry & Specs */}
        {!isCollapsed && (
          <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 text-[11px] font-mono text-slate-400 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                Telemetries:
              </span>
              <span className="text-cyan-300 font-semibold">SYNTHETIC (DEMO)</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>CRS: EPSG:4326 (WGS84)</span>
              <span>Grid: 30m Res</span>
            </div>
            <div className="text-[9px] text-slate-400 leading-tight border-t border-slate-800/60 pt-1.5">
              Godavari Pushkar Ghat 3D Twin • Built with CesiumJS & React
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
