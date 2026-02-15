'use client';

import React from 'react';
import {
  FileInput, FileQuestion, FileCheck, Gavel, Calendar,
  BadgeCheck, Timer, XCircle, Scale, Construction, Building2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatDateLong } from '@/lib/utils/dates';
import type { Application } from '@/lib/types/application';
import type { BcmsNotice } from '@/lib/api/bcms';

interface TimelineSectionProps {
  application: Application;
  bcmsNotices?: BcmsNotice[];
}

interface TimelineEvent {
  date: string;
  label: string;
  icon: React.ElementType;
  status: 'completed' | 'pending' | 'future';
}

export function TimelineSection({ application: app, bcmsNotices }: TimelineSectionProps) {
  const events: Array<{
    date: string | null | undefined;
    label: string;
    icon: React.ElementType;
    status: 'completed' | 'pending' | 'future';
  }> = [
    { date: app.receivedDate, label: 'Application Received', icon: FileInput, status: 'completed' },
    { date: app.fiRequestDate, label: 'Further Information Requested', icon: FileQuestion, status: 'completed' },
    { date: app.fiRecDate, label: 'Further Information Received', icon: FileCheck, status: 'completed' },
    { date: app.decisionDate, label: 'Council Decision Made', icon: Gavel, status: 'completed' },
    { date: app.decisionDueDate, label: 'Decision Due Date', icon: Calendar, status: app.decisionDate ? 'completed' : 'pending' },
    { date: app.grantDate, label: 'Permission Granted', icon: BadgeCheck, status: 'completed' },
    { date: app.expiryDate, label: 'Permission Expiry', icon: Timer, status: 'future' },
    { date: app.withdrawnDate, label: 'Application Withdrawn', icon: XCircle, status: 'completed' },
    { date: app.appealSubmittedDate, label: 'Appeal Submitted to ABP', icon: Scale, status: 'completed' },
    { date: app.appealDecisionDate, label: 'ABP Decision', icon: Gavel, status: 'completed' },
  ];

  if (bcmsNotices && bcmsNotices.length > 0) {
    const bcms = bcmsNotices[0];
    if (bcms.commencementDate) {
      events.push({ date: bcms.commencementDate, label: 'Work Commenced (BCMS)', icon: Construction, status: 'completed' });
    }
    if (bcms.completionCertDate) {
      events.push({ date: bcms.completionCertDate, label: 'Work Completed (BCMS)', icon: Building2, status: 'completed' });
    }
  }

  const filteredEvents = events
    .filter((e) => e.date)
    .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime()) as TimelineEvent[];

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-foreground">Timeline Summary</h3>
          <p className="mt-2 text-sm text-foreground-muted">
            This application was received on {formatDateLong(app.receivedDate)}.
            {app.decision && app.decision !== 'N/A' && app.decision !== 'UNKNOWN' &&
              ` A decision was made on ${formatDateLong(app.decisionDate)}: ${app.displayDecision ?? app.decision}.`}
            {app.appealRefNumber && ' The application was appealed to An Bord Pleanala.'}
          </p>
        </CardContent>
      </Card>

      {/* Event Timeline */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-foreground">Complete Event Timeline</h3>
          {filteredEvents.length > 0 ? (
            <div className="mt-3 space-y-0">
              {filteredEvents.map((event) => {
                const Icon = event.icon;
                return (
                  <div
                    key={`${event.label}-${event.date}`}
                    className="flex items-center justify-between border-b border-border-muted py-2.5 last:border-b-0"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 text-foreground-subtle" />
                      <span className="text-sm font-medium text-foreground">{event.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-foreground-muted">{formatDateLong(event.date)}</span>
                      <Badge
                        variant={
                          event.status === 'completed' ? 'granted' :
                          event.status === 'pending' ? 'pending' :
                          'secondary'
                        }
                        className="text-[10px]"
                      >
                        {event.status === 'completed' ? 'Completed' :
                         event.status === 'pending' ? 'Pending' : 'Future'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-3 text-center text-sm text-foreground-muted">
              No history events available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function TimelineSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-36" />
            </div>
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
