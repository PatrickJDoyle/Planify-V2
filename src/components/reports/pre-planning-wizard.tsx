'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Ruler,
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
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useOptimalRadius, useGeneratePrePlanningReport } from '@/lib/queries/reports';
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

export function PrePlanningReportWizard({ open, onOpenChange }: ReportWizardProps) {
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
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');
  const [reportContent, setReportContent] = useState<string>('');

  const { data: optimalRadius, isLoading: loadingRadius } = useOptimalRadius(
    state.latitude,
    state.longitude,
  );
  const generateReport = useGeneratePrePlanningReport();

  const STEPS: Step[] = ['location', 'radius', 'intention', 'generating'];
  const currentIdx = STEPS.indexOf(step);

  const reset = () => {
    setStep('location');
    setState({ address: '', latitude: null, longitude: null, radius: 500, intentionCategory: '', intentionSubCategory: '' });
    setSelectedCategory('');
    setReportContent('');
    setGeocodeError('');
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  // Geocode address using browser's Geocoder API (or just use what user enters)
  const handleGeocode = async () => {
    if (!state.address.trim()) return;
    setGeocoding(true);
    setGeocodeError('');
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(state.address)}&format=json&limit=1`,
      );
      const results = await resp.json() as Array<{ lat: string; lon: string }>;
      if (results.length === 0) {
        setGeocodeError('Address not found. Please try a more specific address.');
        return;
      }
      const { lat, lon } = results[0]!;
      setState((s) => ({ ...s, latitude: parseFloat(lat), longitude: parseFloat(lon) }));
      setStep('radius');
    } catch {
      setGeocodeError('Geocoding failed. Please try again.');
    } finally {
      setGeocoding(false);
    }
  };

  const handleGenerate = async () => {
    setStep('generating');
    try {
      const result = await generateReport.mutateAsync({
        applications: [],
        initialRadius: state.radius,
        adjustedRadius: optimalRadius?.adjustedRadius ?? state.radius,
        initialApplicationCount: optimalRadius?.initialCount ?? 0,
        address: state.address,
        centreLat: state.latitude ?? undefined,
        centreLon: state.longitude ?? undefined,
        intentionCategory: state.intentionCategory,
        intentionSubCategory: state.intentionSubCategory,
      });
      setReportContent(result.content);
      markPostReportSession();
      const initialCount = optimalRadius?.initialCount ?? 0;
      captureDemoEvent(DEMO_EVENT.DEMO_REPORT_GENERATED, {
        intention_category: state.intentionCategory,
        intention_subcategory: state.intentionSubCategory,
        unique_application_count_band: applicationCountBand(initialCount),
        has_zoning_context: false,
        initial_vs_adjusted_radius: `${state.radius}:${optimalRadius?.adjustedRadius ?? state.radius}`,
      });
    } catch {
      setStep('intention');
    }
  };

  const category = INTENTION_CATEGORIES.find((c) => c.id === selectedCategory);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
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
              <div className="flex gap-2">
                <Input
                  value={state.address}
                  onChange={(e) => {
                    setState((s) => ({ ...s, address: e.target.value, latitude: null, longitude: null }));
                    setGeocodeError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleGeocode()}
                  placeholder="e.g. 14 Fitzwilliam Square, Dublin 2"
                  className="h-9 flex-1"
                />
                <Button
                  size="sm"
                  className="h-9 gap-1.5 bg-brand-500 hover:bg-brand-600"
                  onClick={handleGeocode}
                  disabled={!state.address.trim() || geocoding}
                >
                  {geocoding ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <MapPin className="h-3.5 w-3.5" />
                  )}
                  Locate
                </Button>
              </div>
              {geocodeError && (
                <p className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  {geocodeError}
                </p>
              )}
              {state.latitude && (
                <p className="flex items-center gap-1.5 text-xs text-status-granted">
                  <Check className="h-3 w-3" />
                  Located: {state.latitude.toFixed(5)}, {state.longitude?.toFixed(5)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step: Radius */}
        {step === 'radius' && (
          <div className="space-y-4 py-1">
            {loadingRadius ? (
              <div className="flex items-center gap-2 text-sm text-foreground-muted">
                <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
                Calculating optimal radius…
              </div>
            ) : optimalRadius && (
              <div className="rounded-lg border border-brand-500/30 bg-brand-500/5 p-4">
                <div className="flex items-start gap-3">
                  <BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Recommended: {optimalRadius.adjustedRadius >= 1000
                        ? `${optimalRadius.adjustedRadius / 1000}km`
                        : `${optimalRadius.adjustedRadius}m`}
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
            )}
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground-muted">
                Analysis radius:{' '}
                <span className="text-foreground">
                  {state.radius < 1000 ? `${state.radius}m` : `${state.radius / 1000}km`}
                </span>
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
                    {optimalRadius && r === optimalRadius.adjustedRadius && (
                      <span className="ml-1 text-[10px] text-brand-500">★</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

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
            {generateReport.isPending ? (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/10">
                  <Loader2 className="h-7 w-7 animate-spin text-brand-500" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">Analysing {state.address}</p>
                  <p className="mt-1 text-sm text-foreground-muted">
                    Scanning {optimalRadius?.initialCount ?? '—'} nearby planning applications…
                  </p>
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
                      try {
                        await navigator.clipboard.writeText(reportContent);
                        captureDemoEvent(DEMO_EVENT.REPORT_EXPORTED, { format: 'clipboard_markdown' });
                      } catch {
                        /* ignore */
                      }
                    }}
                  >
                    <FileText className="h-4 w-4" />
                    Copy report
                  </Button>
                  <Button
                    className="gap-2 bg-brand-500 hover:bg-brand-600"
                    onClick={handleClose}
                  >
                    <FileText className="h-4 w-4" />
                    View Report
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* Footer */}
        {step !== 'generating' && (
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={currentIdx === 0 ? handleClose : () => setStep(STEPS[currentIdx - 1]!)}
              className="gap-1.5 text-foreground-muted"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {currentIdx === 0 ? 'Cancel' : 'Back'}
            </Button>

            {step === 'location' && (
              <Button
                size="sm"
                onClick={handleGeocode}
                disabled={!state.address.trim() || geocoding || !!state.latitude}
                className="gap-1.5 bg-brand-500 hover:bg-brand-600"
              >
                {state.latitude ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Located
                  </>
                ) : geocoding ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
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
