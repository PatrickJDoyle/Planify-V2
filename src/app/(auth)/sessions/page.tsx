'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Loader2,
  FlaskConical,
  MapPin,
  Calendar,
  ChevronRight,
  X,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { cn } from '@/lib/utils';
import { useSessions, useCreateSession } from '@/lib/queries/sessions';
import type { ResearchSession, SessionStatus } from '@/lib/types/session';
import { PLANNING_INTENTIONS } from '@/lib/constants/planning-intentions';

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<SessionStatus, { label: string; className: string }> = {
  created: { label: 'Created', className: 'bg-neutral-100 text-neutral-500' },
  intake_processing: { label: 'Processing', className: 'bg-brand-50 text-brand-700' },
  research_running: { label: 'Researching', className: 'bg-brand-50 text-brand-700' },
  research_complete: { label: 'Complete', className: 'bg-emerald-50 text-emerald-700' },
  failed: { label: 'Failed', className: 'bg-red-50 text-red-700' },
};

function SessionStatusBadge({ status }: { status: SessionStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.created;
  const isRunning = status === 'intake_processing' || status === 'research_running';
  return (
    <Badge className={cn('gap-1', config.className)}>
      {isRunning && <Loader2 className="h-3 w-3 animate-spin" />}
      {config.label}
    </Badge>
  );
}

// ─── Session Row ──────────────────────────────────────────────────────────────

function SessionRow({ session }: { session: ResearchSession }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(`/sessions/${session.id}`)}
      className="flex w-full items-center gap-4 rounded-lg border border-border bg-surface p-4 text-left transition-colors hover:bg-background-subtle"
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2.5">
          <p className="truncate text-sm font-semibold text-foreground">
            {session.address}
          </p>
          <SessionStatusBadge status={session.status} />
          {session.is_partial && (
            <Badge className="border border-amber-200 bg-amber-50 text-xs text-amber-700">
              Partial
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground-muted">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {session.council_id}
          </span>
          <span>{session.development_type.replace(/_/g, ' ')}</span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-foreground-subtle" />
    </button>
  );
}

// ─── New Session Form ─────────────────────────────────────────────────────────

const createSessionSchema = z.object({
  address: z.string().min(5, 'Please enter a full address'),
  development_type: z.string().min(1, 'Please select a development type'),
  description: z.string().optional(),
});

type CreateSessionForm = z.infer<typeof createSessionSchema>;

function NewSessionForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const createSession = useCreateSession();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateSessionForm>({
    resolver: zodResolver(createSessionSchema),
  });

  const onSubmit = async (data: CreateSessionForm) => {
    const session = await createSession.mutateAsync({
      address: data.address.trim(),
      development_type: data.development_type,
      description: data.description?.trim() || undefined,
    });
    router.push(`/sessions/${session.id}`);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <p className="text-sm font-semibold text-foreground">New Research Session</p>
        <button
          onClick={onClose}
          className="rounded p-1 text-foreground-subtle hover:bg-background-subtle hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Address */}
          <div>
            <label htmlFor="ns-address" className="mb-1.5 block text-sm font-medium text-foreground">
              Property address <span className="text-red-500">*</span>
            </label>
            <Input
              id="ns-address"
              placeholder="e.g. 14 Main Street, Swords, Co. Dublin"
              {...register('address')}
            />
            {errors.address && (
              <p className="mt-1 text-xs text-red-600">{errors.address.message}</p>
            )}
          </div>

          {/* Development Type */}
          <div>
            <label htmlFor="ns-dev-type" className="mb-1.5 block text-sm font-medium text-foreground">
              Development type <span className="text-red-500">*</span>
            </label>
            <select
              id="ns-dev-type"
              className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              {...register('development_type')}
            >
              <option value="">Select development type…</option>
              {PLANNING_INTENTIONS.map((cat) => (
                <optgroup key={cat.category} label={cat.category}>
                  {cat.subCategories.map((sub) => {
                    const value = sub
                      .toLowerCase()
                      .replace(/[^a-z0-9\s]/g, '')
                      .trim()
                      .replace(/\s+/g, '_');
                    return (
                      <option key={value} value={value}>
                        {sub}
                      </option>
                    );
                  })}
                </optgroup>
              ))}
            </select>
            {errors.development_type && (
              <p className="mt-1 text-xs text-red-600">{errors.development_type.message}</p>
            )}
          </div>

          {/* Description (optional) */}
          <div>
            <label htmlFor="ns-description" className="mb-1.5 block text-sm font-medium text-foreground">
              Description{' '}
              <span className="font-normal text-foreground-subtle">(optional)</span>
            </label>
            <textarea
              id="ns-description"
              rows={3}
              placeholder="Briefly describe the proposed works…"
              className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-foreground-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
              {...register('description')}
            />
          </div>

          {createSession.error && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {(createSession.error as Error).message || 'Failed to start session. Please try again.'}
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <Button
              type="submit"
              className="gap-1.5 bg-brand-500 hover:bg-brand-600"
              disabled={createSession.isPending}
            >
              {createSession.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ArrowRight className="h-3.5 w-3.5" />
              )}
              Start Research
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SessionsPage() {
  const { data: sessions, isLoading, error } = useSessions();
  const [showForm, setShowForm] = useState(false);

  const sorted = sessions
    ? [...sessions].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
    : [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Research Sessions</h1>
          <p className="mt-0.5 text-sm text-foreground-muted">
            Deep-dive planning research with regulations, precedent, and site analysis
          </p>
        </div>
        {!showForm && (
          <Button
            size="sm"
            className="gap-1.5 bg-brand-500 hover:bg-brand-600"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            New Session
          </Button>
        )}
      </div>

      {/* Inline Form */}
      {showForm && <NewSessionForm onClose={() => setShowForm(false)} />}

      {/* Session List */}
      {isLoading ? (
        <Card>
          <CardContent className="flex items-center gap-2 p-6 text-sm text-foreground-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading sessions…
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-6 text-sm text-destructive">
            Failed to load sessions. Please try again.
          </CardContent>
        </Card>
      ) : sorted.length === 0 && !showForm ? (
        <EmptyState
          icon={FlaskConical}
          title="No research sessions yet"
          description="Start a session to get deep planning research — regulations, precedent stats, web sources, and site analysis."
        >
          <Button
            size="sm"
            className="mt-4 gap-1.5 bg-brand-500 hover:bg-brand-600"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Start your first session
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {sorted.map((session) => (
            <SessionRow key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}
