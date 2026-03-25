export type UserType = 'homeowner' | 'business' | 'professional';

export type SubscriptionTier = 'free' | 'personal' | 'enterprise';

export interface UserLocation {
  id: number;
  userId: string;
  address: string;
  latitude: number;
  longitude: number;
  radius: number | null;
  isPrimary: boolean;
  locationType: 'home' | 'business';
  isUrban: boolean | null;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserKeyword {
  id: number;
  userId: string;
  keyword: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  userType: UserType | null;
  onboardingComplete: boolean;
  subscriptionTier: SubscriptionTier;
  // Backend billing flag: true when an active paid subscription exists.
  // Note: Personal tier is treated as free-but-enabled in product logic.
  isPaid: boolean;
  industry: string | null;
  subIndustry: string | null;
  organisationName: string | null;
  stripeCustomerId: string | null;
  subscriptionStartDate: string | null;
  createdAt: string;
  updatedAt: string;
  locations?: UserLocation[];
  keywords?: UserKeyword[];
  bypassPaywall?: boolean;
}

export interface TierLimits {
  maxAlerts: number | null;
  maxFavourites: number | null;
  maxAlertRadius: number | null;
  maxKeywords: number | null;
  maxLocations: number | null;
  hasNationwideAccess: boolean;
  canExport: boolean;
  canUsePrePlanning: boolean;
  canUseKeywords: boolean;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    // Base free tier (minimal/unonboarded)
    maxAlerts: 1,
    maxFavourites: null,
    maxAlertRadius: 0.3, // km
    maxKeywords: 0,
    maxLocations: 1,
    hasNationwideAccess: false,
    canExport: false,
    canUsePrePlanning: false,
    canUseKeywords: false,
  },
  personal: {
    // Personal tier (free plan for standard users)
    maxAlerts: 2,
    maxFavourites: 3,
    maxAlertRadius: 1, // km
    maxKeywords: 3,
    maxLocations: 2,
    hasNationwideAccess: false,
    canExport: false,
    canUsePrePlanning: true,
    canUseKeywords: false,
  },
  enterprise: {
    // Enterprise tier (paid professional plan)
    maxAlerts: 18,
    maxFavourites: null,
    maxAlertRadius: 20, // km
    maxKeywords: 10,
    maxLocations: 3,
    hasNationwideAccess: true,
    canExport: true,
    canUsePrePlanning: true,
    canUseKeywords: true,
  },
};
