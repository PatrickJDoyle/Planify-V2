'use client';

import { useAuth } from '@clerk/nextjs';
import { CreditCard, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { billingApi } from '@/lib/api/billing';

export default function BillingPage() {
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Authentication required');

      const returnUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/billing`
          : undefined;

      const { url } = await billingApi.getEntrypoint(returnUrl);
      if (url) window.location.href = url;
      else throw new Error('No redirect URL returned');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to access billing';
      if (typeof window !== 'undefined') {
        alert(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="mb-6 text-xl font-semibold text-foreground">Billing</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-foreground-muted">
            Manage your Planify subscription, payment methods, and billing
            history through the Stripe Customer Portal.
          </p>
          <Button
            onClick={handleManageSubscription}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            {isLoading ? 'Loading...' : 'Open Stripe Customer Portal'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
