import * as Cesium from 'cesium';
import { 
  VehicleType, 
  VehicleAgent, 
  RoadSegment, 
  TrafficMetrics, 
  CongestionLevel 
} from '../types/traffic';
import { createRajamahendravaramRoadGraph, AStarGraph } from './pathfinding';

export interface VehicleConfig {
  type: VehicleType;
  label: string;
  defaultSpeedKmph: number;
  lengthMeters: number;
  color: string;
  size: number;
  proportion: number;
}

export const VEHICLE_CONFIGS: Record<VehicleType, VehicleConfig> = {
  CAR: {
    type: 'CAR',
    label: 'Passenger Car',
    defaultSpeedKmph: 40,
    lengthMeters: 4.5,
    color: '#38bdf8', // Sky Blue
    size: 7,
    proportion: 0.40,
  },
  TWO_WHEELER: {
    type: 'TWO_WHEELER',
    label: 'Motorcycle / Scooter',
    defaultSpeedKmph: 45,
    lengthMeters: 2.0,
    color: '#34d399', // Emerald
    size: 5,
    proportion: 0.35,
  },
  BUS: {
    type: 'BUS',
    label: 'RTC / Pilgrim Bus',
    defaultSpeedKmph: 30,
    lengthMeters: 11.0,
    color: '#fbbf24', // Amber
    size: 11,
    proportion: 0.15,
  },
  EMERGENCY_AMBULANCE: {
    type: 'EMERGENCY_AMBULANCE',
    label: '108 Emergency Ambulance',
    defaultSpeedKmph: 65,
    lengthMeters: 5.5,
    color: '#ef4444', // Red
    size: 12,
    proportion: 0.05,
  },
  EMERGENCY_POLICE: {
    type: 'EMERGENCY_POLICE',
    label: 'Police Rapid Escort',
    defaultSpeedKmph: 60,
    lengthMeters: 4.8,
    color: '#6366f1', // Indigo
    size: 10,
    proportion: 0.05,
  },
};

export const DEFAULT_ROAD_SEGMENTS: RoadSegment[] = [
  {
    id: 'seg_kovvur_bridge',
    name: 'Road-cum-Rail Bridge (Kovvur to Rajahmundry)',
    speedLimitKmph: 50,
    lengthMeters: 2750,
    capacityVehicles: 70,
    currentVehicleCount: 0,
    congestionLevel: 'FREE_FLOW',
    coordinates: [
      [81.7580, 16.9825],
      [81.7710, 16.9915],
      [81.7840, 17.0005],
    ],
    isBridge: true,
  },
  {
    id: 'seg_riverfront_ghat_road',
    name: 'Riverfront Pushkar Ghat Road',
    speedLimitKmph: 35,
    lengthMeters: 1400,
    capacityVehicles: 45,
    currentVehicleCount: 0,
    congestionLevel: 'FREE_FLOW',
    coordinates: [
      [81.7840, 17.0005],
      [81.7795, 16.9950],
      [81.7770, 16.9920],
    ],
    isBridge: false,
  },
  {
    id: 'seg_kotilingala_corridor',
    name: 'Kotilingala Ghat North Corridor',
    speedLimitKmph: 40,
    lengthMeters: 1600,
    capacityVehicles: 50,
    currentVehicleCount: 0,
    congestionLevel: 'FREE_FLOW',
    coordinates: [
      [81.7840, 17.0005],
      [81.7750, 17.0080],
      [81.7710, 17.0120],
    ],
    isBridge: false,
  },
  {
    id: 'seg_railway_bypass',
    name: 'Railway Station Connecting Arterial',
    speedLimitKmph: 45,
    lengthMeters: 1800,
    capacityVehicles: 60,
    currentVehicleCount: 0,
    congestionLevel: 'FREE_FLOW',
    coordinates: [
      [81.7840, 17.0005],
      [81.7920, 16.9960],
      [81.7950, 16.9910],
    ],
    isBridge: false,
  },
  {
    id: 'seg_arts_college_ring',
    name: 'Arts College Ring Road & Evac Lane',
    speedLimitKmph: 50,
    lengthMeters: 2100,
    capacityVehicles: 65,
    currentVehicleCount: 0,
    congestionLevel: 'FREE_FLOW',
    coordinates: [
      [81.7840, 17.0005],
      [81.7910, 17.0070],
      [81.7960, 17.0140],
    ],
    isBridge: false,
  },
];

