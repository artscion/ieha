'use client';
import { Link, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import type { Locale } from '@/lib/content';

const NAV_SLUGS = ['/', '/about', '/methodology', '/research', '/programs', '/collection', '/contact'] as const;

const NAV_LABELS: Record<Locale, Record<(typeof NAV_SLUGS)[number], string>> = {
  fr: {
    '/': 'Accueil',
    '/about': 'À propos',
    '/methodology': 'Méthodologie',
    '/research': 'Recherche',
    '/programs': 'Programmes',
    '/collection': 'Collection',
    '/contact': 'Contact',
  },
  en: {
    '/': 'Home',
    '/about': 'About',
    '/methodology': 'Methodology',
    '/research': 'Research',
    '/programs': 'Programs',
    '/collection': 'Collection',
    '/contact': 'Contact',
  },
  ru: {
    '/': 'Главная',
    '/about': 'О нас',
    '/methodology': 'Методология',
    '/research': 'Исследования',
    '/programs': 'Программы',
    '/collection': 'Коллекция',
    '/contact': 'Контакты',
  },
  de: {
    '/': 'Startseite',
    '/about': 'Über uns',
    '/methodology': 'Methodik',
    '/research': 'Forschung',
    '/programs': 'Programme',
    '/collection': 'Sammlung',
    '/contact': 'Kontakt',
  },
};

export function Nav({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const labels = NAV_LABELS[locale];

  return (
    <nav className="flex items-center justify-between px-6 py-4">
      <ul className="flex gap-6">
        {NAV_SLUGS.map((slug) => (
          <li key={slug}>
            <Link href={slug} className="text-sm font-medium">
              {labels[slug]}
            </Link>
          </li>
        ))}
      </ul>
      <ul className="flex gap-3">
        {routing.locales.map((loc) => (
          <li key={loc}>
            <Link
              href={pathname}
              locale={loc}
              className={loc === locale ? 'font-semibold underline' : 'text-neutral-500'}
            >
              {loc.toUpperCase()}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
