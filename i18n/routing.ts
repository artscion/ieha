import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['fr', 'en', 'ru', 'de'],
  defaultLocale: 'fr',
  localePrefix: {
    mode: 'as-needed',
  },
});
