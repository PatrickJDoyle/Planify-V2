'use client';

import type { ReactNode } from 'react';
import { Circle, GoogleMap, Marker } from '@react-google-maps/api';
import { ENTERPRISE_MAP_STYLES } from '@/lib/maps/map-styles';
import { getZoomForRadius } from '@/lib/maps/map-zoom';
import { cn } from '@/lib/utils';

export interface StudyAreaPreviewProps {
  isLoaded: boolean;
  center: { lat: number; lng: number };
  radiusMeters: number;
  height?: number;
  className?: string;
  caption?: ReactNode;
  draggableMarker?: boolean;
  onMarkerDragEnd?: (e: google.maps.MapMouseEvent) => void;
}

export function StudyAreaPreview({
  isLoaded,
  center,
  radiusMeters,
  height = 280,
  className,
  caption,
  draggableMarker = false,
  onMarkerDragEnd,
}: StudyAreaPreviewProps) {
  if (!isLoaded) return null;

  return (
    <div className={cn('overflow-hidden rounded-lg border border-border', className)}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height }}
        center={center}
        zoom={getZoomForRadius(radiusMeters)}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: ENTERPRISE_MAP_STYLES,
        }}
      >
        <Marker
          position={center}
          draggable={draggableMarker}
          onDragEnd={onMarkerDragEnd}
        />
        <Circle
          center={center}
          radius={radiusMeters}
          options={{
            fillColor: '#1270AF',
            fillOpacity: 0.1,
            strokeColor: '#1270AF',
            strokeOpacity: 0.4,
            strokeWeight: 2,
          }}
        />
      </GoogleMap>
      {caption != null && (
        <div className="border-t border-border bg-background-subtle px-3 py-2">{caption}</div>
      )}
    </div>
  );
}
