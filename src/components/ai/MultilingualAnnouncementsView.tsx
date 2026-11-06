/**
 * Multilingual Public Announcement Generator View
 * Godavari Pushkar Ghat 3D Digital Twin - Rajamahendravaram
 * 
 * Features:
 * - Trilingual generation: Telugu (తెలుగు), English, Hindi (हिन्दी)
 * - 7 Public Address categories including Emergency Demonstration
 * - Human-in-the-loop authorization gate before broadcast release
 * - Interactive script editor for operator fine-tuning
 * - Audio broadcast simulation player with waveform visualizer
 * - Multi-format export: Broadcast Order TXT, JSON, and Clipboard
 */

import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Sparkles, 
  Volume2, 
  CheckCircle, 
  XCircle, 
  ShieldAlert, 
  Copy, 
  Download, 
  Edit3, 
  Radio, 
  AlertTriangle,
  Play,
  Pause,
  Send
} from 'lucide-react';
import { 
  MultilingualAnnouncementScript, 
  AnnouncementCategory, 
  AnnouncementLanguage, 
  AnnouncementPriority 
} from '../../ai/types/announcements';
import { publicAnnouncementService } from '../../ai/services/publicAnnouncementService';
import { eventOperationsEngine } from '../../services/eventOperationsEngine';

export interface MultilingualAnnouncementsViewProps {
  userRole?: string;
  userId?: string;
}

