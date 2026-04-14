"use client";

import React from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  BrainCircuit, 
  Activity, 
  Car, 
  Droplets, 
  Zap, 
  ShieldCheck,
  ChevronRight,
  Info,
  Layers,
  Wind
} from 'lucide-react';

export default function IntelligenceHub() {
  return (
    <div className="min-h-screen bg-[#fcfcfd] font-inter text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-8 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
           <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white group-hover:bg-primary transition-colors">
              <ArrowLeft className="w-5 h-5" />
           </div>
           <span className="text-sm font-black uppercase tracking-widest text-slate-500">Back to Res-Q HQ</span>
        </Link>
        <div className="flex items-center gap-3">
           <BrainCircuit className="w-6 h-6 text-indigo-600 animate-pulse" />
           <span className="text-xl font-black tracking-tighter uppercase italic">Intelligence Hub</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-20">
        {/* Hero Section */}
        <div className="mb-24 text-center">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Zap className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Research-Grade Documentation</span>
           </div>
           <h1 className="text-6xl font-black tracking-tight text-slate-900 mb-6 leading-[1.05]">
             The Physics of <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-sky-500">Proactive Survival.</span>
           </h1>
           <p className="max-w-2xl mx-auto text-lg font-bold text-slate-400 leading-relaxed">
             Understanding the algorithms, telemetry fusion, and spatial mathematics that drive the Res-Q Emergency Engine.
           </p>
        </div>

        {/* Core Modules Grid */}
        <div className="space-y-32">
          
          {/* Module 1: The ETA Matrix */}
          <section id="eta-physics" className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
             <div className="space-y-8">
                <div className="w-16 h-16 bg-sky-100 text-sky-600 rounded-[28px] flex items-center justify-center shadow-xl shadow-sky-100/50">
                   <Clock className="w-8 h-8" />
                </div>
                <div>
                   <h2 className="text-4xl font-black tracking-tight mb-4">The Response Time Matrix</h2>
                   <p className="text-slate-500 font-bold leading-relaxed">
                     We don't just calculate distance. We calculate "Friction." In an urban environment like San Fernando, a 1km trip at 8:00 AM is mathematically different from a 1km trip at 2:00 PM.
                   </p>
                </div>

                <div className="p-8 bg-slate-900 rounded-[40px] text-white overflow-hidden relative group">
                   <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                      <Zap className="w-24 h-24" />
                   </div>
                   <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-4">Official Formula (T-Total)</p>
                   <code className="block text-2xl font-mono font-bold leading-relaxed mb-6">
                     T = (D * K) + Σ(W*T) + Φ + Ω
                   </code>
                   <div className="space-y-3">
                      <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                         <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                         <span><strong>(D * K)</strong>: Euclidean distance x Base velocity (2.5m/km)</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                         <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                         <span><strong>Σ(W*T)</strong>: Temporal congestion weights from XLSX models</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                         <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                         <span><strong>Φ (Phi)</strong>: Hazard Penalty Coefficient (+ flooded areas)</span>
                      </div>
                   </div>
                </div>

                <div className="bg-sky-50 p-8 rounded-[32px] border border-sky-100 relative overflow-hidden">
                   <div className="flex items-center gap-3 mb-4 text-sky-700">
                      <Layers className="w-5 h-5" />
                      <h4 className="text-sm font-black uppercase tracking-widest">The "Milkshake Straw" Analogy</h4>
                   </div>
                   <p className="text-sm font-bold text-sky-900/70 leading-relaxed italic">
                    "Think of a road like a straw. When the road is empty, it's like drinking water—it’s fast and easy. When there's heavy traffic, it’s like a thick milkshake—everything slows down. If there's a flood or fire, it’s like a piece of ice getting stuck in the straw. Our system figures out how 'thick' the milkshake is and finds a different straw."
                   </p>
                </div>
             </div>
             
             <div className="relative">
                <div className="bg-white p-10 rounded-[48px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] border border-slate-100 relative z-10 overflow-hidden">
                   <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-8">Scenario: Let's do the math simply</h4>
                   <div className="space-y-6">
                      <div className="p-4 bg-slate-50 rounded-2xl">
                         <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Step 1: The Distance</p>
                         <p className="text-xs font-bold text-slate-700">It's 4km from Dolores to Sindalan. At normal speed (60kph), that's 4 minutes.</p>
                      </div>
                      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                         <p className="text-[10px] font-black uppercase text-amber-600 mb-2">Step 2: Add Traffic</p>
                         <p className="text-xs font-bold text-slate-700">It's 5:00 PM (Rush Hour). Our system adds 6 minutes because the roads are full.</p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                         <p className="text-[10px] font-black uppercase text-blue-600 mb-2">Step 3: Add the Flood</p>
                         <p className="text-xs font-bold text-slate-700">There's water on the road (15cm). The car has to drive slow. Add 4.2 minutes.</p>
                      </div>
                      <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between">
                         <span className="text-sm font-black uppercase text-slate-400">Total Minutes</span>
                         <span className="text-2xl font-black text-indigo-600">14.2 min</span>
                      </div>
                   </div>
                </div>
                {/* Background Decor */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[120%] bg-gradient-to-br from-indigo-100/50 to-sky-100/50 blur-3xl -z-10 rounded-full opacity-50"></div>
             </div>
          </section>

          {/* Module 2: Prone Area Intelligence (DBSCAN) */}
          <section id="clustering" className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
             <div className="lg:order-last space-y-8">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-[28px] flex items-center justify-center shadow-xl shadow-emerald-100/50">
                   <Activity className="w-8 h-8" />
                </div>
                <div>
                   <h2 className="text-4xl font-black tracking-tight mb-4">Spotting the Crowd</h2>
                   <p className="text-slate-500 font-bold leading-relaxed">
                     One person saying there's a flood might be a mistake. Ten people saying it is a disaster. We use "Crowd Logic" to find where the real trouble is.
                   </p>
                </div>

                <div className="p-8 bg-emerald-900 rounded-[40px] text-white overflow-hidden relative group">
                   <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-4">How it works step-by-step</p>
                   <div className="space-y-4">
                      <div className="flex items-start gap-4">
                         <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 text-[10px] font-black">1</div>
                         <p className="text-xs font-bold text-emerald-100">Wait for at least 4 people to report an incident in the same spot.</p>
                      </div>
                      <div className="flex items-start gap-4">
                         <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 text-[10px] font-black">2</div>
                         <p className="text-xs font-bold text-emerald-100">Check if they are all within 500 meters (about a 5-minute walk) of each other.</p>
                      </div>
                      <div className="flex items-start gap-4">
                         <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 text-[10px] font-black">3</div>
                         <p className="text-xs font-bold text-emerald-100">If they are, the map turns that spot DARK RED. That's a Prone Area.</p>
                      </div>
                   </div>
                </div>

                <div className="bg-emerald-50 p-8 rounded-[32px] border border-emerald-100 relative overflow-hidden">
                   <div className="flex items-center gap-3 mb-4 text-emerald-700">
                      <ShieldCheck className="w-5 h-5" />
                      <h4 className="text-sm font-black uppercase tracking-widest">The "Group Chat" Analogy</h4>
                   </div>
                   <p className="text-sm font-bold text-emerald-900/70 leading-relaxed italic">
                    "It’s like a group chat. If only 1 person is typing, you might ignore it. But if the whole chat suddenly starts typing 'FLOOD!' at the same time, you know it’s for real. Our map just watches the 'typing' and highlights the chat when it gets too loud."
                   </p>
                </div>
             </div>

             <div className="relative">
                <div className="bg-slate-900 p-1 rounded-[48px] overflow-hidden shadow-2xl">
                   <div className="bg-slate-800 rounded-[44px] p-8 border border-white/5">
                      <h4 className="text-[10px] font-black uppercase text-emerald-400 tracking-[0.3em] mb-12 text-center">Neural Heatmap Visualization</h4>
                      <div className="h-64 relative flex items-center justify-center">
                         {/* Animated Pulsing Circles */}
                         <div className="absolute w-40 h-40 bg-emerald-500/20 rounded-full animate-ping"></div>
                         <div className="absolute w-24 h-24 bg-emerald-500/30 rounded-full animate-pulse"></div>
                         <div className="relative z-10 w-4 h-4 bg-emerald-400 rounded-full shadow-[0_0_20px_rgba(52,211,153,0.8)]"></div>
                         
                         {/* Coordinate Points Nodes */}
                         {[
                           { t: 'top-10', l: 'left-20' },
                           { t: 'bottom-20', l: 'right-10' },
                           { t: 'top-1/2', l: 'left-1/4' },
                           { t: 'bottom-1/3', l: 'right-1/4' },
                         ].map((pos, idx) => (
                           <div key={idx} className={`absolute ${pos.t} ${pos.l} w-1.5 h-1.5 bg-slate-500 rounded-full`}></div>
                         ))}
                      </div>
                      <div className="mt-8 text-center bg-white/5 p-4 rounded-2xl border border-white/5">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inference Result</p>
                         <p className="text-sm font-bold text-white uppercase mt-1">Hazard Swarm Detected: Sindalan Cluster</p>
                      </div>
                   </div>
                </div>
             </div>
          </section>

          {/* Module 3: Speed & Volume (KML Matrix) */}
          <section id="kml-fusion" className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center pb-20 border-b border-slate-100">
             <div className="space-y-8">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-[28px] flex items-center justify-center shadow-xl shadow-amber-100/50">
                   <Car className="w-8 h-8" />
                </div>
                <div>
                   <h2 className="text-4xl font-black tracking-tight mb-4">Traffic Spectral Dynamics</h2>
                   <p className="text-slate-500 font-bold leading-relaxed">
                     Your city is a living organ. Your roads are veins. By fusing KML spatial models with XLSX volume logs, we create a "Spectral Map" of how traffic flows under pressure.
                   </p>
                </div>

                <div className="space-y-4">
                   <div className="p-6 bg-white border border-slate-100 rounded-3xl flex items-center gap-6 group hover:shadow-lg transition-all">
                      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 font-black group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">KML</div>
                      <div>
                         <h4 className="text-sm font-black text-slate-900">Spatial Constriction</h4>
                         <p className="text-[11px] font-bold text-slate-400">Defines the maximum flow rate of each road based on Lane Capacity (L).</p>
                      </div>
                   </div>
                   <div className="p-6 bg-white border border-slate-100 rounded-3xl flex items-center gap-6 group hover:shadow-lg transition-all">
                      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 font-black group-hover:bg-sky-100 group-hover:text-sky-600 transition-colors">XLS</div>
                      <div>
                         <h4 className="text-sm font-black text-slate-900">Volumetric Pressure</h4>
                         <p className="text-[11px] font-bold text-slate-400">Determines current congestion (N) based on multi-thousand row historical logs.</p>
                      </div>
                   </div>
                </div>

                <div className="bg-amber-50 p-8 rounded-[32px] border border-amber-100 relative overflow-hidden">
                   <div className="flex items-center gap-3 mb-4 text-amber-700">
                      <Droplets className="w-5 h-5" />
                      <h4 className="text-sm font-black uppercase tracking-widest">The "Box and Toys" Analogy</h4>
                   </div>
                   <p className="text-sm font-bold text-amber-900/70 leading-relaxed italic">
                    "Think of a road like a toy box. The KML data tells us how BIG the box is. The XLSX data tells us how many TOYS (cars) are already inside. If the box is small and the toys are many, you can't fit any more in. Our system checks the box and the toys before the ambulance arrives, so it doesn't get stuck in the pile."
                   </p>
                </div>
             </div>

             <div className="bg-slate-50 p-2 rounded-[48px] border border-slate-200">
                <div className="bg-white rounded-[44px] p-10 shadow-sm border border-slate-100 h-full">
                   <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-12">Data Fusion Flow</h4>
                   <div className="space-y-12">
                      <div className="flex items-center gap-6">
                         <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-amber-500 animate-spin"></div>
                         <div>
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Processing Data...</span>
                            <span className="block text-sm font-black text-slate-900 uppercase">Synchronizing 12,542 Nodes</span>
                         </div>
                      </div>
                      
                      <div className="space-y-4">
                         <div className="flex justify-between text-xs font-black">
                            <span className="text-slate-900 uppercase italic">Inference Confidence</span>
                            <span className="text-sky-600 uppercase italic">98.4%</span>
                         </div>
                         <div className="w-full h-8 bg-slate-50 rounded-xl p-1 flex items-center gap-1">
                            {[...Array(20)].map((_, i) => (
                              <div key={i} className={`h-full flex-1 rounded-sm ${i < 18 ? 'bg-sky-500' : 'bg-slate-200'}`}></div>
                            ))}
                         </div>
                      </div>

                      <div className="p-6 bg-slate-900 rounded-3xl text-white">
                         <h5 className="text-[11px] font-black text-sky-400 uppercase mb-2">Algorithm Decision</h5>
                         <p className="text-xs font-bold leading-relaxed text-slate-300">"Route 7 restricted via KML constraints. Rerouting via capillary segment 12/G using XLS volume optimizations."</p>
                      </div>
                   </div>
                </div>
             </div>
          </section>
        </div>

        {/* Closing CTA */}
        <div className="mt-32 p-12 bg-gradient-to-br from-indigo-600 to-sky-500 rounded-[48px] text-white text-center shadow-2xl shadow-indigo-200 relative overflow-hidden group">
           <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
           <h2 className="text-3xl font-black mb-6 uppercase tracking-tight">Ready to see it in action?</h2>
           <p className="text-white/80 font-bold max-w-xl mx-auto mb-10 text-sm">
             These formulas run every 500ms on the Res-Q platform, ensuring that every second of your emergency is optimized for survival.
           </p>
           <Link href="/" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-all shadow-xl active:scale-95">
             Explore the Map <ChevronRight className="w-5 h-5" />
           </Link>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-100 py-12 px-8 text-center">
         <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Res-Q Project • RT-MANILA-CORE-V2 • Intelligence Hub • 2026</p>
      </footer>
    </div>
  );
}

function Clock(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
