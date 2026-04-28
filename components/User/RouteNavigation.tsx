"use client";

import React, { useState } from 'react';
import { 
  Navigation, 
  MapPin, 
  X, 
  ArrowRight, 
  Clock, 
  AlertCircle,
  Activity,
  TrafficCone,
  Car,
  ShieldCheck,
  CheckCircle2,
  Target,
  Zap
} from 'lucide-react';
import { Button } from '../UI/Button';
import { MLBadge } from '../UI/MLBadge';
import { toast } from 'sonner';
import { useFacilities } from '../../src/hooks/useFacilities';
import { TrafficService } from '../../src/service/Traffic_Service';
import { AdminHandler } from '../../src/agents/AdminDashboardAgent/AdminHandler';
import { getAddressFromCoordinates } from '../../src/service/Map_Service';
import { RouteOptionEtaService } from '../../src/service/RouteOptionEtaService';

interface RouteNavigationProps {
  onClose: () => void;
  onSelectDestination?: (lat: number, lng: number, label: string) => void;
  onUpdateStart?: (lat: number, lng: number) => void;
  onUpdateEnd?: (lat: number, lng: number) => void;
  reportPin?: { lat: number, lng: number } | null;
  onShowXai?: (data: any) => void;
}

interface RouteOption {
  id: string;
  label: string;
  time: string;
  etaMinutes: number;
  traffic: 'low' | 'moderate' | 'heavy';
  color: string;
  note: string;
  active: boolean;
  offsetLat: number;
  offsetLng: number;
  distKm: number;
  confidence: number;
  incident?: boolean;
}

