/**
 * AI DIGITAL TWIN COPILOT – JARVIS
 * Godavari Pushkar Ghat Intelligent Command Assistant
 * 
 * Multilingual Conversational Command Center:
 * - English, Telugu (తెలుగు), Hindi (हिन्दी)
 * - Grounded in live GIS, crowd dynamics, CWC hydrology, and operational dispatch
 * - Interactive Cesium Map Actions (Fly camera, highlight zone, focus incident, highlight evac route)
 * - Human-in-the-Loop Operational Authorization preview cards
 * - Real-time Supporting Metrics Grids & Navigation module deep-links
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldAlert, 
  Users, 
  Waves, 
  FileText, 
  X,
  Shield,
  Volume2,
  Trash2,
  Compass,
  MapPin,
  ExternalLink,
  ChevronRight,
  Radio,
  Zap,
  Activity
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { crowdPredictionService } from '../../ai/services/crowdPredictionService';
import { anomalyDetectionService } from '../../ai/services/anomalyDetectionService';
import { floodIntelligenceService } from '../../ai/services/floodIntelligenceService';
import { reportGenerationService } from '../../ai/services/reportGenerationService';
import { publicAnnouncementService } from '../../ai/services/publicAnnouncementService';
import { providerManager } from '../../ai/providers/providerManager';
import { aiSecurityGuard } from '../../ai/safety/aiSecurityGuard';
import { jarvisNLEngine } from '../../ai/core/jarvisNLEngine';
import { cesiumService } from '../../services/cesiumService';
import { 
  JarvisLanguage, 
  JarvisMessage, 
  JarvisMapAction
} from '../../ai/types/jarvis';
import { 
  AIStructuredResponse, 
  AIProviderHealth, 
  UserRole, 
  UserContext, 
  AIAuditLogEntry,
  DataClassification 
} from '../../ai/types/ai';

export interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'chat' | 'predictions' | 'anomalies' | 'flood' | 'approvals' | 'audit';
  onNavigateToModule?: (
    module: 'OPERATIONS' | 'DISPATCH' | 'ANALYTICS' | 'CROWD' | 'EMERGENCY' | 'GIS_AUDIT' | 'SCENARIO' | 'EVACUATION', 
    tab?: string
  ) => void;
}

export const AICopilotDrawer: React.FC<AICopilotDrawerProps> = ({
  isOpen,
  onClose,
  initialTab = 'chat',
  onNavigateToModule
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'predictions' | 'anomalies' | 'flood' | 'approvals' | 'audit'>(initialTab);
  const [prompt, setPrompt] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<JarvisLanguage>('en');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentResponse, setCurrentResponse] = useState<AIStructuredResponse | null>(null);
  const [providerHealth, setProviderHealth] = useState<AIProviderHealth | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('COMMANDER');
  const [auditLogs, setAuditLogs] = useState<AIAuditLogEntry[]>([]);
  const [activeExecutedMapAction, setActiveExecutedMapAction] = useState<string | null>(null);

  const initialGreetingByLang: Record<JarvisLanguage, string> = {
    en: 'JARVIS Digital Twin Assistant operational. Grounded in live GIS coordinates, crowd dynamics, CWC hydrology, and emergency dispatches. How may I assist command operations?',
    te: 'జార్విస్ (JARVIS) డిజిటల్ ట్విన్ కమాండ్ అసిస్టెంట్ సిద్ధంగా ఉంది. అధికారిక GIS కోఆర్డినేట్లు, భక్తుల రద్దీ, CWC గోదావరి నీటిమట్టం మరియు రక్షక దళాల సమాచారంతో ప్రత్యక్షంగా అనుసంధానించబడింది. నేను మీకు ఏ విధంగా సహాయపడగలను?',
    hi: 'जार्विस (JARVIS) डिजिटल ट्विन कमांड असिस्टेंट सक्रिय है। आधिकारिक जीआईएस निर्देशांक, भीड़ गतिशीलता, सीडब्ल्यूसी गोदावरी जलस्तर और आपातकालीन बलों के साथ सीधे जुड़ा हुआ है। मैं आपकी क्या सहायता कर सकता हूँ?'
  };

  const [chatMessages, setChatMessages] = useState<JarvisMessage[]>(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('jarvis_demo') === 'true') {
      return [
        {
          id: 'demo-msg-1',
          sender: 'user',
          timestamp: '10:45:02 IST',
          text: 'Which ghat has the highest simulated crowd density?',
          language: 'en'
        },
        {
          id: 'demo-msg-2',
          sender: 'jarvis',
          timestamp: '10:45:03 IST',
          text: 'The ghat with the highest simulated crowd density is **Godavari Pushkar Ghat** with **2.08 pax/m²** (HIGH). Estimated active crowd is 8,420 devotees (33.7% occupancy).',
          language: 'en',
          directAnswer: 'The ghat with the highest simulated crowd density is **Godavari Pushkar Ghat** with **2.08 pax/m²** (HIGH). Estimated active crowd is 8,420 devotees (33.7% occupancy).',
          dataClassification: 'SIMULATED',
          relevantEntity: {
            type: 'GHAT',
            id: 'pushkar-ghat',
            name: 'Godavari Pushkar Ghat'
          },
          supportingMetrics: [
            { label: 'Highest Density', value: '2.08 pax/m²', variant: 'rose' },
            { label: 'Classification', value: 'HIGH', variant: 'amber' },
            { label: 'Simulated Crowd', value: '8,420', variant: 'cyan' },
            { label: 'Hourly Capacity', value: '25,000', variant: 'blue' }
          ],
          mapAction: {
            type: 'FLY_TO_GHAT',
            label: 'Fly Camera to Godavari Pushkar Ghat',
            explanation: 'JARVIS will reposition the 3D Cesium camera to inspect crowd tiers at Godavari Pushkar Ghat.',
            payload: { ghatId: 'pushkar-ghat' }
          },
          dashboardLinks: [
            { type: 'CROWD_CONTROLS', label: 'View Crowd Simulation Panel' },
            { type: 'ANALYTICS', label: 'Inspect Density Analytics' }
          ],
          suggestedNextActions: [
            'Which zones have low resource availability?',
            'Show all critical incidents'
          ]
        },
        {
          id: 'demo-msg-3',
          sender: 'user',
          timestamp: '10:45:15 IST',
          text: 'Dispatch ambulance to Pushkar Ghat',
          language: 'en'
        },
        {
          id: 'demo-msg-4',
          sender: 'jarvis',
          timestamp: '10:45:16 IST',
          text: 'Resource Dispatch Proposal Generated: Deployment of AMB-02 (Mobile ICU) to Pushkar Ghat requires explicit Human Commander authorization.',
          language: 'en',
          directAnswer: 'Resource Dispatch Proposal Generated: Deployment of AMB-02 (Mobile ICU) to Pushkar Ghat requires explicit Human Commander authorization.',
          dataClassification: 'AI_INFERRED',
          relevantEntity: {
            type: 'RESOURCE',
            id: 'res-dispatch-proposed',
            name: 'AMB-02 (Mobile ICU)'
          },
          supportingMetrics: [
            { label: 'Unit', value: 'AMB-02 (Mobile ICU)', variant: 'cyan' },
            { label: 'Destination', value: 'Pushkar Ghat', variant: 'blue' },
            { label: 'ETA', value: '3.4 mins', variant: 'emerald' },
            { label: 'Status', value: 'PENDING APPROVAL', variant: 'amber' }
          ],
          humanApproval: {
            requiresApproval: true,
            actionType: 'DISPATCH',
            actionTitle: 'Authorize Immediate Dispatch: AMB-02 (Mobile ICU)',
            rationale: 'Target area Pushkar Ghat requested emergency unit reinforcement. Automated dispatch is strictly blocked to maintain human command governance.',
            approvalStatus: 'PENDING',
            details: 'Unit: AMB-02 (Mobile ICU) | Destination: Pushkar Ghat | Est. Travel Time: 3.4 mins'
          },
          mapAction: {
            type: 'FLY_TO_GHAT',
            label: 'Preview Pushkar Ghat Location',
            explanation: 'JARVIS will orient the 3D globe camera over Pushkar Ghat to inspect approach corridors.',
            payload: { ghatId: 'pushkar-ghat' }
          },
          dashboardLinks: [
            { type: 'DISPATCH', label: 'Open Dispatch Console' }
          ]
        },
        {
          id: 'demo-msg-5',
          sender: 'user',
          timestamp: '10:45:30 IST',
          text: 'ఎన్ని మెడికల్ బృందాలు అందుబాటులో ఉన్నాయి?',
          language: 'te'
        },
        {
          id: 'demo-msg-6',
          sender: 'jarvis',
          timestamp: '10:45:31 IST',
          text: 'అందుబాటులో ఉన్న వైద్య వనరులు: **3 / 4 మెడికల్ క్యాంపు బృందాలు** సిద్ధంగా ఉన్నాయి. అలాగే **2 / 3 అంబులెన్సులు** అందుబాటులో ఉన్నాయి (2 బృందాలు విధుల్లో ఉన్నాయి).',
          language: 'te',
          directAnswer: 'అందుబాటులో ఉన్న వైద్య వనరులు: **3 / 4 మెడికల్ క్యాంపు బృందాలు** సిద్ధంగా ఉన్నాయి. అలాగే **2 / 3 అంబులెన్సులు** అందుబాటులో ఉన్నాయి (2 బృందాలు విధుల్లో ఉన్నాయి).',
          dataClassification: 'ADMIN_CONFIGURED',
          relevantEntity: {
            type: 'RESOURCE',
            id: 'res-med-fleet',
            name: 'Medical & Ambulance Fleet'
          },
          supportingMetrics: [
            { label: 'వైద్య బృందాలు', value: '3 బృందాలు', variant: 'emerald' },
            { label: 'అంబులెన్సులు', value: '2 వాహనాలు', variant: 'cyan' },
            { label: 'విధుల్లో ఉన్నవి', value: '2 యూనిట్లు', variant: 'amber' },
            { label: 'వైద్య కేంద్రాలు', value: '4 కేంద్రాలు', variant: 'blue' }
          ],
          mapAction: {
            type: 'SHOW_RESOURCES',
            label: 'Filter Medical Markers',
            explanation: 'JARVIS will filter map overlays to display all medical camps, first aid booths, and ambulances.',
            payload: { resourceCategory: 'MEDICAL' }
          },
          dashboardLinks: [
            { type: 'OPERATIONS', label: 'వనరుల రిజిస్టర్ చూడండి' }
          ]
        }
      ];
    }

    return [
      {
        id: 'msg-init-0',
        sender: 'jarvis',
        timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }) + ' IST',
        text: initialGreetingByLang['en'],
        language: 'en',
        directAnswer: initialGreetingByLang['en'],
        dataClassification: 'AI_INFERRED',
        suggestedNextActions: [
          'Which ghat has the highest simulated crowd density?',
          'Show all critical incidents',
          'How many medical teams are available?',
          'What is the Godavari water level and flood risk?'
        ]
      }
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUser: UserContext = {
    userId: `user-${userRole.toLowerCase()}-01`,
    name: userRole === 'COMMANDER' ? 'Capt. R. V. Sharma (Duty Commander)' : `Ops ${userRole}`,
    role: userRole,
    department: 'Pushkar Ghat Command & Control Center'
  };

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    // Subscribe to provider health
    const unsubHealth = providerManager.subscribe((health) => {
      setProviderHealth(health);
    });

    // Subscribe to audit logs
    setAuditLogs(aiSecurityGuard.getAuditHistory());
    const unsubAudits = aiSecurityGuard.subscribeToAudits((_entry) => {
      setAuditLogs(aiSecurityGuard.getAuditHistory());
    });

    return () => {
      unsubHealth();
      unsubAudits();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isLoading]);

  if (!isOpen) return null;

  // Language-based suggested questions
  const suggestedQuestionsByLang: Record<JarvisLanguage, string[]> = {
    en: [
      'Which ghat has the highest simulated crowd density?',
      'Show all critical incidents',
      'How many medical teams are available?',
      'Which zones have low resource availability?',
      'Compare the evacuation scenarios',
      'What is the current simulated evacuation progress?',
      'Generate today\'s operations summary',
      'Which incidents are awaiting resource assignment?',
      'What is the Godavari water level and flood risk?',
      'Fly camera to Kotilingala Ghat'
    ],
    te: [
      'ఏ ఘాట్‌లో అత్యధిక భక్తుల రద్దీ ఉంది?',
      'అత్యవసర సంఘటనలు చూపించు',
      'ఎన్ని మెడికల్ బృందాలు అందుబాటులో ఉన్నాయి?',
      'తక్కువ వనరులు ఉన్న జోన్లు ఏవి?',
      'తరలింపు దృశ్యాలను పోల్చండి',
      'ఈరోజు ఆపరేషన్స్ సారాంశం ఇవ్వండి',
      'గోదావరి నది వరద స్థాయి ఎంత?',
      'కోటిలింగాల ఘాట్‌కు కెమెరాను తీసుకెళ్లండి'
    ],
    hi: [
      'किस घाट पर सबसे अधिक भीड़ का घनत्व है?',
      'महत्वपूर्ण आपातकालीन घटनाएं दिखाएं',
      'कितनी मेडिकल टीमें उपलब्ध हैं?',
      'किन क्षेत्रों में संसाधन कम हैं?',
      'निकासी परिदृश्यों की तुलना करें',
      'आज का संचालन सारांश बताएं',
      'गोदावरी का जलस्तर और बाढ़ का खतरा क्या है?',
      'पुष्कर घाट पर कैमरा ले जाएं'
    ]
  };

  const handleLanguageChange = (lang: JarvisLanguage) => {
    setSelectedLanguage(lang);
  };

  const handleClearChat = () => {
    setChatMessages([
      {
        id: `msg-reset-${Date.now()}`,
        sender: 'jarvis',
        timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }) + ' IST',
        text: initialGreetingByLang[selectedLanguage],
        language: selectedLanguage,
        directAnswer: initialGreetingByLang[selectedLanguage],
        dataClassification: 'AI_INFERRED',
        suggestedNextActions: suggestedQuestionsByLang[selectedLanguage].slice(0, 4)
      }
    ]);
  };

  const handleSendPrompt = async (customPrompt?: string) => {
    const queryText = (customPrompt || prompt).trim();
    if (!queryText || isLoading) return;

    setPrompt('');
    const nowTimestamp = new Date().toLocaleTimeString('en-IN', { hour12: false }) + ' IST';
    const userMsg: JarvisMessage = {
      id: `user-msg-${Date.now()}`,
      sender: 'user',
      timestamp: nowTimestamp,
      text: queryText,
      language: selectedLanguage
    };

    setChatMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const jarvisResponse = await jarvisNLEngine.processQuery(queryText, {
        user: currentUser,
        forcedLanguage: selectedLanguage
      });

      setChatMessages(prev => [...prev, jarvisResponse]);

      // If response includes auto-executable read-only map action, trigger it
      if (jarvisResponse.mapAction && jarvisResponse.mapAction.type === 'FLY_TO_GHAT') {
        handleExecuteMapAction(jarvisResponse.mapAction);
      }
    } catch (err: any) {
      const errMsg: JarvisMessage = {
        id: `err-msg-${Date.now()}`,
        sender: 'jarvis',
        timestamp: nowTimestamp,
        text: `JARVIS Query Failed: ${err.message || 'System encountered an unexpected exception'}`,
        language: selectedLanguage,
        isError: true,
        dataClassification: 'AI_INFERRED'
      };
      setChatMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteMapAction = (action: JarvisMapAction) => {
    setActiveExecutedMapAction(action.label);
    setTimeout(() => setActiveExecutedMapAction(null), 3500);

    try {
      switch (action.type) {
        case 'FLY_TO_GHAT':
          if (action.payload.coordinates) {
            cesiumService.flyToCoordinates(
              action.payload.coordinates.longitude,
              action.payload.coordinates.latitude,
              action.payload.coordinates.height || 450
            );
          } else if (action.payload.ghatId) {
            cesiumService.flyToGhat(action.payload.ghatId);
          }
          break;

        case 'HIGHLIGHT_ZONE':
          if (action.payload.zoneId) {
            cesiumService.highlightZone(action.payload.zoneId);
          }
          break;

        case 'FOCUS_INCIDENT':
          if (action.payload.incidentId) {
            cesiumService.focusIncident(action.payload.incidentId);
          }
          break;

        case 'HIGHLIGHT_EVAC_ROUTE':
          cesiumService.highlightEvacuationRoute(action.payload.routeId);
          break;

        case 'SHOW_RESOURCES':
          cesiumService.flyToCoordinates(81.7669, 17.0084, 850);
          break;

        case 'RESET_VIEW':
          cesiumService.flyToInitialPosition(true);
          break;
      }
    } catch (err) {
      console.warn('[AICopilotDrawer] Map action execution failed non-critically:', err);
    }
  };

  const handleAuthorizeAction = (messageId: string, decision: 'APPROVED' | 'REJECTED') => {
    try {
      // Find audit or create audit entry
      aiSecurityGuard.processHumanDecision(messageId, currentUser, decision, `Authorized via JARVIS Copilot console by ${currentUser.name}`);
      setAuditLogs(aiSecurityGuard.getAuditHistory());

      // Update message in state
      setChatMessages(prev => prev.map(m => {
        if (m.id === messageId && m.humanApproval) {
          return {
            ...m,
            humanApproval: {
              ...m.humanApproval,
              approvalStatus: decision,
              reviewedBy: currentUser.name,
              reviewedAt: new Date().toISOString()
            }
          };
        }
        return m;
      }));
    } catch (err: any) {
      alert(`Authorization failed: ${err.message}`);
    }
  };

  const handleRunCrowdPrediction = async (horizon: 15 | 30 | 60 | 120) => {
    setIsLoading(true);
    try {
      const res = await crowdPredictionService.predictCrowd({ horizonMinutes: horizon }, { userId: currentUser.userId, role: currentUser.role });
      setCurrentResponse(res);
    } catch (err: any) {
      alert(`Prediction failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunAnomalyScan = async () => {
    setIsLoading(true);
    try {
      const res = await anomalyDetectionService.scanAnomalies({ sensitivityThreshold: 'NORMAL' }, { userId: currentUser.userId, role: currentUser.role });
      setCurrentResponse(res);
    } catch (err: any) {
      alert(`Anomaly scan failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunFloodAnalysis = async () => {
    setIsLoading(true);
    try {
      const res = await floodIntelligenceService.analyzeFloodRisk({}, { userId: currentUser.userId, role: currentUser.role });
      setCurrentResponse(res);
    } catch (err: any) {
      alert(`Flood intelligence failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSitrep = async () => {
    setIsLoading(true);
    try {
      const res = await reportGenerationService.generateReport({ format: 'MARKDOWN' }, { userId: currentUser.userId, role: currentUser.role });
      setCurrentResponse(res);
      setActiveTab('chat');
      setChatMessages(prev => [
        ...prev,
        {
          id: `sitrep-${Date.now()}`,
          sender: 'jarvis',
          timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }) + ' IST',
          text: `Generated official Situation Report (${res.payload.reportId}). Review executive summary below.`,
          language: selectedLanguage,
          directAnswer: `Generated official Situation Report (${res.payload.reportId}). Review executive summary below.`,
          dataClassification: 'AI_INFERRED',
          supportingMetrics: [
            { label: 'Report ID', value: res.payload.reportId, variant: 'cyan' },
            { label: 'Classification', value: 'OFFICIAL SITREP', variant: 'blue' }
          ],
          dashboardLinks: [
            { type: 'ANALYTICS', label: 'View Full SITREP in Analytics' }
          ]
        }
      ]);
    } catch (err: any) {
      alert(`SITREP failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateTeluguAnnouncement = async () => {
    setIsLoading(true);
    try {
      const res = await publicAnnouncementService.generateAnnouncement(
        {
          eventType: 'CROWD_DIVERSION',
          targetLocation: 'Pushkar Ghat Sacred Steps',
          language: 'TELUGU_AND_ENGLISH',
          tone: 'CALM'
        },
        { userId: currentUser.userId, role: currentUser.role }
      );
      setCurrentResponse(res);
      setActiveTab('chat');
      setChatMessages(prev => [
        ...prev,
        {
          id: `ann-${Date.now()}`,
          sender: 'jarvis',
          timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }) + ' IST',
          text: `Drafted bilingual public safety announcement (${res.payload.announcementId}). Human Commander authorization required.`,
          language: 'te',
          directAnswer: `భక్తులందరికీ విజ్ఞప్తి: పుష్కర ఘాట్ వద్ద భక్తుల రద్దీ ఎక్కువగా ఉన్నందున, దయచేసి సమీపంలోని సరస్వతి ఘాట్ మరియు మార్కండేయ ఘాట్ వైపు తరలివెళ్లాల్సిందిగా కోరుతున్నాము.`,
          dataClassification: 'AI_INFERRED',
          humanApproval: res.humanApproval
        }
      ]);
    } catch (err: any) {
      alert(`Announcement failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getClassificationBadgeVariant = (cls?: DataClassification) => {
    switch (cls) {
      case 'VERIFIED': return 'emerald';
      case 'ADMIN_CONFIGURED': return 'cyan';
      case 'SIMULATED': return 'amber';
      case 'AI_INFERRED': return 'blue';
      default: return 'slate';
    }
  };

  const pendingApprovals = auditLogs.filter(l => l.requiresHumanApproval && l.approvalStatus === 'PENDING');

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-slate-950/95 backdrop-blur-xl border-l border-cyan-500/30 shadow-2xl flex flex-col font-mono text-slate-200 transition-all duration-300">
      {/* 1. Header Bar: JARVIS Command Center */}
      <div className="p-4 border-b border-cyan-500/20 bg-slate-900/90 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-indigo-500 flex items-center justify-center shadow-glow-sm relative">
            <Radio className="w-4 h-4 text-slate-950 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-950 animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-cyan-200 tracking-wider uppercase flex items-center gap-1.5">
                <span>JARVIS</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-normal">
                  COPILOT
                </span>
              </h2>
              <Badge variant={providerHealth?.connected ? 'emerald' : 'amber'} size="sm">
                {providerHealth?.activeProvider.toUpperCase() || 'MOCK'} {providerHealth?.connected ? 'ONLINE' : 'CONNECTING'}
              </Badge>
            </div>
            <p className="text-[10px] text-slate-400">
              Godavari Pushkar Ghat Intelligent Command Assistant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[10px]">
            {(['en', 'te', 'hi'] as const).map((langCode) => (
              <button
                key={langCode}
                onClick={() => handleLanguageChange(langCode)}
                className={`px-2 py-1 rounded font-bold transition-all ${
                  selectedLanguage === langCode
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-cyan-300'
                }`}
                title={`Switch response language to ${langCode.toUpperCase()}`}
              >
                {langCode === 'en' ? 'EN' : langCode === 'te' ? 'తెలుగు' : 'हिन्दी'}
              </button>
            ))}
          </div>

          {/* RBAC Role Selector */}
          <div className="flex items-center gap-1 text-[10px] bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
            <Shield className="w-3 h-3 text-cyan-400" />
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as UserRole)}
              className="bg-transparent text-cyan-300 font-bold focus:outline-none cursor-pointer"
              title="Switch user role to test RBAC permissions"
            >
              <option value="OPERATOR" className="bg-slate-900">OPERATOR</option>
              <option value="DISPATCHER" className="bg-slate-900">DISPATCHER</option>
              <option value="COMMANDER" className="bg-slate-900">COMMANDER</option>
              <option value="ADMIN" className="bg-slate-900">ADMIN</option>
            </select>
          </div>

          {/* Clear Chat Button */}
          <button
            onClick={handleClearChat}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
            title="Clear Chat Conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => providerManager.refreshHealth()}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 border border-slate-800 transition-colors"
            title="Refresh Provider Health"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
            title="Close Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Sub-Navigation Tabs */}
      <div className="px-4 py-2 border-b border-slate-800 bg-slate-950/80 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0 custom-scrollbar">
        {[
          { key: 'chat', label: 'Command Chat', icon: Sparkles },
          { key: 'predictions', label: 'Crowd Forecast', icon: Users },
          { key: 'anomalies', label: 'Anomaly Scan', icon: AlertTriangle },
          { key: 'flood', label: 'Godavari Flood', icon: Waves },
          { 
            key: 'approvals', 
            label: `Human Approvals (${pendingApprovals.length})`, 
            icon: ShieldAlert,
            badge: pendingApprovals.length > 0 ? 'rose' : undefined
          },
          { key: 'audit', label: 'Audit Trail', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-glow-sm font-bold'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Active Executed Map Action Pill */}
      {activeExecutedMapAction && (
        <div className="px-4 py-1.5 bg-cyan-950/90 border-b border-cyan-500/40 text-[10px] text-cyan-200 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-1.5 font-bold">
            <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span>Map Action Executed: {activeExecutedMapAction}</span>
          </div>
          <span className="text-slate-400 text-[9px]">3D Viewport Synchronized</span>
        </div>
      )}

      {/* 3. Main Views */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {/* VIEW A: JARVIS NATURAL LANGUAGE CHAT */}
        {activeTab === 'chat' && (
          <div className="space-y-4">
            {/* Suggested Question Pills */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  <span>Suggested Operational Directives:</span>
                </span>
                <span className="text-[9px] text-cyan-400/80">
                  {selectedLanguage === 'en' ? 'English' : selectedLanguage === 'te' ? 'తెలుగు' : 'हिन्दी'} Mode Active
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {suggestedQuestionsByLang[selectedLanguage].slice(0, 5).map((qp, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendPrompt(qp)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-cyan-950/80 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 text-left transition-all"
                  >
                    {qp}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Conversation Thread */}
            <div className="space-y-3 pt-2">
              {chatMessages.map((msg, index) => (
                <div
                  key={msg.id || index}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[92%] p-3.5 rounded-2xl text-xs font-mono leading-relaxed transition-all ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white rounded-br-none shadow-glow-sm'
                        : msg.isError
                        ? 'bg-rose-950/60 border border-rose-500/50 text-rose-200 rounded-bl-none shadow-panel'
                        : 'bg-slate-900/95 border border-slate-800 text-slate-200 rounded-bl-none shadow-panel'
                    }`}
                  >
                    {/* Header: Sender & Tag */}
                    <div className="text-[9px] font-bold text-slate-400 mb-1.5 flex items-center justify-between gap-2 border-b border-slate-800/60 pb-1">
                      <div className="flex items-center gap-1.5">
                        <span className={msg.sender === 'user' ? 'text-white' : 'text-cyan-300 font-bold'}>
                          {msg.sender === 'user' ? currentUser.name : 'JARVIS Command Assistant'}
                        </span>
                        <span className="text-[9px] text-slate-500">[{msg.timestamp}]</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {msg.relevantEntity && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 text-[9px] border border-cyan-500/20">
                            {msg.relevantEntity.name}
                          </span>
                        )}
                        {msg.dataClassification && (
                          <Badge variant={getClassificationBadgeVariant(msg.dataClassification)} size="sm">
                            {msg.dataClassification}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Direct Answer */}
                    <div className="whitespace-pre-line text-[12px] leading-relaxed text-slate-100">
                      {msg.directAnswer || msg.text}
                    </div>

                    {/* Missing Data Disclosure Notice */}
                    {msg.missingDataNotice && (
                      <div className="mt-2.5 p-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-200 text-[10px]">
                        <strong>Scope Limitation:</strong> {msg.missingDataNotice}
                      </div>
                    )}

                    {/* Supporting Metrics Grid */}
                    {msg.supportingMetrics && msg.supportingMetrics.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                        <div className="text-[9px] text-slate-400 uppercase tracking-wider mb-1.5 font-bold flex items-center gap-1">
                          <Activity className="w-3 h-3 text-cyan-400" />
                          <span>Telemetry & Connected Metrics:</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {msg.supportingMetrics.map((met, mIdx) => (
                            <div 
                              key={mIdx}
                              className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-[11px]"
                            >
                              <span className="text-slate-400 text-[10px]">{met.label}</span>
                              <span className={`font-bold ${
                                met.variant === 'rose' ? 'text-rose-400' :
                                met.variant === 'emerald' ? 'text-emerald-400' :
                                met.variant === 'amber' ? 'text-amber-400' :
                                met.variant === 'purple' ? 'text-purple-400' : 'text-cyan-300'
                              }`}>
                                {met.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Map Action Execution Card */}
                    {msg.mapAction && (
                      <div className="mt-3 p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-[11px] space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-cyan-300 font-bold text-[10px] uppercase">
                            <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                            <span>Authorized 3D Map Action</span>
                          </div>
                          <span className="text-[9px] text-slate-400">Cesium Visualizer</span>
                        </div>
                        <p className="text-[10px] text-slate-300 leading-snug">
                          {msg.mapAction.explanation}
                        </p>
                        <button
                          onClick={() => handleExecuteMapAction(msg.mapAction!)}
                          className="w-full mt-1 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-sm transition"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{msg.mapAction.label}</span>
                        </button>
                      </div>
                    )}

                    {/* Human Approval Required Preview Card */}
                    {msg.humanApproval && msg.humanApproval.requiresApproval && (
                      <div className="mt-3 p-3 rounded-xl bg-amber-950/70 border border-amber-500/60 text-amber-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-xs text-amber-300">
                            <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse" />
                            <span>{msg.humanApproval.actionTitle || 'Commander Authorization Required'}</span>
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            msg.humanApproval.approvalStatus === 'APPROVED' ? 'bg-emerald-500/30 text-emerald-300' :
                            msg.humanApproval.approvalStatus === 'REJECTED' ? 'bg-rose-500/30 text-rose-300' :
                            'bg-amber-500/30 text-amber-300 animate-pulse'
                          }`}>
                            {msg.humanApproval.approvalStatus}
                          </span>
                        </div>
                        <p className="text-[10px] text-amber-200/90 leading-snug">
                          {msg.humanApproval.rationale}
                        </p>
                        {msg.humanApproval.details && (
                          <div className="p-1.5 rounded bg-amber-900/40 text-[10px] text-amber-300 font-mono">
                            {msg.humanApproval.details}
                          </div>
                        )}
                        {msg.humanApproval.approvalStatus === 'PENDING' ? (
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => handleAuthorizeAction(msg.id, 'APPROVED')}
                              className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] flex items-center justify-center gap-1 shadow-sm transition"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Authorize Action (Commander)</span>
                            </button>
                            <button
                              onClick={() => handleAuthorizeAction(msg.id, 'REJECTED')}
                              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center gap-1 shadow-sm transition"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Decline</span>
                            </button>
                          </div>
                        ) : msg.humanApproval.approvalStatus === 'APPROVED' ? (
                          <div className="text-[10px] text-emerald-300 font-bold flex items-center gap-1 pt-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Action authorized by {msg.humanApproval.reviewedBy || currentUser.name} (Immutable Audit Recorded)</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-rose-300 font-bold flex items-center gap-1 pt-1">
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            <span>Action rejected by Commander. No dispatches initiated.</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Dashboard Module Deep Links */}
                    {msg.dashboardLinks && msg.dashboardLinks.length > 0 && onNavigateToModule && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                        {msg.dashboardLinks.map((link, lIdx) => (
                          <button
                            key={lIdx}
                            onClick={() => onNavigateToModule(link.type as any, link.tab)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-cyan-300 border border-slate-700 hover:border-cyan-500/40 text-[10px] font-bold flex items-center gap-1 transition"
                          >
                            <ExternalLink className="w-3 h-3 text-cyan-400" />
                            <span>{link.label}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Suggested Follow-Up Prompts */}
                    {msg.suggestedNextActions && msg.suggestedNextActions.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-800/60">
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">
                          Suggested Inquiries:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {msg.suggestedNextActions.map((sug, sIdx) => (
                            <button
                              key={sIdx}
                              onClick={() => handleSendPrompt(sug)}
                              className="text-[10px] px-2 py-0.5 rounded bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700/60 text-left transition flex items-center gap-1"
                            >
                              <ChevronRight className="w-2.5 h-2.5 text-cyan-400" />
                              <span>{sug}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2.5 p-3.5 bg-slate-900/90 rounded-2xl border border-cyan-500/30 w-fit text-xs text-cyan-300 shadow-panel animate-pulse">
                  <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                  <span>JARVIS querying connected simulation engines & compiling telemetry...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* VIEW B: CROWD PREDICTIONS */}
        {activeTab === 'predictions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
              <div>
                <h3 className="text-xs font-bold text-cyan-300 uppercase">
                  Predictive Crowd Forecaster
                </h3>
                <p className="text-[10px] text-slate-400">
                  Select forecasting horizon to evaluate crowd surge probabilities
                </p>
              </div>
              <div className="flex gap-1">
                {([15, 30, 60, 120] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => handleRunCrowdPrediction(m)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-slate-700 text-xs font-bold"
                  >
                    +{m}m
                  </button>
                ))}
              </div>
            </div>

            {currentResponse && currentResponse.service === 'CrowdPrediction' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Overall Ingress Trend</span>
                    <span className="text-lg font-bold text-cyan-300">
                      {currentResponse.payload.overallTrend}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Projected Devotees</span>
                    <span className="text-lg font-bold text-emerald-300">
                      {currentResponse.payload.totalProjectedDevotees?.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Ghat-Wise Surge Forecast:
                  </h4>
                  {currentResponse.payload.ghatForecasts?.map((gf: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-200">{gf.ghatName}</div>
                        <div className="text-[10px] text-slate-400">
                          Current: {gf.currentDensity} pax/m² → Projected: <strong className="text-amber-300">{gf.projectedDensity} pax/m²</strong>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={gf.surgeRiskLevel === 'HIGH' ? 'rose' : gf.surgeRiskLevel === 'MODERATE' ? 'amber' : 'emerald'} size="sm">
                          {gf.surgeRiskLevel}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW C: ANOMALY DETECTION */}
        {activeTab === 'anomalies' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
              <div>
                <h3 className="text-xs font-bold text-amber-300 uppercase">
                  Spatial Anomaly Scanner
                </h3>
                <p className="text-[10px] text-slate-400">
                  Real-time density deviations and bottleneck hotspot detection
                </p>
              </div>
              <button
                onClick={handleRunAnomalyScan}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold"
              >
                Scan Now
              </button>
            </div>

            {currentResponse && currentResponse.service === 'AnomalyDetection' && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">System Health Score</span>
                    <span className="text-2xl font-bold text-cyan-300">
                      {currentResponse.payload.systemHealthScore} / 100
                    </span>
                  </div>
                  <Badge variant={currentResponse.payload.systemHealthScore > 80 ? 'emerald' : currentResponse.payload.systemHealthScore > 60 ? 'amber' : 'rose'}>
                    {currentResponse.payload.systemHealthScore > 80 ? 'STABLE' : 'ADVISORY'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Detected Anomalies ({currentResponse.payload.totalAnomaliesDetected}):
                  </h4>
                  {currentResponse.payload.anomalies?.map((anom: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">{anom.location}</span>
                        <Badge variant={anom.severity === 'CRITICAL' ? 'rose' : anom.severity === 'HIGH' ? 'amber' : 'cyan'} size="sm">
                          {anom.severity}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-300">{anom.description}</p>
                      <div className="text-[10px] text-cyan-400 font-bold">
                        Recommendation: {anom.suggestedAction}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW D: GODAVARI FLOOD INTELLIGENCE */}
        {activeTab === 'flood' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
              <div>
                <h3 className="text-xs font-bold text-sky-300 uppercase">
                  Godavari River Flood Intelligence
                </h3>
                <p className="text-[10px] text-slate-400">
                  CWC Gauge heights, Dowleswaram barrage discharge, and submergence risks
                </p>
              </div>
              <button
                onClick={handleRunFloodAnalysis}
                className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-bold"
              >
                Evaluate River
              </button>
            </div>

            {currentResponse && currentResponse.service === 'FloodIntelligence' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">CWC Gauge Elevation</span>
                    <span className="text-xl font-bold text-cyan-300">
                      {currentResponse.payload.cwcWaterLevelMsl}m MSL
                    </span>
                    <span className="text-[10px] text-slate-500 block">Danger: {currentResponse.payload.dangerLevelMsl}m</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Submergence Risk</span>
                    <span className="text-xl font-bold text-emerald-300">
                      {currentResponse.payload.submergenceRiskLevel}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Discharge: {currentResponse.payload.barrageDischargeCusecs.toLocaleString()} cusecs</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Ghat Steps Submergence Status:
                  </h4>
                  {currentResponse.payload.ghatSubmergenceStatus?.map((gs: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-200">{gs.ghatName}</div>
                        <div className="text-[10px] text-slate-400">
                          Step Crest: {gs.elevationMsl}m MSL • Clearance: <strong className="text-cyan-300">{gs.freeboardClearanceMeters}m</strong>
                        </div>
                      </div>
                      <Badge variant={gs.isSubmerged ? 'rose' : 'emerald'} size="sm">
                        {gs.isSubmerged ? 'SUBMERGED' : 'DRY & SAFE'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW E: HUMAN APPROVALS QUEUE */}
        {activeTab === 'approvals' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
              <div>
                <h3 className="text-xs font-bold text-rose-300 uppercase">
                  Human-in-the-Loop Operations Queue
                </h3>
                <p className="text-[10px] text-slate-400">
                  Advisory AI actions awaiting authorized Incident Commander sign-off
                </p>
              </div>
              <span className="text-xs font-bold text-rose-400">
                {pendingApprovals.length} Pending
              </span>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="text-center p-8 bg-slate-900/40 rounded-2xl border border-slate-800/80 text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                <p>No operational dispatches or alerts currently pending Commander authorization.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingApprovals.map((appr) => (
                  <div key={appr.id} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-cyan-300">Query: "{appr.query}"</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(appr.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      {appr.responseSummary}
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] text-slate-400">
                        Requested by: <strong>{appr.user.name}</strong> ({appr.user.role})
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAuthorizeAction(appr.id, 'APPROVED')}
                          className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-sm transition"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Authorize
                        </button>
                        <button
                          onClick={() => handleAuthorizeAction(appr.id, 'REJECTED')}
                          className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-sm transition"
                        >
                          <XCircle className="w-3 h-3" /> Decline
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW F: AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase">
                  AI Governance Audit Trail
                </h3>
                <p className="text-[10px] text-slate-400">
                  Immutable log of all AI prompts, outputs, classifications, and human sign-offs
                </p>
              </div>
              <span className="text-xs font-bold text-cyan-400">
                {auditLogs.length} Records
              </span>
            </div>

            <div className="space-y-2.5">
              {auditLogs.slice(0, 15).map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-slate-300">{log.service}</span>
                    <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-400 text-[11px] truncate">"{log.query}"</p>
                  <div className="flex items-center justify-between text-[10px] pt-1">
                    <span className="text-slate-400">Actor: {log.user.name}</span>
                    <Badge variant={log.approvalStatus === 'APPROVED' ? 'emerald' : log.approvalStatus === 'REJECTED' ? 'rose' : log.approvalStatus === 'PENDING' ? 'amber' : 'slate'} size="sm">
                      {log.approvalStatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Bottom Command Input Bar */}
      <div className="p-3.5 border-t border-cyan-500/20 bg-slate-900/95 space-y-2 shrink-0">
        <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerateSitrep}
              className="hover:text-cyan-300 transition flex items-center gap-1 font-bold"
            >
              <FileText className="w-3 h-3 text-cyan-400" /> SITREP Report
            </button>
            <button
              onClick={handleGenerateTeluguAnnouncement}
              className="hover:text-cyan-300 transition flex items-center gap-1 font-bold"
            >
              <Volume2 className="w-3 h-3 text-sky-400" /> PA Broadcast
            </button>
          </div>
          <span className="text-[9px] text-slate-500">
            Advisory AI Only • Requires Human Sign-Off
          </span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendPrompt();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              selectedLanguage === 'te' 
                ? 'జార్విస్ కు ప్రశ్న అడగండి (ఉదా: రద్దీ, వరద స్థాయి, సహాయక బృందాలు)...' 
                : selectedLanguage === 'hi' 
                ? 'जार्विस से प्रश्न पूछें (उदा: भीड़ घनत्व, बाढ़ खतरा, प्रेषण)...' 
                : 'Ask JARVIS (e.g. highest density ghat, critical incidents, medical availability)...'
            }
            disabled={isLoading}
            className="flex-1 bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 shadow-inner font-mono"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow-glow-sm transition"
            title="Transmit Command"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
