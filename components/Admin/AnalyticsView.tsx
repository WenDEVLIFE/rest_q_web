"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Download,
  Eye,
  FileText,
  Layers,
  Map as MapIcon,
  RefreshCcw,
  Search as SearchIcon,
  Users,
  Wind,
  Car,
  Gauge,
  Table as TableIcon,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminHandler } from '../../src/agents/AdminDashboardAgent/AdminHandler';
import { type TrafficStats } from '../../src/types/traffic_stats';
import { type Incident } from '../../src/types/incident';
import { ExcelService, type ExcelTrafficRow } from '../../src/service/Excel_Service';
import { KMLService } from '../../src/service/KML_Service';

type ModelFile = {
  name: string;
  size: number;
  sizeFormatted: string;
  type: string;
  modifiedAt: string;
  isValid?: boolean;
  schema?: {
    type: string;
    requiredFields: string[];
  } | null;
};

type TimelinePoint = TrafficStats;

const APPROVED_KML_FILES = ['VEHICLE SPEED.kml', 'TRAFFIC VOLUME.kml'] as const;

const numberFrom = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const isNumericCell = (value: unknown) => {
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed !== '' && Number.isFinite(Number(trimmed));
};

const rowVolume = (row: ExcelTrafficRow) => {
  const numericCells = Object.entries(row).filter(([key, value]) => {
    if (key === 'NO.' || key === 'ROAD NAME') return false;
    return isNumericCell(value);
  });

  if (numericCells.length === 0) return 0;
  return Math.round(numericCells.reduce((sum, [, value]) => sum + numberFrom(value), 0) / numericCells.length);
};

const rowPeriodCount = (row: ExcelTrafficRow) => {
  return Object.entries(row).filter(([key, value]) => {
    if (key === 'NO.' || key === 'ROAD NAME') return false;
    return isNumericCell(value);
  }).length;
};

const formatDateTime = (value: string) => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

