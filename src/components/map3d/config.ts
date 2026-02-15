export const CAMERA_PRESETS = {
  overhead: { zoom: 16, pitch: 0, bearing: 0 },
  'street-side': { zoom: 17.5, pitch: 60, bearing: 30 },
  oblique: { zoom: 16.5, pitch: 45, bearing: 25 },
} as const;

export const DEFAULT_PRESET = 'oblique' as const;

export const ANIMATION_DURATIONS = {
  cameraTransition: 600,
  reducedMotion: 150,
  toggle3D: 600,
};

export function getMap3DConfig() {
  const accessToken =
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ||
    '';
  return {
    accessToken,
    buildingsLayerId: 'building-extrusion',
    enableTerrain: true,
    enableSky: true,
    maxZoom: 20,
  };
}

export function isMap3DEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const flag = process.env.NEXT_PUBLIC_FEATURE_MAP3D_PREVIEW;
  if (flag === undefined) return process.env.NODE_ENV === 'development';
  return flag === 'true' || flag === '1';
}
