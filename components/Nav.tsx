'use client';
import { useEffect, useState } from 'react';
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
  const [open, setOpen] = useState(false);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <nav className="border-b border-border">
      <div className="flex items-center justify-between px-6 py-5 lg:px-10">
        <Link href="/" className="block" onClick={() => setOpen(false)}>
          <span className="font-sans text-lg font-semibold tracking-tight text-ink">IEHA</span>
          <span className="block font-sans text-[9px] tracking-wide text-label">
            European Institute of Avant-Garde Heritage
          </span>
        </Link>

        {/* Desktop: inline navigation (lg and up) */}
        <ul className="hidden items-center gap-4 lg:flex">
          {NAV_SLUGS.map((slug) => (
            <li key={slug}>
              <Link
                href={slug}
                aria-current={pathname === slug ? 'page' : undefined}
                className="font-sans text-[11px] uppercase tracking-wider text-label hover:text-forest"
              >
                {labels[slug]}
              </Link>
            </li>
          ))}
        </ul>
        <ul className="hidden items-center gap-3 lg:flex">
          {routing.locales.map((loc) => (
            <li key={loc}>
              <Link
                href={pathname}
                locale={loc}
                aria-current={loc === locale ? 'true' : undefined}
                className={
                  loc === locale
                    ? 'font-sans text-[11px] font-medium text-forest underline'
                    : 'font-sans text-[11px] text-label hover:text-forest'
                }
              >
                {loc.toUpperCase()}
              </Link>
            </li>
          ))}
        </ul>

        {/* Mobile: menu toggle (below lg) */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="-mr-2 flex h-11 w-11 items-center justify-center text-ink lg:hidden"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            {open ? (
              <>
                <line x1="4.5" y1="4.5" x2="17.5" y2="17.5" />
                <line x1="17.5" y1="4.5" x2="4.5" y2="17.5" />
              </>
            ) : (
              <>
                <line x1="3" y1="6.5" x2="19" y2="6.5" />
                <line x1="3" y1="11" x2="19" y2="11" />
                <line x1="3" y1="15.5" x2="19" y2="15.5" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile: expanded menu panel */}
      <div id="mobile-menu" className={`${open ? 'block' : 'hidden'} px-6 pb-6 lg:hidden`}>
        <ul className="border-t border-border">
          {NAV_SLUGS.map((slug) => (
            <li key={slug} className="border-b border-border">
              <Link
                href={slug}
                onClick={() => setOpen(false)}
                aria-current={pathname === slug ? 'page' : undefined}
                className={`block py-3.5 font-sans text-sm uppercase tracking-wider ${
                  pathname === slug ? 'text-forest' : 'text-label'
                }`}
              >
                {labels[slug]}
              </Link>
            </li>
          ))}
        </ul>
        <ul className="mt-5 flex gap-1">
          {routing.locales.map((loc) => (
            <li key={loc}>
              <Link
                href={pathname}
                locale={loc}
                onClick={() => setOpen(false)}
                aria-current={loc === locale ? 'true' : undefined}
                className={`flex h-11 min-w-11 items-center justify-center px-2 font-sans text-xs ${
                  loc === locale ? 'font-medium text-forest underline' : 'text-label'
                }`}
              >
                {loc.toUpperCase()}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
