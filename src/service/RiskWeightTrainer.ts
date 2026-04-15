/**
 * RiskWeightTrainer - ML Model for R-Score Weight Optimization
 * 
 * Uses historical incident data to train optimal weights for the R-Score formula:
 * R = (α·H + β·S + γ/V) / N
 * 
 * Where:
 *   α = Hazard factor weight (incident type severity)
 *   β = Segment congestion weight (traffic impact)
 *   γ = Response time weight (inverse: faster response = lower risk)
 *   N = Normalization factor
 * 
 * Training approach:
 * - Collect historical incident data with response times
 * - Extract features: hazard_type, traffic_congestion, actual_response_time
 * - Perform linear regression to find α, β, γ that best predict historical outcomes
 * - Default fallback if insufficient data: α=0.4, β=0.35, γ=0.25
 */

import { Incident } from '../types/incident';

export interface RiskWeightTrainingData {
  incidentId: string;
  hazardFactor: number; // 0-1: fire=1.0, flood=0.8, accident=0.6
  segmentCongestion: number; // 0-1: heavy=1.0, moderate=0.6, fluid=0.2
  responseTimeMin: number; // Actual response time in minutes
  actuallyHighRisk: boolean; // Was this actually a high-risk incident?
  timestamp: Date;
}

export interface OptimizedWeights {
  alpha: number; // Hazard weight
  beta: number; // Congestion weight
  gamma: number; // Response time weight
  modelAccuracy: number; // 0-1 confidence in the trained model
  samplesUsed: number; // Number of incidents used for training
  trainingDate: Date;
  recommendation: string;
}

/**
 * Simple Linear Regression implementation for weight optimization
 * Solves: minimize sum((R_predicted - R_actual)^2)
 */
class LinearRegression {
  private X: number[][] = []; // Feature matrix
  private y: number[] = []; // Target values
  private weights: number[] = [0, 0, 0]; // α, β, γ

  addSample(hazard: number, congestion: number, responseTime: number, target: number) {
    this.X.push([hazard, congestion, 1 / (responseTime + 0.1)]); // Add inverse of response time
    this.y.push(target ? 1 : 0); // Target: 1 if high-risk, 0 otherwise
  }

  /**
   * Solve using Normal Equation: (X^T × X)^-1 × X^T × y
   * For numerical stability with small datasets
   */
  train(): { weights: number[]; accuracy: number } {
    if (this.X.length < 3) {
      return { weights: [0.4, 0.35, 0.25], accuracy: 0 };
    }

    // Normalize features to 0-1 scale
    const X_norm = this.normalizeFeatures();

    // Compute X^T × X
    const XTX = this.matrixMultiply(this.transpose(X_norm), X_norm);

    // Compute X^T × y
    const XTy = this.matrixVectorMultiply(this.transpose(X_norm), this.y);

    // Solve using Gaussian elimination (simplified)
    const I = this.inverse3x3(XTX);
    if (!I) {
      return { weights: [0.4, 0.35, 0.25], accuracy: 0 };
    }

    this.weights = this.matrixVectorMultiply(I, XTy);

    // Calculate R-squared (accuracy)
    const predictions = X_norm.map(row =>
      row[0] * this.weights[0] + row[1] * this.weights[1] + row[2] * this.weights[2]
    );

    const accuracy = this.calculateRSquared(this.y, predictions);

    return { 
      weights: this.weights.map(w => Math.max(0.1, Math.min(1, w))), // Clamp to valid range
      accuracy: Math.max(0, Math.min(1, accuracy))
    };
  }

  /**
   * Normalize each feature to 0-1 range
   */
  private normalizeFeatures(): number[][] {
    const normalized = this.X.map(row => [...row]);

    for (let col = 0; col < 3; col++) {
      const min = Math.min(...this.X.map(row => row[col]));
      const max = Math.max(...this.X.map(row => row[col]));
      const range = max - min || 1;

      for (let row = 0; row < normalized.length; row++) {
        normalized[row][col] = (this.X[row][col] - min) / range;
      }
    }

    return normalized;
  }