export const RouteNavigation = ({ onClose, onSelectDestination, onUpdateStart, onUpdateEnd, reportPin, onShowXai }: RouteNavigationProps) => {
  const { facilities } = useFacilities();
  const [start, setStart] = useState(
    reportPin ? `${reportPin.lat.toFixed(4)}, ${reportPin.lng.toFixed(4)}` : '15.0286, 120.6898'
  );
  const [startAddress, setStartAddress] = useState('');
  const [end, setEnd] = useState('');
  const [endAddress, setEndAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundFacilities, setFoundFacilities] = useState<any[] | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<any | null>(null);
  const [routeOptions, setRouteOptions] = useState<RouteOption[] | null>(null);

  const parseCoordinates = (value: string): [number, number] | null => {
    const coords = value.split(',').map((c) => Number.parseFloat(c.trim()));
    if (coords.length !== 2 || Number.isNaN(coords[0]) || Number.isNaN(coords[1])) {
      return null;
    }
    return [coords[0], coords[1]];
  };

  // Haversine distance formula (km)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Real-time coordinate sync
  React.useEffect(() => {
    let cancelled = false;
    const coords = parseCoordinates(start);
    if (!coords) return;

    if (onUpdateStart) onUpdateStart(coords[0], coords[1]);

    (async () => {
      const label = await getAddressFromCoordinates(coords[0], coords[1]);
      if (cancelled) return;
      setStartAddress(label || `Current location (${coords[0].toFixed(4)}, ${coords[1].toFixed(4)})`);
    })();

    return () => {
      cancelled = true;
    };
  }, [start, onUpdateStart]);

  // Real-time end coordinate sync
  React.useEffect(() => {
    let cancelled = false;
    const coords = parseCoordinates(end);
    if (!coords) return;

    if (onUpdateEnd) onUpdateEnd(coords[0], coords[1]);

    (async () => {
      const label = await getAddressFromCoordinates(coords[0], coords[1]);
      if (cancelled) return;
      setEndAddress(label || `Selected destination (${coords[0].toFixed(4)}, ${coords[1].toFixed(4)})`);
    })();

    return () => {
      cancelled = true;
    };
  }, [end, onUpdateEnd]);

  // Sync if reportPin changes externally (e.g. Map click)
  React.useEffect(() => {
    if (reportPin) {
      setStart(`${reportPin.lat.toFixed(4)}, ${reportPin.lng.toFixed(4)}`);
      setStartAddress('Current Location');
    }
  }, [reportPin]);

  // San Fernando bounds (approximate)
  const isWithinSanFernando = (lat: number, lng: number) => {
    const bounds = {
      minLat: 14.95,
      maxLat: 15.10,
      minLng: 120.55,
      maxLng: 120.75
    };
    return lat >= bounds.minLat && lat <= bounds.maxLat && 
           lng >= bounds.minLng && lng <= bounds.maxLng;
  };

  const handleSearchFacilities = () => {
    // Parse coordinates
    const coords = start.split(',').map(c => parseFloat(c.trim()));
    if (coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) {
       toast.error("Please enter valid coordinates (Lat, Lng)");
       return;
    }

    const [userLat, userLng] = coords;
    
    // Validate location
    if (!isWithinSanFernando(userLat, userLng)) {
      toast.warning("⚠️ You are outside San Fernando service area. Emergency response metrics may be limited.");
    }

    setIsSearching(true);
    setSelectedFacility(null);
    setRouteOptions(null);

    // Simulate brief loading to feel responsive
    setTimeout(() => {
      // Filter to facilities with valid coordinates
      const validFacilities = facilities.filter(f => f.Latitude && f.Longitude);

      if (validFacilities.length === 0) {
        toast.error("No valid facilities found in database");
        setIsSearching(false);
        return;
      }

      // Calculate distances and sort
      const withDistances = validFacilities.map(f => {
        const dist = calculateDistance(userLat, userLng, f.Latitude, f.Longitude);
        return {
          id: f.id || f.Name,
          label: f.Name,
          lat: f.Latitude,
          lng: f.Longitude,
          type: f["Establishment Type"],
          distKm: dist,
          dist: `${dist.toFixed(1)} km`
        };
      }).sort((a, b) => a.distKm - b.distKm)
        .slice(0, 10); // Top 10 nearest

      setFoundFacilities(withDistances);
      setIsSearching(false);

      if (onUpdateStart) {
        onUpdateStart(userLat, userLng);
      }
    }, 500);
  };

  const selectFacility = async (f: any) => {
    setSelectedFacility(f);
    setEnd(`${f.lat.toFixed(4)}, ${f.lng.toFixed(4)}`);
    setEndAddress(f.label);

    try {
      const [incidents, typhoonRes] = await Promise.all([
        AdminHandler.getIncidents(),
        fetch('/api/typhoon').then(r => r.json()).catch(() => null),
      ]);

      const weather: 'clear' | 'rainy' | 'typhoon' = typhoonRes?.success && typhoonRes?.data ? 'typhoon' : 'clear';
      const liveTraffic = await TrafficService.getLiveTraffic(incidents || [], weather);

      // Calculate route ETA estimates
      const tsreMain = TrafficService.calculateRouteEta(f.distKm, liveTraffic, false, false);
      const tsreAlt = TrafficService.calculateRouteEta(f.distKm * 1.15, liveTraffic, false, false);

      const dominantStatus: 'low' | 'moderate' | 'heavy' = liveTraffic.some(t => t.status === 'heavy')
        ? 'heavy'
        : liveTraffic.some(t => t.status === 'moderate')
          ? 'moderate'
          : 'low';
      
      const routes: RouteOption[] = [
        { 
          id: 'opt', 
          label: 'Main Thoroughfare', 
          time: `${tsreMain.estimatedMinutes} min`, 
          etaMinutes: tsreMain.estimatedMinutes,
          traffic: dominantStatus,
          color: 'bg-emerald-500', 
          note: 'Fastest via main roads', 
          active: true, 
          offsetLat: 0, 
          offsetLng: 0,
          distKm: f.distKm,
          confidence: tsreMain.confidence
        },
        { 
          id: 'alt', 
          label: 'Backroad Bypass', 
          time: `${tsreAlt.estimatedMinutes} min`, 
          etaMinutes: tsreAlt.estimatedMinutes,
          traffic: dominantStatus === 'heavy' ? 'heavy' : 'moderate',
          color: 'bg-amber-500', 
          note: 'Avoids congestion zones', 
          active: false, 
          offsetLat: 0.005, 
          offsetLng: -0.005,
          distKm: f.distKm * 1.15,
          confidence: tsreAlt.confidence
        }
      ];
      setRouteOptions(routes);
    } catch (error) {
      console.error('Live route estimation failed:', error);
      toast.error('Failed to compute live route telemetry');
    }
    
    if (onSelectDestination) {
      onSelectDestination(f.lat, f.lng, `${f.label} [traffic:moderate]`);
    }
  };

  const selectRoute = (r: RouteOption) => {
    setRouteOptions((prev: RouteOption[] | null) => 
      (prev || []).map((opt: RouteOption) => ({
        ...opt,
        active: opt.id === r.id
      }))
    );
    
    // Trigger map update with the selected route
    if (onSelectDestination && selectedFacility) {
      onSelectDestination(
        selectedFacility.lat + (r.offsetLat || 0),
        selectedFacility.lng + (r.offsetLng || 0),
        `${selectedFacility.label} [traffic:${r.traffic}]`
      );
    }
  };

  const calculateLiveRouteTime = (route: RouteOption): number => {
    if (!selectedFacility) return route.etaMinutes;

    return RouteOptionEtaService.estimate({
      distKm: route.distKm,
      traffic: route.traffic,
      etaMinutes: route.etaMinutes,
      confidence: route.confidence,
    });
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 overflow-hidden font-inter border-r border-slate-200 shadow-2xl">
      {/* Sleek Header */}
      <div className="p-4 sm:p-6 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center relative">
            <div className="absolute inset-0 bg-blue-400 rounded-2xl blur opacity-20 animate-pulse"></div>
            <Navigation className="w-6 h-6 text-blue-600 relative z-10" />
          </div>
          <div>
            <h3 className="font-black text-lg sm:text-xl text-slate-900 tracking-tight">Route Planner</h3>
            <p className="text-[11px] font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              Real-time Pathfinding
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
        <div className="space-y-5 mb-8 shrink-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Waypoints Card */}
          <div className="p-2 bg-white border border-slate-200 rounded-[24px] shadow-sm relative">
            <div className="absolute left-[35px] top-[48px] w-[2px] h-[32px] bg-slate-100" />
            
            <div className="relative p-2">
              <div className="absolute left-6 top-6 w-4 h-4 rounded-full border-[3px] border-blue-500 bg-white z-10 shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
              <input 
                className="w-full pl-14 pr-4 py-4 bg-slate-50 hover:bg-slate-100 border border-transparent rounded-[16px] text-sm font-black text-slate-700 focus:outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-500/10 transition-all font-mono"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                placeholder="Lat, Lng (e.g. 15.0286, 120.6898)"
              />
              {startAddress && (
                <p className="text-[10px] font-bold text-slate-400 mt-2 ml-6 italic">📍 {startAddress}</p>
              )}
              <button 
                onClick={() => {
                   const coords = start.split(',').map(c => parseFloat(c.trim()));
                   if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                      if (onUpdateStart) onUpdateStart(coords[0], coords[1]);
                   }
                }}
                className="absolute right-4 top-6 w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
                title="Center Map & Place Marker"
              >
                <Target className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Destination Card */}
          <div className="p-2 bg-white border border-slate-200 rounded-[24px] shadow-sm relative">
            <div className="relative p-2">
              <div className="absolute left-6 top-6 w-4 h-4 rounded-full border-[3px] border-red-500 bg-white z-10 shadow-[0_0_10px_rgba(220,38,38,0.3)]" />
              <input 
                className="w-full pl-14 pr-4 py-4 bg-slate-50 hover:bg-slate-100 border border-transparent rounded-[16px] text-sm font-black text-slate-700 focus:outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-500/10 transition-all font-mono"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                placeholder="Lat, Lng (destination)"
              />
              {endAddress && (
                <p className="text-[10px] font-bold text-slate-400 mt-2 ml-6 italic">📍 {endAddress}</p>
              )}
              <button 
                onClick={() => {
                   const coords = end.split(',').map(c => parseFloat(c.trim()));
                   if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                      if (onUpdateEnd) onUpdateEnd(coords[0], coords[1]);
                      if (onSelectDestination) {
                        onSelectDestination(coords[0], coords[1], 'Manual Destination [traffic:moderate]');
                      }
                      setSelectedFacility({
                        id: 'manual-destination',
                        label: 'Manual Destination',
                        lat: coords[0],
                        lng: coords[1],
                      });
                      const startCoords = parseCoordinates(start);
                      if (startCoords) {
                        const directDist = calculateDistance(startCoords[0], startCoords[1], coords[0], coords[1]);
                        TrafficService.getLiveTraffic([], 'clear').then(liveTraffic => {
                          const tsreMain = TrafficService.calculateRouteEta(directDist, liveTraffic, false, false);
                          const tsreAlt = TrafficService.calculateRouteEta(directDist * 1.1, liveTraffic, false, false);
                          setRouteOptions([
                            {
                              id: 'opt',
                              label: 'Direct Route',
                              time: `${tsreMain.estimatedMinutes} min`,
                              etaMinutes: tsreMain.estimatedMinutes,
                              traffic: 'low',
                              color: 'bg-emerald-500',
                              note: 'Fastest direct route',
                              active: true,
                              offsetLat: 0,
                              offsetLng: 0,
                              distKm: directDist,
                              confidence: tsreMain.confidence,
                            },
                            {
                              id: 'alt',
                              label: 'Alternate Route',
                              time: `${tsreAlt.estimatedMinutes} min`,
                              etaMinutes: tsreAlt.estimatedMinutes,
                              traffic: 'moderate',
                              color: 'bg-amber-500',
                              note: 'Alternative path with less intersection load',
                              active: false,
                              offsetLat: 0,
                              offsetLng: 0,
                              distKm: directDist * 1.1,
                              confidence: tsreAlt.confidence,
                            }
                          ]);
                        });
                      }
                   }
                }}
                className="absolute right-4 top-6 w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors shadow-sm"
                title="Center Map & Place Marker"
              >
                <Target className="w-4 h-4" />
              </button>
            </div>
          </div>

          <Button 
            className="w-full h-14 rounded-[16px] bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-900/15 text-sm uppercase tracking-widest font-bold text-white transition-all active:scale-[0.98]" 
            onClick={handleSearchFacilities}
            isLoading={isSearching}
          >
            Find Nearby Facilities
          </Button>
        </div>

        {/* 1. Facility Selection */}
        {foundFacilities && !selectedFacility && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Select Destination</p>
             <div className="space-y-3">
                {foundFacilities.map((f) => (
                  <button 
                    key={f.id}
                    onClick={() => selectFacility(f)}
                    className="w-full p-5 bg-white border border-slate-200 rounded-[24px] hover:border-blue-300 transition-all flex items-center justify-between group shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center">
                          <ShieldCheck className="w-5 h-5" />
                       </div>
                       <div className="text-left">
                          <span className="block text-sm font-black text-slate-900">{f.label}</span>
                          <span className="block text-[10px] font-bold text-slate-400 mt-0.5">{f.dist} away • {f.type || 'Facility'}</span>
                       </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
             </div>
          </div>
        )}

        {/* 2. Available Routes for Selected Facility */}
        {selectedFacility && routeOptions && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between px-2">
               <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Available Routes To</p>
                  <h4 className="text-sm font-black text-slate-900">{selectedFacility.label}</h4>
               </div>
               <button onClick={() => setSelectedFacility(null)} className="text-[10px] font-black uppercase text-blue-600 hover:underline">Change Facility</button>
            </div>
            
            <div className="p-2 bg-blue-600/5 border border-blue-600/10 rounded-2xl flex items-center gap-3">
               <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center animate-pulse">
                  <Activity className="w-4 h-4" />
               </div>
               <div className="flex-1">
                 <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">Live Traffic Prediction Active</span>
               </div>
               <MLBadge size="sm" variant="solid" label="ML-TSRЕ" />
            </div>

            <div className="space-y-4">
              {routeOptions.map((option: RouteOption) => (
                <div 
                  key={option.id}
                  onClick={() => selectRoute(option)}
                  className={`w-full p-5 rounded-[24px] border-2 text-left transition-all relative overflow-hidden group hover:shadow-lg cursor-pointer ${
                    option.active 
                      ? 'border-blue-500 bg-white shadow-xl shadow-blue-500/10' 
                      : 'border-slate-200 bg-white hover:border-blue-300'
                  }`}
                >
                {option.active && <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400 blur-[50px] opacity-10 rounded-full"></div>}
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center text-white shadow-md ${
                         option.traffic === 'low' ? 'bg-emerald-500' : option.traffic === 'moderate' ? 'bg-amber-500' : 'bg-red-500'
                      }`}>
                        <Car className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block text-sm font-black text-slate-900">{option.label}</span>
                        <span className="block text-[10px] font-bold text-slate-400 mt-0.5">{option.distKm?.toFixed(1)} km away</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                       <span className={`block text-xl font-black ${option.active ? 'text-blue-600' : 'text-slate-700'}`}>
                         {option.time}
                       </span>
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           if (onShowXai) {
                            const optionEta = Number.isFinite(option.etaMinutes)
                              ? option.etaMinutes
                              : calculateLiveRouteTime(option);
                             onShowXai({
                               dist: option.distKm.toFixed(1),
                               distKm: option.distKm,
                               time: option.time,
                               etaMinutes: Number.isFinite(optionEta) ? optionEta : undefined,
                               traffic: option.traffic,
                               incident: Boolean(option.incident),
                               confidence: option.confidence,
                               routeLabel: option.label,
                             });
                           }
                         }}
                         className="flex items-center justify-end gap-1 text-[9px] font-black uppercase tracking-widest mt-2 px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 hover:scale-105 transition-all shadow-lg shadow-indigo-500/10 group-hover:animate-pulse"
                       >
                          <Zap className="w-2.5 h-2.5 text-amber-300" />
                          View ML Proof
                       </button>
                    </div>
                  </div>
                  
                  {option.incident ? (
                    <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-[12px] text-[10px] font-bold flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                         <TrafficCone className="w-3 h-3" />
                      </div>
                      Incident detected! Rerouting is highly suggested. 
                    </div>
                  ) : (
                    <div className={`mt-4 p-3 border rounded-[12px] text-[10px] font-bold flex items-center gap-3 ${
                    option.active ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-slate-50 border-slate-100 text-slate-500'
                  }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      option.active ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'
                    }`}>
                        <ShieldCheck className="w-3 h-3" />
                    </div>
                    <span>{option.note}</span>
                  </div>
                  )}
                </div>
              </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function ChevronRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}
