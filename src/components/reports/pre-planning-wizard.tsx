'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import {
  FileText,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  AlertCircle,
  BarChart3,
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
import { StudyAreaPreview } from '@/components/maps/study-area-preview';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { GOOGLE_MAPS_LIBRARIES, GOOGLE_MAPS_LOADER_ID } from '@/lib/maps/google-loader';
import { formatRadiusMeters } from '@/lib/maps/map-zoom';
import { useOptimalRadius, useRunPrePlanningReportJob } from '@/lib/queries/reports';
import { reportsApi } from '@/lib/api/reports';
import { waitForPrePlanningJob } from '@/lib/api/report-jobs';
import {
  applicationCountBand,
  captureDemoEvent,
  DEMO_EVENT,
  markPostReportSession,
} from '@/lib/analytics/demo-analytics';
import {
  DEMO_LEGAL_DISCLAIMER,
  DEMO_LOW_APPLICATION_SAMPLE,
} from '@/lib/demo-trust-copy';

interface ReportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set (e.g. from `/reports/pre-planning?jobId=`), load that saved job instead of running the wizard flow. */
  initialJobId?: number | null;
}

type Step = 'location' | 'radius' | 'intention' | 'generating';

const INTENTION_CATEGORIES = [
  {
    id: 'residential',
    label: 'Residential Development',
    subs: ['Single house', 'Extension/alteration', 'Apartments', 'Social housing', 'Demolition'],
  },
  {
    id: 'commercial',
    label: 'Commercial Development',
    subs: ['Retail', 'Office', 'Industrial', 'Mixed use', 'Hotel/hospitality'],
  },
  {
    id: 'change_of_use',
    label: 'Change of Use',
    subs: ['Residential to commercial', 'Commercial to residential', 'Agricultural'],
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure & Utilities',
    subs: ['Road / footpath', 'Utilities', 'Communications / telecoms'],
  },
];

const RADIUS_OPTIONS = [100, 250, 500, 1000, 2000];

function stripHtmlToPlainText(html: string): string {
  if (typeof window === 'undefined') return html;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body?.textContent?.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim() ?? '';
}

async function copyPlainTextFromHtml(html: string): Promise<void> {
  const text = stripHtmlToPlainText(html);
  if (!text) throw new Error('Nothing to copy.');
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    /* fall through */
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(ta);
  if (!ok) throw new Error('Copy failed. Try Export instead.');
}

interface WizardState {
  address: string;
  latitude: number | null;
  longitude: number | null;
  radius: number;
  intentionCategory: string;
  intentionSubCategory: string;
}

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-1.5 rounded-full transition-all',
            i < current
              ? 'w-4 bg-brand-500'
              : i === current
                ? 'w-4 bg-brand-500/40'
                : 'w-1.5 bg-border',
          )}
        />
      ))}
    </div>
  );
}

