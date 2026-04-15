"use client";

import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Incident } from '../../../src/types/incident';
import { getIconForType, OpenIncidentIcon, SearchPinIcon, ReportPinIcon } from '../utils/MapUtilities';

interface Establishment {
  Latitude: number;
  Longitude: number;
  Name: string;
  Phone?: string;
  "Establishment Type": string;
}

interface FacilityMarkersProps {
  facilities: Establishment[];
  onLocationSelect: (lat: number, lng: number, label: string) => void;
  onRouteMode: () => void;
}

export function FacilityMarkers({
  facilities,
  onLocationSelect,
  onRouteMode
}: FacilityMarkersProps) {
  return (
    <>
      {facilities.map((est, idx) => (
        <Marker
          key={idx}
          position={[est.Latitude, est.Longitude]}
          icon={getIconForType(est["Establishment Type"])}
        >
          <Popup className="font-inter">
            <div className="flex flex-col items-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{est["Establishment Type"]}</p>
              <p className="text-sm font-black text-slate-900 leading-tight mb-2 text-center">{est.Name}</p>

              {est.Phone && (
                <a
                  href={`tel:${est.Phone.split('/')[0].replace(/[^\d+]/g, '')}`}
                  className="text-[11px] font-bold text-blue-600 mb-4 hover:underline flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                  {est.Phone}
                </a>
              )}

              <button
                onClick={() => {
                  onLocationSelect(est.Latitude, est.Longitude, est.Name);
                  onRouteMode();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                Get Directions
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

interface IncidentMarkersProps {
  reportedIncidents?: Incident[];
}

export function IncidentMarkers({ reportedIncidents }: IncidentMarkersProps) {
  if (!reportedIncidents) return null;
  
  return (
    <>
      {reportedIncidents.map((incident) => (
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
    </>
  );
}

interface ReportMarkerProps {
  reportPin: { lat: number; lng: number } | null;
}

export function ReportMarker({ reportPin }: ReportMarkerProps) {
  if (!reportPin) return null;

  return (
    <Marker position={[reportPin.lat, reportPin.lng]} icon={ReportPinIcon}>
      <Popup>
        <strong>Incident Coordinates:</strong><br />
        {reportPin.lat.toFixed(4)}, {reportPin.lng.toFixed(4)}
      </Popup>
    </Marker>
  );
}

interface SearchMarkerProps {
  searchPin: { lat: number; lng: number; label?: string } | null;
}

export function SearchMarker({ searchPin }: SearchMarkerProps) {
  if (!searchPin) return null;

  return (
    <Marker position={[searchPin.lat, searchPin.lng]} icon={SearchPinIcon}>
      <Popup className="font-inter">
        <div className="text-center p-1">
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.15em] mb-1">Focus Location</p>
          <p className="text-xs font-bold text-slate-900 leading-tight">
            {searchPin.label || "Searched Location"}
          </p>
        </div>
      </Popup>
    </Marker>
  );
}
