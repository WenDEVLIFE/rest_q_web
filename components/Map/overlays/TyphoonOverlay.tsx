"use client";

import React from 'react';
import { Circle, Marker, Polygon, Polyline, TileLayer } from 'react-leaflet';
import { TyphoonEyeIcon } from '../utils/MapUtilities';

interface TyphoonOverlayProps {
  typhoonCenter: [number, number];
  typhoonRadius: number;
  forecastPath: [number, number][];
  openWeatherAPIKey?: string;
}

export function TyphoonOverlay({ 
  typhoonCenter, 
  typhoonRadius, 
  forecastPath,
  openWeatherAPIKey 
}: TyphoonOverlayProps) {
  return (
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
        pathOptions={{ fillColor: '#ef4444', fillOpacity: 0.35, color: '#dc2626', weight: 4, dashArray: '12, 12' }}
      />
      
      <Marker position={typhoonCenter} icon={TyphoonEyeIcon} />

      {/* Forecast Track Line */}
      {forecastPath.length > 0 && (
        <>
          {/* 1. Cone of Uncertainty (Approximated Polygon) */}
          {(() => {
            const leftPoints: [number, number][] = [];
            const rightPoints: [number, number][] = [];

            forecastPath.forEach((p, i) => {
              const spread = 0.05 + (i * 0.12);
              leftPoints.push([p[0] + (spread * 0.2), p[1] - (spread * 0.8)]);
              rightPoints.unshift([p[0] - (spread * 0.2), p[1] + (spread * 0.8)]);
            });

            const coneCoords = [...leftPoints, ...rightPoints];

            return (
              <Polygon
                positions={coneCoords}
                pathOptions={{
                  fillColor: '#ffffff',
                  fillOpacity: 0.15,
                  color: '#cbd5e1',
                  weight: 1,
                  dashArray: '4, 4'
                }}
              />
            );
          })()}

          {/* 2. Solid Track Line */}
          <Polyline
            positions={forecastPath}
            pathOptions={{
              color: '#dc2626',
              weight: 3,
              opacity: 0.8
            }}
          />

          {/* 3. Trajectory Nodes (Color coded dots) */}
          {forecastPath.map((p, i) => {
            const nodeColor = i === 0 ? '#ec4899' : i < 3 ? '#dc2626' : '#f97316';
            return (
              <Circle
                key={`track-node-${i}`}
                center={p}
                radius={1200}
                pathOptions={{
                  fillColor: nodeColor,
                  fillOpacity: 1,
                  color: '#ffffff',
                  weight: 2
                }}
              />
            );
          })}
        </>
      )}
    </>
  );
}
