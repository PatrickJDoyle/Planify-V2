import { apiClient } from './client';
import type {
  PrePlanningGeneratePayload,
  PrePlanningStatsResponse,
} from '@/lib/types/phase5';

export interface NearbyApplicationsParams {
  latitude: number;
  longitude: number;
  radius?: number;
}

export interface OptimalRadiusResponse {
  initialCount: number;
  adjustedRadius: number;
  applications: unknown[];
}

export const reportsApi = {
  getNearbyApplications: async ({
    latitude,
    longitude,
    radius,
  }: NearbyApplicationsParams): Promise<unknown[]> => {
    const { data } = await apiClient.get<unknown>('/pre-planning/nearby-applications', {
      params: { latitude, longitude, radius },
    });
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      const payload = data as { applications?: unknown[]; data?: unknown[] };
      if (Array.isArray(payload.applications)) return payload.applications;
      if (Array.isArray(payload.data)) return payload.data;
    }
    return [];
  },

  getOptimalRadius: async ({
    latitude,
    longitude,
  }: Omit<NearbyApplicationsParams, 'radius'>): Promise<OptimalRadiusResponse> => {
    const { data } = await apiClient.get<OptimalRadiusResponse>('/pre-planning/optimal-radius', {
      params: { latitude, longitude },
    });
    return {
      initialCount: data?.initialCount ?? 0,
      adjustedRadius: data?.adjustedRadius ?? 500,
      applications: Array.isArray(data?.applications) ? data.applications : [],
    };
  },

  computeStats: async (payload: PrePlanningGeneratePayload): Promise<PrePlanningStatsResponse> => {
    const { data } = await apiClient.post<PrePlanningStatsResponse>(
      '/pre-planning/compute-stats',
      payload,
    );
    return data;
  },

  generate: async (payload: PrePlanningGeneratePayload): Promise<{ content: string }> => {
    const { data } = await apiClient.post<{ content: string }>(
      '/pre-planning/generate-report',
      payload,
    );
    return data;
  },
};
