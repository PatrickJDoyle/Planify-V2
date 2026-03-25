'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PricingCard } from '@/components/billing/pricing-card';
import type { PricingTier } from '@/components/billing/pricing-card';
import { useUserProfile } from '@/lib/queries/user';
import { billingApi } from '@/lib/api/billing';

const TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    description: 'Get started with core planning search across Irish councils.',
    cta: 'Get started',
    ctaVariant: 'outline',
    features: [
      'Search all public planning applications',
      'Basic map view',
      'Up to 3 saved projects',
      'Standard filters',
    ],
  },
  {
    id: 'personal',
    name: 'Personal (Free)',
    price: 0,
    interval: 'month',
    description: 'Free personal plan for homeowners and local monitoring.',
    badge: 'Most popular',
    highlighted: true,
    cta: 'Current free plan',
    features: [
      'Everything in Free',
      'Up to 10 alerts (radius up to 2km)',
      'Up to 50 saved projects',
      'Pre-planning report access',
      'Application timeline',
      'Document viewer',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 35,
    interval: 'month',
    description: 'For planning professionals, architects, and development firms.',
    cta: 'Upgrade to Enterprise',
    features: [
      'Everything in Personal',
      'Nationwide coverage',
      'Unlimited alerts & saved projects',
      'AI document intelligence',
      'PDF & CSV export',
      'Keywords-based alerting',
      'Organisation profiles',
      'Admin panel & team management',
      'Priority support',
    ],
  },
];

export default function PlansPage() {
  const router = useRouter();
  const { tier } = useUserProfile();
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');

  const handleSelect = async (tierId: string) => {
    setErrorText('');
    if (tierId === 'free' || tierId === 'personal' || tierId === tier) return;

    setLoading(true);
    try {
      const { url } = await billingApi.getEntrypoint(window.location.href);
      window.location.href = url;
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : 'Unable to open checkout right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.back()}
          className="mt-1 text-foreground-muted"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Choose your plan</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Unlock the full power of Planify for your practice or development firm.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {TIERS.map((t) => (
          <PricingCard
            key={t.id}
            tier={t}
            currentTier={tier}
            onSelect={handleSelect}
            isLoading={loading}
          />
        ))}
      </div>
      {errorText && (
        <div className="mx-auto flex w-full max-w-2xl items-center justify-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <AlertCircle className="h-3.5 w-3.5" />}
          {errorText}
        </div>
      )}

      <p className="text-center text-xs text-foreground-muted">
        All prices exclude VAT. Cancel anytime.
      </p>
    </div>
  );
}
