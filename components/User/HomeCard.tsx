"use client";

import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Navigation, 
  AlertTriangle, 
  Hospital, 
  CloudRain,
  Wind,
  History,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../src/context/AuthContext';
import { Button } from '../UI/Button';

interface HomeCardProps {
  onActionSelect: (action: 'report' | 'route' | 'facilities' | 'history') => void;
}

export const HomeCard = ({ onActionSelect }: HomeCardProps) => {
  const { profile, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-[32px] shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-500 font-inter">
      {/* Header Info */}
      <div className="p-8 text-center pb-6">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2 italic">Res-Q Pulse</h2>
        <p className="text-sm font-bold text-slate-500 leading-relaxed max-w-[280px] mx-auto">
          Monitor life-critical hazards and coordinate emergency response routes.
        </p>
      </div>

      {/* Main Search */}
      <div className="px-8 pb-8">
        <div className="relative group">
          <MapPin className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-primary group-focus-within:scale-110 transition-transform" />
          <input 
            type="text" 
            placeholder="Enter location to assess risk..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-4 bg-slate-50/50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-primary/20 focus:ring-8 focus:ring-primary/5 transition-all shadow-inner"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Beta Notice */}
      <div className="px-8 mb-6">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="h-px flex-1 bg-slate-100" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
            Real-time Telemetry Analytics
          </span>
          <div className="h-px flex-1 bg-slate-100" />
        </div>

        {/* Quick Action Icons */}
        <div className="grid grid-cols-4 gap-4 mb-2">
          <ActionButton 
            icon={<CloudRain className="w-6 h-6" />} 
            label="Flood Risk" 
            color="bg-sky-500 text-white"
          />
          <ActionButton 
            icon={<Wind className="w-6 h-6" />} 
            label="Typhoon" 
            color="bg-indigo-500 text-white"
          />
          <ActionButton 
            icon={<Navigation className="w-6 h-6" />} 
            label="Safe Route" 
            color="bg-emerald-500 text-white"
            onClick={() => onActionSelect('route')}
          />
          <ActionButton 
            icon={<AlertTriangle className="w-6 h-6" />} 
            label="Report" 
            color="bg-red-500 text-white"
            onClick={() => onActionSelect('report')}
          />
        </div>
      </div>

      {/* Bottom Footer Action */}
      <div className="bg-slate-50/80 p-6 flex flex-col gap-3 border-t border-slate-100">
        <button 
          onClick={() => onActionSelect('facilities')}
          className="group flex items-center justify-between w-full p-4 bg-white border border-slate-200 rounded-2xl hover:border-primary/30 transition-all shadow-sm active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors">
              <Hospital className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-black text-slate-900 group-hover:text-primary transition-colors">Nearest Facilities</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Hospitals, Fire, Police</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </button>

        {profile && (
          <button 
            onClick={() => onActionSelect('history')}
            className="group flex items-center justify-between w-full p-4 bg-white border border-slate-200 rounded-2xl hover:border-primary/30 transition-all shadow-sm active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <History className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-black text-slate-900 group-hover:text-primary transition-colors">Incident History</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Your previous reports</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </button>
        )}
      </div>
    </div>
  );
};

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick?: () => void;
}

function ActionButton({ icon, label, color, onClick }: ActionButtonProps) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center gap-2 group"
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all group-hover:scale-110 active:scale-90 ${color}`}>
        {icon}
      </div>
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter group-hover:text-slate-900 transition-colors">
        {label}
      </span>
    </button>
  );
}
