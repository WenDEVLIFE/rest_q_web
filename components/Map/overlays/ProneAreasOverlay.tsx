"use client";

import React from 'react';
import { Circle, Marker, Popup } from 'react-leaflet';
import { ProneArea } from '../../../src/types/prone_area';
import { Zap } from 'lucide-react';
import { getCategoryIcon } from '../utils/MapUtilities';

interface ProneAreasOverlayProps {
  liveProneAreas: ProneArea[];
  onShowXai: (context: 'prone_area', data: any) => void;
}

export function ProneAreasOverlay({ liveProneAreas, onShowXai }: ProneAreasOverlayProps) {
  return (
    <>
      {liveProneAreas.map((area) => (
        <React.Fragment key={area.id}>
          <Circle
            center={[area.lat, area.lng]}
            radius={area.radius}
            pathOptions={{
              fillColor: area.status === 'Unfixed' ?
                (area.category === 'Fire' ? '#ef4444' : area.category === 'Flood' ? '#2563eb' : '#f59e0b')
                : '#059669',
              fillOpacity: 0.25,
              color: area.status === 'Unfixed' ? '#dc2626' : '#059669',
              weight: 3,
              dashArray: area.status === 'Unfixed' ? '10, 10' : '0'
            }}
          >
            <Popup className="font-inter">
              <div className="min-w-[220px]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${area.status === 'Unfixed' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{area.category} Zone</span>
                  </div>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${area.status === 'Unfixed' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                    {area.status}
                  </span>
                </div>
                <h4 className="text-sm font-black text-slate-900 mb-1">{area.name}</h4>
                <p className="text-[10px] font-bold text-slate-500 leading-relaxed italic border-l-2 border-slate-200 pl-2 py-1 bg-slate-50">
                  "{area.notes}"
                </p>
                <button 
                  onClick={() => onShowXai('prone_area', area)}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/10"
                >
                   <Zap className="w-3 h-3 text-amber-300" />
                   View Proof (ML Logic)
                </button>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-400">REF: {area.id?.substring(0, 8)}</span>
                  <span className="text-[9px] font-bold text-slate-400">
                    {area.updatedAt instanceof Date ? area.updatedAt.toLocaleDateString() : area.updatedAt && 'seconds' in area.updatedAt ? new Date(area.updatedAt.seconds * 1000).toLocaleDateString() : ''}
                  </span>
                </div>
              </div>
            </Popup>
          </Circle>

          {/* Category Icon at Center */}
          <Marker
            position={[area.lat, area.lng]}
            icon={getCategoryIcon(area.category)}
          />
        </React.Fragment>
      ))}
    </>
  );
}
