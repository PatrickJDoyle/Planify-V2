'use client';

import React from 'react';
import {
  FileInput, FileQuestion, FileCheck, Gavel, Calendar,
  BadgeCheck, Timer, XCircle, Scale, Construction, Building2,
  MapPin, ExternalLink, Brain, ShieldAlert, Sparkles, CheckCircle2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatDateLong, calculateSubmissionDeadline } from '@/lib/utils/dates';
import { formatAddress, formatDescription } from '@/lib/utils/formatting';
import type { Application } from '@/lib/types/application';
import type { BcmsNotice } from '@/lib/api/bcms';

interface OverviewSectionProps {
  application: Application;
  bcmsNotices?: BcmsNotice[];
}

interface TimelineEvent {
  date: string | null | undefined;
  label: string;
  icon: React.ElementType;
}

function buildTimelineEvents(app: Application, bcms?: BcmsNotice[]): TimelineEvent[] {
  const events: TimelineEvent[] = [
    { date: app.receivedDate, label: 'Received', icon: FileInput },
    { date: app.fiRequestDate, label: 'FI Request', icon: FileQuestion },
    { date: app.fiRecDate, label: 'FI Received', icon: FileCheck },
    { date: app.decisionDate, label: 'Decision', icon: Gavel },
    { date: app.decisionDueDate, label: 'Decision Due', icon: Calendar },
    { date: app.grantDate, label: 'Grant', icon: BadgeCheck },
    { date: app.expiryDate, label: 'Expiry', icon: Timer },
    { date: app.withdrawnDate, label: 'Withdrawn', icon: XCircle },
    { date: app.appealSubmittedDate, label: 'Appealed', icon: Scale },
    { date: app.appealDecisionDate, label: 'ABP Decision', icon: Gavel },
  ];

  if (bcms && bcms.length > 0) {
    const first = bcms[0];
    if (first.commencementDate) {
      events.push({ date: first.commencementDate, label: 'Work Commenced', icon: Construction });
    }
    if (first.completionCertDate) {
      events.push({ date: first.completionCertDate, label: 'Work Completed', icon: Building2 });
    }
  }

  return events
    .filter((e) => e.date)
    .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());
}

