'use client';

import React from 'react';
import { BillingPageContent } from '@/components/billing/billing-page-content';

export default function BillingPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Billing & Subscription</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Manage your plan and billing details
        </p>
      </div>
      <BillingPageContent />
    </div>
  );
}
