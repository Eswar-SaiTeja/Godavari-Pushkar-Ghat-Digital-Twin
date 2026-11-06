import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Globe2, 
  MountainSnow, 
  Users, 
  Car, 
  Waves, 
  ShieldAlert, 
  Activity, 
  Database, 
  Settings, 
  Compass, 
  Radio, 
  Send, 
  BarChart3, 
  Sliders, 
  Layers, 
  Search, 
  X, 
  ChevronRight, 
  ChevronDown,
  Minimize2
} from 'lucide-react';
import { SIDEBAR_MODULES } from '../../config/modules';
import { SidebarModuleId, ModuleDefinition } from '../../types/simulation';

export interface GooeyLiquidNavProps {
  activeModule: SidebarModuleId;
  onSelectModule: (module: ModuleDefinition) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenOperationsTab?: (tab: 'overview' | 'resources' | 'zones' | 'dispatch' | 'medical' | 'facilities' | 'analytics' | 'logs' | 'admin') => void;
  onOpenScenarioModal?: () => void;
  onOpenGisValidation?: () => void;
}

interface NavItem {
  id: string;
  moduleId: SidebarModuleId;
  label: string;
  subLabel?: string;
  icon: React.ReactNode;
  category: 'CORE_GIS' | 'SIMULATION' | 'OPERATIONS' | 'INTELLIGENCE';
  status: 'ACTIVE' | 'SIMULATED' | 'DAY4' | 'CONFIG';
  actionType: 'MODULE' | 'OPS_TAB' | 'SCENARIO_MODAL' | 'GIS_MODAL';
  opsTab?: 'overview' | 'resources' | 'zones' | 'dispatch' | 'medical' | 'facilities' | 'analytics' | 'logs' | 'admin';
}

