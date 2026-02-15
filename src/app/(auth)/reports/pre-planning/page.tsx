'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MapPin,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
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
import { reportJobsApi, type ReportJobDetail } from '@/lib/api/report-jobs';
import { getAllPlanningCategories, getPlanningSubCategories } from '@/lib/constants/planning-intentions';
import type { PrePlanningStatsResponse } from '@/lib/types/phase5';

type UnknownRecord = Record<string, unknown>;

type NormalizedApp = {
  applicationNumber: string;
  planningAuthority: string;
  decision: string;
  status: string;
  receivedDate: string;
  decisionDate: string;
  applicationType: string;
  address: string;
  units: number;
  floorArea: number;
};

type ChartDatum = {
  name: string;
  value: number;
};

type PeriodKey = 'all' | 'last36' | 'last12';

type PeriodMetrics = {
  total: number;
  granted: number;
  refused: number;
  pending: number;
  approvalRate: number | null;
};

type ApplicationsStatsShape = {
  counts?: {
    unique?: number;
    last36?: number;
    last12?: number;
  };
  decisions?: {
    grants?: number;
    refuses?: number;
    approvalRate?: number | null;
    approvalShareAll?: number | null;
  };
  timelines?: {
    medianDecisionDays?: number | null;
  };
  scale?: {
    sumUnits?: number;
    sumFloorspace?: number;
  };
  mix?: Array<{
    type?: string;
    count?: number;
    share?: number;
  }>;
};

type BcmsStatsShape = {
  total?: number;
  last36?: number;
  last12?: number;
  sumFloorspace?: number;
  byStatus?: Array<{
    status?: string;
    count?: number;
    share?: number;
  }>;
};

type SalesStatsShape = {
  total?: number;
  last36?: number;
  last12?: number;
  medianPrice?: number | null;
};

type ZoneDistribution = {
  type?: string;
  count?: number;
  share?: number;
};

type ZoningStatsShape = {
  hasPrimaryZone?: boolean;
  primaryZone?: {
    zoneGzt?: string;
    zoneOrig?: string;
    zoneDesc?: string;
    laName?: string;
    planName?: string;
  };
  nearbyZonesCount?: number;
  zoneTypeDistribution?: ZoneDistribution[];
};

type EnhancedStats = PrePlanningStatsResponse & {
  applications?: ApplicationsStatsShape;
  bcms?: BcmsStatsShape;
  propertySales?: SalesStatsShape;
  zoning?: ZoningStatsShape;
  bcmsRecords?: UnknownRecord[];
  propertySalesRecords?: UnknownRecord[];
};

const STATUS_COLORS = ['#1270AF', '#16a34a', '#dc2626', '#f59e0b', '#64748b', '#0ea5e9', '#7c3aed'];

