/**
 * Mock AI Provider
 * Deterministic, offline-ready AI inference engine tailored for
 * Rajamahendravaram Godavari Pushkar Ghat Digital Twin operations.
 * Implements full structured schema compliance, data classification, and human-in-the-loop governance.
 */

import { AIProvider, GenerateOptions } from './aiProviderInterface';
import { 
  AIStructuredResponse, 
  AIProviderHealth, 
  CommandAssistantPayload,
  CrowdPredictionPayload,
  AnomalyDetectionPayload,
  ResourceRecommendationPayload,
  EvacuationOptimizationPayload,
  FloodIntelligencePayload,
  ReportGenerationPayload,
  PublicAnnouncementPayload
} from '../types/ai';
import { digitalTwinContextBridge } from '../core/digitalTwinContextBridge';
import { aiSecurityGuard } from '../safety/aiSecurityGuard';

export class MockAIProvider implements AIProvider {
  public readonly id = 'mock' as const;
  public readonly name = 'Godavari Twin Mock AI Engine (Deterministic Rule-Based Intelligence)';
  public readonly modelName = 'godavari-twin-intelligence-v1-mock';

  public async isAvailable(): Promise<boolean> {
    return true;
  }

  public async testConnection(): Promise<AIProviderHealth> {
    const start = performance.now();
    await new Promise(res => setTimeout(res, 80)); // Simulate brief validation check
    const latency = Math.round(performance.now() - start);

    return {
      connected: true,
      activeProvider: 'mock',
      providerName: this.name,
      model: this.modelName,
      latencyMs: latency,
      isSimulatedMock: true,
      message: 'Mock AI Engine operational (SIMULATED MODE). Ready for crowd forecasting, anomaly scanning, flood analysis, and SITREP generation.',
      availableFeatures: [
        'Command Assistant',
        'Crowd Surge Prediction (30-120m)',
        'Flow Stalling & Bottleneck Detection',
        'Resource & 108 Ambulance Dispatch Matching',
        'Evacuation Egress Route Optimization',
        'Godavari CWC Flood Risk Assessment',
        'Executive Situation Reports (SITREP)',
        'Telugu/English Bilingual PA Broadcast Scripts'
      ]
    };
  }

