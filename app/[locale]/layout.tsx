import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Newsreader, Inter } from 'next/font/google';
import { routing } from '@/i18n/routing';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import type { Locale } from '@/lib/content';
import '../globals.css';

const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-newsreader',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <html lang={locale} className={`${newsreader.variable} ${inter.variable}`}>
      <body className="bg-cream text-ink font-serif antialiased">
        <NextIntlClientProvider>
          <Nav locale={locale as Locale} />
          {children}
          <Footer locale={locale as Locale} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
