/**
 * Module 3: AI Resource Allocation Optimizer
 * Godavari Pushkar Ghat 3D Digital Twin – Rajamahendravaram
 * 
 * Features:
 * - Multi-Criteria Decision Analysis (MCDA) mathematical ranking
 * - Factors: Incident Priority, Category Compatibility, Availability, Workload, Distance/ETA, Zone Deficits
 * - Generates ranked candidate recommendations with heuristic justifications
 * - Fully integrated with dispatchEngine data models
 * - Strictly enforces human-in-the-loop: Zero automated dispatch without explicit Commander authorization
 */

import { 
  ResourceAllocationPlan, 
  ResourceCandidateRecommendation, 
  MCDAScoreBreakdown 
} from '../types/predictive';
import { eventOperationsEngine } from '../../services/eventOperationsEngine';
import { emergencyEngine } from '../../services/emergencyDetectionEngine';
import { EmergencyIncident } from '../../types/emergency';
import { EventResource } from '../../types/operations';

export interface MCDAWeights {
  incidentPriority: number; // default: 0.25
  categoryMatch: number;    // default: 0.25
  availability: number;     // default: 0.15
  workload: number;         // default: 0.10
  distanceTime: number;     // default: 0.15
  zoneDeficit: number;      // default: 0.10
}

export const DEFAULT_MCDA_WEIGHTS: MCDAWeights = {
  incidentPriority: 0.25,
  categoryMatch: 0.25,
  availability: 0.15,
  workload: 0.10,
  distanceTime: 0.15,
  zoneDeficit: 0.10
};

export class ResourceAllocationOptimizer {
  private weights: MCDAWeights = { ...DEFAULT_MCDA_WEIGHTS };

  public updateWeights(newWeights: Partial<MCDAWeights>): void {
    this.weights = { ...this.weights, ...newWeights };
  }

