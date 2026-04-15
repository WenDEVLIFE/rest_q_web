"use client";

import React, { useState } from 'react';
import {
  Search,
  MapPin,
  Loader2,
  X,
  Target
} from 'lucide-react';
import { toast } from 'sonner';
import { getAddressSuggestions, getAddressFromCoordinates, GeocodingResult } from '../../src/service/Map_Service';
import { AlertDialog } from '../UI/AlertDialog';

interface SidebarSearchProps {
  onLocationSelect?: (lat: number, lng: number, label: string) => void;
  onReset?: () => void;
  initialValue?: string;
}

export const SidebarSearch = ({ onLocationSelect, onReset, initialValue }: SidebarSearchProps) => {
  const [searchQuery, setSearchQuery] = React.useState(initialValue || '');
  const [suggestions, setSuggestions] = React.useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [showOutsideAreaWarning, setShowOutsideAreaWarning] = React.useState(false);
  const [pendingOutsideLocation, setPendingOutsideLocation] = React.useState<{ lat: number; lng: number; label: string } | null>(null);

  const isWithinSanFernando = (lat: number, lng: number) => {
    const bounds = {
      minLat: 14.95,
      maxLat: 15.10,
      minLng: 120.60,
      maxLng: 120.78,
    };
    return lat >= bounds.minLat && lat <= bounds.maxLat && lng >= bounds.minLng && lng <= bounds.maxLng;
  };

  // Sync internal search state with external value Changes
  React.useEffect(() => {
    if (initialValue !== undefined) {
      setSearchQuery(initialValue);
    }
  }, [initialValue]);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.length > 2) {
      setIsSearching(true);
      const results = await getAddressSuggestions(value);
      setSuggestions(results);
      setIsSearching(false);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionSelect = (res: GeocodingResult) => {
    setSearchQuery(res.text);
    setSuggestions([]);
    if (onLocationSelect) {
      onLocationSelect(res.center[1], res.center[0], res.place_name);
    }
  };

  return (
    <div className="relative group">
      <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
          <MapPin className="w-3.5 h-3.5 text-primary" />
        </div>
      </div>
      <input
        type="text"
        placeholder="Search for an emergency focus..."
        value={searchQuery}
        onChange={handleSearchChange}
        className="w-full pl-14 pr-14 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-primary/20 transition-all shadow-sm"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSuggestions([]);
              if (onReset) onReset();
            }}
            className="p-1.5 text-slate-300 hover:text-slate-500 transition-colors"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button 
          onClick={() => {
            if ("geolocation" in navigator) {
              toast.promise(
                new Promise(async (resolve, reject) => {
                  navigator.geolocation.getCurrentPosition(
                    async (pos) => {
                      const lat = pos.coords.latitude;
                      const lng = pos.coords.longitude;
                      const resolvedAddress = await getAddressFromCoordinates(lat, lng);
                      const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
                      const locationLabel = resolvedAddress || fallback;

                      setSearchQuery(locationLabel);

                      if (!isWithinSanFernando(lat, lng)) {
                        setPendingOutsideLocation({ lat, lng, label: locationLabel });
                        setShowOutsideAreaWarning(true);
                      } else if (onLocationSelect) {
                        onLocationSelect(lat, lng, locationLabel);
                      }
                      resolve(pos);
                    },
                    (err) => reject(err)
                  );
                }),
                {
                  loading: 'Acquiring location...',
                  success: 'Location pinpointed!',
                  error: 'Permission denied or timed out.',
                }
              );
            }
          }}
          className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 hover:text-primary transition-all active:scale-95"
          title="Locate Me"
        >
          <Target className="w-4 h-4" />
        </button>
        <button className="p-2.5 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </button>
      </div>

      {/* Suggestions Dropdown */}
      {suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[100] max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          {suggestions.map((res) => (
            <button
              key={res.id}
              onClick={() => handleSuggestionSelect(res)}
              className="w-full px-5 py-4 flex items-start gap-4 hover:bg-slate-50 border-b border-slate-50 last:border-0 text-left transition-colors"
            >
              <MapPin className="w-4 h-4 text-slate-300 mt-1" />
              <div>
                <p className="text-sm font-black text-slate-900 leading-tight">{res.text}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{res.place_name}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <AlertDialog
        isOpen={showOutsideAreaWarning}
        onClose={() => {
          setShowOutsideAreaWarning(false);
          setPendingOutsideLocation(null);
        }}
        onConfirm={() => {
          if (pendingOutsideLocation && onLocationSelect) {
            onLocationSelect(pendingOutsideLocation.lat, pendingOutsideLocation.lng, pendingOutsideLocation.label);
          }
          setShowOutsideAreaWarning(false);
          setPendingOutsideLocation(null);
        }}
        title="Outside San Fernando"
        description="Your detected location is outside San Fernando coverage. Routing and ML predictions may be less accurate. Continue anyway?"
        confirmLabel="Continue"
        cancelLabel="Cancel"
        variant="warning"
      />
    </div>
  );

};
