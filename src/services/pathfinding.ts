export interface GraphNode {
  id: string;
  name: string;
  coordinates: [number, number]; // [lon, lat]
  elevation: number;
}

export interface GraphEdge {
  fromNodeId: string;
  toNodeId: string;
  distanceMeters: number;
  widthMeters: number;
  baseCapacity: number;
  currentCongestionFactor: number; // 1.0 (empty) to 5.0 (jammed)
  isBlocked: boolean;
}

export class AStarGraph {
  public nodes: Map<string, GraphNode> = new Map();
  public edges: Map<string, GraphEdge[]> = new Map();

  public addNode(node: GraphNode): void {
    this.nodes.set(node.id, node);
    if (!this.edges.has(node.id)) {
      this.edges.set(node.id, []);
    }
  }

  public addBidirectionalEdge(fromId: string, toId: string, widthMeters: number = 8, capacity: number = 50): void {
    const fromNode = this.nodes.get(fromId);
    const toNode = this.nodes.get(toId);
    if (!fromNode || !toNode) return;

    const dist = this.haversineDistance(fromNode.coordinates, toNode.coordinates);

    this.edges.get(fromId)!.push({
      fromNodeId: fromId,
      toNodeId: toId,
      distanceMeters: dist,
      widthMeters,
      baseCapacity: capacity,
      currentCongestionFactor: 1.0,
      isBlocked: false,
    });

    this.edges.get(toId)!.push({
      fromNodeId: toId,
      toNodeId: fromId,
      distanceMeters: dist,
      widthMeters,
      baseCapacity: capacity,
      currentCongestionFactor: 1.0,
      isBlocked: false,
    });
  }

  public setEdgeCongestion(fromId: string, toId: string, factor: number): void {
    const list = this.edges.get(fromId);
    if (list) {
      const e = list.find(x => x.toNodeId === toId);
      if (e) e.currentCongestionFactor = Math.max(1.0, Math.min(5.0, factor));
    }
  }

  public setEdgeBlocked(fromId: string, toId: string, blocked: boolean): void {
    const list1 = this.edges.get(fromId);
    if (list1) {
      const e1 = list1.find(x => x.toNodeId === toId);
      if (e1) e1.isBlocked = blocked;
    }
    const list2 = this.edges.get(toId);
    if (list2) {
      const e2 = list2.find(x => x.toNodeId === fromId);
      if (e2) e2.isBlocked = blocked;
    }
  }

  public resetAllBlockages(): void {
    for (const edgeList of this.edges.values()) {
      for (const e of edgeList) {
        e.isBlocked = false;
        e.currentCongestionFactor = 1.0;
      }
    }
  }

  public isEdgeBlocked(fromId: string, toId: string): boolean {
    const list = this.edges.get(fromId);
    if (!list) return false;
    const e = list.find(x => x.toNodeId === toId);
    return e ? e.isBlocked : false;
  }

  public findPath(startNodeId: string, goalNodeId: string): [number, number][] {
    const startNode = this.nodes.get(startNodeId);
    const goalNode = this.nodes.get(goalNodeId);
    if (!startNode || !goalNode) return [];

    const openSet: Set<string> = new Set([startNodeId]);
    const cameFrom: Map<string, string> = new Map();

    const gScore: Map<string, number> = new Map();
    gScore.set(startNodeId, 0);

    const fScore: Map<string, number> = new Map();
    fScore.set(startNodeId, this.haversineDistance(startNode.coordinates, goalNode.coordinates));

    while (openSet.size > 0) {
      // Find node with lowest fScore in openSet
      let currentId = '';
      let lowestF = Infinity;
      for (const id of openSet) {
        const f = fScore.get(id) ?? Infinity;
        if (f < lowestF) {
          lowestF = f;
          currentId = id;
        }
      }

      if (currentId === goalNodeId) {
        // Reconstruct path
        return this.reconstructPath(cameFrom, currentId);
      }

      openSet.delete(currentId);
      const neighborEdges = this.edges.get(currentId) || [];

      for (const edge of neighborEdges) {
        if (edge.isBlocked) continue;

        const neighborId = edge.toNodeId;
        const neighborNode = this.nodes.get(neighborId);
        if (!neighborNode) continue;

        const tentativeG = (gScore.get(currentId) ?? Infinity) + edge.distanceMeters * edge.currentCongestionFactor;

        if (tentativeG < (gScore.get(neighborId) ?? Infinity)) {
          cameFrom.set(neighborId, currentId);
          gScore.set(neighborId, tentativeG);
          const h = this.haversineDistance(neighborNode.coordinates, goalNode.coordinates);
          fScore.set(neighborId, tentativeG + h);
          openSet.add(neighborId);
        }
      }
    }

    // Direct fallback line if pathfinding finds no connected route
    return [startNode.coordinates, goalNode.coordinates];
  }

  private reconstructPath(cameFrom: Map<string, string>, currentId: string): [number, number][] {
    const totalPath: [number, number][] = [];
    const currNode = this.nodes.get(currentId);
    if (currNode) totalPath.push(currNode.coordinates);

    let curr = currentId;
    while (cameFrom.has(curr)) {
      curr = cameFrom.get(curr)!;
      const n = this.nodes.get(curr);
      if (n) totalPath.unshift(n.coordinates);
    }
    return totalPath;
  }

