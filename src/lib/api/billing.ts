import { apiClient } from './client';
import type { BillingEntrypointResponse } from '@/lib/types/phase5';

export const billingApi = {
  getEntrypoint: async (returnUrl?: string): Promise<BillingEntrypointResponse> => {
    const { data } = await apiClient.post<BillingEntrypointResponse>(
      '/users/billing/entrypoint',
      { returnUrl },
    );
    return data;
  },
};