  /**
   * Transpose a matrix
   */
  private transpose(matrix: number[][]): number[][] {
    return matrix[0].map((_, col) => matrix.map(row => row[col]));
  }

  /**
   * Multiply two matrices
   */
  private matrixMultiply(A: number[][], B: number[][]): number[][] {
    const result = Array(A.length)
      .fill(0)
      .map(() => Array(B[0].length).fill(0));

    for (let i = 0; i < A.length; i++) {
      for (let j = 0; j < B[0].length; j++) {
        for (let k = 0; k < B.length; k++) {
          result[i][j] += A[i][k] * B[k][j];
        }
      }
    }

    return result;
  }

  /**
   * Multiply matrix by vector
   */
  private matrixVectorMultiply(A: number[][], v: number[]): number[] {
    return A.map(row => row.reduce((sum, val, i) => sum + val * v[i], 0));
  }

  /**
   * Inverse of 3x3 matrix (optimized for small size)
   */
  private inverse3x3(M: number[][]): number[][] | null {
    const [[a, b, c], [d, e, f], [g, h, i]] = M;

    const det =
      a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);

    if (Math.abs(det) < 1e-10) return null; // Singular matrix

    return [
      [(e * i - f * h) / det, (c * h - b * i) / det, (b * f - c * e) / det],
      [(f * g - d * i) / det, (a * i - c * g) / det, (c * d - a * f) / det],
      [(d * h - e * g) / det, (b * g - a * h) / det, (a * e - b * d) / det],
    ];
  }

  /**
   * Calculate R-squared (coefficient of determination)
   */
  private calculateRSquared(actual: number[], predicted: number[]): number {
    const mean = actual.reduce((a, b) => a + b, 0) / actual.length;
    const totalSS = actual.reduce((sum, y) => sum + Math.pow(y - mean, 2), 0);
    const residualSS = actual.reduce(
      (sum, y, i) => sum + Math.pow(y - predicted[i], 2),
      0
    );

    return totalSS === 0 ? 0 : 1 - residualSS / totalSS;
  }
}

export class RiskWeightTrainer {
  /**
   * Train risk weights from historical incident data
   * @param historicalIncidents Past incidents with response times
   * @returns Optimized weights and training metrics
   */
  static async trainWeights(
    historicalIncidents: RiskWeightTrainingData[]
  ): Promise<OptimizedWeights> {
    // Need minimum samples for meaningful regression
    if (historicalIncidents.length < 10) {
      console.warn(
        `Insufficient data for training (${historicalIncidents.length} samples). Using defaults.`
      );
      return {
        alpha: 0.4,
        beta: 0.35,
        gamma: 0.25,
        modelAccuracy: 0,
        samplesUsed: historicalIncidents.length,
        trainingDate: new Date(),
        recommendation:
          'Collect more incident data for better weight optimization. Need at least 10 samples.',
      };
    }

    const regression = new LinearRegression();

    // Add training samples
    historicalIncidents.forEach(incident => {
      regression.addSample(
        incident.hazardFactor,
        incident.segmentCongestion,
        incident.responseTimeMin,
        incident.actuallyHighRisk ? 1 : 0
      );
    });

    // Train the model
    const { weights, accuracy } = regression.train();

    // Ensure weights sum to roughly 1 for consistency
    const [alpha, beta, gamma] = weights;
    const total = alpha + beta + gamma;
    const normalized = {
      alpha: alpha / total,
      beta: beta / total,
      gamma: gamma / total,
    };

    return {
      alpha: parseFloat(normalized.alpha.toFixed(3)),
      beta: parseFloat(normalized.beta.toFixed(3)),
      gamma: parseFloat(normalized.gamma.toFixed(3)),
      modelAccuracy: parseFloat((accuracy * 100).toFixed(1)),
      samplesUsed: historicalIncidents.length,
      trainingDate: new Date(),
      recommendation: this.generateRecommendation(accuracy, historicalIncidents.length),
    };
  }

