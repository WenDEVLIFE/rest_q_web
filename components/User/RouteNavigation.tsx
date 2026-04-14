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
  CheckCircle2,
  Target
} from 'lucide-react';
import { Button } from '../UI/Button';
import { toast } from 'sonner';

interface RouteNavigationProps {
  onClose: () => void;
  onSelectDestination?: (lat: number, lng: number, label: string) => void;
  onUpdateStart?: (lat: number, lng: number) => void;
}

export const RouteNavigation = ({ onClose, onSelectDestination, onUpdateStart }: RouteNavigationProps) => {
  const [start, setStart] = useState('15.0286, 120.6898');
  const [isSearching, setIsSearching] = useState(false);
  const [facilities, setFacilities] = useState<any[] | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<any | null>(null);
  const [routeOptions, setRouteOptions] = useState<any[] | null>(null);

  // Real-time coordinate sync
  React.useEffect(() => {
    const coords = start.split(',').map(c => parseFloat(c.trim()));
    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
       if (onUpdateStart) onUpdateStart(coords[0], coords[1]);
    }
  }, [start, onUpdateStart]);

  const handleSearchFacilities = () => {
    // Parse coordinates if possible
    const coords = start.split(',').map(c => parseFloat(c.trim()));
    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
       if (onUpdateStart) onUpdateStart(coords[0], coords[1]);
    } else {
       toast.error("Please enter valid coordinates (Lat, Lng)");
       return;
    }

    setIsSearching(true);
    // Simulate finding nearby facilities
    setTimeout(() => {
      setFacilities([
        { id: 1, label: 'Ricardo Rodriguez Hospital', dist: '3.2 km', lat: 15.0812, lng: 120.6618, type: 'Healthcare' },
        { id: 2, label: 'Sindalan Health Center', dist: '4.5 km', lat: 15.0650, lng: 120.6600, type: 'Healthcare' },
        { id: 3, label: 'Dolores Medical', dist: '6.1 km', lat: 15.0333, lng: 120.6833, type: 'Clinic' },
      ]);
      setIsSearching(false);
    }, 1000);
  };

  const selectFacility = (f: any) => {
    setSelectedFacility(f);
    // Every facility has unique routes
    const routes = [
      { id: 'opt', label: 'Main Thoroughfare', time: '14 min', traffic: 'low', color: 'bg-emerald-500', note: 'Fastest via MacArthur', active: true, offsetLat: 0, offsetLng: 0 },
      { id: 'alt', label: 'Backroad Bypass', time: '19 min', traffic: 'moderate', color: 'bg-amber-500', note: 'Avoids City Center', active: false, offsetLat: 0.005, offsetLng: -0.005 }
    ];
    setRouteOptions(routes);
    
    if (onSelectDestination) {
      onSelectDestination(f.lat, f.lng, f.label);
    }
  };

  const selectRoute = (r: any) => {
    setRouteOptions((prev: any) => 
      prev.map((opt: any) => ({ ...opt, active: opt.id === r.id }))
    );
    
    // In a real system, this would change the polyline on the map
    if (onSelectDestination && selectedFacility) {
      // Slightly offset the destination to "simualte" a different path or just re-trigger map
      onSelectDestination(selectedFacility.lat + (r.offsetLat || 0), selectedFacility.lng + (r.offsetLng || 0), selectedFacility.label);
    }
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
                className="w-full pl-14 pr-4 py-4 bg-slate-50 hover:bg-slate-100 border border-transparent rounded-[16px] text-sm font-black text-slate-700 focus:outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-500/10 transition-all font-mono"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                placeholder="Lat, Lng (e.g. 15.0286, 120.6898)"
              />
              <button 
                onClick={() => {
                   const coords = start.split(',').map(c => parseFloat(c.trim()));
                   if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                      if (onUpdateStart) onUpdateStart(coords[0], coords[1]);
                   }
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
                title="Recenter Map"
              >
                <Target className="w-4 h-4" />
              </button>
            </div>
          </div>

          <Button 
            className="w-full h-14 rounded-[16px] bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-900/15 text-sm uppercase tracking-widest font-bold text-white transition-all active:scale-[0.98]" 
            onClick={handleSearchFacilities}
            isLoading={isSearching}
          >
            Find Nearby Facilities
          </Button>
        </div>

        {/* 1. Facility Selection */}
        {facilities && !selectedFacility && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Select Destination</p>
             <div className="space-y-3">
                {facilities.map((f) => (
                  <button 
                    key={f.id}
                    onClick={() => selectFacility(f)}
                    className="w-full p-5 bg-white border border-slate-200 rounded-[24px] hover:border-blue-300 transition-all flex items-center justify-between group shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center">
                          <ShieldCheck className="w-5 h-5" />
                       </div>
                       <div className="text-left">
                          <span className="block text-sm font-black text-slate-900">{f.label}</span>
                          <span className="block text-[10px] font-bold text-slate-400 mt-0.5">{f.dist} away • {f.type}</span>
                       </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
             </div>
          </div>
        )}

        {/* 2. Available Routes for Selected Facility */}
        {selectedFacility && routeOptions && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between px-2">
               <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Available Routes To</p>
                  <h4 className="text-sm font-black text-slate-900">{selectedFacility.label}</h4>
               </div>
               <button onClick={() => setSelectedFacility(null)} className="text-[10px] font-black uppercase text-blue-600 hover:underline">Change Facility</button>
            </div>
            
            <div className="p-2 bg-blue-600/5 border border-blue-600/10 rounded-2xl flex items-center gap-3">
               <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center animate-pulse">
                  <Activity className="w-4 h-4" />
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">Live Traffic Prediction Active</span>
            </div>

            <div className="space-y-4">
              {routeOptions.map((option) => (
                <button 
                  key={option.id}
                  onClick={() => selectRoute(option)}
                  className={`w-full p-5 rounded-[24px] border-2 text-left transition-all relative overflow-hidden group hover:shadow-lg ${
                    option.active 
                      ? 'border-blue-500 bg-white shadow-xl shadow-blue-500/10' 
                      : 'border-slate-200 bg-white hover:border-blue-300'
                  }`}
                >
                {option.active && <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400 blur-[50px] opacity-10 rounded-full"></div>}
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center text-white shadow-md ${
                         option.traffic === 'low' ? 'bg-emerald-500' : option.traffic === 'moderate' ? 'bg-amber-500' : 'bg-red-500'
                      }`}>
                        <Car className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block text-sm font-black text-slate-900">{option.label}</span>
                        <span className="block text-[10px] font-bold text-slate-400 mt-0.5">{option.dist} via Expressway</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                       <span className={`block text-xl font-black ${option.active ? 'text-blue-600' : 'text-slate-700'}`}>
                         {option.time}
                       </span>
                       <span className="flex items-center justify-end gap-1 text-[10px] font-black uppercase tracking-widest mt-1">
                         <span className={`w-1.5 h-1.5 rounded-full ${option.color}`}></span>
                         {option.traffic} Traffic
                       </span>
                    </div>
                  </div>
                  
                  {option.incident ? (
                    <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-[12px] text-[10px] font-bold flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                         <TrafficCone className="w-3 h-3" />
                      </div>
                      Incident detected! Rerouting is highly suggested. 
                    </div>
                  ) : (
                    <div className={`mt-4 p-3 border rounded-[12px] text-[10px] font-bold flex items-center gap-3 ${
                    option.active ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-slate-50 border-slate-100 text-slate-500'
                  }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      option.active ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'
                    }`}>
                        <ShieldCheck className="w-3 h-3" />
                    </div>
                    <span>{option.note}</span>
                  </div>
                  )}
                </div>
              </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function ChevronRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}
