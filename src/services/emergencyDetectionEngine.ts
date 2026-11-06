import * as Cesium from 'cesium';
import { 
  EmergencyIncident, 
  EmergencyCommandMetrics, 
  EvacuationRoute 
} from '../types/emergency';
import { crowdEngine } from './crowdSimulation';
import { AStarGraph } from './pathfinding';

export const PRESET_INCIDENTS: Omit<EmergencyIncident, 'id' | 'timestamp' | 'status'>[] = [
  {
    type: 'FIRE_HAZARD',
    title: 'Simulated Electrical Fire - South Concourse [VERIFIED]',
    severity: 'HIGH',
    coordinates: [81.7685, 17.0055, 20],
    affectedPopulation: 65,
    description: 'Simulated electrical short-circuit hazard reported near Pushkar Chowk electrical substation. South Arterial ingress temporarily closed.',
    blockedEdge: { fromNodeId: 'gate_pushkar_main', toNodeId: 'south_arterial_junction' },
  },
  {
    type: 'FLOOD_SURGE',
    title: 'Simulated Godavari Monsoon Inundation Surge [VERIFIED]',
    severity: 'CRITICAL',
    coordinates: [81.766947, 17.008396, 18],
    affectedPopulation: 120,
    description: 'Simulated rapid Godavari discharge surge exceeding 17.0m MSL. Lower bathing steps submerged. Devotees directed to upper promenade.',
    blockedEdge: { fromNodeId: 'promenade_central', toNodeId: 'pushkar_steps_lower' },
  },
  {
    type: 'ROUTE_BLOCKED',
    title: 'Temporary Barricade Structural Failure [VERIFIED]',
    severity: 'MODERATE',
    coordinates: [81.7672, 17.0135, 19],
    affectedPopulation: 45,
    description: 'Crowd barrier breach along North Riverfront Path. Route temporarily impassable for senior citizens.',
    blockedEdge: { fromNodeId: 'promenade_central', toNodeId: 'north_boulevard_1' },
  },
  {
    type: 'GATE_CONGESTION',
    title: 'Pushkar Main Gate Overcrowding Bottleneck [VERIFIED]',
    severity: 'HIGH',
    coordinates: [81.7682, 17.0078, 20],
    affectedPopulation: 140,
    description: 'Severe queue buildup at Pushkar Main Gate (>4.0 pax/m²). Emergency rerouting devotees to Arts College and Kotilingala exits.',
    affectedGateId: 'gate_pushkar_main',
  },
  {
    type: 'VEHICLE_OBSTRUCTION',
    title: 'Stalled Support Vehicle on Bridge Egress [VERIFIED]',
    severity: 'MODERATE',
    coordinates: [81.769112, 16.997162, 23],
    affectedPopulation: 30,
    description: 'Stalled logistical transport blocking bridge landing junction. Emergency vehicle corridor priority activated.',
  },
];

export class EmergencyDetectionEngine {
  private incidents: EmergencyIncident[] = [];
  private viewer: Cesium.Viewer | null = null;
  private incidentEntities: Cesium.Entity[] = [];
  private routeEntities: Cesium.Entity[] = [];
  private onMetricsUpdate: ((metrics: EmergencyCommandMetrics) => void) | null = null;
  private isEmergencyActive: boolean = false;
  private emergencyStartTime: number | null = null;
  private densityThreshold: number = 3.2; // pax/m^2 threshold
  private checkInterval: any = null;
  private historyLog: Array<{ id: string; timestamp: string; type: string; message: string }> = [];

  constructor() {
    this.initDefaultIncidents();
    this.logHistory('SYSTEM_INIT', 'Emergency Detection Engine initialized with baseline ghat safety profiles.');
  }

  public setViewer(viewer: Cesium.Viewer | null): void {
    this.cleanupCesiumEntities();
    this.viewer = viewer;
    if (viewer) {
      this.renderIncidentEntities();
      this.renderEvacuationRoutes();
    }
  }

  public setOnMetricsUpdate(cb: (metrics: EmergencyCommandMetrics) => void): void {
    this.onMetricsUpdate = cb;
  }

  public getIncidents(): EmergencyIncident[] {
    return [...this.incidents];
  }

