'use client';

import React from 'react';
import {
  FileInput, FileQuestion, FileCheck, Gavel, Calendar,
  BadgeCheck, Timer, XCircle, Scale, Construction, Building2,
  MapPin, ExternalLink,
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
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      {/* LEFT COLUMN (60%) */}
      <div className="space-y-4 lg:col-span-3">
        {/* Key Details */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground">Key Details</h3>
            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3">
              <DetailRow label="Address" value={formatAddress(app.formattedAddress ?? app.developmentAddress, 100)} />
              <DetailRow label="Authority" value={app.planningAuthority} />
              <DetailRow label="Application Type" value={app.displayApplicationType ?? app.applicationType} />
              <DetailRow label="Application #" value={app.applicationNumber} />
              <DetailRow label="Received" value={formatDateLong(app.receivedDate)} />
              <DetailRow label="Submissions By" value={calculateSubmissionDeadline(app.receivedDate)} />
              {app.decisionDate && (
                <DetailRow label="Decision Date" value={formatDateLong(app.decisionDate)} />
              )}
              {!app.decisionDate && app.decisionDueDate && (
                <DetailRow label="Decision Due" value={formatDateLong(app.decisionDueDate)} />
              )}
              {app.decision && app.decision !== 'N/A' && (
                <DetailRow label="Decision" value={app.displayDecision ?? app.decision} />
              )}
              {app.appealRefNumber && (
                <DetailRow label="Appeal Ref" value={app.appealRefNumber} />
              )}
              {app.appealDecision && app.appealDecision !== 'N/A' && (
                <DetailRow label="Appeal Decision" value={app.appealDecision} />
              )}
              {app.numResidentialUnits !== undefined && app.numResidentialUnits > 0 && (
                <DetailRow label="Residential Units" value={String(app.numResidentialUnits)} />
              )}
              {app.areaOfSite !== undefined && app.areaOfSite > 0 && (
                <DetailRow label="Site Area" value={`${app.areaOfSite} ha`} />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground">Description</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
              {app.formattedDescription ?? app.developmentDescription}
            </p>
          </CardContent>
        </Card>

        {/* Street View Polaroid Style */}
        {streetViewUrl && (
          <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-b from-neutral-50 to-neutral-300 p-6 shadow-inner sm:p-10 dark:from-neutral-900 dark:to-neutral-950">
            {/* Polaroid Frame */}
            <div className="mx-auto max-w-3xl overflow-hidden rounded-sm bg-white p-3 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] ring-1 ring-black/10 transition-transform duration-500 hover:scale-[1.01] dark:bg-neutral-800">
              {/* Image Container */}
              <div className="group relative overflow-hidden rounded-sm bg-neutral-100 dark:bg-neutral-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={streetViewUrl}
                  alt="Street View"
                  className="aspect-[16/9] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
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
          </div>
        )}
      </div>

      {/* RIGHT COLUMN (40%) */}
      <div className="space-y-4 lg:col-span-2">
        {/* Timeline */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground">Timeline</h3>
            {timelineEvents.length > 0 ? (
              <div className="mt-3 space-y-0">
                {timelineEvents.map((event) => {
                  const Icon = event.icon;
                  return (
                    <div
                      key={`${event.label}-${event.date}`}
                      className="flex items-center justify-between border-b border-border-muted py-2 last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-foreground-subtle" />
                        <span className="text-sm text-foreground">{event.label}</span>
                      </div>
                      <span className="text-sm text-foreground-muted">{formatDate(event.date)}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 text-sm text-foreground-muted">No timeline events available</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground">Quick Links</h3>
            <div className="mt-3 space-y-2">
              {app.linkApplicationDetails && (
                <a
                  href={app.linkApplicationDetails}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-background-subtle"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-primary" />
                  View on Council Website
                </a>
              )}
              {app.appealRefNumber && (
                <a
                  href={`https://www.pleanala.ie/en-ie/case/${app.appealRefNumber.split('-')[1]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-background-subtle"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-primary" />
                  View on An Bord Pleanala
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-xs text-foreground-subtle">{label}</span>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}

export function OverviewSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-3">
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-5 w-24" />
            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="mt-1 h-4 w-32" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-5 w-20" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="mt-3 flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
