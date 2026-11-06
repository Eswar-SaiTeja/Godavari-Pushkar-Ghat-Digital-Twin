/**
 * AI Operations Report Export Service
 * Godavari Pushkar Ghat 3D Digital Twin - Rajamahendravaram
 * 
 * Supports:
 * - JSON Export (Complete machine-readable structure)
 * - CSV Export (Structured tables: Master, Metrics, Incidents, Zones, Resources)
 * - Printable PDF HTML Layout (Formatted for A4 / Letter with @media print)
 */

import { OperationsReport } from '../types/reports';
import { reportHistoryService } from './reportHistoryService';

export class ReportExportService {
  /**
   * Export complete report as structured JSON
   */
  public exportAsJson(report: OperationsReport, userRole: string = 'COMMANDER'): string {
    reportHistoryService.logExport(report.reportId, 'JSON', userRole);
    return JSON.stringify(report, null, 2);
  }

  /**
   * Download report as JSON file
   */
  public downloadJson(report: OperationsReport, userRole: string = 'COMMANDER'): void {
    const jsonStr = this.exportAsJson(report, userRole);
    const filename = `${report.reportId.toLowerCase()}_${report.category.toLowerCase()}.json`;
    this.triggerDownload(jsonStr, filename, 'application/json');
  }

  /**
   * Export report records as CSV
   */
  public exportAsCsv(
    report: OperationsReport, 
    subTable: 'MASTER' | 'METRICS' | 'INCIDENTS' | 'ZONES' | 'RESOURCES' | 'ANOMALIES' = 'MASTER',
    userRole: string = 'COMMANDER'
  ): string {
    reportHistoryService.logExport(report.reportId, 'CSV', userRole);

    switch (subTable) {
      case 'METRICS': {
        const headers = ['Metric_ID', 'Metric_Label', 'Value', 'Unit', 'Trend', 'Classification'];
        const rows = report.keyMetrics.map(m => [
          `"${m.id}"`,
          `"${m.label.replace(/"/g, '""')}"`,
          `"${m.value}"`,
          `"${m.unit || ''}"`,
          `"${m.trend || 'STABLE'}"`,
          `"${m.classification}"`
        ]);
        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      }

      case 'INCIDENTS': {
        const headers = ['Incident_ID', 'Title', 'Severity', 'Zone_Name', 'Status', 'Reported_At', 'Response_Min'];
        const rows = report.incidentSummary.recentIncidents.map(i => [
          `"${i.id}"`,
          `"${i.title.replace(/"/g, '""')}"`,
          `"${i.severity}"`,
          `"${i.zoneName.replace(/"/g, '""')}"`,
          `"${i.status}"`,
          `"${i.reportedAt}"`,
          i.responseMinutes
        ]);
        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      }

      case 'ZONES': {
        const headers = ['Zone_ID', 'Sector_Name', 'Population', 'Capacity', 'Density_Pax_M2', 'Utilization_Pct', 'Density_Class', 'Inflow_Min', 'Outflow_Min', 'Queue_Pax', 'Risk_Level'];
        const rows = report.zoneStatus.map(z => [
          `"${z.zoneId}"`,
          `"${z.zoneName.replace(/"/g, '""')}"`,
          z.currentPopulation,
          z.capacity,
          z.densityPaxPerM2,
          z.utilizationPct,
          `"${z.densityClass}"`,
          z.inflowRate,
          z.outflowRate,
          z.queueLength,
          `"${z.riskLevel}"`
        ]);
        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      }

      case 'RESOURCES': {
        const headers = ['Resource_Category', 'Total_Units', 'Deployed_Units', 'Available_Units', 'Utilization_Pct'];
        const rows = Object.entries(report.resourceSummary.byCategory).map(([cat, data]) => {
          const pct = data.total > 0 ? Number(((data.deployed / data.total) * 100).toFixed(1)) : 0;
          return [
            `"${cat}"`,
            data.total,
            data.deployed,
            data.available,
            pct
          ];
        });
        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      }

      case 'ANOMALIES': {
        const headers = ['Anomaly_ID', 'Title', 'Category', 'Severity', 'Location', 'Observed_Value', 'Expected_Baseline'];
        const rows = (report.anomalySummary?.detectedAnomalies || []).map(a => [
          `"${a.id}"`,
          `"${a.title.replace(/"/g, '""')}"`,
          `"${a.category}"`,
          `"${a.severity}"`,
          `"${a.location.replace(/"/g, '""')}"`,
          `"${a.observedValue}"`,
          `"${a.expectedBaseline}"`
        ]);
        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      }

      case 'MASTER':
      default: {
        // Combined comprehensive CSV
        const meta = [
          '# ==========================================================================',
          `# GODAVARI PUSHKAR GHAT 3D DIGITAL TWIN - OPERATIONAL REPORT`,
          `# Report ID: ${report.reportId}`,
          `# Title: ${report.categoryTitle}`,
          `# Period: ${report.reportingPeriod.periodLabel} (${report.reportingPeriod.startTime} to ${report.reportingPeriod.endTime})`,
          `# Classification: ${report.dataClassification} (SIMULATED MULTI-AGENCY RESEARCH DATA)`,
          `# Generated: ${report.generationTimestamp}`,
          `# Status: ${report.approvalStatus} (Approved by: ${report.approvedBy || 'PENDING'})`,
          '# ==========================================================================',
          '',
          '# --- KEY OPERATIONAL METRICS ---',
          this.exportAsCsv(report, 'METRICS', userRole),
          '',
          '# --- GHAT SECTOR STATUS ---',
          this.exportAsCsv(report, 'ZONES', userRole),
          '',
          '# --- INCIDENT SUMMARY ---',
          this.exportAsCsv(report, 'INCIDENTS', userRole),
          '',
          '# --- RESOURCE DEPLOYMENT ---',
          this.exportAsCsv(report, 'RESOURCES', userRole)
        ];
        return meta.join('\n');
      }
    }
  }