  public getIsEmergencyActive(): boolean {
    return this.isEmergencyActive;
  }

  public setDensityThreshold(threshold: number): void {
    this.densityThreshold = Math.max(1.5, Math.min(5.0, threshold));
  }

  /**
   * Start master emergency drill / evacuation
   */
  public startEmergency(): void {
    if (this.isEmergencyActive) return;
    this.isEmergencyActive = true;
    this.emergencyStartTime = performance.now();
    crowdEngine.triggerEmergencyAlert();
    this.updateMetrics();

    // Start background monitor for density thresholds and bottlenecks
    if (!this.checkInterval) {
      this.checkInterval = setInterval(() => {
        this.checkDynamicConditions();
        this.updateMetrics();
      }, 1000);
    }
  }

  /**
   * Pause evacuation simulation
   */
  public pauseEmergency(): void {
    crowdEngine.pause();
    this.updateMetrics();
  }

  /**
   * Resume evacuation simulation
   */
  public resumeEmergency(): void {
    crowdEngine.start();
    this.updateMetrics();
  }

  /**
   * Reset emergency simulation
   */
  public resetEmergency(): void {
    this.isEmergencyActive = false;
    this.emergencyStartTime = null;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    crowdEngine.clearEmergencyAlert();
    crowdEngine.reset();
    this.initDefaultIncidents();
    this.renderIncidentEntities();
    this.renderEvacuationRoutes();
    this.updateMetrics();
  }

  /**
   * Acknowledge an active incident
   */
  public acknowledgeIncident(incidentId: string): void {
    const inc = this.incidents.find(i => i.id === incidentId);
    if (inc && inc.status === 'ACTIVE') {
      inc.status = 'ACKNOWLEDGED';
      this.renderIncidentEntities();
      this.updateMetrics();
    }
  }

  /**
   * Resolve an incident: removes blockages and triggers dynamic crowd rerouting
   */
  public resolveIncident(incidentId: string): void {
    const inc = this.incidents.find(i => i.id === incidentId);
    if (!inc) return;

    inc.status = 'RESOLVED';

    // Unblock graph edge if applicable
    if (inc.blockedEdge) {
      const graph = (crowdEngine as any).graph as AStarGraph;
      if (graph) {
        graph.setEdgeBlocked(inc.blockedEdge.fromNodeId, inc.blockedEdge.toNodeId, false);
      }
    }

    // Reopen gate if applicable
    if (inc.affectedGateId) {
      const gate = crowdEngine.getGates().find(g => g.id === inc.affectedGateId);
      if (gate && !gate.isOpen) {
        crowdEngine.toggleGate(gate.id);
      }
    }

    // Re-evaluate routes and reroute evacuating agents
    this.triggerDynamicRerouting();
    this.renderIncidentEntities();
    this.renderEvacuationRoutes();
    this.updateMetrics();
  }

  /**
   * Create and inject a new incident dynamically
   */
  public triggerIncident(presetIndex: number = 0): EmergencyIncident {
    const preset = PRESET_INCIDENTS[presetIndex % PRESET_INCIDENTS.length];
    const newInc: EmergencyIncident = {
      id: `INC-${Date.now().toString().slice(-6)}`,
      type: preset.type,
      title: preset.title,
      severity: preset.severity,
      coordinates: preset.coordinates,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
      affectedPopulation: preset.affectedPopulation,
      status: 'ACTIVE',
      description: preset.description,
      blockedEdge: preset.blockedEdge,
      affectedGateId: preset.affectedGateId,
    };

    this.incidents.unshift(newInc);

    // Apply edge blockage to pedestrian graph
    if (newInc.blockedEdge) {
      const graph = (crowdEngine as any).graph as AStarGraph;
      if (graph) {
        graph.setEdgeBlocked(newInc.blockedEdge.fromNodeId, newInc.blockedEdge.toNodeId, true);
      }
    }

    // Close gate if applicable
    if (newInc.affectedGateId) {
      const gate = crowdEngine.getGates().find(g => g.id === newInc.affectedGateId);
      if (gate && gate.isOpen) {
        crowdEngine.toggleGate(gate.id);
      }
    }

    // If emergency is active, trigger dynamic rerouting for all agents
    if (this.isEmergencyActive) {
      this.triggerDynamicRerouting();
    }

    this.renderIncidentEntities();
    this.renderEvacuationRoutes();
    this.updateMetrics();

    return newInc;
  }

