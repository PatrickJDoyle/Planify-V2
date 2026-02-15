'use client';

import {
  useQuery,
  keepPreviousData,
} from '@tanstack/react-query';
import { applicationsApi } from '@/lib/api/applications';
import { queryKeys } from './keys';
import type { DashboardFilters } from '@/lib/types/filters';

export function useApplications(
  filters: DashboardFilters,
  page: number,
  pageSize = 16,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.applications.list(filters, page, pageSize),
    queryFn: () => applicationsApi.list(filters, page, pageSize),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useApplication(id: number) {
  return useQuery({
    queryKey: queryKeys.applications.detail(id),
    queryFn: () => applicationsApi.getById(id),
    staleTime: 60_000,
  });
}

export function useRelatedApplications(applicationId: number) {
  return useQuery({
    queryKey: queryKeys.applications.related(applicationId),
    queryFn: () => applicationsApi.getRelated(applicationId),
    staleTime: 60_000,
  });
}
