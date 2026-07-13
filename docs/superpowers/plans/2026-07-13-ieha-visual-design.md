# IEHA Visual Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current placeholder Tailwind-default styling with the purpose-built "Archive/Academic + Wide Editorial" visual identity approved in the design spec — a pure visual/CSS pass across all 7 page types, no content or data changes.

**Architecture:** Tailwind v4 CSS-first `@theme` tokens define the color palette as named utilities; `next/font/google` self-hosts Newsreader (serif, editorial content) and Inter (sans, UI chrome) as CSS variables consumed by the theme. Six existing components get restyled in place — no new components, no new files besides the token/font wiring.

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS v4 (`@theme` directive), `next/font/google`.

## Global Constraints

- Pure visual/CSS pass — no changes to `lib/content.ts`, `keystatic.config.ts`, i18n routing, or any content/data files (from spec).
- Newsreader (serif) for all editorial content — headlines, body, nav wordmark, section headings. Inter (sans) for functional UI chrome only — nav links, eyebrow/label text, footer fine print (from spec §Foundations).
- Color tokens (from spec §Foundations): `--color-cream: #FBFAF7`, `--color-ink: #242220`, `--color-ink-soft: #4E4A45`, `--color-forest: #3F5643`, `--color-border: #E6E1D8`, `--color-label: #6B655D`.
- "sine ira et studio" italicization logic in `Hero.tsx` (`renderSubhead`, `LATIN_PHRASE`) must not be touched — it's existing, tested, working behavior.
- All existing component tests (`Hero.test.tsx`, `ProsePage.test.tsx`, `Nav.test.tsx`, `Footer.test.tsx`, `CatalogueFilter.test.tsx`) assert on text content/behavior, not exact class names — every task must confirm they still pass unchanged, not just assume it.
- Home hero's right-column rail stays empty negative space (just a rule) — no new pull-quote copy invented (from spec §Component treatment).
- Never commit directly to `main` — this repo has no `main` branch yet; continue on `feat/site-rebuild` (established convention from the prior plan).

---

## File Structure

```
app/
├── globals.css              # MODIFY: add @theme block (color tokens + font variable mapping)
└── [locale]/
    └── layout.tsx            # MODIFY: load Newsreader + Inter via next/font/google, apply CSS variables
components/
├── Nav.tsx                   # MODIFY: wordmark + tagline, sans nav links, hairline border
├── Footer.tsx                 # MODIFY: restrained serif/sans pairing
├── Hero.tsx                   # MODIFY: two-column split layout (rendering logic unchanged)
├── ProsePage.tsx               # MODIFY: narrow left-weighted column, section rule motif
├── CatalogueGrid.tsx           # MODIFY: museum-plate-listing treatment
└── CatalogueFilter.tsx         # MODIFY: restyled label/select to match
```

No files are created or deleted. Every change is additive styling on top of existing, working component logic.

---

### Task 1: Design tokens and font loading

**Files:**
- Modify: `app/globals.css`
- Modify: `app/[locale]/layout.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks (foundational).
- Produces: Tailwind utility classes `bg-cream`, `text-ink`, `text-ink-soft`, `text-forest`, `border-forest`, `border-border`, `text-label` (from the color `@theme` tokens), and `font-serif` / `font-sans` (from the font `@theme inline` mapping) — consumed by every later task.

- [ ] **Step 1: Add the color and font theme tokens to globals.css**

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  --color-cream: #FBFAF7;
  --color-ink: #242220;
  --color-ink-soft: #4E4A45;
  --color-forest: #3F5643;
  --color-border: #E6E1D8;
  --color-label: #6B655D;
}

@theme inline {
  --font-serif: var(--font-newsreader);
  --font-sans: var(--font-inter);
}
```

- [ ] **Step 2: Load the fonts in the locale layout**

Read the current `app/[locale]/layout.tsx` first (it has a `setRequestLocale` call and Nav/Footer wiring from earlier work — preserve both exactly, only add the font loading).

