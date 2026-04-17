# User Map Intelligence: Calculation & Routing Guide

This document explains the real-time logic and formulas used by the **Rest-Q Interactive Map** to provide users with accurate ETAs, route safety ratings, and hazard awareness.

---

### 1. Smart Route Selection & ETA
When a user selects a destination (e.g., a hospital or emergency service), the system doesn't just draw a line. it runs the **TSRE (Traffic Spatial Response Engine)** in real-time.

#### **Real-Time ETA Formula**
> **T = (D × K) + Σ(Wᵢ × Tᵢ) + Φ + Ω**
*   **D (Distance)**: Calculated using the **Haversine Formula** to find the shortest great-circle distance between coordinates.
*   **K (Urban Constant)**: A baseline multiplier (2.5 min/km) that accounts for city intersections and speed limits.
*   **Wᵢ × Tᵢ (Traffic Friction)**: The system analyzes the "weight" of traffic on every road segment in the path. If a segment is "Heavy," the weight increases, adding more minutes to the journey.
*   **Φ (Hazard Penalty)**: If the route passes within 1km of a verified accident or flood, the system automatically adds a "Safety Delay" to the ETA.

---

### 2. Traffic Flow Visualization (Line Colors)
Road segments on the map are color-coded based on the **Congestion Ratio**:

| Color | Traffic Status | Math Logic (Speed Ratio) |
| :--- | :--- | :--- |
| **Emerald (Green)** | Fluid | `Current Speed / Base Speed > 0.8` |
| **Amber (Yellow)** | Moderate | `Current Speed / Base Speed between 0.5 - 0.8` |
| **Rose (Red)** | Heavy | `Current Speed / Base Speed < 0.5` |

*Calculation: This data is sourced from a combination of the historical KML baseline and live incident-based slowdowns. In "Static Mode," these values default to perfect flow unless a custom model is loaded.*

---

### 3. Hazard & Hazard Prone Detection
The map displays real-time incident pins (Accidents, Floods, Fires).

*   **Hotspot Trigger**: If 4 or more citizen reports converge within a 500-meter radius, the system applies **DBSCAN Clustering** to promote these reports into an official "Critical Hotspot."
*   **Risk Tiers**: Each incident has a severity rating (Low/Med/High) which determines the radius of the "Impact Zone" on the map. Administrative verification acts as a final filter to ensure 100% data reliability for the user.

---

### 4. Search & Geocoding
When you type an address or click the map, the system uses **Reverse Geocoding**:
*   **Tool**: Nominatim (OpenStreetMap)
*   **Process**: Converts raw GPS coordinates (e.g., 15.0286, 120.6898) into human-readable street names (e.g., "MacArthur Highway, San Fernando") using a high-fidelity geospatial database.

---
*Powered by Rest-Q Geospatial Engine v2.5*
