"use client";

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import establishmentsData from '../../public/establishment.json';
import { Incident } from '../../src/types/incident';


interface InteractiveMapProps {
  overlayMode: 'none' | 'flood' | 'typhoon' | 'route' | 'report' | 'explore' | 'emergency';
  reportPin?: { lat: number; lng: number } | null;
  searchPin?: { lat: number; lng: number; label?: string } | null;
  focusPin?: {
    label: string; lat: number; lng: number
  } | null;
  reportedIncidents?: Incident[];
  onMapClick?: (lat: number, lng: number) => void;
  onOverlayModeChange?: (mode: 'none' | 'flood' | 'typhoon' | 'route' | 'report' | 'explore' | 'emergency') => void;
  forceTab?: 'metrics' | 'advisory' | 'what-to-do' | 'facilities';
  forceOpen?: boolean;
  onReset?: () => void;
}

type FloodTileLevel = 'low' | 'medium' | 'high';

interface FloodTile {
  positions: [number, number][];
  level: FloodTileLevel;
}

const floodHeatColors: Record<FloodTileLevel, { fill: string; stroke: string; opacity: number }> = {
  low: { fill: '#FDE047', stroke: '#FBBF24', opacity: 0.42 },
  medium: { fill: '#F97316', stroke: '#FB923C', opacity: 0.5 },
  high: { fill: '#EF4444', stroke: '#F87171', opacity: 0.58 },
};

const pampangaBounds = {
  south: 14.80,
  north: 15.25,
  west: 120.39,
  east: 120.86,
};

const floodInfluenceCenters: Array<{ lat: number; lng: number; weight: number }> = [
  { lat: 15.0333, lng: 120.6833, weight: 0.72 },
  { lat: 15.1450, lng: 120.5850, weight: 0.92 },
  { lat: 15.2160, lng: 120.6520, weight: 0.88 },
  { lat: 15.1020, lng: 120.7300, weight: 0.84 },
  { lat: 14.9500, lng: 120.6400, weight: 0.78 },
];

const floodCorridors: Array<[[number, number], [number, number]]> = [
  [[14.86, 120.44], [15.22, 120.80]],
  [[14.92, 120.40], [15.18, 120.72]],
  [[14.84, 120.56], [15.24, 120.62]],
];

const createTile = (centerLat: number, centerLng: number, sizeLat: number, sizeLng: number): [number, number][] => {
  const halfLat = sizeLat / 2;
  const halfLng = sizeLng / 2;

  return [
    [centerLat - halfLat, centerLng - halfLng],
    [centerLat - halfLat, centerLng + halfLng],
    [centerLat + halfLat, centerLng + halfLng],
    [centerLat + halfLat, centerLng - halfLng],
  ];
};

