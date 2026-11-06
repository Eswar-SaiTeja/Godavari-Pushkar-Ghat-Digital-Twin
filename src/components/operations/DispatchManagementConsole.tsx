import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Send, 
  Navigation, 
  X, 
  Plus, 
  Check, 
  ArrowRight, 
  History, 
  Search,
  Sparkles,
  Flame,
  HeartPulse,
  Users,
  Compass,
  AlertCircle
} from 'lucide-react';
import { 
  DispatchAssignment, 
  RecommendationScore, 
  OperationalZone
} from '../../types/operations';
import { 
  EmergencyIncident, 
  IncidentSeverity, 
  IncidentType 
} from '../../types/emergency';
import { dispatchEngine } from '../../services/dispatchEngine';
import { eventOperationsEngine } from '../../services/eventOperationsEngine';
import { cesiumService } from '../../services/cesiumService';

interface DispatchManagementConsoleProps {
  onSelectIncident?: (incident: EmergencyIncident) => void;
  onFlyToIncident?: (incidentId: string) => void;
  onFlyToResource?: (resourceId: string) => void;
}

export const DispatchManagementConsole: React.FC<DispatchManagementConsoleProps> = ({
  onSelectIncident,
  onFlyToIncident,
  onFlyToResource,
}) => {
  const [incidents, setIncidents] = useState<EmergencyIncident[]>(dispatchEngine.getAllIncidents());
  const [dispatches, setDispatches] = useState<DispatchAssignment[]>(dispatchEngine.getDispatches());
  const [zones, setZones] = useState<OperationalZone[]>(eventOperationsEngine.getZones());
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(incidents[0]?.id || null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL'); // ALL, UNASSIGNED, ACTIVE_DISPATCH, RESOLVED

  // Modals & Forms
  const [isNewIncidentModalOpen, setIsNewIncidentModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newType, setNewType] = useState<IncidentType>('MEDICAL_EMERGENCY');
  const [newSeverity, setNewSeverity] = useState<IncidentSeverity>('HIGH');
  const [newZoneId, setNewZoneId] = useState<string>('zone-pushkar-ghat');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newPopulation, setNewPopulation] = useState<number>(120);

  // Cancellation Modal
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);
  const [cancelDispatchId, setCancelDispatchId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('False alarm or redundant dispatch');

  // Emergency override state
  const [allowOverride, setAllowOverride] = useState<boolean>(false);

  useEffect(() => {
    const unsubDispatch = dispatchEngine.subscribe(() => {
      setIncidents(dispatchEngine.getAllIncidents());
      setDispatches(dispatchEngine.getDispatches());
    });
    const unsubOps = eventOperationsEngine.subscribe(() => {
      setZones(eventOperationsEngine.getZones());
    });

    return () => {
      unsubDispatch();
      unsubOps();
    };
  }, []);

  const selectedIncident = incidents.find(i => i.id === selectedIncidentId) || incidents[0] || null;
  const currentDispatch = selectedIncident ? dispatches.find(d => d.incidentId === selectedIncident.id && d.status !== 'RESOLVED' && d.status !== 'CANCELLED') : null;
  const recommendations: RecommendationScore[] = selectedIncident ? dispatchEngine.getRecommendedResourcesForIncident(selectedIncident) : [];

  // Filter incidents list
  const filteredIncidents = incidents.filter((inc) => {
    const matchSearch = searchQuery === '' || 
      inc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      inc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSeverity = severityFilter === 'ALL' || inc.severity === severityFilter;
    const matchZone = zoneFilter === 'ALL' || inc.affectedZoneId === zoneFilter;

    const hasActiveDispatch = dispatches.some(d => d.incidentId === inc.id && d.status !== 'RESOLVED' && d.status !== 'CANCELLED');
    let matchStatus = true;
    if (statusFilter === 'UNASSIGNED') matchStatus = !hasActiveDispatch && inc.status !== 'RESOLVED';
    else if (statusFilter === 'ACTIVE_DISPATCH') matchStatus = hasActiveDispatch;
    else if (statusFilter === 'RESOLVED') matchStatus = inc.status === 'RESOLVED';

    return matchSearch && matchSeverity && matchZone && matchStatus;
  });

  const getSeverityBadge = (sev: IncidentSeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">HIGH</span>;
      case 'MODERATE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">MODERATE</span>;
      case 'LOW':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">LOW</span>;
    }
  };

  const getCategoryIcon = (type: IncidentType) => {
    switch (type) {
      case 'MEDICAL_EMERGENCY': return <HeartPulse className="w-4 h-4 text-rose-400" />;
      case 'FIRE_HAZARD': return <Flame className="w-4 h-4 text-orange-400" />;
      case 'FLOOD_SURGE': return <Compass className="w-4 h-4 text-sky-400" />;
      case 'CROWD_CRUSH':
      case 'STEP_BOTTLENECK':
      case 'GATE_CONGESTION': return <Users className="w-4 h-4 text-amber-400" />;
      default: return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    }
  };

  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const targetZone = zones.find(z => z.id === newZoneId) || zones[0];
    const coords: [number, number, number] = [
      targetZone.center.longitude,
      targetZone.center.latitude,
      18
    ];

    const inc = dispatchEngine.createCustomIncident({
      type: newType,
      title: newTitle.trim(),
      severity: newSeverity,
      coordinates: coords,
      affectedZoneId: newZoneId,
      description: newDescription.trim() || `Reported ${newType.replace('_', ' ').toLowerCase()} in ${targetZone.name}.`,
      affectedPopulation: newPopulation,
    });

    setSelectedIncidentId(inc.id);
    setIsNewIncidentModalOpen(false);
    setNewTitle('');
    setNewDescription('');
  };

  const handleAssignResource = (resourceId: string) => {
    if (!selectedIncident) return;
    const disp = dispatchEngine.assignResource(
      selectedIncident.id, 
      resourceId, 
      'Command Watch Officer', 
      'Operational unit matched and assigned', 
      allowOverride
    );
    if (disp) {
      cesiumService.renderDispatchRoute(disp);
    }
  };

  const handleAdvanceStatus = (dispId: string) => {
    const disp = dispatches.find(d => d.id === dispId);
    if (!disp) return;

    if (disp.status === 'ASSIGNED') {
      dispatchEngine.dispatchResource(dispId, 'Watch Commander', 'Sirens activated, en route.');
    } else if (disp.status === 'DISPATCHED') {
      dispatchEngine.markOnScene(dispId, 'Lead Responder', 'Arrived at incident sector; triage established.');
    } else if (disp.status === 'ON_SCENE') {
      dispatchEngine.resolveDispatch(dispId, 'Incident Commander', 'Crowd surge stabilized and cleared.');
    }
  };

  const handleOpenCancel = (dispId: string) => {
    setCancelDispatchId(dispId);
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = () => {
    if (cancelDispatchId) {
      dispatchEngine.cancelDispatch(cancelDispatchId, 'Watch Commander', cancelReason);
      setIsCancelModalOpen(false);
      setCancelDispatchId(null);
    }
  };

  const handleFlyTo = (inc: EmergencyIncident) => {
    if (onFlyToIncident) {
      onFlyToIncident(inc.id);
    } else {
      cesiumService.flyToIncident(inc);
    }
  };

  return (
    <div className="space-y-5 text-slate-200">
      {/* Top Incident Summary Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Send className="w-4 h-4 text-cyan-400" />
            Intelligent Dispatch Engine & Multi-Agency Roster
          </h3>
          <p className="text-xs text-slate-400">
            A* graph shortest-path routing, priority scoring algorithms, and 6-stage lifecycle dispatch audit
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">Active: <b className="text-rose-400">{incidents.filter(i => i.status !== 'RESOLVED').length}</b></span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Assigned: <b className="text-amber-400">{dispatches.filter(d => d.status !== 'RESOLVED' && d.status !== 'CANCELLED').length}</b></span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Resolved: <b className="text-emerald-400">{dispatches.filter(d => d.status === 'RESOLVED').length}</b></span>
          </div>

          <button
            onClick={() => setIsNewIncidentModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" /> Inject Simulated Incident
          </button>
        </div>
      </div>

      {/* Main Grid: Left Column Incident Queue + Right Column Incident Intelligence & Stepper */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: INCIDENT QUEUE & FILTERS (5 COLUMNS) */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 space-y-3">
          {/* Filter Bar */}
          <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search incidents by name or sector..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="UNASSIGNED">Unassigned</option>
                <option value="ACTIVE_DISPATCH">Dispatched</option>
                <option value="RESOLVED">Resolved</option>
              </select>

              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MODERATE">Moderate</option>
                <option value="LOW">Low</option>
              </select>

              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none"
              >
                <option value="ALL">All Zones</option>
                {zones.map(z => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Incidents List Container */}
          <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
            {filteredIncidents.length > 0 ? (
              filteredIncidents.map((inc) => {
                const isSelected = selectedIncident?.id === inc.id;
                const activeDisp = dispatches.find(d => d.incidentId === inc.id && d.status !== 'RESOLVED' && d.status !== 'CANCELLED');
                const zone = zones.find(z => z.id === inc.affectedZoneId);

                return (
                  <div
                    key={inc.id}
                    onClick={() => {
                      setSelectedIncidentId(inc.id);
                      if (onSelectIncident) onSelectIncident(inc);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition ${
                      isSelected 
                        ? 'bg-slate-900 border-cyan-500 shadow-md ring-1 ring-cyan-500/50' 
                        : 'bg-slate-900/60 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700">
                          {getCategoryIcon(inc.type)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-white text-xs leading-snug">{inc.title}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">{inc.id}</span>
                        </div>
                      </div>
                      {getSeverityBadge(inc.severity)}
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1.5">{inc.description}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px] text-slate-400 font-mono mt-2">
                      <span className="text-cyan-400">{zone?.name || inc.affectedZoneId}</span>
                      <span>Impact: ~{inc.affectedPopulation} pax</span>
                      {activeDisp ? (
                        <span className="text-amber-400 font-semibold">{activeDisp.status}</span>
                      ) : inc.status === 'RESOLVED' ? (
                        <span className="text-emerald-400">RESOLVED</span>
                      ) : (
                        <span className="text-rose-400 font-semibold">UNASSIGNED</span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 border border-slate-800 rounded-xl bg-slate-900/40">
                <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                No incidents matching current filters.
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: INCIDENT DETAILS, SCORING & DISPATCH (7 COLUMNS) */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 space-y-4">
          {selectedIncident ? (
            <>
              {/* Selected Incident Header Card */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                      {getCategoryIcon(selectedIncident.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-sm">{selectedIncident.title}</h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {selectedIncident.id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Category: <span className="text-slate-300 font-medium">{selectedIncident.type.replace('_', ' ')}</span> • Sector: <span className="text-cyan-400">{zones.find(z => z.id === selectedIncident.affectedZoneId)?.name || selectedIncident.affectedZoneId}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleFlyTo(selectedIncident)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-medium flex items-center gap-1.5 transition"
                    >
                      <Navigation className="w-3.5 h-3.5" /> Fly-to in 3D
                    </button>
                    {selectedIncident.status === 'ACTIVE' && (
                      <button
                        onClick={() => dispatchEngine.acknowledgeIncident(selectedIncident.id)}
                        className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <Check className="w-3.5 h-3.5" /> Acknowledge
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300">
                  {selectedIncident.description}
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
                  <span>Coordinates: {selectedIncident.coordinates[1].toFixed(5)}°N, {selectedIncident.coordinates[0].toFixed(5)}°E</span>
                  <span>Reported: {selectedIncident.reportedTimestamp ? new Date(selectedIncident.reportedTimestamp).toLocaleTimeString() : 'Recent'}</span>
                  <span>Affected Devotees: ~{selectedIncident.affectedPopulation}</span>
                </div>
              </div>

              {/* ACTIVE DISPATCH WORKFLOW STEPPER (If Assigned) */}
              {currentDispatch ? (
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4 text-cyan-400" />
                      <h4 className="font-bold text-white text-xs">Active Multi-Agency Dispatch Assignment</h4>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                      Assigned: {currentDispatch.resourceName} ({currentDispatch.resourceCategory})
                    </span>
                  </div>

                  {/* 6-Stage Stepper */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {(['REPORTED', 'ACKNOWLEDGED', 'ASSIGNED', 'DISPATCHED', 'ON_SCENE', 'RESOLVED'] as const).map((step, idx) => {
                      const stages = ['REPORTED', 'ACKNOWLEDGED', 'ASSIGNED', 'DISPATCHED', 'ON_SCENE', 'RESOLVED'];
                      const currentIdx = stages.indexOf(currentDispatch.status);
                      const isDone = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;

                      return (
                        <div 
                          key={step} 
                          className={`p-2 rounded-xl border text-center transition ${
                            isCurrent 
                              ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 font-bold shadow-glow-sm' 
                              : isDone 
                              ? 'bg-slate-900 border-slate-700 text-slate-300' 
                              : 'bg-slate-950/40 border-slate-800/60 text-slate-600'
                          }`}
                        >
                          <div className="text-[9px] font-mono text-slate-500 mb-0.5">Stage {idx + 1}</div>
                          <div className="text-[11px] truncate">{step.replace('_', ' ')}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Workflow Action Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                    <div className="text-xs text-slate-400 font-mono">
                      Travel ETA: <b className="text-amber-300">{currentDispatch.estimatedArrivalMinutes} min</b> ({currentDispatch.distanceMeters}m route)
                    </div>

                    <div className="flex items-center gap-2">
                      {currentDispatch.status !== 'RESOLVED' && currentDispatch.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleAdvanceStatus(currentDispatch.id)}
                          className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          {currentDispatch.status === 'ASSIGNED' && 'Dispatch Team (Mobilize)'}
                          {currentDispatch.status === 'DISPATCHED' && 'Confirm On Scene'}
                          {currentDispatch.status === 'ON_SCENE' && 'Resolve & Release Unit'}
                        </button>
                      )}

                      {currentDispatch.status !== 'RESOLVED' && (
                        <button
                          onClick={() => handleOpenCancel(currentDispatch.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-400 text-xs transition"
                        >
                          Cancel Dispatch
                        </button>
                      )}

                      <button
                        onClick={() => cesiumService.renderDispatchRoute(currentDispatch)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs transition"
                        title="Highlight 3D Corridor on Cesium Globe"
                      >
                        <Navigation className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Transition Audit Log Stream */}
                  <div className="space-y-1.5 pt-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <History className="w-3 h-3 text-amber-400" />
                      Audit Trail ({currentDispatch.auditHistory.length} Transitions)
                    </div>
                    <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                      {currentDispatch.auditHistory.map((audit) => (
                        <div key={audit.id} className="p-2 rounded bg-slate-950/60 border border-slate-800 text-[11px] flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-white">{audit.fromStatus} ➔ {audit.toStatus}</span>
                            <span className="text-slate-400 ml-2">by {audit.actor}</span>
                            {audit.notes && <span className="text-slate-500 italic ml-2">• {audit.notes}</span>}
                          </div>
                          <span className="font-mono text-[10px] text-slate-500">{audit.simulationTime}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* RECOMMENDED RESOURCES SCORING LIST */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h4 className="font-bold text-white text-xs">
                      Intelligent Resource Priority Scoring
                    </h4>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowOverride}
                        onChange={(e) => setAllowOverride(e.target.checked)}
                        className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                      />
                      <span>Emergency Override (Assign Busy Units)</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {recommendations.slice(0, 5).map((rec, idx) => {
                    const isAvailable = rec.resource.status === 'AVAILABLE';
                    const canAssign = isAvailable || allowOverride;

                    return (
                      <div
                        key={rec.resource.id}
                        className={`p-3 rounded-xl border space-y-2 transition ${
                          rec.isRecommended 
                            ? 'bg-cyan-950/30 border-cyan-500/60' 
                            : 'bg-slate-950/60 border-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              idx === 0 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                            }`}>
                              #{idx + 1}
                            </span>
                            <div>
                              <div className="font-bold text-white text-xs flex items-center gap-2">
                                <span>{rec.resource.name}</span>
                                <span className="text-[10px] font-mono text-slate-500">({rec.resource.category})</span>
                              </div>
                              <div className="text-[11px] text-cyan-400">
                                Assigned to: {zones.find(z => z.id === rec.resource.assignedZoneId)?.name || rec.resource.assignedZoneId}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {onFlyToResource && (
                              <button
                                onClick={() => onFlyToResource(rec.resource.id)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition"
                                title="Locate resource on 3D globe"
                              >
                                <Navigation className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <div className="text-right">
                              <div className="font-mono text-sm font-bold text-emerald-400">
                                {rec.totalScore}% Match
                              </div>
                              <span className="text-[10px] font-mono text-slate-400">
                                {rec.distanceMeters}m • ~{rec.estimatedArrivalMinutes}m ETA
                              </span>
                            </div>

                            <button
                              disabled={!canAssign}
                              onClick={() => handleAssignResource(rec.resource.id)}
                              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-white text-xs font-semibold flex items-center gap-1 transition"
                            >
                              <Check className="w-3 h-3" /> Assign
                            </button>
                          </div>
                        </div>

                        {/* Breakdown pills & reason */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-400 border-t border-slate-800/60">
                          <span className="truncate">{rec.selectionReason}</span>
                          <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${
                            rec.isStraightLineFallback 
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {rec.isStraightLineFallback ? 'Vector Fallback' : 'A* Road Network'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500 border border-slate-800 rounded-2xl bg-slate-900/40">
              <AlertTriangle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              Select an incident from the queue on the left to inspect recommended resources and control the dispatch workflow.
            </div>
          )}
        </div>

      </div>

      {/* MODAL: INJECT NEW INCIDENT */}
      {isNewIncidentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div 
            className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Inject Simulated Incident into Operational Stream
              </h3>
              <button onClick={() => setIsNewIncidentModalOpen(false)} className="p-1 rounded text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Incident Title / Callout</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Severe Stepped Crowd Crush - Saraswati Ghat Steps"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Incident Category</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as IncidentType)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="MEDICAL_EMERGENCY">Medical Emergency</option>
                    <option value="FIRE_HAZARD">Fire Hazard Incident</option>
                    <option value="FLOOD_SURGE">Flood Surge Alert</option>
                    <option value="CROWD_CRUSH">Crowd Crush Saturation</option>
                    <option value="GATE_CONGESTION">Gate Congestion</option>
                    <option value="STEP_BOTTLENECK">Step Bottleneck</option>
                    <option value="ROUTE_BLOCKED">Blocked Evacuation Route</option>
                    <option value="VEHICLE_OBSTRUCTION">Vehicle Obstruction</option>
                    <option value="ADMIN_INCIDENT">Admin General Drill</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Incident Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as IncidentSeverity)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="CRITICAL">CRITICAL (Immediate Multi-Agency)</option>
                    <option value="HIGH">HIGH (Urgent Dispatch)</option>
                    <option value="MODERATE">MODERATE (Standard Containment)</option>
                    <option value="LOW">LOW (Observation & Monitoring)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Target Sector</label>
                  <select
                    value={newZoneId}
                    onChange={(e) => setNewZoneId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Affected Devotee Estimate</label>
                  <input
                    type="number"
                    min="10"
                    max="5000"
                    step="10"
                    value={newPopulation}
                    onChange={(e) => setNewPopulation(parseInt(e.target.value, 10) || 50)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Operational Description & Notes</label>
                <textarea
                  rows={2}
                  placeholder="Details of the reported hazard, location markers, or eyewitness accounts..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewIncidentModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold transition"
                >
                  Inject Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CANCEL DISPATCH */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 space-y-4 text-xs">
            <h4 className="font-bold text-white text-sm">Cancel Dispatch Assignment</h4>
            <p className="text-slate-400">
              Provide an official cancellation reason for the audit trail. The assigned unit will be released and returned to AVAILABLE status.
            </p>

            <select
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none"
            >
              <option value="False alarm or redundant dispatch">False alarm or redundant dispatch</option>
              <option value="Situation resolved prior to arrival">Situation resolved prior to arrival</option>
              <option value="Higher priority incident re-routing">Higher priority incident re-routing</option>
              <option value="Access corridor obstructed">Access corridor obstructed</option>
              <option value="Administrative cancellation">Administrative cancellation</option>
            </select>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
              >
                Back
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
