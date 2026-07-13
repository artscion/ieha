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
    expect(screen.getByText('FR')).toBeInTheDocument();
    expect(screen.getByText('EN')).toBeInTheDocument();
    expect(screen.getByText('RU')).toBeInTheDocument();
    expect(screen.getByText('DE')).toBeInTheDocument();
  });
});
