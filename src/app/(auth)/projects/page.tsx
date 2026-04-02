'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  FolderOpen,
  Loader2,
  ChevronRight,
  Building2,
  MapPin,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProjects, type PlanifyProject, type ProjectStatus } from '@/lib/queries/planify';
import { formatDistanceToNow } from 'date-fns';

// ─── Status Badge ────────────────────────────────────────────────────────────

const statusConfig: Record<
  ProjectStatus,
  { label: string; className: string }
> = {
  draft: { label: 'Draft', className: 'bg-neutral-100 text-neutral-500' },
  researching: { label: 'Researching', className: 'bg-brand-50 text-brand-700' },
  research_complete: { label: 'Research Done', className: 'bg-brand-50 text-brand-700' },
  research_failed: { label: 'Research Failed', className: 'bg-red-50 text-red-700' },
  generating: { label: 'Generating', className: 'bg-amber-50 text-amber-700' },
  complete: { label: 'Complete', className: 'bg-emerald-50 text-emerald-700' },
  failed: { label: 'Failed', className: 'bg-red-50 text-red-700' },
};

function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const config = statusConfig[status] ?? statusConfig.draft;
  return <Badge className={config.className}>{config.label}</Badge>;
}

// ─── Project Row ─────────────────────────────────────────────────────────────

function ProjectRow({ project }: { project: PlanifyProject }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(`/projects/${project.id}`)}
      className="flex w-full items-center gap-4 rounded-lg border border-border bg-surface p-4 text-left transition-colors hover:bg-background-subtle"
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2.5">
          <p className="truncate text-sm font-semibold text-foreground">
            {project.name || project.siteAddress}
          </p>
          <ProjectStatusBadge status={project.status} />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground-muted">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {project.siteAddress}
          </span>
          <span className="inline-flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            {project.councilArea}
          </span>
          <span>{project.developmentType}</span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
          </span>
        </div>

        {project.statusSummary && (
          <p className="text-xs text-foreground-subtle">{project.statusSummary}</p>
        )}
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-foreground-subtle" />
    </button>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

const statusFilterOptions: { value: string; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'researching', label: 'Researching' },
  { value: 'generating', label: 'Generating' },
  { value: 'complete', label: 'Complete' },
  { value: 'failed', label: 'Failed' },
];

export default function ProjectsPage() {
  const router = useRouter();
  const { data: projects, isLoading, error } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    let filtered = [...projects];

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.siteAddress?.toLowerCase().includes(q) ||
          p.councilArea?.toLowerCase().includes(q) ||
          p.developmentType?.toLowerCase().includes(q),
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => {
        if (statusFilter === 'failed') return p.status === 'failed' || p.status === 'research_failed';
        if (statusFilter === 'researching') return p.status === 'researching' || p.status === 'research_complete';
        return p.status === statusFilter;
      });
    }

    // Sort by most recently updated
    filtered.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

    return filtered;
  }, [projects, searchQuery, statusFilter]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Projects</h1>
          <p className="mt-0.5 text-sm text-foreground-muted">
            Your planning application projects
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5 bg-brand-500 hover:bg-brand-600"
          onClick={() => router.push('/projects/new')}
        >
          <Plus className="h-3.5 w-3.5" />
          New Project
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-subtle" />
          <Input
            placeholder="Search by name, address, council..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            {statusFilterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <Card>
          <CardContent className="flex items-center gap-2 p-6 text-sm text-foreground-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading projects...
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-6 text-sm text-destructive">
            Failed to load projects. Please try again.
          </CardContent>
        </Card>
      ) : filteredProjects.length === 0 && !searchQuery && statusFilter === 'all' ? (
        <EmptyState
          icon={FolderOpen}
          title="No projects yet"
          description="Create your first planning application project to get started."
        >
          <Button
            size="sm"
            className="mt-4 gap-1.5 bg-brand-500 hover:bg-brand-600"
            onClick={() => router.push('/projects/new')}
          >
            <Plus className="h-3.5 w-3.5" />
            Create your first project
          </Button>
        </EmptyState>
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching projects"
          description="Try adjusting your search or filter to find projects."
        />
      ) : (
        <div className="space-y-2">
          {filteredProjects.map((project) => (
            <ProjectRow key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
