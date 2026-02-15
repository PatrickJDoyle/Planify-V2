'use client';

import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import { FileText, Loader2, MapPin } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { prePlanningApi } from '@/lib/api/pre-planning';

export default function PrePlanningReportPage() {
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [applications, setApplications] = useState<unknown[]>([]);
  const [totalApps, setTotalApps] = useState<number | null>(null);
  const [optimalRadius, setOptimalRadius] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
    libraries: ['places'],
  });

  const onAutocompleteLoad = useCallback((autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
    autocomplete.setComponentRestrictions({ country: 'ie' });
  }, []);

  const onPlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (place?.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setLocation({ lat, lng });
      setAddress(place.formatted_address ?? place.name ?? '');
    }
  }, []);

  const handleAnalyse = async () => {
    if (!location) return;
    setLoading(true);
    setReportContent(null);
    try {
      const [optimal, nearby] = await Promise.all([
        prePlanningApi.getOptimalRadius({
          latitude: location.lat,
          longitude: location.lng,
        }),
        prePlanningApi.getNearbyApplications({
          latitude: location.lat,
          longitude: location.lng,
          radius: 500,
          pageSize: 50,
        }),
      ]);
      setOptimalRadius(optimal.optimalRadius);
      setApplications(nearby.data ?? []);
      setTotalApps(nearby.total ?? 0);
    } catch {
      setApplications([]);
      setTotalApps(0);
      setOptimalRadius(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = () => {
    if (!location || applications.length === 0) return;
    setReportContent(
      `Pre-planning analysis for ${address}\n\n` +
        `${totalApps ?? 0} planning applications found within ${optimalRadius ?? 500}m.\n\n` +
        'Full AI-powered report generation is available in the full version. ' +
        'This preview shows the data scope for your selected location.',
    );
  };

  if (!isLoaded) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-6 text-xl font-semibold text-foreground">
        Pre-Planning Report
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5" />
            Select Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Autocomplete onLoad={onAutocompleteLoad} onPlaceChanged={onPlaceChanged}>
              <Input
                placeholder="Search address in Ireland..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="flex-1"
              />
            </Autocomplete>
            <Button onClick={handleAnalyse} disabled={!location || loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
              {loading ? 'Analysing...' : 'Analyse'}
            </Button>
          </div>

          {optimalRadius != null && totalApps != null && (
            <p className="mt-4 text-sm text-foreground-muted">
              Optimal radius: {optimalRadius}m · {totalApps} applications found
            </p>
          )}
        </CardContent>
      </Card>

      {applications.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGenerateReport} className="mb-4">
              Generate Report
            </Button>
            {reportContent && (
              <div className="prose prose-sm max-w-none rounded-md border border-border bg-background-subtle p-4">
                <pre className="whitespace-pre-wrap text-sm text-foreground">
                  {reportContent}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
