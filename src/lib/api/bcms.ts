import { apiClient } from './client';

export interface BcmsNotice {
  id: number;
  noticeExternalId: string;
  localAuthority: string | null;
  projectAddress: string | null;
  eircode: string | null;
  description: string | null;
  projectType: string | null;
  floorArea: number | null;
  status: string | null;
  receivedDate: string | null;
  commencementDate: string | null;
  completionCertDate: string | null;
  latitude: number | null;
  longitude: number | null;
  planningPermissionNumber: string | null;
  distanceMeters?: number;
}

export const bcmsApi = {
  getByApplicationId: async (applicationId: number): Promise<BcmsNotice[]> => {
    const { data } = await apiClient.get<BcmsNotice[]>(
      `/bcms/by-application/${applicationId}`,
    );
    return data;
  },

  getNearby: async (
    lat: number,
    lng: number,
    radius = 75,
    excludeApplicationId?: number,
  ): Promise<BcmsNotice[]> => {
    const params: Record<string, unknown> = { lat, lng, radius };
    if (excludeApplicationId != null) {
      params.excludeApplicationId = excludeApplicationId;
    }
    const { data } = await apiClient.get<BcmsNotice[]>('/bcms/nearby', { params });
    return data;
  },
};