export const GooeyLiquidNav: React.FC<GooeyLiquidNavProps> = ({
  activeModule,
  onSelectModule,
  isOpenMobile,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
  onOpenOperationsTab,
  onOpenScenarioModal,
  onOpenGisValidation,
}) => {
  // Navigation State
  const [isExpanded, setIsExpanded] = useState<boolean>(!isCollapsed);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [isTriggerHovered, setIsTriggerHovered] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Sync internal expanded state with parent isCollapsed
  useEffect(() => {
    setIsExpanded(!isCollapsed);
  }, [isCollapsed]);

  // Sync mobile open state
  useEffect(() => {
    if (isOpenMobile) {
      setIsExpanded(true);
    }
  }, [isOpenMobile]);

  // Full module item list combining standard sidebar modules with specialized Day 3 & Day 4 operational tools
  const NAV_ITEMS: NavItem[] = [
    // 1. CORE & GIS
    {
      id: 'nav_overview',
      moduleId: 'overview',
      label: 'Overview & 3D Globe',
      subLabel: 'Spatial Digital Twin & Ghat Landmarks',
      icon: <Globe2 className="w-4 h-4 text-cyan-400" />,
      category: 'CORE_GIS',
      status: 'ACTIVE',
      actionType: 'MODULE',
    },
    {
      id: 'nav_terrain',
      moduleId: 'terrain_3d',
      label: '3D Terrain & DEM',
      subLabel: 'Copernicus & SRTM Elevation Contours',
      icon: <MountainSnow className="w-4 h-4 text-sky-400" />,
      category: 'CORE_GIS',
      status: 'ACTIVE',
      actionType: 'MODULE',
    },
    {
      id: 'nav_gis_layers',
      moduleId: 'data_management',
      label: 'GIS Layers & Audit',
      subLabel: 'WGS84 EPSG:4326 GeoJSON Vectors',
      icon: <Database className="w-4 h-4 text-blue-400" />,
      category: 'CORE_GIS',
      status: 'ACTIVE',
      actionType: 'GIS_MODAL',
    },

    // 2. SIMULATION
    {
      id: 'nav_crowd_sim',
      moduleId: 'crowd_sim',
      label: 'Crowd Simulation',
      subLabel: 'Age Behavior, Gates & Dispersal',
      icon: <Users className="w-4 h-4 text-amber-400" />,
      category: 'SIMULATION',
      status: 'ACTIVE',
      actionType: 'MODULE',
    },
    {
      id: 'nav_traffic_sim',
      moduleId: 'traffic_sim',
      label: 'Traffic & Ingress',
      subLabel: 'Bridge Bottlenecks & Siren Corridors',
      icon: <Car className="w-4 h-4 text-emerald-400" />,
      category: 'SIMULATION',
      status: 'ACTIVE',
      actionType: 'MODULE',
    },
    {
      id: 'nav_scenarios',
      moduleId: 'evacuation_sim',
      label: 'Scenario Comparison',
      subLabel: 'Multi-Scenario Comparative Delta Analysis',
      icon: <Layers className="w-4 h-4 text-indigo-400" />,
      category: 'SIMULATION',
      status: 'ACTIVE',
      actionType: 'SCENARIO_MODAL',
    },
    {
      id: 'nav_flood_sim',
      moduleId: 'flood_sim',
      label: 'Flood & Hydrodynamics',
      subLabel: 'Water Discharge & Inundation Contours',
      icon: <Waves className="w-4 h-4 text-cyan-300" />,
      category: 'SIMULATION',
      status: 'SIMULATED',
      actionType: 'MODULE',
    },

    // 3. EVENT OPERATIONS & EMERGENCY
    {
      id: 'nav_event_ops',
      moduleId: 'event_ops',
      label: 'Operations Command Center',
      subLabel: 'Multi-Agency Pushkaram Hub',
      icon: <Radio className="w-4 h-4 text-cyan-400" />,
      category: 'OPERATIONS',
      status: 'DAY4',
      actionType: 'OPS_TAB',
      opsTab: 'overview',
    },
    {
      id: 'nav_dispatch',
      moduleId: 'event_ops',
      label: 'Dispatch Management',
      subLabel: 'Priority Scoring & 6-Stage Lifecycle',
      icon: <Send className="w-4 h-4 text-amber-400" />,
      category: 'OPERATIONS',
      status: 'DAY4',
      actionType: 'OPS_TAB',
      opsTab: 'dispatch',
    },
    {
      id: 'nav_analytics',
      moduleId: 'event_ops',
      label: 'Operations Analytics',
      subLabel: 'SLAs, Capacity % & CSV/JSON Reports',
      icon: <BarChart3 className="w-4 h-4 text-purple-400" />,
      category: 'OPERATIONS',
      status: 'DAY4',
      actionType: 'OPS_TAB',
      opsTab: 'analytics',
    },
    {
      id: 'nav_resources',
      moduleId: 'event_ops',
      label: 'Resource Management',
      subLabel: 'Police, 108 ALS Ambulances, SDRF',
      icon: <Sliders className="w-4 h-4 text-blue-400" />,
      category: 'OPERATIONS',
      status: 'DAY4',
      actionType: 'OPS_TAB',
      opsTab: 'resources',
    },
    {
      id: 'nav_zones',
      moduleId: 'event_ops',
      label: 'Zone & Ghat Capacities',
      subLabel: '7 Operational Ghat Sectors',
      icon: <Compass className="w-4 h-4 text-emerald-400" />,
      category: 'OPERATIONS',
      status: 'DAY4',
      actionType: 'OPS_TAB',
      opsTab: 'zones',
    },
    {
      id: 'nav_evac_sim',
      moduleId: 'evacuation_sim',
      label: 'Emergency Evacuation',
      subLabel: 'A* Dispersal Routes & Siren Trigger',
      icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
      category: 'OPERATIONS',
      status: 'ACTIVE',
      actionType: 'MODULE',
    },

    // 4. INTELLIGENCE & CONFIG
    {
      id: 'nav_ai_telemetry',
      moduleId: 'live_monitoring',
      label: 'AI Sensors & Telemetry',
      subLabel: 'Simulated CCTV, Gate & IoT Probes',
      icon: <Activity className="w-4 h-4 text-teal-400" />,
      category: 'INTELLIGENCE',
      status: 'SIMULATED',
      actionType: 'MODULE',
    },
    {
      id: 'nav_settings',
      moduleId: 'settings',
      label: 'System Settings',
      subLabel: 'Rendering, Lighting & Cesium Ion',
      icon: <Settings className="w-4 h-4 text-slate-400" />,
      category: 'INTELLIGENCE',
      status: 'CONFIG',
      actionType: 'MODULE',
    },
  ];

  // Filter items by search query
  const filteredItems = NAV_ITEMS.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return item.label.toLowerCase().includes(q) || 
           (item.subLabel && item.subLabel.toLowerCase().includes(q));
  });

  // Group items by category
  const categories: { key: NavItem['category']; title: string; badge: string }[] = [
    { key: 'CORE_GIS', title: 'GEOSPATIAL & 3D GLOBE', badge: 'GIS' },
    { key: 'SIMULATION', title: 'CROWD & FLUID SIMULATION', badge: 'SIM' },
    { key: 'OPERATIONS', title: 'EVENT OPERATIONS & DISPATCH', badge: 'OPS' },
    { key: 'INTELLIGENCE', title: 'INTELLIGENCE & SYSTEM', badge: 'SYS' },
  ];

  // Close when clicking outside on desktop
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (isOpenMobile) {
          onCloseMobile();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpenMobile, onCloseMobile]);

  // Keyboard navigation & accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isExpanded) {
          setIsExpanded(false);
          onToggleCollapse();
        }
        if (isOpenMobile) {
          onCloseMobile();
        }
      }

      // Quick slash / command key to focus search
      if ((e.key === '/' || (e.ctrlKey && e.key === 'k')) && isExpanded) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, isOpenMobile, onToggleCollapse, onCloseMobile]);

  // Execute item selection
  const handleItemClick = useCallback((item: NavItem) => {
    if (item.actionType === 'MODULE') {
      const def = SIDEBAR_MODULES.find(m => m.id === item.moduleId);
      if (def) onSelectModule(def);
    } else if (item.actionType === 'OPS_TAB') {
      const def = SIDEBAR_MODULES.find(m => m.id === 'event_ops');
      if (def) onSelectModule(def);
      if (onOpenOperationsTab && item.opsTab) {
        onOpenOperationsTab(item.opsTab);
      }
    } else if (item.actionType === 'SCENARIO_MODAL') {
      if (onOpenScenarioModal) onOpenScenarioModal();
    } else if (item.actionType === 'GIS_MODAL') {
      if (onOpenGisValidation) onOpenGisValidation();
    }

    if (isOpenMobile) {
      onCloseMobile();
    }
  }, [onSelectModule, onOpenOperationsTab, onOpenScenarioModal, onOpenGisValidation, isOpenMobile, onCloseMobile]);

  // Toggle category expansion
  const toggleCategory = (catKey: string) => {
    setCollapsedCategories(prev => ({ ...prev, [catKey]: !prev[catKey] }));
  };

  // Compact Dock Primary Quick Actions
  const COMPACT_DOCK_ITEMS = [
    NAV_ITEMS.find(i => i.id === 'nav_overview')!,
    NAV_ITEMS.find(i => i.id === 'nav_crowd_sim')!,
    NAV_ITEMS.find(i => i.id === 'nav_traffic_sim')!,
    NAV_ITEMS.find(i => i.id === 'nav_event_ops')!,
    NAV_ITEMS.find(i => i.id === 'nav_dispatch')!,
    NAV_ITEMS.find(i => i.id === 'nav_analytics')!,
    NAV_ITEMS.find(i => i.id === 'nav_evac_sim')!,
    NAV_ITEMS.find(i => i.id === 'nav_gis_layers')!,
  ].filter(Boolean);

  const isCurrentActive = (item: NavItem) => {
    return activeModule === item.moduleId;
  };

  return (
    <>
      {/* ======================================================== */}
      {/* 1. EMBEDDED SCALABLE SVG GOOEY FILTERS (Zero Map Overhead) */}
      {/* ======================================================== */}
      <svg
        className="fixed w-0 h-0 pointer-events-none select-none"
        aria-hidden="true"
        style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
      >
        <defs>
          {/* Main Metaball Gooey Fusion Filter */}
          <filter id="gooey-liquid-nav" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 19 -9"
              result="gooey"
            />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>

          {/* Trigger Liquid Aura Glow */}
          <filter id="gooey-liquid-trigger" x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 18 -8"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      {/* ======================================================== */}
      {/* 2. MOBILE BACKDROP (When Expanded on Touch Devices)     */}
      {/* ======================================================== */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 lg:hidden pointer-events-auto transition-opacity"
        />
      )}

      {/* ======================================================== */}
      {/* 3. FLOATING GOOEY LIQUID NAVIGATION MASTER DOCK          */}
      {/* ======================================================== */}
      <div 
        ref={containerRef}
        className={`fixed top-20 left-4 z-40 select-none flex items-start transition-all duration-300 pointer-events-none ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* ====================================================== */}
        {/* COMPACT VERTICAL LIQUID DOCK (When Collapsed)         */}
        {/* ====================================================== */}
        {!isExpanded && (
          <div className="flex flex-col items-center gap-2 pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
            {/* GOOEY TRIGGER ORB BUTTON */}
            <div 
              className="relative flex items-center justify-center p-1"
              onMouseEnter={() => setIsTriggerHovered(true)}
              onMouseLeave={() => setIsTriggerHovered(false)}
            >
              {/* Liquid Metaball Blob Aura */}
              <div 
                className={`absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/40 via-blue-600/30 to-teal-400/20 blur-md transition-all duration-500 ${
                  isTriggerHovered ? 'scale-125 opacity-100' : 'scale-90 opacity-60 animate-liquid-morph'
                }`}
              />

              {/* Main Circular Floating Liquid Trigger */}
              <button
                onClick={() => {
                  setIsExpanded(true);
                  onToggleCollapse();
                }}
                className="relative w-12 h-12 rounded-full liquid-dock-glass flex items-center justify-center border border-cyan-400/50 text-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.35)] hover:border-cyan-300 hover:scale-105 active:scale-95 transition-all group focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                title="Expand Gooey Command Matrix (Press / or Ctrl+K)"
                aria-label="Expand Navigation Menu"
              >
                <div className="relative">
                  <Compass className="w-5 h-5 text-cyan-400 transition-transform duration-500 group-hover:rotate-90 animate-spin-slow" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff] animate-ping" />
                </div>
              </button>

              {/* Liquid Droplet Connector Blob (emerges toward dock on hover) */}
              <div 
                className={`absolute -bottom-2 w-3.5 h-3.5 rounded-full bg-cyan-400/60 blur-[1px] transition-all duration-300 ${
                  isTriggerHovered ? 'scale-100 opacity-90' : 'scale-0 opacity-0'
                }`}
              />
            </div>

            {/* VERTICAL LIQUID ICON RIBBON */}
            <div className="liquid-dock-glass rounded-2xl p-1.5 flex flex-col items-center gap-1.5 border border-cyan-500/30 shadow-2xl relative overflow-visible">
              {COMPACT_DOCK_ITEMS.map((item) => {
                const isActive = isCurrentActive(item);
                const isHovered = hoveredItemId === item.id;

                return (
                  <div key={item.id} className="relative group">
                    <button
                      onClick={() => handleItemClick(item)}
                      onMouseEnter={() => setHoveredItemId(item.id)}
                      onMouseLeave={() => setHoveredItemId(null)}
                      className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        isActive
                          ? 'liquid-item-active text-cyan-200 scale-105'
                          : isHovered
                          ? 'text-cyan-300 bg-slate-800/80 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                          : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60'
                      }`}
                      aria-label={item.label}
                    >
                      {item.icon}

                      {/* Active Liquid Dot */}
                      {isActive && (
                        <span className="absolute right-1 top-1 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00f0ff]" />
                      )}
                    </button>

                    {/* LIQUID TOOLTIP (Floats right on hover) */}
                    <div className="absolute left-14 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/95 border border-cyan-500/40 text-xs font-mono shadow-[0_8px_24px_rgba(0,0,0,0.8)] whitespace-nowrap z-50 pointer-events-none animate-in fade-in slide-in-from-left-2 duration-150">
                      <span className="font-bold text-slate-200">{item.label}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold ${
                        item.status === 'DAY4' 
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                          : item.status === 'ACTIVE'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Bottom Quick Expand Trigger */}
              <button
                onClick={() => {
                  setIsExpanded(true);
                  onToggleCollapse();
                }}
                className="w-10 h-8 mt-1 rounded-xl flex items-center justify-center text-slate-500 hover:text-cyan-400 hover:bg-slate-800/40 transition-colors"
                title="Expand Complete Menu"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ====================================================== */}
        {/* EXPANDED GOOEY LIQUID COMMAND DRAWER                  */}
        {/* ====================================================== */}
        {isExpanded && (
          <div className="w-[330px] max-w-[calc(100vw-32px)] liquid-dock-glass rounded-2xl border border-cyan-500/30 shadow-[0_16px_50px_rgba(0,0,0,0.85)] flex flex-col pointer-events-auto overflow-hidden animate-in fade-in slide-in-from-left-4 duration-300 max-h-[calc(100vh-100px)]">
            
            {/* DRAWER LIQUID HEADER */}
            <div className="p-3.5 border-b border-cyan-500/20 bg-slate-900/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.3)]">
                  <Compass className="w-4 h-4 text-cyan-300 animate-spin-slow" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold tracking-wider text-white uppercase">
                      Command Matrix
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      GOOEY NAV
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-400">
                    Godavari Digital Twin • Rajamahendravaram
                  </p>
                </div>
              </div>

              {/* Collapse Button */}
              <button
                onClick={() => {
                  setIsExpanded(false);
                  onToggleCollapse();
                  if (isOpenMobile) onCloseMobile();
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors focus:outline-none"
                title="Collapse Navigation (Esc)"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>

            {/* SEARCH & QUICK FILTER INPUT */}
            <div className="p-3 border-b border-slate-800/80 bg-slate-950/60 shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Filter modules (e.g. dispatch, crowd)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 font-mono transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* SCROLLABLE MODULES LIST */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
              {categories.map((cat) => {
                const groupItems = filteredItems.filter(item => item.category === cat.key);
                if (groupItems.length === 0) return null;
                const isGroupCollapsed = collapsedCategories[cat.key];

                return (
                  <div key={cat.key} className="space-y-1.5">
                    {/* Category Accordion Header */}
                    <button
                      onClick={() => toggleCategory(cat.key)}
                      className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-mono tracking-widest text-cyan-400/80 uppercase hover:text-cyan-300 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isGroupCollapsed ? '-rotate-90 text-slate-500' : 'text-cyan-400'}`} />
                        <span>{cat.title}</span>
                      </div>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {groupItems.length}
                      </span>
                    </button>

                    {/* Group Items */}
                    {!isGroupCollapsed && (
                      <div className="space-y-1 pl-1">
                        {groupItems.map((item) => {
                          const isActive = isCurrentActive(item);

                          return (
                            <button
                              key={item.id}
                              ref={el => {
                                if (el) itemRefs.current.set(item.id, el);
                              }}
                              onClick={() => handleItemClick(item)}
                              onMouseEnter={() => setHoveredItemId(item.id)}
                              onMouseLeave={() => setHoveredItemId(null)}
                              className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-all duration-200 group relative ${
                                isActive
                                  ? 'liquid-item-active text-cyan-200'
                                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 hover:border-slate-800 border border-transparent'
                              }`}
                            >
                              {/* Left Icon with subtle glow */}
                              <div className={`p-2 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                isActive
                                  ? 'bg-cyan-500/30 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                                  : 'bg-slate-900/90 text-slate-400 group-hover:text-cyan-300 group-hover:bg-slate-800'
                              }`}>
                                {item.icon}
                              </div>

                              {/* Title & SubLabel */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-xs font-semibold truncate tracking-wide text-white group-hover:text-cyan-200">
                                    {item.label}
                                  </span>
                                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold shrink-0 ${
                                    item.status === 'DAY4'
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                      : item.status === 'ACTIVE'
                                      ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                                      : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
                                  }`}>
                                    {item.status}
                                  </span>
                                </div>
                                {item.subLabel && (
                                  <p className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
                                    {item.subLabel}
                                  </p>
                                )}
                              </div>

                              {/* Active Liquid Dot */}
                              {isActive && (
                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff] shrink-0 mr-1" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* DRAWER FOOTER: QUICK SHORTCUTS & TELEMETRY */}
            <div className="p-3 border-t border-cyan-500/20 bg-slate-900/80 text-[11px] font-mono text-slate-400 space-y-2 shrink-0">
              <div className="flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                  Cesium 3D Hybrid GIS
                </span>
                <span className="text-slate-300">EPSG:4326 WGS84</span>
              </div>

              {/* Quick Action Pills */}
              <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                <button
                  onClick={() => {
                    const def = SIDEBAR_MODULES.find(m => m.id === 'evacuation_sim');
                    if (def) onSelectModule(def);
                  }}
                  className="py-1 px-2 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-center truncate font-semibold transition"
                >
                  Emergency Evac
                </button>
                <button
                  onClick={() => {
                    if (onOpenOperationsTab) onOpenOperationsTab('dispatch');
                    else {
                      const def = SIDEBAR_MODULES.find(m => m.id === 'event_ops');
                      if (def) onSelectModule(def);
                    }
                  }}
                  className="py-1 px-2 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 text-center truncate font-semibold transition"
                >
                  108 Dispatch
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </>
  );
};