const distanceToSegmentKm = (
  pointLat: number,
  pointLng: number,
  start: [number, number],
  end: [number, number]
) => {
  const toMeters = (lat: number, lng: number) => {
    const metersPerLat = 111320;
    const metersPerLng = 111320 * Math.cos((lat * Math.PI) / 180);
    return { x: lng * metersPerLng, y: lat * metersPerLat };
  };

  const point = toMeters(pointLat, pointLng);
  const startPoint = toMeters(start[0], start[1]);
  const endPoint = toMeters(end[0], end[1]);

  const segmentX = endPoint.x - startPoint.x;
  const segmentY = endPoint.y - startPoint.y;
  const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;

  if (segmentLengthSquared === 0) {
    const dx = point.x - startPoint.x;
    const dy = point.y - startPoint.y;
    return Math.sqrt(dx * dx + dy * dy) / 1000;
  }

  const projection = Math.max(
    0,
    Math.min(
      1,
      ((point.x - startPoint.x) * segmentX + (point.y - startPoint.y) * segmentY) / segmentLengthSquared
    )
  );

  const closestX = startPoint.x + projection * segmentX;
  const closestY = startPoint.y + projection * segmentY;
  const dx = point.x - closestX;
  const dy = point.y - closestY;

  return Math.sqrt(dx * dx + dy * dy) / 1000;
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const floodTiles: FloodTile[] = (() => {
  const tiles: FloodTile[] = [];
  const latStep = (pampangaBounds.north - pampangaBounds.south) / 128;
  const lngStep = (pampangaBounds.east - pampangaBounds.west) / 128;

  for (let lat = pampangaBounds.south; lat <= pampangaBounds.north; lat += latStep) {
    for (let lng = pampangaBounds.west; lng <= pampangaBounds.east; lng += lngStep) {
      const corridorDistance = Math.min(
        ...floodCorridors.map(([start, end]) => distanceToSegmentKm(lat, lng, start, end))
      );

      const centerInfluenceSum = floodInfluenceCenters.reduce((sum, center) => {
        const distance = calculateDistance(lat, lng, center.lat, center.lng);
        const influence = Math.max(0, 1 - distance / 24) * center.weight;
        return sum + influence;
      }, 0);
      const centerInfluence = centerInfluenceSum / floodInfluenceCenters.length;

      const provincialGradient = Math.max(0, 1 - calculateDistance(lat, lng, 15.05, 120.64) / 85) * 0.4;
      const patternNoise = (Math.sin(lat * 60 + lng * 3.5) + Math.cos(lng * 50 - lat * 4.2)) * 0.08;
      const corridorInfluence = Math.max(0, 1 - corridorDistance / 7.5);
      // Heavier weights on corridors and centers to create more diverse high-risk zones
      const rawIntensity = corridorInfluence * 0.55 + centerInfluence * 0.45 + provincialGradient * 0.15 + patternNoise;
      const intensity = Math.max(0, Math.min(1, rawIntensity));

      if (intensity < 0.05) continue; // Lowered to cover most of Pampanga

      const level: FloodTileLevel = intensity > 0.65 ? 'high' : intensity > 0.35 ? 'medium' : 'low';
      tiles.push({
        level,
        positions: createTile(lat, lng, latStep * 1.05, lngStep * 1.05), // size matches new 128x128 step + overlap
      });
    }
  }

  return tiles;
})();

// Custom DivIcons for different establishment types
// Memoize / cache icons to avoid lag on every render
const iconCache: Record<string, L.DivIcon> = {};

const getIconForType = (type: string) => {
  if (iconCache[type]) return iconCache[type];

  let colorClass = "bg-primary shadow-primary/40";
  let svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/></svg>`; // Shield

  if (type === "Healthcare Facility") {
    colorClass = "bg-rose-500 shadow-rose-500/40";
    svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`; // Heart
  } else if (type === "Emergency Service") {
    colorClass = "bg-red-500 shadow-red-500/40";
    svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`; // Flame
  } else if (type === "Government Office") {
    colorClass = "bg-blue-600 shadow-blue-600/40";
  }

  iconCache[type] = L.divIcon({
    className: "custom-leaflet-icon",
    html: `
      <div class="relative w-12 h-12 -ml-6 -mt-12 group cursor-pointer drop-shadow-xl animate-in zoom-in-50 duration-500">
        <div class="absolute inset-0 bg-black/10 rounded-xl translate-y-1 blur-[2px] transition-all group-hover:translate-y-2 group-hover:blur-[4px]"></div>
        <div class="relative w-12 h-12 rounded-[14px] ${colorClass} text-white flex items-center justify-center border-[3px] border-white transition-transform group-hover:-translate-y-1">
          ${svgIcon}
        </div>
        <div class="absolute -bottom-1.5 left-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent border-t-white -translate-x-1/2 group-hover:-translate-y-1 transition-transform"></div>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -50],
  });

  return iconCache[type];
};

const ReportPinIcon = L.divIcon({
  className: "custom-report-icon",
  html: `
    <div class="relative w-12 h-12 -ml-6 -mt-12 group cursor-pointer drop-shadow-xl animate-bounce">
      <div class="absolute inset-0 bg-red-600/20 rounded-xl translate-y-1 blur-[3px]"></div>
      <div class="relative w-12 h-12 rounded-[14px] bg-red-600 text-white flex items-center justify-center border-[3px] border-white z-10">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
      </div>
      <div class="absolute -bottom-1.5 left-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent border-t-white -translate-x-1/2 z-10"></div>
      <div class="absolute -bottom-2 left-1/2 w-6 h-2 bg-black/20 blur-[2px] rounded-full -translate-x-1/2"></div>
    </div>
  `,
  iconSize: [48, 48],
  iconAnchor: [24, 48],
});

