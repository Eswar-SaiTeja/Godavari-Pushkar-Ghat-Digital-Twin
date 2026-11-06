import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Globe2, 
  Activity, 
  ShieldAlert, 
  Sparkles, 
  Users, 
  Car, 
  Waves, 
  Compass, 
  Radio, 
  Send, 
  BarChart3, 
  Settings, 
  ChevronDown, 
  ChevronUp,
  CheckCircle2
} from 'lucide-react';
import { Badge } from '../common/Badge';

export type GooeyModuleId = 
  | 'overview'
  | '3d_twin'
  | 'operations'
  | 'emergency'
  | 'ai_agent'
  | 'crowd_sim'
  | 'traffic_sim'
  | 'flood_sim'
  | 'evacuation_planning'
  | 'event_ops'
  | 'dispatch'
  | 'analytics'
  | 'settings';

export interface TopGooeyTaskbarProps {
  activeModuleId: GooeyModuleId;
  onSelectModule: (moduleId: GooeyModuleId) => void;
  // Specific action callbacks for backward compatibility and quick handlers
  onToggleOverview?: () => void;
  onToggle3DTwin?: () => void;
  onToggleOperations?: (tab?: string) => void;
  onToggleEmergency?: () => void;
  onToggleAICopilot?: (tab?: string) => void;
  onToggleCrowd?: () => void;
  onToggleTraffic?: () => void;
  onToggleFlood?: () => void;
  onToggleEvacuation?: () => void;
  onToggleEventOps?: () => void;
  onToggleDispatch?: () => void;
  onToggleAnalytics?: () => void;
  onToggleSettings?: () => void;
}

interface ModuleItem {
  id: GooeyModuleId;
  name: string;
  shortLabel: string;
  icon: React.ReactNode;
  category: 'CORE' | 'OPERATIONS' | 'SAFETY' | 'SIMULATION' | 'INTELLIGENCE';
  badge?: string;
  badgeVariant?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'blue';
}

const MODULE_GROUPS: {
  category: 'CORE' | 'OPERATIONS' | 'SAFETY' | 'SIMULATION' | 'INTELLIGENCE';
  title: string;
  icon: React.ReactNode;
  modules: ModuleItem[];
}[] = [
  {
    category: 'CORE',
    title: 'Twin Command',
    icon: <Globe2 className="w-4 h-4 text-cyan-400" />,
    modules: [
      {
        id: 'overview',
        name: 'Overview',
        shortLabel: 'Overview',
        icon: <LayoutDashboard className="w-4 h-4 text-cyan-400" />,
        category: 'CORE',
        badge: 'ACTIVE',
        badgeVariant: 'cyan'
      },
      {
        id: '3d_twin',
        name: '3D Digital Twin',
        shortLabel: '3D Globe',
        icon: <Globe2 className="w-4 h-4 text-sky-400" />,
        category: 'CORE',
        badge: 'CESIUM',
        badgeVariant: 'cyan'
      }
    ]
  },
  {
    category: 'OPERATIONS',
    title: 'Operations & Dispatch',
    icon: <Radio className="w-4 h-4 text-cyan-400" />,
    modules: [
      {
        id: 'operations',
        name: 'Operations',
        shortLabel: 'Operations',
        icon: <Radio className="w-4 h-4 text-cyan-400" />,
        category: 'OPERATIONS',
        badge: 'LIVE',
        badgeVariant: 'emerald'
      },
      {
        id: 'event_ops',
        name: 'Event Operations',
        shortLabel: 'Resources',
        icon: <Activity className="w-4 h-4 text-teal-400" />,
        category: 'OPERATIONS',
      },
      {
        id: 'dispatch',
        name: 'Dispatch',
        shortLabel: 'Dispatch',
        icon: <Send className="w-4 h-4 text-amber-400" />,
        category: 'OPERATIONS',
        badge: 'A*',
        badgeVariant: 'amber'
      },
      {
        id: 'analytics',
        name: 'Analytics',
        shortLabel: 'Analytics',
        icon: <BarChart3 className="w-4 h-4 text-violet-400" />,
        category: 'OPERATIONS',
      }
    ]
  },
  {
    category: 'SAFETY',
    title: 'Safety & Emergency',
    icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
    modules: [
      {
        id: 'emergency',
        name: 'Emergency Management',
        shortLabel: 'Emergency',
        icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
        category: 'SAFETY',
        badge: 'TRIAGE',
        badgeVariant: 'rose'
      },
      {
        id: 'evacuation_planning',
        name: 'Evacuation Planning',
        shortLabel: 'Evacuation',
        icon: <Compass className="w-4 h-4 text-emerald-400" />,
        category: 'SAFETY',
        badge: '+43%',
        badgeVariant: 'emerald'
      }
    ]
  },
  {
    category: 'SIMULATION',
    title: 'Simulation Engines',
    icon: <Users className="w-4 h-4 text-cyan-400" />,
    modules: [
      {
        id: 'crowd_sim',
        name: 'Crowd Simulation',
        shortLabel: 'Crowd',
        icon: <Users className="w-4 h-4 text-cyan-400" />,
        category: 'SIMULATION',
        badge: 'SOCIAL-FORCE',
        badgeVariant: 'cyan'
      },
      {
        id: 'traffic_sim',
        name: 'Traffic & Ingress',
        shortLabel: 'Traffic',
        icon: <Car className="w-4 h-4 text-emerald-400" />,
        category: 'SIMULATION',
      },
      {
        id: 'flood_sim',
        name: 'Flood & Hydrology',
        shortLabel: 'Hydrology',
        icon: <Waves className="w-4 h-4 text-sky-400" />,
        category: 'SIMULATION',
        badge: 'CWC',
        badgeVariant: 'blue'
      }
    ]
  },
  {
    category: 'INTELLIGENCE',
    title: 'AI & Settings',
    icon: <Sparkles className="w-4 h-4 text-purple-400" />,
    modules: [
      {
        id: 'ai_agent',
        name: 'AI Agent',
        shortLabel: 'JARVIS Copilot',
        icon: <Sparkles className="w-4 h-4 text-purple-400" />,
        category: 'INTELLIGENCE',
        badge: 'AI',
        badgeVariant: 'amber'
      },
      {
        id: 'settings',
        name: 'Settings',
        shortLabel: 'Settings',
        icon: <Settings className="w-4 h-4 text-slate-300" />,
        category: 'INTELLIGENCE',
      }
    ]
  }
];

