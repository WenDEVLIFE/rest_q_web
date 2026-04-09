"use client";

import React from 'react';
import { 
  AlertTriangle, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Trash2, 
  ExternalLink,
  MoreVertical
} from 'lucide-react';
import { Incident } from '../../src/agents/AdminDashboardAgent/AdminHandler';

interface IncidentRowProps {
  incident: Incident;
  onVerify: (id: string) => void;
  onRemove: (id: string) => void;
}

export const IncidentRow = ({ incident, onVerify, onRemove }: IncidentRowProps) => {
  const typeStyles = {
    accident: 'bg-red-50 text-red-700 border-red-100',
    closure: 'bg-amber-50 text-amber-700 border-amber-100',
    hazard: 'bg-amber-50 text-amber-700 border-amber-100',
    other: 'bg-slate-50 text-slate-700 border-slate-100',
  };

  const statusStyles = {
    pending: 'bg-amber-100 text-amber-700',
    verified: 'bg-sky-100 text-sky-700',
    resolved: 'bg-emerald-100 text-emerald-700',
  };

  return (
    <tr className="group hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
      <td className="py-4 pl-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg border ${typeStyles[incident.type]}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm font-black text-slate-900 capitalize">{incident.type}</span>
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 mt-0.5">
              <Clock className="w-3 h-3" />
              <span className="font-mono">{incident.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
      </td>
      
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-bold text-slate-700 truncate max-w-[200px]">{incident.location.address}</span>
        </div>
      </td>

      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-700">{incident.reporter}</span>
        </div>
      </td>

      <td className="py-4 px-4">
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusStyles[incident.status]}`}>
          {incident.status}
        </span>
      </td>

      <td className="py-4 pr-6 text-right">
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {incident.status === 'pending' && (
            <button 
              onClick={() => onVerify(incident.id)}
              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              title="Verify Report"
            >
              <CheckCircle2 className="w-5 h-5" />
            </button>
          )}
          <button 
            onClick={() => onRemove(incident.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Remove Report"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </td>
    </tr>
  );
};
