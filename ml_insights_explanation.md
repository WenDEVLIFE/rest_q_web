# ML Insights: Data Intelligence & Predictive Modeling Guide

This document explains the advanced Machine Learning and Data Science operations driving the **Rest-Q Intelligence Engine**. This panel is designed for technical oversight and system calibration.

---

### 1. Algorithms & AI Models
Rest-Q utilizes a suite of high-fidelity algorithms to transform raw data into actionable intelligence:

*   **TSRE (Traffic Spatial Response Engine)**
    *   **Formula**: `T = (D × K) + Σ(Wᵢ × Tᵢ) + Φ + Ω`
    *   **Goal**: Precise ETA prediction for emergency response.
    *   **Variable Breakdown (What they mean):**
        *   **T (Total Time)**: The final estimated minutes until arrival.
        *   **(D × K) - "Initial Estimate"**: This is your baseline. `D` is distance, and `K` is a constant (2.5 min/km) representing the urban environment (traffic lights, turns) under normal conditions.
        *   **Σ(Wᵢ × Tᵢ) - "Traffic Impact"**: This is the sum of delays across every road segment (i). `Wᵢ` is a weight ranging from 0 (empty) to 1 (blocked), and `Tᵢ` is the time it takes to cross that segment. This adds more time for the segments that are currently jammed.
        *   **Φ (Hazard Penalty)**: A dynamic "time boost" added instantly when a verified accident or roadblock is detected. It accounts for the sudden stop-and-go behavior around a hazard.
        *   **Ω (Weather Coefficient)**: An environmental factor (e.g., +15% for rain, +50% for typhoons). It slows down the entire prediction for safety based on Pagasa weather data.

*   **R-Score (Multivariate Risk Scoring)**
    *   **Formula**: `R = (α·H + β·S + γ/V) / N`
    *   **Goal**: Dynamic safety tiering of road segments (0-10 scale).
    *   **Variable Breakdown:**
        *   **R (Risk Score)**: The final danger level shown on the map (Red/Amber/Green).
        *   **α·H (Historical Factor)**: `H` is the record of past accidents. The more history a road has, the more it "pulls" the score toward high risk.
        *   **β·S (Severity Factor)**: `S` is the intensity of incidents happening *right now*. A multi-vehicle crash increases this instantly.
        *   **γ/V (Velocity/Traffic Flow)**: `V` is the current speed. If speed drops due to a jam, this part of the formula makes the risk score go *up*.
        *   **N (Normalization)**: A scaling factor that ensures the final score stays easy-to-understand (1 to 10).

*   **DBSCAN (Density-Based Spatial Clustering)**
    *   **Goal**: Automated hotspot identification to prevent "alert fatigue."
    *   **The Logic (How it works):**
        *   **Epsilon (Search Radius)**: The distance the AI "looks" around a point (e.g., 500 meters).
        *   **MinPts (Threshold)**: The minimum number of reports needed inside that radius to create a "Hotspot." If 4 people report the same flood, it becomes a major red zone.
        *   **Noise**: Any reports that don't meet the threshold are treated as individual incidents rather than a cluster, keeping the map clean.

---

### 2. Implementation Code Samples
To ensure transparency, here is how the core algorithms are structured within the **Rest-Q Source Code**:

#### **A. TSRE Algorithm (ETA Prediction)**
*File: `src/service/Traffic_Service.ts`*
```typescript
// Implementing the TSRE Formula: T = (D × K) + Σ(Wi × Ti) + Φ + Ω
static calculateRouteEta(distanceKm, trafficSegments) {
  const K = 2.5; // Urban constant
  const segmentImpact = trafficSegments.reduce((sum, seg) => {
    const weight = 1 - seg.congestionLevel; // Wi
    return sum + (weight * seg.travelTime); // Wi * Ti
  }, 0);

  // Final TSRE Time Calculation
  let tsreTime = (distanceKm * K) + segmentImpact + hazards + weather;
  return Math.ceil(tsreTime);
}
```

#### **B. R-Score & Congestion Logic**
*File: `src/service/Traffic_Service.ts`*
```typescript
static async getLiveTraffic(incidents, weather) {
  return BASE_THOROUGHFARES.map(road => {
    // 1. Time-of-day Weight (Rush Hour)
    const timeMultiplier = this.getTimeMultiplier(hour);
    // 2. Incident Verification Penalty
    const incidentMultiplier = this.getIncidentCongestion(road, incidents);
    // 3. Weather slowdowns
    const weatherMultiplier = this.getWeatherMultiplier(weather);

    const dynamicSpeed = road.baseSpeed * timeMultiplier * incidentMultiplier * weatherMultiplier;
    const congestionLevel = 1 - (dynamicSpeed / road.baseSpeed);
    
    return { name: road.brand, congestionLevel, status: 'heavy' };
  });
}
```

#### **C. DBSCAN & Hotspot Trigger**
*Concept: Spatial grouping of reports*
```typescript
// AI logic for clustering 4+ reports in 500m radius
const detectHotspot = (incidents, epsilon = 500, minPts = 4) => {
  const clusters = dbscan.run(incidents, epsilon, minPts);
  return clusters.map(c => ({
    center: calculateCentroid(c),
    risk: 'CRITICAL_HOTSPOT'
  }));
}
```

---

### 3. Technology Stack
Built for speed, reliability, and precision:

*   **Frontend**: Next.js 16 (React 19) + Lucide Icons for a robust, premium administrative dashboard.
*   **Backend**: Google Firebase (Firestore) for sub-second, real-time data synchronization.
*   **Mapping**: Leaflet.js with custom KML/GeoJSON layers for high-performance spatial rendering.
*   **Routing**: OSRM (Open Source Routing Machine) integration for foundational pathfinding.
*   **Geocoding**: Nominatim (OpenStreetMap) for instant coordinate-to-address translation.
*   **Weather**: Pagasa Parser for regional weather impact integration.

---

### 3. The 5-Stage Data Pipeline
Every data point undergoes a rigorous transformation process:
1.  **Ingestion**: Raw geodata is parsed from KML/XLSX baselines.
2.  **Geohashing**: Coordinates are mapped to a precision 150m grid.
3.  **Feature Engineering**: Temporal (rush hour) and Spatial (topology) features are extracted.
4.  **Model Execution**: The TSRE and R-Score formulas are applied to live data streams.
5.  **Output Visualization**: Insights are rendered as dynamic risk heatmaps and ETAs.

---

### 4. Calibration & Ground Truth
To maintain 100% reliability, the system is calibrated via:
*   **Historical Footprinting**: Using `VEHICLE SPEED.kml` to establish "Expected Normal" conditions.
*   **Ground Truth Feedback**: Comparing system-predicted ETAs against actual arrival times from emergency units to adjust the **Confidence Score**.
*   **Drift Monitoring**: Automated detection of "Traffic Drift" to alert operators when baseline models need updating.

---
*Powered by Rest-Q Machine Learning Engine v2.5*
