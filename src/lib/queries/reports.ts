'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api/reports';
import { reportJobsApi, waitForPrePlanningJob } from '@/lib/api/report-jobs';
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

export type RunPrePlanningReportJobVariables = PrePlanningGeneratePayload & {
  pollSignal?: AbortSignal;
};

/** Creates a persistent report job and polls until HTML is available (same rows as Report History). */
export function useRunPrePlanningReportJob() {
  return useMutation({
    mutationFn: async (variables: RunPrePlanningReportJobVariables) => {
      const { pollSignal, ...payload } = variables;
      const { jobId } = await reportJobsApi.createPrePlanningJob(payload);
      const job = await waitForPrePlanningJob(jobId, { signal: pollSignal });
      const content = job.combinedHtml ?? job.narrativeHtml ?? '';
      if (!content.trim()) {
        throw new Error(
          'Report completed but no content was saved. Try Report History or generate again.',
        );
      }
      return { content, jobId };
    },
  });
}
