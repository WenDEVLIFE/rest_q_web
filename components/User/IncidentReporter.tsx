"use client";

import React, { useState } from 'react';
import { 
  AlertTriangle, 
  MapPin, 
  X, 
  ShieldAlert, 
  Activity, 
  Flame,
  Hospital,
  ChevronRight,
  Clock
} from 'lucide-react';
import { Button } from '../UI/Button';
import { toast } from 'sonner';

interface IncidentReporterProps {
  onClose: () => void;
  onReport: (data: any) => void;
}

export const IncidentReporter = ({ onClose, onReport }: IncidentReporterProps) => {
  const [step, setStep] = useState<1 | 2>(1); // 1: Select Type, 2: Pinpoint & Details
  const [type, setType] = useState<string | null>(null);
  const [riskData, setRiskData] = useState<{ risk: 'High' | 'Low', time: number } | null>(null);

  const incidentTypes = [
    { id: 'accident', label: 'Road Accident', icon: <Activity className="w-5 h-5" />, color: 'bg-orange-500' },
    { id: 'fire', label: 'Fire Incident', icon: <Flame className="w-5 h-5" />, color: 'bg-red-500' },
    { id: 'health', label: 'Medical Emergency', icon: <Hospital className="w-5 h-5" />, color: 'bg-rose-500' },
    { id: 'hazard', label: 'Road Hazard', icon: <AlertTriangle className="w-5 h-5" />, color: 'bg-amber-500' },
  ];

  const handleTypeSelect = (id: string) => {
    setType(id);
    setStep(2);
    // Simulate risk classification logic (Requirement 1.10)
    const randomTime = Math.floor(Math.random() * 40) + 5;
    setRiskData({
      risk: randomTime > 20 ? 'High' : 'Low',
      time: randomTime
    });
  };

  const handleSubmit = () => {
    toast.success("Emergency report broadcasted to nearest facilities!");
    onReport({ type, riskData });
    onClose();
  };

  return (
    <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-8 duration-500 font-inter">
      {/* Header */}
      <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center animate-pulse">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-black text-lg tracking-tight">Emergency Report</h3>
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Priority channel active</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-8">
        {step === 1 ? (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Select Incident Type</h4>
              <div className="grid grid-cols-2 gap-3">
                {incidentTypes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleTypeSelect(t.id)}
                    className="flex flex-col items-center gap-3 p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl hover:border-primary/20 hover:bg-white transition-all group active:scale-95"
                  >
                    <div className={`w-12 h-12 ${t.color} text-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      {t.icon}
                    </div>
                    <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Risk Classification (Requirement 1.10) */}
            {riskData && (
              <div className={`p-4 rounded-2xl border-2 flex items-center gap-4 ${
                riskData.risk === 'High' ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'
              }`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  riskData.risk === 'High' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
                }`}>
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${
                    riskData.risk === 'High' ? 'text-red-500' : 'text-emerald-600'
                  }`}>Risk Level: {riskData.risk}</p>
                  <p className="text-sm font-bold text-slate-900 leading-tight">
                    Estimated response: <span className="text-primary">{riskData.time} mins</span>
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Pinpointed Location</span>
                </div>
                <p className="text-sm font-bold text-slate-900">Ayala Blvd, Ermita, Manila, 1000 Metro Manila</p>
                <p className="text-[10px] font-mono text-slate-400 mt-1">LAT: 14.5888 / LNG: 120.9842</p>
              </div>

              <div className="p-4 bg-primary/5 border-2 border-primary/10 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Optimized Route</p>
                    <p className="text-xs font-bold text-slate-900">Traffic-adjusted response</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-primary/30" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => setStep(1)}>Back</Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20" onClick={handleSubmit}>Broadcast Report</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
