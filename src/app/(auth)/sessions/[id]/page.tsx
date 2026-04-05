'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  BarChart3,
  Globe,
  MapPin,
  ExternalLink,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSession, useCancelSession } from '@/lib/queries/sessions';
import type {
  ResearchSession,
  SessionStatus,
  RegulationChunk,
  PrecedentStats,
  WebResearchResult,
  SiteAnalysis,
  SubAgentOutcome,
} from '@/lib/types/session';

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_LABELS: Record<SessionStatus, string> = {
  created: 'Created',
  intake_processing: 'Processing address…',
  research_running: 'Running research…',
  research_complete: 'Complete',
  failed: 'Failed',
};

const RUNNING_STATUSES = new Set<SessionStatus>([
  'created',
  'intake_processing',
  'research_running',
]);

// ─── Sub-agent outcome helpers ────────────────────────────────────────────────

function SubAgentWarning({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <Clock className="h-4 w-4 shrink-0 text-amber-600" />
      {label} timed out — results may be incomplete.
    </div>
  );
}

function SubAgentError({ label, error }: { label: string; error?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <XCircle className="h-4 w-4 shrink-0 text-red-600" />
      {label} failed{error ? `: ${error}` : '.'}
    </div>
  );
}

// ─── Regulations tab ──────────────────────────────────────────────────────────

