"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  Menu, 
  User, 
  ChevronRight,
  Loader2,
  LogOut,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../src/context/AuthContext';
import { HomeCard } from '../components/User/HomeCard';
import { IncidentReporter } from '../components/User/IncidentReporter';
import { RouteNavigation } from '../components/User/RouteNavigation';
import { FacilityLocator } from '../components/User/FacilityLocator';
import { APP_ROUTES } from '../src/constants/routes';

export default function Home() {
  const { profile, loading, logout } = useAuth();
  const [activeView, setActiveView] = useState<'home' | 'report' | 'route' | 'facilities' | 'history'>('home');
  const [isNavOpen, setIsNavOpen] = useState(false);

  // Requirement 1.7: Simulation of Traffic Heatmap Visualization
  const [showHeatMap, setShowHeatMap] = useState(true);

  const renderActiveView = () => {
    switch (activeView) {
      case 'report':
        return <IncidentReporter onClose={() => setActiveView('home')} onReport={() => {}} />;
      case 'route':
        return <RouteNavigation onClose={() => setActiveView('home')} />;
      case 'facilities':
        return <FacilityLocator onClose={() => setActiveView('home')} />;
      default:
        return <HomeCard onActionSelect={(action) => setActiveView(action)} />;
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col font-inter overflow-hidden">
      {/* Background Map Simulation (Requirement 1.1, 1.7) */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 scale-105"
        style={{ backgroundImage: "url('/map.jpg')" }}
      >
        {/* Heatmap/Overlay layer */}
        <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px]" />
        
        {/* Animated Traffic Indicators Simulation (Requirement 1.7) */}
        {showHeatMap && (
          <div className="absolute inset-0">
             <div className="absolute top-[40%] left-[30%] w-32 h-32 bg-red-500/20 rounded-full blur-3xl animate-pulse" />
             <div className="absolute top-[60%] left-[50%] w-48 h-48 bg-amber-500/20 rounded-full blur-3xl animate-pulse" />
             <div className="absolute top-[20%] left-[70%] w-24 h-24 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
          </div>
        )}
      </div>

      {/* Header Overlay */}
      <header className="relative z-50 h-20 px-8 flex items-center justify-between bg-white/40 backdrop-blur-md border-b border-white/20 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-slate-900 leading-none">Res-Q</h1>
            <p className="text-[10px] font-black text-primary tracking-widest uppercase mt-1">Life-Coordination Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-black text-slate-900 hover:text-primary transition-colors">Emergency Map</Link>
            <button onClick={() => setShowHeatMap(!showHeatMap)} className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">
              {showHeatMap ? 'Hide Heatmap' : 'Traffic Heatmap'}
            </button>
            <Link href="#" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">Resources</Link>
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
                  onClick={() => logout()}
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

      {/* Main Content Overlay */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full flex justify-center translate-y-[-2rem]">
          {renderActiveView()}
        </div>

        {/* Legend Overlay Simulation (Requirement 1.7) */}
        {showHeatMap && (
          <div className="absolute bottom-12 left-12 p-5 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 shadow-xl font-inter animate-in slide-in-from-left-8 duration-700">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Traffic Intensity</h5>
            <div className="space-y-2">
               <div className="flex items-center gap-3">
                 <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
                 <span className="text-[10px] font-bold text-slate-600 uppercase">Clear Flow</span>
               </div>
               <div className="flex items-center gap-3">
                 <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm" />
                 <span className="text-[10px] font-bold text-slate-600 uppercase">Moderate Delay</span>
               </div>
               <div className="flex items-center gap-3">
                 <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm" />
                 <span className="text-[10px] font-black text-slate-900 uppercase">Critical / Incident</span>
               </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Simulation */}
      <footer className="relative z-10 px-12 py-6 flex items-center justify-between text-[10px] font-black text-slate-500/60 uppercase tracking-widest pointer-events-none">
        <p>© 2026 Res-Q Project • High-Visibility Coordination</p>
        <p>Telemetry Ref: RT-MANILA-CORE</p>
      </footer>
    </div>
  );
}