export function PrePlanningReportWizard({ open, onOpenChange, initialJobId = null }: ReportWizardProps) {
  const router = useRouter();
  const pollAbortRef = useRef<AbortController | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? '';
  const mapsConfigured = mapsApiKey.length > 0;
  const { isLoaded, loadError } = useJsApiLoader({
    id: GOOGLE_MAPS_LOADER_ID,
    googleMapsApiKey: mapsApiKey,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const [step, setStep] = useState<Step>('location');
  const [state, setState] = useState<WizardState>({
    address: '',
    latitude: null,
    longitude: null,
    radius: 500,
    intentionCategory: '',
    intentionSubCategory: '',
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [geocodeError, setGeocodeError] = useState('');
  const [reportContent, setReportContent] = useState<string>('');
  const [existingJobError, setExistingJobError] = useState('');
  const [isExistingJobLoading, setIsExistingJobLoading] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [completedJobId, setCompletedJobId] = useState<number | null>(null);

  const { data: optimalRadius, isLoading: loadingRadius } = useOptimalRadius(
    state.latitude,
    state.longitude,
  );
  const runReportJob = useRunPrePlanningReportJob();

  const handlePlaceChanged = useCallback(() => {
    const ac = autocompleteRef.current;
    if (!ac) return;
    const place = ac.getPlace();
    if (!place.geometry?.location) return;
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const address = place.formatted_address ?? place.name ?? '';
    setState((s) => ({ ...s, latitude: lat, longitude: lng, address }));
    setGeocodeError('');
  }, []);

  const handleMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      const address =
        status === 'OK' && results?.[0]
          ? results[0].formatted_address
          : `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setState((s) => ({ ...s, latitude: lat, longitude: lng, address }));
    });
  }, []);

  const handleLocationContinue = useCallback(() => {
    if (state.latitude != null && state.longitude != null) {
      setStep('radius');
      return;
    }
    setGeocodeError('Pick an address from the suggestions (Ireland).');
  }, [state.latitude, state.longitude]);

  const STEPS: Step[] = ['location', 'radius', 'intention', 'generating'];
  const currentIdx = STEPS.indexOf(step);

  const reset = () => {
    setStep('location');
    setState({ address: '', latitude: null, longitude: null, radius: 500, intentionCategory: '', intentionSubCategory: '' });
    setSelectedCategory('');
    setReportContent('');
    setGeocodeError('');
    setExistingJobError('');
    setIsExistingJobLoading(false);
    setGenerateError('');
    setCopyStatus('idle');
    setCompletedJobId(null);
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      pollAbortRef.current?.abort();
      pollAbortRef.current = null;
      runReportJob.reset();
      reset();
    }
    onOpenChange(nextOpen);
  };

  useEffect(() => {
    if (!open || initialJobId == null) return;

    pollAbortRef.current?.abort();
    const ac = new AbortController();
    pollAbortRef.current = ac;

    setStep('generating');
    setReportContent('');
    setExistingJobError('');
    setGenerateError('');
    setIsExistingJobLoading(true);

    void (async () => {
      try {
        const job = await waitForPrePlanningJob(initialJobId, { signal: ac.signal });
        const html = job.combinedHtml ?? job.narrativeHtml ?? '';
        if (!html.trim()) {
          setExistingJobError('This report has no saved content yet.');
          return;
        }
        setReportContent(html);
        setCompletedJobId(initialJobId);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setExistingJobError(e instanceof Error ? e.message : 'Failed to load report.');
      } finally {
        if (!ac.signal.aborted) setIsExistingJobLoading(false);
      }
    })();

    return () => {
      ac.abort();
    };
  }, [open, initialJobId]);

  const handleGenerate = async () => {
    setGenerateError('');
    runReportJob.reset();
    pollAbortRef.current?.abort();
    const ac = new AbortController();
    pollAbortRef.current = ac;
    setStep('generating');
    setReportContent('');
    setCompletedJobId(null);
    try {
      let applications = optimalRadius?.applications ?? [];
      const adjusted = optimalRadius?.adjustedRadius ?? state.radius;
      if (
        applications.length === 0 &&
        state.latitude != null &&
        state.longitude != null
      ) {
        applications = await reportsApi.getNearbyApplications({
          latitude: state.latitude,
          longitude: state.longitude,
          radius: adjusted,
        });
      }
      const result = await runReportJob.mutateAsync({
        applications,
        initialRadius: state.radius,
        adjustedRadius: adjusted,
        initialApplicationCount: optimalRadius?.initialCount ?? 0,
        address: state.address,
        centreLat: state.latitude ?? undefined,
        centreLon: state.longitude ?? undefined,
        intentionCategory: state.intentionCategory,
        intentionSubCategory: state.intentionSubCategory,
        pollSignal: ac.signal,
      });
      setReportContent(result.content);
      setCompletedJobId(result.jobId);
      markPostReportSession();
      const initialCount = optimalRadius?.initialCount ?? 0;
      captureDemoEvent(DEMO_EVENT.DEMO_REPORT_GENERATED, {
        intention_category: state.intentionCategory,
        intention_subcategory: state.intentionSubCategory,
        unique_application_count_band: applicationCountBand(initialCount),
        has_zoning_context: false,
        initial_vs_adjusted_radius: `${state.radius}:${optimalRadius?.adjustedRadius ?? state.radius}`,
      });
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      setGenerateError(e instanceof Error ? e.message : 'Something went wrong.');
    }
  };

  const category = INTENTION_CATEGORIES.find((c) => c.id === selectedCategory);
  const activeJobId = completedJobId ?? initialJobId;

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="mb-3 flex items-center justify-between">
            <StepDots total={3} current={currentIdx} />
            <Badge variant="outline" className="text-[10px] text-foreground-muted">
              Pre-Planning Intel
            </Badge>
          </div>
          <DialogTitle className="text-base">
            {step === 'location' && 'Where is your site?'}
            {step === 'radius' && 'Set analysis radius'}
            {step === 'intention' && 'Describe your development intention'}
            {step === 'generating' && 'Generating your report…'}
          </DialogTitle>
          <DialogDescription>
            {step === 'location' && 'Enter the full address of the site you want to research.'}
            {step === 'radius' && 'We recommend the optimal radius based on planning activity density.'}
            {step === 'intention' && 'Select the type of development you are planning.'}
            {step === 'generating' && 'Our AI is analysing nearby applications and generating your intelligence report.'}
          </DialogDescription>
        </DialogHeader>

        {/* Step: Location */}
        {step === 'location' && (
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground-muted">Site address</label>
              {!mapsConfigured ? (
                <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-2 text-[11px] leading-snug text-amber-950 dark:text-amber-100">
                  Address search uses Google Places (Ireland), same as the dashboard map. Set{' '}
                  <code className="rounded bg-background px-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to continue.
                </p>
              ) : null}
              {mapsConfigured && loadError ? (
                <p className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  Could not load Google Maps. Check the API key and network, then reload.
                </p>
              ) : null}
              {mapsConfigured && !isLoaded && !loadError ? (
                <div className="flex items-center gap-2 text-xs text-foreground-muted">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-500" />
                  Loading address search…
                </div>
              ) : null}
              {mapsConfigured && isLoaded ? (
                <Autocomplete
                  onLoad={(ac) => {
                    autocompleteRef.current = ac;
                  }}
                  onPlaceChanged={handlePlaceChanged}
                  options={{
                    componentRestrictions: { country: 'ie' },
                    types: ['geocode', 'establishment'],
                  }}
                >
                  <input
                    value={state.address}
                    onChange={(e) => {
                      setState((s) => ({
                        ...s,
                        address: e.target.value,
                        latitude: null,
                        longitude: null,
                      }));
                      setGeocodeError('');
                    }}
                    placeholder="e.g. 14 Fitzwilliam Square, Dublin 2"
                    className={cn(
                      'flex h-9 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground ring-offset-background',
                      'placeholder:text-foreground-muted',
                      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                    )}
                  />
                </Autocomplete>
              ) : !mapsConfigured ? (
                <Input
                  disabled
                  value={state.address}
                  placeholder="Configure Google Maps API key first"
                  className="h-9"
                />
              ) : (
                <Input disabled placeholder="Loading…" className="h-9" />
              )}
              {geocodeError ? (
                <p className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {geocodeError}
                </p>
              ) : null}
              {state.latitude != null && state.longitude != null ? (
                <p className="flex items-center gap-1.5 text-xs text-status-granted">
                  <Check className="h-3 w-3 shrink-0" />
                  Selected: {state.latitude.toFixed(5)}, {state.longitude.toFixed(5)}
                </p>
              ) : null}
              {mapsConfigured && isLoaded && state.latitude != null && state.longitude != null ? (
                <StudyAreaPreview
                  isLoaded={isLoaded}
                  center={{ lat: state.latitude, lng: state.longitude }}
                  radiusMeters={state.radius}
                  height={180}
                  draggableMarker
                  onMarkerDragEnd={handleMarkerDragEnd}
                  caption={
                    <p className="text-xs text-foreground-muted">
                      Drag the pin to fine-tune. The circle shows your analysis radius (
                      {formatRadiusMeters(state.radius)}); you can change it on the next step.
                    </p>
                  }
                />
              ) : null}
            </div>
          </div>
        )}

        {/* Step: Radius */}
        {step === 'radius' &&
        state.latitude != null &&
        state.longitude != null &&
        mapsConfigured &&
        isLoaded ? (
          <div className="space-y-4 py-1">
            {loadingRadius ? (
              <div className="flex items-center gap-2 text-sm text-foreground-muted">
                <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
                Calculating optimal radius…
              </div>
            ) : optimalRadius ? (
              <div className="rounded-lg border border-brand-500/30 bg-brand-500/5 p-4">
                <div className="flex items-start gap-3">
                  <BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Recommended: {formatRadiusMeters(optimalRadius.adjustedRadius)}
                    </p>
                    <p className="mt-0.5 text-xs text-foreground-muted">
                      {optimalRadius.initialCount} applications found in this area
                    </p>
                    {optimalRadius.initialCount < 15 && (
                      <p className="mt-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-[11px] leading-snug text-amber-950 dark:text-amber-100">
                        {DEMO_LOW_APPLICATION_SAMPLE}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground-muted">
                Analysis radius:{' '}
                <span className="text-foreground">{formatRadiusMeters(state.radius)}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {RADIUS_OPTIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setState((s) => ({ ...s, radius: r }))}
                    className={cn(
                      'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                      state.radius === r
                        ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                        : 'border-border text-foreground-muted hover:border-brand-500/40',
                    )}
                  >
                    {formatRadiusMeters(r)}
                    {optimalRadius && r === optimalRadius.adjustedRadius ? (
                      <span className="ml-1 text-[10px] text-brand-500">★</span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
            <StudyAreaPreview
              isLoaded={isLoaded}
              center={{ lat: state.latitude, lng: state.longitude }}
              radiusMeters={state.radius}
              height={260}
              draggableMarker
              onMarkerDragEnd={handleMarkerDragEnd}
              caption={
                <p className="text-xs text-foreground-muted">
                  Study area before you continue: {formatRadiusMeters(state.radius)} around{' '}
                  <span className="font-medium text-foreground">{state.address}</span>. Drag the pin to move the
                  centre.
                </p>
              }
            />
          </div>
        ) : null}
        {step === 'radius' &&
        (!mapsConfigured || !isLoaded || loadError || state.latitude == null || state.longitude == null) ? (
          <div className="space-y-2 py-1 text-sm text-foreground-muted">
            {!mapsConfigured || loadError ? (
              <p>Go back and configure Google Maps to preview the study area on the map.</p>
            ) : (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
                Loading map preview…
              </div>
            )}
          </div>
        ) : null}

        {/* Step: Intention */}
        {step === 'intention' && (
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground-muted">Development type</label>
              <div className="grid grid-cols-2 gap-2">
                {INTENTION_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setState((s) => ({ ...s, intentionCategory: cat.label, intentionSubCategory: '' }));
                    }}
                    className={cn(
                      'rounded-lg border p-3 text-left text-xs font-medium transition-colors',
                      selectedCategory === cat.id
                        ? 'border-brand-500 bg-brand-500/5 text-brand-500'
                        : 'border-border text-foreground-muted hover:border-brand-500/40 hover:text-foreground',
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {category && category.subs.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground-muted">Sub-category</label>
                <div className="flex flex-wrap gap-1.5">
                  {category.subs.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => setState((s) => ({ ...s, intentionSubCategory: sub }))}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs transition-colors',
                        state.intentionSubCategory === sub
                          ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                          : 'border-border text-foreground-muted hover:border-brand-500/40',
                      )}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step: Generating */}
        {step === 'generating' && (
          <div className="flex flex-col items-center gap-4 py-6">
            {existingJobError ? (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
                  <AlertCircle className="h-7 w-7 text-destructive" />
                </div>
                <p className="max-w-sm text-center text-sm text-destructive">{existingJobError}</p>
                <Button variant="outline" size="sm" onClick={() => handleDialogOpenChange(false)}>
                  Close
                </Button>
              </>
            ) : generateError ? (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
                  <AlertCircle className="h-7 w-7 text-destructive" />
                </div>
                <p className="max-w-sm text-center text-sm text-destructive">{generateError}</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setGenerateError('');
                      setStep('intention');
                    }}
                  >
                    Adjust inputs
                  </Button>
                  <Button size="sm" className="bg-brand-500 hover:bg-brand-600" onClick={() => void handleGenerate()}>
                    Try again
                  </Button>
                </div>
              </>
            ) : runReportJob.isPending || isExistingJobLoading ? (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/10">
                  <Loader2 className="h-7 w-7 animate-spin text-brand-500" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">
                    {initialJobId != null ? 'Loading your report…' : `Analysing ${state.address}`}
                  </p>
                  {initialJobId == null ? (
                    <p className="mt-1 text-sm text-foreground-muted">
                      Scanning {optimalRadius?.initialCount ?? '—'} nearby planning applications…
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-foreground-muted">Fetching saved report from your history…</p>
                  )}
                </div>
              </>
            ) : reportContent ? (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-status-granted/10">
                  <FileText className="h-7 w-7 text-status-granted" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">Report ready!</p>
                  <p className="mt-1 text-sm text-foreground-muted">
                    Your pre-planning intelligence report has been generated.
                  </p>
                </div>
                <p className="max-w-sm text-center text-[11px] leading-snug text-foreground-muted">
                  {DEMO_LEGAL_DISCLAIMER}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={async () => {
                      setCopyStatus('idle');
                      try {
                        await copyPlainTextFromHtml(reportContent);
                        setCopyStatus('copied');
                        captureDemoEvent(DEMO_EVENT.REPORT_EXPORTED, { format: 'clipboard_plaintext' });
                      } catch {
                        setCopyStatus('error');
                      }
                    }}
                  >
                    <FileText className="h-4 w-4" />
                    Copy report
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={activeJobId == null}
                    onClick={() => {
                      if (activeJobId == null) return;
                      const doc = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>Pre-planning report</title></head><body>${reportContent}</body></html>`;
                      const blob = new Blob([doc], { type: 'text/html;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `pre-planning-report-${activeJobId}.html`;
                      a.rel = 'noopener';
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(url);
                      captureDemoEvent(DEMO_EVENT.REPORT_EXPORTED, { format: 'download_html' });
                    }}
                  >
                    <FileText className="h-4 w-4" />
                    Export HTML
                  </Button>
                  <Button
                    className="gap-2 bg-brand-500 hover:bg-brand-600"
                    disabled={activeJobId == null}
                    onClick={() => {
                      if (activeJobId == null) return;
                      router.replace(`/reports/pre-planning?jobId=${activeJobId}`);
                    }}
                  >
                    <FileText className="h-4 w-4" />
                    View report
                  </Button>
                </div>
                {copyStatus === 'copied' && (
                  <p className="text-center text-xs text-status-granted">Copied to clipboard</p>
                )}
                {copyStatus === 'error' && (
                  <p className="max-w-sm text-center text-xs text-destructive">
                    Could not copy. Use Export HTML or open View report in a new tab from your browser.
                  </p>
                )}
              </>
            ) : (
              <p className="max-w-sm text-center text-sm text-foreground-muted">
                Something went wrong while loading this step. Close the dialog and try again.
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        {step !== 'generating' && (
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={
                currentIdx === 0
                  ? () => handleDialogOpenChange(false)
                  : () => setStep(STEPS[currentIdx - 1]!)
              }
              className="gap-1.5 text-foreground-muted"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {currentIdx === 0 ? 'Cancel' : 'Back'}
            </Button>

            {step === 'location' && (
              <Button
                size="sm"
                onClick={handleLocationContinue}
                disabled={
                  !mapsConfigured ||
                  !isLoaded ||
                  !!loadError ||
                  (state.latitude == null && !state.address.trim())
                }
                className="gap-1.5 bg-brand-500 hover:bg-brand-600"
              >
                {state.latitude != null && state.longitude != null ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Continue
                  </>
                ) : (
                  <>
                    Continue <ChevronRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            )}

            {step === 'radius' && (
              <Button
                size="sm"
                onClick={() => setStep('intention')}
                className="gap-1.5 bg-brand-500 hover:bg-brand-600"
              >
                Continue <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            )}

            {step === 'intention' && (
              <Button
                size="sm"
                onClick={handleGenerate}
                disabled={!state.intentionCategory}
                className="gap-1.5 bg-brand-500 hover:bg-brand-600"
              >
                <FileText className="h-3.5 w-3.5" />
                Generate Report
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
