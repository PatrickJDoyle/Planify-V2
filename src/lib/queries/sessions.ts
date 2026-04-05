'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type {
  ResearchSession,
  CreateSessionRequest,
} from '@/lib/types/session';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const sessionKeys = {
  all: ['sessions'] as const,
  list: ['sessions', 'list'] as const,
  detail: (id: string) => ['sessions', id] as const,
};

// ─── API Functions ────────────────────────────────────────────────────────────

async function fetchSessions(): Promise<ResearchSession[]> {
  const { data } = await apiClient.get('/sessions');
  return data?.data ?? data ?? [];
}

async function fetchSession(id: string): Promise<ResearchSession> {
  const { data } = await apiClient.get(`/sessions/${id}`);
  return data?.data ?? data;
}

async function createSession(req: CreateSessionRequest): Promise<ResearchSession> {
  const { data } = await apiClient.post('/sessions', req);
  return data?.data ?? data;
}

async function cancelSession(id: string): Promise<void> {
  await apiClient.delete(`/sessions/${id}`);
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useSessions() {
  return useQuery({
    queryKey: sessionKeys.list,
    queryFn: fetchSessions,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

const TERMINAL_STATUSES = new Set(['research_complete', 'failed']);

export function useSession(id: string) {
  return useQuery({
    queryKey: sessionKeys.detail(id),
    queryFn: () => fetchSession(id),
    // Poll until the session reaches a terminal state
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status || TERMINAL_STATUSES.has(status)) return false;
      return 3_000;
    },
    staleTime: 2_000,
    enabled: !!id,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.list });
    },
  });
}

export function useCancelSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelSession,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: sessionKeys.list });
    },
  });
}
