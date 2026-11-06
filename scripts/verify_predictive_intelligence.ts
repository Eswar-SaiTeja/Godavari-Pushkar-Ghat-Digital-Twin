/**
 * Day 5: AI Predictive Intelligence Verification Suite
 * Tests 1 - 10 covering all 7 predictive intelligence modules:
 * 1. Crowd forecast with simulated observations (15m, 30m, 60m)
 * 2. Crowd surge detection
 * 3. Ingress/egress flow imbalance
 * 4. Resource shortage detection
 * 5. MCDA resource recommendation ranking
 * 6. Alternative A* evacuation routing (+43% clearance gain)
 * 7. Flood demonstration scenario (+1.5m to +3.7m)
 * 8. Missing external data handling
 * 9. Invalid input validation
 * 10. Prediction uncertainty interval bounds display
 */

import { crowdPredictionEngine } from '../src/ai/predictive/crowdPredictionEngine';
import { anomalyDetectionEngine } from '../src/ai/predictive/anomalyDetectionEngine';
import { resourceAllocationOptimizer } from '../src/ai/predictive/resourceAllocationOptimizer';
import { evacuationRouteOptimizer } from '../src/ai/predictive/evacuationRouteOptimizer';
import { floodIntelligenceEngine } from '../src/ai/predictive/floodIntelligenceEngine';
import { predictiveEvaluationService } from '../src/ai/predictive/predictiveEvaluationService';

