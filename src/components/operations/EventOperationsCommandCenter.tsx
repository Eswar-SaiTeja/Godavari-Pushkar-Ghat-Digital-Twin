import React, { useState, useEffect } from 'react';
import { 
  X, 
  Activity, 
  Radio, 
  Shield, 
  HeartPulse, 
  Truck, 
  Flame, 
  Users, 
  Droplet, 
  Building, 
  Tent, 
  AlertTriangle, 
  CheckCircle2, 
  Navigation, 
  Search, 
  Plus, 
  Download, 
  Compass, 
  BarChart3, 
  FileText, 
  Sliders, 
  Send, 
  TrendingUp, 
  Building2,
  Trash2,
  Check
} from 'lucide-react';
import { 
  EventResource, 
  OperationalZone, 
  ResourceCategory, 
  ResourceStatus, 
  OperationsCommandMetrics, 
  DispatchAssignment, 
  OperationsLogEvent,
  PublicFacility
} from '../../types/operations';
import { eventOperationsEngine } from '../../services/eventOperationsEngine';
import { cesiumService } from '../../services/cesiumService';
import { emergencyEngine } from '../../services/emergencyDetectionEngine';
import { EmergencyIncident } from '../../types/emergency';
import { dispatchEngine } from '../../services/dispatchEngine';
import { DispatchManagementConsole } from './DispatchManagementConsole';
import { OperationsAnalyticsDashboard } from './OperationsAnalyticsDashboard';

interface EventOperationsCommandCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onInspectResource?: (resource: EventResource) => void;
  onFlyToZone?: (zoneId: string) => void;
  onFlyToResource?: (resourceId: string) => void;
}

type TabType = 
  | 'overview' 
  | 'resources' 
  | 'zones' 
  | 'dispatch' 
  | 'medical' 
  | 'facilities' 
  | 'analytics' 
  | 'logs' 
  | 'admin';