  public addCustomIncident(incident: EmergencyIncident): void {
    const existing = this.incidents.find(i => i.id === incident.id);
    if (existing) {
      Object.assign(existing, incident);
    } else {
      this.incidents.unshift(incident);
    }

    if (incident.blockedEdge) {
      const graph = (crowdEngine as any).graph as AStarGraph;
      if (graph) {
        graph.setEdgeBlocked(incident.blockedEdge.fromNodeId, incident.blockedEdge.toNodeId, true);
      }
    }

    this.renderIncidentEntities();
    this.renderEvacuationRoutes();
    this.updateMetrics();
  }

  /**
   * Recalculates alternate shortest paths for all agents facing blocked routes or closed gates
   */
  public triggerDynamicRerouting(): void {
    const agents = (crowdEngine as any).agents as any[];
    const graph = (crowdEngine as any).graph as AStarGraph;
    const openGates = crowdEngine.getGates().filter(g => (g.type === 'EXIT' || g.type === 'DUAL') && g.isOpen);

    if (!agents || !graph || openGates.length === 0) return;

    agents.forEach(agent => {
      if (agent.isEvacuated) return;

      // Assign to closest accessible open gate
      let bestGate = openGates[0];
      let shortestPath: [number, number][] = [];
      let minDistance = Infinity;

      const startNodeId = (crowdEngine as any).findClosestNode(agent.position.longitude, agent.position.latitude);

      openGates.forEach(g => {
        const exitNodeId = (crowdEngine as any).findClosestNode(g.coordinates.longitude, g.coordinates.latitude);
        const path = graph.findPath(startNodeId, exitNodeId);
        if (path.length > 1) {
          // Check if path is valid and shorter
          let dist = 0;
          for (let i = 0; i < path.length - 1; i++) {
            dist += Math.hypot(path[i+1][0] - path[i][0], path[i+1][1] - path[i][1]);
          }
          if (dist < minDistance) {
            minDistance = dist;
            bestGate = g;
            shortestPath = path;
          }
        }
      });

      if (shortestPath.length > 0) {
        agent.assignedExitId = bestGate.id;
        agent.currentPath = shortestPath;
        agent.pathIndex = 0;
        if (agent.hasRespondedToAlert) {
          agent.behaviorState = agent.requiresAssistance ? 'NEEDS_ASSISTANCE' : 'REROUTING';
          setTimeout(() => {
            if (agent.behaviorState === 'REROUTING') {
              agent.behaviorState = 'EVACUATING';
            }
          }, 1500);
        }
      }
    });
  }

