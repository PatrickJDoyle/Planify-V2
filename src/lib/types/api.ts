import type { Application } from './application';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page?: number;
  pageSize?: number;
}

export type ApplicationsResponse = PaginatedResponse<Application>;

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}
