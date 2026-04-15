"use client";

import React from 'react';
import { floodHeatColors } from '../utils/MapConstants';

interface HazardLegendProps {
  isVisible: boolean;
}

export function HazardLegend({ isVisible }: HazardLegendProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute bottom-8 left-8 z-[1000] bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-slate-100 font-inter min-w-[130px] animate-in fade-in zoom-in duration-300">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Flood Tiles</h4>
        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
      </div>
      <div className="space-y-2">
        {Object.entries(floodHeatColors).map(([level, { fill, stroke }]) => (
          <div key={level} className="flex items-center gap-3">
            <div 
              className="w-6 h-6 rounded-[6px] shadow-sm border flex-shrink-0"
              style={{
                backgroundColor: fill,
                borderColor: stroke
              }}
            />
            <span 
              className="text-sm font-medium capitalize"
              style={{ color: stroke }}
            >
              {level}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
