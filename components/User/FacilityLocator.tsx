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
  Activity,
  ChevronRight
} from 'lucide-react';
import { Button } from '../UI/Button';

interface FacilityLocatorProps {
  onClose: () => void;
}

export const FacilityLocator = ({ onClose }: FacilityLocatorProps) => {
  const [searchTerm, setSearchQuery] = useState('');
  
  const facilities = [
    { id: 1, name: 'Manila Doctors Hospital', type: 'Medical', dist: '0.8 km', status: 'Available', color: 'bg-rose-500' },
    { id: 2, name: 'Fire Station Ermita', type: 'Fire', dist: '1.2 km', status: 'Ready', color: 'bg-red-500' },
    { id: 3, name: 'Western Police District', type: 'Law Enforcement', dist: '1.5 km', status: 'On Alert', color: 'bg-primary' },
    { id: 4, name: 'PGH Emergency', type: 'Trauma Center', dist: '2.3 km', status: 'Heavy Volume', color: 'bg-amber-500' },
  ];

  const filtered = facilities.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-500 font-inter">
      {/* Header */}
      <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
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

      <div className="p-6">
        <div className="relative group mb-6">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-rose-500 transition-colors" />
          <input 
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:border-rose-100 focus:ring-8 focus:ring-rose-50/50 transition-all shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search hospitals, services..."
          />
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center justify-between">
            Nearby Results <span>4 Active</span>
          </h4>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {filtered.map((f) => (
              <div 
                key={f.id} 
                className="group p-4 bg-white border border-slate-100 rounded-2xl hover:border-rose-200 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${f.color} shadow-lg shadow-rose-500/10`}>
                      {f.type === 'Medical' || f.type === 'Trauma Center' ? <Activity className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 group-hover:text-rose-600 transition-colors">{f.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="w-3 h-3 text-slate-300" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{f.type} • {f.dist} away</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${
                      f.status === 'Heavy Volume' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      {f.status}
                    </span>
                    <p className="flex items-center justify-end gap-1 mt-2 text-[10px] font-bold text-slate-300">
                      <Clock className="w-3 h-3" /> ETA 4 Min
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
                    <Navigation className="w-3 h-3" /> Get Directions
                  </button>
                  <button className="flex-1 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-rose-100 transition-all">
                    <Phone className="w-3 h-3" /> Call Emergency
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
