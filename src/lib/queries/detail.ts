'use client';

import { useQuery } from '@tanstack/react-query';
import { bcmsApi } from '@/lib/api/bcms';
import { propertyApi } from '@/lib/api/property';
import { zoningApi } from '@/lib/api/zoning';
import { queryKeys } from './keys';

export function useBcmsNotices(applicationId: number) {
  return useQuery({
    queryKey: queryKeys.bcms.byApplication(applicationId),
    queryFn: () => bcmsApi.getByApplicationId(applicationId),
    staleTime: 60_000,
  });
}

export function useNearbyBcms(
  applicationId: number,
  lat: number | undefined,
  lng: number | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.bcms.nearby(applicationId),
    queryFn: () => bcmsApi.getNearby(lat!, lng!, 75, applicationId),
    staleTime: 60_000,
    enabled: enabled && lat !== undefined && lng !== undefined,
  });
}

export function useNearbySales(
  lat: number | undefined,
  lng: number | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.property.nearbySales(lat ?? 0, lng ?? 0),
    queryFn: () => propertyApi.getNearbySales(lat!, lng!),
    staleTime: 60_000,
    enabled: enabled && lat !== undefined && lng !== undefined,
  });
}

export function usePropertyHistory(
  applicationId: number,
  lat: number | undefined,
  lng: number | undefined,
  address: string | undefined,
  applicationNumber?: string,
  planningAuthority?: string,
) {
  return useQuery({
    queryKey: queryKeys.property.history(applicationId),
    queryFn: () =>
      propertyApi.getPropertyHistory(
        applicationId,
        lat!,
        lng!,
        address!,
        applicationNumber,
        planningAuthority,
      ),
    staleTime: 60_000,
    enabled: lat !== undefined && lng !== undefined && !!address,
  });
}

export function useZoning(lat: number | undefined, lng: number | undefined) {
  return useQuery({
    queryKey: queryKeys.zoning.atPoint(lat ?? 0, lng ?? 0),
    queryFn: () => zoningApi.getAtPoint(lat!, lng!),
    staleTime: 5 * 60_000,
    enabled: lat !== undefined && lng !== undefined,
  });
}
