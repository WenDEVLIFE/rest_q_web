"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents, Marker, Popup, Circle, Polygon, Polyline, Tooltip, LayersControl, LayerGroup } from 'react-leaflet';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { 
  Zap, 
  Flame, 
  Droplets, 
  Car, 
  AlertTriangle, 
  Loader2, 
  Phone, 
  Navigation,
  CloudRain,
  Layers,
  Mountain,
  X
} from 'lucide-react';
import { toast } from 'sonner';

import { Incident } from '../../src/types/incident';
import { useFacilities } from '../../src/hooks/useFacilities';
import { AdminHandler } from '../../src/agents/AdminDashboardAgent/AdminHandler';
import { ProneArea } from '../../src/types/prone_area';
import { ProneAreaPredictionService, type PredictedProneArea } from '../../src/service/ProneAreaPrediction_Service';
import { RouteXAIService, type TrafficStatus, sampleRoutePoints } from '../../src/service/RouteXAI_Service';
import { RiskLevelPanel } from '../User/RiskLevelPanel';
import { SidebarSearch } from '../User/SidebarSearch';

// Import modular components or keep them local if they are small enough
// Since I'm fixing a corrupted file, I'll define necessary sub-components or assume they are exported/available
// Looking at the previous code, it seems they were being imported from sub-folders but the corruption might have happened there too.
// Actually, I'll keep the modular imports if possible, but the previous output showed them.

// Re-defining modular components based on the "correct" version found in the lower part of the file
import { generateFloodTiles, trafficThoroughfares, isWithinSanFernando, trafficColors, floodHeatColors } from './utils/MapConstants';

interface InteractiveMapProps {
  overlayMode: 'none' | 'flood' | 'typhoon' | 'route' | 'report' | 'explore' | 'emergency' | 'traffic';
  reportPin?: { lat: number; lng: number } | null;
  searchPin?: { lat: number; lng: number; label?: string } | null;
  focusPin?: {
    label: string; lat: number; lng: number
  } | null;
  reportedIncidents?: Incident[];
  onMapClick?: (lat: number, lng: number) => void;
  onOverlayModeChange?: (mode: 'none' | 'flood' | 'typhoon' | 'route' | 'report' | 'explore' | 'emergency' | 'traffic') => void;
  forceTab?: 'metrics' | 'advisory' | 'what-to-do' | 'facilities';
  forceOpen?: boolean;
  onReset?: () => void;
  onLocationSelect?: (lat: number, lng: number, label: string) => void;
  onShowXai?: (context: 'route' | 'prone_area', data: any) => void;
}

// Internal Map Controller components
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

const MapController = ({ focusPin, stormFocus }: { 
  focusPin?: { lat: number, lng: number } | null,
  stormFocus?: [number, number] | null
}) => {
  const map = useMap();
  useEffect(() => {
    if (stormFocus) {
      map.flyTo(stormFocus, 10, { duration: 2 });
    } else if (focusPin) {
      map.flyTo([focusPin.lat, focusPin.lng], 16, { duration: 1.5 });
    }
  }, [focusPin, stormFocus, map]);
  return null;
};

const MapViewportTracker = ({ onBoundsChange }: { onBoundsChange: (bounds: L.LatLngBounds) => void }) => {
  const map = useMap();

  useEffect(() => {
    const syncBounds = () => onBoundsChange(map.getBounds());

    syncBounds();

    map.on('moveend', syncBounds);
    map.on('zoomend', syncBounds);

    return () => {
      map.off('moveend', syncBounds);
      map.off('zoomend', syncBounds);
    };
  }, [map, onBoundsChange]);

  return null;
};