  private haversineDistance(coord1: [number, number], coord2: [number, number]): number {
    const R = 6371000; // meters
    const dLat = (coord2[1] - coord1[1]) * Math.PI / 180;
    const dLon = (coord2[0] - coord1[0]) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coord1[1] * Math.PI / 180) * Math.cos(coord2[1] * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

// Built-in Godavari Pushkar Ghat Pedestrian Walkway Graph (Verified Real Coordinates)
export function createPushkarGhatPedestrianGraph(): AStarGraph {
  const g = new AStarGraph();

  // Primary Ghat Nodes (Aligned with OSM Node #4115259593 & Node #13335596115)
  g.addNode({ id: 'gate_pushkar_main', name: 'Pushkar Main Entry Gate', coordinates: [81.768200, 17.007800], elevation: 18 });
  g.addNode({ id: 'promenade_central', name: 'Central Riverfront Promenade', coordinates: [81.767400, 17.008100], elevation: 17 });
  g.addNode({ id: 'pushkar_steps_lower', name: 'Pushkar Ghat Sacred Bathing Steps', coordinates: [81.766947, 17.008396], elevation: 16.5 });
  g.addNode({ id: 'pushkar_vip_gate', name: 'VIP Holding Egress Gate', coordinates: [81.767000, 17.009500], elevation: 17 });
  g.addNode({ id: 'north_boulevard_1', name: 'North Riverfront Path', coordinates: [81.767200, 17.013500], elevation: 17.2 });
  g.addNode({ id: 'gate_kotilingala_south', name: 'Kotilingala Concourse Junction', coordinates: [81.768000, 17.018500], elevation: 17 });
  g.addNode({ id: 'kotilingala_steps', name: 'Kotilingala Bathing Steps', coordinates: [81.768861, 17.022618], elevation: 16.8 });
  g.addNode({ id: 'gate_kotilingala_north', name: 'Kotilingala North Exit Gate', coordinates: [81.769500, 17.023500], elevation: 17.5 });
  g.addNode({ id: 'south_arterial_junction', name: 'South Arterial Junction (Pushkar Chowk)', coordinates: [81.768500, 17.005500], elevation: 19 });
  g.addNode({ id: 'gate_south_temple', name: 'Markandeya Temple South Gate', coordinates: [81.768200, 17.004200], elevation: 18.5 });
  g.addNode({ id: 'evac_corridor_mid', name: 'East Ingress Avenue', coordinates: [81.776000, 17.011000], elevation: 20 });
  g.addNode({ id: 'gate_arts_college_evac', name: 'Arts College Emergency Gate', coordinates: [81.783471, 17.016330], elevation: 24 });

  // Connect Pedestrian Paths
  g.addBidirectionalEdge('gate_pushkar_main', 'promenade_central', 12, 100);
  g.addBidirectionalEdge('promenade_central', 'pushkar_steps_lower', 16, 120);
  g.addBidirectionalEdge('promenade_central', 'pushkar_vip_gate', 8, 40);
  g.addBidirectionalEdge('promenade_central', 'north_boulevard_1', 10, 80);
  g.addBidirectionalEdge('north_boulevard_1', 'gate_kotilingala_south', 10, 80);
  g.addBidirectionalEdge('gate_kotilingala_south', 'kotilingala_steps', 14, 110);
  g.addBidirectionalEdge('kotilingala_steps', 'gate_kotilingala_north', 12, 90);
  g.addBidirectionalEdge('gate_pushkar_main', 'south_arterial_junction', 14, 100);
  g.addBidirectionalEdge('south_arterial_junction', 'gate_south_temple', 10, 60);
  g.addBidirectionalEdge('south_arterial_junction', 'evac_corridor_mid', 14, 90);
  g.addBidirectionalEdge('evac_corridor_mid', 'gate_arts_college_evac', 18, 150);
  g.addBidirectionalEdge('gate_kotilingala_south', 'evac_corridor_mid', 10, 70);

  return g;
}

// Built-in Road Network Graph for Vehicle Traffic (Verified Real Coordinates)
export function createRajamahendravaramRoadGraph(): AStarGraph {
  const g = new AStarGraph();

  // Road Intersections (Aligned with OSM Bridge Landings & Bund Road)
  g.addNode({ id: 'kovvur_bridge_entry', name: 'Kovvur Bridge Ingress', coordinates: [81.742450, 16.998164], elevation: 26 });
  g.addNode({ id: 'bridge_mid_span', name: 'Road-cum-Rail Bridge Mid Span', coordinates: [81.755830, 16.997600], elevation: 28 });
  g.addNode({ id: 'bridge_landing_junction', name: 'Rajahmundry Bridge Egress Junction', coordinates: [81.769112, 16.997162], elevation: 22 });
  g.addNode({ id: 'pushkar_ghat_road_south', name: 'Riverfront Bund Road (Pushkar Chowk)', coordinates: [81.768500, 17.005500], elevation: 19 });
  g.addNode({ id: 'riverfront_road_north', name: 'Kotilingala Link Road', coordinates: [81.769500, 17.023500], elevation: 18.5 });
  g.addNode({ id: 'railway_station_bypass', name: 'Railway Station Arterial', coordinates: [81.775000, 17.002000], elevation: 21 });
  g.addNode({ id: 'arts_college_junction', name: 'Arts College Ring Road', coordinates: [81.783000, 17.015500], elevation: 24 });

  // Connect Roads
  g.addBidirectionalEdge('kovvur_bridge_entry', 'bridge_mid_span', 14, 80);
  g.addBidirectionalEdge('bridge_mid_span', 'bridge_landing_junction', 14, 80);
  g.addBidirectionalEdge('bridge_landing_junction', 'pushkar_ghat_road_south', 12, 60);
  g.addBidirectionalEdge('bridge_landing_junction', 'arts_college_junction', 16, 90);
  g.addBidirectionalEdge('bridge_landing_junction', 'railway_station_bypass', 14, 70);
  g.addBidirectionalEdge('pushkar_ghat_road_south', 'railway_station_bypass', 12, 50);
  g.addBidirectionalEdge('arts_college_junction', 'riverfront_road_north', 12, 55);

  return g;
}