export class TrafficSimulationEngine {
  private isRunning: boolean = false;
  private simulationSpeed: number = 1.0;
  private graph: AStarGraph;
  private vehicles: VehicleAgent[] = [];
  private roadSegments: RoadSegment[] = [...DEFAULT_ROAD_SEGMENTS];
  private targetVehicleCount: number = 120;
  private viewer: Cesium.Viewer | null = null;
  private vehiclePrimitives: Cesium.PointPrimitiveCollection | null = null;
  private roadPolylineCollection: Cesium.PolylineCollection | null = null;
  private roadPolylines: Map<string, Cesium.Polyline> = new Map();
  private onMetricsUpdate: ((metrics: TrafficMetrics) => void) | null = null;
  private lastMetricsTimestamp: number = 0;
  private animationFrameId: number | null = null;
  private lastFrameTime: number = performance.now();
  private sirenFlashToggle: boolean = false;
  private lastSirenFlashTime: number = 0;

  constructor() {
    this.graph = createRajamahendravaramRoadGraph();
  }

  public setViewer(viewer: Cesium.Viewer | null): void {
    this.cleanupCesiumPrimitives();
    this.viewer = viewer;
    if (viewer) {
      this.vehiclePrimitives = viewer.scene.primitives.add(new Cesium.PointPrimitiveCollection());
      this.roadPolylineCollection = viewer.scene.primitives.add(new Cesium.PolylineCollection());
      this.initRoadPolylines();
    }
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    if (this.vehicles.length === 0) {
      this.initializeVehicles(this.targetVehicleCount);
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

  public reset(seed: number = 101): void {
    this.pause();
    this.initializeVehicles(this.targetVehicleCount, seed);
    this.renderVehiclesToCesium();
    this.updateSegmentCongestion();
    this.updateMetrics();
  }

  public setVehicleCount(count: number): void {
    this.targetVehicleCount = Math.max(20, Math.min(350, count));
    this.reset();
  }

  public setSpeed(speed: number): void {
    this.simulationSpeed = Math.max(0.25, Math.min(5.0, speed));
  }

  public setOnMetricsUpdate(cb: (metrics: TrafficMetrics) => void): void {
    this.onMetricsUpdate = cb;
  }

  /**
   * Spawns an emergency ambulance at Kovvur Bridge entry that races toward Pushkar Ghat
   */
  public dispatchEmergencyAmbulance(): VehicleAgent {
    const startNode = this.graph.nodes.get('kovvur_bridge_entry')!;
    const path = this.graph.findPath('kovvur_bridge_entry', 'pushkar_ghat_road_south');

    const ambulance: VehicleAgent = {
      id: `emergency_amb_${Date.now()}`,
      type: 'EMERGENCY_AMBULANCE',
      position: {
        longitude: startNode.coordinates[0],
        latitude: startNode.coordinates[1],
        height: startNode.elevation + 2.0,
      },
      heading: 45,
      speed: 65,
      targetSpeed: 75,
      isEmergency: true,
      sirenActive: true,
      currentRoadId: 'seg_kovvur_bridge',
      currentSegmentIndex: 0,
      path,
      progressPct: 0,
      hasArrived: false,
    };

    this.vehicles.unshift(ambulance);
    this.rebuildCesiumPrimitives();
    return ambulance;
  }

  /**
   * Initialize vehicle fleet deterministically
   */
  public initializeVehicles(count: number, seed: number = 101): void {
    this.vehicles = [];
    let currentSeed = seed;

    const pseudoRandom = () => {
      currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296;
      return currentSeed / 4294967296;
    };

    const nodeIds = Array.from(this.graph.nodes.keys());

    for (let i = 0; i < count; i++) {
      const r = pseudoRandom();
      let type: VehicleType = 'CAR';
      if (r < 0.40) type = 'CAR';
      else if (r < 0.75) type = 'TWO_WHEELER';
      else if (r < 0.90) type = 'BUS';
      else if (r < 0.95) type = 'EMERGENCY_AMBULANCE';
      else type = 'EMERGENCY_POLICE';

      const config = VEHICLE_CONFIGS[type];
      const isEmergency = type === 'EMERGENCY_AMBULANCE' || type === 'EMERGENCY_POLICE';

      // Pick random start and end nodes
      const startIdx = Math.floor(pseudoRandom() * nodeIds.length);
      let endIdx = Math.floor(pseudoRandom() * nodeIds.length);
      if (endIdx === startIdx) endIdx = (startIdx + 1) % nodeIds.length;

      const startNodeId = nodeIds[startIdx];
      const endNodeId = nodeIds[endIdx];
      const startNode = this.graph.nodes.get(startNodeId)!;

      const path = this.graph.findPath(startNodeId, endNodeId);
      const roadId = this.roadSegments[Math.floor(pseudoRandom() * this.roadSegments.length)].id;

      // Slight lane lateral offset
      const laneOffset = (pseudoRandom() - 0.5) * 0.00015;

      this.vehicles.push({
        id: `veh_${i + 1}`,
        type,
        position: {
          longitude: startNode.coordinates[0] + laneOffset,
          latitude: startNode.coordinates[1] + laneOffset,
          height: startNode.elevation + (type === 'BUS' ? 2.5 : 1.5),
        },
        heading: 0,
        speed: config.defaultSpeedKmph * (0.8 + pseudoRandom() * 0.4),
        targetSpeed: config.defaultSpeedKmph,
        isEmergency,
        sirenActive: isEmergency,
        currentRoadId: roadId,
        currentSegmentIndex: 0,
        path,
        progressPct: 0,
        hasArrived: false,
      });
    }

    this.rebuildCesiumPrimitives();
  }

  private loop = (): void => {
    if (!this.isRunning) return;

    const now = performance.now();
    const dt = Math.min(0.1, (now - this.lastFrameTime) / 1000) * this.simulationSpeed;
    this.lastFrameTime = now;

    // Siren toggle flash ~4Hz
    if (now - this.lastSirenFlashTime > 250) {
      this.sirenFlashToggle = !this.sirenFlashToggle;
      this.lastSirenFlashTime = now;
    }

    this.updateVehicles(dt);
    this.renderVehiclesToCesium();

    if (now - this.lastMetricsTimestamp > 500) {
      this.lastMetricsTimestamp = now;
      this.updateSegmentCongestion();
      this.updateMetrics();
      this.updateRoadPolylineColors();
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private updateVehicles(dt: number): void {
    // Check if any emergency vehicle with active siren is moving
    const activeEmergencies = this.vehicles.filter(v => v.isEmergency && v.sirenActive && !v.hasArrived);

    this.vehicles.forEach(vehicle => {
      if (vehicle.hasArrived) return;

      const config = VEHICLE_CONFIGS[vehicle.type];

      // Yield logic: Non-emergency vehicles yield if emergency vehicle is nearby
      if (!vehicle.isEmergency && activeEmergencies.length > 0) {
        let isNearEmergency = false;
        for (const em of activeEmergencies) {
          const dLon = em.position.longitude - vehicle.position.longitude;
          const dLat = em.position.latitude - vehicle.position.latitude;
          const d2 = dLon * dLon + dLat * dLat;
          if (d2 < 0.0008 * 0.0008) { // within ~90m
            isNearEmergency = true;
            break;
          }
        }
        if (isNearEmergency) {
          // Slow down to yield corridor
          vehicle.targetSpeed = config.defaultSpeedKmph * 0.35;
        } else {
          vehicle.targetSpeed = config.defaultSpeedKmph;
        }
      }

      // Smooth acceleration
      const accel = vehicle.isEmergency ? 15.0 : 8.0;
      vehicle.speed += (vehicle.targetSpeed - vehicle.speed) * Math.min(1.0, dt * accel);

      // Follow road path
      if (vehicle.path.length > 0 && vehicle.currentSegmentIndex < vehicle.path.length) {
        const targetWaypoint = vehicle.path[vehicle.currentSegmentIndex];
        const dLon = targetWaypoint[0] - vehicle.position.longitude;
        const dLat = targetWaypoint[1] - vehicle.position.latitude;
        const dist = Math.sqrt(dLon * dLon + dLat * dLat);

        const waypointTolerance = 0.00015; // ~15m

        if (dist < waypointTolerance) {
          vehicle.currentSegmentIndex++;
          if (vehicle.currentSegmentIndex >= vehicle.path.length) {
            // Reached destination, reverse route for continuous simulation
            vehicle.path.reverse();
            vehicle.currentSegmentIndex = 0;
          }
        } else {
          // Move along segment (speed in km/h -> m/s)
          const speedMps = (vehicle.speed * 1000) / 3600;
          const moveDistDeg = (speedMps * dt) / 111000;
          const dirX = dLon / dist;
          const dirY = dLat / dist;

          vehicle.position.longitude += dirX * moveDistDeg;
          vehicle.position.latitude += dirY * moveDistDeg;

          // Heading in degrees
          vehicle.heading = ((Math.atan2(dirX, dirY) * 180) / Math.PI + 360) % 360;
        }
      }
    });
  }

  private initRoadPolylines(): void {
    if (!this.roadPolylineCollection) return;
    this.roadPolylineCollection.removeAll();
    this.roadPolylines.clear();

    this.roadSegments.forEach(seg => {
      const positions = seg.coordinates.map(coord => 
        Cesium.Cartesian3.fromDegrees(coord[0], coord[1], 15)
      );

      const polyline = this.roadPolylineCollection!.add({
        positions,
        width: seg.isBridge ? 6 : 4,
        material: Cesium.Material.fromType('Color', {
          color: Cesium.Color.fromCssColorString('#10b981').withAlpha(0.75),
        }),
      });

      this.roadPolylines.set(seg.id, polyline);
    });
  }

  private updateRoadPolylineColors(): void {
    this.roadSegments.forEach(seg => {
      const poly = this.roadPolylines.get(seg.id);
      if (!poly) return;

      let colorStr = '#10b981'; // Green (Free flow)
      if (seg.congestionLevel === 'MODERATE') colorStr = '#eab308'; // Amber
      else if (seg.congestionLevel === 'HEAVY') colorStr = '#f97316'; // Orange
      else if (seg.congestionLevel === 'BLOCKED') colorStr = '#ef4444'; // Red

      (poly as any).material.uniforms.color = Cesium.Color.fromCssColorString(colorStr).withAlpha(0.85);
    });
  }

  private updateSegmentCongestion(): void {
    // Reset counts
    this.roadSegments.forEach(s => s.currentVehicleCount = 0);

    // Assign vehicles to nearest road segment
    this.vehicles.forEach(v => {
      let bestSeg = this.roadSegments[0];
      let bestDist = Infinity;

      this.roadSegments.forEach(seg => {
        seg.coordinates.forEach(c => {
          const d2 = (c[0] - v.position.longitude) ** 2 + (c[1] - v.position.latitude) ** 2;
          if (d2 < bestDist) {
            bestDist = d2;
            bestSeg = seg;
          }
        });
      });

      bestSeg.currentVehicleCount++;
    });

    // Update congestion level based on volume / capacity ratio
    this.roadSegments.forEach(seg => {
      const ratio = seg.currentVehicleCount / Math.max(1, seg.capacityVehicles);
      if (ratio > 0.85) seg.congestionLevel = 'BLOCKED';
      else if (ratio > 0.60) seg.congestionLevel = 'HEAVY';
      else if (ratio > 0.35) seg.congestionLevel = 'MODERATE';
      else seg.congestionLevel = 'FREE_FLOW';
    });
  }

  private rebuildCesiumPrimitives(): void {
    if (!this.viewer || !this.vehiclePrimitives) return;
    this.vehiclePrimitives.removeAll();

    this.vehicles.forEach(vehicle => {
      const config = VEHICLE_CONFIGS[vehicle.type];
      this.vehiclePrimitives!.add({
        position: Cesium.Cartesian3.fromDegrees(
          vehicle.position.longitude,
          vehicle.position.latitude,
          vehicle.position.height
        ),
        pixelSize: config.size,
        color: Cesium.Color.fromCssColorString(config.color),
        outlineColor: Cesium.Color.WHITE.withAlpha(0.8),
        outlineWidth: 1.5,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      });
    });
  }

  private renderVehiclesToCesium(): void {
    if (!this.vehiclePrimitives) return;

    for (let i = 0; i < this.vehicles.length; i++) {
      const vehicle = this.vehicles[i];
      const primitive = this.vehiclePrimitives.get(i);
      if (!primitive) continue;

      primitive.position = Cesium.Cartesian3.fromDegrees(
        vehicle.position.longitude,
        vehicle.position.latitude,
        vehicle.position.height
      );

      // Flashing siren for emergency vehicle
      if (vehicle.isEmergency && vehicle.sirenActive) {
        const sirenColor = this.sirenFlashToggle ? '#ef4444' : '#38bdf8';
        primitive.color = Cesium.Color.fromCssColorString(sirenColor);
        primitive.pixelSize = this.sirenFlashToggle ? 13 : 9;
      } else {
        primitive.color = Cesium.Color.fromCssColorString(VEHICLE_CONFIGS[vehicle.type].color);
      }
    }
  }

  private updateMetrics(): void {
    const byType: Record<VehicleType, number> = {
      CAR: 0,
      BUS: 0,
      EMERGENCY_AMBULANCE: 0,
      EMERGENCY_POLICE: 0,
      TWO_WHEELER: 0,
    };

    let totalSpeed = 0;
    let emergencyCount = 0;

    this.vehicles.forEach(v => {
      byType[v.type]++;
      totalSpeed += v.speed;
      if (v.isEmergency && v.sirenActive) emergencyCount++;
    });

    const avgSpeed = this.vehicles.length > 0 ? totalSpeed / this.vehicles.length : 0;
    const congestedSegments = this.roadSegments.filter(s => s.congestionLevel === 'HEAVY' || s.congestionLevel === 'BLOCKED');

    const bridgeSegment = this.roadSegments.find(s => s.isBridge);
    const bridgeVolume = bridgeSegment ? bridgeSegment.currentVehicleCount : 0;

    let overall: CongestionLevel = 'FREE_FLOW';
    if (congestedSegments.length >= 2) overall = 'BLOCKED';
    else if (congestedSegments.length === 1) overall = 'HEAVY';
    else if (this.roadSegments.some(s => s.congestionLevel === 'MODERATE')) overall = 'MODERATE';

    const metrics: TrafficMetrics = {
      totalActiveVehicles: this.vehicles.length,
      byType,
      averageSpeedKmph: Number(avgSpeed.toFixed(1)),
      congestedSegmentsCount: congestedSegments.length,
      emergencyVehiclesActive: emergencyCount,
      overallCongestionLevel: overall,
      bridgeTrafficVolume: bridgeVolume,
    };

    if (this.onMetricsUpdate) {
      this.onMetricsUpdate(metrics);
    }
  }

  public cleanupCesiumPrimitives(): void {
    if (this.vehiclePrimitives && this.viewer) {
      this.viewer.scene.primitives.remove(this.vehiclePrimitives);
      this.vehiclePrimitives = null;
    }
    if (this.roadPolylineCollection && this.viewer) {
      this.viewer.scene.primitives.remove(this.roadPolylineCollection);
      this.roadPolylineCollection = null;
      this.roadPolylines.clear();
    }
  }

  public destroy(): void {
    this.pause();
    this.cleanupCesiumPrimitives();
    this.vehicles = [];
  }
}

export const trafficEngine = new TrafficSimulationEngine();
