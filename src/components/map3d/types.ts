export type CameraPreset = 'overhead' | 'street-side' | 'oblique';

export interface Map3DZoningData {
  id: number;
  zoneGzt: string;
  geometry?: unknown;
}

export interface Map3DPreviewProps {
  latitude: number;
  longitude: number;
  applicationNumber?: string;
  authority?: string;
  address?: string;
  showZones?: boolean;
  zoning?: Map3DZoningData | null;
  nearbyZones?: Map3DZoningData[];
  compact?: boolean;
}