export const AnalyticsView = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [trafficStats, setTrafficStats] = useState<TrafficStats[]>([]);
  const [excelRows, setExcelRows] = useState<ExcelTrafficRow[]>([]);
  const [modelFiles, setModelFiles] = useState<ModelFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [excelSearch, setExcelSearch] = useState('');

  useEffect(() => {
    void loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [incidentData, trafficData, fileData, workbookRows] = await Promise.all([
        AdminHandler.getIncidents(),
        AdminHandler.getTrafficAnalytics(),
        fetch('/api/admin/files')
          .then((response) => response.json())
          .then((data) => (data.success ? (data.files as ModelFile[]) : []))
          .catch(() => []),
        ExcelService.loadTrafficData(),
      ]);

      setIncidents(incidentData);
      setTrafficStats(trafficData);
      setModelFiles(fileData);
      setExcelRows(workbookRows);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      toast.error('Failed to load analytics data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const refreshDashboard = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
  };

  const handleDownload = (filename: string) => {
    const link = document.createElement('a');
    link.href = `/api/admin/files/${encodeURIComponent(filename)}`;
    link.download = filename;
    link.click();
    toast.success(`Downloaded ${filename}`);
  };

  const registryRows = useMemo(() => {
    return excelRows.filter((row) => {
      const roadName = String(row['ROAD NAME'] ?? row['Road Name'] ?? '').trim();
      if (!roadName || roadName.toUpperCase() === 'ROAD NAME') return false;
      const volume = rowVolume(row);
      return rowPeriodCount(row) > 0 && volume > 0;
    });
  }, [excelRows]);

  const timeline: TimelinePoint[] = useMemo(() => {
    if (registryRows.length > 0) {
      return registryRows.slice(0, 6).map((row, index) => ({
        timestamp: String(row['ROAD NAME'] ?? row['Road Name'] ?? `Row ${index + 1}`),
        volume: rowVolume(row),
        speed: 0,
        occupancy: 0,
      }));
    }

    return trafficStats;
  }, [registryRows, trafficStats]);

  const summary = useMemo(() => {
    const totalIncidents = incidents.length;
    const pendingIncidents = incidents.filter((incident) => incident.status === 'pending').length;
    const verifiedIncidents = incidents.filter((incident) => incident.status === 'verified').length;
    const resolvedIncidents = incidents.filter((incident) => incident.status === 'resolved').length;

    const totalSpeed = timeline.reduce((accumulator, point) => accumulator + numberFrom(point.speed), 0);
    const totalVolume = timeline.reduce((accumulator, point) => accumulator + numberFrom(point.volume), 0);
    const totalOccupancy = timeline.reduce((accumulator, point) => accumulator + numberFrom(point.occupancy), 0);
    const count = Math.max(timeline.length, 1);

    const classifiedRows = timeline.filter((point) => numberFrom(point.volume) > 0);
    const heavyRows = classifiedRows.filter((point) => numberFrom(point.volume) >= 4500).length;
    const moderateRows = classifiedRows.filter((point) => numberFrom(point.volume) >= 2000 && numberFrom(point.volume) < 4500).length;
    const fluidRows = classifiedRows.filter((point) => numberFrom(point.volume) < 2000).length;
    const totalClassified = Math.max(classifiedRows.length, 1);

    return {
      totalIncidents,
      pendingIncidents,
      verifiedIncidents,
      resolvedIncidents,
      averageSpeed: (totalSpeed / count).toFixed(1),
      averageVolume: Math.round(totalVolume / count),
      averageOccupancy: (totalOccupancy / count).toFixed(1),
      responsePressure: Math.max(6, Math.round(8 + pendingIncidents * 0.8)),
      heavyShare: Math.round((heavyRows / totalClassified) * 100),
      moderateShare: Math.round((moderateRows / totalClassified) * 100),
      fluidShare: Math.round((fluidRows / totalClassified) * 100),
    };
  }, [incidents, timeline]);

  const filteredRows = useMemo(() => {
    const query = excelSearch.trim().toLowerCase();
    if (!query) return registryRows;
    return registryRows.filter((row) =>
      Object.values(row).some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [registryRows, excelSearch]);

  return (
    <div className="space-y-6 flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 font-inter">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-black tracking-tight text-slate-900">Traffic Intelligence</h2>
          </div>
          <p className="text-sm font-bold text-slate-400">
            Live incident totals, approved model files, and spreadsheet-backed traffic metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={refreshDashboard}
            disabled={isRefreshing}
            className="p-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-500 hover:text-primary transition-all active:scale-95 disabled:opacity-60"
          >
            <RefreshCcw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Avg. Volume', value: summary.averageVolume, unit: 'veh/hr', icon: Car, color: 'text-sky-600', trend: `${summary.pendingIncidents} pending` },
          { label: 'Avg. Speed', value: summary.averageSpeed, unit: 'km/hr', icon: Wind, color: 'text-emerald-600', trend: `${summary.verifiedIncidents} verified` },
          { label: 'Occupancy', value: summary.averageOccupancy, unit: '%', icon: Users, color: 'text-amber-600', trend: `${summary.resolvedIncidents} resolved` },
          { label: 'Pressure', value: summary.responsePressure, unit: 'score', icon: Gauge, color: 'text-red-600', trend: 'incident load' },
        ].map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-primary/20 transition-all">
              <div className={`p-3 rounded-xl bg-slate-50 w-fit mb-4 group-hover:bg-primary/5 transition-colors ${metric.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{metric.label}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">{metric.value}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase">{metric.unit}</span>
                </div>
              </div>
              <div className="absolute top-6 right-6 text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {metric.trend}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Traffic Volume Trend</h3>
              <p className="text-[11px] font-bold text-slate-400 mt-1">Derived from the approved spreadsheet model</p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span className="text-[10px] font-bold text-slate-400">Current snapshot</span>
            </div>
          </div>

          <div className="h-64 flex items-end justify-between gap-3 px-2">
            {timeline.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-sm font-bold text-slate-400">
                No traffic records available yet.
              </div>
            ) : (
              timeline.map((point, index) => {
                const maxVolume = Math.max(...timeline.map((item) => numberFrom(item.volume)), 1);
                const barHeight = Math.max(24, (numberFrom(point.volume) / maxVolume) * 200);

                return (
                  <div key={`${point.timestamp}-${index}`} className="flex-1 flex flex-col items-center gap-3 group">
                    <div className="w-full relative h-[220px] flex items-end">
                      <div
                        className="w-full bg-slate-100 rounded-t-lg group-hover:bg-primary/10 transition-colors absolute bottom-0 left-0"
                        style={{ height: `${barHeight}px` }}
                      />
                      <div
                        className="w-full bg-primary rounded-t-lg group-hover:shadow-lg group-hover:shadow-primary/20 transition-all absolute bottom-0 left-0"
                        style={{ height: `${Math.max(18, barHeight - 28)}px` }}
                      />
                    </div>
                    <div className="text-center">
                      <span className="block text-[10px] font-bold text-slate-500 font-mono">{point.timestamp}</span>
                      <span className="block text-[10px] font-black text-slate-900 mt-1">{numberFrom(point.volume)} veh/hr</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Risk Classification</h3>
          <div className="space-y-6">
            {[
              { label: 'High congestion', value: summary.heavyShare, color: 'bg-red-500', bg: 'bg-red-50' },
              { label: 'Moderate flow', value: summary.moderateShare, color: 'bg-amber-500', bg: 'bg-amber-50' },
              { label: 'Stable traffic', value: summary.fluidShare, color: 'bg-emerald-500', bg: 'bg-emerald-50' },
            ].map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-500">{item.label}</span>
                  <span className="text-slate-900">{item.value}%</span>
                </div>
                <div className={`w-full h-2 ${item.bg} rounded-full overflow-hidden`}>
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}

            <div className="mt-8 pt-8 border-t border-slate-100 italic text-[11px] text-slate-400 font-medium">
              {summary.totalIncidents} incidents are in the system right now, with {summary.pendingIncidents} waiting for review.
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-8 rounded-[32px] border-2 border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center">
              <Layers className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Approved Model Files</h3>
              <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest">
                {modelFiles.filter((file) => file.isValid).length} approved files detected
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {modelFiles.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-500">No model files found.</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1">Use the ML Insights panel to upload approved files.</p>
              </div>
            ) : (
              modelFiles.map((file) => (
                <div key={file.name} className="p-5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{file.name}</p>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-500 mt-1">
                      <span className="bg-white px-2 py-0.5 rounded border border-slate-200 uppercase">{file.type}</span>
                      <span>{file.sizeFormatted}</span>
                      <span>{formatDateTime(file.modifiedAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleDownload(file.name)}
                      className="p-2.5 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4 text-emerald-600" />
                    </button>
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${file.isValid ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                      {file.isValid ? 'Approved' : 'Needs review'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-800">
            The approved files provide road names, coordinates, and traffic volumes. They do not contain a true elevation or slope dataset.
            Some KML placemarks include altitude metadata, but that is camera/view altitude rather than terrain slope.
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[38px] border-2 border-slate-100 shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <TableIcon className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Traffic Volume Registry</h3>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                Local XLSX model: {registryRows.length} records
              </p>
            </div>
          </div>

          <div className="relative w-full md:w-72">
            <SearchIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search rows..."
              value={excelSearch}
              onChange={(event) => setExcelSearch(event.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[11px] font-bold focus:outline-none focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-[24px] border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Road Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Coordinates / Hour</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Volume</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-sm font-bold text-slate-400">
                    No spreadsheet rows matched your search.
                  </td>
                </tr>
              ) : (
                filteredRows.slice(0, 15).map((row, index) => {
                  const roadName = row['ROAD NAME'] || row['Road Name'] || row['Road_Segment'] || row['Road Segment'] || 'Unnamed Corridor';
                  const coordinates = row['Coordinates'] || row['Location'] || row['Lat/Lng'] || `${rowPeriodCount(row)} periods`;
                  const volume = rowVolume(row);
                  const status = row['Status'] || 'Synced';

                  return (
                    <tr key={`${roadName}-${index}`} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-xs font-black text-slate-900">{roadName}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-mono font-bold text-slate-400">{coordinates}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[11px] font-bold text-slate-700">{numberFrom(volume)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-black uppercase px-3 py-1 bg-sky-50 text-sky-600 rounded-full border border-sky-100">
                            {status}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                const query = coordinates !== 'Lat/Lng missing' && !String(coordinates).endsWith('periods')
                                  ? String(coordinates)
                                  : String(roadName);
                                window.open(
                                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
                                  '_blank',
                                  'noopener,noreferrer',
                                );
                              }}
                              className="p-2 text-slate-400 hover:text-primary hover:bg-white rounded-xl shadow-sm transition-all border border-transparent hover:border-slate-100 active:scale-95"
                              title="Visualize on Maps"
                            >
                              <MapIcon className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-white rounded-xl shadow-sm transition-all border border-transparent hover:border-slate-100 active:scale-95"
                              title="Inspect row"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {filteredRows.length > 15 && (
            <div className="p-4 bg-slate-50/50 text-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest py-2 block">
                Displaying first 15 records of {filteredRows.length} total. Use search to filter.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
