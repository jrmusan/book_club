/** Rough audiobook length from print pages (~30–35 pages/hour is a common rule of thumb). */
export function estimateAudiobookHours(pageCount: number | null | undefined): number | null {
  if (!pageCount || pageCount <= 0) return null;
  const hours = pageCount / 32;
  return Math.round(hours * 10) / 10;
}

export function formatAudiobookHours(pageCount: number | null | undefined): string | null {
  const hours = estimateAudiobookHours(pageCount);
  if (hours == null) return null;
  if (hours < 1) return `~${Math.round(hours * 60)} min listen`;
  const whole = Math.floor(hours);
  const mins = Math.round((hours - whole) * 60);
  if (mins === 0) return `~${whole} hr listen`;
  return `~${whole} hr ${mins} min listen`;
}
