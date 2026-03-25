'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQueries } from '@tanstack/react-query';
import {
  ArrowLeft,
  MapPin,
  FileText,
  Bell,
  ListChecks,
  Trash2,
  Save,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { useProjectsStore } from '@/lib/stores/projects-store';
import { useFavorites } from '@/lib/queries/favorites';
import { applicationsApi } from '@/lib/api/applications';
import { queryKeys } from '@/lib/queries/keys';
import { formatAddress } from '@/lib/utils/formatting';
import { formatDate } from '@/lib/utils/dates';
import type { Application } from '@/lib/types/application';

export default function ProjectWorkspacePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const projectId = params?.id ?? '';

  const projects = useProjectsStore((state) => state.projects);
  const renameProject = useProjectsStore((state) => state.renameProject);
  const deleteProject = useProjectsStore((state) => state.deleteProject);
  const addApplicationToProject = useProjectsStore((state) => state.addApplicationToProject);
  const removeApplicationFromProject = useProjectsStore((state) => state.removeApplicationFromProject);
  const updateNotes = useProjectsStore((state) => state.updateNotes);

  const project = projects.find((entry) => entry.id === projectId);
  const [nameDraft, setNameDraft] = useState(project?.name ?? '');
  const [noteDraft, setNoteDraft] = useState(project?.notes ?? '');

  const { data: favorites } = useFavorites(1, 100);
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
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="site">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <p className="text-sm font-semibold text-foreground">Project Site</p>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-foreground-muted">
                <p>{project.address}</p>
                <p>
                  Coordinates:{' '}
                  {project.latitude != null && project.longitude != null
                    ? `${project.latitude.toFixed(5)}, ${project.longitude.toFixed(5)}`
                    : 'Not set yet'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <p className="text-sm font-semibold text-foreground">Quick Actions</p>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/reports/pre-planning">
                  <Button variant="outline" size="sm" className="w-full justify-start gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    Open Pre-Planning Reports
                  </Button>
                </Link>
                <Link href="/heatmap">
                  <Button variant="outline" size="sm" className="w-full justify-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    Open National Heatmap
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" size="sm" className="w-full justify-start gap-1.5">
                    <ListChecks className="h-3.5 w-3.5" />
                    Search Related Applications
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="apps">
          <div className="space-y-4">
            {addableFavorites.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <p className="text-sm font-semibold text-foreground">Add from Saved Applications</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {addableFavorites.slice(0, 6).map((application) => (
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
                Use your project address to create radius alerts and monitor new planning activity around this site.
              </p>
              <div className="flex gap-2">
                <Link href="/alerts">
                  <Button size="sm" className="gap-1.5 bg-brand-500 hover:bg-brand-600">
                    <Bell className="h-3.5 w-3.5" />
                    Manage Alerts
                  </Button>
                </Link>
                <Link href="/alerts/inbox">
                  <Button size="sm" variant="outline">
                    Open Inbox
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
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
