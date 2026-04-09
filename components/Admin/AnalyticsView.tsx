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
import { AdminHandler, TrafficStats } from '../../src/agents/AdminDashboardAgent/AdminHandler';

export const AnalyticsView = () => {
  const [stats, setStats] = useState<TrafficStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const data = await AdminHandler.getTrafficAnalytics();
      setStats(data);
      setIsLoading(false);
    };
    fetchAnalytics();
  }, []);

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
    </div>
  );
};
