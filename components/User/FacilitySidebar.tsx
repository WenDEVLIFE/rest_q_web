"use client";

import React, { useMemo } from 'react';
import {
  ChevronLeft,
  Hospital,
  Siren,
  ShieldPlus,
  Search,
  MapPin,
  Phone
} from 'lucide-react';
import { SidebarSearch } from './SidebarSearch';
import establishmentsData from '../../public/establishment.json';

interface FacilitySidebarProps {
  onClose: () => void;
  selectedLocation: { lat: number; lng: number; label?: string } | null;
  onLocationSelect: (lat: number, lng: number, label: string) => void;
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

export const FacilitySidebar = ({ onClose, selectedLocation, onLocationSelect }: FacilitySidebarProps) => {
  const nearbyFacilities = useMemo(() => {
    if (!selectedLocation) return [];

    return (establishmentsData as any[])
      .map((est) => ({
        ...est,
        distance: calculateDistance(
          selectedLocation.lat,
          selectedLocation.lng,
          est.Latitude,
          est.Longitude
        ),
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [selectedLocation]);

  return (
    <div className="flex flex-col h-full bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-left-8 duration-500">
      {/* Search Header */}
      <div className="p-8 pb-4 bg-white/50 backdrop-blur-md border-b border-slate-50">
        <SidebarSearch onLocationSelect={onLocationSelect} onReset={onClose} />
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
        {/* Title and Back Button */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onClose}
            className="p-3 bg-slate-50 text-slate-500 rounded-2xl hover:bg-primary hover:text-white transition-all active:scale-90"
            title="Back to Home"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Nearest Facilities
          </h2>
        </div>

        {/* Facility List */}
        {!selectedLocation ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
            <Search className="w-12 h-12 mb-4 text-slate-300" />
            <p className="text-sm font-black uppercase tracking-widest text-slate-400">Search to view facilities</p>
          </div>
        ) : (
          <div className="space-y-4">
            {nearbyFacilities.map((facility, idx) => (
              <div
                key={idx}
                className="group p-5 bg-white border border-slate-100 rounded-[32px] shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer active:scale-[0.98]"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${facility["Establishment Type"] === 'Healthcare Facility' ? 'bg-rose-50 text-rose-500 group-hover:bg-rose-500 group-hover:text-white' :
                        facility["Establishment Type"] === 'Emergency Service' ? 'bg-red-50 text-red-500 group-hover:bg-red-500 group-hover:text-white' :
                          'bg-blue-50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white'
                      }`}>
                      {facility["Establishment Type"] === 'Healthcare Facility' ? <Hospital className="w-6 h-6" /> :
                        facility["Establishment Type"] === 'Emergency Service' ? <Siren className="w-6 h-6" /> :
                          <ShieldPlus className="w-6 h-6" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 leading-tight group-hover:text-primary transition-colors">{facility.Name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{facility["Establishment Type"]}</p>
                      {facility.Phone && (
                        <a 
                          href={`tel:${facility.Phone.split('/')[0].replace(/[^\d+]/g, '')}`}
                          className="text-[11px] font-bold text-slate-500 mt-2 flex items-center gap-1.5 hover:text-primary transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary" />
                          {facility.Phone}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-emerald-600 tracking-tighter">{facility.distance.toFixed(2)} km</p>
                    <p className="text-[9px] font-bold text-slate-300 uppercase mt-1 italic tracking-tight">Active Path</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Synchronized Status */}
      {selectedLocation && (
        <div className="p-6 bg-emerald-50 border-t border-emerald-100">
          <div className="flex items-center justify-center gap-2 text-emerald-600">
            <MapPin className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest italic">Live GIS Context Synchronized</span>
          </div>
        </div>
      )}
    </div>
  );
};
