"use client";

import React, { useState } from 'react';
import { 
  Navigation, 
  MapPin, 
  X, 
  ArrowRight, 
  Clock, 
  AlertCircle,
  Activity,
  TrafficCone,
  Car,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Button } from '../UI/Button';

interface RouteNavigationProps {
  onClose: () => void;
}

export const RouteNavigation = ({ onClose }: RouteNavigationProps) => {
  const [start, setStart] = useState('My Current Location');
  const [destination, setDestination] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [routeOptions, setRouteOptions] = useState<any[] | null>(null);

  const handleCalculateRoute = () => {
    setIsSearching(true);
    // Simulate route calculation logic (Requirement 1.1, 1.2, 1.4)
    setTimeout(() => {
      setRouteOptions([
        { id: 1, label: 'Optimal Route', time: '14 min', dist: '3.2 km', traffic: 'low', color: 'bg-emerald-500', active: true },
        { id: 2, label: 'Alternative A', time: '19 min', dist: '4.5 km', traffic: 'moderate', color: 'bg-amber-500' },
        { id: 3, label: 'Expressway', time: '22 min', dist: '6.1 km', traffic: 'heavy', color: 'bg-red-500', incident: true },
      ]);
      setIsSearching(false);
    }, 1500);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 overflow-hidden font-inter border-r border-slate-200 shadow-2xl">
      {/* Sleek Header */}
      <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center relative">
            <div className="absolute inset-0 bg-blue-400 rounded-2xl blur opacity-20 animate-pulse"></div>
            <Navigation className="w-6 h-6 text-blue-600 relative z-10" />
          </div>
          <div>
            <h3 className="font-black text-xl text-slate-900 tracking-tight">Route Planner</h3>
            <p className="text-[11px] font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              Real-time Pathfinding
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <div className="space-y-5 mb-8 shrink-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Waypoints Card */}
          <div className="p-2 bg-white border border-slate-200 rounded-[24px] shadow-sm relative">
            <div className="absolute left-[35px] top-[48px] w-[2px] h-[32px] bg-slate-100" />
            
            <div className="relative p-2">
              <div className="absolute left-6 top-6 w-4 h-4 rounded-full border-[3px] border-blue-500 bg-white z-10 shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
              <input 
                className="w-full pl-14 pr-4 py-4 bg-slate-50 hover:bg-slate-100 border border-transparent rounded-[16px] text-sm font-black text-slate-700 focus:outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-500/10 transition-all"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                placeholder="Starting point"
              />
            </div>
            
            <div className="relative p-2 pt-0">
              <div className="absolute left-4 top-4 w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center z-10">
                <MapPin className="w-4 h-4" />
              </div>
              <input 
                className="w-full pl-14 pr-4 py-4 bg-slate-50 hover:bg-slate-100 border border-transparent rounded-[16px] text-sm font-black text-slate-700 focus:outline-none focus:bg-white focus:border-red-200 focus:ring-4 focus:ring-red-500/10 transition-all"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Where to?"
              />
            </div>
          </div>

          <Button 
            className="w-full h-14 rounded-[16px] bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-900/15 text-sm uppercase tracking-widest font-bold text-white transition-all active:scale-[0.98]" 
            onClick={handleCalculateRoute}
            isLoading={isSearching}
          >
            Calculate Secure Route
          </Button>
        </div>

        {routeOptions && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex items-center justify-between px-1 mb-2">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Available Routes</h4>
              <span className="text-[10px] font-black tracking-widest text-emerald-500 flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-md border border-emerald-100">
                <Activity className="w-3 h-3 animate-pulse" /> LIVE PREDICTION
              </span>
            </div>

            {routeOptions.map((opt) => (
              <button 
                key={opt.id}
                className={`w-full p-5 rounded-[24px] border-2 text-left transition-all relative overflow-hidden group hover:shadow-lg ${
                  opt.active 
                    ? 'border-blue-500 bg-white shadow-xl shadow-blue-500/10' 
                    : 'border-slate-200 bg-white hover:border-blue-300'
                }`}
              >
                {opt.active && <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400 blur-[50px] opacity-10 rounded-full"></div>}
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center text-white shadow-md ${
                         opt.traffic === 'low' ? 'bg-emerald-500' : opt.traffic === 'moderate' ? 'bg-amber-500' : 'bg-red-500'
                      }`}>
                        <Car className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block text-sm font-black text-slate-900">{opt.label}</span>
                        <span className="block text-[10px] font-bold text-slate-400 mt-0.5">{opt.dist} via Expressway</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                       <span className={`block text-xl font-black ${opt.active ? 'text-blue-600' : 'text-slate-700'}`}>
                         {opt.time}
                       </span>
                       <span className="flex items-center justify-end gap-1 text-[10px] font-black uppercase tracking-widest mt-1">
                         <span className={`w-1.5 h-1.5 rounded-full ${opt.color}`}></span>
                         {opt.traffic} Traffic
                       </span>
                    </div>
                  </div>
                  
                  {opt.incident ? (
                    <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-[12px] text-[10px] font-bold flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                         <TrafficCone className="w-3 h-3" />
                      </div>
                      Incident detected! Rerouting is highly suggested. 
                    </div>
                  ) : (
                    <div className={`mt-4 p-3 border rounded-[12px] text-[10px] font-bold flex items-center gap-3 ${
                      opt.active ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-slate-50 border-slate-100 text-slate-500'
                    }`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        opt.active ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'
                      }`}>
                         <ShieldCheck className="w-3 h-3" />
                      </div>
                      Clear path ahead. Route is visually secure.
                    </div>
                  )}
                </div>
                
                {opt.active && (
                   <div className="absolute top-4 right-4 text-blue-500 opacity-20">
                     <CheckCircle2 className="w-24 h-24 absolute -top-8 -right-8" />
                   </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