function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(/[^\d.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toDate(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return 'N/A';
  return new Intl.NumberFormat('en-IE').format(value);
}

function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return 'N/A';
  return `${value.toFixed(1)}%`;
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return 'N/A';
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function normalizeApp(raw: unknown): NormalizedApp {
  const app = raw as UnknownRecord;
  return {
    applicationNumber: String(app.ApplicationNumber ?? app.applicationNumber ?? 'N/A'),
    planningAuthority: String(app.PlanningAuthority ?? app.planningAuthority ?? 'Unknown'),
    decision: String(app.Decision ?? app.decision ?? ''),
    status: String(app.ApplicationStatus ?? app.applicationStatus ?? ''),
    receivedDate: String(app.ReceivedDate ?? app.receivedDate ?? ''),
    decisionDate: String(app.DecisionDate ?? app.decisionDate ?? ''),
    applicationType: String(app.ApplicationType ?? app.applicationType ?? 'Other'),
    address: String(app.DevelopmentAddress ?? app.developmentAddress ?? 'Unknown address'),
    units: toNumber(app.NumResidentialUnits ?? app.numResidentialUnits),
    floorArea: toNumber(app.FloorArea ?? app.floorArea),
  };
}

function getDecisionBucket(app: NormalizedApp): 'granted' | 'refused' | 'pending' | 'withdrawnOrInvalid' | 'other' {
  const decision = app.decision.toUpperCase();
  const status = app.status.toUpperCase();

  if (
    decision.includes('GRANT') ||
    decision.includes('APPROV') ||
    decision.includes('EXEMPT') ||
    decision.includes('PERMISSION')
  ) {
    return 'granted';
  }

  if (decision.includes('REFUS')) {
    return 'refused';
  }

  if (
    decision.includes('WITHDRAW') ||
    decision.includes('INVALID') ||
    status.includes('WITHDRAW') ||
    status.includes('INVALID')
  ) {
    return 'withdrawnOrInvalid';
  }

  if (!decision || decision.includes('PENDING') || status.includes('PENDING') || status.includes('LIVE')) {
    return 'pending';
  }

  return 'other';
}

function computePeriodMetrics(apps: NormalizedApp[], range: PeriodKey): PeriodMetrics {
  const now = new Date();
  const threshold =
    range === 'all'
      ? null
      : new Date(now.getFullYear(), now.getMonth() - (range === 'last36' ? 36 : 12), now.getDate());

  const inScope = apps.filter((app) => {
    if (!threshold) return true;
    const dt = toDate(app.receivedDate);
    return dt ? dt >= threshold : false;
  });

  const granted = inScope.filter((app) => getDecisionBucket(app) === 'granted').length;
  const refused = inScope.filter((app) => getDecisionBucket(app) === 'refused').length;
  const pending = inScope.filter((app) => getDecisionBucket(app) === 'pending').length;
  const approvalRate = granted + refused > 0 ? (granted / (granted + refused)) * 100 : null;

  return {
    total: inScope.length,
    granted,
    refused,
    pending,
    approvalRate,
  };
}

function computeMedianDecisionDays(apps: NormalizedApp[]): number | null {
  const dayValues = apps
    .map((app) => {
      const received = toDate(app.receivedDate);
      const decided = toDate(app.decisionDate);
      if (!received || !decided) return null;
      const delta = Math.abs(decided.getTime() - received.getTime());
      return Math.round(delta / (1000 * 60 * 60 * 24));
    })
    .filter((v): v is number => v != null)
    .sort((a, b) => a - b);

  if (dayValues.length === 0) return null;
  const mid = Math.floor(dayValues.length / 2);
  return dayValues.length % 2 ? dayValues[mid] : Math.round((dayValues[mid - 1] + dayValues[mid]) / 2);
}

function growthRatePercent(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
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

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function downloadTextFile(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <p className="text-xs text-foreground-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-foreground-muted">{hint}</p> : null}
    </div>
  );
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
  const [statsData, setStatsData] = useState<EnhancedStats | null>(null);
  const [isRunningReport, setIsRunningReport] = useState(false);
  const [isFetchingNearby, setIsFetchingNearby] = useState(false);
  const [applicationPage, setApplicationPage] = useState(1);
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const [isHydratingJob, setIsHydratingJob] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const searchParams = useSearchParams();

  const categories = useMemo(() => getAllPlanningCategories(), []);
  const subCategories = useMemo(() => getPlanningSubCategories(intentionCategory), [intentionCategory]);

  const normalizedApplications = useMemo(
    () => effectiveApplications.map((app) => normalizeApp(app)),
    [effectiveApplications],
  );

  const applicationStats = statsData?.applications;
  const bcmsStats = statsData?.bcms;
  const salesStats = statsData?.propertySales;
  const zoningStats = statsData?.zoning;

  const kpis = useMemo(() => {
    const total = applicationStats?.counts?.unique ?? normalizedApplications.length;
    const granted = applicationStats?.decisions?.grants ?? normalizedApplications.filter((a) => getDecisionBucket(a) === 'granted').length;
    const refused = applicationStats?.decisions?.refuses ?? normalizedApplications.filter((a) => getDecisionBucket(a) === 'refused').length;
    const pending = normalizedApplications.filter((a) => getDecisionBucket(a) === 'pending').length;
    const approvalRate =
      applicationStats?.decisions?.approvalRate ??
      (granted + refused > 0 ? (granted / (granted + refused)) * 100 : null);
    const medianDecisionDays = applicationStats?.timelines?.medianDecisionDays ?? computeMedianDecisionDays(normalizedApplications);
    const units = applicationStats?.scale?.sumUnits ?? normalizedApplications.reduce((sum, app) => sum + app.units, 0);
    const floorspace =
      applicationStats?.scale?.sumFloorspace ??
      normalizedApplications.reduce((sum, app) => sum + app.floorArea, 0);

    return {
      total,
      granted,
      refused,
      pending,
      approvalRate,
      medianDecisionDays,
      units,
      floorspace,
    };
  }, [applicationStats, normalizedApplications]);

  const periodRows = useMemo(() => {
    const fallback = {
      all: computePeriodMetrics(normalizedApplications, 'all'),
      last36: computePeriodMetrics(normalizedApplications, 'last36'),
      last12: computePeriodMetrics(normalizedApplications, 'last12'),
    };

    const allTotal = applicationStats?.counts?.unique ?? fallback.all.total;
    const allGranted = applicationStats?.decisions?.grants ?? fallback.all.granted;
    const allRefused = applicationStats?.decisions?.refuses ?? fallback.all.refused;
    const allApproval = applicationStats?.decisions?.approvalRate ?? fallback.all.approvalRate;

    return [
      {
        label: 'All data',
        total: allTotal,
        granted: allGranted,
        refused: allRefused,
        pending: fallback.all.pending,
        approvalRate: allApproval,
      },
      {
        label: 'Last 36 months',
        total: applicationStats?.counts?.last36 ?? fallback.last36.total,
        granted: fallback.last36.granted,
        refused: fallback.last36.refused,
        pending: fallback.last36.pending,
        approvalRate: fallback.last36.approvalRate,
      },
      {
        label: 'Last 12 months',
        total: applicationStats?.counts?.last12 ?? fallback.last12.total,
        granted: fallback.last12.granted,
        refused: fallback.last12.refused,
        pending: fallback.last12.pending,
        approvalRate: fallback.last12.approvalRate,
      },
    ];
  }, [applicationStats, normalizedApplications]);

  const growth12mVsPrior = useMemo(() => {
    const now = new Date();
    const last12Boundary = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());
    const prev12Boundary = new Date(now.getFullYear(), now.getMonth() - 24, now.getDate());

    let last12 = 0;
    let previous12 = 0;

    normalizedApplications.forEach((app) => {
      const dt = toDate(app.receivedDate);
      if (!dt) return;
      if (dt >= last12Boundary) {
        last12 += 1;
      } else if (dt >= prev12Boundary) {
        previous12 += 1;
      }
    });

    return {
      last12,
      previous12,
      growth: growthRatePercent(last12, previous12),
    };
  }, [normalizedApplications]);

  const decisionsData = useMemo<ChartDatum[]>(() => {
    const grouped = new Map<string, number>();
    normalizedApplications.forEach((app) => {
      const bucket = getDecisionBucket(app);
      const label =
        bucket === 'granted'
          ? 'Granted'
          : bucket === 'refused'
            ? 'Refused'
            : bucket === 'pending'
              ? 'Pending/Live'
              : bucket === 'withdrawnOrInvalid'
                ? 'Withdrawn/Invalid'
                : 'Other';
      grouped.set(label, (grouped.get(label) ?? 0) + 1);
    });

    return Array.from(grouped.entries())
      .sort((a, b) => b[1] - a[1])
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
    if (applicationStats?.mix?.length) {
      return applicationStats.mix
        .map((mix) => ({
          name: String(mix.type ?? 'Unknown'),
          value: Number(mix.count ?? 0),
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
    }

    const grouped = new Map<string, number>();
    normalizedApplications.forEach((app) => {
      grouped.set(app.applicationType, (grouped.get(app.applicationType) ?? 0) + 1);
    });
    return Array.from(grouped.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  }, [applicationStats, normalizedApplications]);

  const monthlyData = useMemo<ChartDatum[]>(() => {
    const grouped = new Map<string, number>();
    normalizedApplications.forEach((app) => {
      const dt = toDate(app.receivedDate);
      if (!dt) return;
      const key = monthKey(dt);
      grouped.set(key, (grouped.get(key) ?? 0) + 1);
    });

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-24)
      .map(([name, value]) => ({ name, value }));
  }, [normalizedApplications]);

  const zoningDistribution = useMemo(
    () =>
      (zoningStats?.zoneTypeDistribution ?? [])
        .map((z) => ({
          name: String(z.type ?? 'Unknown'),
          value: Number(z.count ?? 0),
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8),
    [zoningStats],
  );

  const bcmsStatusData = useMemo(
    () =>
      (bcmsStats?.byStatus ?? [])
        .map((s) => ({
          name: String(s.status ?? 'Unknown'),
          value: Number(s.count ?? 0),
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8),
    [bcmsStats],
  );

  const riskSignals = useMemo(() => {
    const risks: string[] = [];
    const opportunities: string[] = [];

    if (kpis.total < 20) {
      risks.push('Evidence base is thin (<20 comparable applications), so confidence should be treated as moderate.');
    }
    if ((kpis.approvalRate ?? 0) < 45 && kpis.refused >= 8) {
      risks.push('Approval climate is challenging (approval rate below 45%), indicating tighter planning scrutiny.');
    }
    if ((kpis.medianDecisionDays ?? 0) > 180) {
      risks.push('Decision timelines are extended (median over 180 days), so programme risk allowance should be increased.');
    }
    if (periodRows[2].total <= 5) {
      risks.push('Recent activity is limited in the last 12 months, reducing recency confidence for forecasting.');
    }

    if ((kpis.approvalRate ?? 0) >= 65 && kpis.granted >= 12) {
      opportunities.push('Decision climate is supportive with strong approval performance for comparable proposals.');
    }
    if ((growth12mVsPrior.growth ?? -1) > 10) {
      opportunities.push('Application activity is growing year-on-year, indicating sustained local demand.');
    }
    if ((bcmsStats?.total ?? 0) >= 15) {
      opportunities.push('BCMS commencement volume indicates active project delivery in the catchment.');
    }
    if ((salesStats?.medianPrice ?? 0) > 0) {
      opportunities.push('Property sales market has measurable turnover, supporting viability triangulation.');
    }
    if (zoningStats?.hasPrimaryZone && zoningStats.primaryZone?.zoneGzt) {
      opportunities.push(`Primary zoning context identified (${zoningStats.primaryZone.zoneGzt}), enabling clearer planning fit assessment.`);
    }

    return {
      risks,
      opportunities,
    };
  }, [bcmsStats?.total, growth12mVsPrior.growth, kpis, periodRows, salesStats?.medianPrice, zoningStats]);

  const applicationPageSize = 20;
  const pagedApplications = useMemo(() => {
    const start = (applicationPage - 1) * applicationPageSize;
    return normalizedApplications.slice(start, start + applicationPageSize);
  }, [applicationPage, normalizedApplications]);
  const totalAppPages = Math.max(1, Math.ceil(normalizedApplications.length / applicationPageSize));

  const hydrateFromReportJob = (job: ReportJobDetail) => {
    setActiveJobId(job.id);
    setAddress(job.address || '');
    setCoords({ lat: job.latitude, lng: job.longitude });
    setEffectiveRadius(job.adjustedRadius);
    setInitialCount(job.applicationCount);
    setIntentionCategory(job.intentionCategory || '');
    setIntentionSubCategory(job.intentionSubCategory || '');
    setReportHtml(job.narrativeHtml || job.combinedHtml || '');
    setStatsData((job.statsSnapshot as EnhancedStats) || null);
    setEffectiveApplications(Array.isArray(job.applicationsSnapshot) ? (job.applicationsSnapshot as unknown[]) : []);
    setApplicationPage(1);
  };

  useEffect(() => {
    const jobIdParam = searchParams.get('jobId');
    if (!jobIdParam) return;
    const parsed = Number.parseInt(jobIdParam, 10);
    if (!Number.isFinite(parsed)) return;
    if (activeJobId === parsed) return;

    let cancelled = false;
    const load = async () => {
      try {
        setIsHydratingJob(true);
        setErrorText('');
        setStatusText(`Loading saved report #${parsed}...`);
        const job = await reportJobsApi.getPrePlanningJob(parsed);
        if (cancelled) return;
        hydrateFromReportJob(job);
        setStatusText(`Loaded saved report #${parsed} (${job.reportStatus}).`);
      } catch (error) {
        if (cancelled) return;
        setErrorText(error instanceof Error ? error.message : 'Failed to load saved report.');
      } finally {
        if (!cancelled) setIsHydratingJob(false);
      }
    };
    load();

    return () => {
      cancelled = true;
    };
  }, [searchParams, activeJobId]);

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
    setStatusText('Location selected. Fetch nearby applications or generate enterprise report.');
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

      setStatusText('Determining optimal evidence radius...');
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
        initialRadius: 500,
        adjustedRadius: optimal.adjustedRadius ?? radius,
        initialApplicationCount: optimal.initialCount ?? selectedApps.length,
        address: address || undefined,
        centreLat: coords.lat,
        centreLon: coords.lng,
        intentionCategory,
        intentionSubCategory,
      };

      setStatusText('Saving report job and queuing background generation...');
      const createdJob = await reportJobsApi.createPrePlanningJob(payload);
      setActiveJobId(createdJob.jobId);
      setStatusText(`Report #${createdJob.jobId} queued. You can leave this page; generation will continue in history.`);

      // Immediate deterministic preview while background job runs.
      const stats = await reportsApi.computeStats(payload);
      setStatsData(stats as EnhancedStats);

      let isComplete = false;
      for (let attempt = 0; attempt < 240; attempt += 1) {
        const job = await reportJobsApi.getPrePlanningJob(createdJob.jobId);
        if (job.reportStatus === 'generated') {
          hydrateFromReportJob(job);
          setStatusText(`Report #${createdJob.jobId} generated and saved.`);
          isComplete = true;
          break;
        }
        if (job.reportStatus === 'failed') {
          const err = job.errorMessage || 'Report generation failed.';
          setErrorText(err);
          setStatusText(`Report #${createdJob.jobId} failed.`);
          isComplete = true;
          break;
        }
        setStatusText(`Report #${createdJob.jobId} is ${job.reportStatus}. This will continue even if you navigate away.`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      if (!isComplete) {
        setStatusText(`Report #${createdJob.jobId} is still running. Check Report History to open it when ready.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate report.';
      setErrorText(message);
      setStatusText('Report generation failed.');
    } finally {
      setIsRunningReport(false);
    }
  };

  const buildFullExportHtml = () => {
    const evidenceRows = normalizedApplications
      .map(
        (app) =>
          `<tr><td>${escapeHtml(app.applicationNumber)}</td><td>${escapeHtml(app.planningAuthority)}</td><td>${escapeHtml(app.decision || app.status || 'N/A')}</td><td>${escapeHtml(app.receivedDate || 'N/A')}</td><td>${escapeHtml(app.applicationType || 'N/A')}</td><td>${escapeHtml(app.address || 'N/A')}</td></tr>`,
      )
      .join('');

    const periodRowsHtml = periodRows
      .map(
        (row) =>
          `<tr><td>${escapeHtml(row.label)}</td><td>${formatNumber(row.total)}</td><td>${formatNumber(row.granted)}</td><td>${formatNumber(row.refused)}</td><td>${formatNumber(row.pending)}</td><td>${formatPercent(row.approvalRate)}</td></tr>`,
      )
      .join('');

    const headerTitle = address || 'Unspecified location';
    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Planify Pre-Planning Report</title>
  <style>
    body { font-family: Arial, sans-serif; color: #0f172a; margin: 24px; }
    h1, h2, h3 { margin: 0 0 12px; }
    h1 { font-size: 28px; }
    h2 { font-size: 20px; margin-top: 28px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
    .meta { font-size: 13px; color: #475569; margin-bottom: 14px; }
    .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
    .card { border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; }
    .label { font-size: 11px; color: #64748b; }
    .value { font-size: 18px; font-weight: 700; }
    table { border-collapse: collapse; width: 100%; font-size: 12px; }
    th, td { border: 1px solid #e2e8f0; padding: 7px; text-align: left; }
    th { background: #f8fafc; }
    ul { padding-left: 18px; }
  </style>
</head>
<body>
  <h1>Pre-Planning Intelligence Report</h1>
  <p class="meta">Address: ${escapeHtml(headerTitle)} | Intent: ${escapeHtml(intentionCategory || 'N/A')}${intentionSubCategory ? ` -> ${escapeHtml(intentionSubCategory)}` : ''} | Effective Radius: ${effectiveRadius}m | Generated: ${new Date().toISOString()}</p>
  <h2>Executive Briefing</h2>
  <div class="grid">
    <div class="card"><div class="label">Applications</div><div class="value">${formatNumber(kpis.total)}</div></div>
    <div class="card"><div class="label">Approval Rate</div><div class="value">${formatPercent(kpis.approvalRate)}</div></div>
    <div class="card"><div class="label">Median Decision Days</div><div class="value">${kpis.medianDecisionDays == null ? 'N/A' : formatNumber(kpis.medianDecisionDays)}</div></div>
    <div class="card"><div class="label">Granted</div><div class="value">${formatNumber(kpis.granted)}</div></div>
    <div class="card"><div class="label">Refused</div><div class="value">${formatNumber(kpis.refused)}</div></div>
    <div class="card"><div class="label">Pending</div><div class="value">${formatNumber(kpis.pending)}</div></div>
  </div>
  <h2>Period Analysis</h2>
  <table><thead><tr><th>Period</th><th>Total</th><th>Granted</th><th>Refused</th><th>Pending</th><th>Approval Rate</th></tr></thead><tbody>${periodRowsHtml}</tbody></table>
  <h2>Risk Signals</h2>
  <ul>${riskSignals.risks.map((r) => `<li>${escapeHtml(r)}</li>`).join('') || '<li>No major downside signals detected.</li>'}</ul>
  <h2>Opportunity Signals</h2>
  <ul>${riskSignals.opportunities.map((o) => `<li>${escapeHtml(o)}</li>`).join('') || '<li>No major opportunity signals detected.</li>'}</ul>
  <h2>Evidence Register (Planning Applications)</h2>
  <table><thead><tr><th>Application</th><th>Authority</th><th>Decision</th><th>Received</th><th>Type</th><th>Address</th></tr></thead><tbody>${evidenceRows}</tbody></table>
  <h2>Deterministic Snapshot JSON</h2>
  <pre>${escapeHtml(JSON.stringify(statsData || {}, null, 2))}</pre>
  <h2>AI Commentary</h2>
  ${reportHtml || '<p>No AI commentary generated.</p>'}
</body>
</html>`;
  };

  const exportAllJson = () => {
    const payload = {
      metadata: {
        generatedAt: new Date().toISOString(),
        jobId: activeJobId,
        address,
        coords,
        intentionCategory,
        intentionSubCategory,
        initialCount,
        effectiveRadius,
      },
      kpis,
      periodRows,
      growth12mVsPrior,
      riskSignals,
      statsData,
      applications: normalizedApplications,
      reportHtml,
    };
    downloadTextFile(
      JSON.stringify(payload, null, 2),
      `planify-report-${activeJobId || Date.now()}.json`,
      'application/json',
    );
  };

  const exportFullHtml = () => {
    downloadTextFile(
      buildFullExportHtml(),
      `planify-report-${activeJobId || Date.now()}.html`,
      'text/html',
    );
  };

  const exportPdfPrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(buildFullExportHtml());
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 350);
  };

  return (
    <div className="mx-auto w-full max-w-7xl p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-foreground">Pre-Planning Intelligence Report</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Enterprise-grade location analysis for planning professionals. Deterministic evidence first, AI commentary second.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Report Scope</CardTitle>
            <CardDescription>Define location, development intention, and search strategy.</CardDescription>
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
                <label className="text-xs font-medium text-foreground-muted">Manual radius override</label>
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
                Preview Nearby Applications
              </Button>
              <Button variant="secondary" onClick={handleGenerateReport} disabled={!coords || isRunningReport || isHydratingJob}>
                {isRunningReport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate Enterprise Report
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
            <CardTitle>Enterprise Output</CardTitle>
            <CardDescription>
              Nearby preview: {nearbyApplications.length} • Report evidence set: {effectiveApplications.length} • Initial count: {initialCount || '—'} • Effective radius: {effectiveRadius}m
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-3 rounded-md border border-border bg-background-subtle p-2 text-xs text-foreground-muted">
              {statusText}
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportFullHtml}
                disabled={!statsData && !reportHtml}
              >
                Export Full HTML
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportAllJson}
                disabled={!statsData && normalizedApplications.length === 0}
              >
                Export Full JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportPdfPrint}
                disabled={!statsData && !reportHtml}
              >
                Export PDF (Print)
              </Button>
              {activeJobId ? (
                <span className="inline-flex items-center rounded-md border border-border px-2 py-1 text-xs text-foreground-muted">
                  Saved Job #{activeJobId}
                </span>
              ) : null}
            </div>

            <Tabs defaultValue="briefing">
              <TabsList className="mb-3 flex w-full flex-wrap justify-start gap-1">
                <TabsTrigger value="briefing">Executive Briefing</TabsTrigger>
                <TabsTrigger value="activity">Activity & Trend</TabsTrigger>
                <TabsTrigger value="decisions">Decision Intelligence</TabsTrigger>
                <TabsTrigger value="market">Market & Delivery</TabsTrigger>
                <TabsTrigger value="evidence">Evidence Register</TabsTrigger>
                <TabsTrigger value="ai">AI Commentary</TabsTrigger>
              </TabsList>

              <TabsContent value="briefing" className="mt-0">
                <div className="min-h-[560px] space-y-4 rounded-md border border-border bg-background-subtle p-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard label="Applications in scope" value={formatNumber(kpis.total)} />
                    <MetricCard label="Approval rate" value={formatPercent(kpis.approvalRate)} />
                    <MetricCard label="Median decision time" value={kpis.medianDecisionDays == null ? 'N/A' : `${formatNumber(kpis.medianDecisionDays)} days`} />
                    <MetricCard label="12m activity vs prior 12m" value={growth12mVsPrior.growth == null ? 'N/A' : `${growth12mVsPrior.growth >= 0 ? '+' : ''}${growth12mVsPrior.growth.toFixed(1)}%`} hint={`${growth12mVsPrior.last12} vs ${growth12mVsPrior.previous12} applications`} />
                    <MetricCard label="Granted / Refused / Pending" value={`${formatNumber(kpis.granted)} / ${formatNumber(kpis.refused)} / ${formatNumber(kpis.pending)}`} />
                    <MetricCard label="Residential units (sum)" value={formatNumber(kpis.units)} />
                    <MetricCard label="Floorspace (sqm, sum)" value={formatNumber(kpis.floorspace)} />
                    <MetricCard label="Primary zone" value={zoningStats?.primaryZone?.zoneGzt || 'Not identified'} hint={zoningStats?.primaryZone?.laName || undefined} />
                  </div>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Scope & Intent</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm text-foreground-muted">
                      <p>Address: <span className="font-medium text-foreground">{address || 'Not selected'}</span></p>
                      <p>Development intention: <span className="font-medium text-foreground">{intentionCategory || 'N/A'}{intentionSubCategory ? ` -> ${intentionSubCategory}` : ''}</span></p>
                      <p>Radius strategy: <span className="font-medium text-foreground">500m seed {'->'} {effectiveRadius}m effective</span></p>
                      <p>Evidence quality: <span className="font-medium text-foreground">{kpis.total >= 50 ? 'High' : kpis.total >= 20 ? 'Moderate' : 'Low'} confidence sample</span></p>
                    </CardContent>
                  </Card>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Risk Signals</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        {riskSignals.risks.length > 0 ? (
                          riskSignals.risks.map((item) => (
                            <p key={item} className="flex items-start gap-2 text-foreground">
                              <TrendingDown className="mt-0.5 h-4 w-4 text-red-600" />
                              <span>{item}</span>
                            </p>
                          ))
                        ) : (
                          <p className="text-foreground-muted">No major downside signals detected from current evidence.</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Opportunity Signals</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        {riskSignals.opportunities.length > 0 ? (
                          riskSignals.opportunities.map((item) => (
                            <p key={item} className="flex items-start gap-2 text-foreground">
                              <TrendingUp className="mt-0.5 h-4 w-4 text-green-600" />
                              <span>{item}</span>
                            </p>
                          ))
                        ) : (
                          <p className="text-foreground-muted">Generate a full report to unlock opportunity signals.</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="activity" className="mt-0">
                <div className="min-h-[560px] space-y-4 rounded-md border border-border bg-background-subtle p-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Period Comparison (Deterministic)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto rounded-md border border-border bg-surface">
                        <table className="w-full text-left text-xs">
                          <thead className="border-b border-border bg-background-subtle">
                            <tr>
                              <th className="px-3 py-2 font-semibold">Period</th>
                              <th className="px-3 py-2 font-semibold">Total</th>
                              <th className="px-3 py-2 font-semibold">Granted</th>
                              <th className="px-3 py-2 font-semibold">Refused</th>
                              <th className="px-3 py-2 font-semibold">Pending/Live</th>
                              <th className="px-3 py-2 font-semibold">Approval Rate</th>
                            </tr>
                          </thead>
                          <tbody>
                            {periodRows.map((row) => (
                              <tr key={row.label} className="border-b border-border/70">
                                <td className="px-3 py-2 font-medium">{row.label}</td>
                                <td className="px-3 py-2">{formatNumber(row.total)}</td>
                                <td className="px-3 py-2">{formatNumber(row.granted)}</td>
                                <td className="px-3 py-2">{formatNumber(row.refused)}</td>
                                <td className="px-3 py-2">{formatNumber(row.pending)}</td>
                                <td className="px-3 py-2">{formatPercent(row.approvalRate)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Applications Over Time (24 Months)</CardTitle></CardHeader>
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
                      <CardContent className="h-[280px]">
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
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="decisions" className="mt-0">
                <div className="min-h-[560px] space-y-4 rounded-md border border-border bg-background-subtle p-4">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Decision Mix</CardTitle></CardHeader>
                      <CardContent className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={decisionsData} dataKey="value" nameKey="name" outerRadius={90} label>
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
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Application Type Mix</CardTitle></CardHeader>
                      <CardContent className="h-[280px]">
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

                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Decision Readout</CardTitle></CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <MetricCard label="Granted" value={formatNumber(kpis.granted)} />
                      <MetricCard label="Refused" value={formatNumber(kpis.refused)} />
                      <MetricCard label="Pending / Live" value={formatNumber(kpis.pending)} />
                      <MetricCard label="Approval Rate" value={formatPercent(kpis.approvalRate)} />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="market" className="mt-0">
                <div className="min-h-[560px] space-y-4 rounded-md border border-border bg-background-subtle p-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard label="BCMS notices" value={formatNumber(bcmsStats?.total)} />
                    <MetricCard label="BCMS floorspace" value={bcmsStats?.sumFloorspace != null ? `${formatNumber(bcmsStats.sumFloorspace)} sqm` : 'N/A'} />
                    <MetricCard label="Property sales" value={formatNumber(salesStats?.total)} />
                    <MetricCard label="Median sales price" value={formatCurrency(salesStats?.medianPrice)} />
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm">BCMS Status Distribution</CardTitle></CardHeader>
                      <CardContent className="h-[260px]">
                        {bcmsStatusData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={bcmsStatusData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" hide />
                              <YAxis allowDecimals={false} />
                              <Tooltip />
                              <Bar dataKey="value" fill="#16a34a" />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="pt-10 text-center text-sm text-foreground-muted">No BCMS evidence returned for this scope.</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Nearby Zone Distribution</CardTitle></CardHeader>
                      <CardContent className="h-[260px]">
                        {zoningDistribution.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={zoningDistribution}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" hide />
                              <YAxis allowDecimals={false} />
                              <Tooltip />
                              <Bar dataKey="value" fill="#7c3aed" />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="pt-10 text-center text-sm text-foreground-muted">No zoning distribution returned for this scope.</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Primary Zone Context</CardTitle></CardHeader>
                    <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
                      <p><span className="text-foreground-muted">Zone Code:</span> {String(zoningStats?.primaryZone?.zoneGzt ?? 'N/A')}</p>
                      <p><span className="text-foreground-muted">Authority:</span> {String(zoningStats?.primaryZone?.laName ?? 'N/A')}</p>
                      <p><span className="text-foreground-muted">Plan:</span> {String(zoningStats?.primaryZone?.planName ?? 'N/A')}</p>
                      <p className="sm:col-span-2"><span className="text-foreground-muted">Description:</span> {String(zoningStats?.primaryZone?.zoneDesc ?? 'N/A')}</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="evidence" className="mt-0">
                <div className="min-h-[560px] space-y-4 rounded-md border border-border bg-background-subtle p-4">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Planning Applications Register</CardTitle></CardHeader>
                    <CardContent>
                      {normalizedApplications.length > 0 ? (
                        <div className="overflow-x-auto rounded-md border border-border bg-surface">
                          <table className="w-full text-left text-xs">
                            <thead className="border-b border-border bg-background-subtle">
                              <tr>
                                <th className="px-3 py-2 font-semibold">Application</th>
                                <th className="px-3 py-2 font-semibold">Authority</th>
                                <th className="px-3 py-2 font-semibold">Decision</th>
                                <th className="px-3 py-2 font-semibold">Received</th>
                                <th className="px-3 py-2 font-semibold">Type</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pagedApplications.map((app, idx) => (
                                <tr key={`${app.applicationNumber}-${idx}`} className="border-b border-border/70">
                                  <td className="px-3 py-2">{app.applicationNumber}</td>
                                  <td className="px-3 py-2">{app.planningAuthority}</td>
                                  <td className="px-3 py-2">{app.decision || app.status || 'N/A'}</td>
                                  <td className="px-3 py-2">{app.receivedDate || 'N/A'}</td>
                                  <td className="px-3 py-2">{app.applicationType || 'N/A'}</td>
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
                    </CardContent>
                  </Card>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm">BCMS Evidence (Top 50)</CardTitle></CardHeader>
                      <CardContent>
                        {Array.isArray(statsData?.bcmsRecords) && statsData.bcmsRecords.length > 0 ? (
                          <div className="max-h-[320px] overflow-auto rounded-md border border-border bg-surface scrollbar-thin">
                            <table className="w-full text-left text-xs">
                              <thead className="sticky top-0 border-b border-border bg-background-subtle">
                                <tr>
                                  <th className="px-3 py-2 font-semibold">Notice</th>
                                  <th className="px-3 py-2 font-semibold">Authority</th>
                                  <th className="px-3 py-2 font-semibold">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {statsData.bcmsRecords.slice(0, 50).map((row, idx) => (
                                  <tr key={`${String(row.id ?? idx)}-${idx}`} className="border-b border-border/70">
                                    <td className="px-3 py-2">{String(row.noticeExternalId ?? 'N/A')}</td>
                                    <td className="px-3 py-2">{String(row.localAuthority ?? 'N/A')}</td>
                                    <td className="px-3 py-2">{String(row.status ?? 'N/A')}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-sm text-foreground-muted">No BCMS evidence returned.</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Property Sales Evidence (Top 50)</CardTitle></CardHeader>
                      <CardContent>
                        {Array.isArray(statsData?.propertySalesRecords) && statsData.propertySalesRecords.length > 0 ? (
                          <div className="max-h-[320px] overflow-auto rounded-md border border-border bg-surface scrollbar-thin">
                            <table className="w-full text-left text-xs">
                              <thead className="sticky top-0 border-b border-border bg-background-subtle">
                                <tr>
                                  <th className="px-3 py-2 font-semibold">Date</th>
                                  <th className="px-3 py-2 font-semibold">Address</th>
                                  <th className="px-3 py-2 font-semibold">Price</th>
                                </tr>
                              </thead>
                              <tbody>
                                {statsData.propertySalesRecords.slice(0, 50).map((row, idx) => (
                                  <tr key={`${String(row.id ?? idx)}-${idx}`} className="border-b border-border/70">
                                    <td className="px-3 py-2">{String(row.saleDate ?? 'N/A')}</td>
                                    <td className="px-3 py-2">{String(row.address ?? 'N/A')}</td>
                                    <td className="px-3 py-2">{formatCurrency(toNumber(row.price))}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-sm text-foreground-muted">No property sales evidence returned.</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="ai" className="mt-0">
                <div className="min-h-[560px] space-y-3 rounded-md border border-border bg-background-subtle p-4">
                  <div className="rounded-md border border-border bg-surface p-3 text-xs text-foreground-muted">
                    <p className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#1270AF]" />
                      <span>
                        This section is supplementary. Enterprise decisions should prioritise deterministic metrics from Executive Briefing, Activity, Decision Intelligence, and Evidence Register.
                      </span>
                    </p>
                  </div>

                  {reportHtml ? (
                    <div
                      className="prose prose-sm max-w-none text-foreground dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: extractSectionedHtml(reportHtml) }}
                    />
                  ) : (
                    <p className="text-sm text-foreground-muted">
                      No AI commentary generated yet. Run Generate Enterprise Report to produce a narrative overlay.
                    </p>
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