  /**
   * Download report as CSV file
   */
  public downloadCsv(
    report: OperationsReport, 
    subTable: 'MASTER' | 'METRICS' | 'INCIDENTS' | 'ZONES' | 'RESOURCES' | 'ANOMALIES' = 'MASTER',
    userRole: string = 'COMMANDER'
  ): void {
    const csvStr = this.exportAsCsv(report, subTable, userRole);
    const suffix = subTable === 'MASTER' ? '' : `_${subTable.toLowerCase()}`;
    const filename = `${report.reportId.toLowerCase()}_${report.category.toLowerCase()}${suffix}.csv`;
    this.triggerDownload(csvStr, filename, 'text/csv;charset=utf-8;');
  }

  /**
   * Generate an official, print-ready HTML document for PDF generation
   */
  public generatePrintableHtml(report: OperationsReport): string {
    const metricsHtml = report.keyMetrics.map(m => `
      <div class="metric-card">
        <div class="metric-label">${m.label}</div>
        <div class="metric-value">${m.value} <span class="metric-unit">${m.unit || ''}</span></div>
        <div class="metric-tag">${m.classification}</div>
      </div>
    `).join('');

    const zonesHtml = report.zoneStatus.map(z => `
      <tr>
        <td style="font-weight: 600;">${z.zoneName}</td>
        <td>${z.currentPopulation.toLocaleString()}</td>
        <td>${z.capacity.toLocaleString()}</td>
        <td>${z.densityPaxPerM2} pax/m²</td>
        <td>
          <div class="bar-container">
            <div class="bar-fill" style="width: ${Math.min(100, z.utilizationPct)}%; background-color: ${z.utilizationPct > 85 ? '#e11d48' : z.utilizationPct > 65 ? '#d97706' : '#059669'};"></div>
          </div>
          <span style="font-size: 11px;">${z.utilizationPct}%</span>
        </td>
        <td><span class="badge badge-${z.riskLevel.toLowerCase()}">${z.riskLevel}</span></td>
      </tr>
    `).join('');

    const incidentsHtml = report.incidentSummary.recentIncidents.map(i => `
      <tr>
        <td><code>${i.id}</code></td>
        <td style="font-weight: 500;">${i.title}</td>
        <td><span class="badge badge-${i.severity.toLowerCase()}">${i.severity}</span></td>
        <td>${i.zoneName}</td>
        <td>${i.status}</td>
        <td>${i.responseMinutes} min</td>
      </tr>
    `).join('');

    const resourcesHtml = Object.entries(report.resourceSummary.byCategory).map(([cat, d]) => {
      const pct = d.total > 0 ? ((d.deployed / d.total) * 100).toFixed(0) : '0';
      return `
        <tr>
          <td style="font-weight: 600;">${cat}</td>
          <td>${d.total}</td>
          <td style="color: #0284c7; font-weight: 600;">${d.deployed}</td>
          <td style="color: #059669;">${d.available}</td>
          <td>${pct}%</td>
        </tr>
      `;
    }).join('');

    const issuesHtml = report.identifiedIssues.map(issue => `
      <li style="margin-bottom: 6px;">${issue}</li>
    `).join('');

    const recsHtml = report.recommendations.map(rec => `
      <li style="margin-bottom: 6px;">${rec}</li>
    `).join('');

    const missingHtml = report.missingData.map(m => `
      <li style="margin-bottom: 4px; color: #64748b; font-size: 12px;">${m}</li>
    `).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${report.reportId} - ${report.categoryTitle}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 15mm 15mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.45;
      font-size: 13px;
      padding: 24px;
    }
    .header {
      border-bottom: 2px solid #0284c7;
      padding-bottom: 12px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .title-block h1 {
      font-size: 18px;
      color: #0369a1;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .title-block h2 {
      font-size: 14px;
      color: #0f172a;
      font-weight: 600;
    }
    .meta-box {
      text-align: right;
      font-size: 11px;
      color: #475569;
    }
    .disclaimer-banner {
      background-color: #fef2f2;
      border-left: 4px solid #ef4444;
      padding: 8px 12px;
      font-size: 11px;
      color: #991b1b;
      margin-bottom: 16px;
      font-weight: 500;
    }
    .grid-metrics {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }
    .metric-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px;
      background: #f8fafc;
    }
    .metric-label {
      font-size: 10px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .metric-value {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
    }
    .metric-unit {
      font-size: 11px;
      font-weight: normal;
      color: #64748b;
    }
    .metric-tag {
      font-size: 9px;
      color: #0284c7;
      margin-top: 4px;
      font-weight: 600;
    }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      color: #0369a1;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-top: 16px;
      margin-bottom: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 11px;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 6px 8px;
      text-align: left;
    }
    th {
      background-color: #f1f5f9;
      font-weight: 600;
      color: #334155;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-critical { background: #fee2e2; color: #991b1b; }
    .badge-high { background: #ffedd5; color: #9a3412; }
    .badge-moderate { background: #fef3c7; color: #92400e; }
    .badge-low { background: #ecfdf5; color: #065f46; }
    .bar-container {
      width: 60px;
      height: 6px;
      background: #e2e8f0;
      border-radius: 3px;
      display: inline-block;
      margin-right: 4px;
      vertical-align: middle;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
    }
    .summary-text {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 10px;
      border-radius: 6px;
      font-size: 12px;
      line-height: 1.5;
      margin-bottom: 14px;
    }
    .sign-off-block {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px dashed #cbd5e1;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #475569;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title-block">
      <h1>Government of Andhra Pradesh • Godavari Pushkaram 2027</h1>
      <h2>${report.categoryTitle}</h2>
      <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
        Unified Command & Control Center — Rajamahendravaram (17.0084° N, 81.7669° E)
      </div>
    </div>
    <div class="meta-box">
      <div><strong>Report ID:</strong> ${report.reportId}</div>
      <div><strong>Period:</strong> ${report.reportingPeriod.periodLabel}</div>
      <div><strong>Generated:</strong> ${new Date(report.generationTimestamp).toLocaleString('en-IN')}</div>
      <div><strong>Approval Status:</strong> <span style="font-weight: 700; color: ${report.approvalStatus === 'APPROVED' ? '#059669' : '#d97706'}">${report.approvalStatus}</span></div>
    </div>
  </div>

  <div class="disclaimer-banner">
    ⚠️ <strong>DATA CLASSIFICATION: SIMULATED / RESEARCH DEMONSTRATION</strong><br>
    This report was automatically synthesized by the Godavari Pushkar Ghat 3D Digital Twin intelligence engine for operational training, crowd simulation benchmarks, and scenario comparison. Not an unverified public declaration.
  </div>

  <div class="section-title">1. Executive Situation Briefing</div>
  <div class="summary-text">
    ${report.executiveSummary}
  </div>

  <div class="section-title">2. Key Operational Metrics</div>
  <div class="grid-metrics">
    ${metricsHtml}
  </div>

  <div class="section-title">3. Ghat Sector Density & Capacity Breakdown</div>
  <table>
    <thead>
      <tr>
        <th>Sector Name</th>
        <th>Population</th>
        <th>Safe Capacity</th>
        <th>Density</th>
        <th>Utilization</th>
        <th>Risk Level</th>
      </tr>
    </thead>
    <tbody>
      ${zonesHtml}
    </tbody>
  </table>

  <div class="section-title">4. Emergency Incident & Triage Summary (${report.incidentSummary.totalIncidents} Total)</div>
  <table>
    <thead>
      <tr>
        <th>Incident ID</th>
        <th>Title</th>
        <th>Severity</th>
        <th>Zone</th>
        <th>Status</th>
        <th>Avg Response</th>
      </tr>
    </thead>
    <tbody>
      ${incidentsHtml}
    </tbody>
  </table>

  <div class="section-title">5. Multi-Agency Field Resource Workload</div>
  <table>
    <thead>
      <tr>
        <th>Agency Category</th>
        <th>Total Units</th>
        <th>Deployed (Active)</th>
        <th>Available (Reserve)</th>
        <th>Workload %</th>
      </tr>
    </thead>
    <tbody>
      ${resourcesHtml}
    </tbody>
  </table>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 12px;">
    <div>
      <div class="section-title">6. Identified Operational Issues</div>
      <ul style="padding-left: 18px; font-size: 12px;">
        ${issuesHtml}
      </ul>
    </div>
    <div>
      <div class="section-title">7. Actionable AI Recommendations</div>
      <ul style="padding-left: 18px; font-size: 12px; color: #0369a1;">
        ${recsHtml}
      </ul>
    </div>
  </div>

  <div class="section-title">8. Known Missing or Uncalibrated Telemetry</div>
  <ul style="padding-left: 18px;">
    ${missingHtml}
  </ul>

  <div class="sign-off-block">
    <div>
      <strong>Authorized Human Sign-off:</strong><br>
      ${report.approvedBy || 'Pending Signature (Draft Status)'}<br>
      <em>${report.approvedAt ? `Signed at: ${new Date(report.approvedAt).toLocaleString('en-IN')}` : 'Requires Commander Approval'}</em>
    </div>
    <div style="text-align: right;">
      <strong>Digital Twin System Engine:</strong><br>
      Godavari Pushkaram GIS Architecture v2.4<br>
      <em>Compliance: NDMA Mass Gathering Safety Guidelines</em>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Trigger browser print dialog for clean PDF generation
   */
  public printReport(report: OperationsReport, userRole: string = 'COMMANDER'): void {
    reportHistoryService.logExport(report.reportId, 'PDF', userRole);

    const htmlContent = this.generatePrintableHtml(report);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups for this site to print or export PDF reports.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 300);
    };
  }

  /**
   * Helper to trigger native browser file download
   */
  private triggerDownload(content: string, filename: string, mimeType: string): void {
    if (typeof window === 'undefined') return;
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const reportExportService = new ReportExportService();
