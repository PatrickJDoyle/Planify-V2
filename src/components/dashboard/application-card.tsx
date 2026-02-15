'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { StatusBadge, DecisionBadge, AppealBadge } from '@/components/shared/status-badge';
import { FavoriteButton } from '@/components/shared/favorite-button';
import { formatDate, calculateSubmissionDeadline } from '@/lib/utils/dates';
import { formatAddress, formatDescription, formatDistance } from '@/lib/utils/formatting';
import { useDashboardStore } from '@/lib/stores/dashboard-store';
import type { Application } from '@/lib/types/application';

interface ApplicationCardProps {
  application: Application;
}

export function ApplicationCard({ application: app }: ApplicationCardProps) {
  const router = useRouter();
  const { setScrollPosition, setSelectedApplicationId } = useDashboardStore();

  const handleClick = () => {
    setScrollPosition(window.scrollY);
    setSelectedApplicationId(app.applicationId);
    router.push(`/applications/${app.applicationId}`);
  };

  return (
    <Card
      className="group cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
      onClick={handleClick}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <StatusBadge
                displayStatus={app.displayStatus}
                statusCategory={app.statusCategory}
              />
              <DecisionBadge
                decision={app.decision}
                displayDecision={app.displayDecision}
              />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              {app.planningAuthority}
            </h3>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <FavoriteButton applicationId={app.applicationId} />
          </div>
        </div>

        {/* Keywords */}
        {app.matchedKeywords?.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {app.matchedKeywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200"
              >
                {kw}
              </span>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-4 pt-0">
        {/* Address */}
        <p className="font-medium text-foreground">
          {formatAddress(app.formattedAddress ?? app.developmentAddress, 50)}
        </p>

        {/* Description */}
        <p className="mt-1 text-sm text-foreground-muted">
          {formatDescription(app.formattedDescription ?? app.developmentDescription, 100)}
        </p>

        {/* Distance */}
        {app.distanceKm !== undefined && (
          <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-1 dark:bg-brand-900">
            <MapPin className="h-3 w-3 text-primary" />
            <span className="text-xs font-medium text-primary">
              {formatDistance(app.distanceKm)} away
            </span>
          </div>
        )}

        {/* Dates grid */}
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-border-muted pt-3">
          <div>
            <span className="text-xs text-foreground-subtle">Received</span>
            <p className="text-sm text-foreground">{formatDate(app.receivedDate)}</p>
          </div>
          <div>
            <span className="text-xs text-foreground-subtle">Submissions By</span>
            <p className="text-sm text-foreground">{calculateSubmissionDeadline(app.receivedDate)}</p>
          </div>
          <div>
            <span className="text-xs text-foreground-subtle">
              {app.decisionDate ? 'Decision Made' : 'Decision Due'}
            </span>
            <p className="text-sm text-foreground">
              {formatDate(app.decisionDate ?? app.decisionDueDate)}
            </p>
          </div>
          {app.appealDecisionDate && (
            <div>
              <span className="text-xs text-foreground-subtle">ABP Decision</span>
              <p className="text-sm text-foreground">{formatDate(app.appealDecisionDate)}</p>
            </div>
          )}
        </div>

        {/* Appeal badge */}
        {app.appealDecision && app.appealDecision !== 'N/A' && (
          <div className="mt-2">
            <AppealBadge appealDecision={app.appealDecision} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
