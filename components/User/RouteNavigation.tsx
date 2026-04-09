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
  ChevronDown,
  TrafficCone
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
    <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-right-8 duration-500 font-inter">
      {/* Header */}
      <div className="p-6 bg-primary text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
            <Navigation className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-black text-lg tracking-tight">Route Planner</h3>
            <p className="text-[10px] font-bold text-sky-200 uppercase tracking-widest">Real-time pathfinding</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-8">
        <div className="space-y-4 mb-8">
          <div className="relative">
            <div className="absolute left-4 top-4 w-4 h-4 rounded-full border-2 border-primary bg-white z-10" />
            <div className="absolute left-[23px] top-[32px] w-0.5 h-12 bg-slate-100" />
            <input 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-primary/20 transition-all shadow-inner"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              placeholder="Starting point"
            />
          </div>
          <div className="relative">
            <MapPin className="w-5 h-5 absolute left-3.5 top-3.5 text-red-500 z-10" />
            <input 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-primary/20 transition-all shadow-inner"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Where to?"
            />
          </div>
          <Button 
            className="w-full h-12 rounded-xl bg-slate-900 shadow-xl shadow-slate-900/10" 
            onClick={handleCalculateRoute}
            isLoading={isSearching}
          >
            Calculate Shortest Route
          </Button>
        </div>

        {routeOptions && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Routes</h4>
              <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                <Activity className="w-3 h-3" /> Live Prediction active
              </span>
            </div>

            {routeOptions.map((opt) => (
              <button 
                key={opt.id}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                  opt.active ? 'border-primary bg-primary/5' : 'border-slate-50 bg-white hover:border-slate-200 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${opt.color}`} />
                    <span className="text-sm font-black text-slate-900">{opt.label}</span>
                  </div>
                  <div className="flex items-center gap-2 text-primary">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-mono font-bold tracking-tighter">{opt.time}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">{opt.dist} via Expressway</span>
                  <div className="flex items-center gap-1.5">
                    {opt.incident && <TrafficCone className="w-4 h-4 text-red-500 animate-bounce" />}
                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                      opt.traffic === 'low' ? 'text-emerald-500' : opt.traffic === 'moderate' ? 'text-amber-500' : 'text-red-500'
                    }`}>
                      {opt.traffic} traffic
                    </span>
                  </div>
                </div>
                {opt.incident && (
                  <div className="mt-3 p-2 bg-red-100 text-red-700 rounded-lg text-[10px] font-bold flex items-center gap-2">
                    <AlertCircle className="w-3 h-3" />
                    Incident detected! Rerouting suggested. 
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
