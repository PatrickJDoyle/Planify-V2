'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { AlertTriangle, FileText, Loader2, MapPin, Sparkles } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
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

type NormalizedApp = {
  applicationNumber: string;
  planningAuthority: string;
  decision: string;
  receivedDate: string;
  applicationType: string;
  address: string;
};

type ChartDatum = {
  name: string;
  value: number;
};

const STATUS_COLORS = ['#1270AF', '#16a34a', '#dc2626', '#f59e0b', '#64748b', '#7c3aed'];

function normalizeApp(raw: unknown): NormalizedApp {
  const app = raw as Record<string, unknown>;
  return {
    applicationNumber: String(app.ApplicationNumber ?? app.applicationNumber ?? 'N/A'),
    planningAuthority: String(app.PlanningAuthority ?? app.planningAuthority ?? 'Unknown'),
    decision: String(app.Decision ?? app.decision ?? 'Pending'),
    receivedDate: String(app.ReceivedDate ?? app.receivedDate ?? ''),
    applicationType: String(app.ApplicationType ?? app.applicationType ?? 'Other'),
    address: String(app.DevelopmentAddress ?? app.developmentAddress ?? 'Unknown address'),
  };
}

function extractSectionedHtml(content: string): string {
  if (!content) return '';
  if (/<h[1-6][\s>]/i.test(content)) return content;
  const titles = [
    'Executive Summary',
    'Planning Activity Analysis',
    'Decision Analysis',
    'Development Trends',
    'Key Metrics Summary',
    'Recommendations',
    'Assumptions & Limitations',
  ];
  let formatted = content;
  titles.forEach((title) => {
    const reg = new RegExp(`(^|\\n)${title}(\\n|:)`, 'gi');
    formatted = formatted.replace(reg, `\n<h2>${title}</h2>\n`);
  });
  const paragraphs = formatted
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      if (p.startsWith('<h2>') || p.startsWith('<h3>') || p.startsWith('<table') || p.startsWith('<ul')) {
        return p;
      }
      return `<p>${p.replace(/\n/g, '<br/>')}</p>`;
    });
  return paragraphs.join('\n');
}

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
  const [applicationPage, setApplicationPage] = useState(1);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const categories = useMemo(() => getAllPlanningCategories(), []);
  const subCategories = useMemo(
    () => getPlanningSubCategories(intentionCategory),
    [intentionCategory],
  );
  const normalizedApplications = useMemo(
    () => effectiveApplications.map((app) => normalizeApp(app)),
    [effectiveApplications],
  );

  const kpis = useMemo(() => {
    const total = normalizedApplications.length;
    const granted = normalizedApplications.filter((a) =>
      a.decision.toUpperCase().includes('GRANT') ||
      a.decision.toUpperCase().includes('APPROVAL'),
    ).length;
    const refused = normalizedApplications.filter((a) =>
      a.decision.toUpperCase().includes('REFUSE'),
    ).length;
    const pending = normalizedApplications.filter((a) =>
      !a.decision || a.decision.toUpperCase().includes('PENDING'),
    ).length;
    const approvalRate = granted + refused > 0 ? Math.round((granted / (granted + refused)) * 1000) / 10 : 0;
    return { total, granted, refused, pending, approvalRate };
  }, [normalizedApplications]);

  const decisionsData = useMemo<ChartDatum[]>(() => {
    const grouped = new Map<string, number>();
    normalizedApplications.forEach((app) => {
      const decision = app.decision || 'Pending';
      grouped.set(decision, (grouped.get(decision) ?? 0) + 1);
    });
    return Array.from(grouped.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [normalizedApplications]);

  const authorityData = useMemo<ChartDatum[]>(() => {
    const grouped = new Map<string, number>();
    normalizedApplications.forEach((app) => {
      grouped.set(app.planningAuthority, (grouped.get(app.planningAuthority) ?? 0) + 1);
    });
    return Array.from(grouped.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  }, [normalizedApplications]);

  const typeData = useMemo<ChartDatum[]>(() => {
    const grouped = new Map<string, number>();
    normalizedApplications.forEach((app) => {
      grouped.set(app.applicationType, (grouped.get(app.applicationType) ?? 0) + 1);
    });
    return Array.from(grouped.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  }, [normalizedApplications]);

  const monthlyData = useMemo<ChartDatum[]>(() => {
    const grouped = new Map<string, number>();
    normalizedApplications.forEach((app) => {
      const dt = new Date(app.receivedDate);
      if (Number.isNaN(dt.getTime())) return;
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      grouped.set(key, (grouped.get(key) ?? 0) + 1);
    });
    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-24)
      .map(([name, value]) => ({ name, value }));
  }, [normalizedApplications]);

  const applicationPageSize = 20;
  const pagedApplications = useMemo(() => {
    const start = (applicationPage - 1) * applicationPageSize;
    return normalizedApplications.slice(start, start + applicationPageSize);
  }, [applicationPage, normalizedApplications]);
  const totalAppPages = Math.max(1, Math.ceil(normalizedApplications.length / applicationPageSize));

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
      setApplicationPage(1);

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
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="charts">Charts</TabsTrigger>
                <TabsTrigger value="report">AI Report</TabsTrigger>
                <TabsTrigger value="stats">Stats</TabsTrigger>
                <TabsTrigger value="applications">Applications</TabsTrigger>
                <TabsTrigger value="bcms">BCMS</TabsTrigger>
                <TabsTrigger value="sales">Sales</TabsTrigger>
                <TabsTrigger value="zoning">Zoning</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-0">
                <div className="min-h-[520px] space-y-4 rounded-md border border-border bg-background-subtle p-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <Card><CardContent className="p-4"><p className="text-xs text-foreground-muted">Applications</p><p className="text-xl font-semibold">{kpis.total}</p></CardContent></Card>
                    <Card><CardContent className="p-4"><p className="text-xs text-foreground-muted">Granted</p><p className="text-xl font-semibold text-green-600">{kpis.granted}</p></CardContent></Card>
                    <Card><CardContent className="p-4"><p className="text-xs text-foreground-muted">Refused</p><p className="text-xl font-semibold text-red-600">{kpis.refused}</p></CardContent></Card>
                    <Card><CardContent className="p-4"><p className="text-xs text-foreground-muted">Pending</p><p className="text-xl font-semibold text-amber-600">{kpis.pending}</p></CardContent></Card>
                    <Card><CardContent className="p-4"><p className="text-xs text-foreground-muted">Approval Rate</p><p className="text-xl font-semibold">{kpis.approvalRate}%</p></CardContent></Card>
                  </div>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Professional Scope Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-foreground-muted">
                      <p>
                        Address: <span className="font-medium text-foreground">{address || 'Not selected'}</span>
                      </p>
                      <p>
                        Development intent: <span className="font-medium text-foreground">{intentionCategory || 'N/A'}{intentionSubCategory ? ` -> ${intentionSubCategory}` : ''}</span>
                      </p>
                      <p>
                        Radius strategy:{' '}
                        <span className="font-medium text-foreground">
                          {'500m seed -> '}
                          {effectiveRadius}
                          m effective
                        </span>
                      </p>
                      <p>
                        Initial count: <span className="font-medium text-foreground">{initialCount || '—'}</span>
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="charts" className="mt-0">
                <div className="min-h-[520px] space-y-4 rounded-md border border-border bg-background-subtle p-4">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Decision Mix</CardTitle></CardHeader>
                      <CardContent className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={decisionsData} dataKey="value" nameKey="name" outerRadius={95} label>
                              {decisionsData.map((entry, index) => (
                                <Cell key={`${entry.name}-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Applications Over Time</CardTitle></CardHeader>
                      <CardContent className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Line type="monotone" dataKey="value" stroke="#1270AF" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Top Planning Authorities</CardTitle></CardHeader>
                      <CardContent className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={authorityData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" hide />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#1270AF" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Application Type Mix</CardTitle></CardHeader>
                      <CardContent className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={typeData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" hide />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#0ea5e9" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="report" className="mt-0">
                <div className="min-h-[520px] rounded-md border border-border bg-background-subtle p-4">
                  {reportHtml ? (
                    <div
                      className="prose prose-sm max-w-none text-foreground dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: extractSectionedHtml(reportHtml) }}
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
                  {normalizedApplications.length > 0 ? (
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
                          {pagedApplications.map((app, idx) => (
                            <tr key={`${app.applicationNumber}-${idx}`} className="border-b border-border/70">
                              <td className="px-3 py-2">{app.applicationNumber}</td>
                              <td className="px-3 py-2">{app.planningAuthority}</td>
                              <td className="px-3 py-2">{app.decision}</td>
                              <td className="px-3 py-2">{app.receivedDate || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="flex items-center justify-between border-t border-border px-3 py-2 text-xs">
                        <span>Page {applicationPage} of {totalAppPages}</span>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={applicationPage <= 1}
                            onClick={() => setApplicationPage((p) => Math.max(1, p - 1))}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={applicationPage >= totalAppPages}
                            onClick={() => setApplicationPage((p) => Math.min(totalAppPages, p + 1))}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-foreground-muted">No applications loaded yet.</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="bcms" className="mt-0">
                <div className="min-h-[520px] rounded-md border border-border bg-background-subtle p-4">
                  {Array.isArray((statsData as any)?.bcmsRecords) && (statsData as any).bcmsRecords.length > 0 ? (
                    <div className="overflow-x-auto rounded-md border border-border bg-surface">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-border bg-background-subtle">
                          <tr>
                            <th className="px-3 py-2 font-semibold">Notice</th>
                            <th className="px-3 py-2 font-semibold">Authority</th>
                            <th className="px-3 py-2 font-semibold">Status</th>
                            <th className="px-3 py-2 font-semibold">Commencement</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(statsData as any).bcmsRecords.slice(0, 100).map((row: Record<string, unknown>, idx: number) => (
                            <tr key={`${String(row.id ?? idx)}-${idx}`} className="border-b border-border/70">
                              <td className="px-3 py-2">{String(row.noticeExternalId ?? 'N/A')}</td>
                              <td className="px-3 py-2">{String(row.localAuthority ?? 'N/A')}</td>
                              <td className="px-3 py-2">{String(row.status ?? 'N/A')}</td>
                              <td className="px-3 py-2">{String(row.commencementDate ?? 'N/A')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-foreground-muted">No BCMS evidence returned for this scope.</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="sales" className="mt-0">
                <div className="min-h-[520px] space-y-4 rounded-md border border-border bg-background-subtle p-4">
                  {Array.isArray((statsData as any)?.propertySalesRecords) &&
                  (statsData as any).propertySalesRecords.length > 0 ? (
                    <>
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">Property Sales Values</CardTitle></CardHeader>
                        <CardContent className="h-[260px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={(statsData as any).propertySalesRecords
                                .slice(0, 60)
                                .map((s: Record<string, unknown>) => ({
                                  name: String(s.saleDate ?? '').slice(0, 10),
                                  value: Number(s.price ?? 0),
                                }))}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" hide />
                              <YAxis />
                              <Tooltip />
                              <Line type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                      <div className="overflow-x-auto rounded-md border border-border bg-surface">
                        <table className="w-full text-left text-xs">
                          <thead className="border-b border-border bg-background-subtle">
                            <tr>
                              <th className="px-3 py-2 font-semibold">Date</th>
                              <th className="px-3 py-2 font-semibold">Address</th>
                              <th className="px-3 py-2 font-semibold">Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(statsData as any).propertySalesRecords.slice(0, 100).map((row: Record<string, unknown>, idx: number) => (
                              <tr key={`${String(row.id ?? idx)}-${idx}`} className="border-b border-border/70">
                                <td className="px-3 py-2">{String(row.saleDate ?? 'N/A')}</td>
                                <td className="px-3 py-2">{String(row.address ?? 'N/A')}</td>
                                <td className="px-3 py-2">EUR {Number(row.price ?? 0).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-foreground-muted">No property sales evidence returned for this scope.</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="zoning" className="mt-0">
                <div className="min-h-[520px] space-y-4 rounded-md border border-border bg-background-subtle p-4">
                  {(statsData as any)?.zoning?.hasPrimaryZone ? (
                    <>
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">Primary Zone</CardTitle></CardHeader>
                        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
                          <p><span className="text-foreground-muted">Code:</span> {String((statsData as any)?.zoning?.primaryZone?.zoneGzt ?? 'N/A')}</p>
                          <p><span className="text-foreground-muted">Authority:</span> {String((statsData as any)?.zoning?.primaryZone?.laName ?? 'N/A')}</p>
                          <p className="sm:col-span-2"><span className="text-foreground-muted">Description:</span> {String((statsData as any)?.zoning?.primaryZone?.zoneDesc ?? 'N/A')}</p>
                        </CardContent>
                      </Card>
                      {Array.isArray((statsData as any)?.zoning?.zoneTypeDistribution) &&
                      (statsData as any).zoning.zoneTypeDistribution.length > 0 && (
                        <Card>
                          <CardHeader className="pb-2"><CardTitle className="text-sm">Nearby Zone Distribution</CardTitle></CardHeader>
                          <CardContent className="h-[260px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={(statsData as any).zoning.zoneTypeDistribution.map(
                                  (z: Record<string, unknown>) => ({
                                    name: String(z.type ?? 'Unknown'),
                                    value: Number(z.count ?? 0),
                                  }),
                                )}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" hide />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#7c3aed" />
                              </BarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-foreground-muted">No zoning evidence returned for this scope.</p>
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
