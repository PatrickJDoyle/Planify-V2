'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, Hash, MapPin, Navigation } from 'lucide-react';
import { Autocomplete, GoogleMap, Circle, Marker, useJsApiLoader } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useDashboardStore } from '@/lib/stores/dashboard-store';
import { GOOGLE_MAPS_LIBRARIES, GOOGLE_MAPS_LOADER_ID } from '@/lib/maps/google-loader';

type SearchMode = 'address' | 'reference';

const RADIUS_MIN = 100;
const RADIUS_MAX = 5000;
const RADIUS_STEP = 100;
const DEFAULT_RADIUS = 1000;

// Ireland center for initial map
const IRELAND_CENTER = { lat: 53.4, lng: -7.9 };

function formatRadius(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(meters % 1000 === 0 ? 0 : 1)}km`;
  }
  return `${meters}m`;
}

export function SearchBar() {
  const { setFilters, resetFilters, setSearchMode: setStoreSearchMode, filters } = useDashboardStore();
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('address');
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [selectedPlace, setSelectedPlace] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  const [showMap, setShowMap] = useState(false);

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: GOOGLE_MAPS_LOADER_ID,
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  // Handle place selection from autocomplete
  const handlePlaceChanged = useCallback(() => {
    const autocomplete = autocompleteRef.current;
    if (!autocomplete) return;

    const place = autocomplete.getPlace();
    if (!place.geometry?.location) return;

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const address = place.formatted_address ?? place.name ?? '';

    setSelectedPlace({ lat, lng, address });
    setQuery(address);
    setShowMap(true);
  }, []);

  // Trigger search with current address + radius
  const handleAddressSearch = useCallback(() => {
    if (!selectedPlace) return;

    setFilters({
      latitude: String(selectedPlace.lat),
      longitude: String(selectedPlace.lng),
      radius,
      // Clear authority-based filters
      planningAuthority: undefined,
      applicationNumber: undefined,
      descriptionSearch: undefined,
    });
    setStoreSearchMode('address');
  }, [selectedPlace, radius, setFilters, setStoreSearchMode]);

  // Search when radius changes (if place is selected)
  useEffect(() => {
    if (selectedPlace) {
      handleAddressSearch();
    }
  }, [radius]); // eslint-disable-line react-hooks/exhaustive-deps

  // Search when place is selected
  useEffect(() => {
    if (selectedPlace) {
      handleAddressSearch();
    }
  }, [selectedPlace]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle reference search
  const handleReferenceSearch = useCallback(() => {
    if (!query.trim()) return;
    setFilters({
      applicationNumber: query.trim(),
      latitude: undefined,
      longitude: undefined,
      radius: undefined,
    });
    setStoreSearchMode('authority');
  }, [query, setFilters, setStoreSearchMode]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && mode === 'reference') {
      handleReferenceSearch();
    }
  };

  const handleClear = () => {
    setQuery('');
    setSelectedPlace(null);
    setShowMap(false);
    resetFilters();
  };

  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    // Reverse geocode to get address
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      const address =
        status === 'OK' && results?.[0]
          ? results[0].formatted_address
          : `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

      setSelectedPlace({ lat, lng, address });
      setQuery(address);
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {/* Mode toggles */}
        <div className="flex shrink-0 rounded-md border border-border bg-background p-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => { setMode('address'); handleClear(); }}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded transition-colors',
                  mode === 'address'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground-muted hover:text-foreground',
                )}
              >
                <MapPin className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Search by address</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => { setMode('reference'); handleClear(); }}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded transition-colors',
                  mode === 'reference'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground-muted hover:text-foreground',
                )}
              >
                <Hash className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Search by reference number</TooltipContent>
          </Tooltip>
        </div>

        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />

          {mode === 'address' && isLoaded ? (
            <Autocomplete
              onLoad={(autocomplete) => { autocompleteRef.current = autocomplete; }}
              onPlaceChanged={handlePlaceChanged}
              options={{
                componentRestrictions: { country: 'ie' },
                types: ['geocode', 'establishment'],
              }}
            >
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search an address in Ireland..."
                className={cn(
                  'flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 pl-10 pr-10 text-sm text-foreground ring-offset-background',
                  'file:border-0 file:bg-transparent file:text-sm file:font-medium',
                  'placeholder:text-foreground-subtle',
                  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                )}
              />
            </Autocomplete>
          ) : (
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === 'reference'
                  ? 'Search by application reference (e.g. SD22A/0344)'
                  : 'Search an address in Ireland...'
              }
              className="h-10 pl-10 pr-10"
            />
          )}

          {query && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleClear}
              className="absolute right-1 top-1/2 -translate-y-1/2 text-foreground-subtle"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Reference search button */}
        {mode === 'reference' && (
          <Button
            size="sm"
            onClick={handleReferenceSearch}
            disabled={!query.trim()}
            className="shrink-0 gap-1.5"
          >
            <Search className="h-3.5 w-3.5" />
            Search
          </Button>
        )}
      </div>

      {/* Radius slider — shown when address mode with a selected place */}
      {mode === 'address' && selectedPlace && (
        <div className="flex items-center gap-4 rounded-lg border border-border bg-background-subtle px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-foreground-muted">
            <Navigation className="h-3.5 w-3.5" />
            <span className="font-medium">Radius</span>
          </div>
          <Slider
            value={[radius]}
            onValueChange={([val]) => setRadius(val)}
            min={RADIUS_MIN}
            max={RADIUS_MAX}
            step={RADIUS_STEP}
            className="flex-1"
          />
          <span className="min-w-[48px] text-right text-sm font-semibold text-foreground">
            {formatRadius(radius)}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5 text-xs"
            onClick={() => setShowMap(!showMap)}
          >
            <MapPin className="h-3 w-3" />
            {showMap ? 'Hide Map' : 'Show Map'}
          </Button>
        </div>
      )}

      {/* Map preview */}
      {mode === 'address' && selectedPlace && showMap && isLoaded && (
        <div className="overflow-hidden rounded-lg border border-border">
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '280px' }}
            center={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
            zoom={getZoomForRadius(radius)}
            options={{
              disableDefaultUI: true,
              zoomControl: true,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
              styles: mapStyles,
            }}
          >
            <Marker
              position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
              draggable
              onDragEnd={handleMarkerDragEnd}
            />
            <Circle
              center={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
              radius={radius}
              options={{
                fillColor: '#1270AF',
                fillOpacity: 0.1,
                strokeColor: '#1270AF',
                strokeOpacity: 0.4,
                strokeWeight: 2,
              }}
            />
          </GoogleMap>
          <div className="border-t border-border bg-background-subtle px-3 py-2">
            <p className="text-xs text-foreground-muted">
              Drag the marker to adjust location. Showing results within {formatRadius(radius)} of{' '}
              <span className="font-medium text-foreground">{selectedPlace.address}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function getZoomForRadius(radius: number): number {
  if (radius <= 200) return 16;
  if (radius <= 500) return 15;
  if (radius <= 1000) return 14;
  if (radius <= 2000) return 13;
  if (radius <= 3000) return 12;
  return 11;
}

// Subtle enterprise map style
const mapStyles: google.maps.MapTypeStyle[] = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
];
