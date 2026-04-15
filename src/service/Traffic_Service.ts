/**
 * TrafficService - Dynamic Traffic Data Integration
 * Provides real-time traffic intelligence for Res-Q routing
 * 
 * Source: Hybrid approach combining:
 * 1. Incident-based congestion (current open incidents)
 * 2. Time-based patterns (rush hour, time of day)
 * 3. Historical KML data (VEHICLE SPEED.kml from models)
 * 4. Weather impact (typhoon/rain slowdowns)
 */

import { Incident } from '../types/incident';

export interface TrafficSegment {
  name: string;
  path: [number, number][];
  status: 'fluid' | 'moderate' | 'heavy';
  speedKmh: number; // Average segment speed
  congestionLevel: number; // 0-1 scale
  confidence: number; // 0-1 ML confidence score
  source: 'incident' | 'historical' | 'pattern' | 'hybrid';
  lastUpdated: Date;
}

export interface TSREOptions {
  telemetryStatus?: 'live' | 'degraded' | 'offline';
  telemetryAgeMinutes?: number;
}

export interface TSREAnomalyReport {
  detected: boolean;
  reason?: 'per_km_outlier' | 'distance_ratio_outlier';
  rawMinutes: number;
  correctedMinutes: number;
}

export interface TSREResult {
  estimatedMinutes: number;
  confidence: number;
  anomaly?: TSREAnomalyReport;
}

export interface RouteEtaOptions extends TSREOptions {}

export interface RouteEtaAnomalyReport extends TSREAnomalyReport {}

export interface RouteEtaResult extends TSREResult {}

/**
 * Base thoroughfares for San Fernando with typical patterns
 */
const BASE_THOROUGHFARES = [
  {
    id: 'jas-ew', // Jose Abad Santos East-West
    name: 'Jose Abad Santos Ave (East-West)',
    path: [[15.0333, 120.6500], [15.0333, 120.7200]] as [number, number][],
    baseSpeedKmh: 35,
  },
  {
    id: 'mcarthur-north', // MacArthur Highway
    name: 'MacArthur Highway (Main North)',
    path: [[14.9800, 120.6898], [15.0286, 120.6898], [15.0800, 120.6898]] as [number, number][],
    baseSpeedKmh: 45,
  },
  {
    id: 'olongapo-gapan', // Olongapo-Gapan Road
    name: 'Olongapo-Gapan Road',
    path: [[15.0333, 120.6833], [15.1000, 120.8000]] as [number, number][],
    baseSpeedKmh: 40,
  },
  {
    id: 'aurora-blvd', // Aurora Boulevard
    name: 'Aurora Boulevard (North-South)',
    path: [[14.9800, 120.6500], [15.1200, 120.6500]] as [number, number][],
    baseSpeedKmh: 40,
  },
  {
    id: 'independence-ave', // Independence Avenue
    name: 'Independence Avenue (North-South)',
    path: [[14.9800, 120.7000], [15.1200, 120.7000]] as [number, number][],
    baseSpeedKmh: 38,
  },
];

