import { setRequestLocale } from 'next-intl/server';
import { getHomeContent, getFeaturedWork } from '@/lib/content';
import { Hero } from '@/components/Hero';
import type { Locale } from '@/lib/content';

// Curated homepage hero artwork. Swap the slug AND its intrinsic pixel size
// together if featuring a different work (the size lets next/image reserve the
// correct aspect ratio with no layout shift or cropping).
const HERO_WORK = {
  slug: 'suprematist-composition-1920-1922',
  width: 1297,
  height: 2597,
};

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [content, featured] = await Promise.all([
    getHomeContent(locale),
    getFeaturedWork(locale, HERO_WORK.slug),
  ]);
  return (
    <Hero content={content} featured={featured} imageWidth={HERO_WORK.width} imageHeight={HERO_WORK.height} />
  );
}
