import { apiClient } from './client';
import type {
  Alert,
  InboxAlert,
  InboxStats,
  InboxFilters,
  InboxResponse,
  BulkAction,
} from '@/lib/types/alerts';

export const alertsApi = {
  // --- Alert CRUD ---
  list: async (applicationId?: number): Promise<Alert[]> => {
    const params: Record<string, unknown> = {};
    if (applicationId) params.applicationId = applicationId;
    const { data } = await apiClient.get<Alert[]>('/alerts', { params });
    return data;
  },

  create: async (alertData: Partial<Alert>): Promise<Alert> => {
    const { data } = await apiClient.post<Alert>('/alerts', alertData);
    return data;
  },

  delete: async (alertId: number): Promise<void> => {
    await apiClient.delete(`/alerts/${alertId}`);
  },

  deleteByApplication: async (applicationId: number): Promise<void> => {
    await apiClient.delete(`/alerts/application/${applicationId}`);
  },

  // --- Inbox ---
  getInbox: async (filters: InboxFilters = {}): Promise<InboxResponse> => {
    const params: Record<string, unknown> = {
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? 20,
    };
    if (filters.scope) params.scope = filters.scope;
    if (filters.planningAuthority) params.planningAuthority = filters.planningAuthority;
    if (filters.keywords?.length) params.keywords = filters.keywords.join(',');
    if (filters.read !== undefined) params.read = filters.read;
    if (filters.starred !== undefined) params.starred = filters.starred;
    if (filters.archived !== undefined) params.archived = filters.archived;
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.sortOrder) params.sortOrder = filters.sortOrder;

    const { data } = await apiClient.get<InboxResponse>('/alerts/inbox', { params });
    return data;
  },

  getInboxStats: async (): Promise<InboxStats> => {
    const { data } = await apiClient.get<InboxStats>('/alerts/inbox/stats');
    return data;
  },

  getUnreadCount: async (): Promise<number> => {
    const { data } = await apiClient.get<{ count: number }>('/alerts/inbox/unread-count');
    return data.count;
  },

  // --- Inbox Actions ---
  markRead: async (alertId: number, read: boolean): Promise<void> => {
    await apiClient.patch(`/alerts/inbox/${alertId}/read`, { read });
  },

  star: async (alertId: number, starred: boolean): Promise<void> => {
    await apiClient.patch(`/alerts/inbox/${alertId}/star`, { starred });
  },

  archive: async (alertId: number, archived: boolean): Promise<void> => {
    await apiClient.patch(`/alerts/inbox/${alertId}/archive`, { archived });
  },

  bulkUpdate: async (ids: number[], action: BulkAction): Promise<{ updated: number }> => {
    const { data } = await apiClient.patch<{ updated: number }>('/alerts/inbox/bulk', {
      ids,
      action,
    });
    return data;
  },

  markAllRead: async (): Promise<{ updated: number }> => {
    const { data } = await apiClient.post<{ updated: number }>('/alerts/inbox/mark-all-read');
    return data;
  },
};