export const TopGooeyTaskbar: React.FC<TopGooeyTaskbarProps> = ({
  activeModuleId,
  onSelectModule,
  onToggleOverview,
  onToggle3DTwin,
  onToggleOperations,
  onToggleEmergency,
  onToggleAICopilot,
  onToggleCrowd,
  onToggleTraffic,
  onToggleFlood,
  onToggleEvacuation,
  onToggleEventOps,
  onToggleDispatch,
  onToggleAnalytics,
  onToggleSettings,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeGroupCategory, setActiveGroupCategory] = useState<string>('CORE');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Find the active module object
  const activeModuleItem = MODULE_GROUPS
    .flatMap(g => g.modules)
    .find(m => m.id === activeModuleId) || MODULE_GROUPS[0].modules[0];

  const handleModuleClick = (module: ModuleItem) => {
    onSelectModule(module.id);
    setIsExpanded(false);

    // Call individual action handlers if registered
    switch (module.id) {
      case 'overview':
        onToggleOverview?.();
        break;
      case '3d_twin':
        onToggle3DTwin?.();
        break;
      case 'operations':
        onToggleOperations?.('overview');
        break;
      case 'event_ops':
        onToggleEventOps ? onToggleEventOps() : onToggleOperations?.('resources');
        break;
      case 'dispatch':
        onToggleDispatch ? onToggleDispatch() : onToggleOperations?.('dispatch');
        break;
      case 'analytics':
        onToggleAnalytics ? onToggleAnalytics() : onToggleOperations?.('analytics');
        break;
      case 'emergency':
        onToggleEmergency?.();
        break;
      case 'evacuation_planning':
        onToggleEvacuation?.();
        break;
      case 'crowd_sim':
        onToggleCrowd?.();
        break;
      case 'traffic_sim':
        onToggleTraffic?.();
        break;
      case 'flood_sim':
        onToggleFlood?.();
        break;
      case 'ai_agent':
        onToggleAICopilot?.();
        break;
      case 'settings':
        onToggleSettings?.();
        break;
    }
  };

  return (
    <>
      {/* 1. SVG Metaball Gooey Fusion Filters */}
      <svg
        className="pointer-events-none absolute w-0 h-0 overflow-hidden"
        aria-hidden="true"
      >
        <defs>
          <filter id="top-gooey-filter" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 18 -8"
              result="gooey"
            />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
          <filter id="top-gooey-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* ========================================================== */}
      {/* 2. DESKTOP FLOATING GOOEY TASKBAR (Top Command Area)       */}
      {/* ========================================================== */}
      <div 
        ref={containerRef}
        className="relative hidden lg:flex items-center select-none"
      >
        {/* Gooey Taskbar Container */}
        <div 
          className="relative flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/80 backdrop-blur-xl border border-cyan-500/30 shadow-[0_8px_30px_rgb(0,0,0,0.5)] transition-all duration-300"
          style={{ filter: isExpanded ? 'none' : 'none' }}
        >
          {/* Main Module Trigger Pill (Active Indicator) */}
          <button
            onClick={() => setIsExpanded(prev => !prev)}
            className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 ${
              isExpanded 
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'bg-slate-900/90 border-cyan-500/40 text-slate-200 hover:border-cyan-400 hover:text-cyan-300 shadow-glow-sm'
            }`}
            title="Toggle Gooey Navigation Menu"
          >
            {/* Liquid Glow Indicator */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
            </span>

            <span className="text-cyan-400">
              {activeModuleItem.icon}
            </span>

            <span className="text-xs font-bold tracking-wide font-sans">
              {activeModuleItem.name}
            </span>

            <div className="w-px h-3.5 bg-slate-700/80 mx-0.5" />

            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-300 transition-transform" />
            )}
          </button>

          {/* Quick-Switch Core Modules Dock (Collapsed state) */}
          {!isExpanded && (
            <div className="flex items-center gap-1 pl-1">
              {/* Overview Quick Switch */}
              <button
                onClick={() => handleModuleClick(MODULE_GROUPS[0].modules[0])}
                className={`p-1.5 rounded-lg border text-xs transition-all ${
                  activeModuleId === 'overview'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60 shadow-glow-sm'
                    : 'bg-slate-900/60 text-slate-400 border-transparent hover:bg-slate-800 hover:text-slate-200'
                }`}
                title="Command Center Overview"
              >
                <LayoutDashboard className="w-4 h-4" />
              </button>

              {/* 3D Globe Quick Switch */}
              <button
                onClick={() => handleModuleClick(MODULE_GROUPS[0].modules[1])}
                className={`p-1.5 rounded-lg border text-xs transition-all ${
                  activeModuleId === '3d_twin'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60 shadow-glow-sm'
                    : 'bg-slate-900/60 text-slate-400 border-transparent hover:bg-slate-800 hover:text-slate-200'
                }`}
                title="Full 3D Digital Twin Globe"
              >
                <Globe2 className="w-4 h-4" />
              </button>

              {/* Operations Quick Switch */}
              <button
                onClick={() => handleModuleClick(MODULE_GROUPS[1].modules[0])}
                className={`p-1.5 rounded-lg border text-xs transition-all ${
                  activeModuleId === 'operations' || activeModuleId === 'event_ops' || activeModuleId === 'dispatch' || activeModuleId === 'analytics'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60 shadow-glow-sm'
                    : 'bg-slate-900/60 text-slate-400 border-transparent hover:bg-slate-800 hover:text-slate-200'
                }`}
                title="Event Operations Command Center"
              >
                <Radio className="w-4 h-4" />
              </button>

              {/* Emergency Quick Switch */}
              <button
                onClick={() => handleModuleClick(MODULE_GROUPS[2].modules[0])}
                className={`p-1.5 rounded-lg border text-xs transition-all ${
                  activeModuleId === 'emergency' || activeModuleId === 'evacuation_planning'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-400/60 shadow-glow-sm animate-pulse'
                    : 'bg-slate-900/60 text-slate-400 border-transparent hover:bg-slate-800 hover:text-rose-400'
                }`}
                title="Emergency Incident & Evacuation Command"
              >
                <ShieldAlert className="w-4 h-4" />
              </button>

              {/* AI Copilot Quick Switch */}
              <button
                onClick={() => handleModuleClick(MODULE_GROUPS[4].modules[0])}
                className={`p-1.5 rounded-lg border text-xs transition-all ${
                  activeModuleId === 'ai_agent'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-400/60 shadow-glow-sm'
                    : 'bg-slate-900/60 text-purple-400 border-transparent hover:bg-purple-950/40 hover:text-purple-300'
                }`}
                title="JARVIS AI Digital Twin Copilot"
              >
                <Sparkles className="w-4 h-4 animate-pulse" />
              </button>
            </div>
          )}
        </div>

        {/* ========================================================== */}
        {/* EXPANDED GOOEY MENU MATRIX DROPDOWN                         */}
        {/* ========================================================== */}
        {isExpanded && (
          <div 
            className="absolute top-12 left-0 w-[540px] p-3 rounded-2xl bg-slate-950/95 backdrop-blur-2xl border border-cyan-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-50 animate-in fade-in zoom-in-95 duration-200 space-y-3"
            style={{ filter: 'url(#top-gooey-glow)' }}
          >
            {/* Header / Search / Title */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse" />
                <span className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
                  Digital Twin Command Matrix
                </span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                13 MODULES OPERATIONAL
              </span>
            </div>

            {/* Logical Category Navigation Bar */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/90 border border-slate-800">
              {MODULE_GROUPS.map((group) => {
                const isGroupActive = activeGroupCategory === group.category;
                return (
                  <button
                    key={group.category}
                    onClick={() => setActiveGroupCategory(group.category)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-mono transition-all ${
                      isGroupActive
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/40 shadow-glow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    {group.icon}
                    <span>{group.title.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>

            {/* Modules Grid for Selected Category */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {(MODULE_GROUPS.find(g => g.category === activeGroupCategory)?.modules || []).map((mod) => {
                const isActive = activeModuleId === mod.id;
                return (
                  <button
                    key={mod.id}
                    onClick={() => handleModuleClick(mod)}
                    className={`group relative p-2.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                      isActive
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-glow-sm'
                        : 'bg-slate-900/70 border-slate-800/80 hover:bg-slate-850 hover:border-cyan-500/30 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg border transition-colors ${
                        isActive 
                          ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200' 
                          : 'bg-slate-800/80 border-slate-700/60 group-hover:border-cyan-500/40 text-cyan-400'
                      }`}>
                        {mod.icon}
                      </div>
                      <div>
                        <div className="text-xs font-bold font-sans group-hover:text-cyan-300 transition-colors">
                          {mod.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {mod.shortLabel}
                        </div>
                      </div>
                    </div>

                    {mod.badge && (
                      <Badge variant={mod.badgeVariant || 'cyan'} size="sm">
                        {mod.badge}
                      </Badge>
                    )}

                    {isActive && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-glow-cyan animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick All-Modules Drawer Link */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Synchronized with Cesium 3D Globe</span>
              </span>
              <span className="text-slate-500">Press ESC or click outside to close</span>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================== */}
      {/* 3. MOBILE FLOATING BOTTOM GOOEY TASKBAR                    */}
      {/* ========================================================== */}
      <div className="lg:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-sm select-none">
        <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-cyan-500/30 shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
          {/* Overview */}
          <button
            onClick={() => handleModuleClick(MODULE_GROUPS[0].modules[0])}
            className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all ${
              activeModuleId === 'overview'
                ? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-400/50 shadow-glow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-[9px] font-mono">Overview</span>
          </button>

          {/* 3D Globe */}
          <button
            onClick={() => handleModuleClick(MODULE_GROUPS[0].modules[1])}
            className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all ${
              activeModuleId === '3d_twin'
                ? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-400/50 shadow-glow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe2 className="w-4 h-4" />
            <span className="text-[9px] font-mono">3D Twin</span>
          </button>

          {/* Operations */}
          <button
            onClick={() => handleModuleClick(MODULE_GROUPS[1].modules[0])}
            className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all ${
              activeModuleId === 'operations' || activeModuleId === 'event_ops' || activeModuleId === 'dispatch' || activeModuleId === 'analytics'
                ? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-400/50 shadow-glow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span className="text-[9px] font-mono">Ops</span>
          </button>

          {/* Emergency */}
          <button
            onClick={() => handleModuleClick(MODULE_GROUPS[2].modules[0])}
            className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all ${
              activeModuleId === 'emergency' || activeModuleId === 'evacuation_planning'
                ? 'bg-rose-500/25 text-rose-300 font-bold border border-rose-400/50 shadow-glow-sm'
                : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span className="text-[9px] font-mono">Evac</span>
          </button>

          {/* AI Copilot */}
          <button
            onClick={() => handleModuleClick(MODULE_GROUPS[4].modules[0])}
            className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all ${
              activeModuleId === 'ai_agent'
                ? 'bg-purple-500/25 text-purple-300 font-bold border border-purple-400/50 shadow-glow-sm'
                : 'text-purple-400 hover:text-purple-300'
            }`}
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span className="text-[9px] font-mono">JARVIS</span>
          </button>
        </div>
      </div>
    </>
  );
};
