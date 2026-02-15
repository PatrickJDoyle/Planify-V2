'use client';

import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { GoogleMapsOverlay } from '@deck.gl/google-maps';
import {
  Autocomplete,
  GoogleMap,
  Polygon,
  useJsApiLoader,
} from '@react-google-maps/api';
import { Layers, Loader2, MapPin } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { heatmapApi, type HeatmapDataPoint } from '@/lib/api/heatmap';
import { zoningApi, type ZoningData } from '@/lib/api/zoning';

const containerStyle = { width: '100%', height: 'calc(100vh - 200px)' };
const center = { lat: 53.349805, lng: -6.26031 };
const IRELAND_BOUNDS = { north: 55.43, south: 51.39, east: -5.34, west: -10.7 };

const TIME_PERIODS = [
  { value: '1', label: '1 Month' },
  { value: '3', label: '3 Months' },
  { value: '6', label: '6 Months' },
  { value: '12', label: '12 Months' },
  { value: '18', label: '18 Months' },
  { value: '36', label: '36 Months (3 Years)' },
];

type LayerType = 'applications' | 'commencements' | 'sales';

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

export default function HeatmapPage() {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [timePeriod, setTimePeriod] = useState('12');
  const [applicationsData, setApplicationsData] = useState<HeatmapDataPoint[]>([]);
  const [commencementsData, setCommencementsData] = useState<HeatmapDataPoint[]>([]);
  const [salesData, setSalesData] = useState<HeatmapDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [showZones, setShowZones] = useState(false);
  const [zones, setZones] = useState<ZoningData[]>([]);
  const [zoom, setZoom] = useState(7);
  const [activeLayers, setActiveLayers] = useState<Set<LayerType>>(new Set<LayerType>(['applications']));
  const overlayRef = useRef<GoogleMapsOverlay | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
    libraries: ['places'],
  });

  const fetchHeatmapData = useCallback(
    async (bounds?: google.maps.LatLngBounds) => {
      setLoading(true);
      try {
        const params: { months: string; north?: number; south?: number; east?: number; west?: number } = {
          months: timePeriod,
        };
        if (bounds) {
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          params.north = ne.lat();
          params.south = sw.lat();
          params.east = ne.lng();
          params.west = sw.lng();
        }

        const promises: Promise<void>[] = [];
        if (activeLayers.has('applications')) {
          promises.push(heatmapApi.getApplications(params).then(setApplicationsData));
        }
        if (activeLayers.has('commencements')) {
          promises.push(heatmapApi.getCommencements(params).then(setCommencementsData));
        }
        if (activeLayers.has('sales')) {
          promises.push(heatmapApi.getSales(params).then(setSalesData));
        }
        await Promise.all(promises);
      } catch {
        // Silently handle error
      } finally {
        setLoading(false);
      }
    },
    [timePeriod, activeLayers],
  );

  const fetchZoningData = useCallback(async (bounds: google.maps.LatLngBounds) => {
    try {
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const data = await zoningApi.getBounds({
        north: ne.lat(),
        south: sw.lat(),
        east: ne.lng(),
        west: sw.lng(),
      });
      setZones(data ?? []);
    } catch {
      setZones([]);
    }
  }, []);

  useEffect(() => {
    if (!map || !isLoaded) return;

    const layers = [];

    if (activeLayers.has('applications') && applicationsData.length > 0) {
      layers.push(
        new HeatmapLayer({
          id: 'heatmap-applications',
          data: applicationsData,
          getPosition: (d: HeatmapDataPoint) => d.coordinates,
          getWeight: (d: HeatmapDataPoint) => d.weight,
          radiusPixels: 80,
          intensity: 2,
          threshold: 0.01,
          colorRange: [
            [255, 200, 100, 100],
            [255, 150, 50, 140],
            [255, 100, 0, 180],
            [255, 50, 0, 220],
            [255, 0, 0, 255],
            [200, 0, 0, 255],
          ],
        }),
      );
    }

    if (activeLayers.has('commencements') && commencementsData.length > 0) {
      layers.push(
        new HeatmapLayer({
          id: 'heatmap-commencements',
          data: commencementsData,
          getPosition: (d: HeatmapDataPoint) => d.coordinates,
          getWeight: (d: HeatmapDataPoint) => d.weight,
          radiusPixels: 80,
          intensity: 2,
          threshold: 0.01,
          colorRange: [
            [150, 255, 150, 100],
            [100, 255, 100, 140],
            [50, 200, 50, 180],
            [0, 180, 0, 220],
            [0, 150, 0, 255],
            [0, 100, 0, 255],
          ],
        }),
      );
    }

    if (activeLayers.has('sales') && salesData.length > 0) {
      layers.push(
        new HeatmapLayer({
          id: 'heatmap-sales',
          data: salesData,
          getPosition: (d: HeatmapDataPoint) => d.coordinates,
          getWeight: (d: HeatmapDataPoint) => d.weight,
          radiusPixels: 80,
          intensity: 2,
          threshold: 0.01,
          colorRange: [
            [200, 150, 255, 100],
            [180, 100, 255, 140],
            [150, 50, 255, 180],
            [120, 0, 255, 220],
            [100, 0, 200, 255],
            [80, 0, 150, 255],
          ],
        }),
      );
    }

    if (layers.length > 0) {
      if (!overlayRef.current) {
        overlayRef.current = new GoogleMapsOverlay({ layers });
        overlayRef.current.setMap(map);
      } else {
        overlayRef.current.setProps({ layers });
      }
    } else if (overlayRef.current) {
      overlayRef.current.setProps({ layers: [] });
    }
  }, [map, applicationsData, commencementsData, salesData, activeLayers, isLoaded]);

  const onLoad = useCallback((googleMap: google.maps.Map) => setMap(googleMap), []);
  const onUnmount = useCallback(() => {
    setMap(null);
    if (overlayRef.current) {
      overlayRef.current.finalize();
      overlayRef.current = null;
    }
  }, []);

  const onZoomChanged = useCallback(() => {
    if (map) {
      const currentZoom = map.getZoom() ?? 7;
      setZoom(currentZoom);
      if (currentZoom >= 12 && showZones) {
        const bounds = map.getBounds();
        if (bounds) fetchZoningData(bounds);
      }
    }
  }, [map, showZones, fetchZoningData]);

  const onIdle = useCallback(() => {
    if (map) {
      const bounds = map.getBounds();
      if (bounds) fetchHeatmapData(bounds);
    }
  }, [map, fetchHeatmapData]);

  useEffect(() => {
    if (map) {
      const bounds = map.getBounds();
      if (bounds) fetchHeatmapData(bounds);
    }
  }, [map, timePeriod, fetchHeatmapData]);

  const onPlaceChanged = () => {
    if (autocompleteRef.current && map) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry?.location) {
        map.panTo(place.geometry.location);
        map.setZoom(14);
      }
    }
  };

  const onAutocompleteLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
    autocomplete.setComponentRestrictions({ country: 'ie' });
  };

  const toggleLayer = (layer: LayerType) => {
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });
  };

  const totalPoints =
    (activeLayers.has('applications') ? applicationsData.length : 0) +
    (activeLayers.has('commencements') ? commencementsData.length : 0) +
    (activeLayers.has('sales') ? salesData.length : 0);

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="border-b border-border bg-background px-6 py-5">
        <div className="mx-auto max-w-7xl space-y-4">
          <h1 className="text-xl font-semibold text-foreground">
            Planning Application Heat Map
          </h1>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-1 gap-2 min-w-[200px]">
              <Autocomplete onLoad={onAutocompleteLoad} onPlaceChanged={onPlaceChanged} className="flex-1">
                <Input placeholder="Search address in Ireland..." className="min-w-[200px]" />
              </Autocomplete>
              <Button
                size="sm"
                onClick={() => {
                  if (autocompleteRef.current) {
                    const place = autocompleteRef.current.getPlace();
                    if (place.geometry?.location && map) {
                      map.panTo(place.geometry.location);
                      map.setZoom(14);
                    }
                  }
                }}
              >
                <MapPin className="mr-2 h-4 w-4" />
                Go
              </Button>
            </div>

            <Select value={timePeriod} onValueChange={setTimePeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                {TIME_PERIODS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={showZones ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowZones(!showZones)}
              disabled={zoom < 12}
            >
              <Layers className="mr-2 h-4 w-4" />
              {showZones ? 'Hide' : 'Show'} Zones
              {zoom < 12 && ' (Zoom In)'}
            </Button>

            {loading && <Loader2 className="h-5 w-5 animate-spin text-brand-500" />}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-foreground-muted">Data Layers:</span>
            <Button
              variant={activeLayers.has('applications') ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleLayer('applications')}
              className={activeLayers.has('applications') ? 'bg-orange-600 hover:bg-orange-700' : ''}
            >
              Applications ({applicationsData.length})
            </Button>
            <Button
              variant={activeLayers.has('commencements') ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleLayer('commencements')}
              className={activeLayers.has('commencements') ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              Commencements ({commencementsData.length})
            </Button>
            <Button
              variant={activeLayers.has('sales') ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleLayer('sales')}
              className={activeLayers.has('sales') ? 'bg-violet-600 hover:bg-violet-700' : ''}
            >
              Property Sales ({salesData.length})
            </Button>
          </div>

          <Card className="bg-background-subtle p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground">
                <strong>{totalPoints}</strong> total data points in last{' '}
                {TIME_PERIODS.find((p) => p.value === timePeriod)?.label}
              </span>
              <span className="text-xs text-foreground-muted">
                {zoom >= 12 ? 'Zoning data available' : 'Zoom in to view zones'}
              </span>
            </div>
          </Card>
        </div>
      </div>

      <div className="relative flex-1">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={7}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onZoomChanged={onZoomChanged}
          onIdle={onIdle}
          options={{
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
            restriction: { latLngBounds: IRELAND_BOUNDS, strictBounds: false },
            minZoom: 6,
            maxZoom: 20,
          }}
        >
          {showZones &&
            zoom >= 12 &&
            zones.map((zone) => {
              if (!zone.geometry) return null;
              const paths = getPolygonPaths(zone.geometry);
              const color = getZoneColor(zone.zoneGzt);
              return (
                <Polygon
                  key={zone.id}
                  paths={paths}
                  options={{
                    fillColor: color,
                    fillOpacity: 0.2,
                    strokeColor: color,
                    strokeOpacity: 0.6,
                    strokeWeight: 1.5,
                    clickable: false,
                  }}
                />
              );
            })}
        </GoogleMap>

        <div className="absolute bottom-4 right-4 max-w-xs rounded-lg border border-border bg-surface p-4 shadow-lg">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Active Data Layers</h3>
          {activeLayers.has('applications') && (
            <div className="mb-2">
              <div className="mb-1 text-xs font-medium text-orange-600">Applications</div>
              <div className="h-3 rounded bg-gradient-to-r from-orange-200 via-orange-400 to-red-600" />
            </div>
          )}
          {activeLayers.has('commencements') && (
            <div className="mb-2">
              <div className="mb-1 text-xs font-medium text-emerald-600">Commencements</div>
              <div className="h-3 rounded bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-700" />
            </div>
          )}
          {activeLayers.has('sales') && (
            <div className="mb-2">
              <div className="mb-1 text-xs font-medium text-violet-600">Property Sales</div>
              <div className="h-3 rounded bg-gradient-to-r from-violet-200 via-violet-400 to-violet-700" />
            </div>
          )}
          {activeLayers.size === 0 && (
            <p className="text-xs text-foreground-muted">No layers active</p>
          )}
          {showZones && zoom >= 12 && (
            <div className="mt-4 space-y-1 border-t border-border pt-3">
              <h4 className="mb-2 text-xs font-semibold text-foreground">Zoning Types</h4>
              {[
                { code: 'R', label: 'Residential', color: '#22c55e' },
                { code: 'C', label: 'Commercial', color: '#ef4444' },
                { code: 'M', label: 'Mixed Use', color: '#f59e0b' },
                { code: 'I', label: 'Industrial', color: '#a855f7' },
                { code: 'O', label: 'Open Space', color: '#06b6d4' },
                { code: 'Z', label: 'Conservation', color: '#f97316' },
              ].map((z) => (
                <div key={z.code} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded" style={{ backgroundColor: z.color }} />
                  <span className="text-xs text-foreground">{z.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
