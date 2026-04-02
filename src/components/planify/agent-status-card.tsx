'use client';

import React from 'react';
import { Search, FileText, RefreshCw, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AgentStatus, ResearchOutput, GeneratedDocument } from '@/lib/queries/planify';

// ─── Status Badge for Agents ─────────────────────────────────────────────────

const statusBadgeConfig: Record<AgentStatus, { label: string; className: string }> = {
  idle: { label: 'Not started', className: 'bg-neutral-100 text-neutral-500' },
  queued: { label: 'Queued', className: 'bg-neutral-100 text-neutral-500' },
  running: { label: 'Running', className: 'bg-brand-50 text-brand-700' },
  complete: { label: 'Complete', className: 'bg-emerald-50 text-emerald-700' },
  failed: { label: 'Failed', className: 'bg-red-50 text-red-700' },
};

function AgentBadge({ status }: { status: AgentStatus }) {
  const config = statusBadgeConfig[status];
  return <Badge className={config.className}>{config.label}</Badge>;
}

// ─── Left Border Color Mapping ───────────────────────────────────────────────

const borderColorMap: Record<AgentStatus, string> = {
  idle: 'border-l-neutral-300',
  queued: 'border-l-neutral-300',
  running: 'border-l-brand-500',
  complete: 'border-l-emerald-500',
  failed: 'border-l-red-500',
};

// ─── Elapsed Time Helper ─────────────────────────────────────────────────────

function ElapsedTime({ startedAt }: { startedAt?: string }) {
  const [elapsed, setElapsed] = React.useState('');

  React.useEffect(() => {
    if (!startedAt) return;

    function update() {
      const start = new Date(startedAt!).getTime();
      const now = Date.now();
      const seconds = Math.floor((now - start) / 1000);
      if (seconds < 60) {
        setElapsed(`${seconds}s`);
      } else {
        const minutes = Math.floor(seconds / 60);
        const remaining = seconds % 60;
        setElapsed(`${minutes}m ${remaining}s`);
      }
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  if (!elapsed) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-foreground-subtle">
      <Clock className="h-3 w-3" />
      {elapsed}
    </span>
  );
}

// ─── Research Agent Complete Content ─────────────────────────────────────────

function ResearchCompleteContent({ output }: { output: ResearchOutput }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {output.requirements && (
          <div>
            <span className="text-foreground-muted">Requirements:</span>{' '}
            <span className="font-medium text-foreground">{output.requirements.length} items</span>
          </div>
        )}
        {output.applicationFee != null && (
          <div>
            <span className="text-foreground-muted">Application fee:</span>{' '}
            <span className="font-medium text-foreground">
              {new Intl.NumberFormat('en-IE', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              }).format(output.applicationFee)}
            </span>
          </div>
        )}
        {output.estimatedTimeline && (
          <div>
            <span className="text-foreground-muted">Estimated timeline:</span>{' '}
            <span className="font-medium text-foreground">{output.estimatedTimeline}</span>
          </div>
        )}
      </div>

      {output.keyPolicies && output.keyPolicies.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-foreground-muted">Key Policies</p>
          <div className="space-y-1">
            {output.keyPolicies.map((policy, index) => (
              <div key={index} className="text-sm text-foreground">
                <span className="font-medium">{policy.name}</span>
                <span className="ml-1.5 text-xs text-foreground-subtle">({policy.reference})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {output.councilNotes && (
        <p className="text-sm text-foreground-muted">{output.councilNotes}</p>
      )}
    </div>
  );
}

// ─── Document Agent Complete Content ─────────────────────────────────────────

function DocumentCompleteContent({ documents }: { documents: GeneratedDocument[] }) {
  const completedCount = documents.filter((d) => d.status === 'complete').length;
  return (
    <div className="text-sm text-foreground">
      <span className="font-medium">{completedCount}</span>
      <span className="text-foreground-muted"> of {documents.length} documents generated</span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface AgentStatusCardProps {
  agentName: string;
  agentType: 'research' | 'document';
  status: AgentStatus;
  startedAt?: string;
  errorMessage?: string;
  researchOutput?: ResearchOutput;
  documents?: GeneratedDocument[];
  progress?: number;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function AgentStatusCard({
  agentName,
  agentType,
  status,
  startedAt,
  errorMessage,
  researchOutput,
  documents,
  progress,
  onRetry,
  isRetrying,
}: AgentStatusCardProps) {
  const Icon = agentType === 'research' ? Search : FileText;
  const isRunning = status === 'running';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0.8 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Card
          className={cn(
            'border-l-[3px]',
            borderColorMap[status],
            isRunning && 'animate-pulse [animation-duration:3s]',
          )}
        >
          <CardContent className="space-y-3 p-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Icon className="h-4 w-4 text-foreground-muted" />
                <span className="text-lg font-semibold text-foreground">{agentName}</span>
                <AgentBadge status={status} />
              </div>
              {isRunning && <ElapsedTime startedAt={startedAt} />}
            </div>

            {/* Body: varies by status */}
            {status === 'idle' && (
              <p className="text-sm text-foreground-muted">
                {agentType === 'research'
                  ? 'Research has not started yet.'
                  : 'Waiting for research to complete before generating documents.'}
              </p>
            )}

            {status === 'queued' && (
              <p className="text-sm text-foreground-muted">
                {agentType === 'research'
                  ? 'Queued. Research will begin shortly...'
                  : 'Waiting for research to complete...'}
              </p>
            )}

            {status === 'running' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-foreground-muted">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {agentType === 'research'
                    ? 'Researching council requirements and planning policies...'
                    : 'Generating planning documents...'}
                </div>
                {agentType === 'document' && progress != null && progress > 0 && (
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all duration-500"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {status === 'complete' && agentType === 'research' && researchOutput && (
              <ResearchCompleteContent output={researchOutput} />
            )}

            {status === 'complete' && agentType === 'document' && documents && (
              <DocumentCompleteContent documents={documents} />
            )}

            {status === 'failed' && (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <XCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage || 'An unexpected error occurred.'}</span>
                </div>
                {onRetry && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 gap-1.5"
                    onClick={onRetry}
                    disabled={isRetrying}
                  >
                    {isRetrying ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                    Retry
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
