'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Building2,
  FileText,
  Loader2,
  Download,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';
import { AgentStatusCard } from '@/components/planify/agent-status-card';
import { ApplicationPackage } from '@/components/planify/application-package';
import {
  useProject,
  useProjectStatus,
  useRetryResearch,
  useGenerateDocuments,
  type ProjectStatus,
} from '@/lib/queries/planify';

// ─── Status Badge (same as projects list) ────────────────────────────────────

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

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const projectId = params?.id ?? '';

  const {
    data: project,
    isLoading: projectLoading,
    error: projectError,
  } = useProject(projectId);

  const {
    data: statusData,
    isLoading: statusLoading,
  } = useProjectStatus(projectId);

  const retryResearch = useRetryResearch(projectId);
  const generateDocuments = useGenerateDocuments(projectId);

  // Derive agent statuses
  const researchStatus = statusData?.researchAgent?.status ?? 'idle';
  const documentStatus = statusData?.documentAgent?.status ?? 'idle';
  const researchOutput = statusData?.researchAgent?.output;
  const documents = statusData?.documentAgent?.documents ?? [];
  const requirements = researchOutput?.requirements ?? [];

  // Check if research is done (show package checklist)
  const showPackage = useMemo(() => {
    return (
      researchStatus === 'complete' &&
      requirements.length > 0
    );
  }, [researchStatus, requirements.length]);

  // Loading state
  if (projectLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <Card>
          <CardContent className="flex items-center gap-2 p-6 text-sm text-foreground-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading project...
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error / not found
  if (projectError || !project) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <EmptyState
          icon={FileText}
          title="Project not found"
          description="This project does not exist or could not be loaded."
        >
          <Button
            size="sm"
            className="mt-4"
            onClick={() => router.push('/projects')}
          >
            Back to projects
          </Button>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Breadcrumb */}
      <div className="space-y-1">
        <button
          onClick={() => router.push('/projects')}
          className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Projects
        </button>
      </div>

      {/* Project Header */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Card>
          <CardContent className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-semibold text-foreground">
                    {project.name || project.address}
                  </h1>
                  <ProjectStatusBadge status={project.status} />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {project.address}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" />
                    {project.councilId}
                  </span>
                  <span>{project.developmentType}</span>
                </div>
                {project.description && (
                  <p className="text-sm text-foreground-muted line-clamp-2">
                    {project.description}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Agent Status Cards — Sequential, full-width */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wide">
          Agent Status
        </h2>

        {/* Research Agent */}
        <AgentStatusCard
          agentName="Research Agent"
          agentType="research"
          status={researchStatus}
          startedAt={statusData?.researchAgent?.startedAt}
          errorMessage={statusData?.researchAgent?.error}
          researchOutput={researchOutput}
          onRetry={() => retryResearch.mutate()}
          isRetrying={retryResearch.isPending}
        />

        {/* Document Agent */}
        <AgentStatusCard
          agentName="Document Agent"
          agentType="document"
          status={documentStatus}
          startedAt={statusData?.documentAgent?.startedAt}
          errorMessage={statusData?.documentAgent?.error}
          documents={documents}
          progress={statusData?.documentAgent?.progress}
          onRetry={
            documentStatus === 'failed'
              ? () => generateDocuments.mutate()
              : undefined
          }
          isRetrying={generateDocuments.isPending}
        />
      </div>

      {/* Application Package Checklist */}
      {showPackage && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="space-y-4"
        >
          <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wide">
            Application Package
          </h2>
          <ApplicationPackage
            requirements={requirements}
            documents={documents}
          />
        </motion.div>
      )}

      {/* Generate Documents CTA — when research is done but docs haven't started */}
      {researchStatus === 'complete' &&
        documentStatus === 'idle' &&
        requirements.length > 0 && (
          <Card>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Research complete
                </p>
                <p className="mt-0.5 text-xs text-foreground-muted">
                  {requirements.filter((r) => r.isGenerated).length} documents
                  can be generated automatically.
                </p>
              </div>
              <Button
                size="sm"
                className="gap-1.5 bg-brand-500 hover:bg-brand-600"
                onClick={() => generateDocuments.mutate()}
                disabled={generateDocuments.isPending}
              >
                {generateDocuments.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileText className="h-3.5 w-3.5" />
                )}
                Generate Documents
              </Button>
            </CardContent>
          </Card>
        )}

      {/* Status Loading skeleton */}
      {statusLoading && !statusData && (
        <Card>
          <CardContent className="flex items-center gap-2 p-6 text-sm text-foreground-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading agent status...
          </CardContent>
        </Card>
      )}
    </div>
  );
}
