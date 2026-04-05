'use client';

import React, { useRef, useState } from 'react';
import {
  MapPin,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight,
  Zap,
  BarChart3,
  FileText,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { postSnapshot } from '@/lib/api/snapshot';
import type { SnapshotResult, SnapshotRateLimitError, SnapshotValidationError } from '@/lib/types/snapshot';
import { PLANNING_INTENTIONS, planningIntentionApiValue } from '@/lib/constants/planning-intentions';

type WidgetState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'result'; data: SnapshotResult }
  | { kind: 'rate_limited'; data: SnapshotRateLimitError }
  | { kind: 'validation_error'; data: SnapshotValidationError }
  | { kind: 'error'; message: string };

const CONFIDENCE_STYLES: Record<string, string> = {
  high: 'bg-green-50 text-green-700 border-green-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-red-50 text-red-700 border-red-200',
};

const CONFIDENCE_LABELS: Record<string, string> = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
};

/** Maps UI label → API `development_type` slug (must stay aligned with Qdrant `development_types` payloads). */
function developmentTypeSlugFromLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_');
}

interface SnapshotWidgetProps {
  /** When true, renders in a compact card frame suitable for embedding */
  embedded?: boolean;
  className?: string;
}

export function SnapshotWidget({ embedded = false, className }: SnapshotWidgetProps) {
  const [address, setAddress] = useState('');
  const [developmentType, setDevelopmentType] = useState('');
  const [state, setState] = useState<WidgetState>({ kind: 'idle' });
  const submitInFlight = useRef(false);

  const canSubmit = address.trim().length > 0 && developmentType.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitInFlight.current) return;

    submitInFlight.current = true;
    setState({ kind: 'loading' });
    try {
      const result = await postSnapshot({ address: address.trim(), development_type: developmentType });
      if (result.kind === 'result') {
        setState({ kind: 'result', data: result.data });
      } else if (result.kind === 'rate_limited') {
        setState({ kind: 'rate_limited', data: result.data });
      } else if (result.kind === 'validation_error') {
        setState({ kind: 'validation_error', data: result.data });
      } else {
        setState({ kind: 'error', message: result.message });
      }
    } finally {
      submitInFlight.current = false;
    }
  }

  function handleReset() {
    submitInFlight.current = false;
    setState({ kind: 'idle' });
    setAddress('');
    setDevelopmentType('');
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-background shadow-sm',
        embedded ? 'max-w-lg' : 'w-full max-w-2xl',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/10">
          <MapPin className="h-4 w-4 text-brand-500" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Feasibility Snapshot</h2>
          <p className="text-xs text-foreground-muted">Instant AI planning feasibility check</p>
        </div>
      </div>

      <div className="p-5">
        {/* ── IDLE / FORM ── */}
        {state.kind === 'idle' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground-muted" htmlFor="sw-address">
                Property address
              </label>
              <Input
                id="sw-address"
                placeholder="e.g. 14 Main Street, Swords, Co. Dublin"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground-muted" htmlFor="sw-dev-type">
                Development type
              </label>
              <select
                id="sw-dev-type"
                value={developmentType}
                onChange={(e) => setDevelopmentType(e.target.value)}
                className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="" disabled>
                  Select development type…
                </option>
                {PLANNING_INTENTIONS.map((cat) => (
                  <optgroup key={cat.category} label={cat.category}>
                    {cat.subCategories.map((sub) => {
                      const value = planningIntentionApiValue(cat.category, sub);
                      return (
                        <option key={value} value={value}>
                          {sub}
                        </option>
                      );
                    })}
                  </optgroup>
                ))}
              </select>
            </div>

            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full gap-2 bg-brand-500 hover:bg-brand-600"
            >
              Check feasibility
              <ArrowRight className="h-4 w-4" />
            </Button>

            <p className="text-center text-xs text-foreground-subtle">
              Ireland only · 3 free snapshots per month
            </p>
          </form>
        )}

        {/* ── LOADING ── */}
        {state.kind === 'loading' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
            <div className="space-y-1 text-center">
              <p className="text-sm font-medium text-foreground">Analysing your address…</p>
              <p className="text-xs text-foreground-muted">
                Checking planning policies · typically under 8 seconds
              </p>
            </div>
          </div>
        )}

        {/* ── RESULT ── */}
        {state.kind === 'result' && (
          <div className="space-y-4">
            {/* Verdict */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  <span className="text-xs font-medium text-foreground-muted">Verdict</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge
                    className={cn(
                      'border text-xs',
                      CONFIDENCE_STYLES[state.data.confidence] ?? CONFIDENCE_STYLES.medium,
                    )}
                  >
                    {CONFIDENCE_LABELS[state.data.confidence] ?? state.data.confidence}
                  </Badge>
                  {/* Rate limit remaining badge */}
                  <Badge
                    className="border border-brand-200 bg-brand-50 text-xs text-brand-600"
                    title="Free snapshots remaining this month"
                  >
                    {state.data.rate_limit.remaining} left
                  </Badge>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-foreground">{state.data.verdict}</p>
              <p className="text-xs text-foreground-muted">{state.data.council_display_name}</p>
            </div>

            {/* Approval rate */}
            {state.data.approval_rate !== null && (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-background-subtle px-4 py-3">
                <BarChart3 className="h-4 w-4 shrink-0 text-brand-500" />
                <div>
                  <p className="text-xs text-foreground-muted">Historical approval rate</p>
                  <p className="text-sm font-semibold text-foreground">
                    {Math.round(state.data.approval_rate * 100)}%
                    <span className="ml-1 text-xs font-normal text-foreground-muted">
                      ({state.data.sample_size} similar applications)
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* Policies */}
            {state.data.policies.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground-muted">
                  <FileText className="h-3.5 w-3.5" />
                  Relevant planning policies
                </div>
                <ul className="space-y-2">
                  {state.data.policies.map((policy, policyIndex) => (
                    <li
                      key={`${policy.reference}-${policyIndex}-${policy.title.slice(0, 24)}`}
                      className="rounded-lg border border-border bg-background-subtle px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-foreground">
                          {policy.reference} — {policy.title}
                        </span>
                        <span className="shrink-0 text-xs text-foreground-subtle">
                          {Math.round(policy.relevance_score * 100)}% match
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-foreground-muted line-clamp-2">
                        {policy.excerpt}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-border pt-3">
              <p className="text-xs text-foreground-subtle">
                Resets {new Date(state.data.rate_limit.reset_at).toLocaleDateString('en-IE', { month: 'long', year: 'numeric' })}
              </p>
              <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 text-xs">
                New check
              </Button>
            </div>
          </div>
        )}

        {/* ── RATE LIMITED (429) ── */}
        {state.kind === 'rate_limited' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-800">{state.data.message}</p>
                <p className="mt-0.5 text-xs text-amber-700">
                  Resets{' '}
                  {new Date(state.data.rate_limit.reset_at).toLocaleDateString('en-IE', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Upsell CTA */}
            <div className="rounded-xl border border-brand-200 bg-brand-50 px-5 py-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/10">
                  <Zap className="h-3.5 w-3.5 text-brand-500" />
                </div>
                <p className="text-sm font-semibold text-brand-900">
                  {state.data.upsell.headline}
                </p>
              </div>
              <Button
                asChild
                className="w-full gap-2 bg-brand-500 hover:bg-brand-600"
              >
                <a href={state.data.upsell.cta_url}>
                  {state.data.upsell.cta_label}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        )}

        {/* ── VALIDATION ERROR (422) ── */}
        {state.kind === 'validation_error' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-800">{state.data.message}</p>
                {state.data.supported_councils && (
                  <p className="mt-1 text-xs text-red-700">
                    Supported councils:{' '}
                    {state.data.supported_councils
                      .map((c) => c.charAt(0).toUpperCase() + c.slice(1))
                      .join(', ')}
                  </p>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset} className="w-full">
              Try a different address
            </Button>
          </div>
        )}

        {/* ── GENERIC ERROR ── */}
        {state.kind === 'error' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <p className="text-sm text-red-800">{state.message}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset} className="w-full">
              Try again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
