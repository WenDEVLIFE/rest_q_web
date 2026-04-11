"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import {
  History,
  ChevronRight,
  ShieldAlert,
  CloudRain,
  Wind,
  Navigation,
  AlertTriangle,
  Hospital,
  Lock,
  CheckCircle2,
  Activity,
  Search as SearchIcon
} from 'lucide-react';
import { useAuth } from '../../src/context/AuthContext';
import { Button } from '../UI/Button';
import { SidebarSearch } from './SidebarSearch';

interface HomeCardProps {
  onActionSelect: (action: 'report' | 'route' | 'facilities' | 'history' | 'flood' | 'typhoon') => void;
  onLocationSelect?: (lat: number, lng: number, label: string) => void;
  isSidebar?: boolean;
  hasLocation?: boolean;
  onEmergencyMap?: () => void;
  focusPinLabel?: string;
}

export const HomeCard = ({ onActionSelect, onLocationSelect, isSidebar, hasLocation, onEmergencyMap, focusPinLabel }: HomeCardProps) => {
  const { profile, loading } = useAuth();

  return (
    <div className={`w-full ${isSidebar ? 'h-full flex flex-col bg-white overflow-hidden' : 'max-w-md bg-white/90 backdrop-blur-xl rounded-[32px] shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-500'} font-inter`}>
      {/* Header Info */}
      <div className="p-8 text-center pb-6">
          <center>
            <Image
                        src="/logo.png"
                        alt="Res-Q Logo"
                        width={200}
                        height={200}
                        className="object-contain"
                        priority
                      />  
          </center>
       <p className="text-sm font-bold text-slate-500 leading-relaxed max-w-[280px] mx-auto">
         Predicts emergency response time and recommends optimal route based on real-world conditions.
        </p>
      </div>

        <div className="px-8 mb-8">
          <SidebarSearch onLocationSelect={onLocationSelect} initialValue={focusPinLabel} />
        </div>

        <div className={`flex items-center justify-center p-4 rounded-2xl mx-8 mb-6 border transition-all duration-500 ${hasLocation ? 'bg-emerald-50 border-emerald-100' : 'bg-primary/5 border-primary/10'}`}>
           {hasLocation ? (
             <>
               <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2 animate-in zoom-in duration-300" />
               <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Location Synchronized</p>
             </>
           ) : (
             <>
               <Lock className="w-4 h-4 text-primary mr-2" />
               <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Enter address to unlock features</p>
             </>
           )}
        </div>

      {/* Beta Notice */}
      <div className={`px-8 mb-6 transition-all duration-500 ${!hasLocation ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
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
            onClick={() => onActionSelect('flood')}
            disabled={!hasLocation}
          />
          <ActionButton
            icon={<Wind className="w-6 h-6" />}
            label="Typhoon"
            color="bg-indigo-500 text-white"
            onClick={() => onActionSelect('typhoon')}
            disabled={!hasLocation}
          />
          <ActionButton
            icon={<Navigation className="w-6 h-6" />}
            label="Safe Route"
            color="bg-emerald-500 text-white"
            onClick={() => onActionSelect('route')}
            disabled={!hasLocation}
          />
          <ActionButton
            icon={<AlertTriangle className="w-6 h-6" />}
            label="Report"
            color="bg-red-500 text-white"
            onClick={() => onActionSelect('report')}
            disabled={!hasLocation}
          />
        </div>
      </div>

      {/* Bottom Footer Action */}
      <div className="bg-slate-50/80 p-6 flex-1 flex flex-col gap-3 border-t border-slate-100 overflow-y-auto min-h-0">
        <button
          onClick={onEmergencyMap}
          className="group flex items-center justify-between w-full p-4 bg-primary text-white rounded-2xl hover:bg-sky-700 transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-black uppercase tracking-wider">Emergency Map Explorer</p>
              <p className="text-[10px] font-bold opacity-70 uppercase tracking-tighter italic">Live Hazard Telemetry</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-all" />
        </button>

        <button
          onClick={() => onActionSelect('facilities')}
          disabled={!hasLocation}
          className={`group flex items-center justify-between w-full p-4 border rounded-2xl transition-all shadow-sm active:scale-[0.98] ${
            !hasLocation 
              ? 'bg-slate-50 border-slate-100 cursor-not-allowed grayscale opacity-60' 
              : 'bg-white border-slate-200 hover:border-primary/30'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              !hasLocation ? 'bg-slate-200 text-slate-400' : 'bg-rose-50 text-rose-500 group-hover:bg-rose-500 group-hover:text-white'
            }`}>
              <Hospital className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className={`text-sm font-black transition-colors ${!hasLocation ? 'text-slate-400' : 'text-slate-900 group-hover:text-primary'}`}>Nearest Facilities</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Hospitals, Fire, Police</p>
            </div>
          </div>
          <ChevronRight className={`w-5 h-5 transition-all ${!hasLocation ? 'text-slate-200' : 'text-slate-300 group-hover:text-primary group-hover:translate-x-1'}`} />
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
  disabled?: boolean;
}

function ActionButton({ icon, label, color, onClick, disabled }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-2 group ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all ${disabled ? '' : 'group-hover:scale-110 active:scale-90'} ${color}`}>
        {icon}
      </div>
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter group-hover:text-slate-900 transition-colors">
        {label}
      </span>
    </button>
  );
}
