'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Calendar,
  CheckCircle2,
  ExternalLink,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/lib/queries/user';
import { useAlerts } from '@/lib/queries/alerts';
import { useFavorites } from '@/lib/queries/favorites';
import { billingApi } from '@/lib/api/billing';
import { TIER_LIMITS } from '@/lib/types/user';
import type { SubscriptionTier } from '@/lib/types/user';
import { cn } from '@/lib/utils';

const TIER_LABELS: Record<SubscriptionTier, string> = {
  free: 'Free',
  personal: 'Personal (Free)',
  enterprise: 'Enterprise',
};

const TIER_COLORS: Record<SubscriptionTier, string> = {
  free: 'bg-background-muted text-foreground-muted',
  personal: 'bg-blue-500/10 text-blue-600',
  enterprise: 'bg-brand-500/10 text-brand-500',
};

function CurrentPlanCard({ tier }: { tier: SubscriptionTier }) {
  const limits = TIER_LIMITS[tier];
  const [loading, setLoading] = React.useState(false);
  const [errorText, setErrorText] = React.useState('');

  const handleManage = async () => {
    setLoading(true);
    setErrorText('');
    try {
      const { url } = await billingApi.getEntrypoint(window.location.href);
      window.location.href = url;
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : 'Unable to open billing portal right now.');
    } finally {
      setLoading(false);
    }
  };

  const items = [
    { label: 'Alerts', value: limits.maxAlerts === null ? 'Unlimited' : `Up to ${limits.maxAlerts}` },
    { label: 'Saved projects', value: limits.maxFavourites === null ? 'Unlimited' : `Up to ${limits.maxFavourites}` },
    { label: 'Alert radius', value: limits.maxAlertRadius === null ? 'Unlimited' : `${limits.maxAlertRadius}km max` },
    { label: 'Nationwide access', value: limits.hasNationwideAccess ? 'Yes' : 'No' },
    { label: 'Pre-planning reports', value: limits.canUsePrePlanning ? 'Yes' : 'No' },
    { label: 'Export (PDF/CSV)', value: limits.canExport ? 'Yes' : 'No' },
  ];
  const isPaidTier = tier === 'enterprise';

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
              Current Plan
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">
                {TIER_LABELS[tier]}
              </h2>
              <Badge className={cn('text-xs', TIER_COLORS[tier])}>
                {isPaidTier ? 'Active' : 'Free plan'}
              </Badge>
            </div>
          </div>
          {isPaidTier && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleManage}
              disabled={loading}
              className="gap-1.5"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Manage
            </Button>
          )}
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="pt-4">
        {errorText && (
          <p className="mb-3 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {errorText}
          </p>
        )}
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map(({ label, value }) => (
            <div key={label} className="space-y-0.5">
              <dt className="text-xs text-foreground-muted">{label}</dt>
              <dd className="text-sm font-medium text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function UsageRow({
  label,
  used,
  limit,
  unavailableText,
}: {
  label: string;
  used: number | null;
  limit: number | null;
  unavailableText?: string;
}) {
  if (used === null) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground-muted">{label}</span>
          <span className="text-xs text-foreground-subtle">{unavailableText ?? 'Unavailable'}</span>
        </div>
      </div>
    );
  }

  const isUnlimited = limit === null;
  const ratio = isUnlimited || limit <= 0 ? 0 : Math.min((used / limit) * 100, 100);
  const isWarning = !isUnlimited && ratio >= 80;
  const isAtLimit = !isUnlimited && ratio >= 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-foreground-muted">{label}</span>
        <span className={cn('text-xs font-medium', isAtLimit ? 'text-destructive' : isWarning ? 'text-amber-500' : 'text-foreground-muted')}>
          {isUnlimited ? `${used} used` : `${used} / ${limit}`}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-1.5 overflow-hidden rounded-full bg-background-muted">
          <div
            className={cn('h-full rounded-full transition-all', isAtLimit ? 'bg-destructive' : isWarning ? 'bg-amber-500' : 'bg-brand-500')}
            style={{ width: `${ratio}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function BillingPageContent() {
  const router = useRouter();
  const { profile, isLoading, tier: rawTier } = useUserProfile();
  const tier = (rawTier ?? 'free') as SubscriptionTier;
  const canLoadAlertsUsage = tier !== 'free';
  const {
    data: alerts,
    isLoading: alertsLoading,
    error: alertsError,
    refetch: refetchAlerts,
    isFetching: isRefetchingAlerts,
  } = useAlerts(undefined, { enabled: !isLoading && canLoadAlertsUsage });
  const {
    data: favorites,
    isLoading: favoritesLoading,
    error: favoritesError,
    refetch: refetchFavorites,
    isFetching: isRefetchingFavorites,
  } = useFavorites(1, 16);

  if (isLoading || favoritesLoading || (canLoadAlertsUsage && alertsLoading)) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const limits = TIER_LIMITS[tier];
  const hasUsageError = Boolean(favoritesError || alertsError);
  const alertsUsed = canLoadAlertsUsage ? alerts?.length ?? 0 : null;
  const favoritesUsed = favorites?.total ?? 0;
  const keywordsUsed = profile?.keywords?.length ?? 0;
  const locationsUsed = profile?.locations?.length ?? 0;

  return (
    <div className="space-y-6">
      <CurrentPlanCard tier={tier} />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-foreground">Usage Summary</h3>
            {hasUsageError && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-foreground-muted"
                onClick={() => {
                  void refetchFavorites();
                  if (canLoadAlertsUsage) void refetchAlerts();
                }}
                disabled={isRefetchingAlerts || isRefetchingFavorites}
              >
                <RefreshCw className={cn('h-3.5 w-3.5', (isRefetchingAlerts || isRefetchingFavorites) && 'animate-spin')} />
                Retry
              </Button>
            )}
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="space-y-4 pt-4">
          {hasUsageError && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {(favoritesError as Error)?.message || (alertsError as Error)?.message || 'Failed to load usage metrics.'}
            </div>
          )}
          <UsageRow
            label="Active alerts"
            used={alertsUsed}
            limit={limits.maxAlerts}
            unavailableText="Available on paid plans"
          />
          <UsageRow
            label="Saved projects"
            used={favoritesUsed}
            limit={limits.maxFavourites}
          />
          <UsageRow
            label="Saved locations"
            used={locationsUsed}
            limit={limits.maxLocations}
          />
          <UsageRow
            label="Keywords"
            used={keywordsUsed}
            limit={limits.maxKeywords}
          />
        </CardContent>
      </Card>

      {tier !== 'enterprise' && (
        <Card className="border-brand-500/30 bg-brand-500/5">
          <CardContent className="flex items-start gap-4 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500/15">
              <AlertTriangle className="h-5 w-5 text-brand-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Unlock the full platform</p>
              <p className="mt-1 text-sm text-foreground-muted">
                Upgrade to Enterprise for nationwide coverage, unlimited alerts, document intelligence, and export workflows.
              </p>
            </div>
            <Button
              size="sm"
              className="shrink-0 bg-brand-500 hover:bg-brand-600"
              onClick={() => router.push('/billing/plans')}
            >
              View Plans
            </Button>
          </CardContent>
        </Card>
      )}

      {tier === 'enterprise' && (
        <Card>
          <CardHeader className="pb-3">
            <h3 className="text-sm font-semibold text-foreground">Billing details</h3>
          </CardHeader>
          <Separator />
          <CardContent className="divide-y pt-0">
            <div className="flex items-center justify-between py-3.5">
              <div className="flex items-center gap-2.5">
                <CreditCard className="h-4 w-4 text-foreground-muted" />
                <span className="text-sm text-foreground">Payment method</span>
              </div>
              <span className="text-sm text-foreground-muted">Managed via Stripe</span>
            </div>
            <div className="flex items-center justify-between py-3.5">
              <div className="flex items-center gap-2.5">
                <Calendar className="h-4 w-4 text-foreground-muted" />
                <span className="text-sm text-foreground">Next billing date</span>
              </div>
              <span className="text-sm text-foreground-muted">
                {profile?.subscriptionStartDate
                  ? new Date(profile.subscriptionStartDate).toLocaleDateString('en-IE', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between py-3.5">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-foreground-muted" />
                <span className="text-sm text-foreground">Status</span>
              </div>
              <Badge className="bg-status-granted/10 text-status-granted">Active</Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