```tsx
// app/[locale]/layout.tsx
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
```

Note: `font-serif` on `<body>` sets Newsreader as the default for all text; Task 2's Nav/Footer work explicitly opts nav links and labels into `font-sans` (Inter) where the spec calls for it.

- [ ] **Step 3: Run the full test suite to confirm no regressions from the token/font wiring alone**

Run: `npx vitest run`
Expected: all existing tests still pass (34/34 per the last full run) — this task doesn't touch any component's rendered text/behavior, only available styling primitives.

- [ ] **Step 4: Build and manually verify tokens are usable**

Run: `rm -rf .next && npm run build && npm run start`, then visit `http://localhost:3000/` and inspect (browser devtools or view-source) that:
- The page background is the cream tone (not white).
- Body text renders in a serif typeface (Newsreader), not the system sans default.
- No console errors about missing fonts or invalid CSS.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css "app/[locale]/layout.tsx"
git commit -m "feat: design tokens (Archive/Academic palette) + Newsreader/Inter font loading"
```

---

### Task 2: Nav and Footer restyle

**Files:**
- Modify: `components/Nav.tsx`
- Modify: `components/Footer.tsx`

**Interfaces:**
- Consumes: `bg-cream`/`text-ink`/`text-forest`/`border-border`/`text-label` and `font-sans` from Task 1.
- Produces: nothing new consumed elsewhere — Nav/Footer are leaf components in the layout tree.

- [ ] **Step 1: Restyle Nav.tsx**

Read the current file first — preserve the `NAV_SLUGS`/`NAV_LABELS` structure and locale-switcher logic exactly (from the earlier localization fix); only change `className` values and add the wordmark/tagline block.

```tsx
// components/Nav.tsx
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
    <nav className="flex items-center justify-between border-b border-border px-10 py-5">
      <Link href="/" className="block">
        <span className="font-serif italic text-base text-ink">IEHA</span>
        <span className="block font-sans text-[9px] tracking-wide text-label">
          European Institute of Avant-Garde Heritage
        </span>
      </Link>
      <ul className="flex gap-5">
        {NAV_SLUGS.map((slug) => (
          <li key={slug}>
            <Link href={slug} className="font-sans text-[11px] uppercase tracking-wider text-label hover:text-forest">
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
              className={
                loc === locale
                  ? 'font-sans text-[11px] font-medium text-forest underline'
                  : 'font-sans text-[11px] text-label'
              }
            >
              {loc.toUpperCase()}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 2: Run Nav.test.tsx to confirm it still passes unchanged**

Run: `npx vitest run components/Nav.test.tsx`
Expected: PASS (1/1) — the test asserts on locale-switcher text content (`FR`/`EN`/`RU`/`DE`), which is unchanged.

- [ ] **Step 3: Restyle Footer.tsx**

```tsx
// components/Footer.tsx
import type { Locale } from '@/lib/content';

const FOOTER_TEXT: Record<Locale, string> = {
  fr: "Institut Européen du Patrimoine de l'Avant-Garde — Fondé en 2013",
  en: 'European Institute of Avant-Garde Heritage — Founded 2013',
  ru: 'Европейский Институт Наследия Авангарда — Основан в 2013 году',
  de: 'Europäisches Institut für das Erbe der Avantgarde — Gegründet 2013',
};

export function Footer({ locale }: { locale: Locale }) {
  return (
    <footer className="mt-24 border-t border-border px-10 py-8">
      <p className="font-serif italic text-sm text-ink-soft">{FOOTER_TEXT[locale]}</p>
      <p className="mt-1 font-sans text-xs text-label">info@ieha.org</p>
    </footer>
  );
}
```

- [ ] **Step 4: Run Footer.test.tsx to confirm it still passes unchanged**

Run: `npx vitest run components/Footer.test.tsx`
Expected: PASS (2/2) — the test asserts on the FOOTER_TEXT content per locale, which is unchanged text, only restyled.

- [ ] **Step 5: Build and manually verify**

Run: `npm run build && npm run start`, visit `/`, `/en`, `/ru`, `/de` — confirm the nav shows the italic "IEHA" wordmark with tagline underneath, sans-serif uppercase nav links, and a hairline border beneath the nav bar; confirm the footer shows italic serif institutional text.

- [ ] **Step 6: Commit**

```bash
git add components/Nav.tsx components/Footer.tsx
git commit -m "feat: restyle Nav (wordmark + tagline) and Footer to Archive/Academic identity"
```

---

### Task 3: Hero restyle (two-column split)

**Files:**
- Modify: `components/Hero.tsx`

**Interfaces:**
- Consumes: tokens/fonts from Task 1. Consumes `HomeContent` type and the existing `renderSubhead`/`LATIN_PHRASE` logic — unchanged.
- Produces: nothing new consumed elsewhere.

- [ ] **Step 1: Restyle Hero.tsx — read the current file first**

The italicization logic (`LATIN_PHRASE`, `renderSubhead`) must be preserved exactly — only the surrounding layout/className changes.

```tsx
// components/Hero.tsx
import type { HomeContent } from '@/lib/content';

const LATIN_PHRASE = 'sine ira et studio';

function renderSubhead(subhead: string) {
  const idx = subhead.indexOf(LATIN_PHRASE);
  if (idx === -1) return subhead;
  const before = subhead.slice(0, idx);
  const after = subhead.slice(idx + LATIN_PHRASE.length);
  return (
    <>
      {before}
      <em>{LATIN_PHRASE}</em>
      {after}
    </>
  );
}

export function Hero({ content }: { content: HomeContent }) {
  return (
    <header className="mx-auto flex max-w-[1100px] flex-col gap-10 px-10 py-14 md:flex-row md:items-center">
      <div className="flex-[1.3]">
        <p className="font-sans text-xs uppercase tracking-widest text-forest">{content.eyebrow}</p>
        <h1 className="mt-4 font-serif text-4xl leading-tight text-ink md:text-[34px]">{content.headline}</h1>
        <p className="mt-5 max-w-[420px] font-serif text-base leading-relaxed text-ink-soft">
          {renderSubhead(content.subhead)}
        </p>
      </div>
      <div className="hidden md:flex md:flex-1 md:items-center md:border-l md:border-border md:pl-10 md:min-h-[180px]" aria-hidden="true" />
    </header>
  );
}
```

Note: the right-column `<div>` is deliberately empty (`aria-hidden="true"`, no text) per the spec — it's a hairline rule + negative space, reserved for a future benchmark-artwork image, not new copy. It's hidden below the `md` breakpoint (stacks to single column on mobile) per spec §Responsive behavior.

- [ ] **Step 2: Run Hero.test.tsx to confirm it still passes unchanged**

Run: `npx vitest run components/Hero.test.tsx`
Expected: PASS (1/1) — the test asserts the Latin phrase renders inside an `<em>` tag, which `renderSubhead` still does identically.

- [ ] **Step 3: Build and manually verify across all 4 locales**

Run: `npm run build && npm run start`, visit `/`, `/en`, `/ru`, `/de` — confirm each shows the two-column split on desktop width (headline/subhead left, hairline rule right), and confirm at a narrow viewport (resize browser or use devtools mobile emulation) that the right column disappears and the hero becomes single-column.

- [ ] **Step 4: Commit**

```bash
git add components/Hero.tsx
git commit -m "feat: restyle Hero as two-column wide-editorial split"
```

---

### Task 4: ProsePage restyle (narrow column + section rules)

**Files:**
- Modify: `components/ProsePage.tsx`

**Interfaces:**
- Consumes: tokens/fonts from Task 1. Consumes `PageContent` type — unchanged. Used unmodified by About/Methodology/Research/Programs/Contact pages.
- Produces: nothing new consumed elsewhere.

- [ ] **Step 1: Restyle ProsePage.tsx**

```tsx
// components/ProsePage.tsx
import type { PageContent } from '@/lib/content';

export function ProsePage({ content }: { content: PageContent }) {
  return (
    <main className="mx-auto max-w-[1100px] px-10 py-16">
      <div className="max-w-[680px]">
        <h1 className="font-serif text-4xl text-ink">{content.title}</h1>
        <p className="mt-4 font-serif text-lg text-ink-soft">{content.lead}</p>
        <div className="mt-12 space-y-10">
          {content.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="border-t border-forest pt-3 font-serif text-2xl text-ink">{section.heading}</h2>
              <p className="mt-3 whitespace-pre-line font-serif text-base leading-relaxed text-ink-soft">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
```

Note: the outer `max-w-[1100px]` matches the page frame width established in Task 3's Hero (visual consistency across pages); the inner `max-w-[680px]` is the actual reading column, left-weighted (not centered) inside that frame, per spec §Component treatment.

- [ ] **Step 2: Run ProsePage.test.tsx to confirm it still passes unchanged**

Run: `npx vitest run components/ProsePage.test.tsx`
Expected: PASS (1/1) — the test asserts on the title heading role/name and section heading/body text content, all unchanged.

- [ ] **Step 3: Build and manually verify**

Run: `npm run build && npm run start`, visit `/about`, `/en/methodology`, `/ru/research`, `/de/programs` — confirm each shows a left-weighted ~680px reading column with a thin forest-colored rule above each section heading.

- [ ] **Step 4: Commit**

```bash
git add components/ProsePage.tsx
git commit -m "feat: restyle ProsePage as narrow left-weighted column with section rules"
```

---

### Task 5: Collection page restyle (CatalogueGrid + CatalogueFilter)

**Files:**
- Modify: `components/CatalogueGrid.tsx`
- Modify: `components/CatalogueFilter.tsx`

**Interfaces:**
- Consumes: tokens/fonts from Task 1. Consumes `CatalogueWork` type — unchanged.
- Produces: nothing new consumed elsewhere.

- [ ] **Step 1: Restyle CatalogueGrid.tsx**

```tsx
// components/CatalogueGrid.tsx
import Image from 'next/image';
import type { CatalogueWork } from '@/lib/content';

export function CatalogueGrid({ works }: { works: CatalogueWork[] }) {
  if (works.length === 0) {
    return <p className="font-serif italic text-ink-soft">No approved works match this filter yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {works.map((work) => (
        <figure key={work.slug} className="border-t border-border pt-4">
          <Image src={work.image} alt={work.title} width={400} height={400} className="w-full object-cover" />
          <figcaption className="mt-3">
            <p className="font-serif text-ink">
              {work.artist} — {work.title}
            </p>
            <p className="font-sans text-xs uppercase tracking-wide text-label">
              {work.date} · {work.medium}
            </p>
            <p className="mt-1 font-serif text-sm text-ink-soft">{work.caption}</p>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
```

Note: the empty-state message text ("No approved works match this filter yet.") must stay byte-identical — Task 12 of the original site-rebuild plan verified this exact string in the generated static HTML as proof the review gate works end-to-end; only its styling (italic serif) changes here.

- [ ] **Step 2: Restyle CatalogueFilter.tsx**

```tsx
// components/CatalogueFilter.tsx
'use client';
import { useState, useMemo } from 'react';
import type { CatalogueWork } from '@/lib/content';

export function CatalogueFilter({
  works,
  onFilteredChange,
}: {
  works: CatalogueWork[];
  onFilteredChange: (filtered: CatalogueWork[]) => void;
}) {
  const [artist, setArtist] = useState('');
  const artists = useMemo(() => Array.from(new Set(works.map((w) => w.artist))).sort(), [works]);

  function handleChange(value: string) {
    setArtist(value);
    const filtered = value ? works.filter((w) => w.artist === value) : works;
    onFilteredChange(filtered);
  }

  return (
    <label className="block">
      <span className="font-sans text-xs uppercase tracking-wide text-label">Filter by artist</span>
      <select
        aria-label="Filter by artist"
        value={artist}
        onChange={(e) => handleChange(e.target.value)}
        className="mt-1 block border-b border-border bg-transparent font-serif text-ink focus:border-forest focus:outline-none"
      >
        <option value="">All artists</option>
        {artists.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
    </label>
  );
}
```

- [ ] **Step 3: Run CatalogueFilter.test.tsx to confirm it still passes unchanged**

Run: `npx vitest run components/CatalogueFilter.test.tsx`
Expected: PASS (1/1) — the test asserts on filtered output given a simulated artist selection, not on styling.

- [ ] **Step 4: Build and manually verify**

Run: `npm run build && npm run start`, visit `/collection` in all 4 locales — confirm the empty-state message renders in italic serif (all 10 catalogue entries are still draft, so this is the only reachable state), and confirm the filter control shows the restyled label/select.

- [ ] **Step 5: Commit**

```bash
git add components/CatalogueGrid.tsx components/CatalogueFilter.tsx
git commit -m "feat: restyle Collection page (grid + filter) to Archive/Academic identity"
```

---

### Task 6: Full-site verification

**Files:** none (verification only).

**Interfaces:** consumes the fully restyled app from Tasks 1-5.

- [ ] **Step 1: Run the complete test suite**

Run: `npx vitest run`
Expected: all tests pass (34/34 — the same count as before this plan started, since no test files were added or removed, only implementations restyled underneath already-passing assertions).

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Full clean build**

Run: `rm -rf .next && npm run build`
Expected: succeeds, all 28 routes (4 locales × 7 pages) present in the route table as SSG, matching the route count from before this plan.

- [ ] **Step 4: Manual cross-page, cross-locale visual check**

Run: `npm run start`, then visit every combination of the 7 pages × 4 locales (28 URLs: `/`, `/about`, `/methodology`, `/research`, `/programs`, `/collection`, `/contact` and their `/en`, `/ru`, `/de` equivalents). For each, confirm:
- Cream background, ink text, no leftover default-Tailwind gray/white anywhere.
- Newsreader serif renders for headlines/body; Inter sans renders for nav links and labels.
- No console errors (check browser devtools).
- Nav wordmark + tagline + hairline border present and consistent across all pages.

- [ ] **Step 5: Commit a verification note**

No code change — if all checks in Steps 1-4 pass, the branch is ready for DC to review and decide when to deploy (deployment itself is a separate, explicit step, same convention as the original site-rebuild plan — do not deploy as part of this task).

```bash
git log --oneline -8
```

Confirm the 5 feature commits from Tasks 1-5 are present and this plan's work is complete.

---

## Self-Review Notes

**Spec coverage:** Foundations (Task 1: color tokens + fonts), every component listed in spec §Component treatment (Tasks 2-5: Nav, Footer, Hero, ProsePage, CatalogueGrid, CatalogueFilter), responsive behavior (Task 3: hero stacks on mobile), implementation approach (Task 1: `@theme` + `next/font/google` exactly as specified). Explicitly-out-of-scope items (new pull-quote copy, catalogue imagery integration, logo/mark beyond the wordmark) are not present in any task, matching the spec.

**Placeholder scan:** no TBD/TODO. All code blocks are complete, real implementations.

**Type consistency:** `Locale`, `HomeContent`, `PageContent`, `CatalogueWork` types are consumed exactly as already defined in `lib/content.ts` (untouched by this plan) — no new types introduced, no signature drift across tasks.

**Regression discipline:** every task that modifies a component with an existing test explicitly re-runs that test and states the exact expected pass count, rather than assuming styling-only changes are safe.
