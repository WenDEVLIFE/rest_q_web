"use client";

import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  AlertCircle,
  ShieldAlert,
  SlidersHorizontal
} from 'lucide-react';
import { IncidentRow } from './IncidentRow';
import { AdminHandler, Incident } from '../../src/agents/AdminDashboardAgent/AdminHandler';
import { toast } from 'sonner';
import { AlertDialog } from '../UI/AlertDialog';

export const MonitoringView = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchIncidents = async () => {
    setIsRefreshing(true);
    try {
      const data = await AdminHandler.getIncidents();
      setIncidents(data);
    } catch (err) {
      toast.error("Failed to sync latest reports.");
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleVerify = async (id: string) => {
    try {
      await AdminHandler.verifyIncident(id);
      toast.success("Incident verified successfully.");
      // Optimistic update
      setIncidents(prev => prev.map(inc => 
        inc.id === id ? { ...inc, status: 'verified' } : inc
      ));
    } catch (err) {
      toast.error("Failed to verify incident.");
    }
  };

  const handleRemoveClick = (id: string) => {
    setPendingDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;
    
    setIsDeleting(true);
    try {
      await AdminHandler.removeIncident(pendingDeleteId);
      toast.success("Incident report removed.");
      setIncidents(prev => prev.filter(inc => inc.id !== pendingDeleteId));
      setDeleteConfirmOpen(false);
    } catch (err) {
      toast.error("Failed to remove incident.");
    } finally {
      setIsDeleting(false);
      setPendingDeleteId(null);
    }
  };

  const filteredIncidents = incidents.filter(inc => 
    inc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inc.location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inc.reporter.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 flex-1 w-full animate-in fade-in duration-500 font-inter">
      {/* Header Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-black tracking-tight text-slate-900">Incident Monitoring</h2>
          </div>
          <p className="text-sm font-bold text-slate-400">Total reported issues: <span className="text-slate-900">{incidents.length}</span></p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search reports..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all w-64"
            />
          </div>
          <button 
            onClick={fetchIncidents}
            disabled={isRefreshing}
            className="p-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-500 hover:text-primary transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all active:scale-95">
            <SlidersHorizontal className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Incident List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="py-4 pl-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Incident Details</th>
                <th className="py-4 px-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Location</th>
                <th className="py-4 px-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Reporter</th>
                <th className="py-4 px-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="py-4 pr-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse border-b border-slate-100 last:border-0">
                    <td colSpan={5} className="py-12 px-6">
                      <div className="h-4 bg-slate-100 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : filteredIncidents.length > 0 ? (
                filteredIncidents.map(inc => (
                  <IncidentRow 
                    key={inc.id} 
                    incident={inc} 
                    onVerify={handleVerify}
                    onRemove={handleRemoveClick}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-slate-50 rounded-full">
                        <AlertCircle className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-sm font-bold text-slate-400">No reported incidents found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDialog 
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Incident Report?"
        description="This action will permanently remove the report from the monitoring system. This cannot be undone."
        confirmLabel="Remove Report"
      />
    </div>
  );
};
