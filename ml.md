# ML

## Finished
- [x] Route telemetry engine scaffold (RouteXAIService)
- [x] Segment-level traffic status classification (fluid/moderate/heavy)
- [x] Segment feature extraction (distance/bearing/curvature/friction)
- [x] Traffic entropy metric computation
- [x] Spectral congestion energy computation
- [x] Reliability index computation
- [x] Route proof modal integration with telemetry payload
- [x] AI follow-up question flow in proof modal
- [x] AI prompt switched to plain-text instruction mode
- [x] ETA fallback logic prioritized parsed route ETA
- [x] Topology penalty bounded to prevent outlier spikes
- [x] ETA inflation mitigation via route-point sampling
- [x] ETA correction coefficients reduced to avoid 5x over-penalty
- [x] Canonical single ETA source shared across all route surfaces
- [x] Confidence calibration against real response-time ground truth
- [x] Offline/failed telemetry fallback confidence strategy
- [x] Automatic anomaly detector for inflated ETA outputs
- [x] ML output validation test suite (unit + scenario snapshots)
- [x] Threshold tuning workflow for friction/entropy/reliability
- [x] Drift monitoring for traffic/status distributions
- [x] Feature importance report export for admin review
- [x] Dynamic advisories replacing static advisory cards
- [x] Prone-area proof stats expanded to parity with route proof

## Unfinished


## Static Or Hardcoded
- [x] Fixed speed buckets by traffic class
- [x] Fixed congestion weight table
- [x] Fixed curvature contribution coefficient
- [x] Fixed urban delay cap and constants
- [x] Fixed confidence interpretation bands
- [x] Fixed advisory phrasing templates

## Unlogical Or Needs Refactor
- [x] Penalty layers can still overlap conceptually with speed-based ETA terms
- [x] Route model and TSRE naming/logic boundaries are not fully separated
- [x] Mixed responsibility: UI modal performs derived modeling math fallback
- [x] Context payload shape for AI is permissive (any) instead of strict schema
- [x] Telemetry normalization assumptions are implicit, not policy-driven
