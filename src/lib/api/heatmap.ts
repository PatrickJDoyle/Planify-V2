import { apiClient } from './client';

export interface HeatmapDataPoint {
  coordinates: [number, number];
  weight: number;
}

export const heatmapApi = {
  getApplications: (params: { months: string; north?: number; south?: number; east?: number; west?: number }) => {
    const search = new URLSearchParams();
    search.set('months', params.months);
    if (params.north != null) search.set('north', String(params.north));
    if (params.south != null) search.set('south', String(params.south));
    if (params.east != null) search.set('east', String(params.east));
    if (params.west != null) search.set('west', String(params.west));
    return apiClient
      .get<HeatmapDataPoint[]>(`/heatmap/applications?${search.toString()}`)
      .then((r) => r.data);
  },
  getCommencements: (params: { months: string; north?: number; south?: number; east?: number; west?: number }) => {
    const search = new URLSearchParams();
    search.set('months', params.months);
    if (params.north != null) search.set('north', String(params.north));
    if (params.south != null) search.set('south', String(params.south));
    if (params.east != null) search.set('east', String(params.east));
    if (params.west != null) search.set('west', String(params.west));
    return apiClient
      .get<HeatmapDataPoint[]>(`/heatmap/commencements?${search.toString()}`)
      .then((r) => r.data);
  },
  getSales: (params: { months: string; north?: number; south?: number; east?: number; west?: number }) => {
    const search = new URLSearchParams();
    search.set('months', params.months);
    if (params.north != null) search.set('north', String(params.north));
    if (params.south != null) search.set('south', String(params.south));
    if (params.east != null) search.set('east', String(params.east));
    if (params.west != null) search.set('west', String(params.west));
    return apiClient
      .get<HeatmapDataPoint[]>(`/heatmap/sales?${search.toString()}`)
      .then((r) => r.data);
  },
};