export const EventOperationsCommandCenter: React.FC<EventOperationsCommandCenterProps> = ({
  isOpen,
  onClose,
  onInspectResource,
  onFlyToZone,
  onFlyToResource,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ops = params.get('ops');
      if (ops && ['overview', 'resources', 'zones', 'dispatch', 'medical', 'facilities', 'analytics', 'logs', 'admin'].includes(ops)) {
        return ops as TabType;
      }
    }
    return 'overview';
  });
  const [metrics, setMetrics] = useState<OperationsCommandMetrics>(eventOperationsEngine.getOperationsMetrics());
  const [resources, setResources] = useState<EventResource[]>(eventOperationsEngine.getResources());
  const [zones, setZones] = useState<OperationalZone[]>(eventOperationsEngine.getZones());
  const [facilities, setFacilities] = useState<PublicFacility[]>(eventOperationsEngine.getFacilities());
  const [dispatches, setDispatches] = useState<DispatchAssignment[]>(eventOperationsEngine.getDispatches());
  const [logs, setLogs] = useState<OperationsLogEvent[]>(eventOperationsEngine.getOperationsLogs());

  // Filters & Search
  const [resourceCategoryFilter, setResourceCategoryFilter] = useState<string>('ALL');
  const [resourceStatusFilter, setResourceStatusFilter] = useState<string>('ALL');
  const [resourceSearch, setResourceSearch] = useState<string>('');
  const [logFilter, setLogFilter] = useState<string>('ALL');
  const [logSearch, setLogSearch] = useState<string>('');

  // Add Resource Modal State
  const [isAddResourceModalOpen, setIsAddResourceModalOpen] = useState<boolean>(false);
  const [newResourceName, setNewResourceName] = useState<string>('');
  const [newResourceCategory, setNewResourceCategory] = useState<ResourceCategory>('POLICE');
  const [newResourceZone, setNewResourceZone] = useState<string>('zone-pushkar-ghat');
  const [newResourceContact, setNewResourceContact] = useState<string>('');

  // Admin Config State
  const [zoneCapacities, setZoneCapacities] = useState<Record<string, number>>({});
  const [dispatchWeights, setDispatchWeights] = useState(dispatchEngine.getWeights());
  const [adminSuccessMsg, setAdminSuccessMsg] = useState<string | null>(null);

  // Subscribe to live operations updates
  useEffect(() => {
    const unsubscribe = eventOperationsEngine.subscribe(() => {
      setMetrics(eventOperationsEngine.getOperationsMetrics());
      setResources(eventOperationsEngine.getResources());
      setZones(eventOperationsEngine.getZones());
      setFacilities(eventOperationsEngine.getFacilities());
      setDispatches(eventOperationsEngine.getDispatches());
      setLogs(eventOperationsEngine.getOperationsLogs());
    });

    // Populate initial zone capacities
    const initialCaps: Record<string, number> = {};
    eventOperationsEngine.getZones().forEach(z => {
      initialCaps[z.id] = z.capacityAssumption;
    });
    setZoneCapacities(initialCaps);

    return () => {
      unsubscribe();
    };
  }, []);

  if (!isOpen) return null;

  // Helper icons
  const getCategoryIcon = (category: ResourceCategory) => {
    switch (category) {
      case 'POLICE': return <Shield className="w-4 h-4 text-blue-400" />;
      case 'MEDICAL': return <HeartPulse className="w-4 h-4 text-rose-400" />;
      case 'AMBULANCE': return <Truck className="w-4 h-4 text-amber-400" />;
      case 'FIRST_AID': return <HeartPulse className="w-4 h-4 text-pink-400" />;
      case 'FIRE_RESCUE': return <Flame className="w-4 h-4 text-orange-400" />;
      case 'EMERGENCY_VEHICLE': return <Truck className="w-4 h-4 text-yellow-400" />;
      case 'VOLUNTEER': return <Users className="w-4 h-4 text-emerald-400" />;
      case 'WATER_STATION': return <Droplet className="w-4 h-4 text-sky-400" />;
      case 'PUBLIC_TOILET': return <Building className="w-4 h-4 text-cyan-400" />;
      case 'TEMPORARY_SHELTER': return <Tent className="w-4 h-4 text-purple-400" />;
      default: return <Radio className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: ResourceStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">AVAILABLE</span>;
      case 'DEPLOYED':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30">DEPLOYED</span>;
      case 'BUSY':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">BUSY / ON-SCENE</span>;
      case 'OFFLINE':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-500/20 text-slate-400 border border-slate-500/30">OFFLINE</span>;
      case 'NEEDS_REPLENISHMENT':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-rose-500/20 text-rose-400 border border-rose-500/30">NEEDS REPLENISHMENT</span>;
    }
  };

  const getDensityBadge = (density: OperationalZone['densityClassification']) => {
    switch (density) {
      case 'LOW':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">LOW DENSITY</span>;
      case 'MODERATE':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30">MODERATE</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">HIGH WARNING</span>;
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse font-semibold">CRITICAL SATURATION</span>;
    }
  };

  const getZoneName = (zoneId: string) => {
    return zones.find(z => z.id === zoneId)?.name || zoneId;
  };

  const filteredResources = resources.filter((res) => {
    const matchCat = resourceCategoryFilter === 'ALL' || res.category === resourceCategoryFilter;
    const matchStatus = resourceStatusFilter === 'ALL' || res.status === resourceStatusFilter;
    const zoneName = getZoneName(res.assignedZoneId);
    const matchSearch = resourceSearch === '' || 
      res.name.toLowerCase().includes(resourceSearch.toLowerCase()) || 
      zoneName.toLowerCase().includes(resourceSearch.toLowerCase()) ||
      res.id.toLowerCase().includes(resourceSearch.toLowerCase());
    return matchCat && matchStatus && matchSearch;
  });

  const filteredLogs = logs.filter((log) => {
    const matchCat = logFilter === 'ALL' || log.category === logFilter;
    const matchSearch = logSearch === '' || 
      log.title.toLowerCase().includes(logSearch.toLowerCase()) || 
      log.description.toLowerCase().includes(logSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  // Handle Add Resource
  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResourceName.trim()) return;

    const assignedZone = zones.find(z => z.id === newResourceZone);
    const coordinates = assignedZone ? assignedZone.center : { latitude: 17.0010, longitude: 81.7765 };

    const newResource: EventResource = {
      id: `res-${Date.now().toString(36)}`,
      name: newResourceName.trim(),
      category: newResourceCategory,
      coordinates,
      assignedZoneId: newResourceZone,
      status: 'AVAILABLE',
      deploymentStatus: 'Stationed at assigned post',
      contactRef: newResourceContact.trim() || 'Command Officer • VHF Ch 12',
      personnelCount: 4,
      equipment: ['Wireless VHF Radio', 'First-Aid Kit', 'High-Vis Vests'],
      verificationStatus: 'SYNTHETIC_DEMO',
      dataSource: 'Command Center Manual Deployment',
      lastStatusUpdate: 'Just now',
    };

    eventOperationsEngine.addResource(newResource);
    cesiumService.createResourceLayers();
    setIsAddResourceModalOpen(false);
    setNewResourceName('');
    setNewResourceContact('');
  };

  // Handle Create Dispatch from active incident
  const handleCreateDispatch = (incident: EmergencyIncident) => {
    let requiredCategory: ResourceCategory = 'POLICE';
    if (incident.type === 'FIRE_HAZARD') requiredCategory = 'FIRE_RESCUE';
    else if (incident.type === 'FLOOD_SURGE') requiredCategory = 'FIRE_RESCUE';
    else if (incident.type === 'CROWD_CRUSH') requiredCategory = 'AMBULANCE';
    else if (incident.type === 'STEP_BOTTLENECK') requiredCategory = 'POLICE';

    const dispatch = eventOperationsEngine.createDispatchAssignment(incident.id, incident.title, requiredCategory);
    if (dispatch) {
      cesiumService.renderDispatchRoute(dispatch);
      setActiveTab('dispatch');
    }
  };

  const handleSaveAdminCapacities = () => {
    Object.entries(zoneCapacities).forEach(([zoneId, capacity]) => {
      eventOperationsEngine.updateZoneCapacity(zoneId, capacity);
    });
    cesiumService.createOperationalZoneLayers();
    setAdminSuccessMsg('Zone capacities successfully updated and synchronized with Cesium.');
    setTimeout(() => setAdminSuccessMsg(null), 3500);
  };

  const handleSaveDispatchWeights = () => {
    dispatchEngine.updateWeights(dispatchWeights);
    setAdminSuccessMsg('Dispatch recommendation weights & administrative policies successfully applied.');
    setTimeout(() => setAdminSuccessMsg(null), 3500);
  };

  const handleResetDispatchWeights = () => {
    const defaults = {
      distanceWeight: 0.35,
      categoryMatchWeight: 0.35,
      workloadWeight: 0.15,
      readinessWeight: 0.15,
      requireAdminConfirmation: true,
      allowEmergencyOverride: true,
    };
    dispatchEngine.updateWeights(defaults);
    setDispatchWeights(defaults);
    setAdminSuccessMsg('Dispatch recommendation weights restored to baseline standards.');
    setTimeout(() => setAdminSuccessMsg(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-7xl h-[92vh] bg-slate-950 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP COMMAND HEADER */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-bold text-lg text-white tracking-wide">
                  EVENT OPERATIONS COMMAND CENTER
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  DAY 4 MASTER SUITE
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  SIMULATED TELEMETRY
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Godavari Pushkar Ghat Multi-Agency Incident & Field Resource Management • Rajamahendravaram
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-4 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500">Live Crowd:</span>{' '}
                <span className="font-mono font-bold text-cyan-300">{metrics.currentCrowdPopulation.toLocaleString()}</span>
              </div>
              <div className="w-px h-3.5 bg-slate-800" />
              <div>
                <span className="text-slate-500">Active Incidents:</span>{' '}
                <span className={`font-mono font-bold ${metrics.activeIncidentCount > 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                  {metrics.activeIncidentCount}
                </span>
              </div>
              <div className="w-px h-3.5 bg-slate-800" />
              <div>
                <span className="text-slate-500">Ready Units:</span>{' '}
                <span className="font-mono font-bold text-emerald-400">{metrics.availableEmergencyTeams}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close Command Center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="px-6 bg-slate-900/60 border-b border-slate-800 flex items-center gap-1 overflow-x-auto shrink-0 scrollbar-none">
          {[
            { id: 'overview', label: 'Operations Overview', icon: <Activity className="w-4 h-4" /> },
            { id: 'resources', label: `Resources (${resources.length})`, icon: <Radio className="w-4 h-4" /> },
            { id: 'zones', label: `Ghat Sectors (${zones.length})`, icon: <Compass className="w-4 h-4" /> },
            { id: 'dispatch', label: `Dispatch Console (${dispatches.filter(d => d.status !== 'RESOLVED').length})`, icon: <Send className="w-4 h-4" /> },
            { id: 'medical', label: '108 Medical & Triage', icon: <HeartPulse className="w-4 h-4" /> },
            { id: 'facilities', label: `Public Amenities (${facilities.length})`, icon: <Building2 className="w-4 h-4" /> },
            { id: 'analytics', label: 'Operations Analytics', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'logs', label: `Operations Log (${logs.length})`, icon: <FileText className="w-4 h-4" /> },
            { id: 'admin', label: 'Admin & Capacity Tuning', icon: <Sliders className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-3.5 py-3 text-xs font-medium border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB CONTENTS CONTAINER */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
          
          {/* ========================================================= */}
          {/* 1. OVERVIEW TAB */}
          {/* ========================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Primary KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Simulated Visitors</div>
                  <div className="text-2xl font-bold font-mono text-white">{metrics.totalSimulatedVisitors.toLocaleString()}</div>
                  <div className="text-[11px] text-cyan-400 flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" /> Cumulative Footfall
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Current Crowd Active</div>
                  <div className="text-2xl font-bold font-mono text-cyan-300">{metrics.currentCrowdPopulation.toLocaleString()}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Across 7 Ghat Sectors</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Active Incidents</div>
                  <div className={`text-2xl font-bold font-mono ${metrics.activeIncidentCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {metrics.activeIncidentCount}
                  </div>
                  <div className="text-[11px] text-rose-400/90 mt-1">Emergency Engine Monitored</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Available Field Units</div>
                  <div className="text-2xl font-bold font-mono text-emerald-400">{metrics.availableEmergencyTeams}</div>
                  <div className="text-[11px] text-emerald-400/80 mt-1">Police, Fire, Medical Ready</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">108 Ambulances Ready</div>
                  <div className="text-2xl font-bold font-mono text-amber-400">
                    {metrics.ambulanceAvailability.available} / {metrics.ambulanceAvailability.total}
                  </div>
                  <div className="text-[11px] text-amber-400/80 mt-1">{metrics.ambulanceAvailability.dispatched} Dispatched On-Call</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Critical Zone Alerts</div>
                  <div className={`text-2xl font-bold font-mono ${metrics.criticalZoneCount > 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                    {metrics.criticalZoneCount}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Exceeding safe thresholds</div>
                </div>
              </div>

              {/* Ghat-wise Crowd Status & Zone Alerts Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                      <Compass className="w-4 h-4 text-cyan-400" />
                      Ghat Sector Real-Time Utilization
                    </h3>
                    <span className="text-xs text-slate-400">7 Operational Sectors</span>
                  </div>

                  <div className="space-y-3.5">
                    {zones.map((zone) => {
                      const utilPct = Math.min(100, (zone.currentSimulatedPopulation / zone.capacityAssumption) * 100);
                      return (
                        <div key={zone.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="font-semibold text-white text-xs">{zone.name}</span>
                              {getDensityBadge(zone.densityClassification)}
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-slate-400">
                                Pop: <span className="font-mono text-cyan-300 font-bold">{zone.currentSimulatedPopulation.toLocaleString()}</span> / {zone.capacityAssumption.toLocaleString()}
                              </span>
                              <button
                                onClick={() => {
                                  if (onFlyToZone) onFlyToZone(zone.id);
                                  else cesiumService.flyToZone(zone.id);
                                }}
                                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 transition"
                              >
                                <Navigation className="w-3 h-3 text-cyan-400" /> Fly-to
                              </button>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                utilPct > 85 ? 'bg-rose-500' : utilPct > 65 ? 'bg-amber-500' : 'bg-cyan-500'
                              }`}
                              style={{ width: `${utilPct}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                            <span>Inflow: +{zone.inflowRate} /min</span>
                            <span>Outflow: -{zone.outflowRate} /min</span>
                            <span>Queue: ~{zone.queueEstimationCount} pax</span>
                            <span>Wait Time: ~{zone.averageWaitingTimeMinutes}m</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Column: Active Emergency Incidents & Quick Actions */}
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        Active Emergency Events
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        {emergencyEngine.getIncidents().filter(i => i.status === 'ACTIVE').length} ACTIVE
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                      {emergencyEngine.getIncidents().filter(i => i.status === 'ACTIVE').length > 0 ? (
                        emergencyEngine.getIncidents().filter(i => i.status === 'ACTIVE').map((incident) => (
                          <div key={incident.id} className="p-3 bg-slate-950/80 border border-rose-900/40 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-white text-xs">{incident.title}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold">
                                {incident.severity}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">{incident.description}</p>
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[11px] text-slate-500 font-mono">
                                Impact: ~{incident.affectedPopulation} pax
                              </span>
                              <button
                                onClick={() => handleCreateDispatch(incident)}
                                className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium flex items-center gap-1.5 transition"
                              >
                                <Send className="w-3 h-3" /> Dispatch Team
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-xs text-slate-500 border border-slate-800 rounded-xl">
                          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                          No active emergency incidents currently reported. Sector telemetry normal.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Operational Readiness Status */}
                  <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                    <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                      <Shield className="w-4 h-4 text-cyan-400" />
                      Inter-Agency Deployment Readiness
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2 rounded bg-slate-950/40 border border-slate-800">
                        <span className="text-slate-400">AP Police & Rapid Action Force</span>
                        <span className="font-mono text-cyan-300 font-bold">
                          {metrics.policeDeploymentStatus.patrolUnits} Deployed / {metrics.policeDeploymentStatus.onDuty} On Duty
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-slate-950/40 border border-slate-800">
                        <span className="text-slate-400">Health Dept & 108 Emergency</span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {metrics.activeMedicalStations} Camps Active
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-slate-950/40 border border-slate-800">
                        <span className="text-slate-400">SDRF Riverfront Water Rescue</span>
                        <span className="font-mono text-amber-400 font-bold">4 Patrol Craft Live</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. RESOURCE MANAGEMENT TAB */}
          {/* ========================================================= */}
          {activeTab === 'resources' && (
            <div className="space-y-4">
              {/* Filter & Action Bar */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-[300px]">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search resources by name, zone, or ID..."
                      value={resourceSearch}
                      onChange={(e) => setResourceSearch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <select
                    value={resourceCategoryFilter}
                    onChange={(e) => setResourceCategoryFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="POLICE">Police</option>
                    <option value="MEDICAL">Medical Teams</option>
                    <option value="AMBULANCE">Ambulance (108)</option>
                    <option value="FIRST_AID">First Aid Stations</option>
                    <option value="FIRE_RESCUE">Fire & Rescue</option>
                    <option value="EMERGENCY_VEHICLE">Emergency Vehicles</option>
                    <option value="VOLUNTEER">Volunteers</option>
                    <option value="WATER_STATION">Water Stations</option>
                    <option value="PUBLIC_TOILET">Public Toilets</option>
                    <option value="TEMPORARY_SHELTER">Temporary Shelters</option>
                  </select>

                  <select
                    value={resourceStatusFilter}
                    onChange={(e) => setResourceStatusFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="DEPLOYED">DEPLOYED</option>
                    <option value="BUSY">BUSY / ON-SCENE</option>
                    <option value="OFFLINE">OFFLINE</option>
                    <option value="NEEDS_REPLENISHMENT">NEEDS REPLENISHMENT</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAddResourceModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Plus className="w-4 h-4" /> Add New Resource
                  </button>
                </div>
              </div>

              {/* Resource Table */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Resource Name / ID</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Assigned Zone</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Contact Reference</th>
                      <th className="py-3 px-3">WGS84 Coordinates</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredResources.map((res) => (
                      <tr key={res.id} className="hover:bg-slate-850/50 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white flex items-center gap-2">
                            {getCategoryIcon(res.category)}
                            <span>{res.name}</span>
                          </div>
                          <span className="font-mono text-[10px] text-slate-500">{res.id}</span>
                        </td>
                        <td className="py-3 px-3 capitalize text-slate-400">
                          {res.category.replace('_', ' ').toLowerCase()}
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-cyan-400 font-medium">{getZoneName(res.assignedZoneId)}</span>
                        </td>
                        <td className="py-3 px-3">
                          {getStatusBadge(res.status)}
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-white font-medium">{res.contactRef}</div>
                          <div className="text-[11px] text-slate-500 font-mono">Members: {res.personnelCount}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                          {res.coordinates.latitude.toFixed(5)}°N, {res.coordinates.longitude.toFixed(5)}°E
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                if (onInspectResource) onInspectResource(res);
                              }}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition"
                            >
                              Inspect
                            </button>
                            <button
                              onClick={() => {
                                if (onFlyToResource) onFlyToResource(res.id);
                                else cesiumService.flyToResource(res.id);
                              }}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 transition"
                              title="Fly to resource on 3D Cesium Map"
                            >
                              <Navigation className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                eventOperationsEngine.deleteResource(res.id);
                                cesiumService.createResourceLayers();
                              }}
                              className="p-1 rounded bg-slate-800 hover:bg-rose-950 text-rose-400 transition"
                              title="Remove Resource"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 3. GHAT-WISE ZONES TAB */}
          {/* ========================================================= */}
          {activeTab === 'zones' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white text-sm">7 Designated Operational Sectors</h3>
                  <p className="text-xs text-slate-400">WGS84 polygon zones with dynamic crowd ingress/egress modeling</p>
                </div>
                <div className="text-xs font-mono text-cyan-400">
                  Total Zone Capacity: {zones.reduce((sum, z) => sum + z.capacityAssumption, 0).toLocaleString()} pax
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {zones.map((zone) => {
                  const utilPct = Number(((zone.currentSimulatedPopulation / zone.capacityAssumption) * 100).toFixed(1));
                  return (
                    <div key={zone.id} className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-white text-sm">{zone.name}</h4>
                          <span className="font-mono text-[10px] text-slate-500">{zone.id}</span>
                        </div>
                        {getDensityBadge(zone.densityClassification)}
                      </div>

                      {/* Capacity bar */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Capacity Utilization</span>
                          <span className="font-mono font-bold text-white">{utilPct}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              utilPct > 85 ? 'bg-rose-500' : utilPct > 65 ? 'bg-amber-500' : 'bg-cyan-500'
                            }`}
                            style={{ width: `${Math.min(100, utilPct)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                          <span>Current: {zone.currentSimulatedPopulation.toLocaleString()}</span>
                          <span>Max: {zone.capacityAssumption.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Inflow / Outflow & Queues */}
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                          <div className="text-[10px] text-slate-500 uppercase">Inflow Rate</div>
                          <div className="font-mono font-bold text-emerald-400">+{zone.inflowRate} <span className="text-[10px] font-normal text-slate-400">pax/min</span></div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                          <div className="text-[10px] text-slate-500 uppercase">Outflow Rate</div>
                          <div className="font-mono font-bold text-cyan-400">-{zone.outflowRate} <span className="text-[10px] font-normal text-slate-400">pax/min</span></div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                          <div className="text-[10px] text-slate-500 uppercase">Queue Estimation</div>
                          <div className="font-mono font-bold text-amber-300">~{zone.queueEstimationCount} <span className="text-[10px] font-normal text-slate-400">waiting</span></div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                          <div className="text-[10px] text-slate-500 uppercase">Avg Wait Time</div>
                          <div className="font-mono font-bold text-white">~{zone.averageWaitingTimeMinutes} <span className="text-[10px] font-normal text-slate-400">mins</span></div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500 font-mono">
                          Center: {zone.center.latitude.toFixed(4)}°N
                        </span>
                        <button
                          onClick={() => {
                            if (onFlyToZone) onFlyToZone(zone.id);
                            else cesiumService.flyToZone(zone.id);
                          }}
                          className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-medium flex items-center gap-1.5 transition"
                        >
                          <Navigation className="w-3.5 h-3.5" /> Fly to Sector
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 4. DISPATCH CONSOLE TAB */}
          {/* ========================================================= */}
          {activeTab === 'dispatch' && (
            <DispatchManagementConsole
              onFlyToIncident={(incidentId) => {
                cesiumService.flyToIncident(incidentId);
              }}
              onFlyToResource={(resourceId) => {
                cesiumService.flyToResource(resourceId);
              }}
            />
          )}

          {/* ========================================================= */}
          {/* 5. MEDICAL & 108 AMBULANCE TAB */}
          {/* ========================================================= */}
          {activeTab === 'medical' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Active Medical Camps</div>
                  <div className="text-2xl font-bold font-mono text-white">{metrics.activeMedicalStations} Camps</div>
                  <div className="text-[11px] text-cyan-400 mt-1">24x7 Emergency Triage</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">108 Fleet Status</div>
                  <div className="text-2xl font-bold font-mono text-amber-400">
                    {metrics.ambulanceAvailability.available} Ready / {metrics.ambulanceAvailability.total} Total
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">{metrics.ambulanceAvailability.dispatched} currently transporting</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Triage Protocol</div>
                  <div className="text-sm font-bold text-emerald-400 mt-1">AP Govt Health Standard</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Minor, Moderate, Severe, Critical</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Designated District Hospital</div>
                  <div className="text-sm font-bold text-white mt-1">GGH Rajamahendravaram</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Level 1 Trauma • 4.2 km corridor</div>
                </div>
              </div>

              {/* Medical Resources List */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
                <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-rose-400" />
                  Deployed Medical Stations & Ambulances
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resources.filter(r => r.category === 'MEDICAL' || r.category === 'AMBULANCE' || r.category === 'FIRST_AID').map(med => (
                    <div key={med.id} className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {med.category === 'AMBULANCE' ? <Truck className="w-4 h-4 text-amber-400" /> : <HeartPulse className="w-4 h-4 text-rose-400" />}
                          <span className="font-semibold text-white text-xs">{med.name}</span>
                        </div>
                        {getStatusBadge(med.status)}
                      </div>

                      <div className="text-xs text-slate-400">
                        Stationed: <span className="text-cyan-400 font-medium">{getZoneName(med.assignedZoneId)}</span> • Callsign: <span className="text-slate-300">{med.contactRef}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-xs">
                        <span className="font-mono text-[11px] text-slate-500">Personnel: {med.personnelCount} staff</span>
                        <button
                          onClick={() => {
                            if (onInspectResource) onInspectResource(med);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition"
                        >
                          Manage Unit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 6. PUBLIC FACILITIES TAB */}
          {/* ========================================================= */}
          {activeTab === 'facilities' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white text-sm">Public Amenities & Pilgrim Sanitation Facilities</h3>
                  <p className="text-xs text-slate-400">
                    Drinking water taps, mobile bio-toilets, lost & found booths, temporary shelters, and perimeter vehicle parking
                  </p>
                </div>
                <div className="text-xs font-mono text-cyan-400">
                  {facilities.length} Monitored Facilities
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {facilities.map((fac) => (
                  <div key={fac.id} className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-white text-xs flex items-center gap-2">
                        {fac.category === 'WATER' && <Droplet className="w-4 h-4 text-sky-400" />}
                        {fac.category === 'TOILET' && <Building className="w-4 h-4 text-cyan-400" />}
                        {fac.category === 'INFO_CENTRE' && <Users className="w-4 h-4 text-amber-400" />}
                        {fac.category === 'SHELTER' && <Tent className="w-4 h-4 text-purple-400" />}
                        {fac.category === 'PARKING' && <Truck className="w-4 h-4 text-emerald-400" />}
                        {fac.category === 'REST_AREA' && <Building2 className="w-4 h-4 text-indigo-400" />}
                        <span>{fac.name}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                        fac.availability === 'OPERATIONAL' 
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                          : fac.availability === 'MAINTENANCE'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      }`}>
                        {fac.availability}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400">
                      Location Sector: <span className="text-cyan-400">{getZoneName(fac.assignedZoneId)}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs p-2 rounded bg-slate-950/50 border border-slate-800">
                      <span className="text-slate-400">Design Capacity:</span>
                      <span className="font-mono text-white font-bold">{fac.capacity.toLocaleString()} pax</span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => {
                          const nextStatus = fac.availability === 'OPERATIONAL' ? 'MAINTENANCE' : 'OPERATIONAL';
                          eventOperationsEngine.setFacilityAvailability(fac.id, nextStatus);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                      >
                        Toggle Maintenance
                      </button>

                      <button
                        onClick={() => {
                          cesiumService.flyToCoordinates(fac.coordinates.longitude, fac.coordinates.latitude, 250);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-400 text-xs flex items-center gap-1 transition"
                      >
                        <Navigation className="w-3 h-3" /> View in 3D
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 7. OPERATIONS ANALYTICS TAB */}
          {/* ========================================================= */}
          {activeTab === 'analytics' && (
            <OperationsAnalyticsDashboard />
          )}

          {/* ========================================================= */}
          {/* 8. OPERATIONS LOG TAB */}
          {/* ========================================================= */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-[300px]">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search log events by title or description..."
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <select
                    value={logFilter}
                    onChange={(e) => setLogFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="INCIDENT">Incidents</option>
                    <option value="RESOURCE">Resource Moves</option>
                    <option value="DISPATCH">Dispatches</option>
                    <option value="ZONE">Zone Capacity</option>
                    <option value="FACILITY">Facilities</option>
                    <option value="SYSTEM">System</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => eventOperationsEngine.downloadLogsAsCsv()}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" /> Export CSV
                  </button>

                  <button
                    onClick={() => eventOperationsEngine.downloadLogsAsJson()}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" /> Export JSON
                  </button>
                </div>
              </div>

              {/* Log Events Stream */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 divide-y divide-slate-800/60 overflow-hidden">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="p-3.5 hover:bg-slate-850/50 transition space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                          log.severity === 'CRITICAL' 
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 font-bold' 
                            : log.severity === 'WARNING'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                        }`}>
                          {log.category}
                        </span>
                        <span className="font-semibold text-white text-xs">{log.title}</span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-500">
                        {log.simulationTime || new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 pl-1">{log.description}</p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pl-1 pt-0.5">
                      <span className="font-mono text-[10px] text-slate-600">{log.id}</span>
                      {log.isSimulated && (
                        <span className="text-[10px] text-amber-500/80 font-mono">SIMULATED</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 9. ADMIN & CAPACITY TUNING TAB */}
          {/* ========================================================= */}
          {activeTab === 'admin' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white text-sm">Sector Capacity Assumptions & Alert Thresholds</h3>
                  <p className="text-xs text-slate-400">
                    Adjust safe pilgrim thresholds, gate capacities, and live simulation response parameters
                  </p>
                </div>
                <button
                  onClick={handleSaveAdminCapacities}
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Check className="w-4 h-4" /> Save Capacities
                </button>
              </div>

              {adminSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{adminSuccessMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {zones.map((zone) => (
                  <div key={zone.id} className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{zone.name}</span>
                      <span className="font-mono text-[10px] text-slate-500">{zone.id}</span>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        Capacity Assumption (Max Devotees)
                      </label>
                      <input
                        type="number"
                        min="500"
                        max="50000"
                        step="500"
                        value={zoneCapacities[zone.id] ?? zone.capacityAssumption}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setZoneCapacities(prev => ({ ...prev, [zone.id]: isNaN(val) ? 0 : val }));
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* DISPATCH RECOMMENDATION WEIGHTS & POLICIES */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-cyan-400" />
                      Intelligent Dispatch Recommendation Weights & Automation Policies
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Configure multi-factor algorithmic scoring parameters: Total Score = (w_dist × S_dist) + (w_cat × S_cat) + (w_workload × S_workload) + (w_ready × S_ready)
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleResetDispatchWeights}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                    >
                      Reset Baseline
                    </button>
                    <button
                      onClick={handleSaveDispatchWeights}
                      className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Check className="w-4 h-4" /> Save Dispatch Policies
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Distance Weight Slider */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-300">Geographic Proximity Weight (w_dist)</span>
                      <span className="font-mono font-bold text-cyan-400">
                        {Math.round(dispatchWeights.distanceWeight * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={dispatchWeights.distanceWeight}
                      onChange={(e) => setDispatchWeights(prev => ({ ...prev, distanceWeight: parseFloat(e.target.value) }))}
                      className="w-full accent-cyan-400"
                    />
                    <p className="text-[11px] text-slate-500">
                      Prioritizes closer units via verified A* road & pedestrian corridors.
                    </p>
                  </div>

                  {/* Category Match Weight Slider */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-300">Category Suitability Weight (w_cat)</span>
                      <span className="font-mono font-bold text-cyan-400">
                        {Math.round(dispatchWeights.categoryMatchWeight * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={dispatchWeights.categoryMatchWeight}
                      onChange={(e) => setDispatchWeights(prev => ({ ...prev, categoryMatchWeight: parseFloat(e.target.value) }))}
                      className="w-full accent-cyan-400"
                    />
                    <p className="text-[11px] text-slate-500">
                      Matches incident specialization (e.g. 108 Ambulance / Medical for triage).
                    </p>
                  </div>

                  {/* Workload Weight Slider */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-300">Workload & Task Balance Weight (w_workload)</span>
                      <span className="font-mono font-bold text-cyan-400">
                        {Math.round(dispatchWeights.workloadWeight * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={dispatchWeights.workloadWeight}
                      onChange={(e) => setDispatchWeights(prev => ({ ...prev, workloadWeight: parseFloat(e.target.value) }))}
                      className="w-full accent-cyan-400"
                    />
                    <p className="text-[11px] text-slate-500">
                      Penalizes units already managing multiple queue items to avoid burnout.
                    </p>
                  </div>

                  {/* Readiness Weight Slider */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-300">Availability & Readiness Weight (w_ready)</span>
                      <span className="font-mono font-bold text-cyan-400">
                        {Math.round(dispatchWeights.readinessWeight * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={dispatchWeights.readinessWeight}
                      onChange={(e) => setDispatchWeights(prev => ({ ...prev, readinessWeight: parseFloat(e.target.value) }))}
                      className="w-full accent-cyan-400"
                    />
                    <p className="text-[11px] text-slate-500">
                      Prioritizes immediately AVAILABLE teams over DEPLOYED / BUSY units.
                    </p>
                  </div>
                </div>

                {/* Policy Toggles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                    <input
                      type="checkbox"
                      checked={dispatchWeights.requireAdminConfirmation}
                      onChange={(e) => setDispatchWeights(prev => ({ ...prev, requireAdminConfirmation: e.target.checked }))}
                      className="mt-1 accent-cyan-500 rounded"
                    />
                    <div>
                      <div className="text-xs font-semibold text-white">Require Manual Confirmation</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Operators must explicitly confirm algorithmic recommendations before status moves to ASSIGNED.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                    <input
                      type="checkbox"
                      checked={dispatchWeights.allowEmergencyOverride}
                      onChange={(e) => setDispatchWeights(prev => ({ ...prev, allowEmergencyOverride: e.target.checked }))}
                      className="mt-1 accent-cyan-500 rounded"
                    />
                    <div>
                      <div className="text-xs font-semibold text-white">Enable Emergency Busy Overrides</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Allows incident commanders to reassign or dual-assign units even when marked BUSY / ON-SCENE.
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* MODAL: ADD RESOURCE */}
        {isAddResourceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div 
              className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-sm">Deploy New Field Resource</h3>
                <button 
                  onClick={() => setIsAddResourceModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddResource} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Resource / Unit Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Traffic QRT Team-4"
                    value={newResourceName}
                    onChange={(e) => setNewResourceName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Resource Category</label>
                  <select
                    value={newResourceCategory}
                    onChange={(e) => setNewResourceCategory(e.target.value as ResourceCategory)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="POLICE">Police</option>
                    <option value="MEDICAL">Medical Station</option>
                    <option value="AMBULANCE">Ambulance (108)</option>
                    <option value="FIRST_AID">First Aid Post</option>
                    <option value="FIRE_RESCUE">Fire & Rescue</option>
                    <option value="EMERGENCY_VEHICLE">Emergency Patrol Vehicle</option>
                    <option value="VOLUNTEER">Volunteers</option>
                    <option value="WATER_STATION">Drinking Water Post</option>
                    <option value="PUBLIC_TOILET">Public Toilet Cluster</option>
                    <option value="TEMPORARY_SHELTER">Temporary Shelter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Assigned Operational Zone</label>
                  <select
                    value={newResourceZone}
                    onChange={(e) => setNewResourceZone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Duty Officer / Contact Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. Sub-Inspector R. Rao • VHF Ch 12"
                    value={newResourceContact}
                    onChange={(e) => setNewResourceContact(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddResourceModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition"
                  >
                    Deploy Resource
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
