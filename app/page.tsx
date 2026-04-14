"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  X,
  BrainCircuit,
  Zap,
  ShieldCheck,
  BarChart3,
  ChevronRight,
  Loader2,
  LogOut,
  LayoutDashboard,
  Activity,
  Target
} from 'lucide-react';
import { useAuth } from '../src/context/AuthContext';
import { HomeCard } from '../components/User/HomeCard';
import { IncidentReporter, IncidentReportPayload } from '../components/User/IncidentReporter';
import { IncidentHistory } from '../components/User/IncidentHistory';
import { RouteNavigation } from '../components/User/RouteNavigation';
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
  const [focusPin, setFocusPin] = useState<{ lat: number, lng: number, label: string } | null>(null);
  const [mapPanelTab, setMapPanelTab] = useState<'metrics' | 'advisory' | 'what-to-do' | 'facilities' | undefined>(undefined);
  const [isMapPanelOpen, setIsMapPanelOpen] = useState(false);
  const [mapIncidents, setMapIncidents] = useState<Incident[]>([]);
  const [userIncidents, setUserIncidents] = useState<Incident[]>([]);
  const [historyIncidents, setHistoryIncidents] = useState<Incident[]>([]);
  const [showMLDocs, setShowMLDocs] = useState(false);

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
      // Toggle overlay mode and auto-open the map panel for context
      const newMode = overlayMode === action ? 'none' : action as any;
      setOverlayMode(newMode);
      
      if (newMode !== 'none') {
        setIsMapPanelOpen(true);
        // We stay in 'home' view but the map panel slides in
      }
    } else {
      setActiveView(action as any);

      // Update overlay mode to match the active view for routing/reporting map features
      if (action === 'report' || action === 'route') {
        setOverlayMode(action as any);
      } else if (action === 'facilities' && focusPin) {
        // Advanced GIS Journey: Auto-open the Place Sheet on the map instead of separate page
        setActiveView('home');
        setOverlayMode('none');
        setMapPanelTab('facilities');
        setIsMapPanelOpen(true);
        return;
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
    setOverlayMode('none');
    setFocusPin(null);
    setReportPin(null);
    setIsMapPanelOpen(true);
  };

  // Determines whether the side panel is docked to the left (true) or centered (false)
  const isMapActive = (activeView !== 'home' && activeView !== 'history') || overlayMode !== 'none' || isMapPanelOpen;

  const renderActiveView = () => {
    switch (activeView) {
      case 'report':
        return <IncidentReporter onClose={() => setActiveView('home')} onReport={handleIncidentReport} reportPin={reportPin} reportedIncidents={userIncidents} />;
      case 'route':
        return <RouteNavigation 
          onClose={() => setActiveView('home')} 
          onSelectDestination={(lat, lng, label) => {
            setFocusPin({ lat, lng, label });
            setOverlayMode('route');
          }}
          onUpdateStart={(lat, lng) => {
            if (!reportPin || reportPin.lat !== lat || reportPin.lng !== lng) {
              setReportPin({ lat, lng });
            }
          }}
        />;
      case 'history':
        return <IncidentHistory onClose={() => setActiveView('home')} incidents={historyForCurrentUser} />;
      default:
        // If it's a full-screen NOAH mode overlay OR the map panel is open, we don't render the HomeCard side panel
        if (overlayMode === 'flood' || overlayMode === 'typhoon' || isMapPanelOpen) {
          return null;
        }

        return (
          <div className="relative h-full flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <HomeCard
                onActionSelect={handleActionSelect}
                isSidebar={isMapActive}
                hasLocation={Boolean(focusPin)}
                onLocationSelect={(lat, lng, label) => setFocusPin({ lat, lng, label })}
                onEmergencyMap={handleEmergencyMapClick}
                focusPinLabel={focusPin?.label}
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
        <div
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 scale-105 ${!isMapActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          style={{ backgroundImage: "url('/map.jpg')" }}
        >
          <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px]" />
        </div>

        <div className={`absolute inset-0 transition-opacity duration-1000 ${!isMapActive ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}>
          <InteractiveMap
            overlayMode={overlayMode}
            reportPin={reportPin}
            focusPin={focusPin}
            reportedIncidents={mapIncidents}
            onMapClick={(lat, lng) => setReportPin({ lat, lng })}
            onOverlayModeChange={(mode) => setOverlayMode(mode)}
            onReset={() => {
              setFocusPin(null);
              setOverlayMode('none');
              setIsMapPanelOpen(false);
            }}
            forceTab={mapPanelTab}
            forceOpen={isMapPanelOpen}
          />
        </div>
      </div>

      {/* Modern Blur Overlay: ONLY for Home/History view with static background to make content pop */}
      {!isMapActive && (
        <div className="absolute inset-0 bg-white/20 backdrop-blur-md pointer-events-none z-10 transition-all duration-500" />
      )}

      {/* Header Overlay */}
      <header className="relative z-50 h-20 px-8 flex items-center justify-between bg-white/80 backdrop-blur-lg border-b border-white/60 shadow-sm pointer-events-auto">
        <div className="flex items-center gap-4">
          <Image
            src="/logo.png"
            alt="Res-Q Logo"
            width={120}
            height={40}
            style={{ height: '40px', width: 'auto' }}
            className="object-contain"
            priority
          />
          <div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-8">
            {/* Navigation moved to HomeCard menu */}
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
            
            <button 
              onClick={() => setShowMLDocs(true)}
              className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-95 shadow-lg group"
              title="System Intelligence Guide"
            >
              <BrainCircuit className="w-5 h-5 group-hover:animate-pulse" />
            </button>
          </div>
        </div>
      </header>

      {/* Floating Radar Controls (Flood/Typhoon only) or Back Button (Map Panel/Emergency) */}
      {(isFullScreenNoahMode || isMapPanelOpen) && (
        (overlayMode === 'emergency' || isMapPanelOpen) ? (
          <button
            onClick={() => {
              setOverlayMode('none');
              setIsMapPanelOpen(false);
              setMapPanelTab(undefined);
            }}
            className="absolute top-24 left-8 z-[1000] px-6 py-4 bg-white/90 backdrop-blur-xl border border-slate-200 text-slate-900 rounded-[24px] shadow-2xl flex items-center gap-3 font-black text-xs uppercase tracking-widest hover:bg-white hover:border-primary/30 transition-all active:scale-95 group"
          >
            <ChevronRight className="w-5 h-5 rotate-180 text-primary group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </button>
        ) : (
          <div className="absolute top-24 left-8 z-[1000] bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.3)] p-6 w-80 animate-in fade-in slide-in-from-top-8 duration-500 font-inter text-slate-50">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
                  {overlayMode === 'flood' ? 'Flood Risk' : 'Typhoon'} Radar
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
        )
      )}

      {/* Main Content Overlay: Google Maps Side Panel Layout */}
      {!isFullScreenNoahMode && (
        <main className={`relative z-10 flex-1 flex pointer-events-none ${isMapActive ? 'justify-start' : 'items-center justify-center p-6 sm:p-12'}`}>
          <div
            className={`pointer-events-auto ${!isMapActive
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

      {/* --- ML INTELLIGENCE GUIDE MODAL --- */}
      {showMLDocs && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowMLDocs(false)} />
           <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col border border-white/20">
              {/* Modal Header */}
              <div className="p-8 pb-4 border-b border-slate-100 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                       <BrainCircuit className="w-6 h-6" />
                    </div>
                    <div>
                       <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Intelligence Discovery</h2>
                       <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1 italic">Machine Learning & Prediction Roadmap</p>
                    </div>
                 </div>
                 <button onClick={() => setShowMLDocs(false)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all active:scale-90">
                    <X className="w-6 h-6" />
                 </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar border-t border-slate-50">
                  <section>
                     <div className="flex items-center gap-3 mb-8">
                        <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">TSRE: Research Architecture</h3>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 group hover:border-primary/30 transition-all">
                           <p className="text-[10px] font-black text-primary uppercase mb-3 px-2 py-0.5 bg-sky-100 w-fit rounded-full">Spatial Logic</p>
                           <h4 className="text-base font-black text-slate-900 mb-2 italic">Composite ETA Engine</h4>
                           <div className="bg-white p-4 rounded-xl border border-slate-100 mb-4 font-mono text-[10px] text-slate-700 leading-relaxed shadow-sm">
                             T = (D * K) + Sum(W*T) + Φ + Ω
                           </div>
                           <p className="text-[11px] font-bold text-slate-500 leading-relaxed">Calculates Euclidean distance (D) adjusted by peak traffic weights (W) and hazard penalty constants (Φ).</p>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 group hover:border-emerald-300 transition-all">
                           <p className="text-[10px] font-black text-emerald-600 uppercase mb-3 px-2 py-0.5 bg-emerald-100 w-fit rounded-full">Risk Scoring</p>
                           <h4 className="text-base font-black text-slate-900 mb-2 italic">Multivariate R-Score</h4>
                           <div className="bg-white p-4 rounded-xl border border-slate-100 mb-4 font-mono text-[10px] text-slate-700 leading-relaxed shadow-sm">
                             R = (αH + βS + γ/V) / N
                           </div>
                           <p className="text-[11px] font-bold text-slate-500 leading-relaxed">Analyzes historical frequency (α), user-severity (β), and road velocity (γ) to determine current alert level.</p>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 group hover:border-indigo-300 transition-all">
                           <p className="text-[10px] font-black text-indigo-600 uppercase mb-3 px-2 py-0.5 bg-indigo-100 w-fit rounded-full">Cognitive</p>
                           <h4 className="text-base font-black text-slate-900 mb-2 italic">DBSCAN Clustering</h4>
                           <div className="bg-white p-4 rounded-xl border border-slate-100 mb-4 font-mono text-[10px] text-slate-700 leading-relaxed shadow-sm">
                             eps=500m | MinPts=4 | Tw=24h
                           </div>
                           <p className="text-[11px] font-bold text-slate-500 leading-relaxed">Density-based clustering identifies hotspots when at least 4 reports converge within a 500m radius.</p>
                        </div>
                     </div>
                  </section>

                 {/* 2. Features Detailed */}
                 <section>
                    <div className="flex items-center justify-between mb-8">
                       <div className="flex items-center gap-3">
                          <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                          <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Physics of Resilience</h3>
                       </div>
                       <Link 
                         href="/intelligence" 
                         className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-800 transition-colors py-2 px-4 bg-indigo-50 rounded-full border border-indigo-100 group"
                       >
                         Learn More (Intricacies & Analogies) <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                       </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       {[
                          { title: "Predictive ETA", desc: "Edge-based inference calculating arrival times using traffic density (Tw) and regional hazard weights (Vp). Computes shortest path via real-time telemetry.", icon: <Activity className="w-5 h-5" />, color: "bg-blue-600" },
                          { title: "Hotspot Clustering", desc: "Our Pattern Intelligence engine tracks report density over a 12-hour sliding window to predict flash-floods before they are officially declared.", icon: <Target className="w-5 h-5" />, color: "bg-red-600" },
                          { title: "Triage LLM", desc: "High-speed conversational support using Innovatech Microservices. Provides dialect-aware emotional support and verified medical triage steps.", icon: <BrainCircuit className="w-5 h-5" />, color: "bg-indigo-600" },
                          { title: "SITREP Synthesis", desc: "Automatically summarizes thousands of chaotic incident reports into a clear, actionable Situation Report (SITREP) for high-level Admins.", icon: <BarChart3 className="w-5 h-5" />, color: "bg-slate-900" }
                       ].map((feat, i) => (
                          <div key={i} className="flex gap-4 p-5 bg-white border-2 border-slate-50 rounded-3xl hover:border-primary/20 hover:shadow-xl transition-all group">
                             <div className={`w-12 h-12 ${feat.color} text-white rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                                {feat.icon}
                             </div>
                             <div>
                                <h4 className="text-sm font-black text-slate-900 mb-1">{feat.title}</h4>
                                <p className="text-[11px] font-bold text-slate-500 leading-relaxed">{feat.desc}</p>
                             </div>
                          </div>
                       ))}
                    </div>
                 </section>

                 <section className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                       <BarChart3 className="w-32 h-32" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                       <div className="flex-1">
                          <h3 className="text-lg font-black mb-4 uppercase tracking-widest flex items-center gap-2 text-indigo-400">
                             Data Fusion Philosophy
                          </h3>
                          <p className="text-sm font-bold text-slate-400 leading-relaxed mb-8">
                             Res-Q integrates multi-modal telemetry from GDACS (Typhoons), OpenWeather (Floods), and Citizen Intelligence. This creates a "Predictive Safety Grid" that learned from historical response patterns in the San Fernando locality.
                          </p>
                          <div className="grid grid-cols-2 gap-4">
                             <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                <span className="text-[9px] font-black uppercase text-slate-500 mb-1 block">Ethics</span>
                                <p className="text-[10px] font-bold">Privacy-first processing with 48h anonymization.</p>
                             </div>
                             <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                <span className="text-[9px] font-black uppercase text-slate-500 mb-1 block">Accuracy</span>
                                <p className="text-[10px] font-bold">88% Prediction threshold for dispatch logic.</p>
                             </div>
                          </div>
                       </div>
                       <div className="w-full md:w-48 grid grid-cols-1 gap-3">
                          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
                             <span className="block text-2xl font-black italic underline decoration-primary decoration-4">2.4s</span>
                             <span className="text-[9px] font-black uppercase text-indigo-400">Latency</span>
                          </div>
                          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
                             <span className="block text-2xl font-black italic underline decoration-emerald-400 decoration-4">8ms</span>
                             <span className="text-[9px] font-black uppercase text-emerald-400">Inference</span>
                          </div>
                       </div>
                    </div>
                 </section>
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Reference Document: ml.md • Vers: RT-MANILA-CORE-V2</p>
              </div>
           </div>
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