export class TrafficService {
  /**
   * Get live traffic segments intelligent estimation
   * @param incidents Current open incidents for congestion analysis
   * @param weatherCondition Current weather ('clear', 'rainy', 'typhoon')
   * @returns Live traffic segments with dynamic speed/status
   */
  static async getLiveTraffic(
    incidents: Incident[] = [],
    weatherCondition: 'clear' | 'rainy' | 'typhoon' = 'clear'
  ): Promise<TrafficSegment[]> {
    const now = new Date();
    const hour = now.getHours();

    return BASE_THOROUGHFARES.map(road => {
      // 1. Calculate base speed reduction from time of day
      const timeMultiplier = this.getTimeMultiplier(hour);

      // 2. Calculate incident-based congestion
      const incidentMultiplier = this.getIncidentCongestion(road, incidents);

      // 3. Calculate weather impact
      const weatherMultiplier = this.getWeatherMultiplier(weatherCondition);

      // Combined speed factor
      const combinedMultiplier = timeMultiplier * incidentMultiplier * weatherMultiplier;
      const dynamicSpeedKmh = Math.max(5, road.baseSpeedKmh * combinedMultiplier);

      // Determine status from speed
      const speedRatio = dynamicSpeedKmh / road.baseSpeedKmh;
      const status: 'fluid' | 'moderate' | 'heavy' =
        speedRatio > 0.8 ? 'fluid' : speedRatio > 0.5 ? 'moderate' : 'heavy';

      // Congestion level (inverse of speed ratio)
      const congestionLevel = Math.max(0, Math.min(1, 1 - speedRatio));

      // Confidence based on data sources
      const confidence =
        incidents.length > 0 ? 0.92 : weatherCondition !== 'clear' ? 0.85 : 0.78;

      const source: 'incident' | 'historical' | 'pattern' | 'hybrid' =
        incidents.length > 0 ? 'incident' : weatherCondition !== 'clear' ? 'hybrid' : 'pattern';

      return {
        name: road.name,
        path: road.path,
        status,
        speedKmh: parseFloat(dynamicSpeedKmh.toFixed(1)),
        congestionLevel: parseFloat(congestionLevel.toFixed(2)),
        confidence: parseFloat(confidence.toFixed(2)),
        source,
        lastUpdated: new Date(),
      };
    });
  }

  /**
   * Calculate time-of-day traffic multiplier
   * Rush hour (7-9 AM, 5-7 PM) = 0.6x speed
   * Mid-day (11-3 PM) = 0.85x speed
   * Off-peak (9-11 AM, 3-5 PM, 7-11 PM) = 0.75x speed
   * Night (11 PM-7 AM) = 0.95x speed
   */
  private static getTimeMultiplier(hour: number): number {
    if ((hour >= 7 && hour < 9) || (hour >= 17 && hour < 19)) {
      return 0.60; // Heavy rush hour
    } else if ((hour >= 11 && hour < 15)) {
      return 0.85; // Light traffic mid-day
    } else if ((hour >= 9 && hour < 11) || (hour >= 15 && hour < 17) || (hour >= 19 && hour < 23)) {
      return 0.75; // Moderate off-peak
    } else {
      return 0.95; // Night time - mostly clear
    }
  }

  /**
   * Calculate incident-based congestion on a road segment
   * Incidents within 1km slow the route by 0.5-0.8x
   * Incidents within 2km slow by 0.7-0.9x
   */
  private static getIncidentCongestion(
    road: typeof BASE_THOROUGHFARES[0],
    incidents: Incident[]
  ): number {
    if (incidents.length === 0) return 1.0;

    // Calculate impact zone for each incident
    let totalSpeedMultiplier = 1.0;
    let impactCount = 0;

    incidents.forEach(incident => {
      // Distance from road center to incident
      const distToIncidentKm = this.distanceToRoad(
        incident.location.lat,
        incident.location.lng,
        road.path
      );

      if (distToIncidentKm < 2.0) {
        // Incident within 2km impact zone
        const impact =
          distToIncidentKm < 1.0
            ? 0.5 // Within 1km: severe slowdown
            : 0.7; // 1-2km: moderate slowdown

        totalSpeedMultiplier *= impact;
        impactCount++;
      }
    });

    return impactCount > 0 ? totalSpeedMultiplier : 1.0;
  }

  /**
   * Calculate weather impact on traffic
   * Clear: 1.0x (no impact)
   * Rainy: 0.85x (15% slowdown)
   * Typhoon: 0.50x (50% slowdown - dangerous, reduced speed for safety)
   */
  private static getWeatherMultiplier(condition: 'clear' | 'rainy' | 'typhoon'): number {
    const weatherMultipliers: Record<typeof condition, number> = {
      clear: 1.0,
      rainy: 0.85,
      typhoon: 0.50,
    };
    return weatherMultipliers[condition];
  }

  /**
   * Calculate minimum distance from point to a road path
   * Uses simplified distance calculation (point to line segment)
   */
  private static distanceToRoad(lat: number, lng: number, path: [number, number][]): number {
    if (path.length < 2) return 999;

    let minDistance = 999;

    for (let i = 0; i < path.length - 1; i++) {
      const p1 = path[i];
      const p2 = path[i + 1];
      const dist = this.distanceToLineSegmentKm(lat, lng, p1[0], p1[1], p2[0], p2[1]);
      minDistance = Math.min(minDistance, dist);
    }

    return minDistance;
  }

