'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQueries, useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  MapPin,
  FileText,
  Bell,
  ListChecks,
  Trash2,
  Save,
  Plus,
  Loader2,
  RefreshCw,
  AlertCircle,
  Building2,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { ResearchAssistant } from '@/components/ai/research-assistant';
import { useProjectsStore } from '@/lib/stores/projects-store';
import { useFavorites } from '@/lib/queries/favorites';
import { applicationsApi } from '@/lib/api/applications';
import { bcmsApi } from '@/lib/api/bcms';
import { propertyApi } from '@/lib/api/property';
import { zoningApi } from '@/lib/api/zoning';
import { queryKeys } from '@/lib/queries/keys';
import { formatAddress, formatDistance } from '@/lib/utils/formatting';
import { formatDate } from '@/lib/utils/dates';
import type { Application } from '@/lib/types/application';

function formatEuro(value: number) {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMeters(value: number) {
  return value < 1000 ? `${Math.round(value)}m` : `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}km`;
}

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number; formattedAddress: string } | null> {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&components=country:IE&key=${key}`;
    const response = await fetch(url);
    const json = await response.json();
    if (json.status !== 'OK' || !json.results?.length) return null;

    const result = json.results[0];
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formattedAddress: result.formatted_address,
    };
  } catch {
    return null;
  }
}

export default function ProjectWorkspacePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const projectId = params?.id ?? '';

  const projects = useProjectsStore((state) => state.projects);
  const renameProject = useProjectsStore((state) => state.renameProject);
  const deleteProject = useProjectsStore((state) => state.deleteProject);
  const setProjectLocation = useProjectsStore((state) => state.setProjectLocation);
  const addApplicationToProject = useProjectsStore((state) => state.addApplicationToProject);
  const removeApplicationFromProject = useProjectsStore((state) => state.removeApplicationFromProject);
  const updateNotes = useProjectsStore((state) => state.updateNotes);

  const [mounted, setMounted] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [analysisRadiusMeters, setAnalysisRadiusMeters] = useState(1000);
  const [locatingSite, setLocatingSite] = useState(false);
  const [locationError, setLocationError] = useState('');

  const project = useMemo(
    () => projects.find((entry) => entry.id === projectId),
    [projects, projectId],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!project) return;
    setNameDraft(project.name);
    setNoteDraft(project.notes);
  }, [project]);

  const { data: favorites } = useFavorites(1, 120);
  const favoriteApplications = useMemo(
    () => favorites?.data ?? [],
    [favorites?.data],
  );

  const monitoredQueries = useQueries({
    queries: (project?.applicationIds ?? []).map((applicationId) => ({
      queryKey: queryKeys.applications.detail(applicationId),
      queryFn: () => applicationsApi.getById(applicationId),
      staleTime: 60_000,
    })),
  });

  const monitoredApplications = useMemo<Application[]>(
    () =>
      monitoredQueries
        .map((result) => result.data)
        .filter((application): application is Application => Boolean(application)),
    [monitoredQueries],
  );

  const addableFavorites = useMemo(
    () =>
      favoriteApplications.filter(
        (application) => !project?.applicationIds.includes(application.applicationId),
      ),
    [favoriteApplications, project?.applicationIds],
  );

  const hasCoordinates = Boolean(project && project.latitude !== null && project.longitude !== null);

  const siteIntelligenceQuery = useQuery({
    queryKey: [
      'projects',
      'site-intelligence',
      project?.id,
      project?.latitude,
      project?.longitude,
      analysisRadiusMeters,
    ],
    queryFn: async () => {
      const latitude = project?.latitude;
      const longitude = project?.longitude;
      if (latitude == null || longitude == null) {
        throw new Error('Project location is not set.');
      }

      const [applicationsResponse, bcms, sales, zoning] = await Promise.all([
        applicationsApi.list(
          {
            latitude: String(latitude),
            longitude: String(longitude),
            radius: analysisRadiusMeters,
            sortBy: 'distance_nearest',
          },
          1,
          120,
        ),
        bcmsApi.getNearby(latitude, longitude, analysisRadiusMeters),
        propertyApi.getNearbySales(latitude, longitude, analysisRadiusMeters),
        zoningApi.getAtPoint(latitude, longitude),
      ]);

      return {
        applications: applicationsResponse.data,
        totalApplications: applicationsResponse.total,
        bcms,
        sales,
        zoning,
      };
    },
    enabled: Boolean(project?.id && hasCoordinates),
    staleTime: 60_000,
  });

  const nearbyApplications = useMemo(() => {
    return [...(siteIntelligenceQuery.data?.applications ?? [])]
      .sort((a, b) => (a.distanceKm ?? Number.MAX_SAFE_INTEGER) - (b.distanceKm ?? Number.MAX_SAFE_INTEGER));
  }, [siteIntelligenceQuery.data?.applications]);

  const nearbyBcms = useMemo(() => {
    return [...(siteIntelligenceQuery.data?.bcms ?? [])]
      .sort((a, b) => (a.distanceMeters ?? Number.MAX_SAFE_INTEGER) - (b.distanceMeters ?? Number.MAX_SAFE_INTEGER));
  }, [siteIntelligenceQuery.data?.bcms]);

  const nearbySales = useMemo(() => {
    return [...(siteIntelligenceQuery.data?.sales ?? [])]
      .sort((a, b) => (a.distanceMeters ?? Number.MAX_SAFE_INTEGER) - (b.distanceMeters ?? Number.MAX_SAFE_INTEGER));
  }, [siteIntelligenceQuery.data?.sales]);

  const decisionStats = useMemo(() => {
    let granted = 0;
    let refused = 0;

    for (const application of nearbyApplications) {
      const normalized = `${application.decisionCategory ?? ''} ${application.displayDecision ?? ''} ${application.decision ?? ''}`.toLowerCase();
      if (normalized.includes('grant')) {
        granted += 1;
      } else if (normalized.includes('refus')) {
        refused += 1;
      }
    }

    const decided = granted + refused;
    const grantRate = decided > 0 ? Math.round((granted / decided) * 100) : null;

    return { granted, refused, decided, grantRate };
  }, [nearbyApplications]);

  const commencedCount = useMemo(
    () => nearbyBcms.filter((notice) => Boolean(notice.commencementDate)).length,
    [nearbyBcms],
  );

  const averageSalePrice = useMemo(() => {
    if (nearbySales.length === 0) return null;
    const total = nearbySales.reduce((sum, sale) => sum + Number(sale.price || 0), 0);
    return Math.round(total / nearbySales.length);
  }, [nearbySales]);

  const projectAlertHref = useMemo(() => {
    if (!project) return '/alerts';

    const params = new URLSearchParams({
      create: '1',
      scope: 'radius',
      alertType: 'new_application',
      address: project.address,
      radius: String(Math.min(analysisRadiusMeters, 1000)),
    });

    if (project.latitude !== null && project.longitude !== null) {
      params.set('lat', String(project.latitude));
      params.set('lng', String(project.longitude));
    }

    return `/alerts?${params.toString()}`;
  }, [project, analysisRadiusMeters]);

  const projectAssistantContext = useMemo(() => {
    if (!project) return '';

    const contextParts = [
      `Project name: ${project.name}`,
      `Site address: ${project.address}`,
      project.latitude !== null && project.longitude !== null
        ? `Site coordinates: ${project.latitude}, ${project.longitude}`
        : 'Site coordinates are not set yet',
      `Current analysis radius: ${analysisRadiusMeters} meters`,
      `Nearby applications in radius: ${siteIntelligenceQuery.data?.totalApplications ?? nearbyApplications.length}`,
      `Nearby commencements in radius: ${nearbyBcms.length}`,
      `Nearby property sales in radius: ${nearbySales.length}`,
      decisionStats.grantRate !== null
        ? `Decision grant rate for decided nearby applications: ${decisionStats.grantRate}%`
        : 'No decided nearby applications yet',
      siteIntelligenceQuery.data?.zoning
        ? `Zoning: ${siteIntelligenceQuery.data.zoning.zoneGzt ?? 'Unknown'} (${siteIntelligenceQuery.data.zoning.gztDesc ?? siteIntelligenceQuery.data.zoning.zoneDesc ?? 'No description'})`
        : 'No zoning polygon found at this site',
    ];

    return contextParts.join(' | ');
  }, [
    project,
    analysisRadiusMeters,
    siteIntelligenceQuery.data?.totalApplications,
    siteIntelligenceQuery.data?.zoning,
    nearbyApplications.length,
    nearbyBcms.length,
    nearbySales.length,
    decisionStats.grantRate,
  ]);

  const projectAssistantSuggestions = useMemo(
    () => [
      `What percentage of decided applications within ${formatMeters(analysisRadiusMeters)} were granted near this site?`,
      `Show recent residential applications within ${formatMeters(analysisRadiusMeters)} of this project`,
      'How many nearby granted applications appear to have actually commenced construction?',
      'What do nearby application outcomes and sales suggest about this site risk profile?',
    ],
    [analysisRadiusMeters],
  );

  const handleLocateSite = async () => {
    if (!project?.address.trim()) {
      setLocationError('Project address is required before locating the site.');
      return;
    }

    setLocatingSite(true);
    setLocationError('');

    const geocoded = await geocodeAddress(project.address);
    setLocatingSite(false);

    if (!geocoded) {
      setLocationError('Unable to locate this address in Ireland. Try a more specific site address.');
      return;
    }

    setProjectLocation(project.id, geocoded.lat, geocoded.lng, geocoded.formattedAddress);
  };

  if (!mounted) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-sm text-foreground-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading project workspace…
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <EmptyState
          icon={FileText}
          title="Project not found"
          description="This project does not exist or was deleted."
        >
          <Button size="sm" className="mt-4" onClick={() => router.push('/projects')}>
            Back to projects
          </Button>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <button
            onClick={() => router.push('/projects')}
            className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to projects
          </button>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              className="h-9 w-full sm:w-[360px]"
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
            />
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => renameProject(project.id, nameDraft)}
            >
              <Save className="h-3.5 w-3.5" />
              Save name
            </Button>
          </div>
          <p className="inline-flex items-center gap-1.5 text-xs text-foreground-muted">
            <MapPin className="h-3.5 w-3.5" />
            {project.address}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-destructive hover:text-destructive"
          onClick={() => {
            deleteProject(project.id);
            router.push('/projects');
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete project
        </Button>
      </div>

      <Tabs defaultValue="site" className="w-full">
        <TabsList>
          <TabsTrigger value="site">Site Intelligence</TabsTrigger>
          <TabsTrigger value="apps">Monitored Applications</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="ai">AI Research</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="site" className="space-y-4">
          <Card>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Project Site</p>
                <p className="mt-1 text-xs text-foreground-muted">{project.address}</p>
                <p className="mt-1 text-xs text-foreground-subtle">
                  {hasCoordinates
                    ? `Coordinates: ${project.latitude!.toFixed(5)}, ${project.longitude!.toFixed(5)}`
                    : 'Coordinates not set yet.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {hasCoordinates && (
                  <div className="hidden rounded-md border border-border px-2.5 py-1 text-xs text-foreground-muted sm:block">
                    Analysis radius: {formatMeters(analysisRadiusMeters)}
                  </div>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={handleLocateSite}
                  disabled={locatingSite}
                >
                  {locatingSite ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Locating…
                    </>
                  ) : (
                    <>
                      <MapPin className="h-3.5 w-3.5" />
                      {hasCoordinates ? 'Re-locate site' : 'Locate site'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {locationError && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="flex items-center gap-2 p-4 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {locationError}
              </CardContent>
            </Card>
          )}

          {!hasCoordinates && (
            <EmptyState
              icon={MapPin}
              title="Set project coordinates"
              description="Locate this project site to unlock nearby applications, commencements, sales, and zoning intelligence."
            >
              <Button
                size="sm"
                className="mt-4 gap-1.5 bg-brand-500 hover:bg-brand-600"
                onClick={handleLocateSite}
                disabled={locatingSite}
              >
                {locatingSite ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
                Locate project site
              </Button>
            </EmptyState>
          )}

          {hasCoordinates && (
            <>
              <Card>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex flex-wrap gap-2">
                    {[500, 1000, 2000, 5000].map((radius) => (
                      <Button
                        key={radius}
                        size="sm"
                        variant={analysisRadiusMeters === radius ? 'default' : 'outline'}
                        className={analysisRadiusMeters === radius ? 'bg-brand-500 hover:bg-brand-600' : ''}
                        onClick={() => setAnalysisRadiusMeters(radius)}
                      >
                        {formatMeters(radius)}
                      </Button>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => void siteIntelligenceQuery.refetch()}
                    disabled={siteIntelligenceQuery.isFetching}
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${siteIntelligenceQuery.isFetching ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </CardContent>
              </Card>

              {siteIntelligenceQuery.error && (
                <Card className="border-destructive/30 bg-destructive/5">
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <p className="text-sm text-destructive">
                      {(siteIntelligenceQuery.error as Error).message || 'Failed to load site intelligence.'}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void siteIntelligenceQuery.refetch()}
                    >
                      Retry
                    </Button>
                  </CardContent>
                </Card>
              )}

              {siteIntelligenceQuery.isLoading && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-sm text-foreground-muted">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading nearby planning intelligence…
                    </div>
                  </CardContent>
                </Card>
              )}

              {!siteIntelligenceQuery.isLoading && !siteIntelligenceQuery.error && (
                <>
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardContent className="space-y-1 p-4">
                        <p className="text-xs text-foreground-muted">Nearby applications</p>
                        <p className="text-xl font-semibold text-foreground">
                          {siteIntelligenceQuery.data?.totalApplications ?? nearbyApplications.length}
                        </p>
                        <p className="text-xs text-foreground-subtle">within {formatMeters(analysisRadiusMeters)}</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="space-y-1 p-4">
                        <p className="text-xs text-foreground-muted">Decision pattern</p>
                        <p className="text-xl font-semibold text-foreground">
                          {decisionStats.decided > 0
                            ? `${decisionStats.grantRate}% grant rate`
                            : 'No decided apps'}
                        </p>
                        <p className="text-xs text-foreground-subtle">
                          {decisionStats.granted} granted · {decisionStats.refused} refused
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="space-y-1 p-4">
                        <p className="text-xs text-foreground-muted">Commencements (BCMS)</p>
                        <p className="text-xl font-semibold text-foreground">{commencedCount}</p>
                        <p className="text-xs text-foreground-subtle">{nearbyBcms.length} notices found</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="space-y-1 p-4">
                        <p className="text-xs text-foreground-muted">Average nearby sale</p>
                        <p className="text-xl font-semibold text-foreground">
                          {averageSalePrice ? formatEuro(averageSalePrice) : 'No sales'}
                        </p>
                        <p className="text-xs text-foreground-subtle">{nearbySales.length} sales in radius</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-2">
                        <p className="text-sm font-semibold text-foreground">Nearby Applications</p>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {nearbyApplications.length === 0 ? (
                          <p className="text-sm text-foreground-muted">No applications found in the selected radius.</p>
                        ) : (
                          nearbyApplications.slice(0, 8).map((application) => (
                            <div key={application.applicationId} className="rounded-md border border-border px-3 py-2">
                              <div className="flex items-start justify-between gap-2">
                                <button
                                  onClick={() => router.push(`/applications/${application.applicationId}`)}
                                  className="text-left text-sm font-semibold text-foreground hover:text-brand-500"
                                >
                                  {application.applicationNumber}
                                </button>
                                <div className="flex shrink-0 items-center gap-2">
                                  <StatusBadge
                                    displayStatus={application.displayStatus}
                                    statusCategory={application.statusCategory}
                                  />
                                  <span className="text-[11px] text-foreground-subtle">
                                    {formatDistance(application.distanceKm) || '—'}
                                  </span>
                                </div>
                              </div>
                              <p className="mt-1 text-xs text-foreground-muted">
                                {formatAddress(application.formattedAddress ?? application.developmentAddress, 90)}
                              </p>
                              <p className="mt-1 text-[11px] text-foreground-subtle">
                                Received {formatDate(application.receivedDate)}
                              </p>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <p className="text-sm font-semibold text-foreground">Zoning Snapshot</p>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {siteIntelligenceQuery.data?.zoning ? (
                          <>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-brand-500/10 text-brand-500">
                                {siteIntelligenceQuery.data.zoning.zoneGzt || 'Zone'}
                              </Badge>
                              <span className="text-xs text-foreground-muted">
                                {siteIntelligenceQuery.data.zoning.laName}
                              </span>
                            </div>
                            <p className="text-sm text-foreground">
                              {siteIntelligenceQuery.data.zoning.gztDesc || siteIntelligenceQuery.data.zoning.zoneDesc || 'No zoning description available.'}
                            </p>
                            <p className="text-xs text-foreground-subtle">
                              Plan: {siteIntelligenceQuery.data.zoning.planName || 'Not available'}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-foreground-muted">No zoning polygon found at this location.</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <p className="text-sm font-semibold text-foreground">Nearby Commencements</p>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {nearbyBcms.length === 0 ? (
                          <p className="text-sm text-foreground-muted">No commencement notices found in this radius.</p>
                        ) : (
                          nearbyBcms.slice(0, 6).map((notice) => (
                            <div key={notice.id} className="rounded-md border border-border px-3 py-2">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-medium text-foreground line-clamp-1">
                                  {notice.projectAddress || 'Address unavailable'}
                                </p>
                                <span className="text-[11px] text-foreground-subtle">
                                  {notice.distanceMeters != null ? formatMeters(notice.distanceMeters) : '—'}
                                </span>
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
                                <Badge variant="outline" className="text-[10px]">
                                  {notice.status || 'Status unknown'}
                                </Badge>
                                <span>{notice.localAuthority || 'Authority unknown'}</span>
                              </div>
                              <p className="mt-1 text-[11px] text-foreground-subtle">
                                Commencement date: {formatDate(notice.commencementDate)}
                              </p>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <p className="text-sm font-semibold text-foreground">Nearby Property Sales</p>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {nearbySales.length === 0 ? (
                          <p className="text-sm text-foreground-muted">No property sales found in this radius.</p>
                        ) : (
                          nearbySales.slice(0, 6).map((sale) => (
                            <div key={sale.id} className="rounded-md border border-border px-3 py-2">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium text-foreground line-clamp-1">{sale.address}</p>
                                <span className="text-sm font-semibold text-foreground">{formatEuro(Number(sale.price))}</span>
                              </div>
                              <div className="mt-1 flex items-center justify-between text-[11px] text-foreground-subtle">
                                <span>Sold {formatDate(sale.saleDate)}</span>
                                <span>{sale.distanceMeters != null ? formatMeters(sale.distanceMeters) : '—'}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="apps">
          <div className="space-y-4">
            {addableFavorites.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <p className="text-sm font-semibold text-foreground">Add from Saved Applications</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {addableFavorites.slice(0, 8).map((application) => (
                    <div
                      key={application.applicationId}
                      className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {application.applicationNumber}
                        </p>
                        <p className="text-xs text-foreground-muted">
                          {formatAddress(application.formattedAddress ?? application.developmentAddress, 80)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => addApplicationToProject(project.id, application.applicationId)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {project.applicationIds.length === 0 ? (
              <EmptyState
                icon={ListChecks}
                title="No monitored applications yet"
                description="Add applications from your saved list or from application detail pages."
              />
            ) : (
              <div className="space-y-3">
                {monitoredApplications.map((application) => (
                  <Card key={application.applicationId}>
                    <CardContent className="flex items-center justify-between gap-3 p-4">
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          {application.applicationNumber}
                        </p>
                        <p className="text-xs text-foreground-muted">
                          {formatAddress(application.formattedAddress ?? application.developmentAddress, 90)}
                        </p>
                        <div className="inline-flex">
                          <StatusBadge
                            displayStatus={application.displayStatus}
                            statusCategory={application.statusCategory}
                          />
                        </div>
                        <p className="text-[11px] text-foreground-subtle">
                          Received {formatDate(application.receivedDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/applications/${application.applicationId}`)}
                        >
                          Open
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeApplicationFromProject(project.id, application.applicationId)}
                        >
                          Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader className="pb-2">
              <p className="text-sm font-semibold text-foreground">Project Alert Monitoring</p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-foreground-muted">
              <p>
                Create a radius alert prefilled from this project site, then monitor matches in your inbox.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="gap-1.5 bg-brand-500 hover:bg-brand-600"
                  onClick={() => router.push(projectAlertHref)}
                >
                  <Bell className="h-3.5 w-3.5" />
                  Create radius alert for this site
                </Button>
                <Link href="/alerts">
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Building2 className="h-3.5 w-3.5" />
                    Manage all alerts
                  </Button>
                </Link>
                <Link href="/alerts/inbox">
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Open inbox
                  </Button>
                </Link>
              </div>
              {hasCoordinates ? (
                <p className="text-xs text-foreground-subtle">
                  Scoped to {project.address} with a default {formatMeters(Math.min(analysisRadiusMeters, 1000))} radius.
                </p>
              ) : (
                <p className="text-xs text-foreground-subtle">
                  Tip: locate the site first so the alert wizard opens with verified coordinates.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <ResearchAssistant
            title="Project AI Research Assistant"
            description="Ask context-aware questions grounded in nearby applications, commencements, and property sales for this project site."
            contextPrefix={projectAssistantContext}
            suggestions={projectAssistantSuggestions}
            maxResults={100}
          />
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader className="pb-2">
              <p className="text-sm font-semibold text-foreground">Project Notes</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                className="min-h-[220px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Capture planning strategy, risks, and key observations for this project..."
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-foreground-muted">
                  Notes are stored locally in this browser for now.
                </p>
                <Button size="sm" onClick={() => updateNotes(project.id, noteDraft)}>
                  Save notes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
