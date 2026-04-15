import React from 'react';
import L from 'leaflet';
import { AlertTriangle, Flame, Droplets, Car } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

// Icon cache to prevent recreating on every render
export const iconCache: Record<string, L.DivIcon> = {};

// Utility functions
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
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

export const distanceToSegmentKm = (
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

export const createTile = (centerLat: number, centerLng: number, sizeLat: number, sizeLng: number): [number, number][] => {
  const halfLat = sizeLat / 2;
  const halfLng = sizeLng / 2;

  return [
    [centerLat - halfLat, centerLng - halfLng],
    [centerLat - halfLat, centerLng + halfLng],
    [centerLat + halfLat, centerLng + halfLng],
    [centerLat + halfLat, centerLng - halfLng],
  ];
};

// Icon factory function
export const getIconForType = (type: string) => {
  if (iconCache[type]) return iconCache[type];

  let colorClass = "bg-primary shadow-primary/40";
  let svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/></svg>`; // Shield

  if (type === "Healthcare Facility") {
    colorClass = "bg-rose-500 shadow-rose-500/40";
    svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`; // Heart
  } else if (type === "Emergency Service") {
    colorClass = "bg-red-500 shadow-red-500/40";
    svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`; // Flame
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

// Special icons
export const TyphoonEyeIcon = L.divIcon({
  className: "custom-typhoon-eye",
  html: `
    <div class="relative w-16 h-16 -ml-8 -mt-8">
      <div class="absolute inset-0 rounded-full bg-red-500/20 animate-ping duration-[3000ms]"></div>
      <div class="absolute inset-0 rounded-full border-4 border-dashed border-red-600 animate-spin duration-[10000ms]"></div>
      <div class="absolute inset-1/4 rounded-full bg-red-600 border-2 border-white shadow-lg flex items-center justify-center text-white">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><circle cx="12" cy="12" r="3"/></svg>
      </div>
    </div>
  `,
  iconSize: [64, 64],
  iconAnchor: [32, 32],
});

export const ReportPinIcon = L.divIcon({
  className: "custom-report-icon",
  html: `
    <div class="relative w-12 h-12 -ml-6 -mt-12 group cursor-pointer drop-shadow-xl animate-bounce">
      <div class="absolute inset-0 bg-red-600/20 rounded-xl translate-y-1 blur-[3px]"></div>
      <div class="relative w-12 h-12 rounded-[14px] bg-red-600 text-white flex items-center justify-center border-[3px] border-white z-10">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
      </div>
      <div class="absolute -bottom-1.5 left-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent border-t-white -translate-x-1/2 z-10"></div>
      <div class="absolute -bottom-2 left-1/2 w-6 h-2 bg-black/20 blur-[2px] rounded-full -translate-x-1/2"></div>
    </div>
  `,
  iconSize: [48, 48],
  iconAnchor: [24, 48],
});

export const OpenIncidentIcon = L.divIcon({
  className: 'custom-open-incident-icon',
  html: `
    <div class="relative w-10 h-10 -ml-5 -mt-10">
      <div class="absolute inset-0 rounded-full bg-red-500/30 animate-ping"></div>
      <div class="absolute inset-0 rounded-full bg-red-600 border-2 border-white flex items-center justify-center text-white shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
      </div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

export const SearchPinIcon = L.divIcon({
  className: "custom-search-icon",
  html: `
    <div class="relative w-12 h-12 -ml-6 -mt-12 group cursor-pointer drop-shadow-xl animate-in zoom-in-50 duration-500">
      <div class="absolute inset-0 bg-primary/20 rounded-xl translate-y-1 blur-[3px]"></div>
      <div class="relative w-12 h-12 rounded-[14px] bg-primary text-white flex items-center justify-center border-[3px] border-white z-10 transition-transform group-hover:-translate-y-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="11" r="3"/><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z"/></svg>
      </div>
      <div class="absolute -bottom-1.5 left-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent border-t-white -translate-x-1/2 z-10 transition-transform group-hover:-translate-y-1"></div>
    </div>
  `,
  iconSize: [48, 48],
  iconAnchor: [24, 48],
  popupAnchor: [0, -50],
});

// Category icon factory for prone areas
export const getCategoryIcon = (category: string) => {
  let borderColor = 'border-slate-500 text-slate-500';
  let IconComponent = AlertTriangle;
  
  if (category === 'Fire') {
    borderColor = 'border-red-500 text-red-500';
    IconComponent = Flame;
  } else if (category === 'Flood') {
    borderColor = 'border-blue-500 text-blue-500';
    IconComponent = Droplets;
  } else if (category === 'Accident') {
    borderColor = 'border-amber-500 text-amber-500';
    IconComponent = Car;
  }
  
  return L.divIcon({
    className: 'custom-category-icon',
    html: renderToStaticMarkup(
      <div className={`p-1.5 rounded-full bg-white shadow-lg border-2 ${borderColor}`}>
        <IconComponent size={12} strokeWidth={3} />
      </div>
    ),
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};
