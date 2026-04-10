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
  Hospital
} from 'lucide-react';
import { useAuth } from '../../src/context/AuthContext';
import { Button } from '../UI/Button';

interface HomeCardProps {
  onActionSelect: (action: 'report' | 'route' | 'facilities' | 'history' | 'flood' | 'typhoon') => void;
  isSidebar?: boolean;
}

export const HomeCard = ({ onActionSelect, isSidebar }: HomeCardProps) => {
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

        <div className="flex items-center justify-center p-4 bg-primary/5 rounded-2xl mx-8 mb-4 border border-primary/10">
           <ShieldAlert className="w-4 h-4 text-primary mr-2" />
           <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Select an action to begin</p>
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
            onClick={() => onActionSelect('flood')}
          />
          <ActionButton
            icon={<Wind className="w-6 h-6" />}
            label="Typhoon"
            color="bg-indigo-500 text-white"
            onClick={() => onActionSelect('typhoon')}
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
      <div className="bg-slate-50/80 p-6 flex-1 flex flex-col gap-3 border-t border-slate-100 overflow-y-auto min-h-0">
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
