'use client';

import React from 'react';
import { GoogleMap, Polygon, useJsApiLoader } from '@react-google-maps/api';
import { ExternalLink, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Map3DPreview } from '@/components/map3d';
import { GOOGLE_MAPS_LIBRARIES, GOOGLE_MAPS_LOADER_ID } from '@/lib/maps/google-loader';
import type { Application } from '@/lib/types/application';
import type { ZoningData } from '@/lib/api/zoning';

interface MapSectionProps {
  application: Application;
  zoning?: ZoningData | null;
  nearbyZones?: ZoningData[];
}

function normalizePaths(geometry: unknown): google.maps.LatLngLiteral[] {
  const g = geometry as {
    type?: string;
    coordinates?: number[][][] | number[][][][];
  };
  if (!g?.type || !g.coordinates) return [];

  if (g.type === 'Polygon') {
    const ring = (g.coordinates as number[][][])[0] ?? [];
    return ring.map(([lng, lat]) => ({ lat, lng }));
  }

  if (g.type === 'MultiPolygon') {
    const firstPoly = (g.coordinates as number[][][][])[0]?.[0] ?? [];
    return firstPoly.map(([lng, lat]) => ({ lat, lng }));
  }

  return [];
}

function zoneColor(code?: string) {
  const prefix = code?.charAt(0).toUpperCase() ?? '';
  const colors: Record<string, string> = {
    R: '#22c55e',
    C: '#ef4444',
    M: '#f59e0b',
    I: '#a855f7',
    O: '#06b6d4',
    Z: '#f97316',
  };
  return colors[prefix] ?? '#1270AF';
}

export function MapSection({ application: app, zoning, nearbyZones = [] }: MapSectionProps) {
  const [showZones, setShowZones] = React.useState(true);
  const [mapMode, setMapMode] = React.useState<'google' | 'mapbox'>('google');
  const { isLoaded } = useJsApiLoader({
    id: GOOGLE_MAPS_LOADER_ID,
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const hasCoords = app.latitude && app.longitude;
  if (!hasCoords) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-sm text-foreground-muted">
            No coordinates available for this application
          </p>
        </CardContent>
      </Card>
    );
  }

  const center = { lat: app.latitude, lng: app.longitude };
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${app.latitude},${app.longitude}`;
  const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${app.latitude},${app.longitude}`;
  const mainZonePath = zoning?.geometry ? normalizePaths(zoning.geometry) : [];
  const nearbyZonePaths = nearbyZones
    .filter((zone) => zone.geometry && zone.id !== zoning?.id)
    .map((zone) => ({
      id: zone.id,
      color: zoneColor(zone.zoneGzt),
      path: normalizePaths(zone.geometry),
    }))
    .filter((zone) => zone.path.length > 2);

  return (
    <div className="space-y-4">
      {zoning && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Zoning Information</h3>
              <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-primary dark:bg-brand-900">
                {zoning.zoneGzt}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Location Map</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-foreground-muted">Zoning overlay</span>
                <Switch checked={showZones} onCheckedChange={setShowZones} />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => window.open(googleMapsUrl, '_blank')}
                >
                  <MapPin className="h-3 w-3" />
                  Google Maps
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => window.open(streetViewUrl, '_blank')}
                >
                  <ExternalLink className="h-3 w-3" />
                  Street View
                </Button>
              </div>
            </div>
          </div>

          <Tabs value={mapMode} onValueChange={(value) => setMapMode(value as 'google' | 'mapbox')}>
            <TabsList className="mb-3">
              <TabsTrigger value="google">Google</TabsTrigger>
              <TabsTrigger value="mapbox">Mapbox 3D</TabsTrigger>
            </TabsList>

            <TabsContent value="google" className="mt-0">
              <div className="overflow-hidden rounded-md border border-border">
                {isLoaded ? (
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '450px' }}
                    center={center}
                    zoom={15}
                    options={{
                      mapTypeControl: true,
                      streetViewControl: false,
                      fullscreenControl: false,
                    }}
                  >
                    {showZones && mainZonePath.length > 2 && (
                      <Polygon
                        paths={mainZonePath}
                        options={{
                          fillColor: '#1270AF',
                          fillOpacity: 0.22,
                          strokeColor: '#1270AF',
                          strokeOpacity: 0.85,
                          strokeWeight: 2,
                        }}
                      />
                    )}
                    {showZones &&
                      nearbyZonePaths.map((zone) => (
                        <Polygon
                          key={zone.id}
                          paths={zone.path}
                          options={{
                            fillColor: zone.color,
                            fillOpacity: 0.1,
                            strokeColor: zone.color,
                            strokeOpacity: 0.4,
                            strokeWeight: 1,
                          }}
                        />
                      ))}
                  </GoogleMap>
                ) : (
                  <div className="flex h-[450px] items-center justify-center bg-background-subtle text-sm text-foreground-muted">
                    Loading map...
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="mapbox" className="mt-0">
              <div className="overflow-hidden rounded-md border border-border">
                <Map3DPreview
                  latitude={app.latitude}
                  longitude={app.longitude}
                  showZones={showZones}
                  zoning={zoning ?? null}
                  nearbyZones={nearbyZones}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-2 flex items-center gap-2 text-xs text-foreground-muted">
            <MapPin className="h-3 w-3" />
            <span>
              {app.latitude.toFixed(6)}, {app.longitude.toFixed(6)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function MapSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="mt-3 h-[450px] w-full rounded-md" />
      </CardContent>
    </Card>
  );
}
