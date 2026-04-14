"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Map as MapIcon, 
  TriangleAlert, 
  Waves, 
  Car, 
  Flame,
  Plus,
  ArrowUpRight,
  TrendingUp,
  History,
  Info
} from 'lucide-react';
import { AdminHandler } from '../../src/agents/AdminDashboardAgent/AdminHandler';
import { Incident } from '../../src/types/incident';
import { Button } from '../UI/Button';
import { toast } from 'sonner';

interface Hotspot {
  id: string;
  type: string;
  address: string;
  lat: number;
  lng: number;
  reportCount: number;
  severity: 'high' | 'medium' | 'low';
}

export const ProneAreasView = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await AdminHandler.getIncidents();
        setIncidents(data);
      } catch (err) {
        toast.error("Failed to fetch cluster data.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // Simple Clustering Logic (Requirement 1.4 Mock-Implementation)
  const hotspots = useMemo(() => {
    const groups: Record<string, Incident[]> = {};
    
    // Group by rounded location (roughly 500m area)
    incidents.forEach(inc => {
      const precision = 0.005; 
      const key = `${Math.round(inc.location.lat / precision) * precision}-${Math.round(inc.location.lng / precision) * precision}-${inc.type}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(inc);
    });

    return Object.entries(groups)
      .filter(([_, items]) => items.length >= 2) // Need at least 2 reports to be "Prone"
      .map(([key, items]) => {
        const [lat, lng, type] = key.split('-');
        return {
          id: key,
          type: items[0].type,
          address: items[0].location.address,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          reportCount: items.length,
          severity: items.length >= 5 ? 'high' : items.length >= 3 ? 'medium' : 'low'
        } as Hotspot;
      })
      .sort((a, b) => b.reportCount - a.reportCount);
  }, [incidents]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-inter">
      {/* Visual Header */}
      <div className="relative p-10 bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-black tracking-widest text-primary uppercase mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              Pattern Intelligence Active
            </span>
            <h1 className="text-4xl font-black text-white tracking-tight leading-tight mb-4">
              Prone Areas <span className="text-slate-500">&</span> High-Risk Clusters
            </h1>
            <p className="text-slate-400 font-bold leading-relaxed">
              Res-Q AI patterns automatically group non-verified reports into "Hazard Hotspots." 
              Review clusters to officially designate an area as <span className="text-emerald-400">Flood Prone</span> or <span className="text-red-400">Accident Hotspot</span>.
            </p>
          </div>

          <div className="flex flex-col gap-3 shrink-0">
             <div className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl">
               <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Detected Clusters</span>
               <span className="block text-4xl font-black text-white">{hotspots.length}</span>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Analytics Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Live Activity Zones
            </h3>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">High Density</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Developing</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-48 bg-slate-100 rounded-3xl animate-pulse"></div>
              ))
            ) : hotspots.length > 0 ? (
               hotspots.map(spot => (
                 <div key={spot.id} className="group relative bg-white border-2 border-slate-100 rounded-3xl p-6 hover:border-primary/20 transition-all hover:shadow-2xl hover:shadow-primary/5">
                    <div className="flex items-start justify-between mb-8">
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl ${
                         spot.type === 'flood' ? 'bg-blue-600 shadow-blue-500/20' : 
                         spot.type === 'accident' ? 'bg-emerald-600 shadow-emerald-500/20' :
                         spot.type === 'fire' ? 'bg-orange-600 shadow-orange-500/20' : 'bg-slate-900 shadow-slate-900/10'
                       }`}>
                         {spot.type === 'flood' ? <Waves className="w-7 h-7" /> : 
                          spot.type === 'accident' ? <Car className="w-7 h-7" /> :
                          spot.type === 'fire' ? <Flame className="w-7 h-7" /> : <TriangleAlert className="w-7 h-7" />}
                       </div>
                       <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                         spot.severity === 'high' ? 'bg-red-50 text-red-600 border border-red-100' :
                         spot.severity === 'medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                         'bg-emerald-50 text-emerald-600 border border-emerald-100'
                       }`}>
                         {spot.reportCount} Reports
                       </div>
                    </div>

                    <div className="mb-8">
                      <h4 className="text-xl font-black text-slate-900 tracking-tight mb-2 group-hover:text-primary transition-colors">
                        {spot.type.charAt(0).toUpperCase() + spot.type.slice(1)} Cluster
                      </h4>
                      <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                        <MapIcon className="w-3 h-3" />
                        {spot.address}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                       <Button size="sm" className="flex-1 h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-[10px] uppercase font-black tracking-[0.15em]">
                         Designate Zone
                       </Button>
                       <Button variant="outline" size="sm" className="h-11 w-11 rounded-xl border-slate-100 hover:bg-slate-50">
                         <ArrowUpRight className="w-4 h-4 text-slate-400" />
                       </Button>
                    </div>
                 </div>
               ))
            ) : (
              <div className="col-span-2 py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center text-center px-10">
                 <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                    <History className="w-8 h-8 text-slate-300" />
                 </div>
                 <h4 className="text-lg font-black text-slate-900 mb-2">Insufficient Patterns</h4>
                 <p className="max-w-xs text-sm font-bold text-slate-400 leading-relaxed">
                   AI needs at least 2 reports in similar proximity to suggest a high-risk prone area. Update monitoring data to start analysis.
                 </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-6">
           {/* Guidelines Card */}
           <div className="bg-white border-2 border-slate-100 rounded-[32px] p-8">
              <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-6">
                 <Info className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight mb-4">Verification Guidelines</h3>
              <ul className="space-y-4">
                {[
                  "Zones with 5+ reports within 1km are automatically elevated to Critical.",
                  "Prone areas should be verified via traffic monitoring before designation.",
                  "Designation syncs real-time with Citizen 'What To Do' advisories."
                ].map((text, i) => (
                  <li key={i} className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2"></div>
                    <p className="text-xs font-bold text-slate-500 leading-relaxed">{text}</p>
                  </li>
                ))}
              </ul>
           </div>

           {/* Manual Add Card */}
           <button className="w-full p-8 bg-primary rounded-[32px] text-left group hover:shadow-2xl hover:shadow-primary/20 transition-all active:scale-[0.98]">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                 <Plus className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-black text-white tracking-tight leading-tight mb-2">Manual Hotspot Designation</h3>
              <p className="text-white/60 text-xs font-bold leading-relaxed">
                Add high-risk zones manually during typhoons or road maintenance events.
              </p>
           </button>
        </div>
      </div>
    </div>
  );
};
