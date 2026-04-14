"use client";

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Key, 
  Cpu, 
  MessageSquare, 
  Zap, 
  ShieldCheck, 
  Save, 
  ExternalLink,
  Code
} from 'lucide-react';
import { Button } from '../UI/Button';
import { toast } from 'sonner';

export const SettingsView = () => {
  const [aiApiKey, setAiApiKey] = useState('3B3B01DC-ADBC-4293-86D5-97423360C4FC');
  const [isSaving, setIsSaving] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('resq_ai_api_key');
    if (savedKey) setAiApiKey(savedKey);
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      localStorage.setItem('resq_ai_api_key', aiApiKey);
      toast.success("API Settings updated successfully.");
      setIsSaving(false);
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 font-inter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase tracking-widest">System Settings</h2>
          </div>
          <p className="text-sm font-bold text-slate-400">Configure core AI microservices and cloud integrations.</p>
        </div>
        <Button 
          onClick={handleSave} 
          isLoading={isSaving}
          leftIcon={<Save className="w-4 h-4" />}
          className="rounded-2xl"
        >
          Save Configuration
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* AI Chat Configuration */}
        <div className="bg-white rounded-[32px] border-2 border-slate-100 p-8 shadow-sm hover:shadow-xl transition-all h-fit">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">AI Chat Assistant</h3>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest">Powered by Innovatech LLM</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">API License Key</label>
              <div className="relative group">
                <Key className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" />
                <input 
                  type="password" 
                  value={aiApiKey}
                  onChange={(e) => setAiApiKey(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all font-mono"
                  placeholder="Paste license key here..."
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <div className="flex items-center gap-2 mb-2 text-emerald-600">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Connection Active</span>
               </div>
               <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
                 License key is used to authenticate POST requests to innovatechservicesph.com for the LLM processing service.
               </p>
            </div>

            <a 
              href="https://innovatechservicesph.com/management" 
              target="_blank" 
              className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-primary transition-colors py-2"
            >
              Get license key <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Technical Details */}
        <div className="space-y-6">
           <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Cpu className="w-20 h-20" />
              </div>
              <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                 <Zap className="w-5 h-5 text-amber-400" />
                 Performance Metrics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Avg Latency</span>
                    <span className="text-xl font-black">1.2s</span>
                 </div>
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Credits Used</span>
                    <span className="text-xl font-black">242</span>
                 </div>
              </div>
           </div>

           <div className="bg-white border-2 border-slate-100 rounded-[32px] p-8">
              <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-widest text-sm">
                 <Code className="w-5 h-5 text-primary" />
                 API Specification
              </h3>
              <div className="space-y-4">
                 <div className="bg-slate-50 p-3 rounded-xl">
                    <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Endpoint</span>
                    <code className="text-[10px] font-mono font-bold text-primary break-all">innovatechservicesph.com/management/microservices.php?service=ai-chat</code>
                 </div>
                 <div className="bg-slate-50 p-3 rounded-xl">
                    <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Payload Format</span>
                    <code className="text-[10px] font-mono font-bold text-slate-600">{"{ \"api_key\": \"...\", \"question\": \"...\" }"}</code>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
