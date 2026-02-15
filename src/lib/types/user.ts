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
    maxAlerts: null,
    maxFavourites: null,
    maxAlertRadius: null,
    maxKeywords: null,
    maxLocations: null,
    hasNationwideAccess: false,
    canExport: false,
    canUsePrePlanning: false,
    canUseKeywords: false,
  },
  personal: {
    maxAlerts: 10,
    maxFavourites: 50,
    maxAlertRadius: 2,
    maxKeywords: null,
    maxLocations: 2,
    hasNationwideAccess: false,
    canExport: false,
    canUsePrePlanning: true,
    canUseKeywords: false,
  },
  enterprise: {
    maxAlerts: null,
    maxFavourites: null,
    maxAlertRadius: null,
    maxKeywords: 5,
    maxLocations: 3,
    hasNationwideAccess: true,
    canExport: true,
    canUsePrePlanning: true,
    canUseKeywords: true,
  },
};
