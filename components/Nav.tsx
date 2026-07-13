'use client';
import { Link, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import type { Locale } from '@/lib/content';

const NAV_ITEMS: { slug: string; label: string }[] = [
  { slug: '/', label: 'Home' },
  { slug: '/about', label: 'About' },
  { slug: '/methodology', label: 'Methodology' },
  { slug: '/research', label: 'Research' },
  { slug: '/programs', label: 'Programs' },
  { slug: '/collection', label: 'Collection' },
  { slug: '/contact', label: 'Contact' },
];

export function Nav({ locale }: { locale: Locale }) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-between px-6 py-4">
      <ul className="flex gap-6">
        {NAV_ITEMS.map((item) => (
          <li key={item.slug}>
            <Link href={item.slug} className="text-sm font-medium">
              {item.label}
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
