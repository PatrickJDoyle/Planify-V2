'use client';

import 'mapbox-gl/dist/mapbox-gl.css';

import { Loader2, Map as MapIcon, Satellite } from 'lucide-react';
import type { Map } from 'mapbox-gl';
import mapboxgl from 'mapbox-gl';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

import {
  ANIMATION_DURATIONS,
  CAMERA_PRESETS,
  DEFAULT_PRESET,
  getMap3DConfig,
} from './config';
import type { CameraPreset, Map3DPreviewProps } from './types';

export function Map3DPreview({
  latitude,
  longitude,
  showZones = false,
  zoning = null,
  nearbyZones = [],
  compact = false,
}: Map3DPreviewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const hasLoadedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [is3DMode, setIs3DMode] = useState(true);
  const [activePreset, setActivePreset] = useState<CameraPreset>(DEFAULT_PRESET);
  const [mapStyle, setMapStyle] = useState<'satellite' | 'light'>('light');
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mq.matches);
      const h = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mq.addEventListener('change', h);
      return () => mq.removeEventListener('change', h);
    }
    return () => undefined;
  }, []);

  const clearZoneLayers = useCallback((map: Map) => {
    ['zones-fill', 'zones-outline', 'application-zone-fill', 'application-zone-outline'].forEach((id) => {
      if (map.getLayer(id)) {
        map.removeLayer(id);
      }
    });
    ['zones', 'application-zone'].forEach((id) => {
      if (map.getSource(id)) {
        map.removeSource(id);
      }
    });
  }, []);

  const addZoneLayers = useCallback(
    (map: Map) => {
      const getZoneColor = (code: string) => {
        const c: Record<string, string> = {
          R: '#22c55e',
          C: '#ef4444',
          M: '#f59e0b',
          I: '#a855f7',
          O: '#06b6d4',
          Z: '#f97316',
        };
        return c[code.charAt(0).toUpperCase()] ?? '#6b7280';
      };

      clearZoneLayers(map);

      if (showZones && nearbyZones.length > 0) {
        try {
          const features = nearbyZones
            .filter((z) => z.geometry)
            .map((zone) => ({
              type: 'Feature' as const,
              properties: { color: getZoneColor(zone.zoneGzt) },
              geometry: zone.geometry as GeoJSON.Geometry,
            }));
          map.addSource('zones', {
            type: 'geojson',
            data: { type: 'FeatureCollection' as const, features } as GeoJSON.FeatureCollection,
          });
          map.addLayer({
            id: 'zones-fill',
            type: 'fill',
            source: 'zones',
            paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.15 },
          });
          map.addLayer({
            id: 'zones-outline',
            type: 'line',
            source: 'zones',
            paint: {
              'line-color': ['get', 'color'],
              'line-width': 1.5,
              'line-opacity': 0.5,
            },
          });
        } catch {
          /* ignore */
        }
      }

      if (zoning?.geometry) {
        try {
          map.addSource('application-zone', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: zoning.geometry as GeoJSON.Geometry,
            },
          });
          map.addLayer({
            id: 'application-zone-fill',
            type: 'fill',
            source: 'application-zone',
            paint: { 'fill-color': '#1270AF', 'fill-opacity': 0.25 },
          });
          map.addLayer({
            id: 'application-zone-outline',
            type: 'line',
            source: 'application-zone',
            paint: {
              'line-color': '#1270AF',
              'line-width': 2,
              'line-opacity': 0.8,
            },
          });
        } catch {
          /* ignore */
        }
      }
    },
    [clearZoneLayers, showZones, zoning, nearbyZones],
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return () => undefined;
    const config = getMap3DConfig();
    if (!config.accessToken) {
      setError('Mapbox token not configured.');
      setIsLoading(false);
      return () => undefined;
    }

    mapboxgl.accessToken = config.accessToken;
    const styleUrl =
      mapStyle === 'satellite'
        ? 'mapbox://styles/mapbox/satellite-streets-v12'
        : 'mapbox://styles/mapbox/light-v11';

    try {
      hasLoadedRef.current = false;
      setIsLoading(true);
      setError(null);

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: styleUrl,
        center: [longitude, latitude],
        zoom: CAMERA_PRESETS[activePreset].zoom,
        pitch: CAMERA_PRESETS[activePreset].pitch,
        bearing: CAMERA_PRESETS[activePreset].bearing,
        maxZoom: config.maxZoom,
        attributionControl: true,
      });

      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.addControl(new mapboxgl.ScaleControl({ unit: 'metric' }), 'bottom-left');

      map.on('load', () => {
        hasLoadedRef.current = true;
        if (config.enableTerrain) {
          map.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 14,
          });
          map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
        }
        if (config.enableSky) {
          map.addLayer({
            id: 'sky',
            type: 'sky',
            paint: {
              'sky-type': 'atmosphere',
              'sky-atmosphere-sun': [0.0, 90.0],
              'sky-atmosphere-sun-intensity': 15,
            },
          });
        }
        const { layers } = map.getStyle();
        const labelLayerId = layers?.find(
          (l) => l.type === 'symbol' && (l.layout as Record<string, unknown>)?.['text-field'],
        )?.id;
        if (labelLayerId) {
          map.addLayer(
            {
              id: config.buildingsLayerId,
              source: 'composite',
              'source-layer': 'building',
              filter: ['==', 'extrude', 'true'],
              type: 'fill-extrusion',
              minzoom: 14,
              paint: {
                'fill-extrusion-color': [
                  'interpolate',
                  ['linear'],
                  ['get', 'height'],
                  0,
                  'hsl(200, 60%, 85%)',
                  20,
                  'hsl(200, 70%, 70%)',
                  40,
                  'hsl(210, 75%, 60%)',
                  60,
                  'hsl(220, 80%, 50%)',
                  100,
                  'hsl(230, 85%, 40%)',
                ],
                'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14, 0, 14.5, ['get', 'height']],
                'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 14, 0, 14.5, ['get', 'min_height']],
                'fill-extrusion-opacity': 0.85,
              },
            },
            labelLayerId,
          );
        }
        addZoneLayers(map);
        map.resize();
        setIsLoading(false);
      });

      map.on('error', (event) => {
        // Surface map/style/token errors instead of endless spinner
        if (!hasLoadedRef.current) {
          const message =
            (event?.error as Error | undefined)?.message ??
            'Mapbox failed to load. Check token/domain restrictions.';
          setError(message);
          setIsLoading(false);
        }
      });

      const timeout = window.setTimeout(() => {
        if (!hasLoadedRef.current) {
          setError('Mapbox load timed out. Check token and allowed domain settings.');
          setIsLoading(false);
        }
      }, 12000);

      mapRef.current = map;
      return () => {
        window.clearTimeout(timeout);
        map.remove();
        mapRef.current = null;
        hasLoadedRef.current = false;
      };
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load map');
      setIsLoading(false);
      return () => undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, addZoneLayers]);

  useEffect(() => {
    const map = mapRef.current;
    const container = mapContainerRef.current;
    if (!map || !container) return;

    const resizeMap = () => {
      try {
        map.resize();
      } catch {
        // no-op
      }
    };

    const observer = new ResizeObserver(() => resizeMap());
    observer.observe(container);
    const timer = window.setTimeout(resizeMap, 120);

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [compact]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const styleUrl =
      mapStyle === 'satellite'
        ? 'mapbox://styles/mapbox/satellite-streets-v12'
        : 'mapbox://styles/mapbox/light-v11';
    map.setStyle(styleUrl);

    const onStyleLoad = () => {
      const config = getMap3DConfig();
      try {
        if (config.enableTerrain && !map.getSource('mapbox-dem')) {
          map.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 14,
          });
          map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
        }
        if (config.enableSky && !map.getLayer('sky')) {
          map.addLayer({
            id: 'sky',
            type: 'sky',
            paint: {
              'sky-type': 'atmosphere',
              'sky-atmosphere-sun': [0.0, 90.0],
              'sky-atmosphere-sun-intensity': 15,
            },
          });
        }
        const { layers } = map.getStyle();
        const labelLayerId = layers?.find(
          (l) => l.type === 'symbol' && (l.layout as Record<string, unknown>)?.['text-field'],
        )?.id;
        if (labelLayerId && !map.getLayer(config.buildingsLayerId)) {
          map.addLayer(
            {
              id: config.buildingsLayerId,
              source: 'composite',
              'source-layer': 'building',
              filter: ['==', 'extrude', 'true'],
              type: 'fill-extrusion',
              minzoom: 14,
              paint: {
                'fill-extrusion-color': [
                  'interpolate',
                  ['linear'],
                  ['get', 'height'],
                  0,
                  'hsl(200, 60%, 85%)',
                  20,
                  'hsl(200, 70%, 70%)',
                  40,
                  'hsl(210, 75%, 60%)',
                  60,
                  'hsl(220, 80%, 50%)',
                  100,
                  'hsl(230, 85%, 40%)',
                ],
                'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14, 0, 14.5, ['get', 'height']],
                'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 14, 0, 14.5, ['get', 'min_height']],
                'fill-extrusion-opacity': 0.85,
              },
            },
            labelLayerId,
          );
        }
      } catch {
        // ignore and let map continue
      }
      addZoneLayers(map);
    };

    map.once('style.load', onStyleLoad);
  }, [mapStyle, addZoneLayers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    addZoneLayers(map);
  }, [showZones, zoning, nearbyZones, addZoneLayers]);


  const toggleMapStyle = useCallback(() => {
    setMapStyle((s) => (s === 'satellite' ? 'light' : 'satellite'));
  }, []);

  const toggle3D = useCallback(() => {
    if (!mapRef.current) return;
    const newMode = !is3DMode;
    const pitch = newMode ? CAMERA_PRESETS[activePreset].pitch : 0;
    mapRef.current.easeTo({
      pitch,
      duration: reducedMotion ? 0 : ANIMATION_DURATIONS.toggle3D,
    });
    setIs3DMode(newMode);
  }, [is3DMode, activePreset, reducedMotion]);

  const handlePreset = useCallback(
    (preset: CameraPreset) => {
      if (!mapRef.current) return;
      const c = CAMERA_PRESETS[preset];
      mapRef.current.easeTo({
        zoom: c.zoom,
        pitch: is3DMode ? c.pitch : 0,
        bearing: c.bearing,
        duration: reducedMotion ? 0 : 600,
      });
      setActivePreset(preset);
    },
    [is3DMode, reducedMotion],
  );

  if (error) {
    return (
      <div className="flex h-full min-h-[300px] items-center justify-center rounded-lg border border-border bg-background-subtle">
        <p className="text-sm text-foreground-muted">{error}</p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col overflow-hidden', compact && 'rounded-lg border border-border')}>
      <div
        className={cn(
          'flex items-center justify-between border-b border-border bg-background-subtle px-3 py-2',
          !compact && 'rounded-t-lg',
        )}
      >
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggleMapStyle} className="h-7 w-7 p-0">
            {mapStyle === 'satellite' ? <MapIcon className="h-3.5 w-3.5" /> : <Satellite className="h-3.5 w-3.5" />}
          </Button>
          <span className="text-xs text-foreground-muted">{mapStyle === 'satellite' ? 'Satellite' : 'Light'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-foreground-muted">3D</span>
          <Switch checked={is3DMode} onCheckedChange={toggle3D} />
        </div>
      </div>

      <div className="relative flex-1" style={{ minHeight: '350px' }}>
        <div ref={mapContainerRef} className="absolute inset-0" />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background-subtle/80">
            <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          </div>
        )}
      </div>

      <div className="flex gap-1 border-t border-border bg-background-subtle p-2">
        {(['overhead', 'street-side', 'oblique'] as CameraPreset[]).map((preset) => (
          <Button
            key={preset}
            variant={activePreset === preset ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePreset(preset)}
            className="text-xs"
          >
            {preset === 'overhead' ? 'Overhead' : preset === 'street-side' ? 'Street' : 'Oblique'}
          </Button>
        ))}
      </div>
    </div>
  );
}
