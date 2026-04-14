"use client";

import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock,
  Car,
  Wind,
  Settings2
} from 'lucide-react';
import { AdminHandler } from '../../src/agents/AdminDashboardAgent/AdminHandler';
import { TrafficStats } from '../../src/types/traffic_stats';
import { KMLService } from '../../src/service/KML_Service';
import { ExcelService, ExcelTrafficRow } from '../../src/service/Excel_Service';
import { 
  FileJson, 
  Map as MapIcon, 
  RefreshCcw, 
  Trash2, 
  Activity,
  UploadCloud,
  Layers,
  CheckCircle2,
  Table as TableIcon,
  Search as SearchIcon,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

export const AnalyticsView = () => {
  const [stats, setStats] = useState<TrafficStats[]>([]);
  const [segments, setSegments] = useState<any[]>([]);
  const [excelData, setExcelData] = useState<ExcelTrafficRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [excelSearch, setExcelSearch] = useState('');

  useEffect(() => {
    fetchData();
    loadExcelRegistry();
  }, []);

  const loadExcelRegistry = async () => {
    try {
      const data = await ExcelService.loadTrafficData('/models/TRAFFIC-VOLUME-PER-ROAD-SEGMENT.xlsx');
      setExcelData(data);
    } catch (e) {
      console.warn("Could not load local Excel registry. Check if file exists in /models/");
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    const [trafficStats, trafficSegments] = await Promise.all([
      AdminHandler.getTrafficAnalytics(),
      AdminHandler.getTrafficSegments()
    ]);
    setStats(trafficStats);
    setSegments(trafficSegments);
    setIsLoading(false);
  };

  const handleKMLImport = async (type: 'speed' | 'volume') => {
    setIsImporting(true);
    try {
      // In a real app, this would be a file upload. 
      // For this demo, we'll fetch the local KML file you provided in /models/
      const filename = type === 'speed' ? 'VEHICLE SPEED.kml' : 'TRAFFIC VOLUME.kml';
      const response = await fetch(`/models/${filename}`);
      if (!response.ok) throw new Error(`KML file not found at /models/${filename}. Ensure it is in public/models/`);
      
      const kmlText = await response.text();
      const parsedSegments = await KMLService.parseKML(kmlText);
      
      await AdminHandler.bulkUpsertTrafficSegments(parsedSegments);
      toast.success(`Successfully imported ${parsedSegments.length} segments from ${filename}`);
      fetchData();
    } catch (error: any) {
      toast.error(`KML Import Failed: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const updateSegmentStatus = async (id: string, status: 'heavy' | 'moderate' | 'fluid') => {
    try {
      await AdminHandler.updateTrafficStatus(id, status);
      setSegments(prev => prev.map(s => s.id === id ? { ...s, status } : s));
      toast.success("Road status updated.");
    } catch (e) {
      toast.error("Failed to update segment.");
    }
  };

  const metrics = [
    { label: 'Avg. Volume', value: '782', unit: 'veh/hr', icon: Car, color: 'text-sky-600', trend: '+12%' },
    { label: 'Avg. Speed', value: '42.5', unit: 'km/hr', icon: Wind, color: 'text-emerald-600', trend: '-2.4%' },
    { label: 'Occupancy', value: '28.4', unit: '%', icon: Users, color: 'text-amber-600', trend: '+5.1%' },
    { label: 'Response Time', value: '14.2', unit: 'min', icon: Clock, color: 'text-red-600', trend: '-3.2%' },
  ];

  return (
    <div className="space-y-6 flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 font-inter">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-black tracking-tight text-slate-900">Traffic Intelligence</h2>
          </div>
          <p className="text-sm font-bold text-slate-400">Real-time telemetry and pattern analysis</p>
        </div>
        <button className="p-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-500 hover:text-primary transition-all active:scale-95">
          <Settings2 className="w-5 h-5" />
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-primary/20 transition-all">
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
              <div className={`absolute top-6 right-6 text-[10px] font-black px-2 py-0.5 rounded-full ${metric.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {metric.trend}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Analytics Content - Simple Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Traffic Volume (Hourly)</h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span className="text-[10px] font-bold text-slate-400">Current</span>
              </div>
            </div>
          </div>
          
          <div className="h-64 flex items-end justify-between gap-3 px-2">
            {isLoading ? null : stats.map((stat, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-3 group">
                <div className="w-full relative">
                   <div 
                    className="w-full bg-slate-100 rounded-t-lg group-hover:bg-primary/10 transition-colors absolute bottom-0 left-0" 
                    style={{ height: `${(stat.volume / 1200) * 200}px` }}
                  />
                  <div 
                    className="w-full bg-primary rounded-t-lg group-hover:shadow-lg group-hover:shadow-primary/20 transition-all" 
                    style={{ height: `${(stat.volume / 1200) * 160}px` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-500 font-mono">{stat.timestamp}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Risk Classification</h3>
          <div className="space-y-6">
            {[
              { label: 'High Congestion', value: 12, color: 'bg-red-500', bg: 'bg-red-50' },
              { label: 'Moderate Flow', value: 45, color: 'bg-amber-500', bg: 'bg-amber-50' },
              { label: 'Stable Traffic', value: 68, color: 'bg-emerald-500', bg: 'bg-emerald-50' },
            ].map((item, idx) => (
              <div key={idx} className="space-y-2">
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
              * Data derived from real-time telemetry and historical training models.
            </div>
          </div>
        </div>
      </div>

      {/* --- KML GEOSPATIAL MANAGEMENT --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* KML Importer Card */}
         <div className="bg-white p-8 rounded-[32px] border-2 border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
               <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center">
                  <UploadCloud className="w-7 h-7" />
               </div>
               <div>
                  <h3 className="text-lg font-black text-slate-900">Geospatial Data Import</h3>
                  <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest">KML Model Processor</p>
               </div>
            </div>

            <p className="text-xs font-bold text-slate-500 mb-8 leading-relaxed">
               Sync high-fidelity road networks directly from Google Earth KML models. The system will extract LineString geometries and inject them into the live traffic engine.
            </p>

            <div className="grid grid-cols-2 gap-4">
               <button 
                onClick={() => handleKMLImport('speed')}
                disabled={isImporting}
                className="group p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl hover:border-sky-400 hover:bg-sky-50 transition-all text-left"
               >
                  <MapIcon className="w-5 h-5 text-slate-400 group-hover:text-sky-600 mb-2 transition-colors" />
                  <span className="block text-[11px] font-black uppercase text-slate-900">Vehicle Speed</span>
                  <span className="text-[9px] font-bold text-slate-400">Load .kml Model</span>
               </button>

               <button 
                onClick={() => handleKMLImport('volume')}
                disabled={isImporting}
                className="group p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl hover:border-amber-400 hover:bg-amber-50 transition-all text-left"
               >
                  <Layers className="w-5 h-5 text-slate-400 group-hover:text-amber-600 mb-2 transition-colors" />
                  <span className="block text-[11px] font-black uppercase text-slate-900">Traffic Volume</span>
                  <span className="text-[9px] font-bold text-slate-400">Load .kml Model</span>
               </button>
            </div>
         </div>

         {/* Managed Segments CRUD */}
         <div className="bg-white p-8 rounded-[32px] border-2 border-slate-100 shadow-sm flex flex-col h-[450px]">
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Managed Network</h3>
               </div>
               <span className="text-[10px] font-black bg-slate-100 px-3 py-1 rounded-full text-slate-500">{segments.length} Segments</span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
               {segments.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-40">
                     <FileJson className="w-12 h-12 mb-2" />
                     <p className="text-[10px] font-black uppercase">No segments imported</p>
                  </div>
               ) : segments.map((seg) => (
                  <div key={seg.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-primary/20 transition-all">
                     <div>
                        <h4 className="text-[11px] font-black text-slate-900 truncate max-w-[150px]">{seg.name}</h4>
                        <p className="text-[9px] font-bold text-slate-400 font-mono">ID: {seg.id}</p>
                     </div>
                     <div className="flex items-center gap-2">
                        <select 
                          value={seg.status}
                          onChange={(e) => updateSegmentStatus(seg.id, e.target.value as any)}
                          className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border-2 appearance-none cursor-pointer outline-none ${
                            seg.status === 'heavy' ? 'bg-red-50 border-red-100 text-red-600' :
                            seg.status === 'moderate' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                            'bg-emerald-50 border-emerald-100 text-emerald-600'
                          }`}
                        >
                           <option value="fluid">Fluid</option>
                           <option value="moderate">Moderate</option>
                           <option value="heavy">Heavy</option>
                        </select>
                        <button className="p-1.5 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all">
                           <Trash2 className="w-3.5 h-3.5" />
                        </button>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>

      {/* --- SPREADSHEET REGISTRY (Big Data Browser) --- */}
      <div className="bg-white p-8 rounded-[38px] border-2 border-slate-100 shadow-sm overflow-hidden">
         <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
               <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <TableIcon className="w-7 h-7" />
               </div>
               <div>
                  <h3 className="text-lg font-black text-slate-900">Traffic Volume Registry</h3>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Local XLSX Model: {excelData.length} Records</p>
               </div>
            </div>

            <div className="relative w-full md:w-72">
               <SearchIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
               <input 
                 type="text" 
                 placeholder="Search segments..."
                 value={excelSearch}
                 onChange={(e) => setExcelSearch(e.target.value)}
                 className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[11px] font-bold focus:outline-none focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all"
               />
            </div>
         </div>

         <div className="overflow-x-auto rounded-[24px] border border-slate-100">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Road Name</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Coordinates</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Volume</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {excelData.filter(row => 
                    Object.values(row).some(val => String(val).toLowerCase().includes(excelSearch.toLowerCase()))
                  ).slice(0, 15).map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                       <td className="px-6 py-4">
                          <span className="text-xs font-black text-slate-900">{row['Road Name'] || 'Unnamed Corridor'}</span>
                       </td>
                       <td className="px-6 py-4">
                          <span className="text-[10px] font-mono font-bold text-slate-400">{row['Coordinates'] || 'Lat/Lng Missing'}</span>
                       </td>
                       <td className="px-6 py-4">
                          <span className="text-[11px] font-bold text-slate-700">{row['Traffic Volume'] || row['volume'] || '0'}</span>
                       </td>
                       <td className="px-6 py-4">
                          <span className="text-[9px] font-black uppercase px-3 py-1 bg-sky-50 text-sky-600 rounded-full border border-sky-100">
                             {row['Status'] || 'Synced'}
                          </span>
                       </td>
                       <td className="px-6 py-4">
                          <button className="p-2 text-slate-400 hover:text-primary hover:bg-white rounded-xl shadow-sm transition-all border border-transparent hover:border-slate-100 active:scale-95">
                             <Eye className="w-4 h-4" />
                          </button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
            {excelData.length > 15 && (
               <div className="p-4 bg-slate-50/50 text-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest py-2 block">
                     Displaying first 15 records of {excelData.length} total. Use search to filter.
                  </span>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};
