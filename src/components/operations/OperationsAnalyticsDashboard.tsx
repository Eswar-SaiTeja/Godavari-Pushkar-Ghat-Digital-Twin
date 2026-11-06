import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Radio, 
  Compass, 
  Download, 
  CheckCircle2, 
  FileSpreadsheet, 
  FileCode, 
  PieChart, 
  Filter
} from 'lucide-react';
import { 
  OperationsAnalyticsData, 
  OperationalReportType,
  IncidentSeverity,
  OperationalZone
} from '../../types/operations';
import { operationsAnalyticsEngine } from '../../services/operationsAnalyticsEngine';
import { eventOperationsEngine } from '../../services/eventOperationsEngine';
import { dispatchEngine } from '../../services/dispatchEngine';

export const OperationsAnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<OperationsAnalyticsData>(operationsAnalyticsEngine.getAnalyticsData());
  const [zones, setZones] = useState<OperationalZone[]>(eventOperationsEngine.getZones());

  // Filter states
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [timeRange, setTimeRange] = useState<string>('ALL');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => {
      setData(operationsAnalyticsEngine.getAnalyticsData());
      setZones(eventOperationsEngine.getZones());
    };

    const unsubDispatch = dispatchEngine.subscribe(refresh);
    const unsubOps = eventOperationsEngine.subscribe(refresh);

    return () => {
      unsubDispatch();
      unsubOps();
    };
  }, []);

  const handleDownload = (type: OperationalReportType, format: 'CSV' | 'JSON') => {
    operationsAnalyticsEngine.downloadReportFile(type, format);
    setExportNotice(`Generated ${type.replace('_', ' ')} (${format}) successfully.`);
    setTimeout(() => setExportNotice(null), 3000);
  };

  // Severity color mapping
  const severityColors: Record<IncidentSeverity, string> = {
    CRITICAL: '#ef4444',
    HIGH: '#f97316',
    MODERATE: '#f59e0b',
    LOW: '#3b82f6',
  };

  const totalIncidents = Math.max(1, data.totalIncidents);

  return (
    <div className="space-y-6 text-slate-200">
      {/* Top Header & Export Notification */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            Operations Analytics & Dispatch Performance Engine
          </h3>
          <p className="text-xs text-slate-400">
            Real-time derivation of response SLAs, resource capacity utilization, incident distributions, and auditable export reports
          </p>
        </div>

        {exportNotice && (
          <div className="px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{exportNotice}</span>
          </div>
        )}
      </div>

      {/* Primary KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Incidents</div>
          <div className="text-xl font-bold font-mono text-white">{data.totalIncidents}</div>
          <div className="text-[10px] text-cyan-400 mt-0.5">Recorded</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Active Incidents</div>
          <div className={`text-xl font-bold font-mono ${data.activeIncidents > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {data.activeIncidents}
          </div>
          <div className="text-[10px] text-rose-400 mt-0.5">{data.severityDistribution.CRITICAL} Critical</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Resolved</div>
          <div className="text-xl font-bold font-mono text-emerald-400">{data.resolvedIncidents}</div>
          <div className="text-[10px] text-emerald-400/80 mt-0.5">Dispatches Closed</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Resource Utilization</div>
          <div className="text-xl font-bold font-mono text-cyan-300">{data.resourceUtilizationPct}%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{data.deployedResources} / {data.totalResources} Deployed</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Avg Acknowledgement</div>
          <div className="text-xl font-bold font-mono text-amber-300">{data.avgAcknowledgementDurationSec}s</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Surveillance to Acknowledged</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Avg Assignment</div>
          <div className="text-xl font-bold font-mono text-cyan-300">{data.avgAssignmentDurationSec}s</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Scoring & Unit Assignment</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Simulated Travel ETA</div>
          <div className="text-xl font-bold font-mono text-amber-400">{data.avgSimulatedTravelDurationMin}m</div>
          <div className="text-[10px] text-slate-400 mt-0.5">A* Network Transit</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Resolution</div>
          <div className="text-xl font-bold font-mono text-emerald-400">{data.avgTotalResolutionDurationMin}m</div>
          <div className="text-[10px] text-slate-400 mt-0.5">End-to-End Clearance</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-slate-400 flex items-center gap-1 font-semibold">
            <Filter className="w-3.5 h-3.5 text-cyan-400" /> Filter Analytics:
          </span>

          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none"
          >
            <option value="ALL">Entire Pushkaram Duration (Baseline)</option>
            <option value="MORNING_MUHURTHAM">Auspicious Morning Muhurtham (05:00 - 11:00)</option>
            <option value="EVENING_AARTI">Evening Godavari Harathi (17:00 - 21:00)</option>
          </select>

          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Operational Sectors</option>
            {zones.map(z => (
              <option key={z.id} value={z.name}>{z.name}</option>
            ))}
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Only</option>
            <option value="MODERATE">Moderate Only</option>
            <option value="LOW">Low Only</option>
          </select>
        </div>

        <div className="text-slate-400 font-mono text-[11px]">
          Data Source: Live Cesium 3D Simulation Engine • epsg:4326
        </div>
      </div>

      {/* Interactive SVG Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* CHART 1: INCIDENT FREQUENCY TIMELINE (LINE / AREA CHART) */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Incident Generation vs Dispatch Activity Timeline
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">Simulated Hours</span>
          </div>

          <div className="h-44 w-full flex items-end justify-between pt-4 px-2 pb-2 relative">
            {/* SVG Trend Path */}
            <svg className="absolute inset-0 w-full h-full p-2 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area */}
              <polygon
                points={`
                  0,100 
                  0,${100 - (data.timelinePoints[0].incidents * 15)} 
                  20,${100 - (data.timelinePoints[1].incidents * 15)} 
                  40,${100 - (data.timelinePoints[2].incidents * 15)} 
                  60,${100 - (data.timelinePoints[3].incidents * 15)} 
                  80,${100 - (data.timelinePoints[4].incidents * 15)} 
                  100,${100 - (data.timelinePoints[5].incidents * 15)} 
                  100,100
                `}
                fill="url(#cyanGrad)"
              />

              {/* Incidents Line */}
              <polyline
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
                points={`
                  0,${100 - (data.timelinePoints[0].incidents * 15)} 
                  20,${100 - (data.timelinePoints[1].incidents * 15)} 
                  40,${100 - (data.timelinePoints[2].incidents * 15)} 
                  60,${100 - (data.timelinePoints[3].incidents * 15)} 
                  80,${100 - (data.timelinePoints[4].incidents * 15)} 
                  100,${100 - (data.timelinePoints[5].incidents * 15)}
                `}
              />

              {/* Dispatches Line */}
              <polyline
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="4 3"
                points={`
                  0,${100 - (data.timelinePoints[0].dispatches * 15)} 
                  20,${100 - (data.timelinePoints[1].dispatches * 15)} 
                  40,${100 - (data.timelinePoints[2].dispatches * 15)} 
                  60,${100 - (data.timelinePoints[3].dispatches * 15)} 
                  80,${100 - (data.timelinePoints[4].dispatches * 15)} 
                  100,${100 - (data.timelinePoints[5].dispatches * 15)}
                `}
              />
            </svg>

            {/* Time labels on bottom */}
            {data.timelinePoints.map((pt, idx) => (
              <div key={idx} className="z-10 text-[10px] font-mono text-slate-500 text-center">
                {pt.time}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-6 text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-cyan-400 rounded-full" /> Incidents Reported
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-amber-400 border-b border-dashed" /> Dispatches Executed
            </span>
          </div>
        </div>

        {/* CHART 2: SEVERITY DISTRIBUTION DONUT / SEGMENTED BARS */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-rose-400" />
              Incident Severity Distribution Breakdown
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">{data.totalIncidents} Total Events</span>
          </div>

          <div className="space-y-3 pt-1">
            {(['CRITICAL', 'HIGH', 'MODERATE', 'LOW'] as const).map((sev) => {
              const count = data.severityDistribution[sev] || 0;
              const pct = Math.round((count / totalIncidents) * 100);

              return (
                <div key={sev} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: severityColors[sev] }} />
                      {sev} Priority
                    </span>
                    <span className="font-mono text-slate-300">
                      {count} incidents ({pct}%)
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.max(4, pct)}%`, 
                        backgroundColor: severityColors[sev] 
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Critical Incident Response Target: &lt; 3.0 mins</span>
            <span className="font-mono font-bold text-emerald-400">Achieved: {data.avgSimulatedTravelDurationMin} mins</span>
          </div>
        </div>

        {/* CHART 3: RESOURCE UTILIZATION BY CATEGORY */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-emerald-400" />
              Multi-Agency Resource Category Workload
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">Deployed vs Available</span>
          </div>

          <div className="space-y-2.5 pt-1">
            {Object.entries(data.resourceCategoryBreakdown).slice(0, 5).map(([cat, info]) => (
              <div key={cat} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-300 capitalize">{cat.toLowerCase()}</span>
                  <span className="font-mono text-xs">
                    <span className="text-cyan-400 font-bold">{info.deployed} deployed</span> / {info.total} total ({info.utilizationPct}%)
                  </span>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden flex">
                  <div 
                    className="bg-cyan-500 h-full rounded-l-full transition-all duration-500"
                    style={{ width: `${info.utilizationPct}%` }}
                  />
                  <div 
                    className="bg-emerald-500/40 h-full rounded-r-full transition-all duration-500"
                    style={{ width: `${100 - info.utilizationPct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 text-[10px] text-slate-500 border-t border-slate-800">
            <span>Formula: (Deployed / Total Deployable) × 100</span>
            <span className="text-cyan-400">Total Deployments: {data.deployedResources} units</span>
          </div>
        </div>

        {/* CHART 4: DISPATCH LIFECYCLE DURATION COMPARISON */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              Dispatch Lifecycle SLA Duration Breakdown
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">Seconds & Minutes</span>
          </div>

          <div className="space-y-3 pt-1">
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white">Stage 1: Incident Acknowledgement</div>
                <div className="text-[11px] text-slate-500">From detection to operator confirmation</div>
              </div>
              <div className="font-mono text-sm font-bold text-amber-300">{data.avgAcknowledgementDurationSec}s</div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white">Stage 2: Resource Assignment Scoring</div>
                <div className="text-[11px] text-slate-500">Haversine matching & assignment confirmation</div>
              </div>
              <div className="font-mono text-sm font-bold text-cyan-300">{data.avgAssignmentDurationSec}s</div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white">Stage 3: Mobilization & Siren Dispatch</div>
                <div className="text-[11px] text-slate-500">Unit acknowledged and en route</div>
              </div>
              <div className="font-mono text-sm font-bold text-blue-300">{data.avgDispatchProcessingDurationSec}s</div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white">Stage 4: Transit to Scene</div>
                <div className="text-[11px] text-slate-500">Simulated A* network travel time</div>
              </div>
              <div className="font-mono text-sm font-bold text-orange-400">~{data.avgSimulatedTravelDurationMin} mins</div>
            </div>
          </div>
        </div>

      </div>

      {/* ZONE-WISE OPERATIONS COMPARISON TABLE */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-cyan-400" />
            Sector-Wise Operational Capacity & Incident Density
          </h4>
          <span className="text-[10px] text-slate-400 font-mono">7 Designated Pushkaram Sectors</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-3">Sector Name</th>
                <th className="py-2.5 px-3">Population</th>
                <th className="py-2.5 px-3">Capacity Max</th>
                <th className="py-2.5 px-3">Utilization %</th>
                <th className="py-2.5 px-3">Density Class</th>
                <th className="py-2.5 px-3">Inflow / Outflow</th>
                <th className="py-2.5 px-3">Active Incidents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {zones.map((zone) => {
                const utilPct = Number(((zone.currentSimulatedPopulation / zone.capacityAssumption) * 100).toFixed(1));
                const zoneIncidents = data.zoneDistribution[zone.name] || 0;

                return (
                  <tr key={zone.id} className="hover:bg-slate-850/40">
                    <td className="py-2.5 px-3 font-semibold text-white">{zone.name}</td>
                    <td className="py-2.5 px-3 font-mono text-cyan-300 font-bold">{zone.currentSimulatedPopulation.toLocaleString()}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{zone.capacityAssumption.toLocaleString()}</td>
                    <td className="py-2.5 px-3 font-mono">
                      <span className={utilPct > 80 ? 'text-rose-400 font-bold' : utilPct > 60 ? 'text-amber-400' : 'text-emerald-400'}>
                        {utilPct}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">{zone.densityClassification}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      <span className="text-emerald-400">+{zone.inflowRate}</span> / <span className="text-rose-400">-{zone.outflowRate}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        zoneIncidents > 0 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-slate-500'
                      }`}>
                        {zoneIncidents} incidents
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* REPORTS & EXPORT SECTION */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
              <Download className="w-4 h-4 text-amber-400" />
              Operations Audit & Multi-Agency Report Exporters
            </h4>
            <p className="text-[11px] text-slate-400">
              Download complete raw underlying simulation and incident telemetry in structured CSV or JSON formats
            </p>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
            SIMULATED RESEARCH DATA
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Report 1 */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5 flex flex-col justify-between">
            <div>
              <div className="font-bold text-white text-xs">Dispatch Performance & SLA</div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Full lifecycle audit logs, travel ETAs, response times, and state transition history.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
              <button
                onClick={() => handleDownload('DISPATCH_PERFORMANCE', 'CSV')}
                className="flex-1 py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center justify-center gap-1 transition"
              >
                <FileSpreadsheet className="w-3 h-3 text-emerald-400" /> CSV
              </button>
              <button
                onClick={() => handleDownload('DISPATCH_PERFORMANCE', 'JSON')}
                className="flex-1 py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center justify-center gap-1 transition"
              >
                <FileCode className="w-3 h-3 text-cyan-400" /> JSON
              </button>
            </div>
          </div>

          {/* Report 2 */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5 flex flex-col justify-between">
            <div>
              <div className="font-bold text-white text-xs">Incident Summary & Impact</div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                All reported emergencies, severity levels, affected populations, and resolution timestamps.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
              <button
                onClick={() => handleDownload('INCIDENT_SUMMARY', 'CSV')}
                className="flex-1 py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center justify-center gap-1 transition"
              >
                <FileSpreadsheet className="w-3 h-3 text-emerald-400" /> CSV
              </button>
              <button
                onClick={() => handleDownload('INCIDENT_SUMMARY', 'JSON')}
                className="flex-1 py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center justify-center gap-1 transition"
              >
                <FileCode className="w-3 h-3 text-cyan-400" /> JSON
              </button>
            </div>
          </div>

          {/* Report 3 */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5 flex flex-col justify-between">
            <div>
              <div className="font-bold text-white text-xs">Resource Utilization & Workload</div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Personnel counts, assigned sectors, equipment rosters, and active mission backlog.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
              <button
                onClick={() => handleDownload('RESOURCE_UTILIZATION', 'CSV')}
                className="flex-1 py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center justify-center gap-1 transition"
              >
                <FileSpreadsheet className="w-3 h-3 text-emerald-400" /> CSV
              </button>
              <button
                onClick={() => handleDownload('RESOURCE_UTILIZATION', 'JSON')}
                className="flex-1 py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center justify-center gap-1 transition"
              >
                <FileCode className="w-3 h-3 text-cyan-400" /> JSON
              </button>
            </div>
          </div>

          {/* Report 4 */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5 flex flex-col justify-between">
            <div>
              <div className="font-bold text-white text-xs">Sector Capacity & Operations</div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Inflow/outflow dynamics, queue lengths, safe limits, and bottleneck monitoring.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
              <button
                onClick={() => handleDownload('ZONE_OPERATIONS', 'CSV')}
                className="flex-1 py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center justify-center gap-1 transition"
              >
                <FileSpreadsheet className="w-3 h-3 text-emerald-400" /> CSV
              </button>
              <button
                onClick={() => handleDownload('ZONE_OPERATIONS', 'JSON')}
                className="flex-1 py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center justify-center gap-1 transition"
              >
                <FileCode className="w-3 h-3 text-cyan-400" /> JSON
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
