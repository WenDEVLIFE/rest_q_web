"use client";

import React from 'react';
import { Clock, MapPin, X, AlertTriangle, Flame, Hospital, Car, ChevronLeft } from 'lucide-react';
import { Incident } from '../../src/types/incident';
import { Button } from '../UI/Button';

interface IncidentHistoryProps {
  onClose: () => void;
  incidents: Incident[];
}

export const IncidentHistory = ({ onClose, incidents }: IncidentHistoryProps) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'accident': return <Car className="w-4 h-4" />;
      case 'fire': return <Flame className="w-4 h-4" />;
      case 'health': return <Hospital className="w-4 h-4" />;
      case 'hazard': return <AlertTriangle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'accident': return 'text-orange-600 bg-orange-100';
      case 'fire': return 'text-red-600 bg-red-100';
      case 'health': return 'text-rose-600 bg-rose-100';
      case 'hazard': return 'text-amber-600 bg-amber-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'verified': return 'bg-blue-100 text-blue-700';
      case 'resolved': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const formatTime = (ts: any) => {
    if (!ts || !ts.toDate) return 'Just now';
    const mins = Math.floor((new Date().getTime() - ts.toDate().getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} mins ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)} hrs ago`;
    return `${Math.floor(mins / 1440)} days ago`;
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 overflow-hidden font-inter border-r border-slate-200 shadow-2xl">
      {/* Header */}
      <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <h3 className="font-black text-lg text-slate-900 tracking-tight">Report History</h3>
        </div>
        <button onClick={onClose} className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 overflow-y-auto space-y-3">
        {incidents && incidents.length > 0 ? (
          incidents.map((incident) => (
            <div key={incident.id} className="p-4 bg-white border border-slate-200 rounded-[16px] shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${getTypeColor(incident.type)} flex items-center justify-center`}>
                    {getTypeIcon(incident.type)}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 capitalize">{incident.type}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">{formatTime(incident.timestamp)}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${getStatusColor(incident.status)}`}>
                  {incident.status}
                </span>
              </div>

              {incident.description && (
                <p className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-100 p-2 rounded-lg mb-2">
                  {incident.description}
                </p>
              )}

              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 px-1">
                <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                <span className="truncate">{incident.location.address || 'Unknown location'}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-sm font-bold text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl mt-4">
            No incident reports yet.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 bg-white border-t border-slate-100 shrink-0">
        <Button variant="ghost" className="w-full bg-slate-50 border border-slate-200 hover:bg-slate-100" onClick={onClose}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </div>
    </div>
  );
};
