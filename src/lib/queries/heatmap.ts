'use client';

import { useQuery } from '@tanstack/react-query';
import { heatmapApi } from '@/lib/api/heatmap';
import type { HeatmapBounds } from '@/lib/types/phase5';
import { queryKeys } from './keys';

function boundsToKey(bounds?: HeatmapBounds) {
  if (!bounds) return 'none';
  return `${bounds.north}:${bounds.south}:${bounds.east}:${bounds.west}`;
}

export function useHeatmapApplications(months: number, bounds?: HeatmapBounds) {
  return useQuery({
    queryKey: queryKeys.heatmap.applications(months, boundsToKey(bounds)),
    queryFn: () => heatmapApi.getApplications(months, bounds),
    staleTime: 60_000,
  });
}

export function useHeatmapCommencements(months: number, bounds?: HeatmapBounds) {
  return useQuery({
    queryKey: queryKeys.heatmap.commencements(months, boundsToKey(bounds)),
    queryFn: () => heatmapApi.getCommencements(months, bounds),
    staleTime: 60_000,
  });
}

export function useHeatmapSales(months: number, bounds?: HeatmapBounds) {
  return useQuery({
    queryKey: queryKeys.heatmap.sales(months, boundsToKey(bounds)),
    queryFn: () => heatmapApi.getSales(months, bounds),
    staleTime: 60_000,
  });
}
