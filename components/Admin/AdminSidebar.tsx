"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  MapPin, 
  BarChart3, 
  ShieldAlert,
  LogOut,
  Users
} from 'lucide-react';
import { APP_ROUTES } from '../../src/constants/routes';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '../../src/utils/cn'; // Assuming a utility for class names exists or I can use templates

export const AdminSidebar = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const loadingToast = toast.loading("Signing out...");
      await logout();
      toast.dismiss(loadingToast);
      toast.success("Signed out successfully.");
      router.push(APP_ROUTES.LOGIN);
    } catch (err) {
      toast.error("Logout failed.");
    }
  };

  const navItems = [
    { label: 'Overview', icon: LayoutDashboard, href: APP_ROUTES.ADMIN.DASHBOARD },
    { label: 'Monitoring', icon: ShieldAlert, iconColor: 'text-emergency', href: APP_ROUTES.ADMIN.MONITORING },
    { label: 'Analytics', icon: BarChart3, href: APP_ROUTES.ADMIN.ANALYTICS },
    { label: 'Users', icon: Users, href: APP_ROUTES.ADMIN.USERS },
  ];

  return (
    <aside className="w-64 bg-surface border-r border-slate-200 h-screen flex flex-col sticky top-0 font-inter">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">Res-Q</h1>
            <p className="text-[10px] font-bold text-primary tracking-widest uppercase mt-1">Admin Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          if (!item.href) return null; // Prevent undefined href error
          
          // Robust tab matching logic
          const isDashboard = item.href === APP_ROUTES.ADMIN.DASHBOARD;
          const isActive = isDashboard 
            ? (pathname === item.href && !searchParams.get('tab'))
            : (searchParams.get('tab') === new URL(item.href, 'http://x').searchParams.get('tab'));
            
          const Icon = item.icon;
          
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${isActive 
                  ? 'bg-primary text-white shadow-md shadow-primary/20' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}
              `}
            >
              <Icon className={`w-5 h-5 ${item.iconColor && !isActive ? item.iconColor : ''}`} />
              <span className="text-sm font-bold">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 w-full group"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-bold">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
