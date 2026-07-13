import { setRequestLocale } from 'next-intl/server';
import { getCatalogueWorks } from '@/lib/content';
import { CollectionBrowser } from './CollectionBrowser';
import type { Locale } from '@/lib/content';

export default async function CollectionPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const works = await getCatalogueWorks(locale);
  return <CollectionBrowser works={works} />;
}
