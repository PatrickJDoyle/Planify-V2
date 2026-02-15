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
    const { data } = await apiClient.get<unknown[]>('/pre-planning/nearby-applications', {
      params: { latitude, longitude, radius },
    });
    return data;
  },

  getOptimalRadius: async ({
    latitude,
    longitude,
  }: Omit<NearbyApplicationsParams, 'radius'>): Promise<OptimalRadiusResponse> => {
    const { data } = await apiClient.get<OptimalRadiusResponse>('/pre-planning/optimal-radius', {
      params: { latitude, longitude },
    });
    return data;
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