const OpenIncidentIcon = L.divIcon({
  className: 'custom-open-incident-icon',
  html: `
    <div class="relative w-10 h-10 -ml-5 -mt-10">
      <div class="absolute inset-0 rounded-full bg-red-500/30 animate-ping"></div>
      <div class="absolute inset-0 rounded-full bg-red-600 border-2 border-white flex items-center justify-center text-white shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
      </div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const SearchPinIcon = L.divIcon({
  className: "custom-search-icon",
  html: `
    <div class="relative w-12 h-12 -ml-6 -mt-12 group cursor-pointer drop-shadow-xl animate-in zoom-in-50 duration-500">
      <div class="absolute inset-0 bg-primary/20 rounded-xl translate-y-1 blur-[3px]"></div>
      <div class="relative w-12 h-12 rounded-[14px] bg-primary text-white flex items-center justify-center border-[3px] border-white z-10 transition-transform group-hover:-translate-y-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="11" r="3"/><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z"/></svg>
      </div>
      <div class="absolute -bottom-1.5 left-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent border-t-white -translate-x-1/2 z-10 transition-transform group-hover:-translate-y-1"></div>
    </div>
  `,
  iconSize: [48, 48],
  iconAnchor: [24, 48],
  popupAnchor: [0, -50],
});

// A small component to handle map clicks safely
const MapEvents = ({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) => {
  const map = useMap();
  useEffect(() => {
    if (!onMapClick) return;
    map.on('click', (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    });
    return () => {
      map.off('click');
    };
  }, [map, onMapClick]);
  return null;
};

const MapController = ({ focusPin }: { focusPin?: { lat: number, lng: number } | null }) => {
  const map = useMap();
  useEffect(() => {
    if (focusPin) {
      // Smoothly pan and zoom to the specific establishment
      map.flyTo([focusPin.lat, focusPin.lng], 16, { duration: 1.5 });
    }
  }, [focusPin, map]);
  return null;
};

import { SidebarSearch } from '../User/SidebarSearch';
import { RiskLevelPanel } from '../User/RiskLevelPanel';
import { Loader2 } from 'lucide-react';

export default function InteractiveMap({
  overlayMode,
  reportPin,
  searchPin: externalSearchPin,
  focusPin,
  reportedIncidents,
  onMapClick,
  onOverlayModeChange,
  forceTab,
  forceOpen,
  onReset
}: InteractiveMapProps) {
  const [isMounted, setIsMounted] = React.useState(false);
  const mapContainerRef = React.useRef<HTMLDivElement>(null);

  // Center roughly to the establishments data
  const center: [number, number] = [15.0589, 120.6460];
  const [localSearchPin, setLocalSearchPin] = React.useState<{ lat: number, lng: number, label?: string } | null>(null);

  // Use global focus pin or external search pin if provided, otherwise use local
  const activeSearchPin = focusPin || externalSearchPin || localSearchPin;

  const openWeatherAPIKey = process.env.NEXT_PUBLIC_OPEN_WEATHER_API_KEY;
  const mapTilerKey = process.env.NEXT_PUBLIC_OPEN_MAPTILER_API_KEY;
  // Use MapTiler Topo V2 to explicitly highlight rivers and natural terrain as requested
  const tileUrl = `https://api.maptiler.com/maps/topo-v2/256/{z}/{x}/{y}.png?key=${mapTilerKey}`;
  const attribution = '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; OpenStreetMap contributors';

  const handleLocationSelect = (lat: number, lng: number, label: string) => {
    setLocalSearchPin({ lat, lng, label });
  };

  const handleReset = () => {
    setLocalSearchPin(null);
  };

  // Simulated Typhoon Path (Polyline and large radius)
  const typhoonCenter: [number, number] = [14.9500, 120.8000];
  const typhoonRadius = 15000;

  // Simulated Routing (From arbitrary A to arbitrary B, simulating routing to hospital)
  const routePoints: [number, number][] = [
    [15.0589, 120.6460], // Start Center
    [15.0650, 120.6600],
    [15.0812, 120.6618], // Ricardo P. Rodriguez Hospital
  ];

  return (
    <div
      id="res-q-map-container"
      className="absolute inset-0 w-full h-full z-0"
    >
      <MapContainer
        key="res-q-interactive-map"
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution={attribution}
          url={tileUrl}
        />

        <MapEvents onMapClick={overlayMode === 'report' ? onMapClick : undefined} />
        <MapController focusPin={focusPin || activeSearchPin} />

        {/* --- Markers for Establishments --- */}
        {establishmentsData.map((est, idx) => (
          <Marker
            key={idx}
            position={[est.Latitude, est.Longitude]}
            icon={getIconForType(est["Establishment Type"])}
          >
            <Popup className="font-inter">
              <div className="text-center">
                <p className="text-xs font-black text-slate-900 mb-1">{est.Name}</p>
                <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 rounded-full text-slate-600 uppercase">
                  {est["Establishment Type"]}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* === LIVE TELEMETRY OVERLAYS === */}

        {/* Flood Overlay (Simulated NOAH Hazard Zones) */}
        {(overlayMode === 'flood' || overlayMode === 'emergency') && (
          <>
            {floodTiles.map((tile, index) => {
              const tileStyle = floodHeatColors[tile.level];

              return (
                <Polygon
                  key={`flood-tile-${index}`}
                  positions={tile.positions}
                  pathOptions={{
                    fillColor: tileStyle.fill,
                    fillOpacity: tileStyle.opacity,
                    color: "transparent",
                    weight: 0,
                  }}
                />
              );
            })}
          </>
        )}

        {/* Typhoon Overlay (OpenWeatherMap Wind + Simulated Eye) */}
        {(overlayMode === 'typhoon' || overlayMode === 'emergency') && (
          <>
            {openWeatherAPIKey && (
              <TileLayer
                key="owm-wind"
                url={`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${openWeatherAPIKey}`}
                opacity={0.6}
                attribution='&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
              />
            )}
            <Circle
              center={typhoonCenter}
              radius={typhoonRadius}
              pathOptions={{ fillColor: '#ef4444', fillOpacity: 0.2, color: '#dc2626', weight: 2, dashArray: '10, 10' }}
            />
          </>
        )}

        {/* Route Overlay */}
        {overlayMode === 'route' && (
          <Polyline
            positions={routePoints}
            pathOptions={{ color: '#059669', weight: 6, opacity: 0.8 }}
          />
        )}

        {/* Live unresolved incidents from Firestore */}
        {reportedIncidents?.map((incident) => (
          <Marker
            key={incident.id}
            position={[incident.location.lat, incident.location.lng]}
            icon={OpenIncidentIcon}
          >
            <Popup>
              <strong>{incident.type.toUpperCase()}</strong>
              <br />
              Status: {incident.status}
              <br />
              Reporter: {incident.reporter}
              <br />
              {incident.location.address}
            </Popup>
          </Marker>
        ))}

        {/* Interactive Reporting Pin */}
        {overlayMode === 'report' && reportPin && (
          <Marker position={[reportPin.lat, reportPin.lng]} icon={ReportPinIcon}>
            <Popup>
              <strong>Incident Coordinates:</strong><br />
              {reportPin.lat.toFixed(4)}, {reportPin.lng.toFixed(4)}
            </Popup>
          </Marker>
        )}

        {/* Search Result Pin */}
        {activeSearchPin && (
          <Marker position={[activeSearchPin.lat, activeSearchPin.lng]} icon={SearchPinIcon}>
            <Popup className="font-inter">
              <div className="text-center p-1">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.15em] mb-1">Destination</p>
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  {activeSearchPin.label || "Searched Location"}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* --- HAZARD LEGEND OVERLAY --- */}
      {(overlayMode === 'flood' || overlayMode === 'typhoon') && (
        <div className="absolute bottom-8 left-8 z-[1000] bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-slate-100 font-inter min-w-[130px] animate-in fade-in zoom-in duration-300">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Flood Tiles</h4>
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-[6px] bg-[#FDE047] shadow-sm border border-[#FBBF24]/60 flex-shrink-0"></div>
              <span className="text-sm font-medium text-[#FBBF24]">Low</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-[6px] bg-[#F97316] shadow-sm border border-[#FB923C]/60 flex-shrink-0"></div>
              <span className="text-sm font-medium text-[#EA580C]">Medium</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-[6px] bg-[#EF4444] shadow-sm border border-[#F87171]/60 flex-shrink-0"></div>
              <span className="text-sm font-medium text-[#DC2626]">High</span>
            </div>
          </div>
        </div>
      )}

      {/* --- FLOATING UI OVERLAYS --- */}
      <div className="absolute top-24 right-8 bottom-24 z-[1001] w-full max-w-[450px] pointer-events-auto flex flex-col justify-center animate-in slide-in-from-right-8 duration-500">
        <RiskLevelPanel
          selectedLocation={focusPin || activeSearchPin}
          onLocationSelect={handleLocationSelect || handleLocationSelect}
          onReset={onReset || handleReset}
          reportedIncidents={reportedIncidents}
          onToggleRadar={(type) => onOverlayModeChange && onOverlayModeChange(type as any)}
          forceTab={forceTab}
          forceOpen={forceOpen}
        />
      </div>
    </div>
  );
}