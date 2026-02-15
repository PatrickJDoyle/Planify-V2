'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api/reports';
import type { PrePlanningGeneratePayload } from '@/lib/types/phase5';
import { queryKeys } from './keys';

export function useNearbyApplications(
  latitude: number | null,
  longitude: number | null,
  radius: number,
) {
  return useQuery({
    queryKey: queryKeys.reports.nearby(latitude ?? 0, longitude ?? 0, radius),
    queryFn: () =>
      reportsApi.getNearbyApplications({
        latitude: latitude ?? 0,
        longitude: longitude ?? 0,
        radius,
      }),
    enabled: latitude !== null && longitude !== null,
    staleTime: 30_000,
  });
}

export function useOptimalRadius(latitude: number | null, longitude: number | null) {
  return useQuery({
    queryKey: queryKeys.reports.optimal(latitude ?? 0, longitude ?? 0),
    queryFn: () =>
      reportsApi.getOptimalRadius({
        latitude: latitude ?? 0,
        longitude: longitude ?? 0,
      }),
    enabled: latitude !== null && longitude !== null,
    staleTime: 5 * 60_000,
  });
}

export function useComputePrePlanningStats() {
  return useMutation({
    mutationFn: (payload: PrePlanningGeneratePayload) => reportsApi.computeStats(payload),
  });
}

export function useGeneratePrePlanningReport() {
  return useMutation({
    mutationFn: (payload: PrePlanningGeneratePayload) => reportsApi.generate(payload),
  });
}