function RegulationsTab({ outcome }: { outcome: SubAgentOutcome<RegulationChunk[]> }) {
  if (outcome.status === 'timeout') return <SubAgentWarning label="Regulation search" />;
  if (outcome.status === 'error') return <SubAgentError label="Regulation search" error={outcome.error} />;
  if (!outcome.data || outcome.data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-foreground-muted">
        No relevant regulations found.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {outcome.data.map((chunk) => (
        <div
          key={chunk.id}
          className="rounded-lg border border-border bg-background-subtle px-4 py-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {chunk.reference} — {chunk.title}
              </p>
              <p className="mt-0.5 text-xs text-foreground-muted">{chunk.council_id}</p>
            </div>
            <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
              {Math.round(chunk.relevance_score * 100)}% match
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground-muted line-clamp-3">
            {chunk.excerpt}
          </p>
          {chunk.source_url && (
            <a
              href={chunk.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
            >
              Source <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Precedent tab ────────────────────────────────────────────────────────────

function PrecedentTab({ outcome }: { outcome: SubAgentOutcome<PrecedentStats> }) {
  if (outcome.status === 'timeout') return <SubAgentWarning label="Precedent analysis" />;
  if (outcome.status === 'error') return <SubAgentError label="Precedent analysis" error={outcome.error} />;
  if (!outcome.data) return <p className="py-8 text-center text-sm text-foreground-muted">No precedent data available.</p>;

  const { approval_rate, sample_size, common_conditions, common_refusal_reasons } = outcome.data;

  return (
    <div className="space-y-4">
      {/* Approval rate */}
      <div className="flex items-center gap-4 rounded-lg border border-border bg-background-subtle px-5 py-4">
        <BarChart3 className="h-8 w-8 shrink-0 text-brand-500" />
        <div>
          <p className="text-xs text-foreground-muted">Historical approval rate</p>
          {approval_rate !== null ? (
            <p className="text-2xl font-bold text-foreground">
              {Math.round(approval_rate * 100)}%
              <span className="ml-2 text-sm font-normal text-foreground-muted">
                from {sample_size} similar applications
              </span>
            </p>
          ) : (
            <p className="text-sm text-foreground-muted">No data for this development type in this council area.</p>
          )}
        </div>
      </div>

      {/* Common conditions */}
      {common_conditions.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Common conditions</p>
          <ul className="space-y-1.5">
            {common_conditions.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground-muted">
                <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Common refusals */}
      {common_refusal_reasons.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Common refusal reasons</p>
          <ul className="space-y-1.5">
            {common_refusal_reasons.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground-muted">
                <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Web sources tab ──────────────────────────────────────────────────────────

function WebSourcesTab({ outcome }: { outcome: SubAgentOutcome<WebResearchResult> }) {
  if (outcome.status === 'timeout') return <SubAgentWarning label="Web research" />;
  if (outcome.status === 'error') return <SubAgentError label="Web research" error={outcome.error} />;
  if (!outcome.data) return <p className="py-8 text-center text-sm text-foreground-muted">No web sources found.</p>;

  const { sources, supplementary_context } = outcome.data;

  return (
    <div className="space-y-4">
      {supplementary_context && (
        <div className="rounded-lg border border-border bg-background-subtle px-4 py-3 text-sm leading-relaxed text-foreground-muted">
          {supplementary_context}
        </div>
      )}
      {sources.length > 0 && (
        <div className="space-y-3">
          {sources.map((src, i) => (
            <div key={i} className="rounded-lg border border-border bg-background-subtle px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">{src.title}</p>
                {src.published_at && (
                  <span className="shrink-0 text-xs text-foreground-subtle">
                    {format(new Date(src.published_at), 'dd MMM yyyy')}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm leading-relaxed text-foreground-muted line-clamp-2">
                {src.excerpt}
              </p>
              <a
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
              >
                View source <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Site analysis tab ────────────────────────────────────────────────────────

function SiteAnalysisTab({ outcome }: { outcome: SubAgentOutcome<SiteAnalysis> }) {
  if (outcome.status === 'timeout') return <SubAgentWarning label="Site analysis" />;
  if (outcome.status === 'error') return <SubAgentError label="Site analysis" error={outcome.error} />;
  if (!outcome.data) return <p className="py-8 text-center text-sm text-foreground-muted">No site data available.</p>;

  const { lat, lng, zoning_class, site_area_estimate, constraints } = outcome.data;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-background-subtle px-4 py-3">
          <p className="text-xs text-foreground-muted">Coordinates</p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background-subtle px-4 py-3">
          <p className="text-xs text-foreground-muted">Zoning class</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{zoning_class}</p>
        </div>
        {site_area_estimate != null && (
          <div className="rounded-lg border border-border bg-background-subtle px-4 py-3">
            <p className="text-xs text-foreground-muted">Site area estimate</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {site_area_estimate.toLocaleString()} m²
            </p>
          </div>
        )}
      </div>

      {constraints.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Site constraints</p>
          <ul className="space-y-1.5">
            {constraints.map((c, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-foreground-muted">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {constraints.length === 0 && (
        <p className="text-sm text-foreground-muted">No site constraints identified.</p>
      )}
    </div>
  );
}

// ─── Running state ────────────────────────────────────────────────────────────

function RunningView({ session }: { session: ResearchSession }) {
  const cancel = useCancelSession();

  const steps: { status: SessionStatus; label: string }[] = [
    { status: 'created', label: 'Session created' },
    { status: 'intake_processing', label: 'Processing address & zoning' },
    { status: 'research_running', label: 'Running research pipeline' },
    { status: 'research_complete', label: 'Research complete' },
  ];

  const currentIndex = steps.findIndex((s) => s.status === session.status);

  return (
    <div className="mx-auto max-w-md space-y-6 py-12 text-center">
      <div className="flex justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
          <Loader2 className="h-7 w-7 animate-spin text-brand-500" />
        </div>
      </div>
      <div>
        <p className="text-base font-semibold text-foreground">
          {STATUS_LABELS[session.status]}
        </p>
        <p className="mt-1 text-sm text-foreground-muted">
          This typically takes under 60 seconds. Results will appear automatically.
        </p>
      </div>

      {/* Progress steps */}
      <ol className="mx-auto max-w-xs space-y-2 text-left">
        {steps.map((step, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <li key={step.status} className="flex items-center gap-2.5">
              <div
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  done ? 'bg-emerald-500 text-white' : active ? 'bg-brand-500 text-white' : 'bg-background-muted text-foreground-subtle',
                )}
              >
                {done ? '✓' : i + 1}
              </div>
              <span
                className={cn(
                  'text-sm',
                  done ? 'text-foreground-muted' : active ? 'font-medium text-foreground' : 'text-foreground-subtle',
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>

      <Button
        variant="ghost"
        size="sm"
        className="text-xs text-foreground-subtle"
        disabled={cancel.isPending}
        onClick={() => cancel.mutate(session.id)}
      >
        {cancel.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
        Cancel session
      </Button>
    </div>
  );
}

// ─── Results view ─────────────────────────────────────────────────────────────

function ResultsView({ session }: { session: ResearchSession }) {
  const results = session.research_results;

  if (!results) {
    return (
      <p className="py-8 text-center text-sm text-foreground-muted">
        Results not yet available.
      </p>
    );
  }

  return (
    <Tabs defaultValue="regulations">
      <TabsList className="mb-4">
        <TabsTrigger value="regulations" className="gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          Regulations
        </TabsTrigger>
        <TabsTrigger value="precedent" className="gap-1.5">
          <BarChart3 className="h-3.5 w-3.5" />
          Precedent
        </TabsTrigger>
        <TabsTrigger value="web" className="gap-1.5">
          <Globe className="h-3.5 w-3.5" />
          Web Sources
        </TabsTrigger>
        <TabsTrigger value="site" className="gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          Site Analysis
        </TabsTrigger>
      </TabsList>

      <TabsContent value="regulations">
        <RegulationsTab outcome={results.regulations} />
      </TabsContent>
      <TabsContent value="precedent">
        <PrecedentTab outcome={results.precedent} />
      </TabsContent>
      <TabsContent value="web">
        <WebSourcesTab outcome={results.web} />
      </TabsContent>
      <TabsContent value="site">
        <SiteAnalysisTab outcome={results.site} />
      </TabsContent>
    </Tabs>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, isLoading, error } = useSession(params.id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <button
          onClick={() => router.push('/sessions')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Research Sessions
        </button>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-start gap-3 p-6">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">
              {error ? (error as Error).message : 'Session not found.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isRunning = RUNNING_STATUSES.has(session.status);
  const isFailed = session.status === 'failed';

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Breadcrumb */}
      <button
        onClick={() => router.push('/sessions')}
        className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Research Sessions
      </button>

      {/* Session header */}
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-xl font-semibold text-foreground">{session.address}</h1>
          {session.status === 'research_complete' ? (
            <Badge className="gap-1 bg-emerald-50 text-emerald-700">
              <CheckCircle className="h-3 w-3" />
              Complete
            </Badge>
          ) : isFailed ? (
            <Badge className="gap-1 bg-red-50 text-red-700">
              <XCircle className="h-3 w-3" />
              Failed
            </Badge>
          ) : (
            <Badge className="gap-1 bg-brand-50 text-brand-700">
              <Loader2 className="h-3 w-3 animate-spin" />
              {STATUS_LABELS[session.status]}
            </Badge>
          )}
          {session.is_partial && (
            <Badge className="border border-amber-200 bg-amber-50 text-amber-700">
              Partial results
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-foreground-muted">
          <span>{session.development_type.replace(/_/g, ' ')}</span>
          <span>{session.council_id}</span>
          <span>
            Started {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
          </span>
        </div>
        {session.description && (
          <p className="pt-1 text-sm text-foreground-muted">{session.description}</p>
        )}
      </div>

      {/* Partial results banner */}
      {session.is_partial && session.status === 'research_complete' && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            Some research agents timed out. Results below may be incomplete — tabs affected show a timeout notice.
          </p>
        </div>
      )}

      {/* Failed state */}
      {isFailed && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-start gap-3 p-5">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-medium text-destructive">Research pipeline failed</p>
              <p className="mt-0.5 text-xs text-destructive/80">
                All research agents timed out or encountered errors. Please start a new session.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main content */}
      {isRunning ? (
        <RunningView session={session} />
      ) : session.status === 'research_complete' ? (
        <Card>
          <CardHeader className="pb-0">
            <p className="text-sm font-semibold text-foreground">Research Results</p>
          </CardHeader>
          <CardContent className="pt-4">
            <ResultsView session={session} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
