'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, X, Share2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge, DecisionBadge, AppealBadge } from '@/components/shared/status-badge';
import { FavoriteButton } from '@/components/shared/favorite-button';
import { formatAddress, formatDescription } from '@/lib/utils/formatting';
import { formatDate } from '@/lib/utils/dates';
import type { Application } from '@/lib/types/application';
import type { ZoningData } from '@/lib/api/zoning';

interface ApplicationHeaderProps {
  application: Application;
  zoning?: ZoningData | null;
}

export function ApplicationHeader({ application: app, zoning }: ApplicationHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/applications/${app.applicationId}`;
    if (navigator.share) {
      await navigator.share({ title: `Application ${app.applicationNumber}`, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <div className="border-b border-border bg-surface">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm text-foreground-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to results
        </button>

        <div className="flex items-center gap-2">
          <div onClick={(e) => e.stopPropagation()}>
            <FavoriteButton applicationId={app.applicationId} />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleShare}>
            <Share2 className="h-3.5 w-3.5" />
            Share
          </Button>
          {app.linkApplicationDetails && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => window.open(app.linkApplicationDetails, '_blank')}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Council Site
            </Button>
          )}
          <button
            onClick={handleBack}
            className="flex h-8 w-8 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-background-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Application info */}
      <div className="px-6 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge displayStatus={app.displayStatus} statusCategory={app.statusCategory} />
          <DecisionBadge decision={app.decision} displayDecision={app.displayDecision} />
          <AppealBadge appealDecision={app.appealDecision} />
          {zoning && (
            <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-primary dark:bg-brand-900">
              Zone: {zoning.zoneGzt}
            </span>
          )}
        </div>

        <div className="mt-2 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-foreground">
              {formatAddress(app.formattedAddress ?? app.developmentAddress, 120)}
            </h1>
            <p className="mt-0.5 text-sm text-foreground-muted">
              {formatDescription(app.formattedDescription ?? app.developmentDescription, 200)}
            </p>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground-muted">
          <span>{app.planningAuthority}</span>
          <span className="text-foreground-subtle">|</span>
          <span>Ref: {app.applicationNumber}</span>
          <span className="text-foreground-subtle">|</span>
          <span>Received: {formatDate(app.receivedDate)}</span>
          {app.applicationType && (
            <>
              <span className="text-foreground-subtle">|</span>
              <span>{app.displayApplicationType ?? app.applicationType}</span>
            </>
          )}
        </div>

        {/* Keywords */}
        {app.matchedKeywords?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
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
      </div>
    </div>
  );
}
