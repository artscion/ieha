export const SLIDE_DURATION_MS = 16_000;
export const CROSSFADE_DURATION_MS = 4_000;
export const MOTION_DURATION_MS = 24_000;
export const HERO_FALLBACK_LIMIT = 12;

export type HeroSlide = {
  id: string;
  imageSrc: string;
  alt: string;
  title: string;
  artist?: string;
  year?: string;
  href?: string;
};

export type CatalogueHeroCandidate = {
  slug: string;
  title: string;
  artist: string;
  date: string;
  image: string | null | undefined;
  reviewStatus: string;
  showInHero?: boolean | null;
};

function hasValidLocalImage(image: string | null | undefined): image is string {
  if (!image) return false;
  if (image.startsWith('http://') || image.startsWith('https://')) return false;
  return true;
}

function compareArtistThenTitle(a: CatalogueHeroCandidate, b: CatalogueHeroCandidate): number {
  const artistCmp = a.artist.localeCompare(b.artist, undefined, {
    sensitivity: 'base',
    numeric: true,
  });
  if (artistCmp !== 0) return artistCmp;
  return a.title.localeCompare(b.title, undefined, { sensitivity: 'base', numeric: true });
}

function toSlide(
  work: CatalogueHeroCandidate,
  imageSrc: string,
  opts?: { href?: string }
): HeroSlide {
  const artist = work.artist.trim() || undefined;
  const year = work.date.trim() || undefined;
  const alt =
    artist && work.title
      ? `${work.title} by ${artist}`
      : work.title || 'Catalogue artwork';
  return {
    id: work.slug,
    imageSrc,
    alt,
    title: work.title,
    artist,
    year,
    href: opts?.href,
  };
}

/**
 * Select homepage hero slides from catalogue candidates.
 * Prefer explicit showInHero + approved + local image; otherwise fall back to
 * approved works with local images (capped). Order is deterministic.
 */
export function selectHeroSlides(
  works: readonly CatalogueHeroCandidate[],
  resolveImageSrc: (image: string) => string,
  opts?: { fallbackLimit?: number; hrefForSlug?: (slug: string) => string | undefined }
): HeroSlide[] {
  const limit = opts?.fallbackLimit ?? HERO_FALLBACK_LIMIT;
  const withLocalImage = works.filter(
    (w) => w.reviewStatus === 'approved' && hasValidLocalImage(w.image)
  );

  const featured = withLocalImage
    .filter((w) => w.showInHero === true)
    .sort(compareArtistThenTitle);

  const selected = featured.length > 0 ? featured : withLocalImage.sort(compareArtistThenTitle).slice(0, limit);

  return selected.map((work) =>
    toSlide(work, resolveImageSrc(work.image as string), {
      href: opts?.hrefForSlug?.(work.slug),
    })
  );
}

export function formatHeroCaption(slide: Pick<HeroSlide, 'artist' | 'title' | 'year'>): string {
  const head = [slide.artist, slide.title].filter(Boolean).join(' — ');
  if (!head) return '';
  return slide.year ? `${head}, ${slide.year}` : head;
}
