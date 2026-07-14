import { setRequestLocale } from 'next-intl/server';
import { getHomeContent, getHeroSlides } from '@/lib/content';
import { Hero } from '@/components/Hero';
import type { Locale } from '@/lib/content';

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [content, slides] = await Promise.all([getHomeContent(locale), getHeroSlides(locale)]);
  return <Hero content={content} slides={slides} />;
}
