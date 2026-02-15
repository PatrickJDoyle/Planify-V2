'use client';

import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import { queryKeys } from './keys';
import { TIER_LIMITS } from '@/lib/types/user';
import type { TierLimits, UserProfile } from '@/lib/types/user';

export function useUserProfile() {
  const query = useQuery({
    queryKey: queryKeys.user.profile,
    queryFn: () => usersApi.getProfile(),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const profile = query.data ?? null;
  const limits: TierLimits = profile
    ? TIER_LIMITS[profile.subscriptionTier] ?? TIER_LIMITS.free
    : TIER_LIMITS.free;

  return {
    ...query,
    profile,
    limits,
    isPaid: profile?.isPaid ?? false,
    tier: profile?.subscriptionTier ?? 'free',
  };
}
