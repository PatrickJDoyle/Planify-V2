export function truncate(text: string | null | undefined, maxLength: number): string {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
}

export function capitalizeWords(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function capitalizeSentences(text: string | null | undefined): string {
  if (!text) return '';
  const lower = text.toLowerCase();
  const sentences = lower.match(/[^.!?]+[.!?]*\s*/g);
  return sentences
    ? sentences
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join('')
    : lower;
}

export function formatAddress(address: string | null | undefined, maxLength = 50): string {
  if (!address) return '';
  return truncate(capitalizeWords(address), maxLength);
}

export function formatDescription(description: string | null | undefined, maxLength = 80): string {
  if (!description) return '';
  return capitalizeSentences(truncate(description, maxLength));
}

export function formatDistance(distanceKm: number | undefined): string {
  if (distanceKm === undefined) return '';
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)}m`;
  return `${distanceKm.toFixed(1)}km`;
}
