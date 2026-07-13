import type { Locale } from '@/lib/content';

const FOOTER_TEXT: Record<Locale, string> = {
  fr: "Institut Européen du Patrimoine de l'Avant-Garde — Fondé en 2013",
  en: 'European Institute of Avant-Garde Heritage — Founded 2013',
  ru: 'Европейский Институт Наследия Авангарда — Основан в 2013 году',
  de: 'Europäisches Institut für das Erbe der Avantgarde — Gegründet 2013',
};

export function Footer({ locale }: { locale: Locale }) {
  return (
    <footer className="mt-24 border-t px-6 py-8 text-sm text-neutral-500">
      <p>{FOOTER_TEXT[locale]}</p>
      <p>info@ieha.org</p>
    </footer>
  );
}
