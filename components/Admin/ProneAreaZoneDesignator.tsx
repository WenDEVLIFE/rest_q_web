"use client";

import React, { useState, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { 
  X, 
  CheckCircle2,
  Info,
  Loader2
} from 'lucide-react';
import { Button } from '../UI/Button';

// Dynamically import the map to avoid SSR issues
const ZoneDrawerMap = dynamic(
  () => import('./ZoneDrawerMap').then(mod => mod.ZoneDrawerMap),
  { ssr: false, loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-100">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  )}
);

interface ProneAreaZoneDesignatorProps {
  initialLat?: number;
  initialLng?: number;
  initialRadius?: number;
  onZoneDesignated: (lat: number, lng: number, radius: number) => void;
  onClose: () => void;
  category: 'Fire' | 'Flood' | 'Accident' | 'Other';
}

interface ProneAreaZoneDesignatorProps {
  initialLat?: number;
  initialLng?: number;
  initialRadius?: number;
  onZoneDesignated: (lat: number, lng: number, radius: number) => void;
  onClose: () => void;
  category: 'Fire' | 'Flood' | 'Accident' | 'Other';
}

export const ProneAreaZoneDesignator = ({
  initialLat = 15.0286,
  initialLng = 120.6898,
  initialRadius = 500,
  onZoneDesignated,
  onClose,
  category
}: ProneAreaZoneDesignatorProps) => {
  const [center, setCenter] = useState<[number, number]>([initialLat, initialLng]);
  const [radius, setRadius] = useState(initialRadius);
  const [manualLat, setManualLat] = useState(initialLat.toString());
  const [manualLng, setManualLng] = useState(initialLng.toString());
  const [manualRadius, setManualRadius] = useState(initialRadius.toString());

  const handleZoneUpdate = useCallback((lat: number, lng: number, r: number) => {
    setRadius(r);
    setManualLat(lat.toFixed(4));
    setManualLng(lng.toFixed(4));
    setManualRadius(Math.round(r).toString());
  }, []);

  const handleCenterUpdate = useCallback((newCenter: [number, number]) => {
    setCenter(newCenter);
    setManualLat(newCenter[0].toFixed(4));
    setManualLng(newCenter[1].toFixed(4));
  }, []);

  const handleConfirm = () => {
    onZoneDesignated(center[0], center[1], Math.round(radius));
  };

  const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
    'Fire': { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
    'Flood': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    'Accident': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
    'Other': { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' }
  };

  const colors = categoryColors[category] || categoryColors['Other'];

  return (
    <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col border border-slate-100 animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div>
            <h3 className="text-lg font-black text-slate-900">Design Prone Area Zone</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-1">Category: {category}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Instructions */}
        <div className={`px-6 py-4 ${colors.bg} border-b ${colors.border} flex items-start gap-3`}>
          <Info className={`w-4 h-4 ${colors.text} shrink-0 mt-0.5`} />
          <div className="text-[10px] font-bold leading-relaxed">
            <p className={colors.text}>1. Click on the map to place the zone center</p>
            <p className={colors.text}>2. Drag to adjust the radius (shown as a circle)</p>
            <p className={colors.text}>3. Use manual inputs below for precise values</p>
            <p className={colors.text}>4. Click "Confirm Zone" when ready</p>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 overflow-hidden">
          <Suspense fallback={
            <div className="h-full w-full flex items-center justify-center bg-slate-100">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          }>
            <ZoneDrawerMap
              initialCenter={center}
              initialRadius={radius}
              category={category}
              onZoneUpdate={handleZoneUpdate}
              onCenterUpdate={handleCenterUpdate}
            />
          </Suspense>
        </div>

        {/* Manual Controls Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-2">
                Latitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={manualLat}
                onChange={(e) => {
                  const lat = parseFloat(e.target.value);
                  if (!isNaN(lat)) {
                    setManualLat(e.target.value);
                    handleZoneUpdate(lat, center[1], radius);
                  }
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-2">
                Longitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={manualLng}
                onChange={(e) => {
                  const lng = parseFloat(e.target.value);
                  if (!isNaN(lng)) {
                    setManualLng(e.target.value);
                    handleZoneUpdate(center[0], lng, radius);
                  }
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-2">
                Radius (m)
              </label>
              <input
                type="number"
                step="50"
                value={manualRadius}
                onChange={(e) => {
                  const r = parseInt(e.target.value);
                  if (!isNaN(r)) {
                    setManualRadius(e.target.value);
                    setRadius(r);
                  }
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono text-sm"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 h-11 rounded-lg border-slate-200 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 h-11 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm Zone
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
