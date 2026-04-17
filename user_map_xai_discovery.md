# Map Intelligence: XAI & Discovery Guide

This document explains the "Intelligence Discovery" modal and the **XAI (Explainable AI)** features that allow users to see the "Logic Proof" behind the system's decisions.

---

### 1. Intelligence Discovery Panel
Accessible via the **Brain Icon** on the main map, this panel provides a transparent overview of the system's "Research Architecture."

#### **A. The Physics of Resilience**
The system uses "Edge-based inference" to calculate arrival times. It operates on a **Data Fusion Philosophy**, integrating data from:
*   **GDACS & Pagasa**: Global and local typhoon/flood telemetry.
*   **Citizen Intelligence**: Verified reports from people on the ground.
*   **Historical Patterns**: Learned behavior from the San Fernando locality.

#### **B. Performance Metrics**
*   **Latency**: 2.4s (Time from a report being filed to it appearing on the map).
*   **Inference Speed**: 8ms (Time for the AI to recalculate your route).
*   **Prediction Threshold**: 88% (The minimum success rate required for a route to be suggested by the AI).

---

### 2. XAI: View ML Proof
When selecting a route, users can click **"View ML Proof."** This opens the **Explainable AI (XAI) Breakdown** which explains *why* the AI chose that specific time and safety rating.

#### **What the XAI Shows:**
1.  **Confidence Score (%)**: Tells the user how sure the AI is about the ETA based on data freshness.
2.  **Delay Attribution**: Breaks down exactly where the minutes are coming from:
    *   `+4 min`: Intersection congestion.
    *   `+2 min`: Weather slowdown.
    *   `+6 min`: Active verified incident (Hazard Penalty).
3.  **Alternative Reasoning**: Briefly explains why the "Main Thoroughfare" was chosen over the "Backroad Bypass" (e.g., "Avoids high-risk flood zone").

---

### 3. Triage & SITREP Synthesis
Beyond mapping, the AI provides two critical situational tools:

*   **Triage LLM**: A dialect-aware AI that provides immediate medical triage steps and emotional support to reporters until emergency teams arrive.
*   **SITREP Synthesis**: Automatically summarizes thousands of chaotic incident reports into a single, actionable **Situation Report (SITREP)** for operators, ensuring no critical detail is lost in the noise.

---
*Reference Document: ml.md • RT-MANILA-CORE-V2*
