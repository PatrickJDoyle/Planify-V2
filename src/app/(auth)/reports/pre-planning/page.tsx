'use client';

import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Clock,
  MapPin,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { PrePlanningReportWizard } from '@/components/reports/pre-planning-wizard';
import { PaywallModal } from '@/components/billing/paywall-modal';
import { useUserProfile } from '@/lib/queries/user';
import { DEMO_LEGAL_DISCLAIMER } from '@/lib/demo-trust-copy';

const FEATURE_CARDS = [
  {
    icon: MapPin,
    title: 'Spatial context analysis',
    description: 'Understand what has been built and refused within your analysis radius over the past 5 years.',
  },
  {
    icon: FileText,
    title: 'AI-generated narrative',
    description: 'Natural language summary of planning trends, decision patterns, and risk factors.',
  },
  {
    icon: Clock,
    title: 'Decision timeline',
    description: 'See how long applications typically take to be decided in your area.',
  },
];

export default function PrePlanningReportPage() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const { limits, isPaid } = useUserProfile();

  const handleCreate = () => {
    if (!isPaid || !limits.canUsePrePlanning) {
      setPaywallOpen(true);
      return;
    }
    setWizardOpen(true);
  };

  return (
    <>
      <div className="mx-auto max-w-3xl space-y-8 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Pre-Planning Reports</h1>
            <p className="mt-1 text-sm text-foreground-muted">
              AI-powered intelligence reports for your development site
            </p>
          </div>
          <Button size="sm" className="gap-1.5 bg-brand-500 hover:bg-brand-600" onClick={handleCreate}>
            {!isPaid && <Lock className="h-3.5 w-3.5" />}
            <Plus className="h-3.5 w-3.5" />
            New Report
          </Button>
        </div>

        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground-muted">What&apos;s included</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {FEATURE_CARDS.map((card) => (
              <Card key={card.title}>
                <CardContent className="p-5">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10">
                    <card.icon className="h-4 w-4 text-brand-500" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{card.title}</p>
                  <p className="mt-1.5 text-xs text-foreground-muted">{card.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <EmptyState
          icon={FileText}
          title="No reports generated yet"
          description="Generate your first pre-planning intelligence report to understand the planning landscape around your site."
        >
          <Button size="sm" className="mt-4 gap-1.5 bg-brand-500 hover:bg-brand-600" onClick={handleCreate}>
            <Plus className="h-3.5 w-3.5" />
            Generate first report
          </Button>
        </EmptyState>

        <p className="mt-10 border-t border-border pt-6 text-center text-[11px] leading-relaxed text-foreground-muted">
          {DEMO_LEGAL_DISCLAIMER}
        </p>
      </div>

      <PrePlanningReportWizard open={wizardOpen} onOpenChange={setWizardOpen} />
      <PaywallModal
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        feature="Pre-Planning Reports"
        description="Pre-planning intelligence reports are available on Personal and Enterprise plans."
      />
    </>
  );
}
