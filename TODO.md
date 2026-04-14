# Res-Q Project: Technical TODO Roadmap

## 🧠 ML Developer Track
*Focus: Enhancing the intelligence and predictive accuracy of the system.*

- [ ] **Dynamic Traffic Data Integration**: Replace simulated thoroughfare status with a live Traffic API (TomTom/MapTiler) to refine EDA calculations.
- [ ] **Custom Risk Weight Training**: Develop a small regression model to adjust `responseTimeMin` weights based on historical rainy-season dispatch logs.
- [ ] **LLM Context Enhancement**: Feed the Innovatech AI service more real-time map metadata (e.g., current active hazards) to improve triage advice.
- [ ] **Raster Flood Simulation**: Implement an actual raster-based flood fill algorithm in `InteractiveMap` instead of tile-based heatmaps for better visual fidelity.
- [ ] **Prone Area Prediction**: Add a module that automatically flags potential high-risk zones based on weather forecasts before reports start coming in.

## 💻 Web App Developer Track
*Focus: Scaling the infrastructure, UI flexibility, and administrative control.*

- [ ] **Emergency Facilities CRUD**: 
    - [ ] Create a dedicated Admin view to Add/Edit/Delete hospitals and fire stations in Firestore.
    - [ ] Sync `establishment.json` data to Firestore for live management.
- [ ] **Prone Areas Admin UI**:
    - [ ] Build a "Designate Zone" tool on the map for admins (draw a circle).
    - [ ] Implement the form to set Category (Accident/Flood/Fire) and Status (Fixed/Unfixed).
- [ ] **System Settings API**:
    - [ ] Migrate `localStorage` AI Settings to a Firestore `config` collection.
    - [ ] Create a CRUDable backend endpoint/service to manage environment secrets (like MapTiler keys).
- [ ] **Integrated Spatial Monitoring**: 
    - [ ] Add a "View on Map" toggle/button in the Monitoring table.
    - [ ] Create a dedicated **Admin Map View** that allows real-time interaction with incident pins directly from the dashboard.
- [ ] **User Role Logic**:
    - [ ] Implement high-level access control for "Super Admin" vs "Standard Admin".
    - [ ] Add "Account Activation/Deactivation" toggle in the Users management view.
- [ ] **Mobile Touch-Route Implementation**:
    - [ ] Enable long-press on the map to manually set "Emergency Focus" for mobile users who can't use the search bar easily.

---
*Reference: RT-MANILA-CORE*
