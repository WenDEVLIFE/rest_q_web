"use client";

import React from 'react';
import { Polyline, Popup } from 'react-leaflet';
import { trafficColors } from '../utils/MapConstants';

interface TrafficSegment {
  name: string;
  path: [number, number][];
  status: string;
}

interface TrafficOverlayProps {
  trafficSegments: TrafficSegment[];
}

export function TrafficOverlay({ trafficSegments }: TrafficOverlayProps) {
  return (
    <>
      {trafficSegments.map((road, i) => (
        <React.Fragment key={`traffic-${i}`}>
          {/* Background layer for depth */}
          <Polyline
            positions={road.path}
            pathOptions={{
              color: trafficColors[road.status] || '#22c55e',
              weight: 8,
              opacity: 0.15,
            }}
          />
          
          {/* Main traffic line */}
          <Polyline
            positions={road.path}
            pathOptions={{
              color: trafficColors[road.status] || '#22c55e',
              weight: 4,
              opacity: 0.8,
              lineCap: 'round',
              dashArray: road.status === 'heavy' ? '1, 15' : '0'
            }}
          >
            <Popup>
              <div className="font-inter">
                <p className="text-[10px] font-black uppercase text-slate-400">Road Telemetry</p>
                <p className="text-xs font-bold text-slate-900">{road.name}</p>
                <p className={`text-[11px] font-black uppercase mt-1 ${road.status === 'heavy' ? 'text-red-600' :
                  road.status === 'moderate' ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                  Status: {road.status || 'fluid'}
                </p>
              </div>
            </Popup>
          </Polyline>
        </React.Fragment>
      ))}
    </>
  );
}
