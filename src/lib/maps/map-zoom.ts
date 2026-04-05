/** Human-readable radius for map captions and labels. */
export function formatRadiusMeters(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(meters % 1000 === 0 ? 0 : 1)}km`;
  }
  return `${meters}m`;
}

/** Map zoom level so the study-area circle is reasonably framed. */
export function getZoomForRadius(radiusMeters: number): number {
  if (radiusMeters <= 200) return 16;
  if (radiusMeters <= 500) return 15;
  if (radiusMeters <= 1000) return 14;
  if (radiusMeters <= 2000) return 13;
  if (radiusMeters <= 3000) return 12;
  return 11;
}
