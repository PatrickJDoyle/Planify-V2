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
