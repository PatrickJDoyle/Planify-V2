'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadge, DecisionBadge, AppealBadge } from '@/components/shared/status-badge';
import { FavoriteButton } from '@/components/shared/favorite-button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, calculateSubmissionDeadline } from '@/lib/utils/dates';
import { formatAddress, formatDescription, formatDistance } from '@/lib/utils/formatting';
import { useDashboardStore } from '@/lib/stores/dashboard-store';
import type { Application } from '@/lib/types/application';

interface ResultsTableProps {
  applications: Application[];
  isLoading: boolean;
}

export function ResultsTable({ applications, isLoading }: ResultsTableProps) {
  const router = useRouter();
  const { setScrollPosition, setSelectedApplicationId } = useDashboardStore();
  const hasDistance = applications.some((app) => app.distanceKm !== undefined);

  const handleRowClick = (app: Application) => {
    setScrollPosition(window.scrollY);
    setSelectedApplicationId(app.applicationId);
    router.push(`/applications/${app.applicationId}`);
  };

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-border bg-background-subtle">
              <th className="w-10 px-3 py-3 text-center" />
              <th className="px-3 py-3 text-left font-medium text-foreground-muted">Status</th>
              <th className="px-3 py-3 text-left font-medium text-foreground-muted">Authority</th>
              <th className="min-w-[180px] px-3 py-3 text-left font-medium text-foreground-muted">Address</th>
              <th className="min-w-[200px] px-3 py-3 text-left font-medium text-foreground-muted">Description</th>
              <th className="px-3 py-3 text-left font-medium text-foreground-muted">Received</th>
              <th className="px-3 py-3 text-left font-medium text-foreground-muted">Submissions By</th>
              <th className="px-3 py-3 text-left font-medium text-foreground-muted">Decision</th>
              {hasDistance && (
                <th className="px-3 py-3 text-left font-medium text-foreground-muted">Distance</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {applications.map((app) => (
              <tr
                key={app.applicationId}
                onClick={() => handleRowClick(app)}
                className="cursor-pointer transition-colors hover:bg-background-subtle"
              >
                {/* Favorite */}
                <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                  <FavoriteButton applicationId={app.applicationId} />
                </td>

                {/* Status + Decision */}
                <td className="px-3 py-2.5">
                  <div className="flex flex-col gap-1.5">
                    <StatusBadge
                      displayStatus={app.displayStatus}
                      statusCategory={app.statusCategory}
                    />
                    <DecisionBadge
                      decision={app.decision}
                      displayDecision={app.displayDecision}
                    />
                    <AppealBadge appealDecision={app.appealDecision} />
                  </div>
                </td>

                {/* Authority */}
                <td className="px-3 py-2.5">
                  <span className="font-medium text-foreground">
                    {app.planningAuthority}
                  </span>
                  {app.matchedKeywords?.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {app.matchedKeywords.slice(0, 2).map((kw) => (
                        <span
                          key={kw}
                          className="inline-flex rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </td>

                {/* Address */}
                <td className="px-3 py-2.5">
                  <span className="font-medium text-foreground">
                    {formatAddress(app.formattedAddress ?? app.developmentAddress, 45)}
                  </span>
                </td>

                {/* Description */}
                <td className="px-3 py-2.5">
                  <span className="text-foreground-muted">
                    {formatDescription(app.formattedDescription ?? app.developmentDescription, 60)}
                  </span>
                </td>

                {/* Received */}
                <td className="whitespace-nowrap px-3 py-2.5 text-foreground-muted">
                  {formatDate(app.receivedDate)}
                </td>

                {/* Submissions By */}
                <td className="whitespace-nowrap px-3 py-2.5 text-foreground-muted">
                  {calculateSubmissionDeadline(app.receivedDate)}
                </td>

                {/* Decision date */}
                <td className="px-3 py-2.5">
                  <div className="flex flex-col gap-0.5 text-foreground-muted">
                    {app.decisionDate ? (
                      <>
                        <span className="text-xs font-medium text-foreground-muted">Made</span>
                        <span>{formatDate(app.decisionDate)}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-xs font-medium text-foreground-muted">Due</span>
                        <span>{formatDate(app.decisionDueDate)}</span>
                      </>
                    )}
                    {app.appealDecisionDate && (
                      <>
                        <span className="mt-0.5 text-xs font-medium text-foreground-muted">ABP</span>
                        <span>{formatDate(app.appealDecisionDate)}</span>
                      </>
                    )}
                  </div>
                </td>

                {/* Distance */}
                {hasDistance && (
                  <td className="whitespace-nowrap px-3 py-2.5">
                    {app.distanceKm !== undefined && (
                      <div className="flex items-center gap-1 text-primary">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="font-medium">{formatDistance(app.distanceKm)}</span>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="border-b border-border bg-background-subtle px-3 py-3">
        <div className="flex gap-6">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-20" />
          ))}
        </div>
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-border-muted px-3 py-3">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
