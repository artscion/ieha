/** Normalize text for case-insensitive, diacritic-insensitive search/sort. */
export function normalizeForCompare(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase();
}

export function displayArtist(artist: string | null | undefined): string {
  const trimmed = artist?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : 'Unknown artist';
}

/**
 * Extract a sortable year from free-text date fields such as "1919",
 * "ca. 1916", "1920-1922", or "date undetermined".
 * Returns null when no four-digit year is present.
 */
export function parseSortableYear(date: string | null | undefined): number | null {
  if (!date) return null;
  const match = date.match(/\b(1[0-9]{3}|20[0-9]{2})\b/);
  if (!match) return null;
  return Number(match[1]);
}