export const MultilingualAnnouncementsView: React.FC<MultilingualAnnouncementsViewProps> = ({
  userRole = 'COMMANDER',
  userId = 'OP-CHIEF-01'
}) => {
  const [selectedCategory, setSelectedCategory] = useState<AnnouncementCategory>('GENERAL_EVENT_INFO');
  const [selectedLanguage, setSelectedLanguage] = useState<AnnouncementLanguage>('all');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('zone-pushkar-north');
  const [selectedPriority, setSelectedPriority] = useState<AnnouncementPriority>('ROUTINE');
  const [currentScript, setCurrentScript] = useState<MultilingualAnnouncementScript | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedTeScript, setEditedTeScript] = useState<string>('');
  const [editedEnScript, setEditedEnScript] = useState<string>('');
  const [editedHiScript, setEditedHiScript] = useState<string>('');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioPlaybackSec, setAudioPlaybackSec] = useState<number>(0);
  const [broadcastQueue, setBroadcastQueue] = useState<MultilingualAnnouncementScript[]>([]);
  const [copiedNotice, setCopiedNotice] = useState<boolean>(false);
  const [reviewNotes, setReviewNotes] = useState<string>('');

  const categories = publicAnnouncementService.getAvailableCategories();
  const zones = eventOperationsEngine.getZones();

  // Generate an initial announcement
  useEffect(() => {
    handleGenerate();
  }, []);

  // Audio simulator playback loop
  useEffect(() => {
    let interval: any = null;
    if (isPlayingAudio && currentScript) {
      interval = setInterval(() => {
        setAudioPlaybackSec((prev) => {
          if (prev >= currentScript.audioSimulation.durationSeconds) {
            setIsPlayingAudio(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setAudioPlaybackSec(0);
    }
    return () => clearInterval(interval);
  }, [isPlayingAudio, currentScript]);

  const handleGenerate = () => {
    const generated = publicAnnouncementService.generateMultilingualAnnouncement({
      category: selectedCategory,
      language: selectedLanguage,
      zoneId: selectedZoneId,
      priority: selectedPriority,
      operatorId: userId
    });
    setCurrentScript(generated);
    setEditedTeScript(generated.scripts.te.scriptText);
    setEditedEnScript(generated.scripts.en.scriptText);
    setEditedHiScript(generated.scripts.hi.scriptText);
    setIsEditing(false);
    setIsPlayingAudio(false);
  };

  const handleSaveEdits = () => {
    if (!currentScript) return;
    setCurrentScript({
      ...currentScript,
      scripts: {
        ...currentScript.scripts,
        te: { ...currentScript.scripts.te, scriptText: editedTeScript },
        en: { ...currentScript.scripts.en, scriptText: editedEnScript },
        hi: { ...currentScript.scripts.hi, scriptText: editedHiScript }
      },
      updatedAt: new Date().toISOString()
    });
    setIsEditing(false);
  };

  const handleApprove = () => {
    if (!currentScript) return;
    setCurrentScript({
      ...currentScript,
      status: 'APPROVED',
      approvedBy: `${userRole} (${userId})`,
      approvedAt: new Date().toISOString(),
      reviewNotes: reviewNotes || 'Authorized for public address transmission.'
    });
  };

  const handleReject = () => {
    if (!currentScript) return;
    setCurrentScript({
      ...currentScript,
      status: 'REJECTED',
      approvedBy: `${userRole} (${userId})`,
      approvedAt: new Date().toISOString(),
      reviewNotes: reviewNotes || 'Rejected: script requires revision.'
    });
  };

  const handleQueueBroadcast = () => {
    if (!currentScript || currentScript.status !== 'APPROVED') return;
    setBroadcastQueue(prev => [currentScript, ...prev]);
    alert(`Announcement ${currentScript.id} queued to simulated PA speaker network in ${currentScript.targetZoneName}.`);
  };

  const handleCopyClipboard = () => {
    if (!currentScript) return;
    const text = `=== GODAVARI PUSHKAR GHAT PUBLIC ANNOUNCEMENT ===
Category: ${currentScript.categoryLabel}
Zone: ${currentScript.targetZoneName}
Priority: ${currentScript.priority}
Status: ${currentScript.status} (Approved by: ${currentScript.approvedBy || 'PENDING'})

--- TELUGU (తెలుగు) ---
${currentScript.scripts.te.scriptText}
(Phonetic: ${currentScript.scripts.te.phoneticText || 'N/A'})

--- ENGLISH ---
${currentScript.scripts.en.scriptText}

--- HINDI (हिन्दी) ---
${currentScript.scripts.hi.scriptText}
(Phonetic: ${currentScript.scripts.hi.phoneticText || 'N/A'})
`;
    navigator.clipboard.writeText(text);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!currentScript) return;
    const text = `=== GODAVARI PUSHKAR GHAT PUBLIC ADDRESS BROADCAST ORDER ===
ID: ${currentScript.id}
Category: ${currentScript.categoryLabel}
Zone: ${currentScript.targetZoneName}
Priority: ${currentScript.priority}
Status: ${currentScript.status}
Approved By: ${currentScript.approvedBy || 'PENDING'}
Generated: ${currentScript.createdAt}
Disclaimer: ${currentScript.disclaimerText}

[TELUGU SCRIPT - తెలుగు]
${currentScript.scripts.te.scriptText}

[TELUGU PHONETIC TRANSLITERATION]
${currentScript.scripts.te.phoneticText || ''}

[ENGLISH SCRIPT]
${currentScript.scripts.en.scriptText}

[HINDI SCRIPT - हिन्दी]
${currentScript.scripts.hi.scriptText}

[HINDI PHONETIC TRANSLITERATION]
${currentScript.scripts.hi.phoneticText || ''}

[TARGET PA TOWERS]
${currentScript.audioSimulation.simulatedSpeakerLocations.join('\n')}
`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentScript.id.toLowerCase()}_broadcast_order.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* 1. Control Parameters Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/60 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-cyan-400" />
              Multilingual Public Announcement Generator
            </h2>
            <p className="text-xs text-slate-400">
              Draft authoritative, synchronized PA scripts in Telugu, English, and Hindi with mandatory Human Authorization.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              Human Approval Gate Active
            </span>
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                const cat = e.target.value as AnnouncementCategory;
                setSelectedCategory(cat);
                if (cat === 'EMERGENCY_DEMONSTRATION' || cat === 'ROUTE_CLOSURE') {
                  setSelectedPriority('IMMEDIATE');
                }
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Target Ghat Sector
            </label>
            <select
              value={selectedZoneId}
              onChange={(e) => setSelectedZoneId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="zone-all">All Sectors (Ghat-Wide)</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Language Focus
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as AnnouncementLanguage)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All 3 (Multilingual Broadcast)</option>
              <option value="te">Telugu (తెలుగు)</option>
              <option value="en">English</option>
              <option value="hi">Hindi (हिन्दी)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Priority
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value as AnnouncementPriority)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ROUTINE">ROUTINE</option>
              <option value="PRIORITY">PRIORITY</option>
              <option value="IMMEDIATE">IMMEDIATE</option>
            </select>
          </div>

          <div>
            <button
              onClick={handleGenerate}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-glow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate Script
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Announcement Display */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {currentScript && (
          <div className="max-w-5xl mx-auto space-y-4">
            {/* Announcement Status Banner */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-bold border border-slate-700">
                      {currentScript.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      currentScript.status === 'APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : currentScript.status === 'REJECTED'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {currentScript.status}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      currentScript.priority === 'IMMEDIATE'
                        ? 'bg-rose-500 text-white'
                        : currentScript.priority === 'PRIORITY'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {currentScript.priority}
                    </span>
                    <span className="text-xs text-slate-400">
                      • Target: <strong className="text-slate-200">{currentScript.targetZoneName}</strong>
                    </span>
                  </div>

                  <h1 className="text-lg font-bold text-slate-100">
                    {currentScript.categoryLabel}
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Created: {new Date(currentScript.createdAt).toLocaleTimeString('en-IN')} IST
                    {currentScript.approvedBy && ` • Approved by: ${currentScript.approvedBy}`}
                  </p>
                </div>

                {/* Top Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleCopyClipboard}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="Copy All Scripts"
                  >
                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    {copiedNotice ? 'Copied!' : 'Copy'}
                  </button>

                  <button
                    onClick={handleDownloadTxt}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="Download Broadcast Order"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    Order TXT
                  </button>

                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                      Edit Script
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveEdits}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      Save Edits
                    </button>
                  )}
                </div>
              </div>

              {/* Emergency Demonstration Notice */}
              {currentScript.isSimulatedDemonstration && (
                <div className="mt-3 p-2.5 rounded-lg bg-rose-950/40 border border-rose-600/40 text-rose-200 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>
                    DEMONSTRATION SIMULATION DRILL ONLY — NOT A REAL EMERGENCY. MANDATORY DRILL DISCLOSURE EMBEDDED IN SCRIPTS.
                  </span>
                </div>
              )}
            </div>

            {/* Audio Simulation Player Card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    isPlayingAudio
                      ? 'bg-rose-600 text-white'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950'
                  }`}
                  title={isPlayingAudio ? 'Stop Simulated Audio' : 'Play Simulated Audio'}
                >
                  {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>

                <div>
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                    PA Speaker Audio Simulation ({currentScript.audioSimulation.durationSeconds}s)
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Voice: {currentScript.audioSimulation.voiceGender} ({currentScript.audioSimulation.tone}) • Speakers: {currentScript.audioSimulation.simulatedSpeakerLocations.length} Towers Active
                  </div>
                </div>
              </div>

              {/* Simulated Waveform Animation */}
              <div className="flex items-center gap-1 h-6 px-3 bg-slate-950 rounded-lg border border-slate-800">
                {Array.from({ length: 24 }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-1 rounded-full transition-all duration-300 ${
                      isPlayingAudio ? 'bg-cyan-400' : 'bg-slate-700'
                    }`}
                    style={{
                      height: isPlayingAudio ? `${Math.max(20, Math.sin(idx + audioPlaybackSec) * 100)}%` : '25%'
                    }}
                  />
                ))}
                <span className="text-[10px] font-mono text-slate-400 ml-2">
                  00:{String(audioPlaybackSec).padStart(2, '0')} / 00:{currentScript.audioSimulation.durationSeconds}
                </span>
              </div>
            </div>

            {/* Multilingual Script Cards */}
            <div className="grid grid-cols-1 gap-4">
              {/* 1. Telugu Script */}
              {(selectedLanguage === 'all' || selectedLanguage === 'te') && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      1. తెలుగు (Telugu Script & Pronunciation)
                    </span>
                    <span className="text-[10px] text-slate-400">Primary Regional Language</span>
                  </div>

                  {!isEditing ? (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-100 font-medium leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                        {currentScript.scripts.te.scriptText}
                      </p>
                      {currentScript.scripts.te.phoneticText && (
                        <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80 text-xs text-slate-400 font-mono italic">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block not-italic mb-0.5">
                            Romanized Phonetic Transliteration (For Non-Telugu Operators):
                          </span>
                          {currentScript.scripts.te.phoneticText}
                        </div>
                      )}
                    </div>
                  ) : (
                    <textarea
                      value={editedTeScript}
                      onChange={(e) => setEditedTeScript(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 min-h-[90px]"
                    />
                  )}
                </div>
              )}

              {/* 2. English Script */}
              {(selectedLanguage === 'all' || selectedLanguage === 'en') && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      2. English (Command Broadcast Script)
                    </span>
                    <span className="text-[10px] text-slate-400">Official Operational Standard</span>
                  </div>

                  {!isEditing ? (
                    <p className="text-sm text-slate-100 font-medium leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                      {currentScript.scripts.en.scriptText}
                    </p>
                  ) : (
                    <textarea
                      value={editedEnScript}
                      onChange={(e) => setEditedEnScript(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 min-h-[80px]"
                    />
                  )}
                </div>
              )}

              {/* 3. Hindi Script */}
              {(selectedLanguage === 'all' || selectedLanguage === 'hi') && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      3. हिन्दी (Hindi Devanagari & Pronunciation)
                    </span>
                    <span className="text-[10px] text-slate-400">National Pilgrim Advisory</span>
                  </div>

                  {!isEditing ? (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-100 font-medium leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                        {currentScript.scripts.hi.scriptText}
                      </p>
                      {currentScript.scripts.hi.phoneticText && (
                        <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80 text-xs text-slate-400 font-mono italic">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block not-italic mb-0.5">
                            Romanized Phonetic Transliteration:
                          </span>
                          {currentScript.scripts.hi.phoneticText}
                        </div>
                      )}
                    </div>
                  ) : (
                    <textarea
                      value={editedHiScript}
                      onChange={(e) => setEditedHiScript(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 min-h-[90px]"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Approval & Broadcast Dispatch Bar */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-200">
                  Human Operational Authorization Gate
                </div>
                <div className="text-[11px] text-slate-400">
                  {currentScript.status === 'APPROVED' ? (
                    <span className="text-emerald-400 font-semibold">
                      ✓ Script authorized for broadcast release by {currentScript.approvedBy}
                    </span>
                  ) : currentScript.status === 'REJECTED' ? (
                    <span className="text-rose-400 font-semibold">
                      ✕ Script rejected: {currentScript.reviewNotes}
                    </span>
                  ) : (
                    <span className="text-amber-400 font-semibold">
                      ⚠️ Approval required. Messages are never broadcast automatically.
                    </span>
                  )}
                </div>
                {currentScript.status === 'DRAFT' && (
                  <input
                    type="text"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Enter optional authorization / rejection notes..."
                    className="mt-1.5 w-full max-w-sm bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                )}
              </div>

              <div className="flex items-center gap-2">
                {currentScript.status === 'DRAFT' && (
                  <>
                    <button
                      onClick={handleReject}
                      className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                    <button
                      onClick={handleApprove}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-glow-sm"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Approve & Authorize
                    </button>
                  </>
                )}

                {currentScript.status === 'APPROVED' && (
                  <button
                    onClick={handleQueueBroadcast}
                    className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-glow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Queue to PA Speakers
                  </button>
                )}
              </div>
            </div>

            {/* Broadcast Queue Log */}
            {broadcastQueue.length > 0 && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  Active Simulated Broadcast Queue ({broadcastQueue.length})
                </div>
                <div className="space-y-1.5">
                  {broadcastQueue.map((item, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono text-cyan-400">{item.id}</span> • <strong>{item.categoryLabel}</strong> in {item.targetZoneName}
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold">TRANSMITTING</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
