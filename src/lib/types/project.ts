export interface Project {
  id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  applicationIds: number[];
  notes: string;
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
