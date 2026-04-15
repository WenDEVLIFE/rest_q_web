"use client";

import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Play, 
  RefreshCw, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { Button } from '../UI/Button';
import { MLBadge } from '../UI/MLBadge';
import { toast } from 'sonner';
import { AdminHandler } from '../../src/agents/AdminDashboardAgent/AdminHandler';
import { RiskWeightTrainer, type OptimizedWeights } from '../../src/service/RiskWeightTrainer';
import { ConfidenceBandService } from '../../src/service/ConfidenceBandService';
import { Incident } from '../../src/types/incident';

export const MLModelTrainer = () => {
  const [trainingInProgress, setTrainingInProgress] = useState(false);
  const [trainedWeights, setTrainedWeights] = useState<OptimizedWeights | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const confidenceThresholds = ConfidenceBandService.defaultThresholds();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await AdminHandler.getIncidents();
        setIncidents(data);
      } catch (err) {
        toast.error('Failed to load incident data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleTrainModel = async () => {
    if (incidents.length < 10) {
      toast.error(`Need at least 10 incidents to train. Currently have ${incidents.length}.`);
      return;
    }

    setTrainingInProgress(true);
    try {
      const trainingData = RiskWeightTrainer.prepareTrainingData(incidents);
      const weights = await RiskWeightTrainer.trainWeights(trainingData);
      
      setTrainedWeights(weights);
      toast.success(`Model trained! Accuracy: ${weights.modelAccuracy}%`);
    } catch (err) {
      toast.error('Training failed');
      console.error(err);
    } finally {
      setTrainingInProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">R-Score Weight Optimizer</h3>
            <p className="text-[10px] font-bold text-slate-400">Train optimal weights from historical incidents</p>
          </div>
        </div>
        <MLBadge size="md" variant="solid" label="REGRESSION" />
      </div>

      {/* Data Info Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Available Incidents</p>
            <p className="text-2xl font-black text-slate-900">{incidents.length}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Training Status</p>
            <p className="text-sm font-bold text-slate-600">
              {incidents.length >= 10 ? '✓ Ready' : `⚠ Need ${10 - incidents.length} more`}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Last Training</p>
            <p className="text-sm font-bold text-slate-600">
              {trainedWeights ? trainedWeights.trainingDate.toLocaleDateString() : 'Never'}
            </p>
          </div>
        </div>
      </div>

      {/* Training Button */}
      <Button
        onClick={handleTrainModel}
        disabled={incidents.length < 10 || trainingInProgress}
        className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-2"
      >
        {trainingInProgress ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Training Model...
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            Train Risk Weights
          </>
        )}
      </Button>

      {/* Results */}
      {trainedWeights && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-black text-slate-900">Training Results</h4>
            <MLBadge size="sm" variant="solid" label="OPTIMIZED" />
          </div>
          {/* Accuracy Card */}
          {(() => {
            const accuracyBand = ConfidenceBandService.classify(trainedWeights.modelAccuracy, confidenceThresholds);
            const accuracyLabel = ConfidenceBandService.label(trainedWeights.modelAccuracy, confidenceThresholds);

            return (
          <div className={`border-2 rounded-2xl p-6 ${
            accuracyBand === 'high'
              ? 'bg-emerald-50 border-emerald-200'
              : accuracyBand === 'moderate'
              ? 'bg-amber-50 border-amber-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {accuracyBand === 'high' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                )}
                <span className="text-sm font-black text-slate-900">Model Accuracy</span>
              </div>
              <span className="text-right">
                <span className="block text-2xl font-black text-slate-900">{trainedWeights.modelAccuracy}%</span>
                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500">{accuracyLabel}</span>
              </span>
            </div>
            <p className="text-xs font-bold text-slate-600 leading-relaxed">
              {trainedWeights.recommendation}
            </p>
          </div>
            );
          })()}

          {/* Weights Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border-2 border-blue-200 rounded-xl p-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">α (Hazard)</p>
              <p className="text-2xl font-black text-blue-600">{trainedWeights.alpha.toFixed(2)}</p>
              <p className="text-[9px] font-bold text-slate-400 mt-1">Incident type severity</p>
            </div>
            <div className="bg-white border-2 border-amber-200 rounded-xl p-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">β (Congestion)</p>
              <p className="text-2xl font-black text-amber-600">{trainedWeights.beta.toFixed(2)}</p>
              <p className="text-[9px] font-bold text-slate-400 mt-1">Traffic impact weight</p>
            </div>
            <div className="bg-white border-2 border-purple-200 rounded-xl p-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">γ (Response)</p>
              <p className="text-2xl font-black text-purple-600">{trainedWeights.gamma.toFixed(2)}</p>
              <p className="text-[9px] font-bold text-slate-400 mt-1">Response time factor</p>
            </div>
          </div>

          {/* Training Data */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">Training Info</p>
            <div className="grid grid-cols-2 gap-3 text-xs font-bold text-slate-600">
              <div>Samples Used: {trainedWeights.samplesUsed}</div>
              <div>Date: {trainedWeights.trainingDate.toLocaleString()}</div>
            </div>
          </div>

          {/* Usage Note */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex gap-3">
            <TrendingUp className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div className="text-xs font-bold text-purple-700 leading-relaxed">
              These weights are now being used in the R-Score calculation for risk assessment. The model will dynamically adjust based on new incident data.
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!trainedWeights && !trainingInProgress && (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
          <Brain className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <h4 className="text-sm font-black text-slate-900 mb-2">No Trained Weights Yet</h4>
          <p className="text-xs font-bold text-slate-400 leading-relaxed max-w-xs mx-auto">
            Train a regression model on your incident history to optimize risk assessment weights.
          </p>
        </div>
      )}
    </div>
  );
};