  /**
   * Haversine + perpendicular distance to line segment
   */
  private static distanceToLineSegmentKm(
    lat: number,
    lng: number,
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth radius in km

    // Convert to radians
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const λ1 = (lng1 * Math.PI) / 180;
    const λ2 = (lng2 * Math.PI) / 180;
    const φ = (lat * Math.PI) / 180;
    const λ = (lng * Math.PI) / 180;

    // Cross product distance
    const y = Math.sin(λ - λ1) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);

    const bearingRadians = Math.atan2(y, x);
    const distanceToLine = Math.asin(
      Math.sin(this.haversineDistance(lat1, lng1, lat, lng, R) / R) *
        Math.sin(bearingRadians)
    );

    return Math.abs(distanceToLine) * R;
  }

  /**
   * Haversine distance in km
   */
  private static haversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
    R: number = 6371
  ): number {
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calculate route ETA from live traffic segments.
   * The TSRE name is kept as a compatibility alias, but route-facing code should use this method.
   */
  static calculateRouteEta(
    distanceKm: number,
    trafficSegments: TrafficSegment[],
    incidentPresence: boolean = false,
    emergencyMode: boolean = false,
    groundTruthResponseMinutes: number[] = [],
    options: RouteEtaOptions = {}
  ): RouteEtaResult {
    // Base factors
    const K = 2.5; // min/km baseline
    const intersectionDelayFactor = 0.8; // Φ
    const signalDelayFactor = 1.2; // Ω
    const emergencyBonus = 0.7; // Emergency response bonus (30% faster)

    // Calculate weighted segment travel time
    let totalSegmentTime = 0;
    let totalWeight = 0;

    trafficSegments.forEach(segment => {
      const weight = 1 - segment.congestionLevel;
      const pathLength = this.calculatePathLengthKm(segment.path);
      const segmentTime = pathLength > 0 ? pathLength / segment.speedKmh : 0;

      totalSegmentTime += weight * segmentTime;
      totalWeight += weight;
    });

    const avgSegmentTime = totalWeight > 0 ? totalSegmentTime / totalWeight : K * distanceKm;

    // Calculate TSRE
    let tsreTime = distanceKm * K + avgSegmentTime + intersectionDelayFactor + signalDelayFactor;

    // Apply 30% speed bonus only for emergency vehicles.
    if (emergencyMode) {
      tsreTime *= emergencyBonus;
    }

    // Incident presence adds buffer for caution
    if (incidentPresence) {
      tsreTime *= 1.1;
    }

    // Calculate confidence (based on traffic data freshness and incident info)
    const telemetryStatus = options.telemetryStatus || 'live';
    const telemetryAgeMinutes = Math.max(0, Number(options.telemetryAgeMinutes ?? 0));
    const telemetryMissing = telemetryStatus === 'offline' || trafficSegments.length === 0;

    let avgConfidence = telemetryMissing
      ? this.getOfflineFallbackConfidence(distanceKm, incidentPresence, emergencyMode)
      : trafficSegments.reduce((sum, s) => sum + s.confidence, 0) / Math.max(1, trafficSegments.length);

    if (!telemetryMissing && telemetryStatus === 'degraded') {
      avgConfidence = Math.max(0.25, avgConfidence - 0.12);
    }

    if (!telemetryMissing && telemetryAgeMinutes > 0) {
      const stalenessPenalty = Math.min(0.22, telemetryAgeMinutes / 60 * 0.18);
      avgConfidence = Math.max(0.25, avgConfidence - stalenessPenalty);
    }

    const anomaly = this.detectAndCorrectEtaAnomaly(tsreTime, distanceKm);

    const calibratedConfidence = this.calibrateConfidenceFromGroundTruth(
      tsreTime,
      avgConfidence,
      groundTruthResponseMinutes
    );

    const anomalyPenalty = anomaly.detected ? 0.18 : 0;
    const finalConfidence = Math.max(0.05, Math.min(1, calibratedConfidence - anomalyPenalty));

    return {
      estimatedMinutes: Math.ceil(anomaly.correctedMinutes),
      confidence: Math.round(finalConfidence * 100),
      anomaly,
    };
  }

  /**
   * Compatibility wrapper for legacy TSRE call sites.
   */
  static calculateTSRE(
    distanceKm: number,
    trafficSegments: TrafficSegment[],
    incidentPresence: boolean = false,
    emergencyMode: boolean = false,
    groundTruthResponseMinutes: number[] = [],
    options: TSREOptions = {}
  ): TSREResult {
    return this.calculateRouteEta(
      distanceKm,
      trafficSegments,
      incidentPresence,
      emergencyMode,
      groundTruthResponseMinutes,
      options
    );
  }

  /**
   * Calibrate confidence using historical ground truth response-time samples.
   * If no ground truth exists, fall back to model-only confidence.
   */
  private static calibrateConfidenceFromGroundTruth(
    predictedMinutes: number,
    modelConfidence: number,
    groundTruthResponseMinutes: number[]
  ): number {
    const cleanGroundTruth = groundTruthResponseMinutes.filter((v) => Number.isFinite(v) && v > 0);
    if (cleanGroundTruth.length === 0) {
      return Math.max(0, Math.min(1, modelConfidence));
    }

    const mae =
      cleanGroundTruth.reduce((sum, actual) => sum + Math.abs(actual - predictedMinutes), 0) /
      cleanGroundTruth.length;

    const tolerance = Math.max(6, predictedMinutes * 0.4);
    const groundTruthFit = Math.max(0, 1 - Math.min(1, mae / tolerance));

    // Increase trust as sample size grows, capped to avoid overfitting confidence spikes.
    const sampleStrength = Math.min(1, Math.log1p(cleanGroundTruth.length) / Math.log1p(40));
    const blend = 0.3 + sampleStrength * 0.5;

    const calibrated = modelConfidence * (1 - blend) + groundTruthFit * blend;
    return Math.max(0, Math.min(1, calibrated));
  }

  private static getOfflineFallbackConfidence(
    distanceKm: number,
    incidentPresence: boolean,
    emergencyMode: boolean
  ): number {
    let confidence = 0.48;

    if (distanceKm <= 3) confidence += 0.08;
    else if (distanceKm <= 8) confidence += 0.04;

    if (incidentPresence) confidence -= 0.10;
    if (emergencyMode) confidence -= 0.04;

    return Math.max(0.2, Math.min(0.75, confidence));
  }

  private static detectAndCorrectEtaAnomaly(rawMinutes: number, distanceKm: number): TSREAnomalyReport {
    const safeDistanceKm = Math.max(0.5, distanceKm);
    const etaPerKm = rawMinutes / safeDistanceKm;
    const baselineMinutes = safeDistanceKm * 2.5;
    const ratio = rawMinutes / Math.max(1, baselineMinutes);

    let detected = false;
    let reason: TSREAnomalyReport['reason'] | undefined;

    if (etaPerKm > 9.5) {
      detected = true;
      reason = 'per_km_outlier';
    } else if (ratio > 3.6) {
      detected = true;
      reason = 'distance_ratio_outlier';
    }

    if (!detected) {
      return {
        detected: false,
        rawMinutes,
        correctedMinutes: rawMinutes,
      };
    }

    // Winsorize inflated ETA by blending with a bounded upper envelope.
    const boundedCap = baselineMinutes * 3.1 + 8;
    const correctedMinutes = Math.max(1, boundedCap + (rawMinutes - boundedCap) * 0.25);

    return {
      detected: true,
      reason,
      rawMinutes,
      correctedMinutes,
    };
  }

  /**
   * Calculate total path length in km from coordinate array
   */
  private static calculatePathLengthKm(path: [number, number][]): number {
    if (path.length < 2) return 0;
    
    let totalLength = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const dist = this.haversineDistance(path[i][0], path[i][1], path[i + 1][0], path[i + 1][1]);
      totalLength += dist;
    }
    return totalLength;
  }
}

// Export segment type with extended properties for calculations
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_OPEN_MAPTILER_API_KEY?: string;
    }
  }
}
