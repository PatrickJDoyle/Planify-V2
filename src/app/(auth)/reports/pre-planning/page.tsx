'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { FileText, Loader2, MapPin, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { GOOGLE_MAPS_LIBRARIES, GOOGLE_MAPS_LOADER_ID } from '@/lib/maps/google-loader';
import {
  useComputePrePlanningStats,
  useGeneratePrePlanningReport,
  useNearbyApplications,
  useOptimalRadius,
} from '@/lib/queries/reports';

export default function PrePlanningReportsPage() {
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(1000);
  const [reportText, setReportText] = useState('');
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: GOOGLE_MAPS_LOADER_ID,
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const nearbyQuery = useNearbyApplications(coords?.lat ?? null, coords?.lng ?? null, radius);
  const optimalQuery = useOptimalRadius(coords?.lat ?? null, coords?.lng ?? null);
  const statsMutation = useComputePrePlanningStats();
  const generateMutation = useGeneratePrePlanningReport();

  const nearbyCount = Array.isArray(nearbyQuery.data) ? nearbyQuery.data.length : 0;
  const optimalCount = optimalQuery.data?.initialCount ?? null;
  const effectiveRadius = optimalQuery.data?.adjustedRadius ?? radius;

  const payload = useMemo(() => {
    const applications =
      optimalQuery.data?.applications && optimalQuery.data.applications.length > 0
        ? optimalQuery.data.applications
        : nearbyQuery.data ?? [];

    return {
      applications,
      initialRadius: radius,
      adjustedRadius: effectiveRadius,
      initialApplicationCount: optimalCount ?? nearbyCount,
      address: address || undefined,
    };
  }, [address, effectiveRadius, nearbyCount, nearbyQuery.data, optimalCount, optimalQuery.data, radius]);

  const onAutocompleteLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
    autocomplete.setComponentRestrictions({ country: 'ie' });
  };

  const onPlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    const location = place?.geometry?.location;
    if (!location) return;

    setCoords({ lat: location.lat(), lng: location.lng() });
    setAddress(place.formatted_address || place.name || '');
    setReportText('');
  };

  const handleComputeStats = async () => {
    const response = await statsMutation.mutateAsync(payload);
    const appSummary = response.applications
      ? JSON.stringify(response.applications, null, 2)
      : 'No application summary returned.';
    setReportText(`Pre-Planning Stats\n\n${appSummary}`);
  };

  const handleGenerateReport = async () => {
    const response = await generateMutation.mutateAsync(payload);
    setReportText(response.content || 'Report generated, but no content returned.');
  };

  return (
    <div className="mx-auto w-full max-w-7xl p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-foreground">Pre-Planning Reports</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Select a location, set a radius, and generate analysis-ready pre-planning outputs.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Report Scope</CardTitle>
            <CardDescription>Address + radius controls for report generation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground-muted">Address (Ireland)</label>
              {isLoaded ? (
                <Autocomplete onLoad={onAutocompleteLoad} onPlaceChanged={onPlaceChanged}>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Search address..."
                  />
                </Autocomplete>
              ) : (
                <Input disabled placeholder="Loading Google Places..." />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground-muted">Radius</label>
                <span className="text-xs font-semibold text-foreground">{radius}m</span>
              </div>
              <Slider
                value={[radius]}
                onValueChange={(values) => setRadius(values[0] ?? 1000)}
                min={100}
                max={5000}
                step={100}
              />
            </div>

            <div className="rounded-md border border-border bg-background-subtle p-3 text-xs text-foreground-muted">
              {coords ? (
                <div className="space-y-1">
                  <p className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Selected point</p>
                  <p>{coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}</p>
                </div>
              ) : (
                <p>Select an address to begin.</p>
              )}
            </div>

            <div className="grid gap-2">
              <Button onClick={() => nearbyQuery.refetch()} disabled={!coords || nearbyQuery.isFetching}>
                {nearbyQuery.isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Find Nearby Applications
              </Button>
              <Button
                variant="outline"
                onClick={() => optimalQuery.refetch()}
                disabled={!coords || optimalQuery.isFetching}
              >
                {optimalQuery.isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Get Optimal Radius
              </Button>
              <Button
                variant="secondary"
                onClick={handleComputeStats}
                disabled={payload.applications.length === 0 || statsMutation.isPending}
              >
                {statsMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Compute Stats
              </Button>
              <Button
                onClick={handleGenerateReport}
                disabled={payload.applications.length === 0 || generateMutation.isPending}
              >
                {generateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Output</CardTitle>
            <CardDescription>
              Nearby: {nearbyCount} apps • Optimal radius count: {optimalCount ?? '—'} • Effective radius: {effectiveRadius}m
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="min-h-[520px] rounded-md border border-border bg-background-subtle p-4">
              {reportText ? (
                <pre className="whitespace-pre-wrap text-sm text-foreground">{reportText}</pre>
              ) : (
                <p className="text-sm text-foreground-muted">
                  No report generated yet. Run a nearby search, then compute stats or generate a report.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
