import { setRequestLocale } from 'next-intl/server';
import { getPageContent } from '@/lib/content';
import { ProsePage } from '@/components/ProsePage';
import type { Locale } from '@/lib/content';

export default async function ContactPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const content = await getPageContent(locale, 'contact');
  return <ProsePage content={content} />;
}
