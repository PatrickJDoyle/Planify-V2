'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Calendar,
  CheckCircle2,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetUser } from '@/lib/queries/user';
import { billingApi } from '@/lib/api/billing';
import { TIER_LIMITS } from '@/lib/types/user';
import type { SubscriptionTier } from '@/lib/types/user';
import { cn } from '@/lib/utils';

const TIER_LABELS: Record<SubscriptionTier, string> = {
  free: 'Free',
  personal: 'Personal',
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

  const handleManage = async () => {
    setLoading(true);
    try {
      const { url } = await billingApi.getEntrypoint(window.location.href);
      window.location.href = url;
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
                {tier === 'free' ? 'Free forever' : 'Active'}
              </Badge>
            </div>
          </div>
          {tier !== 'free' && (
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

export function BillingPageContent() {
  const router = useRouter();
  const { data: user, isLoading } = useGetUser();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const tier = (user?.subscriptionTier ?? 'free') as SubscriptionTier;

  return (
    <div className="space-y-6">
      <CurrentPlanCard tier={tier} />

      {tier === 'free' && (
        <Card className="border-brand-500/30 bg-brand-500/5">
          <CardContent className="flex items-start gap-4 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500/15">
              <AlertTriangle className="h-5 w-5 text-brand-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Unlock the full platform</p>
              <p className="mt-1 text-sm text-foreground-muted">
                You&apos;re on the free plan. Upgrade to access nationwide coverage, unlimited alerts, pre-planning reports, document intelligence, and more.
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

      {tier !== 'free' && (
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
                {user?.subscriptionStartDate
                  ? new Date(user.subscriptionStartDate).toLocaleDateString('en-IE', {
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