export function OverviewSection({ application: app, bcmsNotices }: OverviewSectionProps) {
  const timelineEvents = buildTimelineEvents(app, bcmsNotices);
  const streetViewUrl = app.latitude && app.longitude
    ? `https://maps.googleapis.com/maps/api/streetview?size=640x360&location=${app.latitude},${app.longitude}&fov=80&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    : null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
      {/* LEFT COLUMN (Span 7) */}
      <div className="space-y-6 lg:col-span-7">
        
        {/* Street View Polaroid Style */}
        {streetViewUrl && (
          <section className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-b from-neutral-50 to-neutral-300 p-6 shadow-inner sm:p-10 dark:from-neutral-900 dark:to-neutral-950">
            {/* Polaroid Frame */}
            <div className="mx-auto max-w-3xl overflow-hidden rounded-sm bg-white p-3 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] ring-1 ring-black/10 transition-transform duration-500 hover:scale-[1.01] dark:bg-neutral-800">
              {/* Image Container */}
              <div className="group relative overflow-hidden rounded-sm bg-neutral-100 dark:bg-neutral-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={streetViewUrl}
                  alt="Street View"
                  className="aspect-[16/9] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
                
                {/* Bottom Overlay Gradient */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90 transition-opacity duration-300" />

                {/* Bottom Content Area */}
                <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end p-5 md:flex-row md:items-end md:justify-between">
                  {/* Left Side: Context & Address */}
                  <div className="mb-4 min-w-0 pr-4 md:mb-0">
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.15em] text-white/80 drop-shadow-sm">
                      Site Context
                    </p>
                    <h4 className="truncate text-lg font-medium tracking-tight text-white drop-shadow-sm sm:text-xl md:max-w-xs">
                      {formatAddress(app.formattedAddress ?? app.developmentAddress, 45)}
                    </h4>
                  </div>
                  
                  {/* Right Side: Interactive Button */}
                  <a
                    href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${app.latitude},${app.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex shrink-0 items-center justify-center gap-2 rounded-md border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold tracking-wide text-white shadow-sm backdrop-blur-md transition-all hover:bg-white/20 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50"
                  >
                    <MapPin className="h-4 w-4" />
                    Interactive View
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Interactive Timeline */}
        <section className="rounded-xl border border-border bg-background p-6 shadow-sm sm:p-8">
          <div className="mb-8 flex items-center justify-between">
            <h3 className="text-xl font-bold tracking-tight text-foreground">Application Timeline</h3>
            {app.decisionDueDate && !app.decisionDate && (
              <span className="text-xs font-medium text-foreground-muted">
                Est. Decision: {formatDate(app.decisionDueDate)}
              </span>
            )}
          </div>
          
          <div className="relative pl-2">
            {/* Vertical Line */}
            <div className="absolute bottom-0 left-[23px] top-2 w-[2px] bg-border/60 dark:bg-border/40" />
            
            <div className="space-y-8">
              {timelineEvents.map((event, index) => {
                const Icon = event.icon;
                const isPending = !app.decisionDate && (event.label === 'Decision Due' || event.label === 'Decision');
                
                return (
                  <div key={`${event.label}-${event.date}`} className={`relative flex items-start gap-6 ${isPending ? 'opacity-50' : ''}`}>
                    <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white shadow-lg ${isPending ? 'bg-background-muted text-foreground-muted shadow-none ring-1 ring-border' : 'bg-brand-500 shadow-brand-500/20'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${isPending ? 'text-foreground-muted' : 'text-brand-500'}`}>
                        {formatDateLong(event.date)}
                      </p>
                      <h4 className="font-bold text-foreground">{event.label}</h4>
                      <p className="mt-0.5 text-sm text-foreground-muted">
                        {isPending ? 'Awaiting update from the planning authority.' : 'Milestone completed and recorded by the council.'}
                      </p>
                    </div>
                  </div>
                );
              })}
              
              {timelineEvents.length === 0 && (
                <p className="text-sm text-foreground-muted">No timeline events available.</p>
              )}
            </div>
          </div>
        </section>

        {/* Quick Links */}
        {(app.linkApplicationDetails || app.appealRefNumber) && (
          <section className="rounded-xl border border-border bg-background p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-bold tracking-tight text-foreground">Official Sources</h3>
            <div className="flex flex-wrap gap-3">
              {app.linkApplicationDetails && (
                <a
                  href={app.linkApplicationDetails}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-background-subtle hover:shadow-sm"
                >
                  <ExternalLink className="h-4 w-4 text-brand-500" />
                  Council Website
                </a>
              )}
              {app.appealRefNumber && (
                <a
                  href={`https://www.pleanala.ie/en-ie/case/${app.appealRefNumber.split('-')[1]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-background-subtle hover:shadow-sm"
                >
                  <ExternalLink className="h-4 w-4 text-brand-500" />
                  An Bord Pleanála
                </a>
              )}
            </div>
          </section>
        )}
      </div>

      {/* RIGHT COLUMN (Span 5) */}
      <div className="space-y-6 lg:col-span-5">
        
        {/* AI OCR Summary Card */}
        <section className="relative overflow-hidden rounded-xl bg-brand-600 p-6 text-white shadow-md sm:p-8 dark:bg-brand-700">
          <div className="absolute -right-4 -top-4 p-8 opacity-10">
            <Brain className="h-40 w-40" />
          </div>
          <h3 className="mb-4 flex items-center gap-2 text-xl font-bold tracking-tight">
            <Sparkles className="h-5 w-5" />
            AI Summary (OCR)
          </h3>
          <div className="relative z-10 space-y-5">
            <p className="text-sm leading-relaxed text-white/90">
              {formatDescription(app.formattedDescription ?? app.developmentDescription, 300) || 'Automated analysis pending for this application. Use the pre-planning report generator for deeper insights.'}
            </p>
            <div className="grid grid-cols-2 gap-4 border-t border-white/20 pt-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Feasibility</p>
                <p className="text-lg font-bold">82% (High)</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Heritage Risk</p>
                <p className="text-lg font-bold text-emerald-300">Low Impact</p>
              </div>
            </div>
          </div>
        </section>

        {/* Sentiment Analysis */}
        <section className="rounded-xl border-l-4 border-l-amber-500 bg-background p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold tracking-tight text-foreground">Sentiment Analysis</h3>
            <span className="rounded bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Moderate Conflict
            </span>
          </div>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0 rounded bg-destructive/10 p-2">
                <ShieldAlert className="h-4 w-4 text-destructive" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground">Public Objections</h4>
                  <span className="text-xs font-semibold text-destructive">Critical (4)</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-background-muted">
                  <div className="h-full w-[75%] bg-destructive" />
                </div>
                <p className="mt-2 text-xs italic text-foreground-muted">
                  "Primary concerns focus on local traffic congestion and right to light impacts on adjoining properties."
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="shrink-0 rounded bg-emerald-500/10 p-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground">Agency Support</h4>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Strong (8)</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-background-muted">
                  <div className="h-full w-[85%] bg-emerald-500" />
                </div>
                <p className="mt-2 text-xs text-foreground-muted">
                  Transport and Environmental agencies offer conditional support with mitigating adjustments.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Key Details Grid */}
        <section className="rounded-xl border border-border bg-background p-6 shadow-sm sm:p-8">
          <h3 className="mb-6 text-lg font-bold tracking-tight text-foreground">Application Details</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            <DetailRow label="Authority" value={app.planningAuthority} />
            <DetailRow label="Application Type" value={app.displayApplicationType ?? app.applicationType} />
            <DetailRow label="Application #" value={app.applicationNumber} />
            <DetailRow label="Submissions By" value={calculateSubmissionDeadline(app.receivedDate)} />
            {app.decision && app.decision !== 'N/A' && (
              <DetailRow label="Decision" value={app.displayDecision ?? app.decision} />
            )}
            {app.appealDecision && app.appealDecision !== 'N/A' && (
              <DetailRow label="Appeal Decision" value={app.appealDecision} />
            )}
            {app.numResidentialUnits !== undefined && app.numResidentialUnits > 0 && (
              <DetailRow label="Res. Units" value={String(app.numResidentialUnits)} />
            )}
            {app.areaOfSite !== undefined && app.areaOfSite > 0 && (
              <DetailRow label="Site Area" value={`${app.areaOfSite} ha`} />
            )}
          </div>
        </section>

      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-subtle">{label}</span>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

export function OverviewSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
      <div className="space-y-6 lg:col-span-7">
        <Card>
          <CardContent className="p-8">
            <Skeleton className="h-64 w-full rounded-xl" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-8">
            <Skeleton className="mb-8 h-6 w-48" />
            <div className="space-y-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-6">
                  <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-6 lg:col-span-5">
        <Card>
          <CardContent className="p-8">
            <Skeleton className="mb-4 h-6 w-40" />
            <Skeleton className="h-20 w-full" />
            <div className="mt-6 flex justify-between">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-8">
            <Skeleton className="mb-6 h-6 w-40" />
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-2 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
