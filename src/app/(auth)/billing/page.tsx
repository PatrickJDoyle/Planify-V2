'use client';

import React from 'react';
import { ArrowRight, CreditCard, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBillingEntrypoint } from '@/lib/queries/billing';
import { useUserProfile } from '@/lib/queries/user';

export default function BillingPage() {
  const { profile, limits, tier } = useUserProfile();
  const billingMutation = useBillingEntrypoint();

  const openBilling = async () => {
    const returnUrl = typeof window !== 'undefined' ? `${window.location.origin}/billing` : undefined;
    const response = await billingMutation.mutateAsync(returnUrl);
    if (typeof window !== 'undefined') {
      window.location.href = response.url;
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-foreground">Billing & Subscription</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Manage upgrades, payment details, invoices, and your active plan.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Plan details synced from your account profile.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-background-subtle p-3">
                <p className="text-xs text-foreground-muted">Tier</p>
                <p className="mt-1 text-lg font-semibold capitalize">{tier}</p>
              </div>
              <div className="rounded-lg border border-border bg-background-subtle p-3">
                <p className="text-xs text-foreground-muted">Account</p>
                <p className="mt-1 text-lg font-semibold">{profile?.email ?? 'Unknown'}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-foreground-muted">Max Alerts</p>
                <p className="mt-1 font-semibold">{limits.maxAlerts ?? 'Unlimited'}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-foreground-muted">Max Favourites</p>
                <p className="mt-1 font-semibold">{limits.maxFavourites ?? 'Unlimited'}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-foreground-muted">Max Keywords</p>
                <p className="mt-1 font-semibold">{limits.maxKeywords ?? 'Unlimited'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manage in Stripe</CardTitle>
            <CardDescription>Secure checkout or customer portal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" onClick={openBilling} disabled={billingMutation.isPending}>
              <CreditCard className="mr-2 h-4 w-4" />
              {billingMutation.isPending ? 'Opening...' : 'Open Billing'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-xs text-foreground-muted">
              We route you automatically to upgrade checkout or portal management depending on your subscription.
            </p>
            <div className="flex items-center gap-2 rounded-md border border-border p-2 text-xs text-foreground-muted">
              <ShieldCheck className="h-4 w-4 text-brand-500" />
              Stripe-hosted secure payment and invoice workflows.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
