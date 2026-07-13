import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReactNode } from 'react';

// Mock next-intl and navigation before importing Nav
vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, locale, className }: { children: ReactNode; href: string; locale?: string; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
  usePathname: () => '/',
  useRouter: () => ({}),
  redirect: () => {},
}));

vi.mock('@/i18n/routing', () => ({
  routing: {
    locales: ['fr', 'en', 'ru', 'de'],
    defaultLocale: 'fr',
  },
}));

import { Nav } from './Nav';

describe('Nav', () => {
  it('renders a link for all four locales', () => {
    render(<Nav locale="fr" />);
    // Locale switchers render in both the desktop bar and the mobile menu,
    // so each label appears more than once in the DOM (CSS hides one).
    for (const loc of ['FR', 'EN', 'RU', 'DE']) {
      expect(screen.getAllByText(loc).length).toBeGreaterThan(0);
    }
  });

  it('exposes an accessible mobile menu toggle', () => {
    render(<Nav locale="fr" />);
    const toggle = screen.getByRole('button', { name: /open menu/i });
    expect(toggle).toHaveAttribute('aria-controls', 'mobile-menu');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
});
