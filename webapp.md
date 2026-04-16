# Web App

## Finished
- [x] Authentication flow (login/register/OTP screens)
- [x] User/admin role routing shell
- [x] Interactive map base rendering
- [x] Report pin placement from map click
- [x] Incident reporting submit flow
- [x] Incident history rendering
- [x] Live open-incident stream wiring
- [x] Flood overlay mode wiring
- [x] Typhoon overlay mode wiring
- [x] Emergency map panel open flow
- [x] Route drawing using OSRM path
- [x] Route segment traffic color lines (green/yellow/red)
- [x] Layer toggles with Leaflet LayersControl
- [x] Manual prone areas merged into Live Activity Zones
- [x] Home-to-map synchronized focus/report pins
- [x] Dynamic advisory panel (risk/weather/incident aware)
- [x] AI chat proxy API route (/api/ai-chat)
- [x] Client AI service switched to same-origin proxy
- [x] Settings view env-driven endpoint/key defaults
- [x] Logo image aspect-ratio warning fix
- [x] Route planner destination label autofill on facility select
- [x] Route planner reverse-geocode address labels
- [x] XAI modal guarded from opening with empty payload
- [x] XAI modal auto-close guard when route context inactive
- [x] Canonical ETA source priority across route planner/map/XAI surfaces
- [x] Route planner layout verified at 300px width
- [x] Header actions and user controls verified at 300px width
- [x] Home card content stack and spacing verified at 300px width
- [x] Map side panel drawer behavior verified at 300px width
- [x] Modal widths/heights and overflow behavior verified at 300px width
- [x] Admin sidebar and tables verified at 300px width
- [x] All forms input/button tap targets verified at 300px width
- [x] No horizontal scroll regressions at 300px widthc
- [x] Tested breakpoints: 300px, 320px, 360px, 390px, 768px, 1024px

## Unfinished
- [ ] End-to-end route ETA parity test in live dev session
- [ ] Fallback UI when reverse geocoding API is unavailable
- [ ] Clear loading/empty/error UI state for route address lookups
- [ ] Source badge in activity zones (Manual vs Auto Cluster)
- [ ] AI answer output sanitizer for forced plain-text rendering
- [ ] Dedicated QA pass for all route planner edge cases
- [ ] Dev server stability fix for repeated next dev port/process conflicts

## Static Or Hardcoded
- [ ] Default start coordinate fallback (15.0286, 120.6898)
- [ ] San Fernando bounds constants inside route planner
- [ ] Some route labels and notes are fixed strings
- [ ] Manual destination default label token
- [ ] Lat/Lng fallback strings in incident address text

## Unlogical Or Needs Refactor
- [ ] Mixed route source truth (RouteNavigation estimate vs map telemetry model)
- [ ] Excessive local state coupling between Home, Map, and Route panels
- [ ] Route planner input supports raw coordinates only (no searchable destination input)
- [ ] Facility search still starts from coordinate parsing instead of structured location model

