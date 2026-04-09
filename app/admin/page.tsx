"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AdminSidebar } from '../../components/Admin/AdminSidebar';
import { MonitoringView } from '../../components/Admin/MonitoringView';
import { AnalyticsView } from '../../components/Admin/AnalyticsView';
import { UsersView } from '../../components/Admin/UsersView';
import { APP_ROUTES } from '../../src/constants/routes';
import {
  Bell,
  Search,
  HelpCircle,
  User,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../src/context/AuthContext';
import { Button } from '../../components/UI/Button';

export default function AdminDashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { profile, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'monitoring' | 'analytics' | 'users'>('overview');

  // Protect route
  useEffect(() => {
    if (!loading && (!profile || profile.role !== 'admin')) {
      router.push(APP_ROUTES.LOGIN);
    }
  }, [profile, loading, router]);

  // Sync active tab with URL for better navigation experience
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'monitoring' || tab === 'analytics' || tab === 'users') {
      setActiveTab(tab as any);
    } else {
      setActiveTab('monitoring'); // Default to monitoring for now as requested
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!profile || profile.role !== 'admin') return null;

  const renderContent = () => {
    switch (activeTab) {
      case 'monitoring':
        return <MonitoringView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'users':
        return <UsersView />;
      default:
        return <MonitoringView />;
    }
  };

  return (
    <div className="flex min-h-screen bg-white font-inter">
      {/* Sidebar - Fixed/Sticky */}
      <AdminSidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-slate-50/30">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-black text-slate-900 uppercase tracking-widest">
              Dashboard / <span className="text-primary">{activeTab}</span>
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Global search..."
                className="pl-9 pr-4 py-1.5 bg-slate-50 border-2 border-slate-100 rounded-lg text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-primary/20 transition-all w-48"
              />
            </div>

            <button className="relative p-1 text-slate-400 hover:text-primary transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-emergency rounded-full border-2 border-white" />
            </button>

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

        {/* Dynamic View Content */}
        <div className="p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
