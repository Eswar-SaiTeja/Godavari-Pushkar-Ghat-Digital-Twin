import { 
  DispatchAssignment, 
  DispatchStatus, 
  RecommendationScore, 
  RecommendationWeights, 
  ResourceCategory
} from '../types/operations';
import { 
  EmergencyIncident, 
  IncidentSeverity, 
  IncidentType 
} from '../types/emergency';
import { emergencyEngine } from './emergencyDetectionEngine';
import { eventOperationsEngine } from './eventOperationsEngine';
import { 
  createPushkarGhatPedestrianGraph, 
  createRajamahendravaramRoadGraph, 
  AStarGraph 
} from './pathfinding';
import { cesiumService } from './cesiumService';

class DispatchEngine {
  private dispatches: DispatchAssignment[] = [];
  private weights: RecommendationWeights = {
    distanceWeight: 0.35,
    categoryMatchWeight: 0.35,
    workloadWeight: 0.15,
    readinessWeight: 0.15,
    requireAdminConfirmation: true,
    allowEmergencyOverride: false,
  };
  private pedestrianGraph: AStarGraph;
  private roadGraph: AStarGraph;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.pedestrianGraph = createPushkarGhatPedestrianGraph();
    this.roadGraph = createRajamahendravaramRoadGraph();
    this.initializeBaselineDispatches();
  }

  private initializeBaselineDispatches(): void {
    // Generate an initial acknowledged baseline dispatch for demonstration
    const incidents = emergencyEngine.getIncidents();
    if (incidents.length > 0) {
      const activeInc = incidents.find(i => i.status === 'ACTIVE') || incidents[0];
      const resources = eventOperationsEngine.getResources();
      const readyPolice = resources.find(r => r.category === 'POLICE' && r.status === 'AVAILABLE') || resources[0];

      if (activeInc && readyPolice) {
        const dist = this.calculateHaversineDistance(
          { latitude: activeInc.coordinates[1], longitude: activeInc.coordinates[0] },
          readyPolice.coordinates
        );
        const arrivalMin = Number((dist / 120).toFixed(1));
        const nowIso = new Date().toISOString();
        const nowSim = new Date().toLocaleTimeString('en-IN', { hour12: false });

        const initialDispatch: DispatchAssignment = {
          id: `disp-base-${Date.now().toString(36)}`,
          incidentId: activeInc.id,
          incidentTitle: activeInc.title,
          incidentType: activeInc.type,
          incidentSeverity: activeInc.severity,
          incidentCoordinates: activeInc.coordinates,
          resourceId: readyPolice.id,
          resourceName: readyPolice.name,
          resourceCategory: readyPolice.category,
          status: 'ASSIGNED',
          assignedTimestamp: nowSim,
          distanceMeters: dist,
          estimatedArrivalMinutes: arrivalMin,
          routeCoordinates: [
            [readyPolice.coordinates.longitude, readyPolice.coordinates.latitude],
            [activeInc.coordinates[0], activeInc.coordinates[1]],
          ],
          notes: 'Standard sector safety deployment initiated by Central Command.',
          selectionReason: 'Rank #1 Recommendation: Direct category match with optimal proximity.',
          isStraightLineFallback: false,
          scoringBreakdown: {
            totalScore: 94,
            distanceScore: 92,
            categoryScore: 100,
            workloadScore: 100,
            readinessScore: 100,
          },
          auditHistory: [
            {
              id: `audit-1-${Date.now()}`,
              fromStatus: 'REPORTED',
              toStatus: 'ACKNOWLEDGED',
              timestamp: nowIso,
              simulationTime: nowSim,
              actor: 'Automated Event Surveillance',
              notes: 'Incident telemetry verified by sector CCTV.',
            },
            {
              id: `audit-2-${Date.now()}`,
              fromStatus: 'ACKNOWLEDGED',
              toStatus: 'ASSIGNED',
              timestamp: nowIso,
              simulationTime: nowSim,
              actor: 'Watch Commander',
              notes: `Assigned closest patrol team: ${readyPolice.name}`,
            }
          ]
        };

        this.dispatches.push(initialDispatch);
      }
    }
  }

  // ==========================================
  // CONFIGURATION & WEIGHT TUNING
  // ==========================================

  public getWeights(): RecommendationWeights {
    return { ...this.weights };
  }

  public updateWeights(newWeights: Partial<RecommendationWeights>): void {
    this.weights = { ...this.weights, ...newWeights };
    this.notifyListeners();
  }

  // ==========================================
  // INCIDENT INTEGRATION & CREATION
  // ==========================================

  public getAllIncidents(): EmergencyIncident[] {
    const rawIncidents = emergencyEngine.getIncidents();
    const zones = eventOperationsEngine.getZones();

    return rawIncidents.map((inc) => {
      // Find matching sector if not set
      let zoneId = inc.affectedZoneId;
      if (!zoneId) {
        const matchedZone = zones.find((z) => {
          const dLat = Math.abs(inc.coordinates[1] - z.center.latitude);
          const dLon = Math.abs(inc.coordinates[0] - z.center.longitude);
          return dLat < 0.006 && dLon < 0.006;
        });
        zoneId = matchedZone?.id || 'zone-pushkar-ghat';
      }

      // Check assigned resources
      const assigned = this.dispatches
        .filter(d => d.incidentId === inc.id && d.status !== 'RESOLVED' && d.status !== 'CANCELLED')
        .map(d => d.resourceId);

      return {
        ...inc,
        affectedZoneId: zoneId,
        assignedResourceIds: assigned,
        reportedTimestamp: inc.timestamp || new Date().toISOString(),
      };
    });
  }

  public getIncidentById(id: string): EmergencyIncident | undefined {
    return this.getAllIncidents().find(i => i.id === id);
  }

  public createCustomIncident(data: {
    type: IncidentType;
    title: string;
    severity: IncidentSeverity;
    coordinates: [number, number, number];
    affectedZoneId?: string;
    description: string;
    affectedPopulation?: number;
  }): EmergencyIncident {
    const nowIso = new Date().toISOString();
    const zones = eventOperationsEngine.getZones();
    const zoneId = data.affectedZoneId || zones.find(z => {
      const dLat = Math.abs(data.coordinates[1] - z.center.latitude);
      const dLon = Math.abs(data.coordinates[0] - z.center.longitude);
      return dLat < 0.006 && dLon < 0.006;
    })?.id || 'zone-pushkar-ghat';

    const newInc: EmergencyIncident = {
      id: `inc-admin-${Date.now().toString(36)}`,
      type: data.type,
      title: data.title,
      severity: data.severity,
      coordinates: data.coordinates,
      timestamp: nowIso,
      reportedTimestamp: nowIso,
      affectedPopulation: data.affectedPopulation || 150,
      status: 'ACTIVE',
      description: data.description,
      affectedZoneId: zoneId,
      assignedResourceIds: [],
    };

    // Push into emergency detection engine
    emergencyEngine.addCustomIncident(newInc);

    // Update blockages if route/vehicle obstruction
    if (data.type === 'ROUTE_BLOCKED' || data.type === 'VEHICLE_OBSTRUCTION') {
      this.updateBlockedRoadsFromIncidents();
    }

    eventOperationsEngine.addLogEvent({
      category: 'INCIDENT',
      title: `Emergency Logged: ${newInc.title}`,
      description: `Sector: ${zoneId} • Severity: ${data.severity} • ${data.description}`,
      severity: data.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
      relatedId: newInc.id,
      isSimulated: true,
    });

    this.notifyListeners();
    return newInc;
  }

  // ==========================================
  // DISTANCE & A* ROUTE CALCULATION
  // ==========================================

  public calculateHaversineDistance(
    coord1: { latitude: number; longitude: number },
    coord2: { latitude: number; longitude: number }
  ): number {
    const R = 6371e3; // meters
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

  private updateBlockedRoadsFromIncidents(): void {
    const incidents = emergencyEngine.getIncidents().filter(i => i.status !== 'RESOLVED');
    this.roadGraph.resetAllBlockages();
    this.pedestrianGraph.resetAllBlockages();

    incidents.forEach((inc) => {
      if (inc.blockedEdge) {
        this.roadGraph.setEdgeBlocked(inc.blockedEdge.fromNodeId, inc.blockedEdge.toNodeId, true);
        this.pedestrianGraph.setEdgeBlocked(inc.blockedEdge.fromNodeId, inc.blockedEdge.toNodeId, true);
      }
    });
  }

  /**
   * Calculates an A* path through the pedestrian/road network avoiding blocked edges.
   * If off-grid, provides a labeled straight-line distance fallback.
   */
  public calculateRoute(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    isVehicle: boolean = false
  ): { path: [number, number][]; distanceMeters: number; isStraightLine: boolean } {
    const graph = isVehicle ? this.roadGraph : this.pedestrianGraph;
    const nodes = Array.from(graph.nodes.values());

    if (nodes.length === 0) {
      const dist = this.calculateHaversineDistance(origin, destination);
      return {
        path: [[origin.longitude, origin.latitude], [destination.longitude, destination.latitude]],
        distanceMeters: dist,
        isStraightLine: true,
      };
    }

    // Find nearest start node
    let nearestStart = nodes[0];
    let minStartDist = Infinity;
    nodes.forEach(n => {
      const d = this.calculateHaversineDistance(origin, { latitude: n.coordinates[1], longitude: n.coordinates[0] });
      if (d < minStartDist) {
        minStartDist = d;
        nearestStart = n;
      }
    });

    // Find nearest end node
    let nearestEnd = nodes[0];
    let minEndDist = Infinity;
    nodes.forEach(n => {
      const d = this.calculateHaversineDistance(destination, { latitude: n.coordinates[1], longitude: n.coordinates[0] });
      if (d < minEndDist) {
        minEndDist = d;
        nearestEnd = n;
      }
    });

    // If within reasonable graph proximity (< 1500m to network)
    if (minStartDist < 1500 && minEndDist < 1500) {
      const astarPath = graph.findPath(nearestStart.id, nearestEnd.id);
      if (astarPath.length > 0) {
        const fullPath: [number, number][] = [
          [origin.longitude, origin.latitude],
          ...astarPath,
          [destination.longitude, destination.latitude],
        ];

        let totalDist = 0;
        for (let i = 0; i < fullPath.length - 1; i++) {
          totalDist += this.calculateHaversineDistance(
            { latitude: fullPath[i][1], longitude: fullPath[i][0] },
            { latitude: fullPath[i + 1][1], longitude: fullPath[i + 1][0] }
          );
        }

        return {
          path: fullPath,
          distanceMeters: Math.round(totalDist),
          isStraightLine: false,
        };
      }
    }

    // Straight-line fallback
    const directDist = this.calculateHaversineDistance(origin, destination);
    return {
      path: [
        [origin.longitude, origin.latitude],
        [destination.longitude, destination.latitude],
      ],
      distanceMeters: directDist,
      isStraightLine: true,
    };
  }

  // ==========================================
  // INTELLIGENT RESOURCE RECOMMENDATION SCORING
  // ==========================================

  public getRecommendationsForIncident(incidentId: string): RecommendationScore[] {
    const inc = this.getAllIncidents().find(i => i.id === incidentId);
    if (!inc) return [];
    return this.getRecommendedResourcesForIncident(inc);
  }

  public getRecommendedResourcesForIncident(incident: EmergencyIncident): RecommendationScore[] {
    const resources = eventOperationsEngine.getResources();
    const incCoord = { latitude: incident.coordinates[1], longitude: incident.coordinates[0] };

    // Preferred categories based on incident category
    const categoryMapping: Record<IncidentType, { primary: ResourceCategory[]; secondary: ResourceCategory[] }> = {
      MEDICAL_EMERGENCY: {
        primary: ['MEDICAL', 'AMBULANCE', 'FIRST_AID'],
        secondary: ['VOLUNTEER', 'POLICE'],
      },
      FIRE_HAZARD: {
        primary: ['FIRE_RESCUE'],
        secondary: ['EMERGENCY_VEHICLE', 'POLICE', 'AMBULANCE'],
      },
      FLOOD_SURGE: {
        primary: ['FIRE_RESCUE', 'POLICE'],
        secondary: ['MEDICAL', 'EMERGENCY_VEHICLE'],
      },
      CROWD_CRUSH: {
        primary: ['POLICE', 'AMBULANCE', 'MEDICAL'],
        secondary: ['VOLUNTEER', 'FIRST_AID'],
      },
      GATE_CONGESTION: {
        primary: ['POLICE', 'VOLUNTEER'],
        secondary: ['FIRST_AID'],
      },
      STEP_BOTTLENECK: {
        primary: ['POLICE', 'VOLUNTEER'],
        secondary: ['FIRST_AID', 'MEDICAL'],
      },
      ROUTE_BLOCKED: {
        primary: ['POLICE', 'EMERGENCY_VEHICLE'],
        secondary: ['FIRE_RESCUE'],
      },
      VEHICLE_OBSTRUCTION: {
        primary: ['POLICE', 'EMERGENCY_VEHICLE'],
        secondary: ['FIRE_RESCUE'],
      },
      ADMIN_INCIDENT: {
        primary: ['POLICE', 'MEDICAL', 'FIRE_RESCUE', 'AMBULANCE'],
        secondary: ['VOLUNTEER', 'FIRST_AID', 'EMERGENCY_VEHICLE'],
      },
    };

    const mapping = categoryMapping[incident.type] || categoryMapping.ADMIN_INCIDENT;

    const scoredList: RecommendationScore[] = resources.map((res) => {
      // 1. Distance & Route
      const isVehicle = res.category === 'AMBULANCE' || res.category === 'FIRE_RESCUE' || res.category === 'EMERGENCY_VEHICLE';
      const routeInfo = this.calculateRoute(res.coordinates, incCoord, isVehicle);

      // Distance score: 100 at 0m, drops to 0 at 3000m
      const distanceScore = Math.max(0, Math.min(100, Math.round(100 - (routeInfo.distanceMeters / 30))));

      // Speed assumption: Vehicles 350 m/min (~21 km/h in festival traffic), Foot patrol 85 m/min (~5.1 km/h)
      const speedMpm = isVehicle ? 350 : 85;
      const travelEtaMin = Number(Math.max(1, (routeInfo.distanceMeters / speedMpm)).toFixed(1));

      // 2. Category Match Score
      let categoryScore = 15;
      if (mapping.primary.includes(res.category)) categoryScore = 100;
      else if (mapping.secondary.includes(res.category)) categoryScore = 65;

      // 3. Workload Score
      const activeTasks = this.dispatches.filter(
        d => d.resourceId === res.id && d.status !== 'RESOLVED' && d.status !== 'CANCELLED'
      ).length;
      let workloadScore = 100;
      if (activeTasks === 1) workloadScore = 55;
      else if (activeTasks >= 2) workloadScore = 15;

      // 4. Readiness Score
      let readinessScore = 0;
      if (res.status === 'AVAILABLE') readinessScore = 100;
      else if (res.status === 'BUSY' && this.weights.allowEmergencyOverride) readinessScore = 40;
      else if (res.status === 'DEPLOYED' && this.weights.allowEmergencyOverride) readinessScore = 20;

      // Weighted Total Score
      const totalScore = Math.round(
        distanceScore * this.weights.distanceWeight +
        categoryScore * this.weights.categoryMatchWeight +
        workloadScore * this.weights.workloadWeight +
        readinessScore * this.weights.readinessWeight
      );

      // Reasoning
      const reasons: string[] = [];
      if (mapping.primary.includes(res.category)) reasons.push(`Specialized ${res.category.replace('_', ' ')} unit`);
      else if (mapping.secondary.includes(res.category)) reasons.push(`Supportive ${res.category.replace('_', ' ')} unit`);

      reasons.push(`${routeInfo.distanceMeters}m (${travelEtaMin}m ETA) via ${routeInfo.isStraightLine ? 'direct vector' : 'pedestrian corridor'}`);
      if (activeTasks === 0) reasons.push('Zero active task backlog');
      else reasons.push(`${activeTasks} ongoing task`);

      return {
        resource: res,
        totalScore,
        distanceScore,
        categoryScore,
        workloadScore,
        readinessScore,
        distanceMeters: routeInfo.distanceMeters,
        estimatedArrivalMinutes: travelEtaMin,
        isRecommended: false,
        selectionReason: reasons.join(' • '),
        routeCoordinates: routeInfo.path,
        isStraightLineFallback: routeInfo.isStraightLine,
      };
    });

    // Sort descending by score
    scoredList.sort((a, b) => b.totalScore - a.totalScore);
    if (scoredList.length > 0 && scoredList[0].totalScore > 20) {
      scoredList[0].isRecommended = true;
    }

    return scoredList;
  }

  // ==========================================
  // DISPATCH WORKFLOW LIFECYCLE
  // ==========================================

  public getDispatches(): DispatchAssignment[] {
    return [...this.dispatches];
  }

  public getDispatchById(id: string): DispatchAssignment | undefined {
    return this.dispatches.find(d => d.id === id);
  }

  /**
   * Transition 1: Acknowledge reported incident
   */
  public acknowledgeIncident(incidentId: string, actor: string = 'Watch Commander', notes: string = ''): void {
    const inc = emergencyEngine.getIncidents().find(i => i.id === incidentId);
    if (!inc) return;

    emergencyEngine.acknowledgeIncident(incidentId);

    // Update any existing draft dispatches
    const disp = this.dispatches.find(d => d.incidentId === incidentId);
    if (disp && disp.status === 'REPORTED') {
      this.transitionDispatchStatus(disp.id, 'ACKNOWLEDGED', actor, notes || 'Incident confirmed by surveillance.');
    }

    this.notifyListeners();
  }

  /**
   * Transition 2: Assign resource to incident
   */
  public assignResource(
    incidentId: string,
    resourceId: string,
    actor: string = 'Watch Commander',
    notes: string = '',
    overrideUnavailable: boolean = false
  ): DispatchAssignment | null {
    const incident = emergencyEngine.getIncidents().find(i => i.id === incidentId);
    const resource = eventOperationsEngine.getResourceById(resourceId);
    if (!incident || !resource) return null;

    // Check availability
    if (resource.status !== 'AVAILABLE' && !overrideUnavailable && !this.weights.allowEmergencyOverride) {
      console.warn(`[DispatchEngine] Resource ${resource.name} is currently ${resource.status}. Assignment rejected.`);
      return null;
    }

    // Check if incident already has an active dispatch
    let disp = this.dispatches.find(d => d.incidentId === incidentId && d.status !== 'RESOLVED' && d.status !== 'CANCELLED');

    const recommendation = this.getRecommendedResourcesForIncident(incident).find(r => r.resource.id === resourceId);
    const nowIso = new Date().toISOString();
    const nowSim = new Date().toLocaleTimeString('en-IN', { hour12: false });

    if (!disp) {
      disp = {
        id: `disp-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
        incidentId: incident.id,
        incidentTitle: incident.title,
        incidentType: incident.type,
        incidentSeverity: incident.severity,
        incidentCoordinates: incident.coordinates,
        resourceId: resource.id,
        resourceName: resource.name,
        resourceCategory: resource.category,
        status: 'ASSIGNED',
        assignedTimestamp: nowSim,
        distanceMeters: recommendation?.distanceMeters || 450,
        estimatedArrivalMinutes: recommendation?.estimatedArrivalMinutes || 3.5,
        routeCoordinates: recommendation?.routeCoordinates || [
          [resource.coordinates.longitude, resource.coordinates.latitude],
          [incident.coordinates[0], incident.coordinates[1]]
        ],
        notes: notes || `Assigned to ${incident.title}`,
        selectionReason: recommendation?.selectionReason || 'Manual administrator assignment',
        isStraightLineFallback: recommendation?.isStraightLineFallback || false,
        scoringBreakdown: recommendation ? {
          totalScore: recommendation.totalScore,
          distanceScore: recommendation.distanceScore,
          categoryScore: recommendation.categoryScore,
          workloadScore: recommendation.workloadScore,
          readinessScore: recommendation.readinessScore,
        } : undefined,
        auditHistory: [
          {
            id: `audit-${Date.now()}-1`,
            fromStatus: 'REPORTED',
            toStatus: 'ASSIGNED',
            timestamp: nowIso,
            simulationTime: nowSim,
            actor,
            notes: notes || `Direct unit assignment authorized ${overrideUnavailable ? '(OVERRIDE ACTIVE)' : ''}`,
          }
        ]
      };
      this.dispatches.unshift(disp);
    } else {
      // Reassign to new resource
      const prevResource = eventOperationsEngine.getResourceById(disp.resourceId);
      if (prevResource && prevResource.status === 'DEPLOYED') {
        eventOperationsEngine.setResourceStatus(prevResource.id, 'AVAILABLE', 'Reassigned to alternative unit');
      }

      disp.resourceId = resource.id;
      disp.resourceName = resource.name;
      disp.resourceCategory = resource.category;
      disp.distanceMeters = recommendation?.distanceMeters || disp.distanceMeters;
      disp.estimatedArrivalMinutes = recommendation?.estimatedArrivalMinutes || disp.estimatedArrivalMinutes;
      disp.routeCoordinates = recommendation?.routeCoordinates || disp.routeCoordinates;
      disp.status = 'ASSIGNED';
      disp.notes = notes || `Reassigned from ${prevResource?.name || 'previous unit'} to ${resource.name}`;

      disp.auditHistory.push({
        id: `audit-${Date.now()}-reassign`,
        fromStatus: disp.status,
        toStatus: 'ASSIGNED',
        timestamp: nowIso,
        simulationTime: nowSim,
        actor,
        notes: `Resource reassigned to ${resource.name}`,
      });
    }

    // Set resource state
    eventOperationsEngine.setResourceStatus(resource.id, 'BUSY', `Assigned to incident #${incident.id.slice(-4)}`);

    cesiumService.renderDispatchRoute(disp);
    this.notifyListeners();
    return disp;
  }

  /**
   * Transition 3: Mobilize and dispatch resource
   */
  public dispatchResource(dispatchId: string, actor: string = 'Watch Commander', notes: string = ''): void {
    const disp = this.dispatches.find(d => d.id === dispatchId);
    if (!disp) return;

    this.transitionDispatchStatus(dispatchId, 'DISPATCHED', actor, notes || 'Team en-route with siren active.');
    disp.dispatchedTimestamp = new Date().toLocaleTimeString('en-IN', { hour12: false });

    // Mark resource deployed
    eventOperationsEngine.setResourceStatus(disp.resourceId, 'DEPLOYED', `En route to ${disp.incidentTitle}`);
    cesiumService.renderDispatchRoute(disp);
    this.notifyListeners();
  }

  /**
   * Transition 4: Mark resource on scene
   */
  public markOnScene(dispatchId: string, actor: string = 'Field Lead', notes: string = ''): void {
    const disp = this.dispatches.find(d => d.id === dispatchId);
    if (!disp) return;

    this.transitionDispatchStatus(dispatchId, 'ON_SCENE', actor, notes || 'Arrived on scene; initiating crowd dispersal.');
    disp.onSceneTimestamp = new Date().toLocaleTimeString('en-IN', { hour12: false });

    eventOperationsEngine.setResourceStatus(disp.resourceId, 'BUSY', `Active on-scene at ${disp.incidentTitle}`);
    this.notifyListeners();
  }

  /**
   * Transition 5: Resolve incident and demobilize resource
   */
  public resolveDispatch(dispatchId: string, actor: string = 'Incident Commander', notes: string = ''): void {
    const disp = this.dispatches.find(d => d.id === dispatchId);
    if (!disp) return;

    this.transitionDispatchStatus(dispatchId, 'RESOLVED', actor, notes || 'Incident safely contained and resolved.');
    disp.resolvedTimestamp = new Date().toLocaleTimeString('en-IN', { hour12: false });

    // Release resource
    eventOperationsEngine.setResourceStatus(disp.resourceId, 'AVAILABLE', 'Mission resolved; ready for tasking');

    // Resolve in emergency engine
    emergencyEngine.resolveIncident(disp.incidentId);

    cesiumService.clearDispatchRoute(dispatchId);
    this.notifyListeners();
  }

  /**
   * Transition 6: Cancel dispatch with audit record
   */
  public cancelDispatch(dispatchId: string, actor: string = 'Watch Commander', reason: string = 'False alarm or redundant dispatch'): void {
    const disp = this.dispatches.find(d => d.id === dispatchId);
    if (!disp) return;

    this.transitionDispatchStatus(dispatchId, 'CANCELLED', actor, `Dispatch cancelled: ${reason}`);

    // Release resource
    eventOperationsEngine.setResourceStatus(disp.resourceId, 'AVAILABLE', 'Dispatch cancelled; returned to post');

    cesiumService.clearDispatchRoute(dispatchId);
    this.notifyListeners();
  }

  public updateDispatchStatus(dispatchId: string, newStatus: DispatchStatus, actor: string = 'Command Center', notes?: string): boolean {
    const disp = this.dispatches.find(d => d.id === dispatchId);
    if (!disp) return false;

    if (newStatus === 'DISPATCHED') {
      this.dispatchResource(dispatchId, actor, notes);
      return true;
    } else if (newStatus === 'ON_SCENE') {
      this.markOnScene(dispatchId, actor, notes);
      return true;
    } else if (newStatus === 'RESOLVED') {
      this.resolveDispatch(dispatchId, actor, notes);
      return true;
    } else if (newStatus === 'CANCELLED') {
      this.cancelDispatch(dispatchId, actor, notes || 'Cancelled');
      return true;
    } else {
      this.transitionDispatchStatus(dispatchId, newStatus, actor, notes || `Status changed to ${newStatus}`);
      this.notifyListeners();
      return true;
    }
  }

  /**
   * Helper to execute and record a status transition
   */
  private transitionDispatchStatus(
    dispatchId: string,
    newStatus: DispatchStatus,
    actor: string,
    notes: string
  ): void {
    const disp = this.dispatches.find(d => d.id === dispatchId);
    if (!disp) return;

    const prevStatus = disp.status;
    disp.status = newStatus;

    const nowIso = new Date().toISOString();
    const nowSim = new Date().toLocaleTimeString('en-IN', { hour12: false });

    disp.auditHistory.push({
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      fromStatus: prevStatus,
      toStatus: newStatus,
      timestamp: nowIso,
      simulationTime: nowSim,
      actor,
      notes,
    });

    eventOperationsEngine.addLogEvent({
      category: 'DISPATCH',
      title: `Dispatch Transition: ${disp.resourceName}`,
      description: `${prevStatus} ➔ ${newStatus} • Note: ${notes}`,
      severity: newStatus === 'RESOLVED' ? 'SUCCESS' : newStatus === 'CANCELLED' ? 'WARNING' : 'INFO',
      relatedId: disp.id,
      isSimulated: true,
    });
  }

  // ==========================================
  // SUBSCRIPTIONS
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
}

export const dispatchEngine = new DispatchEngine();
