import { apiClient } from './client';

export interface ZoningData {
  id: number;
  objectId: number;
  zoneGzt: string;
  zoneOrig?: string;
  zoneDesc?: string;
  zoneLink?: string;
  planName?: string;
  planId: string;
  laCode: string;
  laName: string;
  colour?: string;
  gztDesc?: string;
  geometry?: unknown;
  boundsNorth?: number;
  boundsSouth?: number;
  boundsEast?: number;
  boundsWest?: number;
  centroidLat?: number;
  centroidLng?: number;
}

export const zoningApi = {
  getAtPoint: async (
    latitude: number,
    longitude: number,
  ): Promise<ZoningData | null> => {
    try {
      const { data } = await apiClient.get<ZoningData | ZoningData[]>(
        '/zoning/point',
        { params: { latitude, longitude } },
      );
      if (Array.isArray(data)) return data.length > 0 ? data[0] : null;
      return data;
    } catch {
      return null;
    }
  },

  getBounds: async (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }): Promise<ZoningData[]> => {
    const { data } = await apiClient.get<ZoningData[]>('/zoning/bounds', {
      params: bounds,
    });
    return data;
  },
};
