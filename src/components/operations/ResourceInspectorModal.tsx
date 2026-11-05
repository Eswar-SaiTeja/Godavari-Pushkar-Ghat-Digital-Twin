import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Radio, 
  Shield, 
  HeartPulse, 
  Truck, 
  Flame, 
  Users, 
  Droplet, 
  Building, 
  Tent, 
  Clock, 
  Navigation, 
  CheckCircle2, 
  AlertTriangle,
  History,
  Send,
  Package
} from 'lucide-react';
import { EventResource, ResourceStatus, ResourceCategory } from '../../types/operations';
import { eventOperationsEngine } from '../../services/eventOperationsEngine';
import { cesiumService } from '../../services/cesiumService';

interface ResourceInspectorModalProps {
  resource: EventResource | null;
  isOpen: boolean;
  onClose: () => void;
  onFlyToResource?: (resourceId: string) => void;
}

export const ResourceInspectorModal: React.FC<ResourceInspectorModalProps> = ({
  resource,
  isOpen,
  onClose,
  onFlyToResource,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<ResourceStatus | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  if (!isOpen || !resource) return null;

  const zones = eventOperationsEngine.getZones();
  const currentStatus = selectedStatus ?? resource.status;
  const currentZoneId = selectedZone ?? resource.assignedZoneId;
  const currentZone = zones.find(z => z.id === resource.assignedZoneId);

  const getCategoryIcon = (category: ResourceCategory) => {
    switch (category) {
      case 'POLICE': return <Shield className="w-5 h-5 text-blue-400" />;
      case 'MEDICAL': return <HeartPulse className="w-5 h-5 text-rose-400" />;
      case 'AMBULANCE': return <Truck className="w-5 h-5 text-amber-400" />;
      case 'FIRST_AID': return <HeartPulse className="w-5 h-5 text-pink-400" />;
      case 'FIRE_RESCUE': return <Flame className="w-5 h-5 text-orange-400" />;
      case 'EMERGENCY_VEHICLE': return <Truck className="w-5 h-5 text-yellow-400" />;
      case 'VOLUNTEER': return <Users className="w-5 h-5 text-emerald-400" />;
      case 'WATER_STATION': return <Droplet className="w-5 h-5 text-sky-400" />;
      case 'PUBLIC_TOILET': return <Building className="w-5 h-5 text-cyan-400" />;
      case 'TEMPORARY_SHELTER': return <Tent className="w-5 h-5 text-purple-400" />;
      default: return <Radio className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: ResourceStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="px-2 py-0.5 rounded text-xs font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">AVAILABLE</span>;
      case 'DEPLOYED':
        return <span className="px-2 py-0.5 rounded text-xs font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30">DEPLOYED</span>;
      case 'BUSY':
        return <span className="px-2 py-0.5 rounded text-xs font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">BUSY / EN ROUTE</span>;
      case 'OFFLINE':
        return <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-500/20 text-slate-400 border border-slate-500/30">OFFLINE</span>;
      case 'NEEDS_REPLENISHMENT':
        return <span className="px-2 py-0.5 rounded text-xs font-mono bg-rose-500/20 text-rose-400 border border-rose-500/30">NEEDS REPLENISHMENT</span>;
    }
  };

  const handleUpdate = () => {
    if (selectedStatus && selectedStatus !== resource.status) {
      eventOperationsEngine.updateResourceStatus(resource.id, selectedStatus);
    }
    if (selectedZone && selectedZone !== resource.assignedZoneId) {
      eventOperationsEngine.assignResourceToZone(resource.id, selectedZone);
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleFlyTo = () => {
    if (onFlyToResource) {
      onFlyToResource(resource.id);
    } else {
      cesiumService.flyToResource(resource.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
              {getCategoryIcon(resource.category)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg text-white">{resource.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                  {resource.id}
                </span>
              </div>
              <p className="text-xs text-slate-400 capitalize">
                Category: <span className="text-slate-300 font-medium">{resource.category.replace('_', ' ')}</span> • Assigned: <span className="text-cyan-400">{currentZone?.name || resource.assignedZoneId}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Quick Status Bar */}
          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Current Status:</span>
              {getStatusBadge(resource.status)}
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Updated: {resource.lastStatusUpdate}
            </div>
          </div>

          {/* Location & Coordinates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-800/40 border border-slate-700/40 rounded-xl">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Geographic Position</span>
              </div>
              <div className="font-mono text-xs text-white">
                {resource.coordinates.latitude.toFixed(6)}° N, {resource.coordinates.longitude.toFixed(6)}° E
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">WGS84 (EPSG:4326)</div>
            </div>

            <div className="p-3 bg-slate-800/40 border border-slate-700/40 rounded-xl">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span>Team / Radio Contact</span>
              </div>
              <div className="text-xs font-semibold text-white truncate">
                {resource.contactRef}
              </div>
              <div className="text-[11px] text-cyan-400 font-mono mt-0.5">
                Personnel: {resource.personnelCount} members
              </div>
            </div>
          </div>

          {/* Operational Controls: Change Status & Assign Zone */}
          <div className="p-4 bg-slate-800/30 border border-slate-700/40 rounded-xl space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>Administrative State Controls</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Change Status</label>
                <select
                  value={currentStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as ResourceStatus)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="AVAILABLE">AVAILABLE (Ready)</option>
                  <option value="DEPLOYED">DEPLOYED (Active On-Scene)</option>
                  <option value="BUSY">BUSY (En Route)</option>
                  <option value="OFFLINE">OFFLINE (Off-Shift)</option>
                  <option value="NEEDS_REPLENISHMENT">NEEDS REPLENISHMENT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Assign Operational Zone</label>
                <select
                  value={currentZoneId}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {zones.map(z => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs">
                {saveSuccess && (
                  <span className="text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Updated successfully!
                  </span>
                )}
              </div>
              <button
                onClick={handleUpdate}
                disabled={currentStatus === resource.status && currentZoneId === resource.assignedZoneId}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-xs font-medium text-white transition flex items-center gap-1.5"
              >
                <Send className="w-3 h-3" /> Apply Update
              </button>
            </div>
          </div>

          {/* Current Mission & Equipment */}
          <div className="space-y-3">
            <div className="p-3 bg-slate-800/30 border border-slate-700/30 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <History className="w-3.5 h-3.5 text-amber-400" />
                <span>Current Deployment Mission</span>
              </div>
              <p className="text-xs text-white">{resource.deploymentStatus}</p>
            </div>

            <div className="p-3 bg-slate-800/30 border border-slate-700/30 rounded-xl space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <Package className="w-3.5 h-3.5 text-cyan-400" />
                <span>Standard Issue Equipment</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {resource.equipment.map((item, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] border border-slate-700">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-800/80 border-t border-slate-700/60 flex items-center justify-between">
          <div className="text-[11px] text-amber-400/90 font-mono flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>SIMULATED FIELD TELEMETRY</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleFlyTo}
              className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5"
            >
              <Navigation className="w-3.5 h-3.5 text-cyan-400" />
              Fly to Location
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
