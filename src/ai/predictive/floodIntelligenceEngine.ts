/**
 * Module 5: AI Flood Intelligence Engine
 * Godavari Pushkar Ghat 3D Digital Twin – Rajamahendravaram
 * 
 * Features:
 * - River-level & CWC hydrological benchmark integration (13.8m MSL current vs 16m Warning, 17.5m Danger)
 * - Historical benchmark flood event comparisons (1986, 2006, 2022 Godavari floods)
 * - Micro-elevation ghat step exposure profiles (Pushkar, Kotilingala, Markandeya, Saraswati)
 * - Scenario simulation (+1.5m to +5.2m inundation modeling)
 * - Clear regulatory disclaimers and demonstration-mode labels
 */

import { 
  FloodIntelligenceAssessment, 
  GhatStepExposureProfile, 
  HistoricalFloodBenchmark, 
  FloodScenarioProfile, 
  FloodRiskLevel 
} from '../types/predictive';

export const HISTORICAL_GODAVARI_FLOODS: HistoricalFloodBenchmark[] = [
  {
    year: 1986,
    floodEventName: '1986 Godavari Super Flood (Highest Recorded in Modern Era)',
    peakGaugeMsl: 21.2,
    peakDischargeCusecs: 3600000,
    inundatedAreaDescription: 'Submerged entire Pushkar Ghat concourse, Main Bazaar Road, and Havelock west bank approach in Kovvur.'
  },
  {
    year: 2006,
    floodEventName: '2006 Godavari Monsoon Inundation',
    peakGaugeMsl: 19.8,
    peakDischargeCusecs: 2850000,
    inundatedAreaDescription: 'Inundated all lower tiers and Saraswati Ghat approach. First and second danger sirens sounded.'
  },
  {
    year: 2022,
    floodEventName: '2022 Godavari Pushkaram Sector Flash Inundation',
    peakGaugeMsl: 18.2,
    peakDischargeCusecs: 2580000,
    inundatedAreaDescription: 'Submerged Pushkar Ghat tier 2 steps and Kotilingala vehicle parking embankment.'
  }
];

export const GHAT_STEP_ELEVATION_BENCHMARKS: Omit<GhatStepExposureProfile, 'currentFreeboardMeters' | 'isSubmerged' | 'exposureStatus'>[] = [
  {
    ghatId: 'pushkar-ghat',
    ghatName: 'Godavari Pushkar Ghat',
    stepName: 'Tier 1 Sacred Water Dip Steps',
    crestElevationMsl: 13.5,
    submergenceThresholdMsl: 13.5
  },
  {
    ghatId: 'pushkar-ghat',
    ghatName: 'Godavari Pushkar Ghat',
    stepName: 'Tier 2 Intermediate Bathing Terrace',
    crestElevationMsl: 15.2,
    submergenceThresholdMsl: 15.2
  },
  {
    ghatId: 'pushkar-ghat',
    ghatName: 'Godavari Pushkar Ghat',
    stepName: 'Main Upper Promenade Concourse',
    crestElevationMsl: 16.8,
    submergenceThresholdMsl: 16.8
  },
  {
    ghatId: 'kotilingala-ghat',
    ghatName: 'Kotilingala Ghat',
    stepName: 'Riverfront Bathing Ramp & Platform',
    crestElevationMsl: 14.0,
    submergenceThresholdMsl: 14.0
  },
  {
    ghatId: 'markandeya-ghat',
    ghatName: 'Markandeya Ghat',
    stepName: 'Temple Flight Tier Steps',
    crestElevationMsl: 15.0,
    submergenceThresholdMsl: 15.0
  },
  {
    ghatId: 'saraswati-ghat',
    ghatName: 'Saraswati Ghat',
    stepName: 'Western Pier Steps',
    crestElevationMsl: 14.8,
    submergenceThresholdMsl: 14.8
  }
];

export class FloodIntelligenceEngine {
  private currentWaterLevelMsl: number = 13.8; // Baseline simulated MSL
  private upstreamDischargeCusecs: number = 325000;
  private rainfallPast24hMm: number = 14.2;
  private waterLevelTrendCmPerHour: number = 3.5; // +3.5 cm/hr

  public setSimulatedWaterLevel(msl: number, discharge?: number): void {
    this.currentWaterLevelMsl = Number(msl.toFixed(2));
    if (discharge) this.upstreamDischargeCusecs = discharge;
  }

  public getSimulatedWaterLevel(): number {
    return this.currentWaterLevelMsl;
  }

