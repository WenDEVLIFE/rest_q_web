"use client";

import React from 'react';
import { Polygon } from 'react-leaflet';
import { FloodTile, floodHeatColors } from '../utils/MapConstants';

interface FloodOverlayProps {
  floodTiles: FloodTile[];
}

export function FloodOverlay({ floodTiles }: FloodOverlayProps) {
  return (
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
  );
}
