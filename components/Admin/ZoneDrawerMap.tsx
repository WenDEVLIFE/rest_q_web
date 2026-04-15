"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

interface ZoneDrawerMapProps {
  initialCenter: [number, number];
  initialRadius: number;
  category: 'Fire' | 'Flood' | 'Accident' | 'Other';
  onZoneUpdate: (lat: number, lng: number, radius: number) => void;
  onCenterUpdate: (center: [number, number]) => void;
}

const ZoneDrawController = ({ 
  onZoneUpdate,
  onCenterUpdate
}: { 
  onZoneUpdate: (lat: number, lng: number, radius: number) => void;
  onCenterUpdate: (center: [number, number]) => void;
}) => {
  const map = useMap();
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [radius, setRadius] = useState(500);
  const [isDrawing, setIsDrawing] = useState(false);
  const startPointRef = useRef<{ x: number; y: number; initialRadius: number } | null>(null);

  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    if (!isDrawing) {
      const newCenter: [number, number] = [e.latlng.lat, e.latlng.lng];
      setCenter(newCenter);
      setRadius(500);
      onCenterUpdate(newCenter);
      onZoneUpdate(e.latlng.lat, e.latlng.lng, 500);
    }
  }, [isDrawing, onZoneUpdate, onCenterUpdate]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (!center) return;
    setIsDrawing(true);
    startPointRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialRadius: radius
    };
  }, [center, radius]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDrawing || !startPointRef.current || !center) return;

    const deltaX = e.clientX - startPointRef.current.x;
    const deltaY = e.clientY - startPointRef.current.y;
    const pixelDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    const meterDelta = pixelDistance * 2;
    const newRadius = Math.max(50, startPointRef.current.initialRadius + meterDelta);

    setRadius(newRadius);
    onZoneUpdate(center[0], center[1], newRadius);
  }, [isDrawing, center, onZoneUpdate]);

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  useEffect(() => {
    if (!isDrawing) return;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDrawing, handleMouseMove, handleMouseUp]);

  useMapEvents({
    click: handleMapClick
  });

  useEffect(() => {
    const container = map.getContainer();
    container.addEventListener('mousedown', handleMouseDown);
    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
    };
  }, [map, handleMouseDown]);

  return null;
};

export const ZoneDrawerMap = ({
  initialCenter,
  initialRadius,
  category,
  onZoneUpdate,
  onCenterUpdate
}: ZoneDrawerMapProps) => {
  const [center, setCenter] = useState(initialCenter);
  const [radius, setRadius] = useState(initialRadius);

  const handleCenterUpdate = useCallback((newCenter: [number, number]) => {
    setCenter(newCenter);
    onCenterUpdate(newCenter);
  }, [onCenterUpdate]);

  return (
    <MapContainer
      center={center}
      zoom={14}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      <ZoneDrawController 
        onZoneUpdate={onZoneUpdate}
        onCenterUpdate={handleCenterUpdate}
      />
      {center && (
        <>
          <Circle
            center={center}
            radius={radius}
            pathOptions={{
              color: category === 'Fire' ? '#ea580c' : 
                     category === 'Flood' ? '#0284c7' : 
                     category === 'Accident' ? '#059669' : '#6b7280',
              fillColor: category === 'Fire' ? '#fed7aa' : 
                        category === 'Flood' ? '#bae6fd' : 
                        category === 'Accident' ? '#d1fae5' : '#e5e7eb',
              fillOpacity: 0.3,
              weight: 3,
              dashArray: '5, 5'
            }}
          />
          <Marker position={center} />
        </>
      )}
    </MapContainer>
  );
};
