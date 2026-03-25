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
  const isPersonalTier = profile?.subscriptionTier === 'personal';
  const hasAccess =
    isPersonalTier || Boolean(profile?.isPaid) || Boolean(profile?.bypassPaywall);

  return {
    ...query,
    profile,
    limits,
    // V1 compatibility semantics:
    // - Personal tier is free but has standard access.
    // - Enterprise tier needs active payment OR bypass.
    isPaid: hasAccess,
    tier: profile?.subscriptionTier ?? 'free',
  };
}
