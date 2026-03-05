'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Building2,
  Globe,
  Bell,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useCreateAlert } from '@/lib/queries/alerts';
import { PLANNING_AUTHORITIES } from '@/lib/utils/constants';
import type { AlertScope, AlertType } from '@/lib/types/alerts';

interface AlertWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'type' | 'scope' | 'location' | 'confirm';

interface WizardState {
  alertType: AlertType | null;
  scope: AlertScope | null;
  planningAuthority: string;
  address: string;
  radius: number;
  latitude: number | null;
  longitude: number | null;
}

const ALERT_TYPES: { id: AlertType; label: string; description: string; icon: React.ElementType }[] = [
  {
    id: 'new_application',
    label: 'New applications',
    description: 'Get notified when new planning applications are submitted',
    icon: Bell,
  },
  {
    id: 'status_update',
    label: 'Status updates',
    description: 'Get notified when applications change status (granted, refused, etc.)',
    icon: Bell,
  },
];

const SCOPES: { id: AlertScope; label: string; description: string; icon: React.ElementType; enterprise?: boolean }[] = [
  {
    id: 'radius',
    label: 'Radius around address',
    description: 'Monitor applications within a distance of a specific address',
    icon: MapPin,
  },
  {
    id: 'authority',
    label: 'Planning Authority',
    description: 'Monitor all applications within a specific council area',
    icon: Building2,
  },
  {
    id: 'nationwide',
    label: 'Nationwide',
    description: 'Monitor all planning activity across Ireland',
    icon: Globe,
    enterprise: true,
  },
];

const RADIUS_OPTIONS = [250, 500, 1000, 2000, 5000];

