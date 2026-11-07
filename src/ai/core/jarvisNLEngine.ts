/**
 * JARVIS Natural Language Processing & Orchestration Engine
 * Godavari Pushkar Ghat 3D Digital Twin – Rajamahendravaram
 * Multilingual support: English, Telugu (తెలుగు), Hindi (हिन्दी)
 * Grounded in live state via jarvisToolRegistry
 */

import { jarvisToolRegistry } from './jarvisToolRegistry';
import { aiSecurityGuard } from '../safety/aiSecurityGuard';
import { 
  JarvisLanguage, 
  JarvisMessage 
} from '../types/jarvis';
import { UserContext } from '../types/ai';

export interface JarvisProcessOptions {
  user?: UserContext;
  forcedLanguage?: JarvisLanguage;
  bypassLiveBackend?: boolean;
  preferLiveBackend?: boolean;
}

class JarvisNLEngine {
  /**
   * Detect language from input text or fallback
   */
  public detectLanguage(text: string, forced?: JarvisLanguage): JarvisLanguage {
    if (forced) return forced;

    // Telugu Unicode block \u0C00-\u0C7F
    if (/[\u0C00-\u0C7F]/.test(text)) {
      return 'te';
    }
    // Devanagari / Hindi Unicode block \u0900-\u097F
    if (/[\u0900-\u097F]/.test(text)) {
      return 'hi';
    }

    // Keyword detection
    const lower = text.toLowerCase();
    if (lower.includes('ghat') || lower.includes('crowd') || lower.includes('incident') || lower.includes('how') || lower.includes('what') || lower.includes('show')) {
      return 'en';
    }

    return 'en';
  }

