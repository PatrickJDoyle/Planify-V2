'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { GoogleMapsOverlay } from '@deck.gl/google-maps';
import { Autocomplete, GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { Layers, Loader2, LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useHeatmapApplications, useHeatmapCommencements, useHeatmapSales } from '@/lib/queries/heatmap';
import type { HeatmapBounds, HeatmapLayerType } from '@/lib/types/phase5';

const IRELAND_CENTER = { lat: 53.349805, lng: -6.26031 };
const MAP_LIBRARIES: ('places')[] = ['places'];

export default function HeatmapPage() {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [bounds, setBounds] = useState<HeatmapBounds | undefined>(undefined);
  const [months, setMonths] = useState(12);
  const [activeLayers, setActiveLayers] = useState<Set<HeatmapLayerType>>(
    new Set<HeatmapLayerType>(['applications']),
  );
  const [selectedAddress, setSelectedAddress] = useState('');

  const overlayRef = useRef<GoogleMapsOverlay | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'heatmap-google-loader',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: MAP_LIBRARIES,
  });

  const applicationsQuery = useHeatmapApplications(months, bounds);
  const commencementsQuery = useHeatmapCommencements(months, bounds);
  const salesQuery = useHeatmapSales(months, bounds);

  const loading = applicationsQuery.isFetching || commencementsQuery.isFetching || salesQuery.isFetching;

  const applicationsData = useMemo(() => applicationsQuery.data ?? [], [applicationsQuery.data]);
  const commencementsData = useMemo(() => commencementsQuery.data ?? [], [commencementsQuery.data]);
  const salesData = useMemo(() => salesQuery.data ?? [], [salesQuery.data]);

  const totalVisiblePoints = useMemo(() => {
    let total = 0;
    if (activeLayers.has('applications')) total += applicationsData.length;
    if (activeLayers.has('commencements')) total += commencementsData.length;
    if (activeLayers.has('sales')) total += salesData.length;
    return total;
  }, [activeLayers, applicationsData.length, commencementsData.length, salesData.length]);

  useEffect(() => {
    if (!map || !isLoaded) return;

    const layers = [];

    if (activeLayers.has('applications') && applicationsData.length > 0) {
      layers.push(
        new HeatmapLayer({
          id: 'apps-layer',
          data: applicationsData,
          getPosition: (d: { coordinates: [number, number] }) => d.coordinates,
          getWeight: (d: { weight: number }) => d.weight,
          radiusPixels: 70,
          intensity: 1.8,
          threshold: 0.01,
          colorRange: [
            [215, 235, 250, 120],
            [135, 193, 228, 160],
            [74, 144, 192, 200],
            [18, 112, 175, 230],
            [13, 95, 149, 255],
            [10, 76, 119, 255],
          ],
        }),
      );
    }

    if (activeLayers.has('commencements') && commencementsData.length > 0) {
      layers.push(
        new HeatmapLayer({
          id: 'commencements-layer',
          data: commencementsData,
          getPosition: (d: { coordinates: [number, number] }) => d.coordinates,
          getWeight: (d: { weight: number }) => d.weight,
          radiusPixels: 70,
          intensity: 1.8,
          threshold: 0.01,
          colorRange: [
            [220, 245, 225, 120],
            [169, 227, 179, 160],
            [116, 207, 136, 200],
            [52, 168, 83, 230],
            [27, 125, 54, 255],
            [15, 90, 38, 255],
          ],
        }),
      );
    }

    if (activeLayers.has('sales') && salesData.length > 0) {
      layers.push(
        new HeatmapLayer({
          id: 'sales-layer',
          data: salesData,
          getPosition: (d: { coordinates: [number, number] }) => d.coordinates,
          getWeight: (d: { weight: number }) => d.weight,
          radiusPixels: 70,
          intensity: 1.8,
          threshold: 0.01,
          colorRange: [
            [238, 226, 255, 120],
            [214, 189, 255, 160],
            [186, 149, 255, 200],
            [157, 109, 255, 230],
            [124, 77, 255, 255],
            [94, 53, 177, 255],
          ],
        }),
      );
    }

    if (!overlayRef.current) {
      overlayRef.current = new GoogleMapsOverlay({ layers });
      overlayRef.current.setMap(map);
      return;
    }

    overlayRef.current.setProps({ layers });
  }, [activeLayers, applicationsData, commencementsData, isLoaded, map, salesData]);

  useEffect(() => {
    return () => {
      if (overlayRef.current) {
        overlayRef.current.finalize();
        overlayRef.current = null;
      }
    };
  }, []);

  const handleIdle = useCallback(() => {
    if (!map) return;
    const currentBounds = map.getBounds();
    if (!currentBounds) return;
    const ne = currentBounds.getNorthEast();
    const sw = currentBounds.getSouthWest();
    setBounds({
      north: ne.lat(),
      south: sw.lat(),
      east: ne.lng(),
      west: sw.lng(),
    });
  }, [map]);

  const toggleLayer = (layer: HeatmapLayerType) => {
    setActiveLayers((previous) => {
      const next = new Set(previous);
      if (next.has(layer)) {
        next.delete(layer);
      } else {
        next.add(layer);
      }
      return next;
    });
  };

  const onAutocompleteLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
    autocomplete.setComponentRestrictions({ country: 'ie' });
  };

  const onPlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    const location = place?.geometry?.location;
    if (!location || !map) return;
    setSelectedAddress(place.formatted_address || place.name || '');
    map.panTo(location);
    map.setZoom(12);
  };

  if (!isLoaded) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-foreground-muted" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col">
      <div className="border-b border-border bg-background px-6 py-4">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3">
          <div className="min-w-[300px] flex-1">
            <Autocomplete onLoad={onAutocompleteLoad} onPlaceChanged={onPlaceChanged}>
              <Input
                value={selectedAddress}
                onChange={(e) => setSelectedAddress(e.target.value)}
                placeholder="Search location in Ireland..."
              />
            </Autocomplete>
          </div>

          <select
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm"
          >
            <option value={1}>Last 1 month</option>
            <option value={3}>Last 3 months</option>
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
            <option value={18}>Last 18 months</option>
            <option value={36}>Last 36 months</option>
          </select>

          <Button
            variant={activeLayers.has('applications') ? 'default' : 'outline'}
            onClick={() => toggleLayer('applications')}
          >
            <Layers className="mr-2 h-4 w-4" />
            Applications ({applicationsData.length})
          </Button>
          <Button
            variant={activeLayers.has('commencements') ? 'secondary' : 'outline'}
            onClick={() => toggleLayer('commencements')}
          >
            Commencements ({commencementsData.length})
          </Button>
          <Button
            variant={activeLayers.has('sales') ? 'secondary' : 'outline'}
            onClick={() => toggleLayer('sales')}
          >
            Sales ({salesData.length})
          </Button>
        </div>
      </div>

      <div className="relative flex-1">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={IRELAND_CENTER}
          zoom={7}
          onLoad={setMap}
          onUnmount={() => setMap(null)}
          onIdle={handleIdle}
          options={{
            streetViewControl: false,
            fullscreenControl: true,
            minZoom: 6,
            maxZoom: 18,
          }}
        />

        <Card className="absolute right-4 top-4 z-20 max-w-xs p-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <div>
              <p className="font-medium">Heatmap Summary</p>
              <p className="text-xs text-foreground-muted">{totalVisiblePoints} visible points</p>
            </div>
            {loading ? <Loader2 className="h-4 w-4 animate-spin text-foreground-muted" /> : <LocateFixed className="h-4 w-4 text-foreground-muted" />}
          </div>
        </Card>
      </div>
    </div>
  );
}
