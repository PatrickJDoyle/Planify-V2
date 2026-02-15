import { apiClient } from './client';
import type { HeatmapBounds, HeatmapPoint } from '@/lib/types/phase5';

function buildBoundsParams(bounds?: HeatmapBounds) {
  if (!bounds) return {};
  return {
    north: bounds.north,
    south: bounds.south,
    east: bounds.east,
    west: bounds.west,
  };
}

export const heatmapApi = {
  getApplications: async (months = 12, bounds?: HeatmapBounds): Promise<HeatmapPoint[]> => {
    const { data } = await apiClient.get<HeatmapPoint[]>('/heatmap/applications', {
      params: { months, ...buildBoundsParams(bounds) },
    });
    return data;
  },

  getCommencements: async (months = 12, bounds?: HeatmapBounds): Promise<HeatmapPoint[]> => {
    const { data } = await apiClient.get<HeatmapPoint[]>('/heatmap/commencements', {
      params: { months, ...buildBoundsParams(bounds) },
    });
    return data;
  },

  getSales: async (months = 12, bounds?: HeatmapBounds): Promise<HeatmapPoint[]> => {
    const { data } = await apiClient.get<HeatmapPoint[]>('/heatmap/sales', {
      params: { months, ...buildBoundsParams(bounds) },
    });
    return data;
  },
};