  /**
   * Calculate Haversine distance in meters between two GPS coordinates
   */
  public calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  /**
   * Generate an optimized allocation plan for all active incidents
   */
  public generateAllocationPlan(targetIncidentId?: string): ResourceAllocationPlan {
    const incidents = emergencyEngine.getIncidents();
    const resources = eventOperationsEngine.getResources();
    const recommendations: ResourceCandidateRecommendation[] = [];

    const activeIncidents = targetIncidentId 
      ? incidents.filter(i => i.id === targetIncidentId)
      : incidents.filter(i => (i.status === 'ACTIVE' || i.status === 'ACKNOWLEDGED') && ((i.assignedResourceIds?.length || 0) === 0));

    // If no incidents exist, create a mock pending scenario candidate to ensure plan readiness
    const incidentList: EmergencyIncident[] = activeIncidents.length > 0 ? activeIncidents : [
      {
        id: 'INC-SIM-RESERVE-01',
        title: 'Crowd Pressure at Pushkar Ghat Sacred Steps',
        type: 'CROWD_CRUSH',
        severity: 'HIGH',
        status: 'ACTIVE',
        coordinates: [81.7669, 17.0084, 16],
        affectedZoneId: 'zone-pushkar-ghat',
        timestamp: new Date().toISOString(),
        affectedPopulation: 120,
        description: 'Simulated crowd congestion on lower steps requiring quick crowd management response.',
        assignedResourceIds: []
      }
    ];

    incidentList.forEach(incident => {
      const candidates = this.rankResourcesForIncident(incident, resources);
      if (candidates.length > 0) {
        recommendations.push(...candidates.slice(0, 3)); // top 3 candidates per incident
      }
    });

    const summary = recommendations.length > 0
      ? `Ranked ${recommendations.length} resource deployment candidates for ${incidentList.length} incident(s). Top candidate: ${recommendations[0].resourceName} (Score: ${recommendations[0].suitabilityScore}/100, ETA: ${recommendations[0].estimatedTravelTimeMinutes} mins).`
      : 'All operational resources currently deployed or optimal distribution maintained.';

    return {
      planId: `PLAN-ALLOC-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      totalRecommendations: recommendations.length,
      recommendations,
      dataClassification: 'AI_INFERRED',
      humanApprovalRequirement: {
        requiresApproval: true,
        actionType: 'RESOURCE_REALLOCATION',
        actionTitle: 'Authorize Recommended Resource Dispatch Plan',
        rationale: 'MCDA optimization identified fastest-responding standby units. Automated deployment is held pending human Commander authorization.',
        approvalStatus: 'PENDING',
        details: recommendations.slice(0, 2).map(r => `${r.resourceName} -> ${r.targetZoneId} (${r.estimatedTravelTimeMinutes} min ETA)`).join(' | ')
      },
      summary
    };
  }

  /**
   * Rank all eligible resources for a specific incident using MCDA
   */
  public rankResourcesForIncident(incident: EmergencyIncident, resources: EventResource[]): ResourceCandidateRecommendation[] {
    const candidates: ResourceCandidateRecommendation[] = [];
    const zones = eventOperationsEngine.getZones();
    const incZone = zones.find(z => z.id === incident.affectedZoneId) || zones[0];
    const incLat = incident.coordinates[1];
    const incLon = incident.coordinates[0];

    // Priority Score (0 to 100)
    const priorityScore = incident.severity === 'CRITICAL' ? 100 : incident.severity === 'HIGH' ? 80 : incident.severity === 'MODERATE' ? 55 : 30;

    resources.forEach(res => {
      // 1. Category Compatibility Score (0 to 100)
      let catScore = 30;
      const resCat = res.category.toUpperCase();
      const incType = incident.type.toUpperCase();

      if (incType.includes('MEDICAL') || incType.includes('HEAT') || incType.includes('INJURY')) {
        catScore = (resCat === 'MEDICAL' || resCat === 'AMBULANCE') ? 100 : resCat === 'VOLUNTEER' ? 60 : 40;
      } else if (incType.includes('FIRE') || incType.includes('HAZARD')) {
        catScore = resCat === 'FIRE_RESCUE' ? 100 : resCat === 'POLICE' ? 70 : 30;
      } else if (incType.includes('DROWNING') || incType.includes('WATER') || incType.includes('RIVER')) {
        catScore = (resCat === 'SDRF_BOAT' || res.name.toLowerCase().includes('boat') || resCat === 'FIRE_RESCUE') ? 100 : 40;
      } else {
        // CROWD_CONGESTION, STAMPEDE, BARRICADE_BREACH
        catScore = (resCat === 'POLICE' || resCat === 'VOLUNTEER') ? 100 : resCat === 'AMBULANCE' ? 75 : 60;
      }

      // 2. Availability Score (0 to 100)
      const availScore = res.status === 'AVAILABLE' ? 100 : res.status === 'BUSY' ? 25 : 0;

      // 3. Workload Score (0 to 100)
      const workloadScore = res.status === 'AVAILABLE' ? 95 : 20;

      // 4. Distance & Travel Time Score
      const distMeters = this.calculateDistanceMeters(
        res.coordinates.latitude,
        res.coordinates.longitude,
        incLat,
        incLon
      );
      // Average field response velocity: 5 m/s (~18 km/h on crowded riverfront roads)
      const travelMins = Number(((distMeters / (5 * 60)) + 1.2).toFixed(1)); // +1.2 min mobilization
      // Inverse distance score: 0m = 100, 2000m = 20
      const distScore = Math.max(10, Math.min(100, Math.round(100 - (distMeters / 25))));

      // 5. Zone Deficit Score
      const resZone = zones.find(z => z.assignedResourceIds.includes(res.id));
      const zoneDeficitScore = resZone && resZone.id !== incZone.id ? 80 : 95;

      // Composite MCDA Calculation
      const composite = Number((
        this.weights.incidentPriority * priorityScore +
        this.weights.categoryMatch * catScore +
        this.weights.availability * availScore +
        this.weights.workload * workloadScore +
        this.weights.distanceTime * distScore +
        this.weights.zoneDeficit * zoneDeficitScore
      ).toFixed(1));

      const mcdaBreakdown: MCDAScoreBreakdown = {
        incidentPriorityScore: priorityScore,
        categoryMatchScore: catScore,
        availabilityScore: availScore,
        workloadScore: workloadScore,
        distanceTravelTimeScore: distScore,
        zoneDeficitScore,
        totalCompositeScore: composite
      };

      const justification = `${res.name} scored ${composite}/100. Category match: ${catScore}%. Located ${distMeters}m away (ETA ~${travelMins} mins). Status: ${res.status}.`;

      candidates.push({
        resourceId: res.id,
        resourceName: res.name,
        category: res.category,
        currentZoneId: resZone?.id || 'zone-staging',
        currentZoneName: resZone?.name || 'General Command Staging',
        targetIncidentId: incident.id,
        targetZoneId: incZone.id,
        distanceMeters: distMeters,
        estimatedTravelTimeMinutes: travelMins,
        suitabilityScore: composite,
        mcdaBreakdown,
        recommendationRank: 1, // Will be sorted and updated below
        heuristicJustification: justification
      });
    });

    // Sort descending by suitability score
    candidates.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
    candidates.forEach((c, idx) => {
      c.recommendationRank = idx + 1;
    });

    return candidates;
  }
}

export const resourceAllocationOptimizer = new ResourceAllocationOptimizer();
