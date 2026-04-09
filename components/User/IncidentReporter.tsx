"use client";

import React, { useState } from 'react';
import {
  AlertTriangle,
  MapPin,
  X,
  ShieldAlert,
  Flame,
  Hospital,
  ChevronRight,
  Clock,
  Car,
  Plus,
  RadioReceiver
} from 'lucide-react';
import { Button } from '../UI/Button';
import { toast } from 'sonner';

interface IncidentReporterProps {
  onClose: () => void;
  onReport: (data: any) => void;
  reportPin?: { lat: number; lng: number } | null;
}

export const IncidentReporter = ({ onClose, onReport, reportPin }: IncidentReporterProps) => {
  // 0: Feed, 1: Select Type, 2: Pinpoint & Details
  const [step, setStep] = useState<0 | 1 | 2>(0); 
  const [type, setType] = useState<string | null>(null);
  const [riskData, setRiskData] = useState<{ risk: 'High' | 'Low', time: number } | null>(null);

  const incidentTypes = [
    { id: 'accident', label: 'Vehicle Accident', desc: 'Car crashes, pile-ups', icon: <Car className="w-6 h-6" />, color: 'bg-orange-500 shadow-orange-500/20' },
    { id: 'fire', label: 'Fire Incident', desc: 'Structural or wild fires', icon: <Flame className="w-6 h-6" />, color: 'bg-red-500 shadow-red-500/20' },
    { id: 'health', label: 'Medical Emergency', desc: 'Critical health situations', icon: <Hospital className="w-6 h-6" />, color: 'bg-rose-500 shadow-rose-500/20' },
    { id: 'hazard', label: 'Road Hazard', desc: 'Floods, debris, blocks', icon: <AlertTriangle className="w-6 h-6" />, color: 'bg-amber-500 shadow-amber-500/20' },
  ];

  // Mocked recently reported incidents feed
  const recentIncidents = [
    { id: 1, type: 'Fire Incident', status: 'Active', time: '2 mins ago', location: 'MacArthur Hwy, San Fernando', icon: <Flame className="w-4 h-4" />, color: 'text-red-600', bg: 'bg-red-100' },
    { id: 2, type: 'Vehicle Accident', status: 'Responding', time: '14 mins ago', location: 'NLEX Exit', icon: <Car className="w-4 h-4" />, color: 'text-orange-600', bg: 'bg-orange-100' },
    { id: 3, type: 'Road Hazard', status: 'Verifying', time: '1 hr ago', location: 'Capitol Blvd', icon: <AlertTriangle className="w-4 h-4" />, color: 'text-amber-600', bg: 'bg-amber-100' },
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
    toast.success("Emergency report broadcasted to nearest command centers!");
    onReport({ type, riskData });
    setStep(0); // Go back to feed
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 overflow-hidden font-inter border-r border-slate-200 shadow-2xl">
      {/* Sleek Header */}
      <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center relative">
            <div className="absolute inset-0 bg-red-400 rounded-2xl blur opacity-20 animate-pulse"></div>
            {step === 0 ? <RadioReceiver className="w-6 h-6 text-red-600 relative z-10" /> : <AlertTriangle className="w-6 h-6 text-red-600 relative z-10" />}
          </div>
          <div>
            <h3 className="font-black text-xl text-slate-900 tracking-tight">
              {step === 0 ? "Incident Reports" : "Emergency Alert"}
            </h3>
            <p className="text-[11px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
              Priority Channel Active
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
           <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        {step === 0 && (
          <div className="space-y-6 flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between px-1 mb-2">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Live Reports Feed</h4>
                <span className="text-[10px] font-bold text-slate-400">NEARBY</span>
              </div>
              
              {recentIncidents.map((incident) => (
                <div key={incident.id} className="p-4 bg-white border border-slate-200 rounded-[20px] shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                       <div className={`w-8 h-8 rounded-full ${incident.bg} ${incident.color} flex items-center justify-center`}>
                          {incident.icon}
                       </div>
                       <span className="text-sm font-black text-slate-900">{incident.type}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {incident.time}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 px-1 py-2 bg-slate-50 rounded-xl border border-slate-100">
                     <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 px-2">
                       <MapPin className="w-3.5 h-3.5" />
                       {incident.location}
                     </span>
                     <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                        incident.status === 'Active' ? 'bg-red-100 text-red-600' : 
                        incident.status === 'Responding' ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-600'
                     }`}>
                       {incident.status}
                     </span>
                  </div>
                </div>
              ))}
            </div>

            <Button 
               className="w-full h-14 rounded-[16px] bg-red-600 hover:bg-red-700 shadow-xl shadow-red-600/20 text-sm uppercase tracking-widest font-black text-white shrink-0 group transition-all active:scale-[0.98]"
               onClick={() => setStep(1)}
            >
               <Plus className="w-5 h-5 mr-1 transition-transform group-hover:rotate-90 duration-300" />
               Report a New Incident
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div>
              <div className="flex items-center justify-between mb-4 px-1">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Select Incident Nature</h4>
                <span className="text-[10px] font-bold text-slate-300">Step 1 of 2</span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {incidentTypes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleTypeSelect(t.id)}
                    className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-[20px] hover:border-red-200 hover:shadow-lg transition-all group active:scale-[0.98] text-left"
                  >
                    <div className={`w-14 h-14 ${t.color} text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform shrink-0`}>
                      {t.icon}
                    </div>
                    <div>
                      <span className="block text-base font-black text-slate-900 group-hover:text-red-600 transition-colors">{t.label}</span>
                      <span className="block text-xs font-bold text-slate-400 mt-0.5">{t.desc}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 ml-auto group-hover:text-red-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="pt-2">
               <Button variant="ghost" className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-sm font-bold" onClick={() => setStep(0)}>
                 Cancel
               </Button>
            </div>
          </div>
        )}
        
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex items-center justify-between mb-4 px-1">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Location & Details</h4>
              <span className="text-[10px] font-bold text-slate-300">Step 2 of 2</span>
            </div>

            {/* Risk Classification (Requirement 1.10) */}
            {riskData && (
              <div className={`p-5 rounded-[24px] border-2 flex flex-col gap-4 relative overflow-hidden ${riskData.risk === 'High' ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'
                }`}>
                <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-40 ${riskData.risk === 'High' ? 'bg-red-400' : 'bg-emerald-400'}`}></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center shadow-md ${riskData.risk === 'High' ? 'bg-red-500 text-white shadow-red-500/30' : 'bg-emerald-500 text-white shadow-emerald-500/30'
                    }`}>
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${riskData.risk === 'High' ? 'text-red-600' : 'text-emerald-700'
                      }`}>AI Risk Assessment</p>
                    <p className="text-xl font-black text-slate-900 leading-none">
                      {riskData.risk} Severity Level
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className={`p-5 border-2 rounded-[24px] transition-all relative overflow-hidden ${reportPin ? 'bg-white border-emerald-200 shadow-xl shadow-emerald-500/5' : 'bg-white border-dashed border-amber-300'}`}>
                {reportPin && <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400 blur-[50px] opacity-10 rounded-full"></div>}
                <div className="flex items-center gap-3 mb-3 relative z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${reportPin ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600 animate-pulse'}`}>
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span className={`text-xs font-black uppercase tracking-widest ${reportPin ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {reportPin ? 'Coordinates Locked' : 'Awaiting Map Interaction'}
                  </span>
                </div>
                <div className="relative z-10">
                  {reportPin ? (
                    <>
                      <p className="text-base font-black text-slate-900">Custom User Coordinates</p>
                      <div className="flex items-center gap-4 mt-2">
                         <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                           <span className="text-[10px] font-bold text-slate-400 block mb-0.5">LATITUDE</span>
                           <span className="text-sm font-mono font-bold text-slate-700">{reportPin.lat.toFixed(6)}</span>
                         </div>
                         <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                           <span className="text-[10px] font-bold text-slate-400 block mb-0.5">LONGITUDE</span>
                           <span className="text-sm font-mono font-bold text-slate-700">{reportPin.lng.toFixed(6)}</span>
                         </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm font-bold text-slate-500 pr-4 leading-relaxed">
                      Please click anywhere on the live interactive map to the right to pinpoint the exact incident origin.
                    </p>
                  )}
                </div>
              </div>

              {riskData && (
                <div className="p-4 bg-white border border-slate-200 rounded-[20px] flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-[14px] flex items-center justify-center border border-blue-100">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Estimated Response</p>
                      <p className="text-sm font-bold text-slate-900"><span className="text-blue-600 font-black">{riskData.time} mins</span> ETA</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="ghost" className="shrink-0 px-6 bg-white border border-slate-200 hover:bg-slate-50" onClick={() => setStep(1)}>Back</Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 shadow-xl shadow-red-500/25 h-12 text-sm uppercase tracking-widest text-white rounded-xl font-bold"
                onClick={handleSubmit}
                disabled={!reportPin}
              >
                Broadcast Alert
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
