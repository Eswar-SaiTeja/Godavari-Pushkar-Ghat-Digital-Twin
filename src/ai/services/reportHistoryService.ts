/**
 * AI Operations Report History Service
 * Godavari Pushkar Ghat 3D Digital Twin - Rajamahendravaram
 * 
 * Manages persistence, human approval workflow, and export tracking.
 * Avoids storing unnecessary personal information (stores operator ID/role only).
 */

import { OperationsReport, ReportApprovalStatus, ReportCategory } from '../types/reports';
import { reportGenerationService } from './reportGenerationService';

const STORAGE_KEY = 'godavari_digital_twin_report_history_v1';

export class ReportHistoryService {
  private reports: OperationsReport[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
    if (this.reports.length === 0) {
      this.seedInitialHistory();
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.reports = JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to load report history from localStorage:', e);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.reports));
    } catch (e) {
      console.warn('Failed to save report history to localStorage:', e);
    }
    this.notifyListeners();
  }

  /**
   * Pre-seed initial realistic reports
   */
  private seedInitialHistory(): void {
    const dailyReport = reportGenerationService.generateOperationsReport('DAILY_OPERATIONS', 'DAILY_24_HOURS', {
      userId: 'OP-CHIEF-01',
      role: 'COMMANDER'
    });
    dailyReport.approvalStatus = 'APPROVED';
    dailyReport.approvedBy = 'COMMANDER (OP-CHIEF-01)';
    dailyReport.approvedAt = new Date(Date.now() - 3600000).toISOString();
    dailyReport.reviewNotes = 'Verified against CWC Dowleswaram barrage gauge and AP Police deployment muster.';

    const crowdReport = reportGenerationService.generateOperationsReport('CROWD_MANAGEMENT', 'LAST_4_HOURS', {
      userId: 'OPS-DISPATCH-02',
      role: 'DISPATCHER'
    });

    const incidentReport = reportGenerationService.generateOperationsReport('INCIDENT_SUMMARY', 'DAILY_24_HOURS');
    incidentReport.approvalStatus = 'APPROVED';
    incidentReport.approvedBy = 'WATCH_OFFICER (OPS-DISPATCH-02)';
    incidentReport.approvedAt = new Date(Date.now() - 7200000).toISOString();

    this.reports = [dailyReport, crowdReport, incidentReport];
    this.saveToStorage();
  }

  /**
   * Add a newly generated report to history
   */
  public addReport(report: OperationsReport): void {
    this.reports.unshift(report);
    // Keep max 50 reports
    if (this.reports.length > 50) {
      this.reports = this.reports.slice(0, 50);
    }
    this.saveToStorage();
  }

  /**
   * Get all reports
   */
  public getAllReports(): OperationsReport[] {
    return [...this.reports];
  }

  /**
   * Get report by ID
   */
  public getReportById(id: string): OperationsReport | undefined {
    return this.reports.find(r => r.reportId === id);
  }

  /**
   * Filter reports
   */
  public filterReports(category?: ReportCategory, status?: ReportApprovalStatus): OperationsReport[] {
    return this.reports.filter(r => {
      if (category && r.category !== category) return false;
      if (status && r.approvalStatus !== status) return false;
      return true;
    });
  }

  /**
   * Approve a report (Human-in-the-loop)
   */
  public approveReport(
    reportId: string, 
    reviewerRole: string = 'COMMANDER', 
    reviewerId: string = 'OP-CHIEF-01', 
    notes?: string
  ): OperationsReport | null {
    const report = this.reports.find(r => r.reportId === reportId);
    if (!report) return null;

    report.approvalStatus = 'APPROVED';
    report.approvedBy = `${reviewerRole} (${reviewerId})`;
    report.approvedAt = new Date().toISOString();
    if (notes) report.reviewNotes = notes;

    this.saveToStorage();
    return report;
  }

  /**
   * Reject a report
   */
  public rejectReport(
    reportId: string, 
    reviewerRole: string = 'COMMANDER', 
    reviewerId: string = 'OP-CHIEF-01', 
    reason: string = 'Incomplete field confirmation'
  ): OperationsReport | null {
    const report = this.reports.find(r => r.reportId === reportId);
    if (!report) return null;

    report.approvalStatus = 'REJECTED';
    report.approvedBy = `${reviewerRole} (${reviewerId})`;
    report.approvedAt = new Date().toISOString();
    report.reviewNotes = `REJECTED: ${reason}`;

    this.saveToStorage();
    return report;
  }

  /**
   * Archive a report
   */
  public archiveReport(reportId: string): boolean {
    const report = this.reports.find(r => r.reportId === reportId);
    if (!report) return false;
    report.approvalStatus = 'ARCHIVED';
    this.saveToStorage();
    return true;
  }

  /**
   * Log an export event
   */
  public logExport(reportId: string, format: 'PDF' | 'CSV' | 'JSON', exportedBy: string = 'COMMANDER'): void {
    const report = this.reports.find(r => r.reportId === reportId);
    if (!report) return;

    report.exportHistory.push({
      format,
      exportedAt: new Date().toISOString(),
      exportedBy,
      filename: `${report.reportId.toLowerCase()}_${report.category.toLowerCase()}.${format.toLowerCase()}`
    });

    this.saveToStorage();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(cb => cb());
  }
}

export const reportHistoryService = new ReportHistoryService();