  public async generateStructured<T>(
    service: string,
    prompt: string,
    _systemPrompt: string,
    _contextSummary: string,
    _options?: GenerateOptions
  ): Promise<AIStructuredResponse<T>> {
    const startTime = performance.now();
    const snap = digitalTwinContextBridge.getLiveSnapshot();
    const missingData: string[] = [];

    // Check for empty or missing context items
    if (!snap.gis.ghatLocations || snap.gis.ghatLocations.length === 0) {
      missingData.push('GIS Landmark Registry empty: defaulting to fallback riverfront coordinates.');
    }
    if (!snap.crowd || snap.crowd.totalActivePedestrians === undefined) {
      missingData.push('Crowd Simulation Engine offline: assuming zero active devotees.');
    }

    let payload: any = null;
    let summary = '';
    let recommendations: string[] = [];
    let actionType: any = 'NONE';
    let proposedPayload: any = null;
    let confidenceScore = 0.94;
    let confidenceLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'HIGH';
    let confidenceRationale = 'Inference anchored in verified WGS84 GIS maps, real-time Social Force simulation dynamics, and CWC benchmark elevations.';
    const uncertainties: string[] = [];

    // Service Dispatcher
    switch (service) {
      case 'CommandAssistant': {
        const pLower = prompt.toLowerCase();
        let directAns = '';
        let intent = 'GENERAL_QUERY';
        const highlights: any[] = [];

        if (pLower.includes('crowd') || pLower.includes('density') || pLower.includes('people')) {
          intent = 'CROWD_STATUS';
          directAns = `Currently, there are approximately ${snap.crowd.totalActivePedestrians.toLocaleString()} simulated devotees across the Godavari riverfront. Pushkar Ghat holds the highest density (${snap.crowd.densityValue} pax/m²), categorized as ${snap.crowd.currentDensityLevel}. Average walking speed is ${snap.crowd.averageWalkingSpeed} m/s with ${snap.crowd.activeBottlenecks.length} localized bottleneck(s).`;
          recommendations = [
            'Maintain continuous pedestrian monitoring along Kotilingala corridor',
            'Keep barrier ropes ready at Pushkar upper tiered steps if density exceeds 3.5 pax/m²'
          ];
          highlights.push({
            entityId: 'ghat-pushkar',
            entityType: 'GHAT',
            colorHex: '#00f0ff',
            label: 'Pushkar Ghat Steps (Highest Devotee Density)'
          });
        } else if (pLower.includes('flood') || pLower.includes('water') || pLower.includes('river')) {
          intent = 'HYDROLOGY_QUERY';
          directAns = `Godavari water level is at ${snap.hydrology.currentRiverLevelMsl}m MSL with an upstream discharge of ${(snap.hydrology.upstreamDischargeCusecs/100000).toFixed(2)}L cusecs. This is safely below the CWC Warning Level of ${snap.hydrology.warningLevelMsl}m MSL and Danger Level of ${snap.hydrology.dangerLevelMsl}m MSL. Inundation risk is currently LOW.`;
          recommendations = [
            'Maintain hourly water telemetry polling from Dowleswaram Barrage gauge',
            'Inspect SDRF patrol boats stationed near Godavari Arch Bridge'
          ];
          highlights.push({
            entityId: 'bridge-arch',
            entityType: 'BRIDGE',
            colorHex: '#38bdf8',
            label: 'Godavari Arch Bridge (Upstream Flow Monitor)'
          });
        } else if (pLower.includes('dispatch') || pLower.includes('ambulance') || pLower.includes('police') || pLower.includes('resource')) {
          intent = 'RESOURCE_DISPATCH';
          directAns = `There are ${snap.operations.availableResourcesCount} available emergency resources out of ${snap.operations.totalResourcesCount} registered units. ${snap.operations.deployedResourcesCount} units are actively deployed. Current SLA compliance rate is ${snap.dispatch.slaComplianceRate}%.`;
          recommendations = [
            'Stage 1 additional 108 Ambulance near VIP Ghat corridor for rapid access',
            'Rotate Sector 2 police personnel after peak afternoon darshan hours'
          ];
          highlights.push({
            entityId: 'res-amb-01',
            entityType: 'RESOURCE',
            colorHex: '#10b981',
            label: '108 Advanced Life Support Unit'
          });
        } else {
          intent = 'DIGITAL_TWIN_SUMMARY';
          directAns = `Digital Twin command telemetry is nominal. Current simulated population is ${snap.crowd.totalActivePedestrians.toLocaleString()} devotees, road network congestion is ${snap.traffic.overallCongestionLevel}, and Godavari river elevation is ${snap.hydrology.currentRiverLevelMsl}m MSL. All 4 primary ghats (Pushkar, Kotilingala, Markandeya, Saraswati) are monitored in real-time.`;
          recommendations = [
            'Inspect active incidents in the Evacuation & Dispatch command center',
            'Run crowd surge prediction if evening aarti crowds are expected'
          ];
        }

        const cmdPayload: CommandAssistantPayload = {
          intent,
          directAnswer: directAns,
          suggestedFollowUps: [
            'Predict crowd density for next 60 minutes',
            'Check flood & submergence risk at Kotilingala Ghat',
            'Recommend ambulance & police resource allocations',
            'Generate public safety announcement in Telugu and English'
          ],
          visualHighlights: highlights
        };

        summary = directAns;
        payload = cmdPayload;
        break;
      }

      case 'CrowdPrediction': {
        const horizon = 60;
        const totalSim = snap.crowd.totalActivePedestrians;
        const projectedTotal = Math.round(totalSim * 1.38); // Project 38% rise for afternoon/evening

        const forecasts: any[] = snap.gis.ghatLocations.map(g => {
          let surgeProb = 0.35;
          let rLevel: any = 'LOW';
          let projDens = 1.8;

          if (g.id === 'ghat-pushkar') {
            surgeProb = 0.88;
            rLevel = 'HIGH';
            projDens = 3.8;
          } else if (g.id === 'ghat-kotilingala') {
            surgeProb = 0.65;
            rLevel = 'MODERATE';
            projDens = 2.6;
          } else if (g.id === 'ghat-markandeya') {
            surgeProb = 0.45;
            rLevel = 'LOW';
            projDens = 1.9;
          } else {
            surgeProb = 0.25;
            rLevel = 'LOW';
            projDens = 1.3;
          }

          return {
            ghatId: g.id,
            ghatName: g.name,
            currentDensity: g.id === 'ghat-pushkar' ? snap.crowd.densityValue : 1.5,
            projectedDensity: projDens,
            projectedCount: Math.round(g.pushkaramCapacity.peakCapacityHourly * (projDens / 4.0)),
            surgeProbability: surgeProb,
            riskLevel: rLevel,
            estimatedPeakTime: '+45 mins (Evening Aarti Ingress)'
          };
        });

        const crowdPayload: CrowdPredictionPayload = {
          forecastHorizonMinutes: horizon,
          overallTrend: 'RISING',
          totalProjectedDevotees: projectedTotal,
          ghatForecasts: forecasts,
          identifiedBottlenecks: [
            'Pushkar Ghat Steps (Narrow Egress Bottleneck)',
            'Kotilingala North Temple Ingress Gate'
          ]
        };

        summary = `Crowd forecast for +${horizon} minutes projects an increase of ~38% (total ~${projectedTotal.toLocaleString()} devotees). Pushkar Ghat steps have an 88% probability of crowd surge reaching 3.8 pax/m².`;
        recommendations = [
          'Pre-position crowd control marshals at Pushkar tiered stairs',
          'Open secondary exit corridor towards Main Bazaar Road',
          'Deploy Telugu/English PA advisory informing devotees to utilize Saraswati Ghat'
        ];
        uncertainties.push('External weather variations and train arrivals at Rajahmundry station may alter peak arrival times by ±15 minutes.');
        payload = crowdPayload;
        break;
      }

      case 'AnomalyDetection': {
        const anomalies: any[] = [];
        let crit = 0;

        if (snap.crowd.densityValue > 2.0) {
          anomalies.push({
            anomalyId: 'anom-crowd-density-spike',
            title: 'High Devotee Concentration at Riverfront Tier',
            category: 'CROWD_SURGE',
            severity: snap.crowd.densityValue > 3.5 ? 'CRITICAL' : 'HIGH',
            location: 'Pushkar Ghat Tier 2 Steps',
            detectedAt: new Date().toISOString(),
            observedValue: `${snap.crowd.densityValue} pax/m²`,
            expectedBaseline: '1.2 - 1.8 pax/m²',
            confidence: 0.91,
            recommendedAction: 'Divert subsequent pilgrim groups toward Markandeya Ghat walkway.'
          });
          crit++;
        }

        if (snap.traffic.congestedSegmentsCount > 0) {
          anomalies.push({
            anomalyId: 'anom-traffic-bottleneck',
            title: 'Stalled Ingress Corridor on Godavari Arch Bridge Road',
            category: 'FLOW_STALL',
            severity: 'MODERATE',
            location: 'Godavari Arch Approach (West Kovvur inbound)',
            detectedAt: new Date().toISOString(),
            observedValue: `${snap.traffic.averageSpeedKmph} km/h (Slow moving)`,
            expectedBaseline: '40 - 50 km/h',
            confidence: 0.86,
            recommendedAction: 'Dispatch traffic warden to clear unauthorized roadside parking.'
          });
        }

        const anomalyPayload: AnomalyDetectionPayload = {
          totalAnomaliesDetected: anomalies.length,
          criticalCount: crit,
          anomalies,
          systemHealthScore: anomalies.length === 0 ? 98 : Math.max(65, 95 - (anomalies.length * 12))
        };

        summary = `Anomaly scan detected ${anomalies.length} operational deviations (${crit} critical). Overall system health score is ${anomalyPayload.systemHealthScore}/100.`;
        recommendations = anomalies.map(a => `${a.title}: ${a.recommendedAction}`);
        payload = anomalyPayload;
        break;
      }

      case 'ResourceRecommendation': {
        actionType = 'RESOURCE_REALLOCATION';

        const resAllocPayload: ResourceRecommendationPayload = {
          overallDeficitSummary: 'Sector 1 (Pushkar Ghat) requires medical and crowd control reinforcement due to high density.',
          allocations: [
            {
              zoneId: 'zone-pushkar-ghat',
              zoneName: 'Sector 1 - Pushkar Ghat Sacred Steps',
              currentResources: 6,
              recommendedAdditions: [
                {
                  category: 'POLICE',
                  quantity: 4,
                  priority: 'HIGH',
                  specificCapabilitiesRequired: ['CROWD_CONTROL', 'TELUGU_PUBLIC_ADDRESS'],
                  justification: 'Prevent stampede risk at lower bathing steps'
                },
                {
                  category: 'AMBULANCE',
                  quantity: 1,
                  priority: 'HIGH',
                  specificCapabilitiesRequired: ['ADVANCED_LIFE_SUPPORT', 'STRETCHER_TEAM'],
                  justification: 'Standby for heat exhaustion & elderly pilgrim assistance'
                }
              ],
              suggestedRelocationFromZone: 'zone-parking-outer'
            }
          ],
          proposedAssignments: [
            {
              resourceId: 'res-pol-reserve-03',
              resourceName: 'APSP Battalion Squad C (4 Officers)',
              fromZoneId: 'zone-parking-outer',
              toZoneId: 'zone-pushkar-ghat',
              travelMinutesEstimate: 4.5
            },
            {
              resourceId: 'res-amb-als-02',
              resourceName: '108 ALS Ambulance (RJY-04)',
              fromZoneId: 'zone-vip-ghat',
              toZoneId: 'zone-pushkar-ghat',
              travelMinutesEstimate: 3.2
            }
          ]
        };

        proposedPayload = resAllocPayload.proposedAssignments;
        summary = `Recommended redeploying 4 APSP Police Officers and 1 Advanced Life Support Ambulance to Sector 1 (Pushkar Ghat). Estimated transit time: 3.2 - 4.5 minutes.`;
        recommendations = [
          'Approve proposed dispatch via Commander authorization',
          'Notify Sector 1 Incident Commander of incoming reinforcement'
        ];
        payload = resAllocPayload;
        break;
      }

      case 'EvacuationOptimization': {
        actionType = 'EVACUATION_ROUTE_MOD';

        const evacPayload: EvacuationOptimizationPayload = {
          affectedZoneId: 'zone-pushkar-ghat',
          estimatedDevoteesToClear: snap.crowd.totalActivePedestrians,
          optimalExitRoutes: [
            {
              corridorId: 'corridor-east-bazaar',
              corridorName: 'Pushkar Ghat East Ramp to Main Bazaar Road',
              estimatedThroughputPaxPerMin: 180,
              recommendedSharePercent: 60,
              safestTravelDirection: 'EAST away from riverbank',
              chokePointWarning: 'Keep flower vendors 20m clear of ramp entrance'
            },
            {
              corridorId: 'corridor-north-kotilingala',
              corridorName: 'North Riverfront Promenade to Kotilingala Open Plaza',
              estimatedThroughputPaxPerMin: 120,
              recommendedSharePercent: 40,
              safestTravelDirection: 'NORTH toward open temple courtyard'
            }
          ],
          estimatedClearanceMinutes: Math.ceil(snap.crowd.totalActivePedestrians / 280),
          stagingAreaSuggestions: [
            'Municipal High School Ground (Capacity: 15,000)',
            'Kotilingala Temple Courtyard (Capacity: 8,000)'
          ]
        };

        proposedPayload = evacPayload.optimalExitRoutes;
        summary = `Optimal egress plan splits evacuation into 60% via East Ramp to Main Bazaar Road and 40% via North Promenade to Kotilingala Plaza. Estimated complete clearance: ~${evacPayload.estimatedClearanceMinutes} minutes.`;
        recommendations = [
          'Human authorization required before updating digital wayfinding signage',
          'Deploy volunteers with megaphones at ramp split points'
        ];
        payload = evacPayload;
        break;
      }

      case 'FloodIntelligence': {
        const cwcLevel = snap.hydrology.currentRiverLevelMsl;
        const dangerLevel = snap.hydrology.dangerLevelMsl;
        const warningLevel = snap.hydrology.warningLevelMsl;

        let riskLevel: any = 'SAFE';
        if (cwcLevel >= dangerLevel) riskLevel = 'DANGER';
        else if (cwcLevel >= warningLevel) riskLevel = 'WARNING';
        else if (cwcLevel >= warningLevel - 1.5) riskLevel = 'ALERT';

        const inundations = snap.gis.ghatLocations.map(g => {
          const elev = g.elevationMsl || 16.5;
          const diff = elev - cwcLevel;
          let sRisk: any = 'NONE';
          if (diff <= 0) sRisk = 'IMMINENT';
          else if (diff <= 1.0) sRisk = 'MEDIUM';
          else if (diff <= 2.5) sRisk = 'LOW';

          return {
            ghatId: g.id,
            ghatName: g.name,
            elevationMsl: elev,
            distanceToWaterlineMeters: Math.max(0, Number(diff.toFixed(2))),
            submergenceRisk: sRisk,
            estimatedHoursToSubmergence: diff <= 1.0 ? 8.5 : null
          };
        });

        const floodPayload: FloodIntelligencePayload = {
          cwcWaterLevelMsl: cwcLevel,
          dangerLevelMsl: dangerLevel,
          warningLevelMsl: warningLevel,
          submergenceRiskLevel: riskLevel,
          inundationRisks: inundations,
          barrageDischargeStatus: `${(snap.hydrology.upstreamDischargeCusecs/100000).toFixed(2)}L cusecs released through Dowleswaram barrage bays. Flow is regulated and steady.`,
          upstreamRainfallStatus: 'Past 24h rainfall in Godavari catchment is 12.4mm (Light to Moderate).'
        };

        summary = `Godavari hydrological status is ${riskLevel}. Current water level is ${cwcLevel}m MSL (${(dangerLevel - cwcLevel).toFixed(2)}m below danger threshold). Bathing steps remain fully operational.`;
        recommendations = [
          'Maintain SDRF river barrier safety buoys at 15m distance from shoreline',
          'Monitor Polavaram release bulletins every 3 hours'
        ];
        payload = floodPayload;
        break;
      }

      case 'ReportGeneration': {
        const reportId = `SITREP-RJY-${new Date().toISOString().slice(0, 10)}-${Math.floor(Math.random() * 900 + 100)}`;
        const reportMd = `
# GODAVARI PUSHKAR GHAT 3D DIGITAL TWIN
## OPERATIONAL SITUATION REPORT (SITREP)
**Report ID:** ${reportId}  
**Timestamp:** ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST  
**Classification:** OFFICIAL SIMULATION RECORD (NOT CERTIFIED STATISTICAL PUBLICATION)  

### 1. Executive Summary
During the current operational window, Rajamahendravaram Godavari riverfront facilities accommodated a simulated load of **${snap.crowd.totalActivePedestrians.toLocaleString()} pilgrims**. Overall crowd density remains **${snap.crowd.currentDensityLevel}** (${snap.crowd.densityValue} pax/m²). Godavari river elevation at Rajahmundry gauge is **${snap.hydrology.currentRiverLevelMsl}m MSL** with regulated barrage outflow.

### 2. Key Operational Metrics
- **Total Simulated Devotees:** ${snap.crowd.totalActivePedestrians.toLocaleString()}
- **Age Demographic Distribution:** Children (${snap.crowd.byAgeGroup.CHILDREN}), Young (${snap.crowd.byAgeGroup.YOUNG}), Adults (${snap.crowd.byAgeGroup.ADULTS}), Seniors (${snap.crowd.byAgeGroup.SENIORS})
- **Active Emergency Incidents:** ${snap.emergency.activeIncidentsCount}
- **Active Vehicle Fleet:** ${snap.traffic.totalActiveVehicles} units (Traffic Congestion: ${snap.traffic.overallCongestionLevel})
- **Deployed Resources:** ${snap.operations.deployedResourcesCount} / ${snap.operations.totalResourcesCount} units
- **Dispatch SLA Compliance:** ${snap.dispatch.slaComplianceRate}%

### 3. Safety & Civil Protection Status
SDRF rescue craft and 108 ambulance units maintain active perimeter patrols. Evacuation alert status is **${snap.emergency.isEvacuationAlertActive ? 'ACTIVATED' : 'STANDBY'}**.
`.trim();

        const reportPayload: ReportGenerationPayload = {
          reportId,
          title: `Godavari Twin Situation Report - ${new Date().toLocaleDateString('en-IN')}`,
          generatedAt: new Date().toISOString(),
          content: reportMd,
          executiveSummary: `Riverfront operations running nominally with ${snap.crowd.totalActivePedestrians.toLocaleString()} simulated pilgrims. River level is safe at ${snap.hydrology.currentRiverLevelMsl}m MSL.`,
          keyStatistics: {
            'Simulated Population': snap.crowd.totalActivePedestrians,
            'Density': `${snap.crowd.densityValue} pax/m²`,
            'River MSL': `${snap.hydrology.currentRiverLevelMsl} m`,
            'Active Incidents': snap.emergency.activeIncidentsCount,
            'Resource Availability': `${snap.operations.availableResourcesCount}/${snap.operations.totalResourcesCount}`
          },
          activeIncidentsCount: snap.emergency.activeIncidentsCount,
          totalCrowdSimulated: snap.crowd.totalActivePedestrians,
          complianceNotes: 'All simulation data generated by Godavari Pushkar Ghat 3D Digital Twin Social Force and Hydrological modeling.'
        };

        summary = `Generated Official Situation Report (${reportId}) summarizing crowd, hydrology, traffic, and emergency response performance.`;
        recommendations = [
          'Archive report to municipal operations database',
          'Circulate executive summary to sector liaison commanders'
        ];
        payload = reportPayload;
        break;
      }

      case 'PublicAnnouncement': {
        actionType = 'PUBLIC_ALERT';

        const isKoti = prompt.includes('Kotilingala');
        const pLocEnglish = isKoti ? 'Kotilingala Ghat' : 'Pushkar Ghat';
        const pLocTelugu = isKoti ? 'కోటిలింగాల ఘాట్' : 'పుష్కర ఘాట్';

        const teluguMsg = `భక్తులందరికీ విజ్ఞప్తి: ${pLocTelugu} వద్ద భక్తుల రద్దీ ఎక్కువగా ఉన్నందున, దయచేసి సమీపంలోని సరస్వతి ఘాట్ మరియు మార్కండేయ ఘాట్ వైపు తరలివెళ్లాల్సిందిగా కోరుతున్నాము. మీ పిల్లలను చేతితో పట్టుకోండి, నది లోపలికి వెళ్లకండి. సహాయం కోసం సమీపంలోని పోలీస్ సహాయ కేంద్రాన్ని సంప్రదించండి.`;
        const phonetic = `Bhaktulandarikī vijñapti: ${pLocEnglish} vadda bhaktula raddī ekkuvagā unnanduna, dayacēsi samīpanlōni Saraswati Ghāṭ mariyu Mārkaṇḍēya Ghāṭ vaipu taraliveḷḷālsindigā kōrutunnāmu. Mī pillalanu cētitō paṭṭukōṇḍi, nadi lōpaliki veḷḷakaṇḍi. Sahāyaṁ kōsaṁ samīpanlōni polīs sahāya kēndrānni sampradincanḍi.`;
        const engMsg = `Attention devotees: Due to heavy crowd volume at ${pLocEnglish}, you are kindly advised to proceed toward Saraswati Ghat and Markandeya Ghat. Keep children by your side, do not venture beyond safety buoys, and contact the nearest Police Help Desk for assistance.`;

        const annPayload: PublicAnnouncementPayload = {
          announcementId: `ANN-PA-${Date.now().toString().slice(-6)}`,
          targetPAZones: ['zone-pushkar-ghat', 'zone-kotilingala-ghat'],
          teluguScript: teluguMsg,
          teluguPhonetic: phonetic,
          englishScript: engMsg,
          broadcastIntervalSeconds: 120,
          priorityLevel: 'PRIORITY',
          audioReady: true
        };

        proposedPayload = annPayload;
        summary = `Drafted bilingual Telugu & English public safety announcement for ${pLocEnglish}. Human commander approval required before broadcasting across PA speaker towers.`;
        recommendations = [
          'Commander must authorize broadcast before transmission to PA tower network',
          'Verify audio clarity on Sector 1 and Sector 2 feedback monitors'
        ];
        payload = annPayload;
        break;
      }

      default: {
        summary = `Processed ${service} query successfully.`;
        payload = { result: `Simulation intelligence evaluated for ${service}`, query: prompt };
        recommendations = ['Review live Digital Twin telemetry'];
        break;
      }
    }

    const latency = Math.round(performance.now() - startTime);
    const humanApprovalReq = aiSecurityGuard.evaluateHumanApprovalRequirement(actionType, summary, proposedPayload);

    // Audit log
    aiSecurityGuard.logAudit({
      user: _options?.userContext ? {
        userId: _options.userContext.userId,
        name: _options.userContext.userId,
        role: (_options.userContext.role as any) || 'OPERATOR'
      } : {
        userId: 'system-operator',
        name: 'Duty Watch Commander',
        role: 'COMMANDER'
      },
      service,
      query: prompt,
      responseSummary: summary,
      requiresHumanApproval: humanApprovalReq.requiresApproval,
      approvalStatus: humanApprovalReq.approvalStatus,
      dataClassifications: ['VERIFIED', 'SIMULATED', 'AI_INFERRED'],
      provider: this.id,
      latencyMs: latency
    });

    return {
      id: `ai-resp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      service,
      summary,
      payload: payload as T,
      dataReferences: snap.dataReferences,
      recommendations,
      confidence: {
        score: confidenceScore,
        level: confidenceLevel,
        rationale: confidenceRationale,
        uncertainties
      },
      timestamp: new Date().toISOString(),
      dataClassification: 'SIMULATED',
      humanApproval: humanApprovalReq,
      missingOrUnavailableData: missingData.length > 0 ? missingData : ['SIMULATED: Deterministic mock response generated for local simulation.'],
      provider: this.id,
      model: this.modelName,
      isSimulatedMock: true,
      latencyMs: latency
    };
  }
}

export const mockAIProvider = new MockAIProvider();
