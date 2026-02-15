'use client';

import { useMutation } from '@tanstack/react-query';
import { billingApi } from '@/lib/api/billing';

export function useBillingEntrypoint() {
  return useMutation({
    mutationFn: (returnUrl?: string) => billingApi.getEntrypoint(returnUrl),
  });
}
