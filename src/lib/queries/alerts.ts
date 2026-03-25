'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsApi } from '@/lib/api/alerts';
import { queryKeys } from './keys';
import type { InboxFilters, BulkAction } from '@/lib/types/alerts';

function getErrorMessage(error: unknown, fallback: string): string {
  const message = (error as any)?.response?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string' && message.trim().length > 0) return message;
  if (error instanceof Error && error.message.trim().length > 0) return error.message;
  return fallback;
}

export function useAlerts(
  applicationId?: number,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [...queryKeys.alerts.all, applicationId],
    queryFn: async () => {
      try {
        return await alertsApi.list(applicationId);
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to load alerts.'));
      }
    },
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  });
}

export function useInbox(filters: InboxFilters, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.alerts.inbox(filters),
    queryFn: async () => {
      try {
        return await alertsApi.getInbox(filters);
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to load inbox.'));
      }
    },
    staleTime: 15_000,
    enabled: options?.enabled ?? true,
  });
}

export function useInboxStats(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...queryKeys.alerts.all, 'stats'],
    queryFn: async () => {
      try {
        return await alertsApi.getInboxStats();
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to load inbox statistics.'));
      }
    },
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  });
}

export function useUnreadCount(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.alerts.unreadCount,
    queryFn: async () => {
      try {
        return await alertsApi.getUnreadCount();
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to load unread count.'));
      }
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
    enabled: options?.enabled ?? true,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ alertId, read }: { alertId: number; read: boolean }) => {
      try {
        return await alertsApi.markRead(alertId, read);
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to update read status.'));
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.alerts.all });
      qc.invalidateQueries({ queryKey: queryKeys.alerts.unreadCount });
    },
  });
}

export function useStarAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ alertId, starred }: { alertId: number; starred: boolean }) => {
      try {
        return await alertsApi.star(alertId, starred);
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to update starred status.'));
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.alerts.all });
    },
  });
}

export function useArchiveAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ alertId, archived }: { alertId: number; archived: boolean }) => {
      try {
        return await alertsApi.archive(alertId, archived);
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to update archive status.'));
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.alerts.all });
      qc.invalidateQueries({ queryKey: queryKeys.alerts.unreadCount });
      qc.invalidateQueries({ queryKey: [...queryKeys.alerts.all, 'stats'] });
    },
  });
}

export function useBulkUpdateAlerts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, action }: { ids: number[]; action: BulkAction }) => {
      try {
        return await alertsApi.bulkUpdate(ids, action);
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to apply bulk action.'));
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.alerts.all });
      qc.invalidateQueries({ queryKey: queryKeys.alerts.unreadCount });
      qc.invalidateQueries({ queryKey: [...queryKeys.alerts.all, 'stats'] });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try {
        return await alertsApi.markAllRead();
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to mark all alerts as read.'));
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.alerts.all });
      qc.invalidateQueries({ queryKey: queryKeys.alerts.unreadCount });
    },
  });
}

export function useCreateAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (alertData: Parameters<typeof alertsApi.create>[0]) => {
      try {
        return await alertsApi.create(alertData);
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to create alert.'));
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.alerts.all });
    },
  });
}

export function useDeleteAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: number) => {
      try {
        return await alertsApi.delete(alertId);
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to delete alert.'));
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.alerts.all });
    },
  });
}