  /**
   * Extract training data from raw incidents
   * @param incidents Raw incident data
   * @returns Formatted training data
   */
  static prepareTrainingData(incidents: Incident[]): RiskWeightTrainingData[] {
    return incidents
      .filter(inc => inc.id) // Ensure valid incident ID
      .map(inc => {
        // Estimate response time based on severity and status
        // Low severity incidents might take longer to respond to
        const baseSeverityTime = inc.severity === 'high' ? 5 : inc.severity === 'medium' ? 10 : 15;
        const estimatedResponse = inc.status === 'resolved' ? baseSeverityTime : baseSeverityTime + 5;
        const responseTimeMin =
          typeof inc.responseTimeMin === 'number' && Number.isFinite(inc.responseTimeMin) && inc.responseTimeMin > 0
            ? inc.responseTimeMin
            : estimatedResponse;

        const timestampDate =
          inc.timestamp && typeof (inc.timestamp as any).toDate === 'function'
            ? (inc.timestamp as any).toDate()
            : new Date();
        
        return {
          incidentId: inc.id || '',
          hazardFactor: this.getHazardFactor(inc.type),
          segmentCongestion: this.estimateSegmentCongestion(inc),
          responseTimeMin: responseTimeMin,
          actuallyHighRisk: inc.severity === 'high' || inc.type === 'fire',
          timestamp: timestampDate,
        };
      });
  }

  /**
   * Assign hazard factor based on incident type
   */
  private static getHazardFactor(type: string): number {
    const hazardMap: Record<string, number> = {
      fire: 1.0,
      flood: 0.8,
      accident: 0.6,
      other: 0.4,
    };
    return hazardMap[type.toLowerCase()] || 0.5;
  }

  /**
   * Estimate traffic congestion at time of incident
   * Based on time-of-day patterns
   */
  private static estimateSegmentCongestion(incident: Incident): number {
    try {
      // Handle Firestore Timestamp
      let date: Date;
      if (incident.timestamp instanceof Date) {
        date = incident.timestamp;
      } else if (incident.timestamp && typeof incident.timestamp === 'object' && 'toDate' in incident.timestamp) {
        // Firestore Timestamp object
        date = (incident.timestamp as any).toDate();
      } else {
        return 0.5; // Default if we can't parse timestamp
      }

      const hour = date.getHours();
      // Rush hour (7-9 AM, 5-7 PM): high congestion
      if ((hour >= 7 && hour < 9) || (hour >= 17 && hour < 19)) {
        return 1.0;
      }
      // Mid-day (11-3 PM): low congestion
      if (hour >= 11 && hour < 15) {
        return 0.2;
      }
      // Off-peak: moderate
      return 0.6;
    } catch {
      return 0.5; // Default on error
    }
  }

  /**
   * Generate recommendation based on training results
   */
  private static generateRecommendation(
    accuracy: number,
    sampleCount: number
  ): string {
    if (accuracy < 0.6) {
      return `Model accuracy is low (${(accuracy * 100).toFixed(1)}%). Consider collecting more diverse incident data.`;
    }
    if (sampleCount < 50) {
      return `Good accuracy (${(accuracy * 100).toFixed(1)}%), but consider more samples for robustness.`;
    }
    return `Excellent model fit (${(accuracy * 100).toFixed(1)}%) with ${sampleCount} samples. Weights are production-ready.`;
  }

  /**
   * Calculate R-Score using trained weights
   * R = (α·H + β·S + γ/V) / N
   */
  static calculateRScore(
    hazardFactor: number,
    segmentCongestion: number,
    responseTimeMin: number,
    weights: OptimizedWeights
  ): number {
    const { alpha, beta, gamma } = weights;

    // Add small value to response time to avoid division by zero
    const responseTimeComponent = gamma / (responseTimeMin + 0.1);

    const rawScore = alpha * hazardFactor + beta * segmentCongestion + responseTimeComponent;
    const normalized = rawScore / (alpha + beta + gamma);

    // Scale to 0-10 range
    return Math.min(10, Math.max(0, normalized * 10));
  }
}