// Icons
const SearchPinIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const ReportPinIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const OpenIncidentIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const TyphoonEyeIcon = L.divIcon({
  className: 'custom-typhoon-eye',
  html: renderToStaticMarkup(
    <div className="relative flex items-center justify-center">
      <div className="absolute w-12 h-12 bg-red-500/20 rounded-full animate-ping"></div>
      <div className="relative w-8 h-8 bg-red-600 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
        <Zap size={14} className="text-white fill-white" />
      </div>
    </div>
  ),
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const getIconForType = (type: string) => {
  const color = type === 'Healthcare Facility' ? 'green' : type === 'Emergency Response' ? 'red' : 'blue';
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

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
  onReset,
  onLocationSelect,
  onShowXai
}: InteractiveMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const { facilities } = useFacilities();
  const [liveTyphoon, setLiveTyphoon] = useState<{
    lat: number,
    lng: number,
    name: string,
    speed: number,
    forecastPath?: [number, number][]
  } | null>(null);
  const [stormFocusTrigger, setStormFocusTrigger] = useState<[number, number] | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [liveProneAreas, setLiveProneAreas] = useState<ProneArea[]>([]);
  const [predictedProneAreas, setPredictedProneAreas] = useState<PredictedProneArea[]>([]);
  const [liveTrafficSegments, setLiveTrafficSegments] = useState<any[]>([]);
  const [roadDebugMode, setRoadDebugMode] = useState(false);
  const [showLayersModal, setShowLayersModal] = useState(false);
  const [useTerrainBasemap, setUseTerrainBasemap] = useState(false);
  const [viewportBounds, setViewportBounds] = useState<L.LatLngBounds | null>(null);
  const [pluginLayerState, setPluginLayerState] = useState({
    flood: false,
    typhoon: false,
    traffic: false,
  });

  const fetchLiveProneAreas = useCallback(async () => {
    const data = await AdminHandler.getProneAreas();
    setLiveProneAreas(data);
  }, []);

  const fetchLiveTraffic = useCallback(async () => {
    const data = await AdminHandler.getTrafficSegments();
    if (data.length > 0) setLiveTrafficSegments(data);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const fetchTyphoon = async () => {
      try {
        const res = await fetch('/api/typhoon');
        const json = await res.json();
        if (json.success && json.data) {
          setLiveTyphoon(json.data);
        }
      } catch (e) {
        console.error("Failed to fetch live typhoon telemetry", e);
      }
    };
    fetchTyphoon();
    fetchLiveProneAreas();
    fetchLiveTraffic();
  }, [isMounted, fetchLiveProneAreas, fetchLiveTraffic]);

  useEffect(() => {
    const predicted = ProneAreaPredictionService.predictProneAreas({
      typhoon: liveTyphoon,
      incidents: reportedIncidents || [],
      existingProneAreas: liveProneAreas,
    });
    setPredictedProneAreas(predicted);
  }, [liveTyphoon, reportedIncidents, liveProneAreas]);

  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);
  const [routeIsLoading, setRouteIsLoading] = useState(false);
  const viewportBoundsKeyRef = useRef<string>('');

  const handleViewportBoundsChange = useCallback((bounds: L.LatLngBounds) => {
    const nextKey = [
      bounds.getSouthWest().lat.toFixed(5),
      bounds.getSouthWest().lng.toFixed(5),
      bounds.getNorthEast().lat.toFixed(5),
      bounds.getNorthEast().lng.toFixed(5),
    ].join(':');

    if (viewportBoundsKeyRef.current === nextKey) return;

    viewportBoundsKeyRef.current = nextKey;
    setViewportBounds(bounds);
  }, []);

  const generateRealisticRoute = useCallback(async (start: [number, number], end: [number, number]) => {
    setRouteIsLoading(true);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const coords = data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]) as [number, number][];
        setRoutePoints(sampleRoutePoints(coords, 250)); // High-density sample limit to prevent useMemo crashing map
      } else {
        throw new Error("Route discovery failed at the API level.");
      }
    } catch (error) {
      console.warn("Routing engine unavailable (rate limit/network), falling back to straight-line path.");
      const midLat = start[0];
      const midLng = end[1];
      setRoutePoints([start, [midLat, midLng], end]);
    } finally {
      setRouteIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (overlayMode === 'route' && focusPin) {
      const startingPoint = reportPin || { lat: 15.0286, lng: 120.6898 };
      generateRealisticRoute(
        [startingPoint.lat, startingPoint.lng],
        [focusPin.lat, focusPin.lng]
      );
    }
  }, [overlayMode, focusPin, reportPin, generateRealisticRoute]);

  const center: [number, number] = [15.0286, 120.6898];
  const [localSearchPin, setLocalSearchPin] = useState<{ lat: number, lng: number, label?: string } | null>(null);

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const floodTiles = useMemo(() => generateFloodTiles(), []);

  const activeSearchPin = focusPin || externalSearchPin || localSearchPin;
  const openWeatherAPIKey = process.env.NEXT_PUBLIC_OPEN_WEATHER_API_KEY;
  const mapTilerKey = process.env.NEXT_PUBLIC_OPEN_MAPTILER_API_KEY;
  const tileUrl = useTerrainBasemap
    ? 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
    : `https://api.maptiler.com/maps/topo-v2/256/{z}/{x}/{y}.png?key=${mapTilerKey}`;
  const attribution = '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; OpenStreetMap contributors';

  const roadLayer = liveTrafficSegments.length > 0 ? liveTrafficSegments : trafficThoroughfares;
  const showFloodOverlay = overlayMode === 'emergency' || overlayMode === 'flood' || pluginLayerState.flood;
  const showTyphoonOverlay = overlayMode === 'emergency' || overlayMode === 'typhoon' || pluginLayerState.typhoon;
  const showTrafficOverlay = overlayMode === 'emergency' || overlayMode === 'traffic' || pluginLayerState.traffic;

  useEffect(() => {
    setPluginLayerState((prev) => ({
      flood: overlayMode === 'flood' || overlayMode === 'emergency' ? true : prev.flood,
      typhoon: overlayMode === 'typhoon' || overlayMode === 'emergency' ? true : prev.typhoon,
      traffic: overlayMode === 'traffic' || overlayMode === 'emergency' ? true : prev.traffic,
    }));
  }, [overlayMode]);

  const visibleRoads = roadDebugMode
    ? roadLayer.filter((road) => {
        if (!viewportBounds) return true;

        if (Array.isArray(road.center) && road.center.length >= 2) {
          return viewportBounds.contains([road.center[0], road.center[1]]);
        }

        if (Array.isArray(road.path)) {
          return road.path.some((point: [number, number]) => viewportBounds.contains([point[0], point[1]]));
        }

        return true;
      })
    : [];

  const hasValidPath = (path: unknown): path is [number, number][] => {
    return (
      Array.isArray(path) &&
      path.length > 0 &&
      path.every(
        (point) =>
          Array.isArray(point) &&
          point.length >= 2 &&
          Number.isFinite(point[0]) &&
          Number.isFinite(point[1])
      )
    );
  };

  const getRoadDebugLabel = (road: any) => {
    const status = road.status || 'fluid';
    return `${road.name || 'Road'} • ${String(status).toUpperCase()}`;
  };

  const handleLocationSelect = (lat: number, lng: number, label: string) => {
    const isLocal = isWithinSanFernando(lat, lng);
    if (!isLocal && label === "Your Current Location") {
      toast.warning("You are currently outside San Fernando. Emergency response metrics may be limited.");
    }
    setLocalSearchPin({ lat, lng, label });
    if (onLocationSelect) {
      onLocationSelect(lat, lng, label);
    }
  };

  const handleReset = () => {
    setLocalSearchPin(null);
    if (onReset) onReset();
  };

  const forecastPath = liveTyphoon?.forecastPath || [];
  const typhoonCenter: [number, number] = forecastPath.length > 0
    ? [...forecastPath[0]] as [number, number]
    : (liveTyphoon ? [liveTyphoon.lat, liveTyphoon.lng] : [14.9500, 120.8000]);
  const typhoonRadius = liveTyphoon ? (liveTyphoon.speed * 1000) : 15000;
  const typhoonName = liveTyphoon?.name || "Simulated Tropical Storm";

  const haversineKm = useCallback((a: [number, number], b: [number, number]) => {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(b[0] - a[0]);
    const dLng = toRad(b[1] - a[1]);
    const aa =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
    return R * c;
  }, []);

  const inferTrafficFromLabel = useCallback((): TrafficStatus => {
    const label = focusPin?.label || '';
    const match = label.match(/\[traffic:(low|moderate|heavy)\]/i);
    const token = match?.[1]?.toLowerCase();
    if (token === 'low') return 'fluid';
    if (token === 'heavy') return 'heavy';
    return 'moderate';
  }, [focusPin?.label]);

  const nearestRoadStatus = useCallback((point: [number, number]): TrafficStatus => {
    const fallback = inferTrafficFromLabel();
    let best: { dist: number; status: TrafficStatus } = { dist: Number.POSITIVE_INFINITY, status: fallback };

    for (const road of roadLayer) {
      if (!Array.isArray(road?.path)) continue;
      for (const p of road.path as [number, number][]) {
        const d = haversineKm(point, [p[0], p[1]]);
        if (d < best.dist) {
          const status = road.status === 'heavy' ? 'heavy' : road.status === 'moderate' ? 'moderate' : 'fluid';
          best = { dist: d, status };
        }
      }
    }

    return best.dist <= 0.55 ? best.status : fallback;
  }, [haversineKm, inferTrafficFromLabel, roadLayer]);

  const routeSegments = useMemo(() => {
    if (routePoints.length < 2) return [] as Array<{ points: [number, number][]; status: TrafficStatus }>;

    const segs: Array<{ points: [number, number][]; status: TrafficStatus }> = [];
    for (let i = 1; i < routePoints.length; i++) {
      const a = routePoints[i - 1];
      const b = routePoints[i];
      const midpoint: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      segs.push({ points: [a, b], status: nearestRoadStatus(midpoint) });
    }

    return segs;
  }, [nearestRoadStatus, routePoints]);

  const routeTelemetry = useMemo(() => {
    const statuses = routeSegments.map((s) => s.status);
    return RouteXAIService.buildTelemetry(routePoints, statuses);
  }, [routePoints, routeSegments]);

  const routeResponseTimeMin = useMemo(() => {
    if (overlayMode !== 'route' || routeTelemetry.segmentCount === 0) return undefined;
    return Math.max(6, routeTelemetry.estimatedMinutes);
  }, [overlayMode, routeTelemetry]);

  if (!isMounted) {
    return (
      <div className="absolute inset-0 w-full h-full bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <div id="res-q-map-container" className="absolute inset-0 w-full h-full z-0">
      <MapContainer
        key="res-q-interactive-map"
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked={!useTerrainBasemap} name="Topo Streets">
            <TileLayer attribution={attribution} url={`https://api.maptiler.com/maps/topo-v2/256/{z}/{x}/{y}.png?key=${mapTilerKey}`} />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer checked={useTerrainBasemap} name="Terrain Elevation">
            <TileLayer attribution={attribution} url={'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'} />
          </LayersControl.BaseLayer>

          <LayersControl.Overlay checked={pluginLayerState.flood} name="Flood Raster Layer">
            <LayerGroup
              eventHandlers={{
                add: () => setPluginLayerState((prev) => ({ ...prev, flood: true })),
                remove: () => setPluginLayerState((prev) => ({ ...prev, flood: false })),
              }}
            />
          </LayersControl.Overlay>

          <LayersControl.Overlay checked={pluginLayerState.typhoon} name="Typhoon Wind Layer">
            <LayerGroup
              eventHandlers={{
                add: () => setPluginLayerState((prev) => ({ ...prev, typhoon: true })),
                remove: () => setPluginLayerState((prev) => ({ ...prev, typhoon: false })),
              }}
            />
          </LayersControl.Overlay>

          <LayersControl.Overlay checked={pluginLayerState.traffic} name="Traffic Congestion Layer">
            <LayerGroup
              eventHandlers={{
                add: () => setPluginLayerState((prev) => ({ ...prev, traffic: true })),
                remove: () => setPluginLayerState((prev) => ({ ...prev, traffic: false })),
              }}
            />
          </LayersControl.Overlay>
        </LayersControl>
        
        <MapEvents onMapClick={overlayMode === 'report' ? onMapClick : undefined} />
        <MapController focusPin={focusPin || activeSearchPin} stormFocus={stormFocusTrigger} />
          <MapViewportTracker onBoundsChange={handleViewportBoundsChange} />

        {/* Facilities */}
        {facilities.map((est, idx) => (
          <Marker key={idx} position={[est.Latitude, est.Longitude]} icon={getIconForType(est["Establishment Type"])}>
            <Popup className="font-inter">
              <div className="flex flex-col items-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{est["Establishment Type"]}</p>
                <p className="text-sm font-black text-slate-900 leading-tight mb-2 text-center">{est.Name}</p>
                {est.Phone && (
                  <a href={`tel:${est.Phone}`} className="text-[11px] font-bold text-blue-600 mb-4 hover:underline flex items-center gap-1">
                    <Phone size={10} /> {est.Phone}
                  </a>
                )}
                <button
                  onClick={() => {
                    handleLocationSelect(est.Latitude, est.Longitude, est.Name);
                    onOverlayModeChange?.('route');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                  <Navigation size={12} /> Get Directions
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Flood Overlay */}
        {showFloodOverlay && (
          floodTiles.map((tile, index) => (
            <Polygon
              key={`flood-tile-${index}`}
              positions={tile.positions}
              pathOptions={{
                fillColor: floodHeatColors[tile.level]?.fill || '#FDE047',
                fillOpacity: floodHeatColors[tile.level]?.opacity || 0.4,
                color: "transparent",
                weight: 0,
              }}
            />
          ))
        )}

        {/* Typhoon Overlay */}
        {showTyphoonOverlay && (
          <>
            {openWeatherAPIKey && (
              <TileLayer
                key="owm-wind"
                url={`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${openWeatherAPIKey}`}
                opacity={0.6}
              />
            )}
            <Circle center={typhoonCenter} radius={typhoonRadius} pathOptions={{ fillColor: '#ef4444', fillOpacity: 0.35, color: '#dc2626', weight: 4, dashArray: '12, 12' }} />
            <Marker position={typhoonCenter} icon={TyphoonEyeIcon} />
            {forecastPath.length > 0 && (
              <Polyline positions={forecastPath} pathOptions={{ color: '#dc2626', weight: 3, opacity: 0.8 }} />
            )}
          </>
        )}

        {/* Traffic Overlay */}
        {showTrafficOverlay && (
          roadLayer.filter((road) => hasValidPath(road.path)).map((road, i) => (
            <Polyline 
              key={`traffic-${i}`} 
              positions={road.path} 
              pathOptions={{ color: trafficColors[road.status] || '#22c55e', weight: 4, opacity: 0.8 }}
            >
              <Popup>
                <div className="font-inter">
                  <p className="text-[10px] font-black uppercase text-slate-400">Road Telemetry</p>
                  <p className="text-xs font-bold text-slate-900">{road.name}</p>
                  <p className="text-[11px] font-bold uppercase mt-1">Status: {road.status || 'fluid'}</p>
                </div>
              </Popup>
            </Polyline>
          ))
        )}

        {/* Road Debug Overlay */}
        {roadDebugMode && visibleRoads.filter((road) => hasValidPath(road.path)).map((road, i) => (
          <Polyline
            key={`road-debug-${i}`}
            positions={road.path}
            pathOptions={{
              color: trafficColors[road.status] || '#22c55e',
              weight: 8,
              opacity: 0.95,
              dashArray: road.status === 'heavy' ? '1, 0' : road.status === 'moderate' ? '8, 8' : '14, 10',
            }}
          >
            <Tooltip permanent direction="center" className="font-inter">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 bg-white/90 px-2 py-1 rounded-lg shadow-sm border border-slate-100">
                {getRoadDebugLabel(road)}
              </span>
            </Tooltip>
            <Popup>
              <div className="font-inter">
                <p className="text-[10px] font-black uppercase text-slate-400">Admin ML Road Debug</p>
                <p className="text-xs font-bold text-slate-900">{road.name}</p>
                <p className="text-[11px] font-bold uppercase mt-1">Status: {road.status || 'fluid'}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1">Visible in current map bounds</p>
              </div>
            </Popup>
          </Polyline>
        ))}

        {/* Route Overlay */}
        {overlayMode === 'route' && (
          <>
            {routeSegments.length > 0 ? (
              routeSegments.map((segment, idx) => (
                <Polyline
                  key={`route-segment-${idx}`}
                  positions={segment.points}
                  pathOptions={{ color: trafficColors[segment.status] || '#f59e0b', weight: 6, opacity: 0.92 }}
                />
              ))
            ) : (
              <Polyline positions={routePoints} pathOptions={{ color: '#059669', weight: 6, opacity: 0.9 }} />
            )}
            {focusPin && <Marker position={[focusPin.lat, focusPin.lng]} icon={ReportPinIcon} />}
          </>
        )}

        {/* Prone Areas */}
        {liveProneAreas.map((area) => (
          <Circle
            key={area.id}
            center={[area.lat, area.lng]}
            radius={area.radius}
            pathOptions={{
              fillColor: area.status === 'Unfixed' ? (area.category === 'Fire' ? '#ef4444' : '#2563eb') : '#059669',
              fillOpacity: 0.25,
              color: area.status === 'Unfixed' ? '#dc2626' : '#059669',
              weight: 3
            }}
          >
            <Popup className="font-inter">
              <div className="min-w-[200px]">
                <h4 className="text-sm font-black text-slate-900">{area.name}</h4>
                <p className="text-[10px] text-slate-500 italic mt-1 pb-2 border-b border-slate-100">{area.notes}</p>
                <button 
                  onClick={() => onShowXai?.('prone_area', area)}
                  className="w-full mt-3 flex items-center justify-center gap-2 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                  <Zap size={12} /> View Proof (ML Logic)
                </button>
              </div>
            </Popup>
          </Circle>
        ))}

        {/* Predicted Prone Areas (ML Forecast) */}
        {(overlayMode === 'flood' || overlayMode === 'typhoon' || overlayMode === 'emergency') && predictedProneAreas.map((area) => (
          <Circle
            key={area.id}
            center={[area.lat, area.lng]}
            radius={area.radius}
            pathOptions={{
              fillColor: '#8b5cf6',
              fillOpacity: 0.2,
              color: '#7c3aed',
              weight: 2,
              dashArray: '8, 8'
            }}
          >
            <Popup className="font-inter">
              <div className="min-w-[220px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-violet-700 uppercase tracking-widest">ML Forecast Zone</span>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">{area.confidence}%</span>
                </div>
                <h4 className="text-sm font-black text-slate-900">{area.name}</h4>
                <p className="text-[10px] font-bold text-slate-600 mt-1">Risk Score: {area.riskScore}/10 • Radius: {area.radius}m</p>
                <p className="text-[10px] text-slate-500 italic mt-2 pb-2 border-b border-slate-100">{area.notes}</p>
                <button
                  onClick={() => onShowXai?.('prone_area', {
                    ...area,
                    status: 'Unfixed',
                    category: 'Flood',
                  })}
                  className="w-full mt-3 flex items-center justify-center gap-2 py-2 bg-violet-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                  <Zap size={12} /> View Prediction Logic
                </button>
              </div>
            </Popup>
          </Circle>
        ))}

        {/* Incidents */}
        {reportedIncidents?.map((incident) => (
          <Marker key={incident.id} position={[incident.location.lat, incident.location.lng]} icon={OpenIncidentIcon}>
            <Popup>
              <strong>{incident.type.toUpperCase()}</strong> - {incident.status}
              <br />{incident.location.address}
            </Popup>
          </Marker>
        ))}

        {/* Reporting/Search Pins */}
        {overlayMode === 'report' && reportPin && (
          <Marker position={[reportPin.lat, reportPin.lng]} icon={ReportPinIcon} />
        )}
        {activeSearchPin && (
          <Marker position={[activeSearchPin.lat, activeSearchPin.lng]} icon={SearchPinIcon}>
            <Popup className="font-inter">
              <p className="text-xs font-bold text-slate-900">{activeSearchPin.label || "Selected Location"}</p>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Hazard Legend Overlay */}
      {(overlayMode === 'flood' || overlayMode === 'typhoon') && (
        <div className="absolute bottom-4 left-3 right-3 sm:bottom-8 sm:left-8 sm:right-auto z-[1000] bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-2xl border border-slate-100 font-inter animate-in fade-in zoom-in sm:w-auto">
          <div className="flex items-center justify-between mb-3 gap-3">
            <h4 className="text-xs font-black uppercase text-slate-800">Hazard Intensity</h4>
            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-amber-500 text-white">ML Raster</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3"><div className="w-4 h-4 rounded bg-[#FDE047]"></div><span className="text-xs font-bold text-slate-600">Low</span></div>
            <div className="flex items-center gap-3"><div className="w-4 h-4 rounded bg-[#F97316]"></div><span className="text-xs font-bold text-slate-600">Medium</span></div>
            <div className="flex items-center gap-3"><div className="w-4 h-4 rounded bg-[#EF4444]"></div><span className="text-xs font-bold text-slate-600">High</span></div>
          </div>
        </div>
      )}

      {overlayMode === 'route' && routeTelemetry.segmentCount > 0 && (
        <div className="absolute top-4 right-4 z-[1002] pointer-events-auto">
          <button
            onClick={() => onShowXai?.('route', {
              routeLabel: focusPin?.label || 'Selected Route',
              etaMinutes: routeTelemetry.estimatedMinutes,
              traffic: routeTelemetry.statusBreakdownKm.heavy > routeTelemetry.statusBreakdownKm.moderate ? 'heavy' : routeTelemetry.statusBreakdownKm.moderate > 0 ? 'moderate' : 'low',
              incident: (reportedIncidents || []).length > 0,
              dist: routeTelemetry.totalDistanceKm,
              model: routeTelemetry,
              visibleRoads: roadLayer.length,
              reportedIncidents: (reportedIncidents || []).length,
              proneAreas: liveProneAreas.length,
            })}
            className="px-4 py-3 rounded-2xl border border-indigo-200 bg-white/95 backdrop-blur-md shadow-lg text-[10px] font-black uppercase tracking-widest text-indigo-700 hover:bg-indigo-50"
          >
            View Route Proof + Ask AI
          </button>
        </div>
      )}

      <div
        className={`absolute z-[1002] pointer-events-auto flex flex-col gap-2 ${
          forceOpen || overlayMode === 'emergency'
            ? 'top-[14.5rem] left-3 sm:left-8'
            : 'top-4 left-4'
        }`}
      >
        <button
          onClick={() => setShowLayersModal(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl border shadow-lg backdrop-blur-md transition-all font-black uppercase tracking-widest text-[10px] bg-white/95 text-slate-700 border-slate-200 hover:bg-slate-50"
          title="Map Layers"
        >
          <Layers className="w-4 h-4" />
          Layers
        </button>
        <button
          onClick={() => setRoadDebugMode((prev) => !prev)}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl border shadow-lg backdrop-blur-md transition-all font-black uppercase tracking-widest text-[10px] ${roadDebugMode ? 'bg-slate-900 text-white border-slate-800' : 'bg-white/95 text-slate-700 border-slate-200 hover:bg-slate-50'}`}
          title="Toggle all roads in current viewport"
        >
          <Car className="w-4 h-4" />
          View All Roads
        </button>
        {roadDebugMode && (
          <div className="p-3 rounded-2xl bg-white/95 border border-slate-200 shadow-lg backdrop-blur-md text-[10px] font-bold text-slate-600 max-w-[220px] animate-in fade-in">
            ✓ Showing all roads in current view<br/>🔴 Red = Heavy traffic<br/>🟡 Amber = Moderate<br/>🟢 Green = Fluid
          </div>
        )}
      </div>

      {showLayersModal && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowLayersModal(false)} />
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-sky-600" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Map Layers</h3>
              </div>
              <button onClick={() => setShowLayersModal(false)} className="p-2 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <button
                onClick={() => setUseTerrainBasemap((prev) => !prev)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border text-left ${useTerrainBasemap ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}
              >
                <div className="flex items-center gap-3">
                  <Mountain className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="text-xs font-black text-slate-900">Terrain / Elevation Basemap</p>
                    <p className="text-[10px] font-bold text-slate-500">Topographic relief visualization</p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-white border border-slate-200">{useTerrainBasemap ? 'On' : 'Off'}</span>
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => onOverlayModeChange?.('flood')} className="px-3 py-2 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50">Flood</button>
                <button onClick={() => onOverlayModeChange?.('typhoon')} className="px-3 py-2 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50">Typhoon</button>
                <button onClick={() => onOverlayModeChange?.('traffic')} className="px-3 py-2 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50">Traffic</button>
                <button onClick={() => onOverlayModeChange?.('emergency')} className="px-3 py-2 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50">Emergency</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UI Panels */}
      <div className="absolute top-24 bottom-24 left-3 right-3 sm:left-auto sm:right-8 z-[1001] w-auto sm:w-full sm:max-w-[450px] pointer-events-auto flex flex-col justify-center">
        <RiskLevelPanel 
          selectedLocation={focusPin || activeSearchPin}
          onLocationSelect={handleLocationSelect}
          onReset={handleReset}
          reportedIncidents={reportedIncidents}
          onToggleRadar={(type) => onOverlayModeChange?.(type as any)}
          overlayMode={overlayMode}
          forceTab={forceTab}
          forceOpen={forceOpen}
          typhoonName={typhoonName}
          routeResponseTimeMin={routeResponseTimeMin}
          onShowXai={(data) => {
            // Because RiskLevelPanel has some cards returning prone_area OR route mock data
            // We safely check if the data has prone area attributes. If not, fallback to route.
            const isRoute = data.time || data.traffic || data.dist;
            onShowXai?.(isRoute ? 'route' : 'prone_area', data);
          }}
          onLocateStorm={() => {
            setStormFocusTrigger([...typhoonCenter]);
            setTimeout(() => setStormFocusTrigger(null), 3000);
          }}
        />
      </div>

      {(forceOpen || overlayMode !== 'report') && (
        <div
          className={`absolute left-3 right-3 sm:left-8 sm:right-auto z-[1002] w-auto sm:w-full sm:max-w-[320px] pointer-events-auto ${
            forceOpen || overlayMode === 'emergency' ? 'top-44' : 'top-32'
          }`}
        >
          <SidebarSearch onLocationSelect={handleLocationSelect} onReset={handleReset} initialValue={focusPin?.label} />
        </div>
      )}
    </div>
  );
}