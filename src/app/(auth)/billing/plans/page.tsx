'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
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
    name: 'Personal',
    price: 29,
    interval: 'month',
    description: 'For homeowners and small developers tracking local activity.',
    badge: 'Most popular',
    highlighted: true,
    cta: 'Upgrade to Personal',
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
    price: null,
    priceLabel: 'Custom pricing',
    interval: 'custom',
    description: 'For planning professionals, architects, and development firms.',
    cta: 'Contact sales',
    ctaVariant: 'outline',
    features: [
      'Everything in Personal',
      'Nationwide coverage',
      'Unlimited alerts & saved projects',
      'AI document intelligence',
      'PDF & CSV export',
      'Keywords-based alerting',
      'Organisation profiles',
      'Admin panel & team management',
      'Priority support & SLA',
    ],
  },
];

export default function PlansPage() {
  const router = useRouter();
  const { tier } = useUserProfile();
  const [loading, setLoading] = useState(false);

  const handleSelect = async (tierId: string) => {
    if (tierId === 'free' || tierId === tier) return;

    if (tierId === 'enterprise') {
      window.open('mailto:sales@planify.ie?subject=Enterprise Plan Enquiry', '_blank');
      return;
    }

    setLoading(true);
    try {
      const { url } = await billingApi.getEntrypoint(window.location.href);
      window.location.href = url;
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

      <p className="text-center text-xs text-foreground-muted">
        All prices exclude VAT. Cancel anytime. Enterprise plans include a custom contract and SLA.
      </p>
    </div>
  );
}
