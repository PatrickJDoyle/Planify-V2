import { apiClient } from './client';
import type { Application } from '@/lib/types/application';
import type { PaginatedResponse } from '@/lib/types/api';

export const favoritesApi = {
  list: async (page = 1, pageSize = 16): Promise<PaginatedResponse<Application>> => {
    const { data } = await apiClient.get<PaginatedResponse<Application>>(
      '/applications/favorites',
      { params: { page, pageSize } },
    );
    return data;
  },

  check: async (applicationId: number): Promise<boolean> => {
    const { data } = await apiClient.get<{ isFavorited: boolean }>(
      `/applications/favorites/check/${applicationId}`,
    );
    return data.isFavorited;
  },

  add: async (applicationId: number, userId: string): Promise<void> => {
    await apiClient.post('/applications/favorites', { applicationId, userId });
  },

  remove: async (applicationId: number, userId: string): Promise<void> => {
    await apiClient.delete('/applications/favorites', {
      data: { applicationId, userId },
    });
  },
};
