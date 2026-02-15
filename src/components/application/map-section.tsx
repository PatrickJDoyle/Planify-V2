'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { GoogleMap, Marker, Polygon, useJsApiLoader } from '@react-google-maps/api';
import dynamic from 'next/dynamic';
import { MapPin, Layers, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Application } from '@/lib/types/application';
import type { ZoningData } from '@/lib/api/zoning';
import { zoningApi } from '@/lib/api/zoning';
import { isMap3DEnabled } from '@/components/map3d';

const Map3DPreview = dynamic(
  () => import('@/components/map3d').then((m) => ({ default: m.Map3DPreview })),
  { ssr: false, loading: () => <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-500" /></div> },
);

interface MapSectionProps {
  application: Application;
  zoning?: ZoningData | null;
}

const mapContainerStyle = { width: '100%', height: '450px' };
const center = (lat: number, lng: number) => ({ lat, lng });

function getPolygonPaths(geometry: unknown): { lat: number; lng: number }[] {
  const g = geometry as { type?: string; coordinates?: number[][][] } | null;
  if (!g || g.type !== 'Polygon' || !g.coordinates?.[0]) return [];
  return g.coordinates[0].map(([lng, lat]: number[]) => ({ lat, lng }));
}

function getZoneColor(zoneCode: string): string {
  const colors: Record<string, string> = {
    R: '#22c55e',
    C: '#ef4444',
    M: '#f59e0b',
    I: '#a855f7',
    O: '#06b6d4',
    Z: '#f97316',
  };
  return colors[zoneCode.charAt(0).toUpperCase()] ?? '#6b7280';
}

export function MapSection({ application: app, zoning }: MapSectionProps) {
  const hasCoords = app.latitude && app.longitude;

  const [showZones, setShowZones] = useState(false);
  const [nearbyZones, setNearbyZones] = useState<ZoningData[]>([]);
  const [zonesLoading, setZonesLoading] = useState(false);
  const [mapView, setMapView] = useState<'map' | 'streetview'>('map');

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  });

  // Fetch nearby zones when Show Zones is toggled
  useEffect(() => {
    if (!showZones || !hasCoords) {
      setNearbyZones([]);
      return;
    }
    setZonesLoading(true);
    const radius = 0.045;
    const bounds = {
      north: app.latitude! + radius,
      south: app.latitude! - radius,
      east: app.longitude! + radius,
      west: app.longitude! - radius,
    };
    zoningApi
      .getBounds(bounds)
      .then(setNearbyZones)
      .catch(() => setNearbyZones([]))
      .finally(() => setZonesLoading(false));
  }, [showZones, hasCoords, app.latitude, app.longitude]);

  const onLoad = useCallback(() => {}, []);

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

  if (loadError || !isLoaded) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          {!isLoaded ? (
            <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          ) : (
            <p className="text-sm text-foreground-muted">
              Failed to load map. Please try again.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  const appCenter = center(app.latitude!, app.longitude!);

  return (
    <div className="space-y-4">
      {/* Zoning Info */}
      {zoning && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Zoning Information</h3>
              <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-primary dark:bg-brand-900">
                {zoning.zoneGzt}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {zoning.zoneOrig && (
                <div>
                  <span className="text-xs text-foreground-subtle">Zone Type</span>
                  <p className="text-sm text-foreground">{zoning.zoneOrig}</p>
                </div>
              )}
              {zoning.zoneDesc && (
                <div>
                  <span className="text-xs text-foreground-subtle">Description</span>
                  <p className="text-sm text-foreground">{zoning.zoneDesc}</p>
                </div>
              )}
              {zoning.laName && (
                <div>
                  <span className="text-xs text-foreground-subtle">Local Authority</span>
                  <p className="text-sm text-foreground">{zoning.laName}</p>
                </div>
              )}
              {zoning.planName && (
                <div>
                  <span className="text-xs text-foreground-subtle">Plan</span>
                  <p className="text-sm text-foreground">{zoning.planName}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map controls: Map / Street View toggle + Show Zones */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant={mapView === 'map' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMapView('map')}
              >
                <MapPin className="mr-1.5 h-3.5 w-3.5" />
                Map
              </Button>
              <Button
                variant={mapView === 'streetview' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMapView('streetview')}
              >
                Street View
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showZones ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowZones(!showZones)}
                disabled={zonesLoading}
                className={mapView === 'streetview' ? 'opacity-60' : ''}
              >
                {zonesLoading ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Layers className="mr-1.5 h-3.5 w-3.5" />
                )}
                {showZones ? 'Hide Zones' : 'Show Zones'}
              </Button>
            </div>
          </div>

          {/* Map container - both views embedded in-app */}
          <div className="relative mt-3 overflow-hidden rounded-md border border-border">
            {mapView === 'map' ? (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={appCenter}
                zoom={15}
                onLoad={onLoad}
                options={{
                  mapTypeControl: true,
                  streetViewControl: true,
                  fullscreenControl: true,
                  zoomControl: true,
                }}
              >
                {/* Nearby zones */}
                {showZones
                  ? nearbyZones.map((zone) => {
                      if (!zone.geometry) return null;
                      const paths = getPolygonPaths(zone.geometry);
                      const color = getZoneColor(zone.zoneGzt);
                      return (
                        <Polygon
                          key={zone.id}
                          paths={paths}
                          options={{
                            fillColor: color,
                            fillOpacity: 0.15,
                            strokeColor: color,
                            strokeOpacity: 0.5,
                            strokeWeight: 1.5,
                            clickable: false,
                            zIndex: 0,
                          }}
                        />
                      );
                    })
                  : null}

                {/* Application zone (highlighted) */}
                {zoning?.geometry ? (
                  <Polygon
                    paths={getPolygonPaths(zoning.geometry)}
                    options={{
                      fillColor: '#1270AF',
                      fillOpacity: 0.25,
                      strokeColor: '#1270AF',
                      strokeOpacity: 0.8,
                      strokeWeight: 2,
                      clickable: false,
                      zIndex: 1,
                    }}
                  />
                ) : null}

                {/* Application marker */}
                <Marker
                  position={appCenter}
                  animation={google.maps.Animation.BOUNCE}
                  zIndex={2}
                />
              </GoogleMap>
            ) : (
              <iframe
                title="Street View"
                width="100%"
                height="450"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed/v1/streetview?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''}&location=${app.latitude},${app.longitude}`}
              />
            )}
          </div>

          <div className="mt-2 flex items-center gap-2 text-xs text-foreground-muted">
            <MapPin className="h-3 w-3" />
            <span>
              {app.latitude!.toFixed(6)}, {app.longitude!.toFixed(6)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Mapbox 3D Surroundings — when enabled */}
      {isMap3DEnabled() && (
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              3D Surroundings
            </h3>
            <div style={{ minHeight: '400px' }}>
              <Map3DPreview
                latitude={app.latitude!}
                longitude={app.longitude!}
                applicationNumber={app.applicationNumber}
                authority={app.planningAuthority}
                address={app.formattedAddress ?? app.developmentAddress}
                showZones={showZones}
                zoning={zoning ?? undefined}
                nearbyZones={nearbyZones}
                compact
              />
            </div>
          </CardContent>
        </Card>
      )}
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
