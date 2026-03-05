'use client';

import React from 'react';
import { Check, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface PricingTier {
  id: string;
  name: string;
  price: number | null;
  priceLabel?: string;
  interval: 'month' | 'year' | 'custom';
  description: string;
  badge?: string;
  highlighted?: boolean;
  features: string[];
  cta: string;
  ctaVariant?: 'default' | 'outline';
}

interface PricingCardProps {
  tier: PricingTier;
  currentTier?: string;
  onSelect: (tierId: string) => void;
  isLoading?: boolean;
}

export function PricingCard({ tier, currentTier, onSelect, isLoading }: PricingCardProps) {
  const isCurrent = currentTier === tier.id;

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-xl border p-6 transition-shadow',
        tier.highlighted
          ? 'border-brand-500 bg-brand-500/5 shadow-lg shadow-brand-500/10'
          : 'border-border bg-surface hover:shadow-md',
      )}
    >
      {tier.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-brand-500 px-3 py-0.5 text-xs font-semibold text-white shadow-sm">
            {tier.badge}
          </Badge>
        </div>
      )}

      {isCurrent && (
        <div className="absolute -top-3 right-4">
          <Badge variant="outline" className="border-border bg-background text-xs text-foreground-muted">
            Current plan
          </Badge>
        </div>
      )}

      {/* Name + price */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          {tier.highlighted && (
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-500">
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
          )}
          <h3 className="text-base font-semibold text-foreground">{tier.name}</h3>
        </div>

        <div className="mt-3 flex items-end gap-1">
          {tier.price !== null ? (
            <>
              <span className="text-3xl font-bold tracking-tight text-foreground">
                €{tier.price}
              </span>
              <span className="mb-1 text-sm text-foreground-muted">/{tier.interval}</span>
            </>
          ) : (
            <span className="text-2xl font-bold text-foreground">
              {tier.priceLabel ?? 'Contact us'}
            </span>
          )}
        </div>

        <p className="mt-2 text-sm text-foreground-muted">{tier.description}</p>
      </div>

      {/* CTA */}
      <Button
        variant={tier.ctaVariant ?? 'default'}
        className={cn(
          'w-full',
          tier.highlighted && tier.ctaVariant !== 'outline' && 'bg-brand-500 hover:bg-brand-600',
        )}
        onClick={() => onSelect(tier.id)}
        disabled={isCurrent || isLoading}
      >
        {isCurrent ? 'Current Plan' : tier.cta}
      </Button>

      {/* Feature list */}
      <ul className="mt-6 space-y-2.5">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <div
              className={cn(
                'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                tier.highlighted ? 'bg-brand-500/15 text-brand-500' : 'bg-background-muted text-foreground-muted',
              )}
            >
              <Check className="h-2.5 w-2.5" />
            </div>
            <span className="text-sm text-foreground-muted">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
