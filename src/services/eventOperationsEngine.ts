import { 
  EventResource, 
  OperationalZone, 
  DispatchAssignment, 
  OperationsLogEvent, 
  PublicFacility, 
  OperationsCommandMetrics, 
  ResourceStatus,
  ResourceCategory,
  FacilityAvailability
} from '../types/operations';
import { 
  DEFAULT_OPERATIONAL_ZONES, 
  DEFAULT_EVENT_RESOURCES, 
  DEFAULT_PUBLIC_FACILITIES 
} from '../config/operationsData';
import { emergencyEngine } from './emergencyDetectionEngine';
import { EmergencyIncident } from '../types/emergency';

class EventOperationsEngine {
  private resources: EventResource[] = [...DEFAULT_EVENT_RESOURCES];
  private zones: OperationalZone[] = [...DEFAULT_OPERATIONAL_ZONES];
  private facilities: PublicFacility[] = [...DEFAULT_PUBLIC_FACILITIES];
  private dispatches: DispatchAssignment[] = [];
  private operationsLog: OperationsLogEvent[] = [];
  private listeners: Set<() => void> = new Set();
  private updateTimer: any = null;

  constructor() {
    this.initializeDefaultLogs();
    this.startLiveOperationalLoop();
  }

  /**
   * Initialize operation history with initial operational audit milestones
   */
  private initializeDefaultLogs(): void {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour12: false });

    this.operationsLog = [
      {
        id: 'log-1',
        timestamp: now.toISOString(),
        simulationTime: timeStr,
        category: 'SYSTEM',
        title: 'Event Operations Command Center Initialized',
        description: 'Command center telemetry connected to Godavari Digital Twin spatial services.',
        severity: 'SUCCESS',
        isSimulated: true,
      },
      {
        id: 'log-2',
        timestamp: new Date(now.getTime() - 1000 * 60 * 15).toISOString(),
        simulationTime: '06:00:00',
        category: 'RESOURCE',
        title: 'Morning Resource Muster Completed',
        description: '22 Field units reported on-station across Pushkar and Kotilingala sectors.',
        severity: 'INFO',
        isSimulated: true,
      },
      {
        id: 'log-3',
        timestamp: new Date(now.getTime() - 1000 * 60 * 10).toISOString(),
        simulationTime: '06:15:00',
        category: 'ZONE',
        title: 'Zone Capacity Thresholds Activated',
        description: 'Bathing ghat buffer zones calibrated to Pushkaram safety standards.',
        severity: 'INFO',
        isSimulated: true,
      },
      {
        id: 'log-4',
        timestamp: new Date(now.getTime() - 1000 * 60 * 5).toISOString(),
        simulationTime: '06:30:00',
        category: 'FACILITY',
        title: 'Municipal Drinking Water & Bio-Toilets Certified',
        description: 'RO dispensing units and mobile sanitation clusters verified operational.',
        severity: 'SUCCESS',
        isSimulated: true,
      },
    ];
  }

  /**
   * Periodic live loop updating zone populations, inflows, and capacities
   */
  private startLiveOperationalLoop(): void {
    if (this.updateTimer) clearInterval(this.updateTimer);

    this.updateTimer = setInterval(() => {
      this.updateZoneTelemetry();
      this.notifyListeners();
    }, 2000);
  }

  /**
   * Updates zone crowd population from emergency engine / crowd engine states
   */
  private updateZoneTelemetry(): void {
    const totalSimDevotees = 18200 + Math.floor(Math.sin(Date.now() / 15000) * 1200);

    // Distribution weights across the 7 operational zones
    const weights: Record<string, number> = {
      'zone-pushkar-ghat': 0.32,
      'zone-kotilingala-ghat': 0.28,
      'zone-markandeya-ghat': 0.10,
      'zone-saraswati-ghat': 0.12,
      'zone-vip-ghat': 0.02,
      'zone-pushkar-chowk-transit': 0.11,
      'zone-arts-college-assembly': 0.05,
    };

    const activeIncidents = emergencyEngine.getIncidents().filter((i: EmergencyIncident) => i.status === 'ACTIVE');

    this.zones = this.zones.map((zone) => {
      const weight = weights[zone.id] || 0.1;
      const variation = Math.floor(Math.sin(Date.now() / 8000 + zone.capacityAssumption) * 180);
      const simulatedPop = Math.max(100, Math.floor(totalSimDevotees * weight + variation));

      const utilPct = (simulatedPop / zone.capacityAssumption) * 100;

      let densityClass: OperationalZone['densityClassification'] = 'LOW';
      if (utilPct > 85) densityClass = 'CRITICAL';
      else if (utilPct > 65) densityClass = 'HIGH';
      else if (utilPct > 35) densityClass = 'MODERATE';

      const zoneIncidents = activeIncidents.filter((inc: EmergencyIncident) => {
        // Approximate bounding distance
        const dLat = Math.abs(inc.coordinates[1] - zone.center.latitude);
        const dLon = Math.abs(inc.coordinates[0] - zone.center.longitude);
        return dLat < 0.005 && dLon < 0.005;
      });

      return {
        ...zone,
        currentSimulatedPopulation: simulatedPop,
        densityClassification: densityClass,
        inflowRate: Math.max(20, Math.floor(simulatedPop * 0.045 + variation * 0.1)),
        outflowRate: Math.max(15, Math.floor(simulatedPop * 0.042 - variation * 0.05)),
        averageWaitingTimeMinutes: Number(((simulatedPop / (zone.capacityAssumption * 0.8)) * 14).toFixed(1)),
        queueEstimationCount: Math.floor(simulatedPop * 0.075),
        activeIncidentIds: zoneIncidents.map((i: EmergencyIncident) => i.id),
        isCongestionAlert: densityClass === 'HIGH' || densityClass === 'CRITICAL' || zoneIncidents.length > 0,
      };
    });
  }

  // ==========================================
  // GETTERS
  // ==========================================

  public getResources(): EventResource[] {
    return [...this.resources];
  }

  public getResourceById(id: string): EventResource | undefined {
    return this.resources.find(r => r.id === id);
  }

  public getZones(): OperationalZone[] {
    return [...this.zones];
  }

  public getZoneById(id: string): OperationalZone | undefined {
    return this.zones.find(z => z.id === id);
  }

  public getFacilities(): PublicFacility[] {
    return [...this.facilities];
  }

  public getDispatches(): DispatchAssignment[] {
    return [...this.dispatches];
  }

  public getOperationsLogs(): OperationsLogEvent[] {
    return [...this.operationsLog];
  }

  /**
   * Aggregate Operations Command Center KPI telemetry
   */
  public getOperationsMetrics(): OperationsCommandMetrics {
    const totalPop = this.zones.reduce((sum, z) => sum + z.currentSimulatedPopulation, 0);
    const activeIncidents = emergencyEngine.getIncidents().filter((i: EmergencyIncident) => i.status === 'ACTIVE');

    const policeResources = this.resources.filter(r => r.category === 'POLICE');
    const medicalResources = this.resources.filter(r => r.category === 'MEDICAL' || r.category === 'FIRST_AID');
    const ambulances = this.resources.filter(r => r.category === 'AMBULANCE');

    const availableEmergTeams = this.resources.filter(
      r => (r.category === 'POLICE' || r.category === 'MEDICAL' || r.category === 'AMBULANCE' || r.category === 'FIRE_RESCUE') &&
           r.status === 'AVAILABLE'
    ).length;

    const criticalZones = this.zones.filter(z => z.densityClassification === 'CRITICAL' || z.isCongestionAlert).length;
    const availableTotal = this.resources.filter(r => r.status === 'AVAILABLE').length;

    return {
      totalSimulatedVisitors: Math.floor(totalPop * 1.8),
      currentCrowdPopulation: totalPop,
      activeIncidentCount: activeIncidents.length,
      availableEmergencyTeams: availableEmergTeams,
      activeMedicalStations: medicalResources.filter(r => r.status !== 'OFFLINE').length,
      ambulanceAvailability: {
        available: ambulances.filter(a => a.status === 'AVAILABLE').length,
        total: ambulances.length,
        dispatched: ambulances.filter(a => a.status === 'DEPLOYED' || a.status === 'BUSY').length,
      },
      policeDeploymentStatus: {
        onDuty: policeResources.reduce((sum, p) => sum + p.personnelCount, 0),
        patrolUnits: policeResources.filter(p => p.status === 'DEPLOYED').length,
        checkPosts: policeResources.length,
      },
      criticalZoneCount: criticalZones,
      totalResources: this.resources.length,
      resourceAvailabilityPct: Math.round((availableTotal / Math.max(1, this.resources.length)) * 100),
      averageResponseTimeMinutes: 3.4,
      lastUpdated: new Date().toLocaleTimeString('en-IN', { hour12: false }),
    };
  }

  // ==========================================
  // RESOURCE MANAGEMENT (CRUD & STATUS)
  // ==========================================

  public addResource(resource: EventResource): void {
    this.resources.push(resource);
    this.addLogEvent({
      category: 'RESOURCE',
      title: `Resource Commissioned: ${resource.name}`,
      description: `Added to zone ${resource.assignedZoneId} with status ${resource.status}.`,
      severity: 'INFO',
      isSimulated: true,
    });
    this.notifyListeners();
  }

  public updateResource(updated: EventResource): void {
    const idx = this.resources.findIndex(r => r.id === updated.id);
    if (idx !== -1) {
      const prev = this.resources[idx];
      this.resources[idx] = updated;

      if (prev.status !== updated.status) {
        this.addLogEvent({
          category: 'RESOURCE',
          title: `Status Changed: ${updated.name}`,
          description: `Status transitioned from ${prev.status} to ${updated.status}.`,
          severity: updated.status === 'AVAILABLE' ? 'SUCCESS' : 'WARNING',
          isSimulated: true,
        });
      }
      this.notifyListeners();
    }
  }

  public removeResource(resourceId: string): void {
    const res = this.resources.find(r => r.id === resourceId);
    this.resources = this.resources.filter(r => r.id !== resourceId);
    if (res) {
      this.addLogEvent({
        category: 'RESOURCE',
        title: `Resource Decommissioned: ${res.name}`,
        description: `Removed from active event deployment roster.`,
        severity: 'INFO',
        isSimulated: true,
      });
    }
    this.notifyListeners();
  }

  public setResourceStatus(resourceId: string, status: ResourceStatus, notes?: string): void {
    const res = this.resources.find(r => r.id === resourceId);
    if (res) {
      const oldStatus = res.status;
      res.status = status;
      res.lastStatusUpdate = 'Just now';
      if (notes) res.deploymentStatus = notes;

      this.addLogEvent({
        category: 'RESOURCE',
        title: `Resource Status Update: ${res.name}`,
        description: `Status: ${oldStatus} -> ${status}${notes ? ` • Note: ${notes}` : ''}`,
        severity: status === 'AVAILABLE' ? 'SUCCESS' : 'INFO',
        isSimulated: true,
      });
      this.notifyListeners();
    }
  }

  public assignResourceToZone(resourceId: string, zoneId: string): void {
    const res = this.resources.find(r => r.id === resourceId);
    const targetZone = this.zones.find(z => z.id === zoneId);
    if (res && targetZone) {
      // Remove from old zone
      this.zones.forEach(z => {
        z.assignedResourceIds = z.assignedResourceIds.filter(id => id !== resourceId);
      });
      res.assignedZoneId = zoneId;
      targetZone.assignedResourceIds.push(resourceId);

      this.addLogEvent({
        category: 'RESOURCE',
        title: `Zone Reassignment: ${res.name}`,
        description: `Reassigned to ${targetZone.name}.`,
        severity: 'INFO',
        isSimulated: true,
      });
      this.notifyListeners();
    }
  }

  // ==========================================
  // ZONE CONFIGURATION (ADMIN)
  // ==========================================

  public updateZoneCapacity(zoneId: string, capacity: number): void {
    const zone = this.zones.find(z => z.id === zoneId);
    if (zone) {
      const oldCap = zone.capacityAssumption;
      zone.capacityAssumption = capacity;

      this.addLogEvent({
        category: 'ZONE',
        title: `Zone Capacity Reconfigured: ${zone.name}`,
        description: `Capacity changed from ${oldCap.toLocaleString()} to ${capacity.toLocaleString()} devotees.`,
        severity: 'INFO',
        isSimulated: true,
      });
      this.updateZoneTelemetry();
      this.notifyListeners();
    }
  }

  public updateZone(updated: OperationalZone): void {
    const idx = this.zones.findIndex(z => z.id === updated.id);
    if (idx !== -1) {
      this.zones[idx] = updated;
      this.notifyListeners();
    }
  }

  // ==========================================
  // FACILITY MANAGEMENT
  // ==========================================

  public setFacilityAvailability(
    facilityId: string, 
    availability: FacilityAvailability, 
    maintenanceStatus?: string
  ): void {
    const fac = this.facilities.find(f => f.id === facilityId);
    if (fac) {
      fac.availability = availability;
      if (maintenanceStatus) fac.maintenanceStatus = maintenanceStatus;
      fac.lastInspection = 'Just now';

      this.addLogEvent({
        category: 'FACILITY',
        title: `Facility Updated: ${fac.name}`,
        description: `Availability: ${availability}${maintenanceStatus ? ` • Status: ${maintenanceStatus}` : ''}`,
        severity: availability === 'OPERATIONAL' ? 'SUCCESS' : 'WARNING',
        isSimulated: true,
      });
      this.notifyListeners();
    }
  }

  public updateFacility(updated: PublicFacility): void {
    const idx = this.facilities.findIndex(f => f.id === updated.id);
    if (idx !== -1) {
      this.facilities[idx] = updated;
      this.notifyListeners();
    }
  }

  // ==========================================
  // INTELLIGENT RESOURCE DISPATCH
  // ==========================================

  /**
   * Calculate approximate distance in meters between two WGS84 coordinates (Haversine formula)
   */
  public calculateDistanceMeters(
    coord1: { latitude: number; longitude: number },
    coord2: { latitude: number; longitude: number }
  ): number {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (coord1.latitude * Math.PI) / 180;
    const phi2 = (coord2.latitude * Math.PI) / 180;
    const deltaPhi = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const deltaLambda = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  }

  /**
   * Suggest best matching available resources for an incident, sorted by distance
   */
  public suggestResourcesForIncident(incident: EmergencyIncident): {
    resource: EventResource;
    distanceMeters: number;
    estimatedArrivalMinutes: number;
    isRecommended: boolean;
  }[] {
    const incCoord = {
      latitude: incident.coordinates[1],
      longitude: incident.coordinates[0],
    };

    // Filter compatible categories
    let preferredCategories: ResourceCategory[] = [];
    if (incident.type === 'FIRE_HAZARD') {
      preferredCategories = ['FIRE_RESCUE', 'POLICE', 'AMBULANCE'];
    } else if (incident.type === 'FLOOD_SURGE') {
      preferredCategories = ['FIRE_RESCUE', 'POLICE', 'MEDICAL'];
    } else {
      // Crowd crush, gate congestion, bottleneck
      preferredCategories = ['POLICE', 'AMBULANCE', 'MEDICAL', 'FIRST_AID', 'VOLUNTEER'];
    }

    const available = this.resources.filter(
      r => r.status === 'AVAILABLE' && preferredCategories.includes(r.category)
    );

    const scored = available.map((res) => {
      const dist = this.calculateDistanceMeters(incCoord, res.coordinates);
      // Assume average response speed: 20 km/h = ~333 m/min for vehicles, 5 km/h = 83 m/min for foot patrol
      const isVehicle = res.category === 'AMBULANCE' || res.category === 'FIRE_RESCUE';
      const speedMpm = isVehicle ? 300 : 85;
      const arrivalMin = Number(Math.max(1, dist / speedMpm).toFixed(1));

      return {
        resource: res,
        distanceMeters: dist,
        estimatedArrivalMinutes: arrivalMin,
        isRecommended: false,
      };
    });

    // Sort by distance ascending
    scored.sort((a, b) => a.distanceMeters - b.distanceMeters);
    if (scored.length > 0) scored[0].isRecommended = true;

    return scored;
  }

  /**
   * Dispatches a resource to an incident and creates a live assignment tracking record
   */
  public dispatchResourceToIncident(
    incident: EmergencyIncident,
    resourceId: string,
    notes: string = ''
  ): DispatchAssignment | null {
    const resource = this.resources.find(r => r.id === resourceId);
    if (!resource) return null;

    const incCoord = {
      latitude: incident.coordinates[1],
      longitude: incident.coordinates[0],
    };
    const dist = this.calculateDistanceMeters(incCoord, resource.coordinates);
    const speedMpm = resource.category === 'AMBULANCE' || resource.category === 'FIRE_RESCUE' ? 300 : 85;
    const arrivalMin = Number(Math.max(1, dist / speedMpm).toFixed(1));

    const assignment: DispatchAssignment = {
      id: `disp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      incidentId: incident.id,
      incidentTitle: incident.title,
      incidentType: incident.type,
      incidentSeverity: incident.severity,
      incidentCoordinates: incident.coordinates,
      resourceId: resource.id,
      resourceName: resource.name,
      resourceCategory: resource.category,
      status: 'DISPATCHED',
      assignedTimestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
      dispatchedTimestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
      distanceMeters: dist,
      estimatedArrivalMinutes: arrivalMin,
      routeCoordinates: [
        [resource.coordinates.longitude, resource.coordinates.latitude],
        [incident.coordinates[0], incident.coordinates[1]],
      ],
      auditHistory: [
        {
          id: `audit-${Date.now()}-1`,
          fromStatus: 'ASSIGNED',
          toStatus: 'DISPATCHED',
          timestamp: new Date().toISOString(),
          simulationTime: new Date().toLocaleTimeString('en-IN', { hour12: false }),
          actor: 'Operations Commander',
          notes: notes || `Direct dispatch to ${incident.title}`,
        }
      ],
      notes: notes || `Dispatched to ${incident.title} (${incident.severity} severity).`,
    };

    this.dispatches.push(assignment);
    resource.status = 'DEPLOYED';
    resource.deploymentStatus = `Dispatched to incident #${incident.id.slice(-4)}`;

    this.addLogEvent({
      category: 'DISPATCH',
      title: `Team Dispatched: ${resource.name}`,
      description: `Dispatched to ${incident.title} • Distance: ${dist}m • ETA: ${arrivalMin} mins.`,
      severity: 'WARNING',
      relatedId: assignment.id,
      isSimulated: true,
    });

    this.notifyListeners();
    return assignment;
  }

  /**
   * Advances the status of an active dispatch assignment
   */
  public updateDispatchStatus(
    dispatchId: string, 
    status: DispatchAssignment['status'],
    notes?: string
  ): void {
    const disp = this.dispatches.find(d => d.id === dispatchId);
    if (!disp) return;

    disp.status = status;
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour12: false });

    if (status === 'ON_SCENE') disp.onSceneTimestamp = timeStr;
    if (status === 'RESOLVED') disp.resolvedTimestamp = timeStr;
    if (notes) disp.notes = notes;

    const resource = this.resources.find(r => r.id === disp.resourceId);

    if (status === 'RESOLVED' && resource) {
      resource.status = 'AVAILABLE';
      resource.deploymentStatus = 'Available for next operational assignment';
    }

    this.addLogEvent({
      category: 'DISPATCH',
      title: `Dispatch Update: ${disp.resourceName}`,
      description: `Status changed to ${status} for incident #${disp.incidentId.slice(-4)}.`,
      severity: status === 'RESOLVED' ? 'SUCCESS' : 'INFO',
      relatedId: dispatchId,
      isSimulated: true,
    });

    this.notifyListeners();
  }

  public advanceDispatchStatus(dispatchId: string): DispatchAssignment | undefined {
    const disp = this.dispatches.find(d => d.id === dispatchId);
    if (!disp) return undefined;
    const stages: DispatchAssignment['status'][] = [
      'REPORTED',
      'ACKNOWLEDGED',
      'ASSIGNED',
      'DISPATCHED',
      'ON_SCENE',
      'RESOLVED'
    ];
    const currentIndex = stages.indexOf(disp.status);
    if (currentIndex < stages.length - 1) {
      const nextStatus = stages[currentIndex + 1];
      this.updateDispatchStatus(dispatchId, nextStatus);
    }
    return disp;
  }

  public resolveDispatch(dispatchId: string): void {
    this.updateDispatchStatus(dispatchId, 'RESOLVED');
  }

  public createDispatchAssignment(
    incidentId: string, 
    _incidentTitle?: string, 
    _requiredCategory?: ResourceCategory
  ): DispatchAssignment | null {
    const incident = emergencyEngine.getIncidents().find(i => i.id === incidentId);
    if (!incident) return null;
    
    // Find best suited available resource
    const recommended = this.suggestResourcesForIncident(incident);
    const targetResource = recommended.length > 0 ? recommended[0].resource : this.resources.find(r => r.status === 'AVAILABLE');
    if (!targetResource) return null;

    return this.dispatchResourceToIncident(incident, targetResource.id);
  }

  public updateResourceStatus(resourceId: string, status: ResourceStatus, notes?: string): void {
    this.setResourceStatus(resourceId, status, notes);
  }

  public deleteResource(resourceId: string): void {
    this.removeResource(resourceId);
  }

  // ==========================================
  // OPERATIONS LOG & EXPORT
  // ==========================================

  public addLogEvent(event: Omit<OperationsLogEvent, 'id' | 'timestamp' | 'simulationTime'>): void {
    const now = new Date();
    const newEntry: OperationsLogEvent = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: now.toISOString(),
      simulationTime: now.toLocaleTimeString('en-IN', { hour12: false }),
      ...event,
    };
    this.operationsLog.unshift(newEntry);
    if (this.operationsLog.length > 200) this.operationsLog.pop();
  }

  public exportLogsAsJson(): string {
    return JSON.stringify({
      title: 'Godavari Pushkar Ghat Operations Log Audit',
      exportedAt: new Date().toISOString(),
      totalEvents: this.operationsLog.length,
      events: this.operationsLog,
    }, null, 2);
  }

  public exportLogsAsCsv(): string {
    const headers = ['ID', 'Simulation Time', 'Category', 'Severity', 'Title', 'Description'];
    const rows = this.operationsLog.map(l => [
      `"${l.id}"`,
      `"${l.simulationTime}"`,
      `"${l.category}"`,
      `"${l.severity}"`,
      `"${l.title.replace(/"/g, '""')}"`,
      `"${l.description.replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  public downloadLogsAsCsv(): void {
    const csv = this.exportLogsAsCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `operations_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  public downloadLogsAsJson(): void {
    const json = this.exportLogsAsJson();
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `operations_log_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ==========================================
  // SUBSCRIPTION & CLEANUP
  // ==========================================

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(fn => fn());
  }

  public destroy(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    this.listeners.clear();
  }
}

export const eventOperationsEngine = new EventOperationsEngine();
