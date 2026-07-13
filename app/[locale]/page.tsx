import { setRequestLocale } from 'next-intl/server';
import { getHomeContent } from '@/lib/content';
import { Hero } from '@/components/Hero';
import type { Locale } from '@/lib/content';

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const content = await getHomeContent(locale);
  return <Hero content={content} />;
}