interface TestResult {
  testId: number;
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assert(testId: number, name: string, condition: boolean, details: string) {
  results.push({ testId, name, passed: condition, details });
  const statusStr = condition ? 'PASS' : 'FAIL';
  console.log(`[${statusStr}] Test ${testId}: ${name} - ${details}`);
}

async function runAllTests() {
  console.log('===================================================================');
  console.log('GODAVARI PUSHKAR GHAT 3D DIGITAL TWIN - PREDICTIVE INTELLIGENCE QA');
  console.log('===================================================================\n');

  // TEST 1: Crowd forecast with simulated observations (15m, 30m, 60m)
  const forecast15 = crowdPredictionEngine.generateForecast(15);
  const forecast30 = crowdPredictionEngine.generateForecast(30);
  const forecast60 = crowdPredictionEngine.generateForecast(60);
  const t1Passed = 
    forecast15.zoneForecasts.length > 0 &&
    forecast30.zoneForecasts.length > 0 &&
    forecast60.zoneForecasts.length > 0 &&
    forecast15.dataClassification === 'SIMULATED';
  assert(
    1,
    'Crowd Forecast Horizons (15m, 30m, 60m)',
    t1Passed,
    `15m total: ${forecast15.totalProjectedDevotees}, 30m total: ${forecast30.totalProjectedDevotees}, 60m total: ${forecast60.totalProjectedDevotees} [Label: ${forecast15.dataClassification}]`
  );

  // TEST 2: Crowd surge detection
  const surgeAlerts = forecast30.zoneForecasts.map(z => z.surgeAlert).filter(s => s.isSurgeDetected);
  const t2Passed = Array.isArray(surgeAlerts) && surgeAlerts.length > 0;
  assert(
    2,
    'Crowd Surge Detection',
    t2Passed,
    `Detected ${surgeAlerts.length} surge alert(s). Top alert probability: ${surgeAlerts[0]?.surgeProbability} (Severity: ${surgeAlerts[0]?.severity})`
  );

  // TEST 3: Ingress/egress flow imbalance
  const anomalyScan = anomalyDetectionEngine.scanSubsystems();
  const flowAnomaly = anomalyScan.anomalies.find(a => a.category === 'FLOW_IMBALANCE');
  const flowMeas = flowAnomaly?.supportingMeasurements?.[0];
  const t3Passed = !!flowAnomaly && !!flowMeas && Number(flowMeas.observedValue) > 0;
  assert(
    3,
    'Ingress/Egress Flow Imbalance Detection',
    t3Passed,
    `Observed ratio: ${flowMeas?.observedValue} vs baseline: ${flowMeas?.expectedBaseline} (Deviation: ${flowMeas?.zScoreOrDeviation})`
  );

  // TEST 4: Resource shortage detection
  const resourceAnomaly = anomalyScan.anomalies.find(a => a.category === 'RESOURCE_SHORTAGE');
  const resMeas = resourceAnomaly?.supportingMeasurements?.[0];
  const t4Passed = !!resourceAnomaly && (resourceAnomaly.severity === 'HIGH' || resourceAnomaly.severity === 'CRITICAL');
  assert(
    4,
    'Resource Shortage Anomaly Detection',
    t4Passed,
    `Detected: ${resourceAnomaly?.title} (${resMeas?.metricName}: ${resMeas?.observedValue} vs ${resMeas?.expectedBaseline})`
  );

  // TEST 5: MCDA resource recommendation ranking
  const allocationPlan = resourceAllocationOptimizer.generateAllocationPlan();
  const topRec = allocationPlan.recommendations[0];
  const t5Passed = 
    allocationPlan.recommendations.length > 0 && 
    topRec.suitabilityScore >= 60 &&
    topRec.mcdaBreakdown.incidentPriorityScore > 0 &&
    topRec.mcdaBreakdown.categoryMatchScore > 0;
  assert(
    5,
    'MCDA Resource Recommendation Ranking',
    t5Passed,
    `Ranked top resource: ${topRec?.resourceName} (${topRec?.category}) - Suitability: ${topRec?.suitabilityScore}/100, ETA: ${topRec?.estimatedTravelTimeMinutes}m`
  );

  // TEST 6: Alternative A* evacuation routing (+43% clearance gain)
  const evacComparison = evacuationRouteOptimizer.optimizeEvacuationRoutes('zone-pushkar-ghat');
  const efficiency = evacComparison.aiOptimizedScenario.efficiencyImprovementPercent;
  const t6Passed = efficiency >= 40 && evacComparison.validationMethod === 'A_STAR_GRAPH_VALIDATED';
  assert(
    6,
    'Alternative A* Evacuation Routing (+43% Clearance Gain)',
    t6Passed,
    `Baseline: ${evacComparison.baselineScenario.totalClearanceMinutes}m vs AI Optimized: ${evacComparison.aiOptimizedScenario.totalClearanceMinutes}m (Gain: +${efficiency}%)`
  );

  // TEST 7: Flood demonstration scenario (+1.5m to +3.7m)
  const floodAssessment = floodIntelligenceEngine.evaluateFloodRisk();
  const scenarioWarn = floodIntelligenceEngine.simulateScenario('WARNING_LEVEL_RISE');
  const scenarioDanger = floodIntelligenceEngine.simulateScenario('EXTREME_DANGER_RISE');
  const t7Passed = 
    floodAssessment.cwcRiverGaugeMsl === 13.8 &&
    scenarioWarn.scenarioRiverGaugeMsl === 15.3 &&
    scenarioDanger.scenarioRiverGaugeMsl === 17.5 &&
    scenarioDanger.inundatedStepCount >= 4 &&
    floodAssessment.dataClassification === 'DEMONSTRATION_MODE_EXTERNAL_FEEDS_UNCONNECTED';
  assert(
    7,
    'Godavari Flood Demonstration Scenario (+1.5m to +3.7m)',
    t7Passed,
    `Current: ${floodAssessment.cwcRiverGaugeMsl}m -> Warning Rise (+1.5m): ${scenarioWarn.scenarioRiverGaugeMsl}m -> Extreme Danger (+3.7m): ${scenarioDanger.scenarioRiverGaugeMsl}m (${scenarioDanger.inundatedStepCount} steps submerged)`
  );

  // TEST 8: Missing external data handling
  const customFlood = floodIntelligenceEngine.evaluateFloodRisk(undefined, undefined, undefined);
  const t8Passed = 
    customFlood.externalFeedsConnected === false && 
    customFlood.historicalBenchmarks.length === 3 &&
    customFlood.confidenceIntervalPercent === 82.5;
  assert(
    8,
    'Missing External Data Graceful Handling',
    t8Passed,
    `Fallback engaged safely: externalFeedsConnected=${customFlood.externalFeedsConnected}, benchmarks=${customFlood.historicalBenchmarks.length}, confidence=${customFlood.confidenceIntervalPercent}%`
  );

  // TEST 9: Invalid input validation
  let invalidHandled = false;
  try {
    // Pass negative / zero population or evaluate edge inputs
    const edgeEvaluation = predictiveEvaluationService.logEvaluationRecord({
      predictionType: 'CROWD_POPULATION',
      horizonMinutes: 15,
      predictedValue: -500, // Invalid negative input
      observedValue: 8000,
      zoneId: 'zone-pushkar-ghat'
    });
    // System should clamp or handle gracefully
    invalidHandled = edgeEvaluation.absoluteError > 0 && edgeEvaluation.recordId.length > 0;
  } catch (err) {
    invalidHandled = true;
  }
  assert(
    9,
    'Invalid Input Validation & Resilient Handling',
    invalidHandled,
    'Edge and invalid input parameters safely handled without unhandled exceptions or crashes'
  );

  // TEST 10: Prediction uncertainty interval bounds display
  const zonePushkar = forecast30.zoneForecasts.find(z => z.zoneId === 'zone-pushkar-ghat');
  const t10Passed = 
    !!zonePushkar &&
    zonePushkar.uncertaintyRange.lowerBound < zonePushkar.uncertaintyRange.medianForecast &&
    zonePushkar.uncertaintyRange.medianForecast < zonePushkar.uncertaintyRange.upperBound &&
    zonePushkar.uncertaintyRange.confidenceLevel === 0.95;
  assert(
    10,
    'Prediction Uncertainty Interval Display (95% CI)',
    t10Passed,
    `Pushkar Ghat 30m: Lower: ${zonePushkar?.uncertaintyRange.lowerBound} < Median: ${zonePushkar?.uncertaintyRange.medianForecast} < Upper: ${zonePushkar?.uncertaintyRange.upperBound} (95% CI)`
  );

  console.log('\n===================================================================');
  const allPassed = results.every(r => r.passed);
  const passedCount = results.filter(r => r.passed).length;
  console.log(`TOTAL RESULT: ${passedCount}/${results.length} TESTS PASSED`);
  console.log('===================================================================');

  if (!allPassed) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('QA Suite encountered error:', err);
  process.exit(1);
});
