"use client";

import React, { useState } from 'react';
import { 
  Hospital, 
  MapPin, 
  X, 
  Search, 
  Shield, 
  Phone,
  Clock,
  Navigation,
  Activity
} from 'lucide-react';
import { Button } from '../UI/Button';
import establishmentsData from '../../public/establishment.json';

interface FacilityLocatorProps {
  onClose: () => void;
  onLocationSelect?: (lat: number, lng: number) => void;
}

export const FacilityLocator = ({ onClose, onLocationSelect }: FacilityLocatorProps) => {
  const [searchTerm, setSearchQuery] = useState('');
  
  // Transform JSON data into UI-friendly structure
  const facilities = establishmentsData.map((est, index) => {
    let color = 'bg-primary';
    let status = 'Available';
    let icon = <Shield className="w-6 h-6" />;
    
    if (est["Establishment Type"] === "Healthcare Facility") {
      color = 'bg-rose-500';
      icon = <Activity className="w-6 h-6" />;
      status = index % 3 === 0 ? 'Heavy Volume' : 'Available';
    } else if (est["Establishment Type"] === "Emergency Service") {
      color = 'bg-red-500';
      icon = <Hospital className="w-6 h-6" />;
      status = 'Ready';
    } else if (est["Establishment Type"] === "Government Office") {
      color = 'bg-blue-600';
      icon = <Shield className="w-6 h-6" />;
      status = 'On Alert';
    }

    return {
      id: index,
      name: est.Name,
      type: est["Establishment Type"],
      lat: est.Latitude,
      lng: est.Longitude,
      dist: (Math.random() * 5 + 0.5).toFixed(1) + ' km', // Simulated distance
      status,
      color,
      icon
    };
  });

  const filtered = facilities.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="w-full h-full flex flex-col font-inter">
      {/* Header */}
      <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md">
            <Hospital className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <h3 className="font-black text-lg tracking-tight text-slate-900">Emergency Facilities</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nearest Response Units</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 flex-1 flex flex-col overflow-hidden">
        <div className="relative group mb-6 shrink-0">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-rose-500 transition-colors" />
          <input 
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:border-rose-100 focus:ring-8 focus:ring-rose-50/50 transition-all shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search hospitals, services..."
          />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center justify-between mb-3 shrink-0">
            Nearby Results <span>{filtered.length} Found</span>
          </h4>

          <div className="space-y-3 overflow-y-auto pr-2 pb-4 flex-1">
            {filtered.map((f) => (
              <div 
                key={f.id} 
                onClick={() => onLocationSelect?.(f.lat, f.lng)}
                className="group p-4 bg-white border border-slate-100 rounded-2xl hover:border-rose-200 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center text-white ${f.color} shadow-lg shadow-rose-500/10`}>
                      {f.icon}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 group-hover:text-rose-600 transition-colors">{f.name}</p>
                      <div className="flex items-center gap-2 mt-1 whitespace-nowrap">
                        <MapPin className="w-3 h-3 text-slate-300 shrink-0" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase truncate max-w-[120px]">{f.type}</span>
                        <span className="text-[10px] font-bold text-slate-300">• {f.dist}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter whitespace-nowrap ${
                      f.status === 'Heavy Volume' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      {f.status}
                    </span>
                    <p className="flex items-center justify-end gap-1 mt-2 text-[10px] font-bold text-slate-300">
                      <Clock className="w-3 h-3" /> ETA 4 Min
                    </p>
                  </div>
                </div>

                {/* Card Actions shown on hover */}
                <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
                    <Navigation className="w-3 h-3" /> Directions
                  </button>
                  <button className="flex-1 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-rose-100 transition-all">
                    <Phone className="w-3 h-3" /> Call
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
