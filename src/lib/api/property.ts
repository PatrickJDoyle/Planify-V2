import { apiClient } from './client';

export interface PropertySale {
  id: number;
  saleDate: string;
  address: string;
  price: number;
  latitude: number;
  longitude: number;
  distanceMeters: number;
}

export interface PropertyHistoryResponse {
  success: boolean;
  propertyId?: number;
  canonicalAddress?: string;
  hasExactMatch: boolean;
  applications: Array<{
    applicationId: number;
    applicationNumber: string;
    planningAuthority: string;
    developmentDescription: string;
    developmentAddress: string;
    decision?: string;
    decisionDate?: string;
    receivedDate: string;
    linkApplicationDetails?: string;
    distanceMeters: number;
    confidence: 'verified' | 'high' | 'medium' | 'low';
    matchMethods: string[];
    confidenceScore: number;
  }>;
  bcmsNotices: Array<{
    id: number;
    noticeExternalId: string;
    localAuthority: string;
    projectAddress: string;
    description?: string;
    status?: string;
    commencementDate?: string;
    planningPermissionNumber?: string;
    eircode?: string;
    distanceMeters: number;
    confidence: 'verified' | 'high' | 'medium' | 'low';
    matchMethods: string[];
    confidenceScore: number;
  }>;
  propertySales: Array<{
    id: number;
    saleDate: string;
    address: string;
    price: number;
    eircode?: string;
    distanceMeters: number;
    confidence: 'verified' | 'high' | 'medium' | 'low';
    matchMethods: string[];
    confidenceScore: number;
  }>;
  summary: {
    totalApplications: number;
    totalBcms: number;
    totalSales: number;
    verifiedCount: number;
    highConfidenceCount: number;
  };
}

export const propertyApi = {
  getNearbySales: async (
    latitude: number,
    longitude: number,
    radius = 1000,
  ): Promise<PropertySale[]> => {
    const { data } = await apiClient.get<PropertySale[]>(
      '/property-sales/nearby',
      { params: { latitude, longitude, radius } },
    );
    return data;
  },

  getPropertyHistory: async (
    applicationId: number,
    latitude: number,
    longitude: number,
    developmentAddress: string,
    applicationNumber?: string,
    planningAuthority?: string,
  ): Promise<PropertyHistoryResponse> => {
    const params: Record<string, unknown> = {
      applicationId,
      latitude,
      longitude,
      developmentAddress,
    };
    if (applicationNumber) params.applicationNumber = applicationNumber;
    if (planningAuthority) params.planningAuthority = planningAuthority;

    const { data } = await apiClient.get<PropertyHistoryResponse>(
      '/property-history',
      { params },
    );
    return data;
  },
};
