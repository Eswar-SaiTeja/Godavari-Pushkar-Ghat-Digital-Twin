import * as Cesium from 'cesium';
import { 
  AgeGroup, 
  AgeGroupProfile, 
  PedestrianAgent, 
  SimulationGate, 
  CrowdMetrics, 
  BehaviorState, 
  CrowdDensityLevel 
} from '../types/crowd';
import { createPushkarGhatPedestrianGraph, AStarGraph } from './pathfinding';

export const DEFAULT_AGE_PROFILES: Record<AgeGroup, AgeGroupProfile> = {
  CHILDREN: {
    ageGroup: 'CHILDREN',
    label: 'Children (5–12 yrs)',
    ageRange: '5–12',
    baseSpeed: 1.0,
    acceleration: 0.6,
    directionChangeFreq: 0.25,
    reactionDelayRange: [2.0, 5.0],
    restingProbability: 0.15,
    color: '#fbbf24', // Amber gold
    defaultProportion: 0.15,
  },
  YOUNG: {
    ageGroup: 'YOUNG',
    label: 'Young (13–35 yrs)',
    ageRange: '13–35',
    baseSpeed: 1.5,
    acceleration: 1.2,
    directionChangeFreq: 0.10,
    reactionDelayRange: [0.5, 2.0],
    restingProbability: 0.05,
    color: '#06b6d4', // Cyan
    defaultProportion: 0.45,
  },
  ADULTS: {
    ageGroup: 'ADULTS',
    label: 'Adults (36–59 yrs)',
    ageRange: '36–59',
    baseSpeed: 1.25,
    acceleration: 0.9,
    directionChangeFreq: 0.08,
    reactionDelayRange: [1.0, 3.0],
    restingProbability: 0.10,
    color: '#3b82f6', // Blue
    defaultProportion: 0.25,
  },
  SENIORS: {
    ageGroup: 'SENIORS',
    label: 'Senior Citizens (60+ yrs)',
    ageRange: '60+',
    baseSpeed: 0.85,
    acceleration: 0.4,
    directionChangeFreq: 0.05,
    reactionDelayRange: [2.5, 7.0],
    restingProbability: 0.30,
    color: '#a855f7', // Purple
    defaultProportion: 0.15,
  },
};

export const DEFAULT_GATES: SimulationGate[] = [
  {
    id: 'gate_pushkar_main',
    name: 'Pushkar Main Gate (In/Out)',
    type: 'DUAL',
    coordinates: { longitude: 81.7788, latitude: 16.9972 },
    capacityPerHour: 35000,
    currentFlowRatePerMin: 180,
    widthMeters: 14,
    isOpen: true,
  },
  {
    id: 'gate_kotilingala_north',
    name: 'Kotilingala North Exit Gate',
    type: 'EXIT',
    coordinates: { longitude: 81.7720, latitude: 17.0080 },
    capacityPerHour: 28000,
    currentFlowRatePerMin: 140,
    widthMeters: 12,
    isOpen: true,
  },
  {
    id: 'gate_south_temple',
    name: 'Markandeya Temple South Gate',
    type: 'EXIT',
    coordinates: { longitude: 81.7815, latitude: 16.9945 },
    capacityPerHour: 18000,
    currentFlowRatePerMin: 95,
    widthMeters: 10,
    isOpen: true,
  },
  {
    id: 'gate_arts_college_evac',
    name: 'Arts College Emergency Gate',
    type: 'EXIT',
    coordinates: { longitude: 81.7890, latitude: 17.0050 },
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
  private pointPrimitives: Cesium.PointPrimitiveCollection | null = null;
  private bottleneckEntities: Cesium.Entity[] = [];
  private densityEntities: Cesium.Entity[] = [];
  private onMetricsUpdate: ((metrics: CrowdMetrics) => void) | null = null;
  private lastMetricsTimestamp: number = 0;
  private animationFrameId: number | null = null;
  private lastFrameTime: number = performance.now();
  private viewer: Cesium.Viewer | null = null;

  constructor() {
    this.graph = createPushkarGhatPedestrianGraph();
  }

  public setViewer(viewer: Cesium.Viewer | null): void {
    this.cleanupCesiumPrimitives();
    this.viewer = viewer;
    if (viewer) {
      this.pointPrimitives = viewer.scene.primitives.add(new Cesium.PointPrimitiveCollection());
    }
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
    });
  }

  public clearEmergencyAlert(): void {
    this.isEmergencyAlertActive = false;
    this.alertStartTime = null;
    this.agents.forEach(agent => {
      agent.behaviorState = 'WALKING';
      agent.hasRespondedToAlert = false;
      agent.targetSpeed = this.ageProfiles[agent.ageGroup].baseSpeed;
    });
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
        behaviorState: 'WALKING',
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
        if (!agent.hasRespondedToAlert && agent.elapsedSinceAlert >= agent.reactionDelaySeconds) {
          agent.hasRespondedToAlert = true;
          agent.behaviorState = agent.requiresAssistance ? 'REQUESTING_ASSISTANCE' : 'RESPONDING_TO_EMERGENCY';
          
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
            : this.ageProfiles[agent.ageGroup].baseSpeed * 1.6;
        }
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

      primitive.show = true;
      primitive.position = Cesium.Cartesian3.fromDegrees(
        agent.position.longitude,
        agent.position.latitude,
        agent.position.height
      );

      const colorCss = agent.behaviorState === 'REQUESTING_ASSISTANCE' 
        ? '#ef4444' 
        : this.ageProfiles[agent.ageGroup].color;
      primitive.color = Cesium.Color.fromCssColorString(colorCss);
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
        coordinates: [81.7778, 16.9980],
      });
    }

    const metrics: CrowdMetrics = {
      totalActivePedestrians: activeAgents.length,
      evacuatedPedestrians: evacuatedAgents.length,
      byAgeGroup: byAge,
      averageWalkingSpeed: Number(avgSpeed.toFixed(2)),
      averageReactionDelay: Number(avgReaction.toFixed(2)),
      responsePercentage: Number(responsePct.toFixed(1)),
      assistanceRequiredCount: assistanceCount,
      currentDensityLevel: densityLevel,
      densityValue: densityVal,
      activeBottlenecks: bottlenecks,
      evacuationCompleteTimeSeconds: evacuatedAgents.length === this.agents.length && this.agents.length > 0 
        ? Math.max(...evacuatedAgents.map(a => a.evacuationTimeSeconds || 0)) 
        : null,
    };

    if (this.onMetricsUpdate) {
      this.onMetricsUpdate(metrics);
    }
  }

  public cleanupCesiumPrimitives(): void {
    if (this.pointPrimitives && this.viewer) {
      this.viewer.scene.primitives.remove(this.pointPrimitives);
      this.pointPrimitives = null;
    }
    this.bottleneckEntities.forEach(e => this.viewer?.entities.remove(e));
    this.bottleneckEntities = [];
  }

  public destroy(): void {
    this.pause();
    this.cleanupCesiumPrimitives();
    this.agents = [];
  }
}

export const crowdEngine = new CrowdSimulationEngine();
