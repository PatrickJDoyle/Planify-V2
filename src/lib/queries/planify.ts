'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProjectStatus =
  | 'draft'
  | 'researching'
  | 'research_complete'
  | 'research_failed'
  | 'generating'
  | 'complete'
  | 'failed';

export type AgentStatus = 'idle' | 'queued' | 'running' | 'complete' | 'failed';

export interface IrishPlanningFlags {
  exemptionCheck: {
    likelyExempt: boolean;
    exemptionClass?: string;
    conditions: string[];
    caveats: string[];
  };
  abpFlags: {
    isStrategicHousingDevelopment: boolean;
    requiresAaScreening: boolean;
    isMaterialContravention: boolean;
  };
  warnings: string[];
}

export interface PlanifyProject {
  id: string;
  name: string;
  address: string;
  eircode?: string;
  councilId: string;
  developmentType: string;
  description: string;
  siteAreaSqm?: number;
  numberOfUnits?: number;
  status: ProjectStatus;
  statusSummary?: string;
  irishFlags?: IrishPlanningFlags;
  createdAt: string;
  updatedAt: string;
}

export interface ResearchRequirement {
  id: string;
  name: string;
  category: 'required_form' | 'required_document' | 'user_provides' | 'generated';
  description?: string;
  source?: string;
  isGenerated: boolean;
}

export interface ResearchOutput {
  requirements: ResearchRequirement[];
  applicationFee?: number;
  estimatedTimeline?: string;
  keyPolicies?: Array<{ name: string; reference: string }>;
  councilNotes?: string;
}

export interface GeneratedDocument {
  id: string;
  requirementId?: string;
  name: string;
  status: AgentStatus;
  downloadUrl?: string;
  error?: string;
}

export interface ProjectStatusResponse {
  projectId: string;
  status: ProjectStatus;
  researchAgent: {
    status: AgentStatus;
    startedAt?: string;
    completedAt?: string;
    error?: string;
    output?: ResearchOutput;
  };
  documentAgent: {
    status: AgentStatus;
    startedAt?: string;
    completedAt?: string;
    error?: string;
    documents: GeneratedDocument[];
    progress?: number;
  };
}

export interface CreateProjectInput {
  name: string;
  address: string;
  eircode?: string;
  councilId: string;
  developmentType: string;
  description: string;
  siteAreaSqm?: number;
  numberOfUnits?: number;
}

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const planifyKeys = {
  all: ['planify'] as const,
  projects: ['planify', 'projects'] as const,
  project: (id: string) => ['planify', 'projects', id] as const,
  projectStatus: (id: string) => ['planify', 'projects', id, 'status'] as const,
};

// ─── API Functions ───────────────────────────────────────────────────────────

const PLANIFY_BASE = '/planify';

async function fetchProjects(): Promise<PlanifyProject[]> {
  const { data } = await apiClient.get(`${PLANIFY_BASE}/projects`);
  return data?.data ?? data ?? [];
}

async function fetchProject(id: string): Promise<PlanifyProject> {
  const { data } = await apiClient.get(`${PLANIFY_BASE}/projects/${id}`);
  return data?.data ?? data;
}

async function fetchProjectStatus(id: string): Promise<ProjectStatusResponse> {
  const { data } = await apiClient.get(`${PLANIFY_BASE}/projects/${id}/status`);
  const raw = data?.data ?? data;

  // Transform backend flat agentRuns/documents into the structured shape the UI expects
  const agentRuns: Array<{ agentType: string; status: string; startedAt?: string; completedAt?: string; outputJson?: any; errorMessage?: string }> = raw.agentRuns ?? [];
  const documents: Array<{ id: string; documentType: string; status: string; fileUrl?: string; warningMessage?: string }> = raw.documents ?? [];

  const researchRun = agentRuns.find((r) => r.agentType === 'research');
  const documentRun = agentRuns.find((r) => r.agentType === 'document');

  return {
    projectId: raw.id,
    status: raw.status,
    researchAgent: {
      status: researchRun?.status === 'complete' ? 'complete'
        : researchRun?.status === 'running' ? 'running'
        : researchRun?.status === 'failed' ? 'failed'
        : researchRun?.status === 'queued' ? 'queued'
        : 'idle',
      startedAt: researchRun?.startedAt,
      completedAt: researchRun?.completedAt,
      error: researchRun?.errorMessage,
      output: researchRun?.outputJson ? {
        requirements: (researchRun.outputJson.requirements ?? []).map((r: any) => ({
          id: r.document ?? r.id ?? '',
          name: r.document ?? r.name ?? '',
          category: r.planifyGenerates ? 'generated' : 'user_provides',
          description: r.notes,
          isGenerated: r.planifyGenerates ?? false,
        })),
        applicationFee: researchRun.outputJson.fees?.applicationFee,
        estimatedTimeline: researchRun.outputJson.estimatedTimelineWeeks
          ? `${researchRun.outputJson.estimatedTimelineWeeks.min}-${researchRun.outputJson.estimatedTimelineWeeks.max} weeks`
          : undefined,
        keyPolicies: (researchRun.outputJson.relevantPolicies ?? []).map((p: any) => ({
          name: p.title,
          reference: p.policyRef,
        })),
        councilNotes: researchRun.outputJson.fees?.notes,
      } : undefined,
    },
    documentAgent: {
      status: documentRun?.status === 'complete' ? 'complete'
        : documentRun?.status === 'running' ? 'running'
        : documentRun?.status === 'failed' ? 'failed'
        : documentRun?.status === 'queued' ? 'queued'
        : 'idle',
      startedAt: documentRun?.startedAt,
      completedAt: documentRun?.completedAt,
      error: documentRun?.errorMessage,
      documents: documents.map((d) => ({
        id: d.id,
        name: d.documentType.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        status: d.status === 'complete' ? 'complete' as const
          : d.status === 'generating' ? 'running' as const
          : 'failed' as const,
        downloadUrl: d.status === 'complete'
          ? `${apiClient.defaults.baseURL}${PLANIFY_BASE}/documents/${d.id}/download`
          : undefined,
        error: d.warningMessage,
      })),
    },
  };
}

async function createProject(input: CreateProjectInput): Promise<PlanifyProject> {
  const { data } = await apiClient.post(`${PLANIFY_BASE}/projects`, input);
  return data?.data ?? data;
}

async function generateDocuments(projectId: string): Promise<void> {
  await apiClient.post(`${PLANIFY_BASE}/projects/${projectId}/generate`);
}

async function retryResearch(projectId: string): Promise<void> {
  await apiClient.post(`${PLANIFY_BASE}/projects/${projectId}/retry-research`);
}

// ─── Query Hooks ─────────────────────────────────────────────────────────────

export function useProjects() {
  return useQuery({
    queryKey: planifyKeys.projects,
    queryFn: fetchProjects,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: planifyKeys.project(id),
    queryFn: () => fetchProject(id),
    staleTime: 30_000,
    enabled: !!id,
  });
}

export function useProjectStatus(id: string) {
  return useQuery({
    queryKey: planifyKeys.projectStatus(id),
    queryFn: () => fetchProjectStatus(id),
    refetchInterval: 5_000,
    staleTime: 3_000,
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planifyKeys.projects });
    },
  });
}

export function useGenerateDocuments(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => generateDocuments(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: planifyKeys.projectStatus(projectId),
      });
    },
  });
}

export function useRetryResearch(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => retryResearch(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: planifyKeys.projectStatus(projectId),
      });
    },
  });
}
