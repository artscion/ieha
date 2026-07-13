import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Golos_Text, Spectral } from 'next/font/google';
import { routing } from '@/i18n/routing';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import type { Locale } from '@/lib/content';
import '../globals.css';

// Golos Text (ParaType grotesque, full Cyrillic) carries display + labels;
// Spectral (scholarly serif w/ italic + Cyrillic) carries reading body + the
// Latin motto. Both self-hosted; cyrillic subset serves the Russian locale.
const golos = Golos_Text({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-golos',
  display: 'swap',
});

const spectral = Spectral({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-spectral',
  display: 'swap',
});

const SKIP_LABEL: Record<Locale, string> = {
  fr: 'Aller au contenu',
  en: 'Skip to content',
  ru: 'Перейти к содержанию',
  de: 'Zum Inhalt springen',
};

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
    <html lang={locale} className={`${golos.variable} ${spectral.variable}`}>
      <body className="bg-cream text-ink font-serif antialiased">
        <NextIntlClientProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-cream focus:px-4 focus:py-2 focus:font-sans focus:text-sm focus:text-ink focus:ring-2 focus:ring-forest"
          >
            {SKIP_LABEL[locale as Locale]}
          </a>
          <Nav locale={locale as Locale} />
          {children}
          <Footer locale={locale as Locale} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
