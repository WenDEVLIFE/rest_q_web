"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Menu, User, X } from 'lucide-react';
import { AdminSidebar } from '../../components/Admin/AdminSidebar';
import { MonitoringView } from '../../components/Admin/MonitoringView';
import { AnalyticsView } from '../../components/Admin/AnalyticsView';
import { FacilitiesView } from '../../components/Admin/FacilitiesView';
import { UsersView } from '../../components/Admin/UsersView';
import { ProneAreasView } from '../../components/Admin/ProneAreasView';
import { SettingsView } from '../../components/Admin/SettingsView';
import { MLInsightsView } from '../../components/Admin/MLInsightsView';
import { APP_ROUTES } from '../../src/constants/routes';
import { useAuth } from '../../src/context/AuthContext';
import { subscribeToOpenIncidents } from '../../src/service/Incident_Service';
import { toast } from 'sonner';

export function AdminDashboardClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'monitoring' | 'analytics' | 'facilities' | 'users' | 'prone-areas' | 'settings' | 'ml-insights'>('overview');
  const [pendingCount, setPendingCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!profile || profile.role !== 'admin')) {
      router.push(APP_ROUTES.LOGIN);
    }
  }, [profile, loading, router]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'monitoring' || tab === 'analytics' || tab === 'facilities' || tab === 'users' || tab === 'prone-areas' || tab === 'settings' || tab === 'ml-insights') {
      setActiveTab(tab as any);
    } else {
      setActiveTab('monitoring');
    }
  }, [searchParams]);

  useEffect(() => {
    const unsubscribe = subscribeToOpenIncidents(
      (incidents) => {
        const pendingIncidents = incidents.filter((incident) => incident.status === 'pending');
        setPendingCount(pendingIncidents.length);
      },
      () => {
        toast.error('Unable to receive real-time incident notifications.');
      }
    );

    return () => unsubscribe();
  }, []);

  if (loading) {
    return null;
  }

  if (!profile || profile.role !== 'admin') return null;

  const renderContent = () => {
    switch (activeTab) {
      case 'monitoring':
        return <MonitoringView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'facilities':
        return <FacilitiesView />;
      case 'users':
        return <UsersView />;
      case 'prone-areas':
        return <ProneAreasView />;
      case 'settings':
        return <SettingsView />;
      case 'ml-insights':
        return <MLInsightsView />;
      default:
        return <MonitoringView />;
    }
  };

  return (
    <div className="flex min-h-screen bg-white font-inter">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close menu overlay"
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-[1px] md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main className="flex-1 flex flex-col bg-slate-50/30">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-8 sticky top-0 z-20">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="md:hidden p-2 rounded-lg border border-slate-200 bg-white text-slate-600"
              aria-label="Toggle admin menu"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-sm font-black text-slate-900 uppercase tracking-widest">
              <span className="text-primary">{activeTab}</span>
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-900 leading-none">{profile.displayName}</p>
                <p className="text-[10px] font-bold text-primary mt-1 uppercase tracking-tighter italic">System {profile.role}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-primary shadow-inner">
                <User className="w-6 h-6" />
              </div>
            </div>
          </div>
        </header>

        <div className="p-3 sm:p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}