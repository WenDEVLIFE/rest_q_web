"use client";

import React, { useMemo } from 'react';
import { Circle, Marker, Popup, Polyline } from 'react-leaflet';
import { ReportPinIcon, getIconForType } from '../utils/MapUtilities';
import { Loader2 } from 'lucide-react';

interface RouteLayerProps {
  routePoints: [number, number][];
  routeIsLoading: boolean;
  focusPin?: { label: string; lat: number; lng: number } | null;
  reportPin?: { lat: number; lng: number } | null;
  trafficOnRoute?: { lat: number; lng: number; status: string }[];
}

// Calculate distance between two coordinates in km
const calculateSegmentDistance = (p1: [number, number], p2: [number, number]): number => {
  const R = 6371;
  const dLat = (p2[0] - p1[0]) * Math.PI / 180;
  const dLon = (p2[1] - p1[1]) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1[0] * Math.PI / 180) * Math.cos(p2[0] * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Determine traffic status for a route segment
const getTrafficStatusForSegment = (segmentStart: [number, number], segmentEnd: [number, number], trafficOnRoute?: any[]): string => {
  if (!trafficOnRoute || trafficOnRoute.length === 0) {
    return 'unknown'; // Default fallback
  }

  // Check if any traffic points are near this segment
  const midpoint = [(segmentStart[0] + segmentEnd[0]) / 2, (segmentStart[1] + segmentEnd[1]) / 2] as [number, number];
  
  for (const trafficPoint of trafficOnRoute) {
    const dist = calculateSegmentDistance(midpoint, [trafficPoint.lat, trafficPoint.lng]);
    if (dist < 0.5) { // Within 500m
      return trafficPoint.status;
    }
  }
  
  return 'unknown';
};

// Color code for traffic
const trafficLineColors: Record<string, string> = {
  heavy: '#ef4444',      // Red
  moderate: '#f59e0b',   // Amber
  fluid: '#22c55e',      // Green
  unknown: '#059669',    // Green (default)
};

export function RouteLayer({ 
  routePoints, 
  routeIsLoading, 
  focusPin, 
  reportPin,
  trafficOnRoute 
}: RouteLayerProps) {
  // Split route into segments based on traffic
  const routeSegments = useMemo(() => {
    if (routePoints.length < 2) return [];

    const segments: Array<{ path: [number, number][], status: string }> = [];
    
    for (let i = 0; i < routePoints.length - 1; i++) {
      const status = getTrafficStatusForSegment(
        routePoints[i], 
        routePoints[i + 1], 
        trafficOnRoute
      );
      segments.push({
        path: [routePoints[i], routePoints[i + 1]],
        status
      });
    }

    return segments;
  }, [routePoints, trafficOnRoute]);

  if (routeIsLoading) {
    return (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[2000] bg-white/90 backdrop-blur-xl px-6 py-4 rounded-3xl shadow-2xl border border-primary/20 flex items-center gap-4 animate-in fade-in zoom-in duration-300">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <div className="flex flex-col">
          <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Routing Analysis</p>
          <p className="text-[10px] font-bold text-primary italic uppercase tracking-tighter">Calculating optimal road path...</p>
        </div>
      </div>
    );
  }

  if (routePoints.length === 0) {
    return null;
  }

  return (
    <>
      {/* Render route with traffic coloring */}
      {routeSegments.length > 0 ? (
        routeSegments.map((segment, idx) => (
          <Polyline
            key={`route-segment-${idx}`}
            positions={segment.path}
            pathOptions={{
              color: trafficLineColors[segment.status] || '#059669',
              weight: 6,
              opacity: 0.8,
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />
        ))
      ) : (
        // Fallback: single solid route line
        <Polyline
          positions={routePoints}
          pathOptions={{ 
            color: '#059669', 
            weight: 6, 
            opacity: 0.8,
            lineCap: 'round',
            lineJoin: 'round'
          }}
        />
      )}

      {/* Destination Marker */}
      {focusPin && (
        <>
          <Circle
            center={[focusPin.lat, focusPin.lng]}
            radius={500}
            pathOptions={{ fillColor: '#ef4444', fillOpacity: 0.1, color: '#ef4444', weight: 1, dashArray: '5, 5' }}
          />
          <Marker position={[focusPin.lat, focusPin.lng]} icon={ReportPinIcon}>
            <Popup className="font-inter">
              <div className="text-center">
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Route Destination</p>
                <p className="text-xs font-bold text-slate-700">{focusPin.label || 'Selected Location'}</p>
              </div>
            </Popup>
          </Marker>
        </>
      )}

      {/* Start Marker */}
      {(() => {
        const startPos = reportPin || { lat: 15.0286, lng: 120.6898 };
        return (
          <Marker position={[startPos.lat, startPos.lng]} icon={getIconForType("Healthcare Facility")}>
            <Popup className="font-inter">
              <div className="text-center">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Route Start</p>
                <p className="text-xs font-bold text-slate-700">{reportPin ? 'Your Location' : 'City Center'}</p>
              </div>
            </Popup>
          </Marker>
        );
      })()}
    </>
  );
}
