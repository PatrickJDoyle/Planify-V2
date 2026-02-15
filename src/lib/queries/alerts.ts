'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsApi } from '@/lib/api/alerts';
import { queryKeys } from './keys';
import type { InboxFilters, BulkAction } from '@/lib/types/alerts';

export function useAlerts(applicationId?: number) {
  return useQuery({
    queryKey: [...queryKeys.alerts.all, applicationId],
    queryFn: () => alertsApi.list(applicationId),
    staleTime: 30_000,
  });
}

export function useInbox(filters: InboxFilters) {
  return useQuery({
    queryKey: queryKeys.alerts.inbox(filters),
    queryFn: () => alertsApi.getInbox(filters),
    staleTime: 15_000,
  });
}

export function useInboxStats() {
  return useQuery({
    queryKey: [...queryKeys.alerts.all, 'stats'],
    queryFn: () => alertsApi.getInboxStats(),
    staleTime: 30_000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.alerts.unreadCount,
    queryFn: () => alertsApi.getUnreadCount(),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ alertId, read }: { alertId: number; read: boolean }) =>
      alertsApi.markRead(alertId, read),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.alerts.all });
      qc.invalidateQueries({ queryKey: queryKeys.alerts.unreadCount });
    },
  });
}

export function useStarAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ alertId, starred }: { alertId: number; starred: boolean }) =>
      alertsApi.star(alertId, starred),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.alerts.all });
    },
  });
}

export function useArchiveAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ alertId, archived }: { alertId: number; archived: boolean }) =>
      alertsApi.archive(alertId, archived),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.alerts.all });
      qc.invalidateQueries({ queryKey: queryKeys.alerts.unreadCount });
    },
  });
}

export function useBulkUpdateAlerts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, action }: { ids: number[]; action: BulkAction }) =>
      alertsApi.bulkUpdate(ids, action),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.alerts.all });
      qc.invalidateQueries({ queryKey: queryKeys.alerts.unreadCount });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => alertsApi.markAllRead(),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.alerts.all });
      qc.invalidateQueries({ queryKey: queryKeys.alerts.unreadCount });
    },
  });
}

export function useCreateAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (alertData: Parameters<typeof alertsApi.create>[0]) =>
      alertsApi.create(alertData),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.alerts.all });
    },
  });
}

export function useDeleteAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (alertId: number) => alertsApi.delete(alertId),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.alerts.all });
    },
  });
}
