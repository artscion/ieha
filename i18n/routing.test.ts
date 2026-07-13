import { describe, it, expect } from 'vitest';
import { routing } from './routing';

describe('routing config', () => {
  it('has fr as the default locale', () => {
    expect(routing.defaultLocale).toBe('fr');
  });

  it('includes all four required locales', () => {
    expect(routing.locales).toEqual(['fr', 'en', 'ru', 'de']);
  });

  it('uses as-needed prefixing so the default locale is unprefixed', () => {
    expect(routing.localePrefix.mode).toBe('as-needed');
  });
});
