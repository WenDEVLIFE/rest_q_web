"use client";

import React, { useState } from 'react';
import {
  Search,
  MapPin,
  Clock,
  ShieldPlus,
  Siren,
  Info,
  History,
  ChevronRight,
  ShieldAlert,
  Loader2,
  X
} from 'lucide-react';
import { getAddressSuggestions, GeocodingResult } from '../../src/service/Map_Service';

import { SidebarSearch } from './SidebarSearch';
import establishmentsData from '../../public/establishment.json';

interface RiskLevelPanelProps {
  onLocationSelect?: (lat: number, lng: number, label: string) => void;
  onReset?: () => void;
  selectedLocation?: { lat: number; lng: number; label?: string } | null;
}

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

export const RiskLevelPanel = ({ onLocationSelect, onReset, selectedLocation }: RiskLevelPanelProps) => {
  const [viewMode, setViewMode] = useState<'metrics' | 'facilities'>('metrics');

  const handleReset = () => {
    setViewMode('metrics');
    if (onReset) onReset();
  };

  let nearbyFacilities: any[] = [];
  if (selectedLocation && viewMode === 'facilities') {
    nearbyFacilities = establishmentsData.map(est => {
      const dist = calculateDistance(
        selectedLocation.lat,
        selectedLocation.lng,
        est.Latitude,
        est.Longitude
      );
      return { ...est, distance: dist };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5); // top 5 nearest
  }

  return (
    <div className="w-full bg-white/95 backdrop-blur-3xl rounded-[40px] shadow-[0_32px_80px_-15px_rgba(0,0,0,0.25)] border border-white/40 overflow-hidden flex flex-col h-[calc(100vh-160px)]">
      {/* Unified Header with Search */}
      <div className="p-8 pb-6 border-b border-slate-100/50 bg-white/50 backdrop-blur-md">
        <SidebarSearch onLocationSelect={onLocationSelect} onReset={handleReset} />

        {selectedLocation && viewMode === 'metrics' && (
          <div className="mt-8 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.25em] mb-1.5">Selected Focus</p>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight max-w-[260px]">
                {selectedLocation.label || "San Fernando City, Pampanga"}
              </h2>
            </div>
            <button
              onClick={handleReset}
              className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all active:scale-90"
              title="Clear focus"
            >
              <X className="w-5 h-5 transition-transform group-hover:rotate-90" />
            </button>
          </div>
        )}
      </div>

      {/* Main Content (Emergency Metrics or Facilities) */}
      <div className="p-8 pt-8 overflow-y-auto flex-1 custom-scrollbar">
        {!selectedLocation ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
            <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Search to view risk level</p>
              <p className="text-[10px] font-bold text-slate-300 uppercase mt-1">Real-time telemetry pending</p>
            </div>
          </div>
        ) : viewMode === 'facilities' ? (
          <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
            <div className="flex items-center gap-4 mb-8">
               <button onClick={() => setViewMode('metrics')} className="p-2 -ml-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
                  <ChevronRight className="w-5 h-5 text-slate-500 rotate-180" />
               </button>
               <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                 Nearest Facilities
               </h3>
            </div>
            
            <div className="space-y-4">
               {nearbyFacilities.map((facility, idx) => {
                 let Icon = ShieldAlert;
                 let colorClasses = "bg-amber-50 text-amber-600";
                 
                 if (facility["Establishment Type"] === "Healthcare Facility") {
                     Icon = Clock; // Actually standardizing on other icons below, let's use + / Heart equivalent. I imported ShieldPlus
                     Icon = ShieldPlus;
                     colorClasses = "bg-blue-50 text-blue-600";
                 } else if (facility["Establishment Type"] === "Emergency Service") {
                     Icon = Siren;
                     colorClasses = "bg-red-50 text-red-600";
                 }

                 return (
                   <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
                     <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center border shadow-sm border-white ${colorClasses}`}>
                        <Icon className="w-6 h-6" />
                     </div>
                     <div>
                        <h4 className="text-[14px] font-black text-slate-900 leading-tight">{facility.Name}</h4>
                        <p className="text-xs font-bold text-slate-400 uppercase mt-1 tracking-wider">{facility.distance.toFixed(2)} km away</p>
                     </div>
                   </div>
                 )
               })}
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-left-8 duration-300">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">
              Emergency Risk Level
            </h3>

            <div className="space-y-5">
              <RiskCard
                icon={<Clock className="w-8 h-8" />}
                title="Response Time"
                subtext="10 minutes"
                color="text-blue-600"
                bgColor="bg-blue-50"
                iconColor="text-blue-600"
                accentColor="border-blue-500"
              />
              <RiskCard
                icon={<ShieldPlus className="w-8 h-8" />}
                title="Risk Level"
                subtext="Moderate"
                color="text-amber-600"
                bgColor="bg-blue-50"
                iconColor="text-blue-600"
                accentColor="border-amber-500"
              />
              <RiskCard
                icon={<Siren className="w-8 h-8" />}
                title="Nearest Facilities"
                subtext="Ready for Dispatch"
                color="text-slate-900"
                bgColor="bg-white"
                iconColor="text-red-500"
                accentColor="border-red-500"
                borderedIcon
                onClick={() => setViewMode('facilities')}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface RiskCardProps {
  icon: React.ReactNode;
  title: string;
  subtext: string;
  color: string;
  bgColor: string;
  iconColor: string;
  accentColor: string;
  borderedIcon?: boolean;
  onClick?: () => void;
}

const RiskCard = ({icon, title, subtext, color, bgColor, iconColor, accentColor, borderedIcon, onClick}: RiskCardProps) => (
  <div onClick={onClick} className="group relative bg-white border border-slate-100 rounded-[28px] p-6 flex items-center justify-between shadow-sm hover:shadow-xl transition-all cursor-pointer overflow-hidden border-r-8 border-r-transparent hover:border-r-amber-400">
    <div className="flex items-center gap-6">
      <div className={`w-16 h-16 ${bgColor} ${iconColor} rounded-[20px] flex items-center justify-center shadow-sm border ${borderedIcon ? 'border-red-100' : 'border-blue-100'}`}>
        {icon}
      </div>
      <div>
        <h4 className="text-xl font-black text-slate-900 leading-tight tracking-tight">{title}</h4>
        <p className={`text-base font-black mt-1 ${color}`}>{subtext}</p>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <Info className="w-6 h-6 text-slate-200 group-hover:text-slate-400 transition-colors" />
      <div className={`w-2 h-20 rounded-full ${accentColor} absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity`} />
    </div>
  </div>
);
