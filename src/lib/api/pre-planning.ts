import { apiClient } from './client';

const PRE_PLANNING_BASE = '/pre-planning';

export const prePlanningApi = {
  getNearbyApplications: (params: {
    latitude: number;
    longitude: number;
    radius?: number;
    page?: number;
    pageSize?: number;
  }) => {
    const search = new URLSearchParams();
    search.set('latitude', String(params.latitude));
    search.set('longitude', String(params.longitude));
    if (params.radius != null) search.set('radius', String(params.radius));
    if (params.page != null) search.set('page', String(params.page));
    if (params.pageSize != null) search.set('pageSize', String(params.pageSize));
    return apiClient
      .get<{ data: unknown[]; total: number }>(
        `${PRE_PLANNING_BASE}/nearby-applications?${search.toString()}`,
      )
      .then((r) => r.data);
  },

  getOptimalRadius: (params: {
    latitude: number;
    longitude: number;
  }) => {
    const search = new URLSearchParams();
    search.set('latitude', String(params.latitude));
    search.set('longitude', String(params.longitude));
    return apiClient
      .get<{ optimalRadius: number; applicationCount: number }>(
        `${PRE_PLANNING_BASE}/optimal-radius?${search.toString()}`,
      )
      .then((r) => r.data);
  },

  streamReport: (data: {
    latitude: number;
    longitude: number;
    address: string;
    applications: unknown[];
  }) => {
    return apiClient.post(
      `${PRE_PLANNING_BASE}/stream-report`,
      data,
      {
        responseType: 'text',
        headers: {
          Accept: 'text/event-stream',
        },
      },
    );
  },
};
