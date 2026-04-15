import type { RouteCongestionProfile, RouteCurvatureProfile, RouteUrbanDelayProfile, RouteSpeedProfile, TrafficStatus } from './RouteXAI_Service';

export interface RouteEtaBreakdown {
  baseTravelMinutes: number;
  trafficPenaltyMinutes: number;
  curvaturePenaltyMinutes: number;
  urbanDelayMinutes: number;
  totalMinutes: number;
}

const SPEED_BY_STATUS: Record<TrafficStatus, number> = {
  fluid: 44,
  moderate: 28,
  heavy: 16,
};

const WEIGHT_BY_STATUS: Record<TrafficStatus, number> = {
  fluid: 0.22,
  moderate: 0.56,
  heavy: 0.92,
};

export class RouteEtaBreakdownService {
  static calculate(
    totalDistanceKm: number,
    statusBreakdownKm: Record<TrafficStatus, number>,
    averageCurvature: number,
    speedProfile?: RouteSpeedProfile,
    congestionProfile?: RouteCongestionProfile,
    curvatureProfile?: RouteCurvatureProfile,
    urbanDelayProfile?: RouteUrbanDelayProfile
  ): RouteEtaBreakdown {
    const activeSpeedProfile = speedProfile || SPEED_BY_STATUS;
    const activeCongestionProfile = congestionProfile || WEIGHT_BY_STATUS;

    const dominantStatus: TrafficStatus =
      statusBreakdownKm.heavy > statusBreakdownKm.moderate
        ? 'heavy'
        : statusBreakdownKm.moderate > 0
          ? 'moderate'
          : 'fluid';

    const estimatedSpeeds = Object.entries(statusBreakdownKm).reduce((sum, [status, km]) => {
      const typedStatus = status as TrafficStatus;
      const segmentSpeed = activeSpeedProfile[typedStatus];
      const distanceKm = Math.max(0, km);
      return sum + (segmentSpeed > 0 ? (distanceKm / segmentSpeed) * 60 : 0);
    }, 0);

    const baseTravelMinutes = Math.max(0, estimatedSpeeds);
    const heavyShare = totalDistanceKm > 0 ? statusBreakdownKm.heavy / totalDistanceKm : 0;
    const moderateShare = totalDistanceKm > 0 ? statusBreakdownKm.moderate / totalDistanceKm : 0;

    const trafficPenaltyMinutes = totalDistanceKm * (
      activeCongestionProfile.fluid * 0.05 +
      activeCongestionProfile.moderate * moderateShare * 0.72 +
      activeCongestionProfile.heavy * heavyShare * 0.95
    );

    const curvaturePenaltyMinutes = totalDistanceKm * averageCurvature * (curvatureProfile?.turnPenaltyMultiplier ?? 1.1);

    const urbanDelayMinutes = Math.max(
      0,
      Math.min(
        urbanDelayProfile?.capDelayMinutes ?? 10,
        (urbanDelayProfile?.baseDelayMinutes ?? 1.5) +
          totalDistanceKm * (urbanDelayProfile?.distanceMultiplier ?? 0.22) +
          (dominantStatus === 'heavy' ? (urbanDelayProfile?.heavyTrafficBonusMinutes ?? 0) : 0)
      )
    );

    return {
      baseTravelMinutes,
      trafficPenaltyMinutes,
      curvaturePenaltyMinutes,
      urbanDelayMinutes,
      totalMinutes: Math.max(1, Math.round(baseTravelMinutes + trafficPenaltyMinutes + curvaturePenaltyMinutes + urbanDelayMinutes)),
    };
  }
}
