import { apiClient } from './client';
import type { PrePlanningGeneratePayload } from '@/lib/types/phase5';

export type ReportJobStatus = 'queued' | 'generating' | 'generated' | 'failed' | 'cancelled';

export interface ReportJobSummary {
  id: number;
  reportType: string;
  reportName?: string | null;
  reportStatus: ReportJobStatus;
  errorMessage?: string | null;
  address?: string | null;
  intentionCategory?: string | null;
  intentionSubCategory?: string | null;
  applicationCount: number;
  bcmsCount: number;
  propertySalesCount: number;
  generationTimeMs?: number | null;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface ReportJobsListResponse {
  data: ReportJobSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ReportJobDetail extends ReportJobSummary {
  latitude: number;
  longitude: number;
  initialRadius: number;
  adjustedRadius: number;
  modelUsed?: string | null;
  factsHtml?: string | null;
  narrativeHtml?: string | null;
  combinedHtml?: string | null;
  statsSnapshot?: unknown;
  applicationsSnapshot?: unknown;
  bcmsSnapshot?: unknown;
  propertySalesSnapshot?: unknown;
  zoningSnapshot?: unknown;
  payloadSnapshot?: unknown;
}

const TERMINAL_JOB_STATUSES: ReportJobStatus[] = ['generated', 'failed', 'cancelled'];

const DEFAULT_POLL_MS = 2000;
const DEFAULT_MAX_WAIT_MS = 10 * 60 * 1000;

export const reportJobsApi = {
  createPrePlanningJob: async (payload: PrePlanningGeneratePayload) => {
    const { data } = await apiClient.post<{ status: ReportJobStatus; jobId: number }>(
      '/pre-planning/report-jobs',
      payload,
    );
    return data;
  },

  listPrePlanningJobs: async (params?: { page?: number; pageSize?: number }) => {
    const { data } = await apiClient.get<ReportJobsListResponse>('/pre-planning/report-jobs', {
      params,
    });
    return data;
  },

  getPrePlanningJob: async (id: number) => {
    const { data } = await apiClient.get<ReportJobDetail>(`/pre-planning/report-jobs/${id}`);
    return data;
  },
};

/**
 * Poll until the persistent report job reaches a terminal status.
 * Throws if the job failed, was cancelled, or timed out.
 */
export async function waitForPrePlanningJob(
  jobId: number,
  options?: { pollMs?: number; maxWaitMs?: number; signal?: AbortSignal },
): Promise<ReportJobDetail> {
  const pollMs = options?.pollMs ?? DEFAULT_POLL_MS;
  const maxWaitMs = options?.maxWaitMs ?? DEFAULT_MAX_WAIT_MS;
  const start = Date.now();

  while (Date.now() - start < maxWaitMs) {
    if (options?.signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    const job = await reportJobsApi.getPrePlanningJob(jobId);
    if (TERMINAL_JOB_STATUSES.includes(job.reportStatus)) {
      if (job.reportStatus === 'failed') {
        throw new Error(job.errorMessage?.trim() || 'Report generation failed.');
      }
      if (job.reportStatus === 'cancelled') {
        throw new Error('Report generation was cancelled.');
      }
      return job;
    }
    await new Promise((r) => setTimeout(r, pollMs));
  }

  throw new Error(
    'Report generation is taking longer than expected. Check Report History in a few minutes.',
  );
}
