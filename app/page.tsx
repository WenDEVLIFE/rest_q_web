"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronRight,
  Loader2,
  LogOut,
  LayoutDashboard,
  Activity,
  X
} from 'lucide-react';
import { useAuth } from '../src/context/AuthContext';
import { HomeCard } from '../components/User/HomeCard';
import { IncidentReporter, IncidentReportPayload } from '../components/User/IncidentReporter';
import { IncidentHistory } from '../components/User/IncidentHistory';
import { RouteNavigation } from '../components/User/RouteNavigation';
import { FacilityLocator } from '../components/User/FacilityLocator';
import { APP_ROUTES } from '../src/constants/routes';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { createIncidentReport, subscribeToOpenIncidents, subscribeToCompleteHistory } from '../src/service/Incident_Service';
import { Incident } from '../src/types/incident';
import { useRouter } from 'next/navigation';

const InteractiveMap = dynamic(() => import('../components/Map/InteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-slate-100 flex items-center justify-center z-0">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
    </div>
  )
});

export default function Home() {
  const { user, profile, loading, logout } = useAuth();
  const router = useRouter();
  const [activeView, setActiveView] = useState<'home' | 'report' | 'route' | 'facilities' | 'history'>('home');
  const [overlayMode, setOverlayMode] = useState<'none' | 'flood' | 'typhoon' | 'route' | 'report' | 'explore' | 'emergency'>('none');
  const [reportPin, setReportPin] = useState<{ lat: number, lng: number } | null>(null);
  const [searchPin, setSearchPin] = useState<{ lat: number, lng: number, label?: string } | null>(null);
  const [focusPin, setFocusPin] = useState<{ lat: number, lng: number } | null>(null);
  const [mapIncidents, setMapIncidents] = useState<Incident[]>([]);
  const [userIncidents, setUserIncidents] = useState<Incident[]>([]);
  const [historyIncidents, setHistoryIncidents] = useState<Incident[]>([]);

  const historyForCurrentUser = historyIncidents.filter((incident) => {
    if (!profile && !user) return false;
    return (
      incident.reporter === profile?.displayName ||
      incident.reporter === user?.email
    );
  });

  // Sync activeView with overlayMode naturally
  useEffect(() => {
    if (activeView === 'report') setOverlayMode('report');
    else if (activeView === 'route') setOverlayMode('route');
    else if (overlayMode === 'report' || overlayMode === 'route') setOverlayMode('none');
  }, [activeView]);

  useEffect(() => {
    const unsubscribeMap = subscribeToOpenIncidents(
      (incidents) => setMapIncidents(incidents),
      (error) => {
        console.error('Map incident stream failed:', error);
      }
    );

    const unsubscribeFeed = subscribeToOpenIncidents(
      (incidents) => setUserIncidents(incidents),
      (error) => {
        console.error('User incident stream failed:', error);
      }
    );

    const unsubscribeHistory = subscribeToCompleteHistory(
      (incidents) => setHistoryIncidents(incidents),
      (error) => {
        console.error('History incident stream failed:', error);
      }
    );

    return () => {
      unsubscribeMap();
      unsubscribeFeed();
      unsubscribeHistory();
    };
  }, []);

  const handleIncidentReport = async (payload: IncidentReportPayload): Promise<boolean> => {
    if (!reportPin) {
      toast.error('Pin the incident location on the map first.');
      return false;
    }

    const severity = payload.riskData?.risk === 'High' ? 'high' : 'medium';
    const defaultDescription = `Reported ${payload.type} incident from user panel.`;

    try {
      await createIncidentReport({
        type: payload.type as Incident['type'],
        location: {
          lat: reportPin.lat,
          lng: reportPin.lng,
          address: `Lat ${reportPin.lat.toFixed(4)}, Lng ${reportPin.lng.toFixed(4)}`,
        },
        reporter: profile?.displayName || user?.email || 'Anonymous User',
        description: payload.description || defaultDescription,
        severity,
      });

      setReportPin(null);
      setActiveView('home');
      setOverlayMode('none');
      return true;
    } catch (error) {
      console.error('Failed to submit incident:', error);
      toast.error('Unable to submit report. Please try again.');
      return false;
    }
  };

  const handleActionSelect = (action: string) => {
    if (action === 'flood' || action === 'typhoon') {
      // Toggle overlay mode without leaving home view
      setOverlayMode(prev => prev === action ? 'none' : action as any);
    } else {
      setActiveView(action as any);
      
      // Update overlay mode to match the active view for routing/reporting map features
      if (action === 'report' || action === 'route') {
        setOverlayMode(action as any);
      } else {
        setOverlayMode('none');
      }
      
      // Clear pins when returning home
      if (action === 'home') {
        setReportPin(null);
        setFocusPin(null);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push(APP_ROUTES.LOGIN);
    } catch (error) {
      toast.error('Logout failed. Please try again.');
    }
  };

  const handleEmergencyMapClick = () => {
    setActiveView('home');
    setOverlayMode('emergency');
    setFocusPin(null);
    setReportPin(null);
    setSearchPin(null);
  };

  const handleLocationSelect = (lat: number, lng: number, label: string) => {
    setSearchPin({ lat, lng, label });
    setFocusPin({ lat, lng });
  };

  // Determines whether the side panel is docked to the left (true) or centered (false)
  const isMapActive = activeView !== 'home' || overlayMode === 'explore' || overlayMode === 'emergency';

  const renderActiveView = () => {
    switch (activeView) {
      case 'report':
        return <IncidentReporter onClose={() => setActiveView('home')} onReport={handleIncidentReport} reportPin={reportPin} reportedIncidents={userIncidents} />;
      case 'route':
        return <RouteNavigation onClose={() => setActiveView('home')} />;
      case 'facilities':
        return <FacilityLocator onClose={() => setActiveView('home')} onLocationSelect={(lat, lng) => setFocusPin({ lat, lng })} />;
      case 'history':
        return <IncidentHistory onClose={() => setActiveView('home')} incidents={historyForCurrentUser} />;
      default:
        // If it's a full-screen NOAH mode overlay, we don't render the HomeCard side panel
        if (overlayMode === 'flood' || overlayMode === 'typhoon') {
          return null;
        }

        return (
          <div className="relative h-full flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <HomeCard 
                onActionSelect={handleActionSelect} 
                onLocationSelect={handleLocationSelect}
                isSidebar={isMapActive} 
              />
            </div>
          </div>
        );
    }
  };
  const isFullScreenNoahMode = overlayMode === 'flood' || overlayMode === 'typhoon' || overlayMode === 'emergency';

  return (
    <div className="relative min-h-screen w-full flex flex-col font-inter overflow-hidden bg-slate-200">
      {/* Background Layer: Static Image or Interactive Map */}
      <div className="absolute inset-0 z-0">
        {activeView === 'home' && overlayMode === 'none' ? (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 scale-105"
            style={{ backgroundImage: "url('/map.jpg')" }}
          >
            <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px]" />
          </div>
        ) : (
          <InteractiveMap
            overlayMode={overlayMode}
            reportPin={reportPin}
            searchPin={searchPin}
            focusPin={focusPin}
            reportedIncidents={mapIncidents}
            onMapClick={(lat, lng) => setReportPin({ lat, lng })}
          />
        )}
      </div>

      {/* Modern Blur Overlay: ONLY for Home view with static background to make HomeCard pop */}
      {activeView === 'home' && overlayMode === 'none' && (
        <div className="absolute inset-0 bg-white/20 backdrop-blur-md pointer-events-none z-10 transition-all duration-500" />
      )}

      {/* Header Overlay */}
      <header className="relative z-50 h-20 px-8 flex items-center justify-between bg-white/80 backdrop-blur-lg border-b border-white/60 shadow-sm pointer-events-auto">
        <div className="flex items-center gap-4">
         <Image
                                 src="/logo.png"
                                 alt="Res-Q Logo"
                                 width={100}
                                 height={100}
                                 className="object-contain"
                                 priority
                               />
          <div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={handleEmergencyMapClick}
              className="text-sm font-black text-slate-900 hover:text-primary transition-colors"
            >
              Emergency Map
            </button>
          </nav>

          <div className="flex items-center gap-3 pl-6 border-l border-slate-900/10">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            ) : profile ? (
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-black text-slate-900 leading-none">{profile.displayName}</p>
                  <p className="text-[10px] font-bold text-primary mt-1 uppercase tracking-tighter italic">System {profile.role}</p>
                </div>
                {profile.role === 'admin' && (
                  <Link
                    href={APP_ROUTES.ADMIN.DASHBOARD}
                    className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                    title="Admin Dashboard"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="p-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:text-red-600 hover:bg-red-50 transition-all active:scale-95"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link
                href={APP_ROUTES.LOGIN}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-black hover:bg-sky-700 transition-all shadow-lg shadow-primary/20 active:scale-95"
              >
                Sign In
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Floating NOAH Overlay Controls */}
      {isFullScreenNoahMode && (
        <div className="absolute top-24 left-8 z-[1000] bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.3)] p-6 w-80 animate-in fade-in slide-in-from-top-8 duration-500 font-inter text-slate-50">
           <div className="flex items-center justify-between mb-6">
             <div>
                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
                  {overlayMode === 'flood' ? 'Flood Risk' : overlayMode === 'emergency' ? 'Full Hazard' : 'Typhoon'} Radar
                </h3>
                <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-widest">LIVE • Telemetry Active</p>
             </div>
           </div>

           <div className="space-y-4 mb-6">
             <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-black/60 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-8 rounded-full ${overlayMode === 'flood' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]'}`} />
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hazard Level</span>
                    <span className="block text-sm font-black text-white">Critical Watch</span>
                  </div>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-black/40 rounded-2xl border border-white/5">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Impact Radius</span>
                  <span className="block text-xs font-mono text-white">15.0 km</span>
                </div>
                <div className="p-3 bg-black/40 rounded-2xl border border-white/5">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Last Update</span>
                  <span className="block text-xs font-mono text-white">Just Now</span>
                </div>
             </div>
           </div>

           <button 
              onClick={() => setOverlayMode('none')} 
              className="group relative w-full py-4 bg-white/10 hover:bg-white/20 border border-white/5 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all overflow-hidden"
           >
             <span className="relative z-10 flex items-center justify-center gap-2">
                <X className="w-4 h-4" /> Exit Radar Mode
             </span>
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
           </button>
        </div>
      )}

      {/* Main Content Overlay: Google Maps Side Panel Layout */}
      {!isFullScreenNoahMode && (
        <main className={`relative z-10 flex-1 flex pointer-events-none ${isMapActive ? 'justify-start' : 'items-center justify-center p-6 sm:p-12'}`}>
          <div 
            className={`pointer-events-auto ${
              !isMapActive
                ? 'w-full flex justify-center translate-y-[-2rem]' 
                : 'w-full sm:w-[450px] h-full bg-white shadow-2xl border-r border-slate-200 animate-in slide-in-from-left-8 duration-300 overflow-y-auto'
            }`}
          >
            {renderActiveView()}
          </div>
        </main>
      )}

      {/* Quick Instructional Toast during Report Mode */}
      {overlayMode === 'report' && !reportPin && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full text-sm font-bold shadow-2xl z-50 animate-bounce pointer-events-none">
          Click anywhere on the map to pinpoint emergency!
        </div>
      )}

      {/* Footer System Info */}
      <footer className="absolute bottom-0 w-full z-10 px-12 py-4 flex items-center justify-between text-[10px] font-black text-slate-500/60 uppercase tracking-widest pointer-events-none mix-blend-multiply">
        <p>© 2026 Res-Q Project • Interactive Maps by MapTiler</p>
        <p>Telemetry Ref: RT-MANILA-CORE</p>
      </footer>
    </div>
  );
}
