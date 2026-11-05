import * as Cesium from 'cesium';
import { 
  AgeGroup, 
  AgeGroupProfile, 
  PedestrianAgent, 
  SimulationGate, 
  CrowdMetrics, 
  CrowdDensityLevel,
  AgentDisplayFilter
} from '../types/crowd';
import { createPushkarGhatPedestrianGraph, AStarGraph } from './pathfinding';

export const DEFAULT_AGE_PROFILES: Record<AgeGroup, AgeGroupProfile> = {
  CHILDREN: {
    ageGroup: 'CHILDREN',
    label: 'Children (5–12 yrs)',
    ageRange: '5–12',
    count: 38,
    baseSpeed: 1.0,
    acceleration: 0.6,
    directionChangeFreq: 0.25,
    obstacleAvoidance: 0.65,
    reactionDelayRange: [2.0, 5.0],
    restingProbability: 0.15,
    groupBehavior: true,
    color: '#fbbf24', // Amber gold
    defaultProportion: 0.15,
  },
  YOUNG: {
    ageGroup: 'YOUNG',
    label: 'Young (13–35 yrs)',
    ageRange: '13–35',
    count: 112,
    baseSpeed: 1.5,
    acceleration: 1.2,
    directionChangeFreq: 0.10,
    obstacleAvoidance: 0.85,
    reactionDelayRange: [0.5, 2.0],
    restingProbability: 0.05,
    groupBehavior: false,
    color: '#06b6d4', // Cyan
    defaultProportion: 0.45,
  },
  ADULTS: {
    ageGroup: 'ADULTS',
    label: 'Adults (36–59 yrs)',
    ageRange: '36–59',
    count: 62,
    baseSpeed: 1.25,
    acceleration: 0.9,
    directionChangeFreq: 0.08,
    obstacleAvoidance: 0.80,
    reactionDelayRange: [1.0, 3.0],
    restingProbability: 0.10,
    groupBehavior: true,
    color: '#3b82f6', // Blue
    defaultProportion: 0.25,
  },
  SENIORS: {
    ageGroup: 'SENIORS',
    label: 'Senior Citizens (60+ yrs)',
    ageRange: '60+',
    count: 38,
    baseSpeed: 0.85,
    acceleration: 0.4,
    directionChangeFreq: 0.05,
    obstacleAvoidance: 0.50,
    reactionDelayRange: [2.5, 7.0],
    restingProbability: 0.30,
    groupBehavior: false,
    color: '#a855f7', // Purple
    defaultProportion: 0.15,
  },
};

export const DEFAULT_GATES: SimulationGate[] = [
  {
    id: 'gate_pushkar_main',
    name: 'Pushkar Main Gate (In/Out) [VERIFIED]',
    type: 'DUAL',
    coordinates: { longitude: 81.7682, latitude: 17.0078 },
    capacityPerHour: 35000,
    currentFlowRatePerMin: 180,
    widthMeters: 14,
    isOpen: true,
  },
  {
    id: 'gate_kotilingala_north',
    name: 'Kotilingala North Exit Gate [VERIFIED]',
    type: 'EXIT',
    coordinates: { longitude: 81.7695, latitude: 17.0235 },
    capacityPerHour: 28000,
    currentFlowRatePerMin: 140,
    widthMeters: 12,
    isOpen: true,
  },
  {
    id: 'gate_south_temple',
    name: 'Markandeya Temple South Gate [VERIFIED]',
    type: 'EXIT',
    coordinates: { longitude: 81.7682, latitude: 17.0042 },
    capacityPerHour: 18000,
    currentFlowRatePerMin: 95,
    widthMeters: 10,
    isOpen: true,
  },
  {
    id: 'gate_arts_college_evac',
    name: 'Arts College Emergency Gate [VERIFIED]',
    type: 'EXIT',
    coordinates: { longitude: 81.783471, latitude: 17.016330 },
    capacityPerHour: 50000,
    currentFlowRatePerMin: 220,
    widthMeters: 20,
    isOpen: true,
  },
];

