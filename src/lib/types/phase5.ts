export interface HeatmapPoint {
  coordinates: [number, number];
  weight: number;
}

export interface HeatmapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export type HeatmapLayerType = 'applications' | 'commencements' | 'sales';

export interface BillingEntrypointResponse {
  url: string;
  type: 'checkout' | 'portal';
}

export interface PrePlanningGeneratePayload {
  applications: unknown[];
  initialRadius: number;
  adjustedRadius: number;
  initialApplicationCount: number;
  address?: string;
  centreLat?: number;
  centreLon?: number;
  intentionCategory?: string;
  intentionSubCategory?: string;
}

export interface PrePlanningStatsResponse {
  scope?: {
    address?: string;
    initialRadius: number;
    adjustedRadius: number;
    initialApplicationCount: number;
  };
  applications?: {
    total?: number;
    byStatus?: Record<string, number>;
    byAuthority?: Record<string, number>;
  };
  bcms?: unknown;
  propertySales?: unknown;
  zoning?: unknown;
}
