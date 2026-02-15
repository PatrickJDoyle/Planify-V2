'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { AlertTriangle, FileText, Loader2, MapPin, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GOOGLE_MAPS_LIBRARIES, GOOGLE_MAPS_LOADER_ID } from '@/lib/maps/google-loader';
import { reportsApi } from '@/lib/api/reports';
import { getAllPlanningCategories, getPlanningSubCategories } from '@/lib/constants/planning-intentions';
import type { PrePlanningStatsResponse } from '@/lib/types/phase5';

export default function PrePlanningReportsPage() {
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(1000);
  const [reportHtml, setReportHtml] = useState('');
  const [errorText, setErrorText] = useState('');
  const [statusText, setStatusText] = useState('Select a location to begin.');
  const [intentionCategory, setIntentionCategory] = useState('');
  const [intentionSubCategory, setIntentionSubCategory] = useState('');
  const [nearbyApplications, setNearbyApplications] = useState<unknown[]>([]);
  const [effectiveApplications, setEffectiveApplications] = useState<unknown[]>([]);
  const [initialCount, setInitialCount] = useState<number>(0);
  const [effectiveRadius, setEffectiveRadius] = useState<number>(500);
  const [statsData, setStatsData] = useState<PrePlanningStatsResponse | null>(null);
  const [isRunningReport, setIsRunningReport] = useState(false);
  const [isFetchingNearby, setIsFetchingNearby] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const categories = useMemo(() => getAllPlanningCategories(), []);
  const subCategories = useMemo(
    () => getPlanningSubCategories(intentionCategory),
    [intentionCategory],
  );

  const { isLoaded } = useJsApiLoader({
    id: GOOGLE_MAPS_LOADER_ID,
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

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
    setReportHtml('');
    setErrorText('');
    setStatusText('Location selected. Fetch nearby applications or optimal radius.');
  };

  const handleFetchNearby = async () => {
    if (!coords) return;
    try {
      setIsFetchingNearby(true);
      setErrorText('');
      setStatusText('Fetching nearby applications...');
      const nearby = await reportsApi.getNearbyApplications({
        latitude: coords.lat,
        longitude: coords.lng,
        radius,
      });
      setNearbyApplications(nearby);
      setStatusText(`Loaded ${nearby.length} nearby applications within ${radius}m.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch nearby applications.';
      setErrorText(message);
      setStatusText('Nearby applications fetch failed.');
    } finally {
      setIsFetchingNearby(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!coords) {
      setErrorText('Select an address before generating a report.');
      return;
    }
    if (!intentionCategory || !intentionSubCategory) {
      setErrorText('Select both development category and specific development type.');
      return;
    }

    try {
      setIsRunningReport(true);
      setErrorText('');
      setReportHtml('');
      setStatsData(null);

      setStatusText('Determining optimal radius for report quality...');
      const optimal = await reportsApi.getOptimalRadius({
        latitude: coords.lat,
        longitude: coords.lng,
      });

      const selectedApps =
        optimal.applications.length > 0
          ? optimal.applications
          : await reportsApi.getNearbyApplications({
              latitude: coords.lat,
              longitude: coords.lng,
              radius,
            });

      if (selectedApps.length === 0) {
        setStatusText('No applications found for this location. Try another address.');
        return;
      }

      setInitialCount(optimal.initialCount ?? selectedApps.length);
      setEffectiveRadius(optimal.adjustedRadius ?? radius);
      setEffectiveApplications(selectedApps);

      const payload = {
        applications: selectedApps,
        initialRadius: 500, // Backend optimal logic starts at 500m in V1/V2 backend.
        adjustedRadius: optimal.adjustedRadius ?? radius,
        initialApplicationCount: optimal.initialCount ?? selectedApps.length,
        address: address || undefined,
        centreLat: coords.lat,
        centreLon: coords.lng,
        intentionCategory,
        intentionSubCategory,
      };

      setStatusText('Computing statistics and market context...');
      const stats = await reportsApi.computeStats(payload);
      setStatsData(stats);

      setStatusText('Generating AI pre-planning report...');
      const report = await reportsApi.generate(payload);
      setReportHtml(report.content || '<p>Report generated, but no content returned.</p>');
      setStatusText('Report generated successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate report.';
      setErrorText(message);
      setStatusText('Report generation failed.');
    } finally {
      setIsRunningReport(false);
    }
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

            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground-muted">Development category *</label>
              <Select
                value={intentionCategory}
                onValueChange={(value) => {
                  setIntentionCategory(value);
                  setIntentionSubCategory('');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select development category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground-muted">Specific development type *</label>
              <Select
                value={intentionSubCategory}
                onValueChange={setIntentionSubCategory}
                disabled={!intentionCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder={intentionCategory ? 'Select specific type' : 'Select category first'} />
                </SelectTrigger>
                <SelectContent>
                  {subCategories.map((subCategory) => (
                    <SelectItem key={subCategory} value={subCategory}>
                      {subCategory}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground-muted">Override category (optional)</label>
                <Input
                  value={intentionCategory}
                  onChange={(e) => setIntentionCategory(e.target.value)}
                  placeholder="Type custom category"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground-muted">Override type (optional)</label>
                <Input
                  value={intentionSubCategory}
                  onChange={(e) => setIntentionSubCategory(e.target.value)}
                  placeholder="Type custom development type"
                />
              </div>
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
              <Button onClick={handleFetchNearby} disabled={!coords || isFetchingNearby}>
                {isFetchingNearby ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Find Nearby Applications
              </Button>
              <Button variant="secondary"
                onClick={handleGenerateReport}
                disabled={!coords || isRunningReport}
              >
                {isRunningReport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate Professional Report
              </Button>
            </div>
            {errorText && (
              <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                <p className="flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {errorText}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Output</CardTitle>
            <CardDescription>
              Nearby preview: {nearbyApplications.length} apps • Report set: {effectiveApplications.length} apps • Initial count: {initialCount || '—'} • Effective radius: {effectiveRadius}m
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-3 rounded-md border border-border bg-background-subtle p-2 text-xs text-foreground-muted">
              {statusText}
            </div>
            <Tabs defaultValue="report">
              <TabsList className="mb-3">
                <TabsTrigger value="report">AI Report</TabsTrigger>
                <TabsTrigger value="stats">Stats</TabsTrigger>
                <TabsTrigger value="applications">Applications</TabsTrigger>
              </TabsList>

              <TabsContent value="report" className="mt-0">
                <div className="min-h-[520px] rounded-md border border-border bg-background-subtle p-4">
                  {reportHtml ? (
                    <div
                      className="prose prose-sm max-w-none text-foreground dark:prose-invert"
                      // Backend already returns generated HTML report.
                      dangerouslySetInnerHTML={{ __html: reportHtml }}
                    />
                  ) : (
                    <p className="text-sm text-foreground-muted">
                      No report generated yet. Select location and intention, then run Generate Professional Report.
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="stats" className="mt-0">
                <div className="min-h-[520px] rounded-md border border-border bg-background-subtle p-4">
                  {statsData ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="rounded-md border border-border bg-surface p-3">
                        <p className="text-xs text-foreground-muted">Applications (all)</p>
                        <p className="mt-1 text-lg font-semibold">
                          {(statsData as any)?.applications?.counts?.unique ?? '—'}
                        </p>
                      </div>
                      <div className="rounded-md border border-border bg-surface p-3">
                        <p className="text-xs text-foreground-muted">Approval Rate</p>
                        <p className="mt-1 text-lg font-semibold">
                          {(statsData as any)?.applications?.decisions?.approvalRate ?? '—'}%
                        </p>
                      </div>
                      <div className="rounded-md border border-border bg-surface p-3">
                        <p className="text-xs text-foreground-muted">Median Decision Days</p>
                        <p className="mt-1 text-lg font-semibold">
                          {(statsData as any)?.applications?.timelines?.medianDecisionDays ?? '—'}
                        </p>
                      </div>
                      <div className="rounded-md border border-border bg-surface p-3">
                        <p className="text-xs text-foreground-muted">BCMS Records</p>
                        <p className="mt-1 text-lg font-semibold">
                          {Array.isArray((statsData as any)?.bcmsRecords)
                            ? (statsData as any).bcmsRecords.length
                            : '—'}
                        </p>
                      </div>
                      <div className="rounded-md border border-border bg-surface p-3">
                        <p className="text-xs text-foreground-muted">Property Sales</p>
                        <p className="mt-1 text-lg font-semibold">
                          {Array.isArray((statsData as any)?.propertySalesRecords)
                            ? (statsData as any).propertySalesRecords.length
                            : '—'}
                        </p>
                      </div>
                      <div className="rounded-md border border-border bg-surface p-3">
                        <p className="text-xs text-foreground-muted">Primary Zone</p>
                        <p className="mt-1 text-lg font-semibold">
                          {(statsData as any)?.zoning?.primaryZone?.zoneGzt ?? '—'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-foreground-muted">No stats available yet.</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="applications" className="mt-0">
                <div className="min-h-[520px] rounded-md border border-border bg-background-subtle p-4">
                  {effectiveApplications.length > 0 ? (
                    <div className="overflow-x-auto rounded-md border border-border bg-surface">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-border bg-background-subtle">
                          <tr>
                            <th className="px-3 py-2 font-semibold">Application</th>
                            <th className="px-3 py-2 font-semibold">Authority</th>
                            <th className="px-3 py-2 font-semibold">Decision</th>
                            <th className="px-3 py-2 font-semibold">Received</th>
                          </tr>
                        </thead>
                        <tbody>
                          {effectiveApplications.slice(0, 75).map((raw, idx) => {
                            const app = raw as Record<string, unknown>;
                            return (
                              <tr key={`${String(app.ApplicationNumber ?? app.applicationNumber ?? idx)}-${idx}`} className="border-b border-border/70">
                                <td className="px-3 py-2">{String(app.ApplicationNumber ?? app.applicationNumber ?? 'N/A')}</td>
                                <td className="px-3 py-2">{String(app.PlanningAuthority ?? app.planningAuthority ?? 'N/A')}</td>
                                <td className="px-3 py-2">{String(app.Decision ?? app.decision ?? 'Pending')}</td>
                                <td className="px-3 py-2">{String(app.ReceivedDate ?? app.receivedDate ?? 'N/A')}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-foreground-muted">No applications loaded yet.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
