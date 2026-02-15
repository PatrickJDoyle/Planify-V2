import { apiClient } from './client';

export const billingApi = {
  getEntrypoint: (returnUrl?: string) =>
    apiClient
      .post<{ url: string; type: 'checkout' | 'portal' }>(
        '/users/billing/entrypoint',
        { returnUrl: returnUrl ?? typeof window !== 'undefined' ? window.location.origin : undefined },
      )
      .then((r) => r.data),
};
