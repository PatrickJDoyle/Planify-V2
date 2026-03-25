export interface Project {
  id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  applicationIds: number[];
  notes: string;
  source?: 'manual' | 'location';
  locationId?: number | null;
  isPrimaryLocation?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  applicationId?: number;
}