export class CrowdSimulationEngine {
  private isRunning: boolean = false;
  private isEmergencyAlertActive: boolean = false;
  private alertStartTime: number | null = null;
  private simulationSpeed: number = 1.0;
  private graph: AStarGraph;
  private agents: PedestrianAgent[] = [];
  private gates: SimulationGate[] = [...DEFAULT_GATES];
  private ageProfiles: Record<AgeGroup, AgeGroupProfile> = { ...DEFAULT_AGE_PROFILES };
  private targetAgentCount: number = 250;
  private activeDisplayFilter: AgentDisplayFilter = 'ALL';
  private pointPrimitives: Cesium.PointPrimitiveCollection | null = null;
  private bottleneckEntities: Cesium.Entity[] = [];
  private densityEntities: Cesium.Entity[] = [];
  private onMetricsUpdate: ((metrics: CrowdMetrics) => void) | null = null;
  private lastMetricsTimestamp: number = 0;
  private animationFrameId: number | null = null;
  private lastFrameTime: number = performance.now();
  private viewer: Cesium.Viewer | null = null;
  private selectedAgentId: string | null = null;
  private selectedAgentReticle: Cesium.Entity | null = null;

  constructor() {
    this.graph = createPushkarGhatPedestrianGraph();
  }

  public setViewer(viewer: Cesium.Viewer | null): void {
    this.cleanupCesiumPrimitives();
    this.viewer = viewer;
    if (viewer) {
      this.pointPrimitives = viewer.scene.primitives.add(new Cesium.PointPrimitiveCollection());
      this.initDensityHeatmapEntities();
    }
  }

  public getGates(): SimulationGate[] {
    return [...this.gates];
  }

  public toggleGate(gateId: string): void {
    const gate = this.gates.find(g => g.id === gateId);
    if (gate) {
      gate.isOpen = !gate.isOpen;
      this.updateMetrics();
    }
  }

  public getAgeProfiles(): Record<AgeGroup, AgeGroupProfile> {
    return { ...this.ageProfiles };
  }

