import { apiClient } from './client';
import type { UserProfile } from '@/lib/types/user';

export const usersApi = {
  getProfile: async (): Promise<UserProfile> => {
    const { data } = await apiClient.get<UserProfile>('/users/profile');

    // Normalize snake_case from backend to camelCase
    return {
      ...data,
      locations: (data as any).user_locations ?? (data as any).locations ?? data.locations ?? [],
      keywords: (data as any).user_keywords ?? (data as any).keywords ?? data.keywords ?? [],
    };
  },

  getBillingUrl: async (): Promise<string> => {
    const { data } = await apiClient.post<{ url: string }>('/users/billing/entrypoint');
    return data.url;
  },
};