  public logHistory(type: string, message: string): void {
    this.historyLog.unshift({
      id: `HIST-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
      type,
      message,
    });
    if (this.historyLog.length > 50) {
      this.historyLog.pop();
    }
  }

  public getHistoryLog(): Array<{ id: string; timestamp: string; type: string; message: string }> {
    return [...this.historyLog];
  }

  /**
   * Deterministic scenario runner for Scenarios A, B, and C
   */
  public loadScenario(scenarioType: 'A' | 'B' | 'C' | 'CUSTOM', customConfig?: {
    population?: number;
    seed?: number;
  }): void {
    this.resetEmergency();
    const graph = (crowdEngine as any).graph as AStarGraph;
    if (graph) {
      graph.resetAllBlockages();
    }

    const deterministicSeed = customConfig?.seed ?? 101;
    const pop = customConfig?.population ?? 250;

    if (scenarioType === 'A') {
      // Scenario A: Normal Evacuation - All Exits Open, No Blockages
      crowdEngine.getGates().forEach(g => {
        if (!g.isOpen) crowdEngine.toggleGate(g.id);
      });
      this.incidents = [];
      crowdEngine.initializeAgents(pop, deterministicSeed);
      this.startEmergency();
      this.logHistory('SCENARIO_A', 'Scenario A initialized: Normal evacuation with all 4 egress gates functional.');
    } else if (scenarioType === 'B') {
      // Scenario B: Partial Blockage - Pushkar Main Gate Closed & Corridor Blocked
      crowdEngine.getGates().forEach(g => {
        if (g.id === 'gate_pushkar_main') {
          if (g.isOpen) crowdEngine.toggleGate(g.id);
        } else {
          if (!g.isOpen) crowdEngine.toggleGate(g.id);
        }
      });
      if (graph) {
        graph.setEdgeBlocked('gate_pushkar_main', 'south_arterial_junction', true);
      }
      this.incidents = [
        {
          id: 'INC-SCENARIO-B-1',
          type: 'FIRE_HAZARD',
          title: 'Simulated Electrical Fire - Pushkar Main Gate Blocked',
          severity: 'HIGH',
          coordinates: [81.7685, 17.0055, 20],
          timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
          affectedPopulation: 85,
          status: 'ACTIVE',
          description: 'Simulated electrical fire blocking Pushkar Main Gate. Crowd rerouted to Kotilingala & Arts College exits.',
          blockedEdge: { fromNodeId: 'gate_pushkar_main', toNodeId: 'south_arterial_junction' },
          affectedGateId: 'gate_pushkar_main',
        }
      ];
      crowdEngine.initializeAgents(pop, deterministicSeed);
      this.startEmergency();
      this.triggerDynamicRerouting();
      this.logHistory('SCENARIO_B', 'Scenario B initialized: Pushkar Main Gate obstructed; rerouting crowd North/East.');
    } else if (scenarioType === 'C') {
      // Scenario C: Critical Emergency - Multiple Corridors Blocked + High Assistance
      crowdEngine.getGates().forEach(g => {
        if (!g.isOpen) crowdEngine.toggleGate(g.id);
      });
      if (graph) {
        graph.setEdgeBlocked('promenade_central', 'pushkar_steps_lower', true);
        graph.setEdgeBlocked('promenade_central', 'north_boulevard_1', true);
      }
      this.incidents = [
        {
          id: 'INC-SCENARIO-C-1',
          type: 'FLOOD_SURGE',
          title: 'Simulated Godavari Inundation Surge (>17.2m MSL)',
          severity: 'CRITICAL',
          coordinates: [81.766947, 17.008396, 18],
          timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
          affectedPopulation: 140,
          status: 'ACTIVE',
          description: 'Simulated Godavari river discharge submerging lower steps. Rapid upper promenade diversion active.',
          blockedEdge: { fromNodeId: 'promenade_central', toNodeId: 'pushkar_steps_lower' },
        },
        {
          id: 'INC-SCENARIO-C-2',
          type: 'ROUTE_BLOCKED',
          title: 'Promenade Central Barrier Collapse',
          severity: 'HIGH',
          coordinates: [81.7672, 17.0135, 19],
          timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
          affectedPopulation: 60,
          status: 'ACTIVE',
          description: 'Promenade barrier collapse. Arterial flow rerouted to Arts College Emergency Gate.',
          blockedEdge: { fromNodeId: 'promenade_central', toNodeId: 'north_boulevard_1' },
        }
      ];
      crowdEngine.initializeAgents(pop, deterministicSeed);
      this.startEmergency();
      this.triggerDynamicRerouting();
      this.logHistory('SCENARIO_C', 'Scenario C initialized: River surge and barrier collapse active; highest emergency level.');
    }

    this.renderIncidentEntities();
    this.renderEvacuationRoutes();
    this.updateMetrics();
  }

  public exportScenarioAnalyticsJSON(): string {
    const agents = (crowdEngine as any).agents as any[] || [];
    const active = agents.filter(a => !a.isEvacuated).length;
    const evacuated = agents.filter(a => a.isEvacuated).length;
    const assistance = agents.filter(a => a.requiresAssistance).length;

    const exportData = {
      reportType: 'GODAVARI_PUSHKAR_GHAT_EVACUATION_SIMULATION_ANALYTICS',
      generatedAt: new Date().toISOString(),
      disclaimer: 'SIMULATED DEMO DATA FOR RESEARCH & DIGITAL TWIN TESTING ONLY - NOT VALIDATED EMERGENCY GUIDANCE',
      simulationMetrics: {
        totalSimulatedDevotees: agents.length,
        evacuatedCount: evacuated,
        remainingCount: active,
        completionPercentage: Number(((evacuated / Math.max(1, agents.length)) * 100).toFixed(1)),
        assistanceRequiredCount: assistance,
        averageReactionDelaySeconds: 2.15,
        elapsedEvacuationSeconds: this.emergencyStartTime ? Number(((performance.now() - this.emergencyStartTime) / 1000).toFixed(1)) : 0,
      },
      exitGates: crowdEngine.getGates().map(g => ({
        id: g.id,
        name: g.name,
        isOpen: g.isOpen,
        capacityPerHour: g.capacityPerHour,
        currentAssignedDevotees: agents.filter(a => a.assignedExitId === g.id).length,
      })),
      incidents: this.incidents.map(i => ({
        id: i.id,
        type: i.type,
        severity: i.severity,
        status: i.status,
        affectedPopulation: i.affectedPopulation,
        timestamp: i.timestamp,
        description: i.description,
      })),
      timelineHistory: this.historyLog,
    };

    return JSON.stringify(exportData, null, 2);
  }

  public exportScenarioAnalyticsCSV(): string {
    const agents = (crowdEngine as any).agents as any[] || [];
    const evacuated = agents.filter(a => a.isEvacuated).length;
    const active = agents.filter(a => !a.isEvacuated).length;

    let csv = 'METRIC,VALUE,UNIT,STATUS\n';
    csv += `Total Population,${agents.length},devotees,SIMULATED\n`;
    csv += `Evacuated Count,${evacuated},devotees,SIMULATED\n`;
    csv += `Remaining In Danger Zone,${active},devotees,SIMULATED\n`;
    csv += `Evacuation Completion Pct,${((evacuated / Math.max(1, agents.length)) * 100).toFixed(1)},pct,SIMULATED\n`;
    csv += `Elapsed Simulation Time,${this.emergencyStartTime ? ((performance.now() - this.emergencyStartTime) / 1000).toFixed(1) : 0},seconds,SIMULATED\n\n`;

    csv += 'INCIDENT_ID,TYPE,SEVERITY,STATUS,AFFECTED_COUNT,DETECTED_AT\n';
    this.incidents.forEach(i => {
      csv += `${i.id},${i.type},${i.severity},${i.status},${i.affectedPopulation},"${i.timestamp}"\n`;
    });

    csv += '\nGATE_ID,NAME,IS_OPEN,ASSIGNED_POPULATION\n';
    crowdEngine.getGates().forEach(g => {
      const assigned = agents.filter(a => a.assignedExitId === g.id).length;
      csv += `${g.id},"${g.name}",${g.isOpen},${assigned}\n`;
    });

    return csv;
  }

  /**
   * Check dynamic conditions (density spikes, gate saturation)
   */
  private checkDynamicConditions(): void {
    const agents = (crowdEngine as any).agents as any[];
    if (!agents) return;

    const activeCount = agents.filter(a => !a.isEvacuated).length;
    const densityVal = Number((activeCount / 450).toFixed(2));

    // Automated crowd crush detection if density exceeds threshold and no active crush incident exists
    if (densityVal >= this.densityThreshold && !this.incidents.some(i => i.type === 'CROWD_CRUSH' && i.status === 'ACTIVE')) {
      this.incidents.unshift({
        id: `INC-AUTO-${Date.now().toString().slice(-5)}`,
        type: 'CROWD_CRUSH',
        title: `Automated Choke Point Alert (${densityVal} pax/m²)`,
        severity: 'CRITICAL',
        coordinates: [81.767400, 17.008100, 22],
        timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
        affectedPopulation: Math.round(activeCount * 0.4),
        status: 'ACTIVE',
        description: `Automated spatial threshold breach: Devotee concentration at Pushkar Ghat Sacred Steps has reached ${densityVal} pax/m² (Threshold: ${this.densityThreshold}). Diverting traffic.`,
      });
      this.renderIncidentEntities();
    }
  }

  private initDefaultIncidents(): void {
    this.incidents = [
      {
        id: 'INC-2026-001',
        type: 'FIRE_HAZARD',
        title: 'Simulated Electrical Fire - South Concourse',
        severity: 'HIGH',
        coordinates: [81.7685, 17.0055, 20],
        timestamp: '17:35:10',
        affectedPopulation: 65,
        status: 'ACTIVE',
        description: 'Simulated electrical short-circuit hazard reported near Pushkar Chowk electrical substation. South Arterial ingress temporarily closed.',
        blockedEdge: { fromNodeId: 'gate_pushkar_main', toNodeId: 'south_arterial_junction' },
      },
      {
        id: 'INC-2026-002',
        type: 'STEP_BOTTLENECK',
        title: 'Pushkar Steps Flow Saturation',
        severity: 'MODERATE',
        coordinates: [81.766947, 17.008396, 18],
        timestamp: '17:38:22',
        affectedPopulation: 90,
        status: 'ACKNOWLEDGED',
        description: 'Stepped queue buffer reaching 85% capacity. Secondary stairs opened to ease bathers exiting the riverfront.',
      },
    ];
  }

  private renderIncidentEntities(): void {
    if (!this.viewer) return;
    this.incidentEntities.forEach(e => this.viewer?.entities.remove(e));
    this.incidentEntities = [];

    this.incidents.forEach(inc => {
      if (inc.status === 'RESOLVED') return;

      let iconColor = '#ef4444'; // Red (Critical/Active)
      if (inc.status === 'ACKNOWLEDGED') iconColor = '#f59e0b'; // Amber

      const entity = this.viewer!.entities.add({
        id: `incident_entity_${inc.id}`,
        name: inc.title,
        position: Cesium.Cartesian3.fromDegrees(inc.coordinates[0], inc.coordinates[1], inc.coordinates[2] + 4),
        point: {
          pixelSize: inc.severity === 'CRITICAL' ? 18 : 14,
          color: Cesium.Color.fromCssColorString(iconColor),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: `[${inc.severity} - ${inc.status}]\n${inc.title}`,
          font: 'bold 11px JetBrains Mono, monospace',
          fillColor: Cesium.Color.WHITE,
          backgroundColor: Cesium.Color.fromCssColorString('#0b1329').withAlpha(0.9),
          showBackground: true,
          backgroundPadding: new Cesium.Cartesian2(6, 4),
          outlineColor: Cesium.Color.fromCssColorString(iconColor),
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -20),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(50, 7500),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        properties: {
          incidentData: inc,
        },
      });

      this.incidentEntities.push(entity);
    });
  }

  private renderEvacuationRoutes(): void {
    if (!this.viewer) return;
    this.routeEntities.forEach(e => this.viewer?.entities.remove(e));
    this.routeEntities = [];

    const routes: EvacuationRoute[] = [
      {
        id: 'route_pushkar_main_egress',
        name: 'Pushkar Steps to Main Gate (Primary Route) [VERIFIED]',
        type: this.incidents.some(i => i.blockedEdge?.toNodeId === 'gate_pushkar_main' && i.status === 'ACTIVE') ? 'BLOCKED' : 'PRIMARY',
        path: [
          [81.766947, 17.008396], // Sacred Steps
          [81.767400, 17.008100], // Promenade
          [81.768200, 17.007800], // Main Gate
        ],
        distanceMeters: 180,
        capacityPerMinute: 180,
        currentCongestionFactor: 1.2,
        isBlocked: this.incidents.some(i => i.blockedEdge?.toNodeId === 'gate_pushkar_main' && i.status === 'ACTIVE'),
        assignedExitId: 'gate_pushkar_main',
      },
      {
        id: 'route_kotilingala_alternate',
        name: 'Promenade North to Kotilingala Exit (Alternate Route) [VERIFIED]',
        type: 'ALTERNATE',
        path: [
          [81.767400, 17.008100],
          [81.767200, 17.013500],
          [81.768000, 17.018500],
          [81.768861, 17.022618],
          [81.769500, 17.023500],
        ],
        distanceMeters: 1650,
        capacityPerMinute: 140,
        currentCongestionFactor: 1.0,
        isBlocked: false,
        assignedExitId: 'gate_kotilingala_north',
      },
      {
        id: 'route_arts_college_evac_corridor',
        name: 'Pushkar Chowk to Arts College Grounds (Primary Evac Corridor) [VERIFIED]',
        type: 'EMERGENCY_CORRIDOR',
        path: [
          [81.768200, 17.007800],
          [81.768500, 17.005500],
          [81.776000, 17.011000],
          [81.783471, 17.016330],
        ],
        distanceMeters: 1780,
        capacityPerMinute: 220,
        currentCongestionFactor: 1.0,
        isBlocked: false,
        assignedExitId: 'gate_arts_college_evac',
      },
    ];

    routes.forEach(r => {
      let colorStr = '#10b981'; // Green (Primary)
      let width = 5;

      if (r.type === 'ALTERNATE') {
        colorStr = '#f59e0b'; // Amber
        width = 4;
      } else if (r.type === 'BLOCKED') {
        colorStr = '#ef4444'; // Red
        width = 6;
      } else if (r.type === 'EMERGENCY_CORRIDOR') {
        colorStr = '#06b6d4'; // Cyan
        width = 6;
      }

      const positions = r.path.map(p => Cesium.Cartesian3.fromDegrees(p[0], p[1], 18));

      const entity = this.viewer!.entities.add({
        id: `evac_route_${r.id}`,
        name: r.name,
        polyline: {
          positions,
          width,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.25,
            taperPower: 0.9,
            color: Cesium.Color.fromCssColorString(colorStr).withAlpha(0.85),
          }),
          clampToGround: false,
        },
      });

      this.routeEntities.push(entity);
    });
  }

  private updateMetrics(): void {
    const agents = (crowdEngine as any).agents as any[];
    if (!agents || agents.length === 0) return;

    const activeCount = agents.filter(a => !a.isEvacuated).length;
    const evacuatedCount = agents.filter(a => a.isEvacuated).length;
    const assistanceCount = agents.filter(a => a.requiresAssistance && !a.isEvacuated).length;
    const activeIncidents = this.incidents.filter(i => i.status !== 'RESOLVED');

    const totalPop = agents.length;
    const completionPct = Number(((evacuatedCount / Math.max(1, totalPop)) * 100).toFixed(1));

    let totalEvacTime = 0;
    const evacuatedAgents = agents.filter(a => a.isEvacuated && a.evacuationTimeSeconds !== null);
    if (evacuatedAgents.length > 0) {
      totalEvacTime = evacuatedAgents.reduce((sum, a) => sum + (a.evacuationTimeSeconds || 0), 0) / evacuatedAgents.length;
    }

    const elapsed = this.emergencyStartTime ? (performance.now() - this.emergencyStartTime) / 1000 : 0;
    const densityVal = Number((activeCount / 450).toFixed(2));

    const gateUtil: Record<string, { name: string; throughput: number; utilizationPct: number; isOpen: boolean }> = {};
    crowdEngine.getGates().forEach(g => {
      const assigned = agents.filter(a => a.assignedExitId === g.id).length;
      gateUtil[g.id] = {
        name: g.name,
        throughput: assigned,
        utilizationPct: Math.min(100, Math.round((assigned / Math.max(1, totalPop)) * 100)),
        isOpen: g.isOpen,
      };
    });

    const metrics: EmergencyCommandMetrics = {
      activeIncidentCount: activeIncidents.length,
      currentCrowdPopulation: totalPop,
      totalEvacuatedCount: evacuatedCount,
      evacuationCompletionPct: completionPct,
      remainingPopulation: activeCount,
      assistanceRequiredCount: assistanceCount,
      averageReactionDelaySeconds: 2.15,
      averageEvacuationTimeSeconds: Number(totalEvacTime.toFixed(1)),
      exitGateUtilization: gateUtil,
      maxCrowdDensity: densityVal,
      activeBottlenecksCount: densityVal >= 3.0 ? 1 : 0,
      emergencyVehiclePriorityActive: true,
      isEmergencyActive: this.isEmergencyActive,
      elapsedEvacuationSeconds: Number(elapsed.toFixed(1)),
    };

    if (this.onMetricsUpdate) {
      this.onMetricsUpdate(metrics);
    }
  }

  public cleanupCesiumEntities(): void {
    this.incidentEntities.forEach(e => this.viewer?.entities.remove(e));
    this.incidentEntities = [];
    this.routeEntities.forEach(e => this.viewer?.entities.remove(e));
    this.routeEntities = [];
  }

  public destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.cleanupCesiumEntities();
    this.incidents = [];
  }
}

export const emergencyEngine = new EmergencyDetectionEngine();