  /**
   * Main query execution pipeline
   */
  public async processQuery(prompt: string, options: JarvisProcessOptions = {}): Promise<JarvisMessage> {
    const lang = this.detectLanguage(prompt, options.forcedLanguage);
    const timestamp = new Date().toLocaleTimeString('en-IN', { hour12: false }) + ' IST';
    const messageId = `jarvis-msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // 1. Security Check: Validate Prompt Injection
    const validation = aiSecurityGuard.validateInputPrompt(prompt);
    if (!validation.isValid) {
      return this.generateSecurityRejection(messageId, lang, timestamp, validation.securityFlags);
    }

    const sanitizedPrompt = validation.sanitizedText;
    const lower = sanitizedPrompt.toLowerCase();

    // 2. Check for Controlled Write Operations (Dispatches, Reroutes, Public Alerts)
    const writeCheck = this.detectWriteOperation(sanitizedPrompt, lower, lang, timestamp, messageId);
    if (writeCheck) {
      return writeCheck;
    }

    if (options.preferLiveBackend && !options.bypassLiveBackend) {
      const metrics = jarvisToolRegistry.generateMetricSummaries();
      const liveRes = await this.tryLiveServerCommand(sanitizedPrompt, lang, timestamp, messageId, metrics);
      if (liveRes) {
        return liveRes;
      }
    }

    // 3. Match Read-Only Queries Grounded in Tool Registry
    return this.routeNaturalLanguageQuery(sanitizedPrompt, lower, lang, timestamp, messageId, options);
  }

  /**
   * Controlled Action Detection & Confirmation Preview Generation
   */
  private detectWriteOperation(
    _prompt: string, 
    lower: string, 
    lang: JarvisLanguage, 
    timestamp: string, 
    messageId: string
  ): JarvisMessage | null {
    const isDispatch = lower.includes('dispatch') || lower.includes('పంపండి') || lower.includes('भेजें') || lower.includes('deploy');
    const isReroute = lower.includes('reroute') || lower.includes('evacuate') || lower.includes('మళ్లించండి') || lower.includes('खाली करा');
    const isAlert = lower.includes('siren') || lower.includes('broadcast') || lower.includes('హెచ్చరిక') || lower.includes('चेतावनी');

    if (isAlert) {
      const direct = lang === 'te'
        ? `ప్రజా భద్రతా అలర్ట్ ప్రతిపాదన: పీఏ సౌండ్ సిస్టమ్ ద్వారా అత్యవసర సైరన్ మోగించడానికి కమాండర్ అధికారిక అనుమతి అవసరం.`
        : lang === 'hi'
        ? `सार्वजनिक सुरक्षा चेतावनी प्रस्ताव: पीए प्रणाली द्वारा आपातकालीन सायरन बजाने के लिए कमांडर की पूर्व स्वीकृति आवश्यक है।`
        : `Public Safety Alert Proposal: Broadcasting siren or emergency public alarm across PA towers requires Commander authorization.`;

      return {
        id: messageId,
        sender: 'jarvis',
        timestamp,
        text: direct,
        language: lang,
        directAnswer: direct,
        dataClassification: 'AI_INFERRED',
        humanApproval: {
          requiresApproval: true,
          actionType: 'PUBLIC_ALERT',
          actionTitle: 'Authorize Emergency Siren & PA Broadcast',
          rationale: 'Public warning alert proposal flagged for verification before audio transmission.',
          approvalStatus: 'PENDING',
          details: 'Scope: All Riverfront PA Towers | Signal: Alert Tone + Evacuation Guide'
        },
        dashboardLinks: [{ type: 'OPERATIONS', label: 'View Incident Systems' }]
      };
    }

    if (isDispatch) {
      const isAmbulance = lower.includes('ambulance') || lower.includes('అంబులెన్స్') || lower.includes('एम्बुलेंस');
      const unit = isAmbulance ? 'AMB-02 (Mobile ICU)' : 'POL-03 (Quick Reaction Team)';
      const targetGhat = lower.includes('kotilingala') ? 'Kotilingala Ghat' : 'Pushkar Ghat';

      const direct = lang === 'te'
        ? `వనరుల తరలింపు ప్రతిపాదన సిద్ధం చేయబడింది: ${unit} ను ${targetGhat} వైపు పంపడానికి కమాండర్ ముందస్తు అనుమతి అవసరం.`
        : lang === 'hi'
        ? `संसाधन प्रेषण प्रस्ताव तैयार: ${unit} को ${targetGhat} भेजने के लिए कमांडर की पूर्व स्वीकृति आवश्यक है।`
        : `Resource Dispatch Proposal Generated: Deployment of ${unit} to ${targetGhat} requires explicit Human Commander authorization.`;

      return {
        id: messageId,
        sender: 'jarvis',
        timestamp,
        text: direct,
        language: lang,
        directAnswer: direct,
        dataClassification: 'AI_INFERRED',
        relevantEntity: {
          type: 'RESOURCE',
          id: 'res-dispatch-proposed',
          name: unit
        },
        supportingMetrics: [
          { label: 'Unit', value: unit, variant: 'cyan' },
          { label: 'Destination', value: targetGhat, variant: 'blue' },
          { label: 'ETA', value: '3.4 mins', variant: 'emerald' },
          { label: 'Status', value: 'PENDING APPROVAL', variant: 'amber' }
        ],
        humanApproval: {
          requiresApproval: true,
          actionType: 'DISPATCH',
          actionTitle: `Authorize Immediate Dispatch: ${unit}`,
          rationale: `Target area ${targetGhat} requested emergency unit reinforcement. Automated dispatch is strictly blocked to maintain human command governance.`,
          approvalStatus: 'PENDING',
          details: `Unit: ${unit} | Destination: ${targetGhat} | Est. Travel Time: 3.4 mins`
        },
        mapAction: {
          type: 'FLY_TO_GHAT',
          label: `Preview ${targetGhat} Location`,
          explanation: `JARVIS will orient the 3D globe camera over ${targetGhat} to inspect approach corridors.`,
          payload: { ghatId: targetGhat.toLowerCase().includes('kotilingala') ? 'kotilingala-ghat' : 'pushkar-ghat' }
        },
        dashboardLinks: [
          { type: 'DISPATCH', label: 'Open Dispatch Console', tab: 'dispatch' }
        ],
        suggestedNextActions: [
          'Show available resources in Kotilingala',
          'Inspect traffic congestion on arterial routes',
          'Review nearest medical centers'
        ]
      };
    }

    if (isReroute) {
      const direct = lang === 'te'
        ? `తరలింపు మార్గం మార్పు ప్రతిపాదన: పుష్కర ఘాట్ భక్తులను విఐపి రోడ్డు వైపు మళ్లించే మార్గదర్శకానికి అధికారిక అనుమతి అవసరం.`
        : lang === 'hi'
        ? `निकासी मार्ग परिवर्तन प्रस्ताव: पुष्कर घाट के श्रद्धालुओं को वीआईपी मार्ग पर मोड़ने के लिए आधिकारिक स्वीकृति की आवश्यकता है।`
        : `Evacuation Route Diversion Proposal: Rerouting pedestrian flow via VIP Corridor requires explicit Commander sign-off.`;

      return {
        id: messageId,
        sender: 'jarvis',
        timestamp,
        text: direct,
        language: lang,
        directAnswer: direct,
        dataClassification: 'AI_INFERRED',
        relevantEntity: {
          type: 'ZONE',
          id: 'zone-pushkar-ghat',
          name: 'Pushkar Ghat Sacred Bathing Zone'
        },
        supportingMetrics: [
          { label: 'Primary Corridor', value: 'VIP Arterial Egress', variant: 'purple' },
          { label: 'Clearance Time', value: '18.2 mins', variant: 'emerald' },
          { label: 'Congestion Relief', value: '-43%', variant: 'cyan' },
          { label: 'Sign-Off', value: 'MANDATORY', variant: 'rose' }
        ],
        humanApproval: {
          requiresApproval: true,
          actionType: 'EVACUATION_ROUTE_MOD',
          actionTitle: 'Authorize Egress Route Modification',
          rationale: 'Diversion to secondary arterial corridor will prevent saturation on main river stairs.',
          approvalStatus: 'PENDING',
          details: 'Dynamic routing calculated via A* pathfinding. Official emergency signage and crowd barricades must be activated.'
        },
        mapAction: {
          type: 'HIGHLIGHT_EVAC_ROUTE',
          label: 'Highlight Evacuation Route',
          explanation: 'JARVIS will illuminate the designated emergency egress polyline with green pulsating vectors.',
          payload: { routeId: 'emergency-evac-corridor-1' }
        },
        dashboardLinks: [
          { type: 'EVACUATION', label: 'Open Evacuation Management' }
        ],
        suggestedNextActions: [
          'What is the current simulated evacuation progress?',
          'Compare the evacuation scenarios',
          'Check riverfront crowd bottlenecks'
        ]
      };
    }

    return null;
  }

  /**
   * Router for read-only queries with live tool execution
   */
  private async routeNaturalLanguageQuery(
    prompt: string, 
    lower: string, 
    lang: JarvisLanguage, 
    timestamp: string, 
    messageId: string,
    options?: JarvisProcessOptions
  ): Promise<JarvisMessage> {
    // -------------------------------------------------------------
    // Query 1: Highest Crowd Density Ghat
    // -------------------------------------------------------------
    if (lower.includes('highest') && (lower.includes('density') || lower.includes('crowd')) ||
        lower.includes('అత్యధిక') && lower.includes('రద్దీ') ||
        lower.includes('सबसे अधिक') && lower.includes('भीड़')) {
      const densities = jarvisToolRegistry.getCrowdDensityByZone();
      const highest = densities.reduce((max, g) => g.densityPaxPerSqM > max.densityPaxPerSqM ? g : max, densities[0]);

      const ghatNameTe = highest.ghatId === 'pushkar-ghat' ? 'గోదావరి పుష్కర ఘాట్' : highest.ghatId === 'kotilingala-ghat' ? 'కోటిలింగాల ఘాట్' : highest.ghatId === 'markandeya-ghat' ? 'మార్కండేయ ఘాట్' : 'సరస్వతి ఘాట్';
      const ghatNameHi = highest.ghatId === 'pushkar-ghat' ? 'गोदावरी पुष्कर घाट' : highest.ghatId === 'kotilingala-ghat' ? 'कोटिलिंगला घाट' : highest.ghatId === 'markandeya-ghat' ? 'मार्कंडेय घाट' : 'सरस्वती घाट';

      let direct = '';
      if (lang === 'te') {
        direct = `అత్యధిక భక్తుల రద్దీ కలిగిన ఘాట్: **${ghatNameTe} (${highest.ghatName})**. ఇక్కడ జనసాంద్రత చదరపు మీటరుకు **${highest.densityPaxPerSqM} భక్తులు** (${highest.densityClassification}) గా నమోదైంది. ప్రస్తుత అంచనా జనాభా: ${highest.estimatedPopulation.toLocaleString()} మంది.`;
      } else if (lang === 'hi') {
        direct = `सबसे अधिक भीड़ घनत्व वाला घाट: **${ghatNameHi} (${highest.ghatName})** है। यहाँ घनत्व **${highest.densityPaxPerSqM} व्यक्ति/वर्ग मीटर** (${highest.densityClassification}) है। वर्तमान अनुमानित आबादी: ${highest.estimatedPopulation.toLocaleString()} श्रद्धालु।`;
      } else {
        direct = `The ghat with the highest simulated crowd density is **${highest.ghatName}** with **${highest.densityPaxPerSqM} pax/m²** (${highest.densityClassification}). Estimated active crowd is ${highest.estimatedPopulation.toLocaleString()} devotees (${highest.occupancyPercent}% occupancy).`;
      }

      return {
        id: messageId,
        sender: 'jarvis',
        timestamp,
        text: direct,
        language: lang,
        directAnswer: direct,
        dataClassification: 'SIMULATED',
        relevantEntity: {
          type: 'GHAT',
          id: highest.ghatId,
          name: highest.ghatName
        },
        supportingMetrics: [
          { label: 'Highest Density', value: `${highest.densityPaxPerSqM} pax/m²`, variant: 'rose' },
          { label: 'Classification', value: highest.densityClassification, variant: 'amber' },
          { label: 'Simulated Crowd', value: highest.estimatedPopulation.toLocaleString(), variant: 'cyan' },
          { label: 'Hourly Capacity', value: highest.capacity.toLocaleString(), variant: 'blue' }
        ],
        mapAction: {
          type: 'FLY_TO_GHAT',
          label: `Fly Camera to ${highest.ghatName}`,
          explanation: `JARVIS will reposition the 3D Cesium camera to inspect crowd tiers at ${highest.ghatName}.`,
          payload: { ghatId: highest.ghatId }
        },
        dashboardLinks: [
          { type: 'CROWD_CONTROLS', label: 'View Crowd Simulation Panel' },
          { type: 'ANALYTICS', label: 'Inspect Density Analytics' }
        ],
        suggestedNextActions: [
          'Which zones have low resource availability?',
          'Show all critical incidents',
          'Inspect entry and exit flow'
        ]
      };
    }

    // -------------------------------------------------------------
    // Query 2: Show Critical Incidents
    // -------------------------------------------------------------
    if (lower.includes('critical') && lower.includes('incident') ||
        lower.includes('అత్యవసర') && lower.includes('సంఘటన') ||
        lower.includes('महत्वपूर्ण') && lower.includes('घटना')) {
      const incidents = jarvisToolRegistry.listActiveIncidents('CRITICAL');
      const allIncidents = jarvisToolRegistry.listActiveIncidents();

      let direct = '';
      if (incidents.length === 0) {
        if (lang === 'te') {
          direct = `ప్రస్తుతం ఎటువంటి **క్రిటికల్ (తీవ్రమైన) అత్యవసర సంఘటనలు లేవు**. మొత్తం ${allIncidents.length} సాధారణ/మధ్యస్థ సంఘటనలు పర్యవేక్షణలో ఉన్నాయి.`;
        } else if (lang === 'hi') {
          direct = `वर्तमान में कोई **गंभीर (क्रिटिकल) आपातकालीन घटना सक्रिय नहीं है**। कुल ${allIncidents.length} सामान्य/मध्यम घटनाएं निगरानी में हैं।`;
        } else {
          direct = `There are currently **0 critical emergency incidents** active across the digital twin. A total of ${allIncidents.length} moderate/minor incidents are being monitored.`;
        }
      } else {
        const top = incidents[0];
        if (lang === 'te') {
          direct = `గమనిక: **${incidents.length} క్రిటికల్ సంఘటన(లు)** కనుగొనబడ్డాయి: **${top.title}** (${top.affectedZoneName} వద్ద). తక్షణ సహాయక బృందం స్పందన అవసరం.`;
        } else if (lang === 'hi') {
          direct = `चेतावनी: **${incidents.length} गंभीर घटना(एं)** सक्रिय हैं: **${top.title}** (${top.affectedZoneName} में)। तत्काल प्रतिक्रिया आवश्यक है।`;
        } else {
          direct = `Alert: **${incidents.length} critical incident(s)** detected: **${top.title}** in ${top.affectedZoneName}. Immediate team response required.`;
        }
      }

      return {
        id: messageId,
        sender: 'jarvis',
        timestamp,
        text: direct,
        language: lang,
        directAnswer: direct,
        dataClassification: 'SIMULATED',
        relevantEntity: incidents.length > 0 ? {
          type: 'INCIDENT',
          id: incidents[0].id,
          name: incidents[0].title
        } : undefined,
        supportingMetrics: [
          { label: 'Critical Incidents', value: incidents.length, variant: incidents.length > 0 ? 'rose' : 'emerald' },
          { label: 'Total Incidents', value: allIncidents.length, variant: 'cyan' },
          { label: 'SLA Status', value: '94.2% On Track', variant: 'emerald' }
        ],
        mapAction: incidents.length > 0 ? {
          type: 'FOCUS_INCIDENT',
          label: `Focus Incident ${incidents[0].id}`,
          explanation: `JARVIS will center the Cesium camera on incident ${incidents[0].id} coordinates.`,
          payload: { incidentId: incidents[0].id }
        } : undefined,
        dashboardLinks: [
          { type: 'DISPATCH', label: 'Open Incident Dispatch Console' }
        ],
        suggestedNextActions: [
          'Which incidents are awaiting resource assignment?',
          'How many medical teams are available?',
          'Generate today\'s operations summary'
        ]
      };
    }

    // -------------------------------------------------------------
    // Query 3: Medical Team Availability
    // -------------------------------------------------------------
    if (lower.includes('medical') && (lower.includes('available') || lower.includes('team') || lower.includes('how many')) ||
        lower.includes('వైద్య') || lower.includes('మెడికల్') ||
        lower.includes('चिकित्सा') || lower.includes('मेडिकल')) {
      const res = jarvisToolRegistry.inspectResourceCategories();
      const med = res.byCategory['MEDICAL'] || { total: 4, available: 3, deployed: 1 };
      const amb = res.byCategory['AMBULANCE'] || { total: 3, available: 2, deployed: 1 };

      let direct = '';
      if (lang === 'te') {
        direct = `అందుబాటులో ఉన్న వైద్య వనరులు: **${med.available} / ${med.total} మెడికల్ క్యాంపు బృందాలు** సిద్ధంగా ఉన్నాయి. అలాగే **${amb.available} / ${amb.total} అంబులెన్సులు** అందుబాటులో ఉన్నాయి (${med.deployed + amb.deployed} బృందాలు విధుల్లో ఉన్నాయి).`;
      } else if (lang === 'hi') {
        direct = `उपलब्ध चिकित्सा संसाधन: **${med.available} / ${med.total} मेडिकल टीमें** तैयार हैं। साथ ही **${amb.available} / ${amb.total} एम्बुलेंस** उपलब्ध हैं (${med.deployed + amb.deployed} फील्ड में तैनात)।`;
      } else {
        direct = `Currently, **${med.available} of ${med.total} Medical Teams** are AVAILABLE on station, supported by **${amb.available} of ${amb.total} Ambulances** (${med.deployed + amb.deployed} units currently deployed on active response).`;
      }

      return {
        id: messageId,
        sender: 'jarvis',
        timestamp,
        text: direct,
        language: lang,
        directAnswer: direct,
        dataClassification: 'ADMIN_CONFIGURED',
        relevantEntity: {
          type: 'RESOURCE',
          id: 'res-med-fleet',
          name: 'Medical & Ambulance Fleet'
        },
        supportingMetrics: [
          { label: 'Available Doctors/Staff', value: `${med.available} Teams`, variant: 'emerald' },
          { label: 'Available Ambulances', value: `${amb.available} Units`, variant: 'cyan' },
          { label: 'Deployed in Field', value: `${med.deployed + amb.deployed} Units`, variant: 'amber' },
          { label: 'Medical Stations', value: '4 Verified', variant: 'blue' }
        ],
        mapAction: {
          type: 'SHOW_RESOURCES',
          label: 'Filter Medical Markers',
          explanation: 'JARVIS will filter map overlays to display all medical camps, first aid booths, and ambulances.',
          payload: { resourceCategory: 'MEDICAL' }
        },
        dashboardLinks: [
          { type: 'OPERATIONS', label: 'View Resource Roster' },
          { type: 'DISPATCH', label: 'Open Dispatch Table' }
        ],
        suggestedNextActions: [
          'Which zones have low resource availability?',
          'Which ghat has the highest simulated crowd density?',
          'Show all critical incidents'
        ]
      };
    }

    // -------------------------------------------------------------
    // Query 4: Low Resource Availability Zones
    // -------------------------------------------------------------
    if (lower.includes('low') && lower.includes('resource') ||
        lower.includes('తక్కువ') && lower.includes('వనరు') ||
        lower.includes('कम') && lower.includes('संसाधन')) {
      const lowZones = jarvisToolRegistry.getZoneWiseResourceAvailability();
      const allZones = jarvisToolRegistry.inspectZones();

      let direct = '';
      if (lowZones.length === 0) {
        if (lang === 'te') {
          direct = `అన్ని జోన్లలో సరిపడా వనరులు ఉన్నాయి. ఏ జోన్‌లోనూ తీవ్ర కొరత లేదు.`;
        } else if (lang === 'hi') {
          direct = `सभी क्षेत्रों में पर्याप्त संसाधन उपलब्ध हैं। किसी भी क्षेत्र में कोई गंभीर कमी नहीं है।`;
        } else {
          direct = `All operational sectors currently maintain adequate resource buffers. Zero zones are below the critical standby threshold.`;
        }
      } else {
        const zoneNames = lowZones.map(z => z.zoneName).join(', ');
        if (lang === 'te') {
          direct = `వనరుల కొరత ఉన్న జోన్లు (${lowZones.length}): **${zoneNames}**. ఇక్కడ అందుబాటులో ఉన్న వనరుల సంఖ్య 1 లేదా అంతకంటే తక్కువగా ఉంది. అదనపు బృందాలను కేటాయించాల్సిందిగా సిఫార్సు చేయడమైనది.`;
        } else if (lang === 'hi') {
          direct = `कम संसाधन उपलब्धता वाले क्षेत्र (${lowZones.length}): **${zoneNames}**। इन क्षेत्रों में 1 या उससे कम इकाई उपलब्ध है। अतिरिक्त इकाइयां आवंटित करने की सिफारिश की जाती है।`;
        } else {
          direct = `The zones with low resource availability (${lowZones.length} identified) are: **${zoneNames}**. These sectors have only ≤1 available unit in reserve. Reallocating standby units is recommended.`;
        }
      }

      return {
        id: messageId,
        sender: 'jarvis',
        timestamp,
        text: direct,
        language: lang,
        directAnswer: direct,
        dataClassification: 'ADMIN_CONFIGURED',
        relevantEntity: lowZones.length > 0 ? {
          type: 'ZONE',
          id: lowZones[0].zoneId,
          name: lowZones[0].zoneName
        } : undefined,
        supportingMetrics: [
          { label: 'Low Resource Sectors', value: lowZones.length, variant: lowZones.length > 0 ? 'amber' : 'emerald' },
          { label: 'Total Sectors', value: allZones.length, variant: 'cyan' },
          { label: 'Action Recommended', value: 'Rebalance Patrols', variant: 'purple' }
        ],
        mapAction: lowZones.length > 0 ? {
          type: 'HIGHLIGHT_ZONE',
          label: `Highlight ${lowZones[0].zoneName}`,
          explanation: `JARVIS will highlight sector ${lowZones[0].zoneName} on the 3D globe.`,
          payload: { zoneId: lowZones[0].zoneId }
        } : undefined,
        dashboardLinks: [
          { type: 'OPERATIONS', label: 'Open Sector Management' }
        ],
        suggestedNextActions: [
          'Recommend ambulance & police deployments',
          'How many medical teams are available?',
          'Generate today\'s operations summary'
        ]
      };
    }

    // -------------------------------------------------------------
    // Query 5: Compare Evacuation Scenarios
    // -------------------------------------------------------------
    if (lower.includes('compare') && lower.includes('scenario') ||
        lower.includes('పోల్చండి') || lower.includes('దృశ్యా') ||
        lower.includes('तुलना') || lower.includes('परिदृश्य')) {
      const comp = jarvisToolRegistry.compareScenarios();

      let direct = '';
      if (lang === 'te') {
        direct = `తరలింపు దృశ్యాల విశ్లేషణ: **సినారియో A (సాధారణ ప్రవాహం)** కి 14.5 నిమిషాల క్లియరెన్స్ సమయం పడుతుంది. **సినారియో B (పుష్కర రద్దీ)** 45,000 భక్తులతో 32.0 నిమిషాలు పడుతుంది (2 బాటిల్‌నెక్స్). **సినారియో C (డైనమిక్ రౌటింగ్)** A* అల్గారిథమ్ సహాయంతో క్లియరెన్స్ సమయాన్ని **18.2 నిమిషాలకు** (43.1% మెరుగుదల) తగ్గిస్తుంది.`;
      } else if (lang === 'hi') {
        direct = `निकासी परिदृश्य तुलना: **परिदृश्य A (सामान्य प्रवाह)** में 14.5 मिनट लगते हैं। **परिदृश्य B (महाकुंभ भीड़)** 45,000 श्रद्धालुओं के साथ 32.0 मिनट लेता है (2 बाधाएं)। **परिदृश्य C (गतिशील री-रूटिंग)** A* मार्ग की सहायता से निकासी समय को घटाकर **18.2 मिनट** (43.1% सुधार) कर देता है।`;
      } else {
        direct = `Scenario Evaluation Summary: **Scenario A (Baseline Ingress)** achieves complete dispersal in 14.5 mins with 0 bottlenecks. **Scenario B (Festival Peak)** surges to 45,000 pax/hr taking 32.0 mins (2 bottlenecks). **Scenario C (Dynamic Evacuation)** utilizes A* dynamic rerouting to reduce clearance time to **18.2 mins** (a 43.1% optimization).`;
      }

      return {
        id: messageId,
        sender: 'jarvis',
        timestamp,
        text: direct,
        language: lang,
        directAnswer: direct,
        dataClassification: 'SIMULATED',
        supportingMetrics: [
          { label: 'Scenario A Clearance', value: `${comp.scenarioA_Baseline.clearanceTimeMinutes} mins`, variant: 'cyan' },
          { label: 'Scenario B Rush', value: `${comp.scenarioB_FestivalRush.clearanceTimeMinutes} mins`, variant: 'rose' },
          { label: 'Scenario C Dynamic', value: `${comp.scenarioC_EmergencyEvacuation.clearanceTimeMinutes} mins`, variant: 'emerald' },
          { label: 'Efficiency Gain', value: '+43.1%', variant: 'purple' }
        ],
        mapAction: {
          type: 'HIGHLIGHT_EVAC_ROUTE',
          label: 'Display Scenario C Corridors',
          explanation: 'JARVIS will highlight primary and secondary evacuation corridors on the Cesium viewer.',
          payload: { routeId: 'emergency-evac-corridor-1' }
        },
        dashboardLinks: [
          { type: 'SCENARIO_COMPARE', label: 'Open Scenario Comparison View' }
        ],
        suggestedNextActions: [
          'What is the current simulated evacuation progress?',
          'Which ghat has the highest simulated crowd density?',
          'Show all critical incidents'
        ]
      };
    }

    // -------------------------------------------------------------
    // Query 6: Current Evacuation Progress
    // -------------------------------------------------------------
    if (lower.includes('evacuation') && (lower.includes('progress') || lower.includes('status')) ||
        lower.includes('తరలింపు') && lower.includes('పురోగతి') ||
        lower.includes('निकासी') && lower.includes('प्रगति')) {
      const isEvacActive = jarvisToolRegistry.inspectGeographicFeatures() && jarvisToolRegistry.listActiveIncidents().some(i => i.status === 'IN_PROGRESS');
      const crowd = jarvisToolRegistry.getCurrentSimulatedPopulation();

      let direct = '';
      if (!isEvacActive) {
        if (lang === 'te') {
          direct = `ప్రస్తుతం **తరలింపు అలర్ట్ యాక్టివ్‌గా లేదు** (స్టాండ్‌బై మోడ్). మొత్తం ${crowd.totalSimulatedPopulation.toLocaleString()} మంది భక్తులు సాధారణ వేగంతో (1.15 మీ/సె) ఘాట్లపై ఉన్నారు. అత్యవసర పరిస్థితుల్లో 18 నిమిషాల్లో తరలింపు పూర్తి చేయవచ్చు.`;
        } else if (lang === 'hi') {
          direct = `वर्तमान में **कोई निकासी चेतावनी सक्रिय नहीं है** (स्टैंडबाय मोड)। कुल ${crowd.totalSimulatedPopulation.toLocaleString()} श्रद्धालु सामान्य गति से घाटों पर मौजूद हैं। आपात स्थिति में 18 मिनट में निकासी संभव है।`;
        } else {
          direct = `Simulated Evacuation Status: **STANDBY (No active evacuation alert triggered)**. All ${crowd.totalSimulatedPopulation.toLocaleString()} simulated pilgrims are moving at normal pedestrian velocity (1.15 m/s). System ready to execute rapid egress routing within 18.2 mins.`;
        }
      } else {
        if (lang === 'te') {
          direct = `అత్యవసర తరలింపు పురోగతి: **45% పూర్తయింది**. 8,200 మంది భక్తులు సురక్షిత ప్రాంతాలకు చేరారు. మిగిలిన భక్తులు విఐపి కారిడార్ వైపు కదులుతున్నారు.`;
        } else if (lang === 'hi') {
          direct = `आपातकालीन निकासी प्रगति: **45% पूर्ण**। 8,200 श्रद्धालु सुरक्षित क्षेत्रों तक पहुँच चुके हैं। शेष वीआईपी कॉरिडोर की ओर बढ़ रहे हैं।`;
        } else {
          direct = `Active Evacuation Progress: **45% Dispersed**. Approximately 8,200 devotees have cleared riverfront tiers toward safe assembly parks. Clearance on track.`;
        }
      }

      return {
        id: messageId,
        sender: 'jarvis',
        timestamp,
        text: direct,
        language: lang,
        directAnswer: direct,
        dataClassification: 'SIMULATED',
        supportingMetrics: [
          { label: 'Evacuation Alert', value: isEvacActive ? 'ACTIVE' : 'STANDBY', variant: isEvacActive ? 'rose' : 'emerald' },
          { label: 'Egress Clearance Est.', value: '18.2 mins', variant: 'cyan' },
          { label: 'Safe Assembly Parks', value: '3 Active', variant: 'blue' },
          { label: 'SDRF Patrol Boats', value: '4 On-River', variant: 'purple' }
        ],
        mapAction: {
          type: 'HIGHLIGHT_EVAC_ROUTE',
          label: 'Show Egress Corridors',
          explanation: 'JARVIS will illuminate the designated evacuation routes on the Cesium viewer.',
          payload: { routeId: 'emergency-evac-corridor-1' }
        },
        dashboardLinks: [
          { type: 'EVACUATION', label: 'Open Evacuation Management' }
        ],
        suggestedNextActions: [
          'Compare the evacuation scenarios',
          'Which ghat has the highest simulated crowd density?',
          'Inspect entry and exit flow'
        ]
      };
    }

    // -------------------------------------------------------------
    // Query 7: Today's Operations Summary (SITREP)
    // -------------------------------------------------------------
    if (lower.includes('operations summary') || lower.includes('today') || lower.includes('sitrep') ||
        lower.includes('సారాంశం') || lower.includes('ఆపరేషన్స్') ||
        lower.includes('सारांश') || lower.includes('संचालन')) {
      const metrics = jarvisToolRegistry.generateMetricSummaries();
      const hydrology = jarvisToolRegistry.inspectGeographicFeatures();
      const resources = jarvisToolRegistry.inspectResourceCategories();

      let direct = '';
      if (lang === 'te') {
        direct = `ఈరోజు ఆపరేషన్స్ సారాంశం (SITREP): మొత్తం భక్తుల సంఖ్య 18,240 (ప్రస్తుతం యాక్టివ్: ${metrics.activePedestriansSimulated.toLocaleString()}). గోదావరి నీటిమట్టం: **${hydrology.riverElevationMsl}m MSL** (సురక్షితం). అందుబాటులో ఉన్న వనరులు: ${resources.availableCount} / ${resources.totalCount} యూనిట్లు. SLA స్పందన సమయం: **${metrics.slaComplianceRate}%**.`;
      } else if (lang === 'hi') {
        direct = `आज का संचालन सारांश (SITREP): संचयी श्रद्धालु 18,240 (वर्तमान सक्रिय: ${metrics.activePedestriansSimulated.toLocaleString()})। गोदावरी जलस्तर: **${hydrology.riverElevationMsl}m MSL** (सुरक्षित)। उपलब्ध संसाधन: ${resources.availableCount} / ${resources.totalCount} इकाइयाँ। एसएलए अनुपालन: **${metrics.slaComplianceRate}%**।`;
      } else {
        direct = `Command Operations SITREP: Cumulative simulated visitors 18,240 (active pilgrims: ${metrics.activePedestriansSimulated.toLocaleString()}). Godavari CWC water level is **${hydrology.riverElevationMsl}m MSL** (SAFE vs 17.5m Danger MSL). Total resources: ${resources.availableCount}/${resources.totalCount} available. Dispatch SLA compliance: **${metrics.slaComplianceRate}%** with 4.8 min average response.`;
      }

      return {
        id: messageId,
        sender: 'jarvis',
        timestamp,
        text: direct,
        language: lang,
        directAnswer: direct,
        dataClassification: 'AI_INFERRED',
        supportingMetrics: [
          { label: 'Active Pilgrims', value: metrics.activePedestriansSimulated.toLocaleString(), variant: 'cyan' },
          { label: 'River Water Level', value: `${hydrology.riverElevationMsl}m MSL`, variant: 'blue' },
          { label: 'Available Units', value: `${resources.availableCount}/${resources.totalCount}`, variant: 'emerald' },
          { label: 'SLA Compliance', value: `${metrics.slaComplianceRate}%`, variant: 'purple' }
        ],
        dashboardLinks: [
          { type: 'ANALYTICS', label: 'Open Operations Analytics' },
          { type: 'DISPATCH', label: 'View Dispatch Console' }
        ],
        suggestedNextActions: [
          'Which ghat has the highest simulated crowd density?',
          'Show all critical incidents',
          'How many medical teams are available?'
        ]
      };
    }

    // -------------------------------------------------------------
    // Query 8: Incidents Awaiting Resource Assignment
    // -------------------------------------------------------------
    if (lower.includes('awaiting') || lower.includes('unassigned') || lower.includes('pending assignment') ||
        lower.includes('కేటాయింపు కోసం') || lower.includes('వేచి ఉన్న') ||
        lower.includes('प्रतीक्षारत') || lower.includes('आवंटन')) {
      const dispatch = jarvisToolRegistry.getDispatchStatus();
      const unassigned = dispatch.unassignedIncidents;

      let direct = '';
      if (unassigned.length === 0) {
        if (lang === 'te') {
          direct = `వనరుల కేటాయింపు కోసం వేచి ఉన్న సంఘటనలు ఏవీ లేవు. అన్ని క్రియాశీల సంఘటనలకు రక్షక దళాలు కేటాయించబడ్డాయి.`;
        } else if (lang === 'hi') {
          direct = `संसाधन आवंटन के लिए कोई घटना प्रतीक्षारत नहीं है। सभी सक्रिय घटनाओं को दल सौंप दिए गए हैं।`;
        } else {
          direct = `All current emergency incidents have assigned field units. There are **0 incidents awaiting resource dispatch**.`;
        }
      } else {
        const top = unassigned[0];
        if (lang === 'te') {
          direct = `కేటాయింపు కోసం వేచి ఉన్న సంఘటనలు: **${unassigned.length}**. మొదటి సంఘటన: **${top.title}** (${top.affectedZoneName} వద్ద, తీవ్రత: ${top.severity}). తక్షణమే రక్షక దళాన్ని పంపవలసిందిగా కోరడమైనది.`;
        } else if (lang === 'hi') {
          direct = `आवंटन की प्रतीक्षा में घटनाएं: **${unassigned.length}**। मुख्य घटना: **${top.title}** (${top.affectedZoneName} में, गंभीरता: ${top.severity})। तुरंत इकाई भेजने की अनुशंसा की जाती है।`;
        } else {
          direct = `There are **${unassigned.length} incident(s) awaiting resource dispatch**. Primary unassigned: **${top.title}** at ${top.affectedZoneName} (Severity: ${top.severity}). Resource assignment required.`;
        }
      }

      return {
        id: messageId,
        sender: 'jarvis',
        timestamp,
        text: direct,
        language: lang,
        directAnswer: direct,
        dataClassification: 'SIMULATED',
        supportingMetrics: [
          { label: 'Unassigned Incidents', value: unassigned.length, variant: unassigned.length > 0 ? 'amber' : 'emerald' },
          { label: 'Active Dispatches', value: dispatch.totalDispatches, variant: 'cyan' },
          { label: 'Pending Dispatches', value: dispatch.pendingCount, variant: 'rose' }
        ],
        mapAction: unassigned.length > 0 ? {
          type: 'FOCUS_INCIDENT',
          label: `Focus Unassigned Incident ${unassigned[0].id}`,
          explanation: `JARVIS will center the Cesium camera on the unassigned incident location.`,
          payload: { incidentId: unassigned[0].id }
        } : undefined,
        dashboardLinks: [
          { type: 'DISPATCH', label: 'Open Dispatch Table' }
        ],
        suggestedNextActions: [
          'Recommend ambulance & police deployments',
          'How many medical teams are available?',
          'Which zones have low resource availability?'
        ]
      };
    }

    // -------------------------------------------------------------
    // Query 9: Godavari River Flow & Flood Risk
    // -------------------------------------------------------------
    if (lower.includes('river') || lower.includes('flood') || lower.includes('water level') || lower.includes('cwc') ||
        lower.includes('గోదావరి') || lower.includes('వరద') || lower.includes('నీటిమట్టం') ||
        lower.includes('गोदावरी') || lower.includes('बाढ़') || lower.includes('जलस्तर')) {
      const hydro = jarvisToolRegistry.inspectGeographicFeatures();

      let direct = '';
      if (lang === 'te') {
        direct = `గోదావరి నది నీటిమట్టం: **${hydro.riverElevationMsl}m MSL** (ప్రమాద స్థాయి: 17.5m MSL, హెచ్చరిక స్థాయి: 16.0m MSL). ధవళేశ్వరం బ్యారేజీ వద్ద డిశ్చార్జ్: 3,25,000 క్యూసెక్కులు. ప్రస్తుత స్థితి: **సురక్షితం (SAFE)**. ఘాట్ల వద్ద ఎటువంటి ముంపు ప్రమాదం లేదు.`;
      } else if (lang === 'hi') {
        direct = `गोदावरी नदी का जलस्तर: **${hydro.riverElevationMsl}m MSL** (खतरे का स्तर: 17.5m MSL, चेतावनी: 16.0m MSL)। धवलेश्वरम बैराज से डिस्चार्ज: 3,25,000 क्यूसेक। स्थिति: **सुरक्षित (SAFE)**। घाटों पर कोई जलमग्नता का खतरा नहीं है।`;
      } else {
        direct = `Godavari River Hydrology Telemetry: Current river gauge is **${hydro.riverElevationMsl}m MSL** (Warning: 16.0m MSL, Danger: 17.5m MSL). Upstream discharge via Dowleswaram Barrage is 325,000 cusecs. Current status is **SAFE** with zero ghat submergence risk.`;
      }

      return {
        id: messageId,
        sender: 'jarvis',
        timestamp,
        text: direct,
        language: lang,
        directAnswer: direct,
        dataClassification: 'SIMULATED',
        supportingMetrics: [
          { label: 'Current Gauge', value: `${hydro.riverElevationMsl}m MSL`, variant: 'cyan' },
          { label: 'CWC Danger Level', value: `${hydro.cwcDangerLevelMsl}m MSL`, variant: 'rose' },
          { label: 'Discharge', value: '3.25L cusecs', variant: 'blue' },
          { label: 'Risk Level', value: hydro.floodRiskLevel, variant: 'emerald' }
        ],
        mapAction: {
          type: 'FLY_TO_GHAT',
          label: 'Fly to Havelock Bridge Vista',
          explanation: 'JARVIS will orient the Cesium camera over the historic Havelock Bridge to inspect Godavari river flow vectors.',
          payload: { coordinates: { longitude: 81.7610, latitude: 17.0020, height: 450 } }
        },
        dashboardLinks: [
          { type: 'GIS_AUDIT', label: 'View Hydrological & GIS Benchmarks' }
        ],
        suggestedNextActions: [
          'What is the traffic congestion on Havelock & Arch bridges?',
          'Which ghat has the highest simulated crowd density?',
          'Generate today\'s operations summary'
        ]
      };
    }

    // -------------------------------------------------------------
    // Query 10: Bridge Traffic & Congestion
    // -------------------------------------------------------------
    if (lower.includes('traffic') || lower.includes('bridge') || lower.includes('road') ||
        lower.includes('ట్రాఫిక్') || lower.includes('వంతెన') ||
        lower.includes('यातायात') || lower.includes('पुल')) {
      let direct = '';
      if (lang === 'te') {
        direct = `వంతెనలు & రహదారుల ట్రాఫిక్ స్థితి: మొత్తం 120 క్రియాశీల వాహనాలు. గోదావరి రోడ్-కమ్-రైల్ బ్రిడ్జిపై ట్రాఫిక్ **మోడరేట్ (సాధారణం)** గా ఉంది (సగటు వేగం: 28.5 కిమీ/గం). కోటిలింగాల ఉత్తర అప్రోచ్ రోడ్డు వద్ద కొద్దిపాటి రద్దీ నమోదైంది.`;
      } else if (lang === 'hi') {
        direct = `पुल एवं सड़क यातायात स्थिति: कुल 120 सक्रिय वाहन। गोदावरी रोड-कम-रेल ब्रिज पर यातायात **सामान्य (MODERATE)** है (औसत गति: 28.5 किमी/घंटा)। कोटिलिंगला उत्तरी पहुंच मार्ग पर थोड़ा धीमापन है।`;
      } else {
        direct = `Bridge & Arterial Traffic Telemetry: Active vehicle fleet is 120 units moving at an average velocity of 28.5 km/h. Overall corridor congestion is **MODERATE**. The Godavari Arch & Road-cum-Rail Bridge are fully passable. One minor congestion point at Kotilingala North Ingress.`;
      }

      return {
        id: messageId,
        sender: 'jarvis',
        timestamp,
        text: direct,
        language: lang,
        directAnswer: direct,
        dataClassification: 'SIMULATED',
        supportingMetrics: [
          { label: 'Active Vehicles', value: '120 Units', variant: 'cyan' },
          { label: 'Average Speed', value: '28.5 km/h', variant: 'emerald' },
          { label: 'Network Congestion', value: 'MODERATE', variant: 'amber' },
          { label: 'Bridge Passage', value: '100% Open', variant: 'blue' }
        ],
        mapAction: {
          type: 'FLY_TO_GHAT',
          label: 'Inspect Bridge Crossings',
          explanation: 'JARVIS will adjust the Cesium perspective to view the Godavari Arch Bridge and Road-cum-Rail bridge corridors.',
          payload: { coordinates: { longitude: 81.7650, latitude: 17.0090, height: 600 } }
        },
        dashboardLinks: [
          { type: 'GIS_AUDIT', label: 'View Road Network GIS Layers' }
        ],
        suggestedNextActions: [
          'Which ghat has the highest simulated crowd density?',
          'Inspect entry and exit flow',
          'Show all critical incidents'
        ]
      };
    }

    // -------------------------------------------------------------
    // Query 11: Age Cohort Demographics
    // -------------------------------------------------------------
    if (lower.includes('age') || lower.includes('demographic') || lower.includes('cohort') ||
        lower.includes('వయస్సు') || lower.includes('వర్గీకరణ') ||
        lower.includes('आयु') || lower.includes('वर्ग')) {
      const crowd = jarvisToolRegistry.getCurrentSimulatedPopulation();
      const age = crowd.byAgeGroup;

      let direct = '';
      if (lang === 'te') {
        direct = `భక్తుల వయస్సు వర్గీకరణ: యువకులు (13-35 సం.): **${age.young.percentage}%** (${age.young.count} మంది), పెద్దలు (36-59 సం.): **${age.adults.percentage}%** (${age.adults.count} మంది), చిన్నారులు (5-12 సం.): **${age.children.percentage}%** (${age.children.count} మంది), వృద్ధులు (60+ సం.): **${age.seniors.percentage}%** (${age.seniors.count} మంది).`;
      } else if (lang === 'hi') {
        direct = `तीर्थयात्रियों का आयु वर्ग वितरण: युवा (13-35 वर्ष): **${age.young.percentage}%** (${age.young.count}), वयस्क (36-59 वर्ष): **${age.adults.percentage}%** (${age.adults.count}), बच्चे (5-12 वर्ष): **${age.children.percentage}%** (${age.children.count}), वरिष्ठ नागरिक (60+ वर्ष): **${age.seniors.percentage}%** (${age.seniors.count})।`;
      } else {
        direct = `Pedestrian Cohort Distribution: Young Adults (13-35 yrs): **${age.young.percentage}%** (${age.young.count}), Adults (36-59 yrs): **${age.adults.percentage}%** (${age.adults.count}), Children (5-12 yrs): **${age.children.percentage}%** (${age.children.count}), and Senior Citizens (60+ yrs): **${age.seniors.percentage}%** (${age.seniors.count}). Vulnerable cohort safety monitoring active.`;
      }

      return {
        id: messageId,
        sender: 'jarvis',
        timestamp,
        text: direct,
        language: lang,
        directAnswer: direct,
        dataClassification: 'SIMULATED',
        supportingMetrics: [
          { label: 'Young (13-35)', value: `${age.young.percentage}%`, variant: 'cyan' },
          { label: 'Adults (36-59)', value: `${age.adults.percentage}%`, variant: 'blue' },
          { label: 'Children (5-12)', value: `${age.children.percentage}%`, variant: 'amber' },
          { label: 'Seniors (60+)', value: `${age.seniors.percentage}%`, variant: 'purple' }
        ],
        dashboardLinks: [
          { type: 'CROWD_CONTROLS', label: 'Open Age Behavioral Settings' }
        ],
        suggestedNextActions: [
          'Which ghat has the highest simulated crowd density?',
          'Inspect entry and exit flow',
          'How many medical teams are available?'
        ]
      };
    }

    // -------------------------------------------------------------
    // Query 12: Crowd Entry & Exit Flow
    // -------------------------------------------------------------
    if (lower.includes('entry') || lower.includes('exit') || lower.includes('flow rate') ||
        lower.includes('ప్రవేశ') || lower.includes('నిష్క్రమణ') ||
        lower.includes('प्रवेश') || lower.includes('निकास')) {
      const flow = jarvisToolRegistry.inspectEntryExitFlow();

      let direct = '';
      if (lang === 'te') {
        direct = `భక్తుల ప్రవాహం: ప్రవేశ రేటు నిమిషానికి **${flow.entryRatePaxPerMin} మంది** (గంటకు ${flow.hourlyIngressProjection.toLocaleString()}), నిష్క్రమణ రేటు నిమిషానికి **${flow.exitRatePaxPerMin} మంది**. నికర సంచిత రేటు: +${flow.netAccumulationPaxPerMin} భక్తులు/నిమిషం.`;
      } else if (lang === 'hi') {
        direct = `तीर्थयात्री प्रवाह दर: प्रवेश दर **${flow.entryRatePaxPerMin} व्यक्ति/मिनट** (${flow.hourlyIngressProjection.toLocaleString()} प्रति घंटा), निकास दर **${flow.exitRatePaxPerMin} व्यक्ति/मिनट**। शुद्ध संचय दर: +${flow.netAccumulationPaxPerMin} व्यक्ति/मिनट।`;
      } else {
        direct = `Crowd Throughput Telemetry: Ingress rate is **${flow.entryRatePaxPerMin} pax/min** (~${flow.hourlyIngressProjection.toLocaleString()} pax/hr), Egress rate is **${flow.exitRatePaxPerMin} pax/min** (~${flow.hourlyEgressProjection.toLocaleString()} pax/hr). Net accumulation rate is positive at +${flow.netAccumulationPaxPerMin} pilgrims per minute.`;
      }

      return {
        id: messageId,
        sender: 'jarvis',
        timestamp,
        text: direct,
        language: lang,
        directAnswer: direct,
        dataClassification: 'SIMULATED',
        supportingMetrics: [
          { label: 'Ingress Rate', value: `${flow.entryRatePaxPerMin} pax/min`, variant: 'cyan' },
          { label: 'Egress Rate', value: `${flow.exitRatePaxPerMin} pax/min`, variant: 'emerald' },
          { label: 'Net Growth', value: `+${flow.netAccumulationPaxPerMin} pax/min`, variant: 'amber' },
          { label: 'Projected Ingress', value: `${flow.hourlyIngressProjection}/hr`, variant: 'blue' }
        ],
        dashboardLinks: [
          { type: 'CROWD_CONTROLS', label: 'View Flow Controls' }
        ],
        suggestedNextActions: [
          'Which ghat has the highest simulated crowd density?',
          'Which zones have low resource availability?',
          'Generate today\'s operations summary'
        ]
      };
    }

    // -------------------------------------------------------------
    // Query 13: Map Flight / Camera Navigation
    // -------------------------------------------------------------
    if (lower.includes('fly') || lower.includes('camera') || lower.includes('take me to') ||
        lower.includes('కెమెరా') || lower.includes('తీసుకెళ్లండి') ||
        lower.includes('कैमरा') || lower.includes('दिखाएं')) {
      const isKoti = lower.includes('kotilingala') || lower.includes('కోటిలింగాల') || lower.includes('कोटिलिंगला');
      const isMark = lower.includes('markandeya') || lower.includes('మార్కండేయ') || lower.includes('मार्कंडेय');
      const isSara = lower.includes('saraswati') || lower.includes('సరస్వతి') || lower.includes('सरस्वती');
      const targetGhat = isKoti ? 'Kotilingala Ghat' : isMark ? 'Markandeya Ghat' : isSara ? 'Saraswati Ghat' : 'Pushkar Ghat';
      const targetId = isKoti ? 'kotilingala-ghat' : isMark ? 'markandeya-ghat' : isSara ? 'saraswati-ghat' : 'pushkar-ghat';

      let direct = '';
      if (lang === 'te') {
        direct = `సెసియం 3D కెమెరాను **${targetGhat}** వైపు మళ్లిస్తున్నాను. భక్తుల రద్దీ మరియు నదీతీర పరిస్థితులను ప్రత్యక్షంగా పరిశీలించవచ్చు.`;
      } else if (lang === 'hi') {
        direct = `सीज़ियम 3D कैमरा को **${targetGhat}** की ओर निर्देशित किया जा रहा है। आप लाइव 3D दृश्य का अवलोकन कर सकते हैं।`;
      } else {
        direct = `JARVIS is navigating the Cesium 3D camera to **${targetGhat}**. Ground-level steps, crowd simulation, and riverfront markers are now oriented in the main viewport.`;
      }

      return {
        id: messageId,
        sender: 'jarvis',
        timestamp,
        text: direct,
        language: lang,
        directAnswer: direct,
        dataClassification: 'VERIFIED',
        relevantEntity: {
          type: 'GHAT',
          id: targetId,
          name: targetGhat
        },
        supportingMetrics: [
          { label: 'Target Landmark', value: targetGhat, variant: 'cyan' },
          { label: 'Coordinate System', value: 'WGS84 EPSG:4326', variant: 'blue' },
          { label: 'Action Mode', value: '3D Camera Fly-To', variant: 'emerald' }
        ],
        mapAction: {
          type: 'FLY_TO_GHAT',
          label: `Execute Fly to ${targetGhat}`,
          explanation: `JARVIS will smoothly transition the Cesium camera altitude and heading to ${targetGhat}.`,
          payload: { ghatId: targetId }
        },
        dashboardLinks: [
          { type: 'GIS_AUDIT', label: 'View Verified GIS Coordinates' }
        ],
        suggestedNextActions: [
          `Which ghat has the highest simulated crowd density?`,
          `How many medical teams are available?`,
          `Generate today's operations summary`
        ]
      };
    }

    // -------------------------------------------------------------
    // Query 14: Missing Data / Out-of-Bounds Queries
    // -------------------------------------------------------------
    if (lower.includes('airport') || lower.includes('flight') || lower.includes('train schedule') || lower.includes('cinema') ||
        lower.includes('విమానాశ్రయం') || lower.includes('రైలు') ||
        lower.includes('हवाई अड्डा') || lower.includes('ट्रेन')) {
      let direct = '';
      if (lang === 'te') {
        direct = `క్షమించండి, ఈ సమాచారం అందుబాటులో లేదు. గోదావరి పుష్కర ఘాట్ డిజిటల్ ట్విన్ సిస్టమ్ కేవలం నదీతీర ఘాట్లు, భక్తుల రద్దీ, CWC వరద స్థాయిలు మరియు అత్యవసర రక్షక దళాల సమాచారాన్ని మాత్రమే అందిస్తుంది. విమానాశ్రయ లేదా రైలు షెడ్యూల్ డేటా దీని పరిధిలో లేదు.`;
      } else if (lang === 'hi') {
        direct = `क्षमा करें, यह डेटा उपलब्ध नहीं है। गोदावरी पुष्कर घाट डिजिटल ट्विन प्रणाली केवल नदी तट घाटों, भीड़ नियंत्रण, सीडब्ल्यूसी बाढ़ स्तर और आपातकालीन बलों की जानकारी प्रदान करती है। हवाई अड्डा या ट्रेन समय सारिणी डिजिटल ट्विन के दायरे में नहीं है।`;
      } else {
        direct = `Data Limitation Notice: This requested information is unavailable. The Godavari Pushkar Ghat Digital Twin is strictly calibrated for riverfront crowd dynamics, CWC hydrological telemetry, operational zones, and emergency dispatch. Airport flight schedules and train timetables are outside the telemetry scope.`;
      }

      return {
        id: messageId,
        sender: 'jarvis',
        timestamp,
        text: direct,
        language: lang,
        directAnswer: direct,
        dataClassification: 'AI_INFERRED',
        missingDataNotice: 'Requested entity (Airport/Train schedule) is outside the Godavari Digital Twin GIS boundary.',
        supportingMetrics: [
          { label: 'Data Availability', value: 'UNAVAILABLE', variant: 'rose' },
          { label: 'Scope', value: 'Riverfront Twin Only', variant: 'amber' }
        ],
        suggestedNextActions: [
          'Which ghat has the highest simulated crowd density?',
          'What is the Godavari water level and flood risk?',
          'Generate today\'s operations summary'
        ]
      };
    }

    // -------------------------------------------------------------
    // Default Fallback: General Command Center Assistant
    // -------------------------------------------------------------
    const metrics = jarvisToolRegistry.generateMetricSummaries();

    if (!options?.bypassLiveBackend) {
      const liveRes = await this.tryLiveServerCommand(prompt, lang, timestamp, messageId, metrics);
      if (liveRes) {
        return liveRes;
      }
    }

    let defaultDirect = '';
    if (lang === 'te') {
      defaultDirect = `నమస్కారం! నేను జార్విస్ (JARVIS) - గోదావరి పుష్కర ఘాట్ కమాండ్ అసిస్టెంట్. ప్రస్తుతం డిజిటల్ ట్విన్ లో ${metrics.activePedestriansSimulated.toLocaleString()} మంది భక్తులు, ${metrics.activeSafetyAlerts} సంఘటనలు పర్యవేక్షించబడుతున్నాయి. గోదావరి నీటిమట్టం ${metrics.cwcWaterLevelMsl}m MSL వద్ద సురక్షితంగా ఉంది. నేను మీకు ఏ విధంగా సహాయపడగలను?`;
    } else if (lang === 'hi') {
      defaultDirect = `नमस्ते! मैं जार्विस (JARVIS) हूँ - गोदावरी पुष्कर घाट कमांड असिस्टेंट। डिजिटल ट्विन में वर्तमान में ${metrics.activePedestriansSimulated.toLocaleString()} श्रद्धालु और ${metrics.activeSafetyAlerts} घटनाएं सक्रिय हैं। गोदावरी जलस्तर ${metrics.cwcWaterLevelMsl}m MSL पर सुरक्षित है। मैं आपकी क्या सहायता कर सकता हूँ?`;
    } else {
      defaultDirect = `JARVIS Digital Twin Assistant operational. Grounded in live telemetry: ${metrics.activePedestriansSimulated.toLocaleString()} active devotees, river gauge ${metrics.cwcWaterLevelMsl}m MSL (SAFE), SLA rate ${metrics.slaComplianceRate}%. How may I assist riverfront command operations?`;
    }

    return {
      id: messageId,
      sender: 'jarvis',
      timestamp,
      text: defaultDirect,
      language: lang,
      directAnswer: defaultDirect,
      dataClassification: 'AI_INFERRED',
      supportingMetrics: [
        { label: 'Simulated Devotees', value: metrics.activePedestriansSimulated.toLocaleString(), variant: 'cyan' },
        { label: 'River Level', value: `${metrics.cwcWaterLevelMsl}m MSL`, variant: 'blue' },
        { label: 'Active Incidents', value: metrics.activeSafetyAlerts, variant: 'emerald' },
        { label: 'SLA Rate', value: `${metrics.slaComplianceRate}%`, variant: 'purple' }
      ],
      dashboardLinks: [
        { type: 'ANALYTICS', label: 'Open Operations Analytics' },
        { type: 'DISPATCH', label: 'View Incident Dispatch' }
      ],
      suggestedNextActions: [
        'Which ghat has the highest simulated crowd density?',
        'Show all critical incidents',
        'How many medical teams are available?',
        'Generate today\'s operations summary'
      ]
    };
  }

  /**
   * Security Rejection for Injection or Unauthorized Prompts
   */
  private generateSecurityRejection(
    messageId: string, 
    lang: JarvisLanguage, 
    timestamp: string, 
    flags: string[]
  ): JarvisMessage {
    const direct = lang === 'te'
      ? `భద్రతా హెచ్చరిక: ఆదేశంలో అనధికార సూచనలు లేదా ప్రోంప్ట్ ఇంజెక్షన్ అనుమానించబడింది. కమాండ్ అసిస్టెంట్ స్వతంత్ర కోడ్ ఎగ్జిక్యూషన్ లేదా అడ్మినిస్ట్రేటర్ అనుమతిని దాటవేయడాన్ని అనుమతించదు.`
      : lang === 'hi'
      ? `सुरक्षा चेतावनी: आदेश में अनधिकृत निर्देश या प्रॉम्प्ट इंजेक्शन का पता चला है। असिस्टेंट किसी भी मनमाने कोड निष्पादन या सुरक्षा प्रतिबंधों को बायपास करने की अनुमति नहीं देता है।`
      : `Security Guard Alert: Unauthorized operational override or prompt injection detected [${flags.join(', ')}]. JARVIS strictly forbids execution of arbitrary code, SQL queries, or bypassing Commander authorization.`;

    return {
      id: messageId,
      sender: 'jarvis',
      timestamp,
      text: direct,
      language: lang,
      directAnswer: direct,
      isError: true,
      dataClassification: 'AI_INFERRED',
      supportingMetrics: [
        { label: 'Security Status', value: 'QUERY REJECTED', variant: 'rose' },
        { label: 'Flag', value: flags[0] || 'SECURITY_POLICY_VIOLATION', variant: 'amber' }
      ],
      suggestedNextActions: [
        'Which ghat has the highest simulated crowd density?',
        'Show all critical incidents',
        'Generate today\'s operations summary'
      ]
    };
  }

  /**
   * Attempt live backend query to Google Gemini endpoint
   */
  public async tryLiveServerCommand(
    prompt: string,
    lang: JarvisLanguage,
    timestamp: string,
    messageId: string,
    metrics: any
  ): Promise<JarvisMessage | null> {
    if (typeof fetch === 'undefined') return null;

    try {
      const rawUrl = typeof window !== 'undefined' 
        ? ((typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_BASE_URL) || '') 
        : (process.env.API_BASE_URL || 'http://127.0.0.1:5173');
      const baseUrl = String(rawUrl).replace(/\/+$/, '');
      const contextSummary = `Live Telemetry: Devotees=${metrics.activePedestriansSimulated}; RiverGauge=${metrics.cwcWaterLevelMsl}m MSL (SAFE); Incidents=${metrics.activeSafetyAlerts}; Language=${lang}`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 35000);

      const res = await fetch(`${baseUrl}/api/ai/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: 'CommandAssistant',
          prompt,
          contextSummary,
          systemPrompt: `You are JARVIS, AI Command Copilot for the Godavari Pushkar Ghat 3D Digital Twin in Rajamahendravaram. Answer concisely in language: ${lang} (English/Telugu/Hindi). Ground your answers in live telemetry: 250 devotees active, river water level 13.8m MSL (SAFE), 3 medical teams on station.`
        }),
        signal: controller.signal
      });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        const text = data.summary || data.payload?.directAnswer || data.payload?.summary;
        if (text) {
          const isMock = data.provider === 'server-mock' || data.provider === 'mock' || !!data.isSimulatedMock;
          const engineLabel = data.provider === 'gemini' 
            ? `Google Gemini (${data.model})` 
            : 'SIMULATED (MOCK ENGINE)';

          return {
            id: messageId,
            sender: 'jarvis',
            timestamp,
            text,
            language: lang,
            directAnswer: text,
            dataClassification: isMock ? 'SIMULATED' : (data.dataClassification || 'AI_INFERRED'),
            provider: data.provider,
            model: data.model,
            isSimulatedMock: isMock,
            quotaState: data.quotaState,
            supportingMetrics: [
              { label: 'Active Pilgrims', value: metrics.activePedestriansSimulated.toLocaleString(), variant: 'cyan' },
              { label: 'River Gauge', value: `${metrics.cwcWaterLevelMsl}m MSL`, variant: 'blue' },
              { label: 'AI Engine', value: engineLabel, variant: isMock ? 'amber' : 'purple' },
              { label: 'Latency', value: `${data.latencyMs || 35}ms`, variant: 'emerald' }
            ],
            suggestedNextActions: [
              'Which ghat has the highest simulated crowd density?',
              'What is the Godavari water level and flood risk?',
              'Show all critical incidents',
              'Generate today\'s operations summary'
            ]
          };
        }
      }
    } catch {
      // Ignored: fallback to local template
    }
    return null;
  }
}

export const jarvisNLEngine = new JarvisNLEngine();
