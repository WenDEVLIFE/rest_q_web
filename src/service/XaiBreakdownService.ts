import type { RouteTelemetry } from './RouteXAI_Service';

export type XaiBreakdownContext = 'route' | 'prone_area';

// ---------------------------------------------------------------------------
// Strict input schemas — replaces permissive `any` at every call site.
// ---------------------------------------------------------------------------

/** Shape of raw data passed from the route planner / map into XaiBreakdown. */
export interface RouteXaiInputData {
  /** Full ML telemetry model from RouteXAIService (may be absent). */
  model?: RouteTelemetry | null;
  /** Route distance in km (alias: distKm). */
  dist?: number;
  distKm?: number;
  /** Canonical ETA from the route engine in minutes. */
  etaMinutes?: number;
  /** Inferred traffic level from segment analysis. */
  traffic?: 'low' | 'moderate' | 'heavy';
  /** Whether an active incident overlaps the route. */
  incident?: boolean;
  /** Number of visible road segments at the time of request. */
  visibleRoads?: number;
  /** Number of active reported incidents in context. */
  reportedIncidents?: number;
  /** Number of active prone areas in context. */
  proneAreas?: number;
}

/** Shape of raw data passed from prone-area markers into XaiBreakdown. */
export interface ProneAreaXaiInputData {
  riskScore?: number;
  confidence?: number;
  radius?: number;
  status?: string;
  category?: string;
}

export interface RouteXaiBreakdownState {
  routeModel: RouteTelemetry | null;

  routeDistanceKm: number;
  canonicalEtaMinutes: number;
  routeTraffic: 'low' | 'moderate' | 'heavy';
  routeHasIncident: boolean;
  baselineMinutes: number;
  congestionPenalty: number;
  hazardPenalty: number;
  topologyPenalty: number;
  syntheticReliability: number;
  resolvedEtaMinutes: number;
  defaultQuestion: string;
  aiPayload: Record<string, unknown>;
}

export interface ProneAreaXaiBreakdownState {
  proneAreaRiskScore: number;
  proneAreaConfidence: number;
  proneAreaRadius: number;
  proneAreaStatus: string;
  proneAreaCategory: string;
  proneAreaStability: number;
  proneAreaSeverityIndex: number;
  categoryWeight: number;
  defaultQuestion: string;
}

export class XaiBreakdownService {
  static buildRouteState(data: RouteXaiInputData): RouteXaiBreakdownState {

    const routeModel = data?.model ?? null;
    const routeDistanceKm = Number(data?.dist ?? data?.distKm ?? routeModel?.totalDistanceKm ?? 0);
    const canonicalEtaMinutes = Number(data?.etaMinutes ?? routeModel?.estimatedMinutes ?? 0);
    const routeTraffic = (data?.traffic || 'moderate') as 'low' | 'moderate' | 'heavy';
    const routeHasIncident = Boolean(data?.incident);

    const baselineMinutes = routeDistanceKm > 0 ? routeDistanceKm * 2.5 : 0;
    const congestionPenalty = routeTraffic === 'low' ? 1.4 : routeTraffic === 'moderate' ? 4.1 : 8.3;
    const hazardPenalty = routeHasIncident ? 5.4 : 0;
    const topologyPenalty = routeModel
      ? Math.min(
          24,
          (routeModel.graphFrictionIndex / Math.max(routeModel.totalDistanceKm || 0.5, 0.5)) * 6
        )
      : 0;

    const resolvedEtaMinutes = Math.max(0, Math.round(canonicalEtaMinutes || 0));
    const syntheticReliability = routeModel?.reliabilityIndex ?? Number((Math.max(0, 1 - (congestionPenalty + hazardPenalty) / 22)).toFixed(3));

    const modelPayload = routeModel
      ? {
          totalDistanceKm: routeModel.totalDistanceKm,
          estimatedMinutes: routeModel.estimatedMinutes,
          trafficEntropy: routeModel.trafficEntropy,
          graphFrictionIndex: routeModel.graphFrictionIndex,
          spectralCongestionEnergy: routeModel.spectralCongestionEnergy,
          reliabilityIndex: routeModel.reliabilityIndex,
          segmentCount: routeModel.segmentCount,
          statusBreakdownKm: routeModel.statusBreakdownKm,
          formulas: routeModel.formulas,
          segments: routeModel.segments,
        }
      : null;

    const aiPayload = {
      context: 'route',
      timestamp: new Date().toISOString(),
      telemetry: {
        distanceKm: routeDistanceKm,
        etaMinutes: canonicalEtaMinutes,
        trafficClass: routeTraffic,
        incidentFlag: routeHasIncident,
        baselineMinutes,
        congestionPenalty,
        hazardPenalty,
        topologyPenalty,
        syntheticReliability,
      },
      model: modelPayload,
    };

    return {
      routeModel,
      routeDistanceKm,
      canonicalEtaMinutes,
      routeTraffic,
      routeHasIncident,
      baselineMinutes,
      congestionPenalty,
      hazardPenalty,
      topologyPenalty,
      syntheticReliability,
      resolvedEtaMinutes,
      defaultQuestion: 'Explain why this route is selected and how congestion, entropy, and friction affect ETA.',
      aiPayload,
    };
  }

  static buildProneAreaState(data: ProneAreaXaiInputData): ProneAreaXaiBreakdownState {

    const proneAreaRiskScore = Number(data?.riskScore ?? 0);
    const proneAreaConfidence = Number(data?.confidence ?? 0);
    const proneAreaRadius = Number(data?.radius ?? 0);
    const proneAreaStatus = String(data?.status ?? 'Unfixed');
    const proneAreaCategory = String(data?.category ?? 'Flood');
    const categoryWeight = proneAreaCategory === 'Flood' ? 0.82 : proneAreaCategory === 'Fire' ? 0.75 : 0.64;

    const proneAreaStability = Number(
      Math.max(0, Math.min(1, (proneAreaConfidence / 100) * (proneAreaStatus === 'Fixed' ? 0.9 : 0.72))).toFixed(3)
    );
    const proneAreaSeverityIndex = Number(
      Math.max(0, Math.min(10, proneAreaRiskScore + (proneAreaRadius / 1000) * 1.5 + (proneAreaStatus === 'Unfixed' ? 0.8 : 0.2))).toFixed(2)
    );

    return {
      proneAreaRiskScore,
      proneAreaConfidence,
      proneAreaRadius,
      proneAreaStatus,
      proneAreaCategory,
      proneAreaStability,
      proneAreaSeverityIndex,
      categoryWeight,
      defaultQuestion: 'Explain why this prone area is classified high risk and what changes it to moderate.',
    };
  }
}