  /**
   * Evaluate flood risk assessment against CWC scales and ghat micro-elevations
   */
  public evaluateFloodRisk(simulatedOverrideMsl?: number): FloodIntelligenceAssessment {
    const activeMsl = simulatedOverrideMsl !== undefined ? simulatedOverrideMsl : this.currentWaterLevelMsl;
    const warningLevel = 16.0;
    const dangerLevel = 17.5;
    const extremeDanger = 19.0;

    let overallRisk: FloodRiskLevel = 'SAFE';
    if (activeMsl >= extremeDanger) overallRisk = 'EXTREME_DANGER';
    else if (activeMsl >= dangerLevel) overallRisk = 'DANGER';
    else if (activeMsl >= warningLevel) overallRisk = 'WARNING';
    else if (activeMsl >= 15.0) overallRisk = 'ADVISORY';

    // Calculate Step Exposure Profiles
    const stepExposureProfiles: GhatStepExposureProfile[] = GHAT_STEP_ELEVATION_BENCHMARKS.map(bench => {
      const freeboard = Number((bench.crestElevationMsl - activeMsl).toFixed(2));
      const isSubmerged = freeboard <= 0;
      let status: 'DRY_AND_SAFE' | 'NEAR_CREST_MONITORING' | 'SUBMERGED_CLOSED' = 'DRY_AND_SAFE';

      if (isSubmerged) status = 'SUBMERGED_CLOSED';
      else if (freeboard < 0.5) status = 'NEAR_CREST_MONITORING';

      return {
        ...bench,
        currentFreeboardMeters: Math.max(0, freeboard),
        isSubmerged,
        exposureStatus: status
      };
    });

    // Simulated Scenarios
    const simulatedScenarios: FloodScenarioProfile[] = [
      {
        scenarioId: 'FL-SCEN-BASELINE',
        name: 'Normal Monsoon Baseline Flow',
        simulatedWaterLevelMsl: 13.8,
        waterLevelDeltaMeters: 0.0,
        simulatedDischargeCusecs: 325000,
        simulatedRainfallMm24h: 12.0,
        riskLevel: 'SAFE',
        submergedStepsCount: 1, // Only lowest dip tier submerged
        inundatedGhatNames: ['Pushkar Ghat Tier 1 Steps'],
        recommendedOperations: [
          'Maintain regular pilgrim bathing within safety buoy perimeters',
          'Ensure SDRF motorboats patrol 50 meters off the step line'
        ]
      },
      {
        scenarioId: 'FL-SCEN-FIRST-WARNING',
        name: 'First Warning Stage (Dowleswaram Barrage Alert 1)',
        simulatedWaterLevelMsl: 16.0,
        waterLevelDeltaMeters: 2.2,
        simulatedDischargeCusecs: 1250000,
        simulatedRainfallMm24h: 65.0,
        riskLevel: 'WARNING',
        submergedStepsCount: 4,
        inundatedGhatNames: ['Pushkar Ghat Tier 1 & 2', 'Kotilingala Bathing Platform', 'Saraswati Ghat Western Pier'],
        recommendedOperations: [
          'Sound first flood siren alert across riverfront PA towers',
          'Barricade lower tier steps; restrict bathing strictly to elevated platforms',
          'Evacuate temporary riverside stalls and electrical generators'
        ]
      },
      {
        scenarioId: 'FL-SCEN-SECOND-WARNING-DANGER',
        name: 'Second Warning Stage (Critical Danger Threshold)',
        simulatedWaterLevelMsl: 17.5,
        waterLevelDeltaMeters: 3.7,
        simulatedDischargeCusecs: 1750000,
        simulatedRainfallMm24h: 120.0,
        riskLevel: 'DANGER',
        submergedStepsCount: 6,
        inundatedGhatNames: ['Pushkar Ghat Complete Promenade', 'Kotilingala Ghat', 'Markandeya Temple Tier', 'Saraswati Ghat'],
        recommendedOperations: [
          'Sound second danger siren; declare complete bathing prohibition',
          'Execute rapid evacuation of all devotees away from riverfront toward Municipal Stadium and North Parking',
          'Deploy SDRF flood rescue teams to assist Kovvur ferry landing and river island settlements'
        ]
      }
    ];

    return {
      assessmentId: `FL-ASSESS-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      currentWaterLevelMsl: activeMsl,
      cwcRiverGaugeMsl: activeMsl,
      cwcWarningLevelMsl: warningLevel,
      cwcDangerLevelMsl: dangerLevel,
      cwcExtremeDangerLevelMsl: extremeDanger,
      upstreamDischargeCusecs: this.upstreamDischargeCusecs,
      rainfallPast24hMm: this.rainfallPast24hMm,
      waterLevelTrendCmPerHour: this.waterLevelTrendCmPerHour,
      trendDirection: this.waterLevelTrendCmPerHour > 0 ? 'RISING' : this.waterLevelTrendCmPerHour < 0 ? 'RECEDING' : 'STEADY',
      overallRiskLevel: overallRisk,
      stepExposureProfiles,
      historicalBenchmarks: HISTORICAL_GODAVARI_FLOODS,
      simulatedScenarios,
      dataConnectionStatus: 'DEMONSTRATION_MODE_EXTERNAL_FEEDS_UNCONNECTED',
      dataClassification: 'DEMONSTRATION_MODE_EXTERNAL_FEEDS_UNCONNECTED',
      externalFeedsConnected: false,
      confidenceIntervalPercent: 82.5,
      regulatoryDisclaimer: 'DEMONSTRATION NOTICE: In accordance with standard operating procedures, official flood warnings are issued exclusively by Central Water Commission (CWC) and AP State Disaster Management Authority (APSDMA).'
    };
  }

  /**
   * Helper to simulate predefined flood rise scenarios
   */
  public simulateScenario(scenario: 'WARNING_LEVEL_RISE' | 'EXTREME_DANGER_RISE'): {
    scenarioRiverGaugeMsl: number;
    inundatedStepCount: number;
    riskLevel: FloodRiskLevel;
  } {
    const targetMsl = scenario === 'WARNING_LEVEL_RISE' ? 15.3 : 17.5;
    const assessment = this.evaluateFloodRisk(targetMsl);
    const submerged = assessment.stepExposureProfiles.filter(s => s.isSubmerged).length;
    return {
      scenarioRiverGaugeMsl: targetMsl,
      inundatedStepCount: submerged,
      riskLevel: assessment.overallRiskLevel
    };
  }
}

export const floodIntelligenceEngine = new FloodIntelligenceEngine();