  public updateAgeProfile(ageGroup: AgeGroup, updates: Partial<AgeGroupProfile>): void {
    if (this.ageProfiles[ageGroup]) {
      this.ageProfiles[ageGroup] = { ...this.ageProfiles[ageGroup], ...updates };
      // Apply immediately to agents of that age group
      this.agents.forEach(agent => {
        if (agent.ageGroup === ageGroup) {
          if (updates.baseSpeed !== undefined) {
            agent.targetSpeed = updates.baseSpeed;
          }
        }
      });
      this.updateMetrics();
    }
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public getIsEmergency(): boolean {
    return this.isEmergencyAlertActive;
  }

  public getAlertDurationSeconds(): number {
    return this.alertStartTime ? (performance.now() - this.alertStartTime) / 1000 : 0;
  }

  public getDisplayFilter(): AgentDisplayFilter {
    return this.activeDisplayFilter;
  }

  public setDisplayFilter(filter: AgentDisplayFilter): void {
    this.activeDisplayFilter = filter;
    this.renderAgentsToCesium();
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    if (this.agents.length === 0) {
      this.initializeAgents(this.targetAgentCount);
    }
    this.lastFrameTime = performance.now();
    this.loop();
  }

  public pause(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public reset(seed: number = 42): void {
    this.pause();
    this.isEmergencyAlertActive = false;
    this.alertStartTime = null;
    this.initializeAgents(this.targetAgentCount, seed);
    this.renderAgentsToCesium();
    this.updateMetrics();
  }

  public setAgentCount(count: number): void {
    this.targetAgentCount = Math.max(50, Math.min(1000, count));
    this.reset();
  }

  public setSpeed(speed: number): void {
    this.simulationSpeed = Math.max(0.25, Math.min(5.0, speed));
  }

  public triggerEmergencyAlert(): void {
    this.isEmergencyAlertActive = true;
    this.alertStartTime = performance.now();

    // Reassign agents toward available open EXIT gates
    const openExitGates = this.gates.filter(g => (g.type === 'EXIT' || g.type === 'DUAL') && g.isOpen);
    if (openExitGates.length === 0) return;

    this.agents.forEach(agent => {
      // Pick closest open exit gate or dynamic distribution
      const exitGate = openExitGates[Math.floor(Math.random() * openExitGates.length)];
      agent.assignedExitId = exitGate.id;
      agent.elapsedSinceAlert = 0;
      agent.hasRespondedToAlert = false;
      agent.behaviorState = 'ALERT_RECEIVED';
    });
  }

  public clearEmergencyAlert(): void {
    this.isEmergencyAlertActive = false;
    this.alertStartTime = null;
    this.agents.forEach(agent => {
      agent.behaviorState = 'NORMAL_WALKING';
      agent.hasRespondedToAlert = false;
      agent.targetSpeed = this.ageProfiles[agent.ageGroup].baseSpeed;
    });
  }

  public selectAgent(agentId: string | null): void {
    this.selectedAgentId = agentId;
    this.updateSelectedAgentReticle();
  }

  public getSelectedAgent(): PedestrianAgent | null {
    if (!this.selectedAgentId) return null;
    return this.agents.find(a => a.id === this.selectedAgentId) || null;
  }

  public getAllAgents(): PedestrianAgent[] {
    return this.agents;
  }

  public pickAgentNearCoordinates(lon: number, lat: number, maxDistMeters: number = 25): PedestrianAgent | null {
    const degDist = maxDistMeters / 111000;
    let closest: PedestrianAgent | null = null;
    let minDist = degDist;

    for (const a of this.agents) {
      if (a.isEvacuated) continue;
      const d = Math.hypot(a.position.longitude - lon, a.position.latitude - lat);
      if (d < minDist) {
        minDist = d;
        closest = a;
      }
    }
    return closest;
  }

  public setOnMetricsUpdate(cb: (metrics: CrowdMetrics) => void): void {
    this.onMetricsUpdate = cb;
  }

  /**
   * Deterministic agent initialization using PRNG (Linear Congruential Generator)
   */
  public initializeAgents(count: number, seed: number = 42): void {
    this.agents = [];
    let currentSeed = seed;

    const pseudoRandom = () => {
      currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296;
      return currentSeed / 4294967296;
    };

    const nodeIds = Array.from(this.graph.nodes.keys());
    const ghatTargetNodes = ['pushkar_steps_lower', 'kotilingala_steps', 'promenade_central'];

    for (let i = 0; i < count; i++) {
      // Determine Age Group by configured proportion
      const rAge = pseudoRandom();
      let ageGroup: AgeGroup = 'YOUNG';
      if (rAge < 0.15) ageGroup = 'CHILDREN';
      else if (rAge < 0.60) ageGroup = 'YOUNG';
      else if (rAge < 0.85) ageGroup = 'ADULTS';
      else ageGroup = 'SENIORS';

      const profile = this.ageProfiles[ageGroup];

      // Reaction delay based on age profile
      const [minDelay, maxDelay] = profile.reactionDelayRange;
      const reactionDelay = minDelay + pseudoRandom() * (maxDelay - minDelay);

      // Start position along nodes or gates with slight jitter
      const startNodeId = nodeIds[Math.floor(pseudoRandom() * nodeIds.length)];
      const startNode = this.graph.nodes.get(startNodeId)!;
      const targetNodeId = ghatTargetNodes[Math.floor(pseudoRandom() * ghatTargetNodes.length)];

      const path = this.graph.findPath(startNodeId, targetNodeId);

      const lonJitter = (pseudoRandom() - 0.5) * 0.0003;
      const latJitter = (pseudoRandom() - 0.5) * 0.0003;

      const requiresAssistance = (ageGroup === 'SENIORS' && pseudoRandom() < 0.25) || 
                                 (ageGroup === 'CHILDREN' && pseudoRandom() < 0.15);

      this.agents.push({
        id: `ped_agent_${i + 1}`,
        ageGroup,
        position: {
          longitude: startNode.coordinates[0] + lonJitter,
          latitude: startNode.coordinates[1] + latJitter,
          height: startNode.elevation + 0.5,
        },
        destination: {
          longitude: path[path.length - 1][0],
          latitude: path[path.length - 1][1],
        },
        speed: profile.baseSpeed * (0.9 + pseudoRandom() * 0.2),
        targetSpeed: profile.baseSpeed,
        behaviorState: 'NORMAL_WALKING',
        groupId: ageGroup === 'CHILDREN' ? `family_${Math.floor(i / 3)}` : null,
        reactionDelaySeconds: Number(reactionDelay.toFixed(2)),
        elapsedSinceAlert: 0,
        hasRespondedToAlert: false,
        requiresAssistance,
        assignedExitId: null,
        pathIndex: 0,
        currentPath: path,
        isEvacuated: false,
        evacuationTimeSeconds: null,
      });
    }

    this.rebuildCesiumPrimitives();
  }

  /**
   * Main simulation frame tick
   */
  private loop = (): void => {
    if (!this.isRunning) return;

    const now = performance.now();
    const dt = Math.min(0.1, (now - this.lastFrameTime) / 1000) * this.simulationSpeed;
    this.lastFrameTime = now;

    this.updateAgents(dt);
    this.renderAgentsToCesium();

    // Throttle metrics update to every 500ms
    if (now - this.lastMetricsTimestamp > 500) {
      this.lastMetricsTimestamp = now;
      this.updateMetrics();
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private updateAgents(dt: number): void {
    const isEmergency = this.isEmergencyAlertActive;

    this.agents.forEach(agent => {
      if (agent.isEvacuated) return;

      // Handle Emergency Reaction Time Logic
      if (isEmergency) {
        agent.elapsedSinceAlert += dt;
        if (!agent.hasRespondedToAlert) {
          if (agent.elapsedSinceAlert < agent.reactionDelaySeconds * 0.4) {
            agent.behaviorState = 'ALERT_RECEIVED';
          } else if (agent.elapsedSinceAlert < agent.reactionDelaySeconds) {
            agent.behaviorState = 'REACTING';
          } else {
            agent.hasRespondedToAlert = true;
            agent.behaviorState = agent.requiresAssistance ? 'NEEDS_ASSISTANCE' : 'EVACUATING';
            
            // Recompute path to assigned evacuation gate
            if (agent.assignedExitId) {
              const startNodeId = this.findClosestNode(agent.position.longitude, agent.position.latitude);
              const exitGate = this.gates.find(g => g.id === agent.assignedExitId);
              if (exitGate) {
                const exitNodeId = this.findClosestNode(exitGate.coordinates.longitude, exitGate.coordinates.latitude);
                agent.currentPath = this.graph.findPath(startNodeId, exitNodeId);
                agent.pathIndex = 0;
              }
            }

            // Panic speed multiplier
            agent.targetSpeed = agent.requiresAssistance 
              ? this.ageProfiles[agent.ageGroup].baseSpeed * 0.7 
              : this.ageProfiles[agent.ageGroup].baseSpeed * 1.5;
          }
        }
      } else {
        agent.behaviorState = 'NORMAL_WALKING';
      }

      // Smooth acceleration
      agent.speed += (agent.targetSpeed - agent.speed) * Math.min(1.0, dt * 2.0);

      // Path following
      if (agent.currentPath.length > 0 && agent.pathIndex < agent.currentPath.length) {
        const targetWaypoint = agent.currentPath[agent.pathIndex];
        const dLon = targetWaypoint[0] - agent.position.longitude;
        const dLat = targetWaypoint[1] - agent.position.latitude;
        const dist = Math.sqrt(dLon * dLon + dLat * dLat);

        const waypointTolerance = 0.0001; // ~10m in degrees

        if (dist < waypointTolerance) {
          agent.pathIndex++;
          if (agent.pathIndex >= agent.currentPath.length) {
            // Reached destination or evacuation exit
            if (isEmergency && agent.hasRespondedToAlert) {
              agent.isEvacuated = true;
              agent.behaviorState = 'EVACUATED';
              agent.evacuationTimeSeconds = Number((agent.elapsedSinceAlert).toFixed(1));
              return;
            } else {
              // Loop back or pick new destination
              agent.pathIndex = 0;
              agent.currentPath.reverse();
            }
          }
        } else {
          // Move toward waypoint
          const moveDistDeg = (agent.speed * dt) / 111000; // rough deg per meter
          const dirX = dLon / dist;
          const dirY = dLat / dist;
          agent.position.longitude += dirX * moveDistDeg;
          agent.position.latitude += dirY * moveDistDeg;
        }
      }
    });
  }

  private findClosestNode(lon: number, lat: number): string {
    let closestId = 'gate_pushkar_main';
    let minD = Infinity;
    for (const [id, node] of this.graph.nodes) {
      const d = (node.coordinates[0] - lon) ** 2 + (node.coordinates[1] - lat) ** 2;
      if (d < minD) {
        minD = d;
        closestId = id;
      }
    }
    return closestId;
  }

  /**
   * Ultra-fast GPU point primitive rendering
   */
  private rebuildCesiumPrimitives(): void {
    if (!this.viewer || !this.pointPrimitives) return;
    this.pointPrimitives.removeAll();

    this.agents.forEach(agent => {
      const colorCss = agent.requiresAssistance ? '#ef4444' : this.ageProfiles[agent.ageGroup].color;
      this.pointPrimitives!.add({
        position: Cesium.Cartesian3.fromDegrees(
          agent.position.longitude,
          agent.position.latitude,
          agent.position.height
        ),
        pixelSize: agent.ageGroup === 'CHILDREN' ? 6 : agent.ageGroup === 'SENIORS' ? 9 : 8,
        color: Cesium.Color.fromCssColorString(colorCss),
        outlineColor: Cesium.Color.WHITE.withAlpha(0.6),
        outlineWidth: 1,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      });
    });
  }

  private renderAgentsToCesium(): void {
    if (!this.pointPrimitives) return;

    for (let i = 0; i < this.agents.length; i++) {
      const agent = this.agents[i];
      const primitive = this.pointPrimitives.get(i);
      if (!primitive) continue;

      if (agent.isEvacuated) {
        primitive.show = false;
        continue;
      }

      // Check display filter
      let isVisible = true;
      if (this.activeDisplayFilter === 'CHILDREN') {
        isVisible = agent.ageGroup === 'CHILDREN';
      } else if (this.activeDisplayFilter === 'YOUNG') {
        isVisible = agent.ageGroup === 'YOUNG';
      } else if (this.activeDisplayFilter === 'ADULTS') {
        isVisible = agent.ageGroup === 'ADULTS';
      } else if (this.activeDisplayFilter === 'SENIORS') {
        isVisible = agent.ageGroup === 'SENIORS';
      } else if (this.activeDisplayFilter === 'ASSISTANCE_REQUIRED') {
        isVisible = agent.requiresAssistance;
      }

      primitive.show = isVisible;
      if (!isVisible) continue;

      primitive.position = Cesium.Cartesian3.fromDegrees(
        agent.position.longitude,
        agent.position.latitude,
        agent.position.height
      );

      const isSelected = agent.id === this.selectedAgentId;
      let colorCss = this.ageProfiles[agent.ageGroup].color;
      if (agent.behaviorState === 'NEEDS_ASSISTANCE' || agent.behaviorState === 'REQUESTING_ASSISTANCE') {
        colorCss = '#ef4444'; // Red
      } else if (agent.behaviorState === 'REACTING' || agent.behaviorState === 'ALERT_RECEIVED') {
        colorCss = '#f59e0b'; // Amber
      } else if (agent.behaviorState === 'REROUTING') {
        colorCss = '#ec4899'; // Pink
      } else if (agent.behaviorState === 'WAITING') {
        colorCss = '#eab308'; // Yellow
      }

      if (isSelected) {
        primitive.color = Cesium.Color.fromCssColorString('#ffffff');
        primitive.pixelSize = 14;
        primitive.outlineColor = Cesium.Color.fromCssColorString('#06b6d4');
        primitive.outlineWidth = 3;
      } else {
        primitive.color = Cesium.Color.fromCssColorString(colorCss);
        primitive.pixelSize = agent.ageGroup === 'CHILDREN' ? 6 : agent.ageGroup === 'SENIORS' ? 9 : 8;
        primitive.outlineColor = Cesium.Color.WHITE.withAlpha(0.6);
        primitive.outlineWidth = 1;
      }
    }

    if (this.selectedAgentId) {
      this.updateSelectedAgentReticle();
    }
  }

  private updateSelectedAgentReticle(): void {
    if (!this.viewer) return;
    const agent = this.getSelectedAgent();

    if (!agent || agent.isEvacuated) {
      if (this.selectedAgentReticle) {
        this.viewer.entities.remove(this.selectedAgentReticle);
        this.selectedAgentReticle = null;
      }
      return;
    }

    const pos = Cesium.Cartesian3.fromDegrees(agent.position.longitude, agent.position.latitude, agent.position.height + 2);

    if (!this.selectedAgentReticle) {
      this.selectedAgentReticle = this.viewer.entities.add({
        id: 'selected_agent_reticle',
        name: `Selected: ${agent.id}`,
        position: pos,
        point: {
          pixelSize: 22,
          color: Cesium.Color.fromCssColorString('#06b6d4').withAlpha(0.35),
          outlineColor: Cesium.Color.fromCssColorString('#22d3ee'),
          outlineWidth: 3,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: `🎯 AGENT ${agent.id.replace('ped_agent_', '#')}\n[${agent.ageGroup}] ${agent.behaviorState}`,
          font: 'bold 11px JetBrains Mono, monospace',
          fillColor: Cesium.Color.WHITE,
          backgroundColor: Cesium.Color.fromCssColorString('#082f49').withAlpha(0.9),
          showBackground: true,
          backgroundPadding: new Cesium.Cartesian2(6, 4),
          outlineColor: Cesium.Color.fromCssColorString('#06b6d4'),
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -22),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
    } else {
      this.selectedAgentReticle.position = new Cesium.ConstantPositionProperty(pos);
      if (this.selectedAgentReticle.label) {
        this.selectedAgentReticle.label.text = new Cesium.ConstantProperty(
          `🎯 AGENT ${agent.id.replace('ped_agent_', '#')}\n[${agent.ageGroup}] ${agent.behaviorState}`
        );
      }
    }
  }

  private updateMetrics(): void {
    const activeAgents = this.agents.filter(a => !a.isEvacuated);
    const evacuatedAgents = this.agents.filter(a => a.isEvacuated);

    const byAge: Record<AgeGroup, number> = { CHILDREN: 0, YOUNG: 0, ADULTS: 0, SENIORS: 0 };
    let totalSpeed = 0;
    let totalReaction = 0;
    let respondedCount = 0;
    let assistanceCount = 0;

    activeAgents.forEach(a => {
      byAge[a.ageGroup]++;
      totalSpeed += a.speed;
      totalReaction += a.reactionDelaySeconds;
      if (a.hasRespondedToAlert) respondedCount++;
      if (a.requiresAssistance) assistanceCount++;
    });

    const avgSpeed = activeAgents.length > 0 ? totalSpeed / activeAgents.length : 0;
    const avgReaction = this.agents.length > 0 ? totalReaction / this.agents.length : 0;
    const responsePct = this.agents.length > 0 ? (respondedCount / this.agents.length) * 100 : 0;

    // Density calculation around Pushkar Ghat Promenade (~4000 sq meters area)
    const densityVal = Number((activeAgents.length / 450).toFixed(2)); // devotees / m^2
    let densityLevel: CrowdDensityLevel = 'LOW';
    if (densityVal >= 3.5) densityLevel = 'CRITICAL';
    else if (densityVal >= 2.5) densityLevel = 'HIGH';
    else if (densityVal >= 1.2) densityLevel = 'MODERATE';

    const bottlenecks: { locationName: string; density: number; coordinates: [number, number] }[] = [];
    if (densityLevel === 'CRITICAL' || densityLevel === 'HIGH') {
      bottlenecks.push({
        locationName: 'Pushkar Steps to Promenade Bottleneck',
        density: densityVal,
        coordinates: [81.767400, 17.008100],
      });
    }

    // Entry and exit gate flow rates (SIMULATED pax/min)
    const openEntryGates = this.gates.filter(g => (g.type === 'ENTRY' || g.type === 'DUAL') && g.isOpen);
    const openExitGates = this.gates.filter(g => (g.type === 'EXIT' || g.type === 'DUAL') && g.isOpen);

    const baseEntryFlow = openEntryGates.reduce((sum, g) => sum + g.currentFlowRatePerMin, 0);
    const baseExitFlow = openExitGates.reduce((sum, g) => sum + g.currentFlowRatePerMin, 0);

    const activeRatio = Math.min(1.5, activeAgents.length / 250);
    const entryFlowRate = Math.round(baseEntryFlow * activeRatio * (this.isEmergencyAlertActive ? 0.1 : 1.0));
    const exitFlowRate = Math.round(baseExitFlow * activeRatio * (this.isEmergencyAlertActive ? 1.8 : 0.9));

    const metrics: CrowdMetrics = {
      totalActivePedestrians: activeAgents.length,
      evacuatedPedestrians: evacuatedAgents.length,
      byAgeGroup: byAge,
      averageWalkingSpeed: Number(avgSpeed.toFixed(2)),
      averageReactionDelay: Number(avgReaction.toFixed(2)),
      responsePercentage: Number(responsePct.toFixed(1)),
      assistanceRequiredCount: assistanceCount,
      nonResponsiveCount: activeAgents.filter(a => this.isEmergencyAlertActive && !a.hasRespondedToAlert).length,
      currentDensityLevel: densityLevel,
      densityValue: densityVal,
      entryFlowRatePerMin: entryFlowRate,
      exitFlowRatePerMin: exitFlowRate,
      activeBottlenecks: bottlenecks,
      evacuationCompleteTimeSeconds: evacuatedAgents.length === this.agents.length && this.agents.length > 0 
        ? Math.max(...evacuatedAgents.map(a => a.evacuationTimeSeconds || 0)) 
        : null,
    };

    this.updateDensityHeatmaps(densityLevel);
    this.updateBottleneckEntities(bottlenecks);

    if (this.onMetricsUpdate) {
      this.onMetricsUpdate(metrics);
    }
  }

  private initDensityHeatmapEntities(): void {
    if (!this.viewer) return;
    this.densityEntities.forEach(e => this.viewer?.entities.remove(e));
    this.densityEntities = [];

    const zones = [
      { name: 'Pushkar Steps Zone', lon: 81.766947, lat: 17.008396, semiMajor: 90, semiMinor: 45 },
      { name: 'Promenade Concourse', lon: 81.767400, lat: 17.008100, semiMajor: 120, semiMinor: 55 },
      { name: 'Kotilingala Concourse', lon: 81.768861, lat: 17.022618, semiMajor: 110, semiMinor: 50 },
      { name: 'Markandeya Temple Entry', lon: 81.767800, lat: 17.004500, semiMajor: 80, semiMinor: 40 },
    ];

    zones.forEach(z => {
      const entity = this.viewer!.entities.add({
        name: `Density_Zone_${z.name}`,
        position: Cesium.Cartesian3.fromDegrees(z.lon, z.lat, 17),
        ellipse: {
          semiMajorAxis: z.semiMajor,
          semiMinorAxis: z.semiMinor,
          material: Cesium.Color.fromCssColorString('#10b981').withAlpha(0.25),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString('#10b981').withAlpha(0.6),
          outlineWidth: 2,
        },
      });
      this.densityEntities.push(entity);
    });
  }

  private updateDensityHeatmaps(level: CrowdDensityLevel): void {
    let colorCss = '#10b981'; // Green (LOW)
    let alpha = 0.25;

    if (level === 'MODERATE') {
      colorCss = '#f59e0b'; // Amber
      alpha = 0.35;
    } else if (level === 'HIGH') {
      colorCss = '#ea580c'; // Orange
      alpha = 0.45;
    } else if (level === 'CRITICAL') {
      colorCss = '#ef4444'; // Red
      alpha = 0.65;
    }

    this.densityEntities.forEach(e => {
      if (e.ellipse) {
        e.ellipse.material = new Cesium.ColorMaterialProperty(
          Cesium.Color.fromCssColorString(colorCss).withAlpha(alpha)
        );
        e.ellipse.outlineColor = new Cesium.ConstantProperty(
          Cesium.Color.fromCssColorString(colorCss).withAlpha(0.85)
        );
      }
    });
  }

  private updateBottleneckEntities(bottlenecks: { locationName: string; density: number; coordinates: [number, number] }[]): void {
    if (!this.viewer) return;
    this.bottleneckEntities.forEach(e => this.viewer?.entities.remove(e));
    this.bottleneckEntities = [];

    bottlenecks.forEach((b, idx) => {
      const entity = this.viewer!.entities.add({
        name: `BOTTLENECK_ALERT_${idx}`,
        position: Cesium.Cartesian3.fromDegrees(b.coordinates[0], b.coordinates[1], 25),
        point: {
          pixelSize: 16,
          color: Cesium.Color.fromCssColorString('#ef4444'),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: `⚠️ BOTTLENECK (${b.density} pax/m²)`,
          font: 'bold 11px monospace',
          fillColor: Cesium.Color.fromCssColorString('#fca5a5'),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -18),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
      this.bottleneckEntities.push(entity);
    });
  }

  public cleanupCesiumPrimitives(): void {
    if (this.pointPrimitives && this.viewer) {
      this.viewer.scene.primitives.remove(this.pointPrimitives);
      this.pointPrimitives = null;
    }
    if (this.selectedAgentReticle && this.viewer) {
      this.viewer.entities.remove(this.selectedAgentReticle);
      this.selectedAgentReticle = null;
    }
    this.bottleneckEntities.forEach(e => this.viewer?.entities.remove(e));
    this.bottleneckEntities = [];
    this.densityEntities.forEach(e => this.viewer?.entities.remove(e));
    this.densityEntities = [];
  }

  public destroy(): void {
    this.pause();
    this.cleanupCesiumPrimitives();
    this.agents = [];
  }
}

export const crowdEngine = new CrowdSimulationEngine();
