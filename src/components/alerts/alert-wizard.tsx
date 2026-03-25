'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  MapPin,
  Building2,
  Globe,
  Bell,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  Loader2,
  AlertCircle,
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
import { useUserProfile } from '@/lib/queries/user';
import { PLANNING_AUTHORITIES } from '@/lib/utils/constants';
import type { AlertScope, AlertType } from '@/lib/types/alerts';

interface AlertWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialState?: Partial<WizardState>;
}

type Step = 'type' | 'scope' | 'location' | 'confirm';

interface WizardState {
  alertType: AlertType | null;
  scope: AlertScope | null;
  planningAuthority: string;
  keywordIds: number[];
  address: string;
  radius: number;
  latitude: number | null;
  longitude: number | null;
  resolvedAddress: string | null;
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

const BASE_RADIUS_OPTIONS = [250, 500, 1000, 2000, 5000, 10000, 20000];

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number; formattedAddress: string } | null> {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&components=country:IE&key=${key}`;
    const res = await fetch(url);
    const json = await res.json();
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

function defaultWizardState(overrides?: Partial<WizardState>): WizardState {
  const baseState: WizardState = {
    alertType: null,
    scope: null,
    planningAuthority: '',
    keywordIds: [],
    address: '',
    radius: 1000,
    latitude: null,
    longitude: null,
    resolvedAddress: null,
    ...overrides,
  };
  baseState.keywordIds = overrides?.keywordIds ?? [];
  return baseState;
}

function getInitialStep(state: WizardState): Step {
  if (!state.alertType) return 'type';
  if (!state.scope) return 'scope';
  return 'location';
}

function formatMeters(value: number) {
  return value < 1000 ? `${value}m` : `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}km`;
}

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

export function AlertWizard({ open, onOpenChange, initialState }: AlertWizardProps) {
  const { profile, tier, limits } = useUserProfile();
  const createAlert = useCreateAlert();

  const [step, setStep] = useState<Step>('type');
  const [state, setState] = useState<WizardState>(() => defaultWizardState(initialState));
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');

  const keywords = useMemo(() => profile?.keywords ?? [], [profile?.keywords]);
  const canUseAdvancedScopes = tier === 'enterprise';
  const selectedKeywords = useMemo(
    () => keywords.filter((keyword) => state.keywordIds.includes(keyword.id)),
    [keywords, state.keywordIds],
  );

  const maxRadiusMeters = useMemo(() => {
    if (limits.maxAlertRadius == null) return null;
    return Math.round(limits.maxAlertRadius * 1000);
  }, [limits.maxAlertRadius]);

  const radiusOptions = useMemo(() => {
    if (maxRadiusMeters == null) return BASE_RADIUS_OPTIONS;
    const allowed = BASE_RADIUS_OPTIONS.filter((value) => value <= maxRadiusMeters);
    if (allowed.length === 0) return [maxRadiusMeters];
    if (allowed.includes(maxRadiusMeters)) return allowed;
    return [...allowed, maxRadiusMeters];
  }, [maxRadiusMeters]);

  const STEPS: Step[] = ['type', 'scope', 'location', 'confirm'];
  const stepLabels = ['Type', 'Scope', 'Location', 'Confirm'];
  const currentIdx = STEPS.indexOf(step);

  useEffect(() => {
    if (!open) return;
    const nextState = defaultWizardState(initialState);
    setState(nextState);
    setStep(getInitialStep(nextState));
    setGeocodeError('');
    createAlert.reset();
  }, [open, initialState, createAlert]);

  useEffect(() => {
    if (state.scope !== 'radius' || maxRadiusMeters == null) return;
    if (state.radius <= maxRadiusMeters) return;
    setState((current) => ({ ...current, radius: maxRadiusMeters }));
  }, [state.scope, state.radius, maxRadiusMeters]);

  const reset = () => {
    const nextState = defaultWizardState(initialState);
    setStep(getInitialStep(nextState));
    setState(nextState);
    setGeocodeError('');
    createAlert.reset();
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleNext = async () => {
    // Geocode address before advancing from location step for radius alerts,
    // unless coordinates were already provided (e.g. from project workspace prefill).
    if (step === 'location' && state.scope === 'radius') {
      if (!state.address.trim()) return;
      const hasCoordinates = state.latitude !== null && state.longitude !== null;
      if (!hasCoordinates) {
        setGeocodeError('');
        setGeocoding(true);
        const result = await geocodeAddress(state.address);
        setGeocoding(false);
        if (!result) {
          setGeocodeError('Could not find that address in Ireland. Please try a more specific address.');
          return;
        }
        setState((current) => ({
          ...current,
          latitude: result.lat,
          longitude: result.lng,
          resolvedAddress: result.formattedAddress,
        }));
      }
    }

    const nextIdx = currentIdx + 1;
    if (nextIdx < STEPS.length) setStep(STEPS[nextIdx]!);
  };

  const handleBack = () => {
    setGeocodeError('');
    const prevIdx = currentIdx - 1;
    if (prevIdx >= 0) setStep(STEPS[prevIdx]!);
  };

  const toggleKeyword = (keywordId: number) => {
    setState((current) => {
      const selected = current.keywordIds.includes(keywordId)
        ? current.keywordIds.filter((id) => id !== keywordId)
        : [...current.keywordIds, keywordId];
      return { ...current, keywordIds: selected };
    });
  };

  const canProceed = () => {
    if (geocoding) return false;
    if (step === 'type') return !!state.alertType;
    if (step === 'scope') return !!state.scope;
    if (step === 'location') {
      if (state.scope === 'authority') {
        if (!canUseAdvancedScopes || keywords.length === 0) return false;
        return !!state.planningAuthority && state.keywordIds.length > 0;
      }
      if (state.scope === 'radius') {
        if (!state.address.trim() || state.radius <= 0) return false;
        if (maxRadiusMeters != null && state.radius > maxRadiusMeters) return false;
        return true;
      }
      if (state.scope === 'nationwide') {
        if (!canUseAdvancedScopes || keywords.length === 0) return false;
        return state.keywordIds.length > 0;
      }
    }
    return true;
  };

  const handleCreate = () => {
    const boundedRadius =
      state.scope === 'radius' && maxRadiusMeters != null
        ? Math.min(state.radius, maxRadiusMeters)
        : state.radius;

    createAlert.mutate(
      {
        alertType: state.alertType!,
        scope: state.scope!,
        planningAuthority: state.planningAuthority || undefined,
        keywordIds:
          state.scope === 'authority' || state.scope === 'nationwide'
            ? state.keywordIds
            : undefined,
        address: state.address || undefined,
        radius: state.scope === 'radius' ? boundedRadius : undefined,
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
            {ALERT_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setState((current) => ({ ...current, alertType: type.id }))}
                className={cn(
                  'flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors',
                  state.alertType === type.id
                    ? 'border-brand-500 bg-brand-500/5'
                    : 'border-border hover:border-brand-500/40 hover:bg-background-subtle',
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                    state.alertType === type.id ? 'bg-brand-500/15' : 'bg-background-muted',
                  )}
                >
                  <type.icon
                    className={cn(
                      'h-4 w-4',
                      state.alertType === type.id ? 'text-brand-500' : 'text-foreground-muted',
                    )}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{type.label}</p>
                  <p className="mt-0.5 text-xs text-foreground-muted">{type.description}</p>
                </div>
                {state.alertType === type.id && (
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
            {SCOPES.map((scopeConfig) => {
              const isLockedScope =
                (scopeConfig.id === 'authority' || scopeConfig.id === 'nationwide') &&
                !canUseAdvancedScopes;

              return (
                <button
                  key={scopeConfig.id}
                  onClick={() => {
                    if (isLockedScope) return;
                    setState((current) => ({
                      ...current,
                      scope: scopeConfig.id,
                      planningAuthority: scopeConfig.id === 'authority' ? current.planningAuthority : '',
                      keywordIds: scopeConfig.id === 'radius' ? [] : current.keywordIds,
                    }));
                  }}
                  disabled={isLockedScope}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors',
                    state.scope === scopeConfig.id
                      ? 'border-brand-500 bg-brand-500/5'
                      : 'border-border hover:border-brand-500/40 hover:bg-background-subtle',
                    isLockedScope &&
                      'cursor-not-allowed opacity-50 hover:border-border hover:bg-transparent',
                  )}
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                      state.scope === scopeConfig.id ? 'bg-brand-500/15' : 'bg-background-muted',
                    )}
                  >
                    <scopeConfig.icon
                      className={cn(
                        'h-4 w-4',
                        state.scope === scopeConfig.id ? 'text-brand-500' : 'text-foreground-muted',
                      )}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{scopeConfig.label}</p>
                      {scopeConfig.enterprise && (
                        <Badge className="bg-brand-500/10 text-[10px] text-brand-500">Enterprise</Badge>
                      )}
                      {isLockedScope && (
                        <Badge variant="outline" className="text-[10px]">Locked</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-foreground-muted">{scopeConfig.description}</p>
                  </div>
                  {state.scope === scopeConfig.id && (
                    <div className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Step: Location */}
        {step === 'location' && (
          <div className="space-y-4 py-1">
            {state.scope === 'authority' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground-muted">
                    Planning Authority
                  </label>
                  <select
                    value={state.planningAuthority}
                    onChange={(event) => setState((current) => ({ ...current, planningAuthority: event.target.value }))}
                    className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    disabled={!canUseAdvancedScopes}
                  >
                    <option value="">Select an authority…</option>
                    {PLANNING_AUTHORITIES.map((authority) => (
                      <option key={authority.id} value={authority.id}>
                        {authority.name}
                      </option>
                    ))}
                  </select>
                </div>
                <KeywordSelector
                  keywords={keywords}
                  selectedKeywordIds={state.keywordIds}
                  onToggle={toggleKeyword}
                  blockedByTier={!canUseAdvancedScopes}
                />
              </>
            )}

            {state.scope === 'radius' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground-muted">
                    Address
                  </label>
                  <Input
                    value={state.address}
                    onChange={(event) =>
                      setState((current) => ({
                        ...current,
                        address: event.target.value,
                        latitude: null,
                        longitude: null,
                        resolvedAddress: null,
                      }))
                    }
                    placeholder="e.g. 14 Fitzwilliam Square, Dublin 2"
                    className="h-9"
                    disabled={geocoding}
                  />
                  {state.resolvedAddress && !geocoding && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                      <Check className="h-3 w-3" />
                      <span>Located: {state.resolvedAddress}</span>
                    </div>
                  )}
                  {geocodeError && (
                    <div className="flex items-center gap-1.5 text-xs text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      <span>{geocodeError}</span>
                    </div>
                  )}
                  {!state.resolvedAddress && !geocodeError && (
                    <p className="text-xs text-foreground-subtle">
                      Enter a street address and continue to validate it.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground-muted">
                    Radius: <span className="text-foreground">{formatMeters(state.radius)}</span>
                  </label>
                  {maxRadiusMeters != null && (
                    <p className="text-xs text-foreground-subtle">
                      Your plan supports up to {formatMeters(maxRadiusMeters)} for radius alerts.
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {radiusOptions.map((radius) => (
                      <button
                        key={radius}
                        onClick={() => setState((current) => ({ ...current, radius }))}
                        className={cn(
                          'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                          state.radius === radius
                            ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                            : 'border-border text-foreground-muted hover:border-brand-500/40',
                        )}
                      >
                        {formatMeters(radius)}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {state.scope === 'nationwide' && (
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-background-subtle p-4">
                  <p className="text-sm text-foreground">
                    This alert will monitor all planning applications submitted across Ireland.
                  </p>
                  <p className="mt-1.5 text-xs text-foreground-muted">
                    Nationwide alerts require at least one keyword to keep signal quality high.
                  </p>
                </div>
                <KeywordSelector
                  keywords={keywords}
                  selectedKeywordIds={state.keywordIds}
                  onToggle={toggleKeyword}
                  blockedByTier={!canUseAdvancedScopes}
                />
              </div>
            )}
          </div>
        )}

        {/* Step: Confirm */}
        {step === 'confirm' && (
          <div className="space-y-3 py-1">
            <div className="divide-y rounded-lg border border-border">
              <SummaryRow
                label="Alert type"
                value={state.alertType === 'new_application' ? 'New applications' : 'Status updates'}
              />
              <SummaryRow
                label="Scope"
                value={SCOPES.find((scopeConfig) => scopeConfig.id === state.scope)?.label ?? '—'}
              />
              {state.scope === 'authority' && (
                <SummaryRow
                  label="Authority"
                  value={
                    PLANNING_AUTHORITIES.find((authority) => authority.id === state.planningAuthority)?.name ??
                    state.planningAuthority
                  }
                />
              )}
              {(state.scope === 'authority' || state.scope === 'nationwide') && (
                <SummaryRow
                  label="Keywords"
                  value={
                    selectedKeywords.length
                      ? selectedKeywords.map((keyword) => keyword.keyword).join(', ')
                      : 'None selected'
                  }
                />
              )}
              {state.scope === 'radius' && (
                <>
                  <SummaryRow label="Address" value={state.resolvedAddress ?? state.address} />
                  <SummaryRow label="Radius" value={formatMeters(state.radius)} />
                </>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        {createAlert.error && (
          <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {(createAlert.error as Error).message || 'Failed to create alert.'}
          </div>
        )}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={currentIdx === 0 ? handleClose : handleBack}
            disabled={geocoding}
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
              {geocoding ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Locating…
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={createAlert.isPending}
              className="gap-1.5 bg-brand-500 hover:bg-brand-600"
            >
              {createAlert.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <Bell className="h-3.5 w-3.5" />
                  Create Alert
                </>
              )}
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

function KeywordSelector({
  keywords,
  selectedKeywordIds,
  onToggle,
  blockedByTier,
}: {
  keywords: Array<{ id: number; keyword: string }>;
  selectedKeywordIds: number[];
  onToggle: (keywordId: number) => void;
  blockedByTier: boolean;
}) {
  if (blockedByTier) {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700">
        Authority and nationwide alerts are available on the Enterprise plan.
      </div>
    );
  }

  if (keywords.length === 0) {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700">
        Add at least one keyword in your profile settings to create this alert scope.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-foreground-muted">
        Keywords (select one or more)
      </label>
      <div className="flex flex-wrap gap-2">
        {keywords.map((keyword) => {
          const selected = selectedKeywordIds.includes(keyword.id);
          return (
            <button
              key={keyword.id}
              type="button"
              onClick={() => onToggle(keyword.id)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs transition-colors',
                selected
                  ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                  : 'border-border text-foreground-muted hover:border-brand-500/40',
              )}
            >
              {keyword.keyword}
            </button>
          );
        })}
      </div>
    </div>
  );
}
