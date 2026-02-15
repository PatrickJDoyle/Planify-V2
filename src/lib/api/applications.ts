import { apiClient } from './client';
import type { Application } from '@/lib/types/application';
import type { DashboardFilters } from '@/lib/types/filters';
import type { PaginatedResponse, MapBounds } from '@/lib/types/api';

export const applicationsApi = {
  list: async (
    filters: DashboardFilters = {},
    page = 1,
    pageSize = 16,
  ): Promise<PaginatedResponse<Application>> => {
    const params: Record<string, unknown> = { page, pageSize };

    // Map filter fields to query params
    if (filters.planningAuthority) params.planningAuthority = filters.planningAuthority;
    if (filters.sector) params.sector = filters.sector;
    if (filters.applicationType) params.applicationType = filters.applicationType;
    if (filters.decision) params.decision = filters.decision;
    if (filters.applicationNumber) params.applicationNumber = filters.applicationNumber;
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.latitude) params.latitude = filters.latitude;
    if (filters.longitude) params.longitude = filters.longitude;
    if (filters.radius) params.radius = filters.radius;
    if (filters.submissionDeadline) params.submissionDeadline = filters.submissionDeadline;
    if (filters.descriptionSearch) params.descriptionSearch = filters.descriptionSearch;
    if (filters.developmentDescription) params.developmentDescription = filters.developmentDescription;
    if (filters.receivedDateFrom) {
      params.receivedDateFrom = filters.receivedDateFrom instanceof Date
        ? filters.receivedDateFrom.toISOString().split('T')[0]
        : filters.receivedDateFrom;
    }
    if (filters.receivedDateTo) {
      params.receivedDateTo = filters.receivedDateTo instanceof Date
        ? filters.receivedDateTo.toISOString().split('T')[0]
        : filters.receivedDateTo;
    }

    const { data } = await apiClient.get<PaginatedResponse<Application>>(
      '/applications',
      { params },
    );
    return data;
  },

  getById: async (id: number): Promise<Application> => {
    const { data } = await apiClient.get<Application>(`/applications/id/${id}`);
    return data;
  },

  getMapApplications: async (
    params: MapBounds & { latitude?: number; longitude?: number; radius?: number; sortBy?: string },
  ): Promise<PaginatedResponse<Application>> => {
    const { data } = await apiClient.get<PaginatedResponse<Application>>(
      '/applications/map',
      { params },
    );
    return data;
  },

  getRelated: async (applicationId: number): Promise<Application[]> => {
    const { data } = await apiClient.get<Application[]>(
      `/applications/id/${applicationId}/related`,
    );
    return data;
  },
};