function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {steps.map((label, idx) => (
        <React.Fragment key={label}>
          <div
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold',
              idx < current
                ? 'bg-brand-500 text-white'
                : idx === current
                  ? 'bg-brand-500/15 text-brand-500 ring-1 ring-brand-500'
                  : 'bg-background-muted text-foreground-subtle',
            )}
          >
            {idx < current ? <Check className="h-3 w-3" /> : idx + 1}
          </div>
          {idx < steps.length - 1 && (
            <div
              className={cn(
                'h-px flex-1 transition-colors',
                idx < current ? 'bg-brand-500' : 'bg-border',
              )}
              style={{ width: 24 }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export function AlertWizard({ open, onOpenChange }: AlertWizardProps) {
  const [step, setStep] = useState<Step>('type');
  const [state, setState] = useState<WizardState>({
    alertType: null,
    scope: null,
    planningAuthority: '',
    address: '',
    radius: 1000,
    latitude: null,
    longitude: null,
  });

  const createAlert = useCreateAlert();

  const STEPS: Step[] = ['type', 'scope', 'location', 'confirm'];
  const stepLabels = ['Type', 'Scope', 'Location', 'Confirm'];
  const currentIdx = STEPS.indexOf(step);

  const reset = () => {
    setStep('type');
    setState({
      alertType: null,
      scope: null,
      planningAuthority: '',
      address: '',
      radius: 1000,
      latitude: null,
      longitude: null,
    });
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleNext = () => {
    const nextIdx = currentIdx + 1;
    if (nextIdx < STEPS.length) setStep(STEPS[nextIdx]!);
  };

  const handleBack = () => {
    const prevIdx = currentIdx - 1;
    if (prevIdx >= 0) setStep(STEPS[prevIdx]!);
  };

  const canProceed = () => {
    if (step === 'type') return !!state.alertType;
    if (step === 'scope') return !!state.scope;
    if (step === 'location') {
      if (state.scope === 'authority') return !!state.planningAuthority;
      if (state.scope === 'radius') return !!state.address && state.radius > 0;
      if (state.scope === 'nationwide') return true;
    }
    return true;
  };

  const handleCreate = () => {
    createAlert.mutate(
      {
        alertType: state.alertType!,
        scope: state.scope!,
        planningAuthority: state.planningAuthority || undefined,
        address: state.address || undefined,
        radius: state.scope === 'radius' ? state.radius : undefined,
        latitude: state.latitude ?? undefined,
        longitude: state.longitude ?? undefined,
      },
      {
        onSuccess: () => {
          handleClose();
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="mb-3">
            <StepIndicator steps={stepLabels} current={currentIdx} />
          </div>
          <DialogTitle className="text-base">
            {step === 'type' && 'What would you like to be alerted about?'}
            {step === 'scope' && 'What area should this alert cover?'}
            {step === 'location' && 'Specify your location details'}
            {step === 'confirm' && 'Review & create alert'}
          </DialogTitle>
          <DialogDescription>
            {step === 'type' && 'Choose the type of planning activity you want to monitor.'}
            {step === 'scope' && 'Define the geographic scope of your alert.'}
            {step === 'location' && 'Enter the specific location or authority for this alert.'}
            {step === 'confirm' && 'Review your alert settings before creating.'}
          </DialogDescription>
        </DialogHeader>

        {/* Step: Type */}
        {step === 'type' && (
          <div className="space-y-2 py-1">
            {ALERT_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => setState((s) => ({ ...s, alertType: t.id }))}
                className={cn(
                  'flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors',
                  state.alertType === t.id
                    ? 'border-brand-500 bg-brand-500/5'
                    : 'border-border hover:border-brand-500/40 hover:bg-background-subtle',
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                    state.alertType === t.id ? 'bg-brand-500/15' : 'bg-background-muted',
                  )}
                >
                  <t.icon
                    className={cn(
                      'h-4 w-4',
                      state.alertType === t.id ? 'text-brand-500' : 'text-foreground-muted',
                    )}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t.label}</p>
                  <p className="mt-0.5 text-xs text-foreground-muted">{t.description}</p>
                </div>
                {state.alertType === t.id && (
                  <div className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Step: Scope */}
        {step === 'scope' && (
          <div className="space-y-2 py-1">
            {SCOPES.map((s) => (
              <button
                key={s.id}
                onClick={() => setState((prev) => ({ ...prev, scope: s.id }))}
                className={cn(
                  'flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors',
                  state.scope === s.id
                    ? 'border-brand-500 bg-brand-500/5'
                    : 'border-border hover:border-brand-500/40 hover:bg-background-subtle',
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                    state.scope === s.id ? 'bg-brand-500/15' : 'bg-background-muted',
                  )}
                >
                  <s.icon
                    className={cn(
                      'h-4 w-4',
                      state.scope === s.id ? 'text-brand-500' : 'text-foreground-muted',
                    )}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{s.label}</p>
                    {s.enterprise && (
                      <Badge className="bg-brand-500/10 text-[10px] text-brand-500">Enterprise</Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-foreground-muted">{s.description}</p>
                </div>
                {state.scope === s.id && (
                  <div className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Step: Location */}
        {step === 'location' && (
          <div className="space-y-4 py-1">
            {state.scope === 'authority' && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground-muted">
                  Planning Authority
                </label>
                <select
                  value={state.planningAuthority}
                  onChange={(e) => setState((s) => ({ ...s, planningAuthority: e.target.value }))}
                  className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Select an authority…</option>
                  {PLANNING_AUTHORITIES.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {state.scope === 'radius' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground-muted">
                    Address
                  </label>
                  <Input
                    value={state.address}
                    onChange={(e) => setState((s) => ({ ...s, address: e.target.value }))}
                    placeholder="e.g. 14 Fitzwilliam Square, Dublin 2"
                    className="h-9"
                  />
                  <p className="text-xs text-foreground-subtle">
                    Enter a street address — we&apos;ll geocode it automatically.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground-muted">
                    Radius: <span className="text-foreground">{(state.radius / 1000).toFixed(2)}km</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {RADIUS_OPTIONS.map((r) => (
                      <button
                        key={r}
                        onClick={() => setState((s) => ({ ...s, radius: r }))}
                        className={cn(
                          'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                          state.radius === r
                            ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                            : 'border-border text-foreground-muted hover:border-brand-500/40',
                        )}
                      >
                        {r < 1000 ? `${r}m` : `${r / 1000}km`}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {state.scope === 'nationwide' && (
              <div className="rounded-lg border border-border bg-background-subtle p-4">
                <p className="text-sm text-foreground">
                  This alert will monitor all planning applications submitted across Ireland.
                </p>
                <p className="mt-1.5 text-xs text-foreground-muted">
                  This is an Enterprise-tier feature with unlimited nationwide tracking.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step: Confirm */}
        {step === 'confirm' && (
          <div className="space-y-3 py-1">
            <div className="divide-y rounded-lg border border-border">
              <SummaryRow label="Alert type" value={state.alertType === 'new_application' ? 'New applications' : 'Status updates'} />
              <SummaryRow
                label="Scope"
                value={SCOPES.find((s) => s.id === state.scope)?.label ?? '—'}
              />
              {state.scope === 'authority' && (
                <SummaryRow
                  label="Authority"
                  value={
                    PLANNING_AUTHORITIES.find((a) => a.id === state.planningAuthority)?.name ??
                    state.planningAuthority
                  }
                />
              )}
              {state.scope === 'radius' && (
                <>
                  <SummaryRow label="Address" value={state.address} />
                  <SummaryRow
                    label="Radius"
                    value={state.radius < 1000 ? `${state.radius}m` : `${state.radius / 1000}km`}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={currentIdx === 0 ? handleClose : handleBack}
            className="gap-1.5 text-foreground-muted"
          >
            {currentIdx === 0 ? (
              <>
                <X className="h-3.5 w-3.5" />
                Cancel
              </>
            ) : (
              <>
                <ChevronLeft className="h-3.5 w-3.5" />
                Back
              </>
            )}
          </Button>

          {step !== 'confirm' ? (
            <Button
              size="sm"
              onClick={handleNext}
              disabled={!canProceed()}
              className="gap-1.5 bg-brand-500 hover:bg-brand-600"
            >
              Continue
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={createAlert.isPending}
              className="gap-1.5 bg-brand-500 hover:bg-brand-600"
            >
              <Bell className="h-3.5 w-3.5" />
              {createAlert.isPending ? 'Creating…' : 'Create Alert'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-xs text-foreground-muted">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
