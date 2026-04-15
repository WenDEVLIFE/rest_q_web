"use client";

import React, { useMemo, useState } from 'react';
import { 
  Zap, 
  X, 
  Activity, 
  Map as MapIcon, 
  ShieldCheck, 
  MessageSquare,
  Send,
  Loader2,
  Sigma,
  Binary,
  BrainCircuit
} from 'lucide-react';
import { AIService, type AIWeatherCondition } from '../../src/service/AI_Service';
import { XaiBreakdownService, type RouteXaiInputData, type ProneAreaXaiInputData } from '../../src/service/XaiBreakdownService';
import { TelemetryNormalizationService } from '../../src/service/TelemetryNormalizationService';


type XaiBreakdownProps =
  | { isOpen: boolean; onClose: () => void; context: 'route'; data: RouteXaiInputData }
  | { isOpen: boolean; onClose: () => void; context: 'prone_area'; data: ProneAreaXaiInputData };

export function XaiBreakdown({ isOpen, onClose, context, data }: XaiBreakdownProps) {
  const [question, setQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiCredits, setAiCredits] = useState<number | null>(null);
  const [isAskingAi, setIsAskingAi] = useState(false);

  const routeState = useMemo(
    () => (context === 'route' ? XaiBreakdownService.buildRouteState(data as RouteXaiInputData) : null),
    [context, data]
  );

  const proneAreaState = useMemo(
    () => (context === 'prone_area' ? XaiBreakdownService.buildProneAreaState(data as ProneAreaXaiInputData) : null),
    [context, data]
  );

  // Narrow typed references for context-specific fields.
  const routeData = context === 'route' ? (data as RouteXaiInputData) : null;
  const proneData = context === 'prone_area' ? (data as ProneAreaXaiInputData) : null;

  const routeModel = routeState?.routeModel ?? null;
  const routeDistanceKm = routeState?.routeDistanceKm ?? 0;
  const canonicalEtaMinutes = routeState?.canonicalEtaMinutes ?? 0;
  const routeTraffic = routeState?.routeTraffic ?? 'moderate';
  const routeHasIncident = routeState?.routeHasIncident ?? false;
  const baselineMinutes = routeState?.baselineMinutes ?? 0;
  const congestionPenalty = routeState?.congestionPenalty ?? 0;
  const hazardPenalty = routeState?.hazardPenalty ?? 0;
  const topologyPenalty = routeState?.topologyPenalty ?? 0;
  const resolvedEtaMinutes = routeState?.resolvedEtaMinutes ?? 0;
  const syntheticReliability = routeState?.syntheticReliability ?? 0;
  const proneAreaRiskScore = proneAreaState?.proneAreaRiskScore ?? 0;
  const proneAreaConfidence = proneAreaState?.proneAreaConfidence ?? 0;
  const proneAreaRadius = proneAreaState?.proneAreaRadius ?? 0;
  const proneAreaStatus = proneAreaState?.proneAreaStatus ?? 'Unfixed';
  const proneAreaCategory = proneAreaState?.proneAreaCategory ?? 'Flood';
  const proneAreaStability = proneAreaState?.proneAreaStability ?? 0;
  const proneAreaSeverityIndex = proneAreaState?.proneAreaSeverityIndex ?? 0;
  const categoryWeight = proneAreaState?.categoryWeight ?? 0;
  const aiWeatherCondition: AIWeatherCondition = context === 'route'
    ? routeTraffic === 'low'
      ? 'clear'
      : routeTraffic === 'moderate'
        ? 'rainy'
        : 'typhoon'
    : 'clear';

  const defaultQuestion = routeState?.defaultQuestion ?? proneAreaState?.defaultQuestion ?? '';

  const normalizedTelemetry = useMemo(() => {
    if (context === 'route' && routeState) {
      return TelemetryNormalizationService.normalizeRoute({
        routeDistanceKm,
        canonicalEtaMinutes,
        routeTraffic,
        routeHasIncident,
        baselineMinutes,
        congestionPenalty,
        hazardPenalty,
        topologyPenalty,
        syntheticReliability,
      });
    }

    if (context === 'prone_area' && proneAreaState) {
      return TelemetryNormalizationService.normalizeProneArea({
        riskScore: proneAreaRiskScore,
        confidence: proneAreaConfidence,
        radius: proneAreaRadius,
        status: proneAreaStatus,
        category: proneAreaCategory,
        stability: proneAreaStability,
        severityIndex: proneAreaSeverityIndex,
        categoryWeight,
      });
    }

    return null;
  }, [baselineMinutes, canonicalEtaMinutes, categoryWeight, congestionPenalty, context, hazardPenalty, proneAreaCategory, proneAreaConfidence, proneAreaRadius, proneAreaRiskScore, proneAreaSeverityIndex, proneAreaState, proneAreaStability, proneAreaStatus, routeDistanceKm, routeHasIncident, routeState, routeTraffic, syntheticReliability, topologyPenalty]);

  const aiPayload = useMemo(() => {
    if (context === 'route' && routeState) {
      return {
        ...routeState.aiPayload,
        normalizedTelemetry,
      };
    }

    return {
      context,
      timestamp: new Date().toISOString(),
      telemetry: normalizedTelemetry,
    };
  }, [context, normalizedTelemetry, routeState]);

  const askAi = async () => {
    setIsAskingAi(true);
    try {
      const apiKey = typeof window !== 'undefined' ? localStorage.getItem('resq_ai_api_key') || undefined : undefined;
      const prompt = [
        'You are an emergency routing analyst AI. Use all telemetry and model values below.',
        'Respond in plain text only.',
        'Do not use markdown, headings, bullets, numbering, code blocks, or special formatting symbols.',
        'Give a direct technical explanation followed by a practical recommendation in normal sentences.',
        `Question: ${question.trim() || defaultQuestion}`,
        `Data JSON: ${JSON.stringify(aiPayload)}`,
      ].join('\n');

      const response = await AIService.askAI(prompt, apiKey, {
        activeTrafficSegments: Number(routeData?.visibleRoads ?? routeModel?.segmentCount ?? 0),
        reportedIncidents: Number(routeData?.reportedIncidents ?? 0),
        proneAreas: Number(routeData?.proneAreas ?? 0),
        weatherCondition: aiWeatherCondition,
        avgResponseTime: Number(canonicalEtaMinutes || 0),
      });

      setAiAnswer(response.answer || 'No AI response available.');
      setAiCredits(response.credits_used ?? null);
    } catch (error) {
      setAiAnswer('AI request failed. Verify your microservice key and endpoint, then retry.');
      setAiCredits(null);
      console.error('XAI AI chat failed:', error);
    } finally {
      setIsAskingAi(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col border border-slate-100 animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/20">
                <Zap className="w-6 h-6 text-amber-400" />
             </div>
             <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">ML Analytical Breakdown</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Structured Logic Attribution + AI Cross-Examination</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-12">
          
          {/* 1. Global Formula */}
          <section>
             <div className="flex items-center gap-3 mb-6">
                <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Active Algorithm</h4>
             </div>
             <div className="p-8 bg-slate-900 rounded-[32px] text-white overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <Activity className="w-24 h-24" />
                </div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">
                  {context === 'route' ? 'Route ETA Engine (v2.4)' : 'Multivariate R-Score'}
                </p>
                <code className="block text-2xl font-mono font-bold leading-relaxed">
                  {context === 'route' 
                    ? 'T = canonical_eta(route_payload)' 
                    : 'R = (αH + βS + γ/V) / N'}
                </code>
             </div>
          </section>

          {/* 1.1 Core Metrics */}
          {context === 'route' ? (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Core Model Metrics</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard icon={<Sigma className="w-4 h-4" />} label="Graph Friction" value={routeModel ? routeModel.graphFrictionIndex : Number(topologyPenalty.toFixed(2))} sub="F = Σ distance * congestion" />
                <MetricCard icon={<Activity className="w-4 h-4" />} label="Traffic Entropy" value={routeModel ? routeModel.trafficEntropy : 0} sub="H = -Σ p log2 p" />
                <MetricCard icon={<Binary className="w-4 h-4" />} label="Spectral Energy" value={routeModel ? routeModel.spectralCongestionEnergy : 0} sub="E = Σ |DFT(w)|² / N" />
                <MetricCard icon={<ShieldCheck className="w-4 h-4" />} label="Reliability Index" value={syntheticReliability} sub="1 = stable, 0 = unstable" />
                <MetricCard icon={<MapIcon className="w-4 h-4" />} label="Route Distance" value={Number(routeDistanceKm.toFixed(3))} sub="Kilometers" />
                <MetricCard icon={<BrainCircuit className="w-4 h-4" />} label="Segment Count" value={routeModel?.segmentCount ?? 0} sub="Graph edges" />
              </div>
            </section>
          ) : (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Core Model Metrics</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard icon={<Activity className="w-4 h-4" />} label="Risk Score" value={proneAreaRiskScore} sub="0 to 10 scale" />
                <MetricCard icon={<ShieldCheck className="w-4 h-4" />} label="Confidence" value={proneAreaConfidence} sub="Prediction confidence %" />
                <MetricCard icon={<MapIcon className="w-4 h-4" />} label="Impact Radius" value={proneAreaRadius} sub="Meters" />
                <MetricCard icon={<Sigma className="w-4 h-4" />} label="Severity Index" value={proneAreaSeverityIndex} sub="Composite severity" />
                <MetricCard icon={<Binary className="w-4 h-4" />} label="Zone Stability" value={proneAreaStability} sub="0 unstable to 1 stable" />
                <MetricCard icon={<BrainCircuit className="w-4 h-4" />} label="Category Weight" value={proneAreaCategory === 'Flood' ? 0.82 : proneAreaCategory === 'Fire' ? 0.75 : 0.64} sub={`${proneAreaCategory} profile`} />
              </div>
            </section>
          )}

          {/* 2. Step by Step Deduction */}
          <section>
             <div className="flex items-center gap-3 mb-8">
                <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Calculations Table</h4>
             </div>

             <div className="space-y-4">
                {context === 'route' ? (
                  <>
                    <StepItem 
                      step="1" 
                      label="Spatial Baseline (D * K)" 
                      formula={`${routeDistanceKm.toFixed(1)}km * 2.5 min/km`}
                      result={`${baselineMinutes.toFixed(1)} mins`}
                      desc="Distance multiplied by the urban speed constant."
                    />
                    <StepItem 
                      step="2" 
                      label="Traffic Weight (Σ W*T)" 
                      formula={`${routeTraffic === 'low' ? '0.12' : routeTraffic === 'moderate' ? '0.55' : '0.85'} coefficient`}
                      result={`+${congestionPenalty.toFixed(1)} mins`}
                      desc="Derived from XLSX hourly volume records."
                    />
                    <StepItem 
                      step="3" 
                      label="Hazard Penalty (Φ)" 
                      formula="Flood Intersection (eps=500m)"
                      result={`+${hazardPenalty.toFixed(1)} mins`}
                      desc="Penalties applied for incidents on the active path."
                    />
                    <StepItem 
                      step="4" 
                      label="Topological Friction (Ψ)" 
                      formula="Σ(distanceᵢ * (wᵢ + 0.35 * curvatureᵢ))"
                      result={`+${topologyPenalty.toFixed(1)} mins`}
                      desc="Captures non-linear turns, edge oscillation, and route shape complexity."
                    />
                  </>
                ) : (
                  <>
                    <StepItem 
                      step="1" 
                      label="Historical Frequency (αH)" 
                      formula="XLS Baseline (2025-2026)"
                      result="0.45 weight"
                      desc="How often this spot hits in our KML/Excel logs."
                    />
                    <StepItem 
                      step="2" 
                      label="Real-time Severity (βS)" 
                      formula={`${proneAreaStatus === 'Unfixed' ? 'High' : 'Low'} Reports`}
                      result="0.35 weight"
                      desc="Live reports from users in the last 24 hours."
                    />
                    <StepItem 
                      step="3" 
                      label="Velocity Variance (γ/V)" 
                      formula="Avg Speed < 15kph"
                      result="0.20 weight"
                      desc="Detected slow-down via VEHICLE SPEED.kml."
                    />
                  </>
                )}

                <div className="mt-12 p-8 bg-indigo-50 border-2 border-indigo-100 rounded-[32px] flex items-center justify-between">
                   <div>
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Final Result</p>
                      <p className="text-3xl font-black text-slate-900">
                         {context === 'route' ? (resolvedEtaMinutes > 0 ? `${resolvedEtaMinutes} min` : 'ETA unavailable') : 'High Risk (8.2)'}
                      </p>
                      {context === 'route' && (
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mt-2">
                          ETA Source: {canonicalEtaMinutes > 0 ? `${canonicalEtaMinutes} min` : 'No canonical route ETA provided'}
                        </p>
                      )}
                   </div>
                   <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-indigo-100 shadow-sm">
                      <ShieldCheck className="w-8 h-8 text-indigo-600" />
                   </div>
                </div>
             </div>
          </section>

          <section className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 space-y-5">
            <div className="flex items-center gap-3 text-slate-600">
              <MessageSquare className="w-4 h-4" />
              <h4 className="text-[10px] font-black uppercase tracking-widest">Ask AI About This Route/Proof</h4>
            </div>

            <div className="space-y-3">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={defaultQuestion}
                className="w-full min-h-[100px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setQuestion('Give me the full ETA derivation using segment-level speed and congestion weights.')}
                  className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600"
                >
                  ETA Derivation
                </button>
                <button
                  onClick={() => setQuestion('Compare this route against a hypothetical low-traffic route and explain tradeoffs.')}
                  className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600"
                >
                  Counterfactual
                </button>
                <button
                  onClick={() => setQuestion('Explain entropy, friction, and spectral energy in plain language and in formula form.')}
                  className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600"
                >
                  Explain Metrics
                </button>
              </div>
              <button
                onClick={askAi}
                disabled={isAskingAi}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-60"
              >
                {isAskingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Ask AI with Full Telemetry
              </button>
            </div>

            {(aiAnswer || isAskingAi) && (
              <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/60">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-2">AI Output {aiCredits !== null ? `• Credits ${aiCredits}` : ''}</p>
                <p className="text-sm font-bold text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {isAskingAi ? 'Analyzing telemetry and generating explanation...' : aiAnswer}
                </p>
              </div>
            )}
          </section>

           {/* 3. Operational Notes */}
           <section className="bg-slate-50 p-8 rounded-[32px] border border-slate-100">
             <div className="flex items-center gap-3 mb-4 text-slate-400">
               <MapIcon className="w-4 h-4" />
               <h4 className="text-[10px] font-black uppercase tracking-widest">Operational Notes</h4>
             </div>
             <p className="text-sm font-bold text-slate-600 leading-relaxed">
               Route proof now includes multi-segment telemetry, congestion entropy, graph friction, and a spectral stress signal. Every detail shown in this modal is included in the AI request payload so the model can reason directly from route data.
             </p>
           </section>

        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-center shrink-0">
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic flex items-center gap-2">
             <Zap className="w-3 h-3" /> Res-Q Neural Processing • RT-V2.5 
           </p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number; sub: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between mb-2 text-slate-500">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-2xl font-black text-slate-900 mb-1">{Number(value.toFixed(3))}</p>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{sub}</p>
    </div>
  );
}

function StepItem({ step, label, formula, result, desc }: any) {
  return (
    <div className="flex gap-6 items-start group">
       <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-black shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-colors">
         {step}
       </div>
       <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
             <h5 className="text-sm font-black text-slate-900 uppercase tracking-tight">{label}</h5>
             <span className="text-xs font-black text-indigo-600 font-mono">{result}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 font-mono uppercase">
             <span>Formula:</span>
             <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{formula}</span>
          </div>
          <p className="text-[11px] font-bold text-slate-500 leading-relaxed">{desc}</p>
       </div>
    </div>
  );
}
