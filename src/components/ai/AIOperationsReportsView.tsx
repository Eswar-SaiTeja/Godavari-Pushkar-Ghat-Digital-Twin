/**
 * AI Operations Reports View
 * Godavari Pushkar Ghat 3D Digital Twin - Rajamahendravaram
 * 
 * Features:
 * - Configurable reporting periods (1h, 4h, 12h, 24h, Full)
 * - 8 Report Categories grounded in live engines
 * - Human-in-the-loop Approval & Rejection workflow
 * - Multi-Format Export: Printable PDF layout, CSV (Master & Subtables), JSON
 * - Report History & Export Audit Trail
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  CheckCircle, 
  XCircle, 
  ShieldCheck, 
  AlertTriangle, 
  Sparkles, 
  History,
  Eye,
  FileSpreadsheet,
  Code
} from 'lucide-react';
import { 
  OperationsReport, 
  ReportCategory, 
  ReportPeriodKey
} from '../../ai/types/reports';
import { reportGenerationService } from '../../ai/services/reportGenerationService';
import { reportHistoryService } from '../../ai/services/reportHistoryService';
import { reportExportService } from '../../ai/services/reportExportService';

export interface AIOperationsReportsViewProps {
  userRole?: string;
  userId?: string;
}

export const AIOperationsReportsView: React.FC<AIOperationsReportsViewProps> = ({
  userRole = 'COMMANDER',
  userId = 'OP-CHIEF-01'
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory>('DAILY_OPERATIONS');
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriodKey>('DAILY_24_HOURS');
  const [activeReport, setActiveReport] = useState<OperationsReport | null>(null);
  const [reportHistory, setReportHistory] = useState<OperationsReport[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'PREVIEW' | 'HISTORY'>('PREVIEW');
  const [historyFilterCategory, setHistoryFilterCategory] = useState<string>('ALL');
  const [historyFilterStatus, setHistoryFilterStatus] = useState<string>('ALL');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [showApproveModal, setShowApproveModal] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Subscribe to report history updates
  useEffect(() => {
    setReportHistory(reportHistoryService.getAllReports());
    const unsub = reportHistoryService.subscribe(() => {
      setReportHistory(reportHistoryService.getAllReports());
    });
    return () => unsub();
  }, []);

  // Initialize with the most recent report or generate a fresh daily one
  useEffect(() => {
    if (!activeReport) {
      const existing = reportHistoryService.getAllReports();
      if (existing.length > 0) {
        setActiveReport(existing[0]);
      } else {
        handleGenerateReport();
      }
    }
  }, []);

  const handleGenerateReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const newReport = reportGenerationService.generateOperationsReport(
        selectedCategory,
        selectedPeriod,
        { userId, role: userRole }
      );
      reportHistoryService.addReport(newReport);
      setActiveReport(newReport);
      setActiveSubTab('PREVIEW');
      setIsGenerating(false);
    }, 250);
  };

  const handleApprove = () => {
    if (!activeReport) return;
    const updated = reportHistoryService.approveReport(
      activeReport.reportId,
      userRole,
      userId,
      reviewNotes || 'Verified against live Digital Twin operational telemetry.'
    );
    if (updated) {
      setActiveReport({ ...updated });
      setShowApproveModal(false);
      setReviewNotes('');
    }
  };

  const handleReject = () => {
    if (!activeReport) return;
    const updated = reportHistoryService.rejectReport(
      activeReport.reportId,
      userRole,
      userId,
      reviewNotes || 'Insufficient ground telemetry verification.'
    );
    if (updated) {
      setActiveReport({ ...updated });
      setShowApproveModal(false);
      setReviewNotes('');
    }
  };

  const categories = reportGenerationService.getAvailableReportCategories();
  const periods = reportGenerationService.getAvailablePeriods();

  const filteredHistory = reportHistory.filter(r => {
    if (historyFilterCategory !== 'ALL' && r.category !== historyFilterCategory) return false;
    if (historyFilterStatus !== 'ALL' && r.approvalStatus !== historyFilterStatus) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* 1. Control Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/60 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              AI Operations Report Generator
            </h2>
            <p className="text-xs text-slate-400">
              Synthesize official situation reports (SITREPs) from live Pushkaram operations telemetry.
            </p>
          </div>

          {/* Sub-Tab Navigation */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start md:self-auto">
            <button
              onClick={() => setActiveSubTab('PREVIEW')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeSubTab === 'PREVIEW'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Report Preview
            </button>
            <button
              onClick={() => setActiveSubTab('HISTORY')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeSubTab === 'HISTORY'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Report History ({reportHistory.length})
            </button>
          </div>
        </div>

        {/* Generator Form */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-5">
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Select Report Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ReportCategory)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-4">
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Reporting Period
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as ReportPeriodKey)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-glow-sm disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isGenerating ? 'Synthesizing...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Body Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeSubTab === 'PREVIEW' && activeReport && (
          <div className="max-w-5xl mx-auto space-y-4">
            {/* Report Header Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-bold border border-slate-700">
                      {activeReport.reportId}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      activeReport.approvalStatus === 'APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : activeReport.approvalStatus === 'REJECTED'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {activeReport.approvalStatus}
                    </span>
                    <span className="text-xs text-slate-400">
                      • {activeReport.reportingPeriod.periodLabel}
                    </span>
                  </div>
                  <h1 className="text-lg font-bold text-slate-100">
                    {activeReport.categoryTitle}
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Generated: {new Date(activeReport.generationTimestamp).toLocaleString('en-IN')} IST
                    {activeReport.approvedBy && ` • Signed: ${activeReport.approvedBy}`}
                  </p>
                </div>

                {/* Export & Approval Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => reportExportService.printReport(activeReport, userRole)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="Open Print Dialog / Save as PDF"
                  >
                    <Printer className="w-3.5 h-3.5 text-cyan-400" />
                    Print / PDF
                  </button>

                  <button
                    onClick={() => reportExportService.downloadCsv(activeReport, 'MASTER', userRole)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="Export All Tables to CSV"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    Master CSV
                  </button>

                  <button
                    onClick={() => reportExportService.downloadJson(activeReport, userRole)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="Export Structured JSON"
                  >
                    <Code className="w-3.5 h-3.5 text-amber-400" />
                    JSON
                  </button>

                  {activeReport.approvalStatus === 'DRAFT' && (
                    <button
                      onClick={() => setShowApproveModal(true)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Sign / Approve
                    </button>
                  )}
                </div>
              </div>

              {/* Classification Disclaimer */}
              <div className="mt-3 p-2.5 rounded-lg bg-amber-950/30 border border-amber-600/30 text-amber-200/90 text-[11px] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong>DATA CLASSIFICATION: {activeReport.dataClassification}</strong> — 
                  Synthesized for simulation research, operational exercises, and capacity planning. Does not represent unverified public declarations.
                </div>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {activeReport.keyMetrics.map((m) => (
                <div key={m.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {m.label}
                  </div>
                  <div className="text-xl font-bold text-slate-100 mt-1 flex items-baseline gap-1">
                    {m.value}
                    {m.unit && <span className="text-xs font-normal text-slate-400">{m.unit}</span>}
                  </div>
                  <div className="text-[9px] text-cyan-400 mt-1 font-mono">
                    {m.classification}
                  </div>
                </div>
              ))}
            </div>

            {/* Executive Summary */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">
                1. Executive Situation Briefing
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {activeReport.executiveSummary}
              </p>
            </div>

            {/* Sector Status Breakdown Table */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  2. Ghat Sector-Wise Crowd Density ({activeReport.zoneStatus.length} Sectors)
                </h3>
                <button
                  onClick={() => reportExportService.downloadCsv(activeReport, 'ZONES', userRole)}
                  className="text-[11px] text-slate-400 hover:text-cyan-400 flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Zones CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 text-[11px] uppercase">
                    <tr>
                      <th className="p-2">Sector Name</th>
                      <th className="p-2">Population</th>
                      <th className="p-2">Capacity</th>
                      <th className="p-2">Density</th>
                      <th className="p-2">Utilization</th>
                      <th className="p-2">Queue</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {activeReport.zoneStatus.map((z) => (
                      <tr key={z.zoneId} className="hover:bg-slate-800/40">
                        <td className="p-2 font-semibold text-slate-200">{z.zoneName}</td>
                        <td className="p-2 font-mono">{z.currentPopulation.toLocaleString()}</td>
                        <td className="p-2 font-mono text-slate-400">{z.capacity.toLocaleString()}</td>
                        <td className="p-2 font-mono">{z.densityPaxPerM2} pax/m²</td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  z.utilizationPct > 85 ? 'bg-rose-500' : z.utilizationPct > 65 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(100, z.utilizationPct)}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-mono">{z.utilizationPct}%</span>
                          </div>
                        </td>
                        <td className="p-2 font-mono">{z.queueLength}</td>
                        <td className="p-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            z.riskLevel === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' :
                            z.riskLevel === 'HIGH' ? 'bg-amber-500/20 text-amber-300' :
                            'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {z.riskLevel}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Incidents & Resources Side-by-Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Incident Summary */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                    3. Emergency Triage ({activeReport.incidentSummary.totalIncidents} Total)
                  </h3>
                  <button
                    onClick={() => reportExportService.downloadCsv(activeReport, 'INCIDENTS', userRole)}
                    className="text-[11px] text-slate-400 hover:text-cyan-400 flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Incidents CSV
                  </button>
                </div>
                <div className="space-y-2">
                  {activeReport.incidentSummary.recentIncidents.map((i) => (
                    <div key={i.id} className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-200">{i.title}</div>
                        <div className="text-[10px] text-slate-400">{i.zoneName} • {i.status}</div>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        i.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {i.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resource Utilization */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                    4. Resource Workload ({activeReport.resourceSummary.totalResources} Units)
                  </h3>
                  <button
                    onClick={() => reportExportService.downloadCsv(activeReport, 'RESOURCES', userRole)}
                    className="text-[11px] text-slate-400 hover:text-cyan-400 flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Resources CSV
                  </button>
                </div>
                <div className="space-y-2">
                  {Object.entries(activeReport.resourceSummary.byCategory).map(([cat, d]) => (
                    <div key={cat} className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{cat}</span>
                      <div className="flex items-center gap-3 font-mono text-[11px]">
                        <span className="text-cyan-400">{d.deployed} Active</span>
                        <span className="text-emerald-400">{d.available} Reserve</span>
                        <span className="text-slate-400">({d.total} Total)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Issues & Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-2">
                  5. Identified Operational Issues
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {activeReport.identifiedIssues.map((issue, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-rose-400">•</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">
                  6. Actionable AI Recommendations
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {activeReport.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-cyan-400">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Known Missing Data Caveats */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                7. Known Missing or Uncalibrated Telemetry
              </h3>
              <ul className="space-y-1 text-[11px] text-slate-400">
                {activeReport.missingData.map((m, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-slate-500">•</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Report History Tab */}
        {activeSubTab === 'HISTORY' && (
          <div className="max-w-5xl mx-auto space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold">Filter Category:</span>
                <select
                  value={historyFilterCategory}
                  onChange={(e) => setHistoryFilterCategory(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold">Status:</span>
                <select
                  value={historyFilterStatus}
                  onChange={(e) => setHistoryFilterStatus(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>
            </div>

            {/* History Table */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 text-[11px] uppercase">
                  <tr>
                    <th className="p-3">Report ID</th>
                    <th className="p-3">Title & Category</th>
                    <th className="p-3">Period</th>
                    <th className="p-3">Generated</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Exports</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredHistory.map((rpt) => (
                    <tr key={rpt.reportId} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-semibold text-cyan-400">
                        {rpt.reportId}
                      </td>
                      <td className="p-3 font-semibold text-slate-200">
                        {rpt.categoryTitle}
                      </td>
                      <td className="p-3 text-slate-400">
                        {rpt.reportingPeriod.periodLabel}
                      </td>
                      <td className="p-3 text-slate-400">
                        {new Date(rpt.generationTimestamp).toLocaleTimeString('en-IN')}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rpt.approvalStatus === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300' :
                          rpt.approvalStatus === 'REJECTED' ? 'bg-rose-500/20 text-rose-300' :
                          'bg-amber-500/20 text-amber-300'
                        }`}>
                          {rpt.approvalStatus}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 font-mono text-[11px]">
                        {rpt.exportHistory.length} files
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setActiveReport(rpt);
                              setActiveSubTab('PREVIEW');
                            }}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400"
                            title="Inspect Report"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => reportExportService.printReport(rpt, userRole)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                            title="Print / PDF"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => reportExportService.downloadCsv(rpt, 'MASTER', userRole)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400"
                            title="Download CSV"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredHistory.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-500">
                        No report history records match the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Approve / Reject Modal */}
      {showApproveModal && activeReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-slate-100 flex items-center gap-2 text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Human Operational Sign-off
              </h3>
              <button onClick={() => setShowApproveModal(false)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-1">
              <div><strong>Report ID:</strong> {activeReport.reportId}</div>
              <div><strong>Category:</strong> {activeReport.categoryTitle}</div>
              <div><strong>Reviewing Officer:</strong> {userRole} ({userId})</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Operational Review Notes
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Enter verification notes (e.g. cross-verified against AP Police muster roll and CWC Dowleswaram gauge)..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 min-h-[70px]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={handleReject}
                className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center gap-1"
              >
                <XCircle className="w-3.5 h-3.5" />
                Reject Report
              </button>
              <button
                onClick={handleApprove}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Approve & Sign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
