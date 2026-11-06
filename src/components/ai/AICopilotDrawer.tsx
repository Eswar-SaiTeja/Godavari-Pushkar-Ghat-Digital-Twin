/**
 * AI Intelligence Copilot Drawer
 * Command-center conversational copilot and analytics dashboard.
 * Connects all 8 AI services, displays data classifications, confidence meters,
 * and human-in-the-loop authorization workflows.
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
  Volume2
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { aiCommandAssistantService } from '../../ai/services/aiCommandAssistant';
import { crowdPredictionService } from '../../ai/services/crowdPredictionService';
import { anomalyDetectionService } from '../../ai/services/anomalyDetectionService';
import { floodIntelligenceService } from '../../ai/services/floodIntelligenceService';
import { reportGenerationService } from '../../ai/services/reportGenerationService';
import { publicAnnouncementService } from '../../ai/services/publicAnnouncementService';
import { providerManager } from '../../ai/providers/providerManager';
import { aiSecurityGuard } from '../../ai/safety/aiSecurityGuard';
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
}

export const AICopilotDrawer: React.FC<AICopilotDrawerProps> = ({
  isOpen,
  onClose,
  initialTab = 'chat',
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'predictions' | 'anomalies' | 'flood' | 'approvals' | 'audit'>(initialTab);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentResponse, setCurrentResponse] = useState<AIStructuredResponse | null>(null);
  const [providerHealth, setProviderHealth] = useState<AIProviderHealth | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('COMMANDER');
  const [auditLogs, setAuditLogs] = useState<AIAuditLogEntry[]>([]);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; response?: AIStructuredResponse }>>([
    {
      sender: 'ai',
      text: 'Godavari Digital Twin AI Copilot initialized. Grounded in verified WGS84 GIS boundaries, CWC hydrology benchmarks, and real-time crowd dynamics. How may I assist riverfront command operations?'
    }
  ]);

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

  const handleSendPrompt = async (customPrompt?: string) => {
    const queryText = (customPrompt || prompt).trim();
    if (!queryText || isLoading) return;

    setPrompt('');
    setChatMessages(prev => [...prev, { sender: 'user', text: queryText }]);
    setIsLoading(true);

    try {
      const response = await aiCommandAssistantService.query(
        { prompt: queryText },
        { userId: currentUser.userId, role: currentUser.role }
      );
      setCurrentResponse(response);
      setChatMessages(prev => [
        ...prev, 
        { sender: 'ai', text: response.summary, response }
      ]);
    } catch (err: any) {
      setChatMessages(prev => [
        ...prev, 
        { sender: 'ai', text: `AI Request Failed: ${err.message || 'Unknown error'}` }
      ]);
    } finally {
      setIsLoading(false);
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
        { sender: 'ai', text: `Generated official Situation Report (${res.payload.reportId}). Review details below.`, response: res }
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
        { sender: 'ai', text: `Drafted bilingual public safety announcement (${res.payload.announcementId}). Human Commander authorization required.`, response: res }
      ]);
    } catch (err: any) {
      alert(`Announcement failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthorizeAction = (auditId: string, decision: 'APPROVED' | 'REJECTED') => {
    try {
      aiSecurityGuard.processHumanDecision(auditId, currentUser, decision, `Authorized via AI Copilot console by ${currentUser.name}`);
      setAuditLogs(aiSecurityGuard.getAuditHistory());
      // Refresh current response view
      if (currentResponse) {
        setCurrentResponse({
          ...currentResponse,
          humanApproval: {
            ...currentResponse.humanApproval,
            approvalStatus: decision,
            reviewedBy: currentUser.name,
            reviewedAt: new Date().toISOString()
          }
        });
      }
    } catch (err: any) {
      alert(`Authorization failed: ${err.message}`);
    }
  };

  const getClassificationBadgeVariant = (cls: DataClassification) => {
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
      {/* 1. Header Bar */}
      <div className="p-4 border-b border-cyan-500/20 bg-slate-900/90 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-sky-400 flex items-center justify-center shadow-glow-sm">
            <Sparkles className="w-4 h-4 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-cyan-200 tracking-wider uppercase">
                AI Intelligence Copilot
              </h2>
              <Badge variant={providerHealth?.connected ? 'emerald' : 'amber'} size="sm">
                {providerHealth?.activeProvider.toUpperCase() || 'MOCK'} {providerHealth?.connected ? 'ONLINE' : 'CONNECTING'}
              </Badge>
            </div>
            <p className="text-[10px] text-slate-400">
              Godavari Twin Real-Time Advisory & Operations Governance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* RBAC Role Selector for testing */}
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

      {/* 3. Main Tab Views */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {/* VIEW A: CHAT & COMMAND ASSISTANT */}
        {activeTab === 'chat' && (
          <div className="space-y-4">
            {/* Quick Prompt Pills */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest">
                Quick Operational Directives:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'What is the current crowd density at Pushkar Ghat?',
                  'Predict crowd surges for the next 60 minutes',
                  'Is Godavari river level safe at Havelock Bridge?',
                  'Recommend ambulance & police deployments',
                  'Draft Telugu emergency diversion announcement'
                ].map((qp, idx) => (
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

            {/* Chat Thread */}
            <div className="space-y-3 pt-2">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[90%] p-3 rounded-2xl text-xs font-mono leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-cyan-600 text-white rounded-br-none shadow-glow-sm'
                        : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-none shadow-panel'
                    }`}
                  >
                    <div className="text-[9px] font-bold text-slate-400 mb-1 flex items-center justify-between gap-2">
                      <span>{msg.sender === 'user' ? currentUser.name : 'AI Intelligence Copilot'}</span>
                      {msg.response && (
                        <Badge variant={getClassificationBadgeVariant(msg.response.dataClassification)} size="sm">
                          {msg.response.dataClassification}
                        </Badge>
                      )}
                    </div>
                    <div className="whitespace-pre-line">{msg.text}</div>

                    {/* Structured Response Breakdown */}
                    {msg.response && (
                      <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2.5 text-[11px]">
                        {/* Recommendations */}
                        {msg.response.recommendations?.length > 0 && (
                          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                            <span className="text-cyan-400 font-bold block mb-1">
                              Actionable Recommendations:
                            </span>
                            <ul className="list-disc pl-4 space-y-0.5 text-slate-300 text-[10px]">
                              {msg.response.recommendations.map((rec, rIdx) => (
                                <li key={rIdx}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Human Approval Required Banner */}
                        {msg.response.humanApproval?.requiresApproval && (
                          <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-200 space-y-1.5">
                            <div className="flex items-center gap-1.5 font-bold text-xs text-amber-300">
                              <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse" />
                              <span>{msg.response.humanApproval.actionTitle}</span>
                            </div>
                            <p className="text-[10px] text-amber-200/90 leading-snug">
                              {msg.response.humanApproval.rationale}
                            </p>
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[9px] font-bold">
                                Status: <span className="text-amber-400">{msg.response.humanApproval.approvalStatus}</span>
                              </span>
                              {msg.response.humanApproval.approvalStatus === 'PENDING' && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleAuthorizeAction(msg.response!.id, 'APPROVED')}
                                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-sm transition"
                                  >
                                    <CheckCircle2 className="w-3 h-3" /> Authorize
                                  </button>
                                  <button
                                    onClick={() => handleAuthorizeAction(msg.response!.id, 'REJECTED')}
                                    className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-sm transition"
                                  >
                                    <XCircle className="w-3 h-3" /> Decline
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Confidence & Classification Pill */}
                        <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1">
                          <span>
                            Confidence: <strong className="text-cyan-400">{Math.round((msg.response.confidence?.score || 0.9) * 100)}%</strong> ({msg.response.confidence?.level || 'HIGH'})
                          </span>
                          <span>Model: {msg.response.model}</span>
                          <span>Latency: {msg.response.latencyMs}ms</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 p-3 bg-slate-900/80 rounded-2xl border border-slate-800 w-fit text-xs text-cyan-300 animate-pulse">
                  <Sparkles className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Synthesizing live Digital Twin streams & generating inference...</span>
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
                      {currentResponse.payload.totalProjectedDevotees.toLocaleString()}
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
                        <Badge variant={gf.riskLevel === 'HIGH' ? 'rose' : gf.riskLevel === 'MODERATE' ? 'amber' : 'emerald'} size="sm">
                          {Math.round(gf.surgeProbability * 100)}% Surge Risk
                        </Badge>
                        <div className="text-[9px] text-slate-400 mt-1">{gf.estimatedPeakTime}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW C: ANOMALIES */}
        {activeTab === 'anomalies' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
              <div>
                <h3 className="text-xs font-bold text-amber-300 uppercase">
                  Spatial Anomaly Scanner
                </h3>
                <p className="text-[10px] text-slate-400">
                  Detects localized crowd surges, stalled flow vectors, and corridor blockages
                </p>
              </div>
              <button
                onClick={handleRunAnomalyScan}
                className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-glow-sm"
              >
                Scan Now
              </button>
            </div>

            {currentResponse && currentResponse.service === 'AnomalyDetection' && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                  <span>System Spatial Health Score:</span>
                  <span className="text-xl font-bold text-emerald-400">
                    {currentResponse.payload.systemHealthScore} / 100
                  </span>
                </div>

                <div className="space-y-2">
                  {currentResponse.payload.anomalies?.map((anom: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-900/90 border border-rose-500/40 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-300">{anom.title}</span>
                        <Badge variant="rose" size="sm">{anom.severity}</Badge>
                      </div>
                      <div className="text-[11px] text-slate-300">Location: {anom.location}</div>
                      <div className="text-[10px] text-slate-400">
                        Observed: <strong className="text-rose-400">{anom.observedValue}</strong> (Baseline: {anom.expectedBaseline})
                      </div>
                      <div className="p-2 rounded bg-slate-950/80 border border-slate-800 text-[10px] text-cyan-300">
                        Recommended Action: {anom.recommendedAction}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW D: FLOOD & RIVER */}
        {activeTab === 'flood' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
              <div>
                <h3 className="text-xs font-bold text-sky-300 uppercase">
                  Godavari Hydrology & Flood Risk
                </h3>
                <p className="text-[10px] text-slate-400">
                  CWC Rajahmundry benchmarks & barrage regulated discharge
                </p>
              </div>
              <button
                onClick={handleRunFloodAnalysis}
                className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs"
              >
                Assess Risk
              </button>
            </div>

            {currentResponse && currentResponse.service === 'FloodIntelligence' && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">Current River MSL</span>
                    <span className="text-base font-bold text-sky-300">
                      {currentResponse.payload.cwcWaterLevelMsl} m
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">Warning Threshold</span>
                    <span className="text-base font-bold text-amber-300">
                      {currentResponse.payload.warningLevelMsl} m
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">Danger Level</span>
                    <span className="text-base font-bold text-rose-400">
                      {currentResponse.payload.dangerLevelMsl} m
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 text-xs">
                  <div className="font-bold text-cyan-300">Barrage Discharge Telemetry:</div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {currentResponse.payload.barrageDischargeStatus}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW E: HUMAN APPROVALS QUEUE */}
        {activeTab === 'approvals' && (
          <div className="space-y-3">
            <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
              <h3 className="text-xs font-bold text-cyan-300 uppercase">
                Human-in-the-Loop Operations Authorization Queue
              </h3>
              <p className="text-[10px] text-slate-400">
                Safety Policy: AI dispatches, route changes, and alerts strictly require Commander authorization.
              </p>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/50 mb-2" />
                No pending operational approvals. All AI advisory outputs are cleared.
              </div>
            ) : (
              pendingApprovals.map((item) => (
                <div key={item.id} className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300">{item.service} Directive</span>
                    <Badge variant="amber" size="sm">PENDING APPROVAL</Badge>
                  </div>
                  <p className="text-[11px] text-slate-300">{item.responseSummary}</p>
                  <div className="text-[10px] text-slate-400">
                    Requested by: {item.user.name} ({item.user.role}) • {new Date(item.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-amber-500/20">
                    <button
                      onClick={() => handleAuthorizeAction(item.id, 'APPROVED')}
                      className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Authorize & Dispatch
                    </button>
                    <button
                      onClick={() => handleAuthorizeAction(item.id, 'REJECTED')}
                      className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/80 text-rose-300 border border-slate-700 hover:border-rose-500/50 font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* VIEW F: AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
              <div>
                <h3 className="text-xs font-bold text-cyan-300 uppercase">
                  AI Governance & Audit Trail
                </h3>
                <p className="text-[10px] text-slate-400">
                  Immutable record of AI inferences, prompts, and human sign-offs
                </p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {auditLogs.length} Records
              </span>
            </div>

            <div className="space-y-2">
              {auditLogs.slice(0, 30).map((log) => (
                <div key={log.id} className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300">{log.service}</span>
                    <span className="text-[9px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-slate-300 text-[10px] truncate">Query: "{log.query}"</div>
                  <div className="flex items-center justify-between pt-1 text-[9px] text-slate-400 border-t border-slate-800/60">
                    <span>Actor: {log.user.name} ({log.user.role})</span>
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

      {/* 4. Drawer Footer / Chat Input Box */}
      <div className="p-3 border-t border-cyan-500/20 bg-slate-950 shrink-0 space-y-2">
        {/* Quick Action Toolbar */}
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateSitrep}
              className="flex items-center gap-1 hover:text-cyan-300 text-slate-400 transition"
              title="Compile Situation Report"
            >
              <FileText className="w-3 h-3 text-cyan-400" /> SITREP Report
            </button>
            <span>•</span>
            <button
              onClick={handleGenerateTeluguAnnouncement}
              className="flex items-center gap-1 hover:text-cyan-300 text-slate-400 transition"
              title="Draft Bilingual Telugu/English PA Announcement"
            >
              <Volume2 className="w-3 h-3 text-emerald-400" /> PA Broadcast
            </button>
          </div>
          <span className="text-[9px] text-slate-500">
            Advisory AI Only • Requires Human Sign-Off
          </span>
        </div>

        {/* Input Field */}
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
            placeholder="Ask AI Copilot (e.g. crowd surge, flood risk, dispatch)..."
            className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono transition"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-slate-950 font-bold transition flex items-center justify-center shadow-glow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
