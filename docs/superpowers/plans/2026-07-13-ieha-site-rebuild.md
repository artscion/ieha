# IEHA Site Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully operational, 4-locale (fr default / en / ru / de) Next.js marketing site for IEHA in `artscion/ieha`, with a Keystatic CMS and a curated avant-garde catalogue page, deployed to a sandbox Netlify site — without touching the current production `ieha.fr` deployment.

**Architecture:** Next.js (App Router) with `next-intl` for locale routing (`fr` unprefixed default, `en`/`ru`/`de` prefixed), Keystatic CMS in GitHub-storage mode mounted at `/keystatic` for content editing, and a thin content-reader layer (`lib/content.ts`) that Server Components call to fetch locale-specific page/catalogue content via Keystatic's Reader API.

**Tech Stack:** Next.js 16 (App Router, TypeScript), Tailwind CSS v4, next-intl v4, Keystatic (`@keystatic/core` + `@keystatic/next`), Vitest + React Testing Library, deployed to Netlify via `@netlify/plugin-nextjs`.

## Global Constraints

- Locales: `fr` (default, unprefixed root), `en`, `ru`, `de` (prefixed: `/en`, `/ru`, `/de`) — from spec §Routing & i18n.
- All 6 prose pages (Home, About, Methodology, Research, Programs, Contact) + Collection ship in all 4 locales — from spec §Pages & content model.
- "sine ira et studio" stays in Latin, unset from translation, in all locales — from spec §Home hero.
- All LLM-drafted translations (everything except the Home hero, which DC wrote) must be visibly flagged as drafts pending review — not silently treated as final — from spec §Content sourcing / §QA.
- Catalogue entries must default to unpublished (`reviewStatus: 'draft'`) and only render publicly once explicitly marked `'approved'` — from spec §Collection page (provenance review gate).
- Do NOT touch the production `ieha` Netlify project, its git integration, or the `ieha.fr` domain mapping at any point in this plan — from spec §Deployment & preview strategy.
- Do NOT connect anything in this project to the `kgb-fdc` Firebase Data Connect database — from spec §Collection page.
- Never commit directly to `main` — all work happens on `feat/site-rebuild` (already created) or task-scoped branches off it.
- Repo `artscion/ieha` is currently empty (0 prior commits besides the spec doc committed at `81966ca`).

---

## File Structure

```
artscion-ieha/
├── package.json, tsconfig.json, next.config.ts, postcss.config.mjs, netlify.toml
├── proxy.ts                          # next-intl locale routing (Next.js 16 "proxy" convention)
├── keystatic.config.ts               # Keystatic schema: page singletons + catalogue collection
├── i18n/
│   ├── routing.ts                    # defineRouting: locales, defaultLocale, localePrefix
│   ├── navigation.ts                 # createNavigation: Link, useRouter, usePathname, redirect
│   └── request.ts                    # getRequestConfig for next-intl
├── lib/
│   └── content.ts                    # Keystatic reader wrapper + types (Locale, PageContent, HomeContent, CatalogueWork)
├── components/
│   ├── Nav.tsx                       # nav + locale switcher
│   ├── Footer.tsx
│   ├── Hero.tsx                      # Home hero (eyebrow/headline/subhead, italicizes "sine ira et studio")
│   ├── ProsePage.tsx                 # generic title/lead/sections renderer (About/Methodology/Research/Programs/Contact)
│   ├── CatalogueGrid.tsx
│   └── CatalogueFilter.tsx
├── app/
│   ├── layout.tsx                    # bare root layout (no html/body — that's in [locale]/layout.tsx)
│   ├── keystatic/[[...params]]/page.tsx
│   ├── api/keystatic/[...params]/route.ts
│   └── [locale]/
│       ├── layout.tsx                # html/body, NextIntlClientProvider, Nav, Footer
│       ├── page.tsx                  # Home
│       ├── about/page.tsx
│       ├── methodology/page.tsx
│       ├── research/page.tsx
│       ├── programs/page.tsx
│       ├── contact/page.tsx
│       └── collection/page.tsx
├── content/
│   ├── pages/{home,about,methodology,research,programs,contact}/{fr,en,ru,de}.yaml
│   └── catalogue/{work-slug}/index.yaml  (+ images copied to public/catalogue/)
└── public/catalogue/*.jpg
```

Each content page is one Keystatic singleton per (page × locale) — 24 singletons total, generated programmatically in `keystatic.config.ts` via a small factory loop rather than 24 hand-written blocks (DRY).

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `app/globals.css`, `app/layout.tsx`, `netlify.toml`, `.gitignore`

**Interfaces:**
- Produces: a bootable Next.js 16 App Router project with Tailwind v4 wired in, and a Netlify build config targeting `@netlify/plugin-nextjs`. Nothing yet consumes this — it's the foundation every later task builds on.

- [ ] **Step 1: Initialize package.json and install dependencies**

```bash
cd /Users/dcshch/Sites/artscion-ieha
npm init -y
npm install next@16.2.10 react@latest react-dom@latest
npm install -D typescript@5 @types/node @types/react @types/react-dom tailwindcss@4.3.2 @tailwindcss/postcss vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

**Pin `typescript@5`, not latest.** `typescript` shipped a major version 7 (a Go-native compiler rewrite) that is currently incompatible with Next.js 16.2.10's build tooling — an unpinned install crashes `next build` with `The "id" argument must be of type string. Received undefined` after the TypeScript phase, which is easy to mistake for a config bug. Confirmed during Task 1 execution: pinning to `typescript@5` (resolved `5.9.3` at the time) fixes it.

- [ ] **Step 2: Add package.json scripts**

Edit `package.json`, add:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run"
  }
}
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create next.config.ts**

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {};

export default nextConfig;
```

(This gets wrapped with the next-intl plugin in Task 2.)

- [ ] **Step 5: Create postcss.config.mjs and app/globals.css for Tailwind v4**

```javascript
// postcss.config.mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

```css
/* app/globals.css */
@import "tailwindcss";
```

- [ ] **Step 6: Create bare root layout**

```tsx
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

(The real `<html>`/`<body>` shell lives in `app/[locale]/layout.tsx`, added in Task 2 — root layout stays a pass-through since locale isn't known until that segment.)

- [ ] **Step 7: Create netlify.toml**

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

- [ ] **Step 8: Create .gitignore**

```
node_modules/
.next/
.env
.env.local
```

- [ ] **Step 9: Verify the project builds**

Run: `npm run build`
Expected: build succeeds (Next.js 16 treats an app with no page routes as valid — it emits only a bare `/404`). Confirm the route table shows no real routes yet (there's no `app/[locale]/page.tsx` until Task 2), and that there's no error output — a crash at this step means something in the scaffold itself is wrong, not that routes are missing.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts postcss.config.mjs app/globals.css app/layout.tsx netlify.toml .gitignore
git commit -m "chore: scaffold Next.js 16 + Tailwind v4 project"
```

---

### Task 2: i18n routing (next-intl, fr default)

**Files:**
- Create: `i18n/routing.ts`, `i18n/navigation.ts`, `i18n/request.ts`, `proxy.ts`, `app/[locale]/layout.tsx`
- Modify: `next.config.ts`
- Test: `i18n/routing.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks (this is foundational).
- Produces: `routing` (next-intl `Routing` object, locales `['fr','en','ru','de']`, `defaultLocale: 'fr'`), and from `i18n/navigation.ts`: `Link`, `useRouter`, `usePathname`, `redirect` — all consumed by `components/Nav.tsx` (Task 4) and every page.

- [ ] **Step 1: Install next-intl**

```bash
npm install next-intl@4.13.2
```

- [ ] **Step 2: Write the routing config**

```typescript
// i18n/routing.ts
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['fr', 'en', 'ru', 'de'],
  defaultLocale: 'fr',
  localePrefix: 'as-needed',
});
```

- [ ] **Step 3: Write a failing test for the routing config**

```typescript
// i18n/routing.test.ts
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
```

- [ ] **Step 4: Create a Vitest config so the test can run**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
});
```

```typescript
// vitest.setup.ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run i18n/routing.test.ts`
Expected: 3 passing tests (this is a config-correctness test, not TDD-red-first, since `routing.ts` is trivial declarative config — writing it wrong would just fail this test immediately, which is the point).

- [ ] **Step 6: Create the navigation helpers**

```typescript
// i18n/navigation.ts
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
```

- [ ] **Step 7: Create the request config**

```typescript
// i18n/request.ts
import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return { locale, messages: {} };
});
```

`messages: {}` is required — `<NextIntlClientProvider>` (used without an explicit `messages` prop in `app/[locale]/layout.tsx`) calls `getMessages()` internally, which throws `Error: No messages found` if this config doesn't return a `messages` key at all. An empty object is correct here: this project has no next-intl message catalog — page copy comes from `lib/content.ts`/Keystatic, not `next-intl`'s translation system. (Found during Task 2: this bug was masked at first because dynamic rendering deferred the error to request time; it surfaced once `setRequestLocale` enabled static rendering.)

- [ ] **Step 8: Create proxy.ts (Next.js 16's renamed middleware.ts)**

```typescript
// proxy.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: '/((?!api|_next|_vercel|keystatic|.*\\..*).*)',
};
```

Note: the matcher excludes `keystatic` (the CMS admin route added in Task 3) so the admin UI is never locale-rewritten.

- [ ] **Step 9: Wrap next.config.ts with the next-intl plugin**

```typescript
// next.config.ts
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
```

- [ ] **Step 10: Create the locale layout**

```tsx
// app/[locale]/layout.tsx
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import '../globals.css';

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
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
```

`setRequestLocale(locale)` is required — without it, next-intl opts every page under this layout into dynamic (per-request) rendering even though `generateStaticParams` is present. This is next-intl's own documented requirement (a "temporary API" per their docs, called in every layout/page you want statically rendered), not optional boilerplate.

- [ ] **Step 11: Add a temporary placeholder Home page so the build can succeed end to end**

```tsx
// app/[locale]/page.tsx
import { setRequestLocale } from 'next-intl/server';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <main>placeholder — replaced in Task 5</main>;
}
```

- [ ] **Step 12: Run the build to verify locale routing works**

Run: `npm run build`
Expected: build succeeds. Check the build's route table (or `.next/prerender-manifest.json`'s `routes` key) for `/`, `/en`, `/ru`, `/de` appearing as prerendered/static routes, not just the default `/_not-found`/`/_global-error` fallbacks — that's the concrete evidence `setRequestLocale` worked, not just that the build didn't crash.

- [ ] **Step 13: Commit**

```bash
git add i18n proxy.ts next.config.ts app/[locale]/layout.tsx app/[locale]/page.tsx vitest.config.ts vitest.setup.ts package.json package-lock.json
git commit -m "feat: next-intl locale routing, fr default unprefixed"
```

---

### Task 3: Keystatic CMS setup

**Files:**
- Create: `keystatic.config.ts`, `app/keystatic/[[...params]]/page.tsx`, `app/api/keystatic/[...params]/route.ts`, `lib/content.ts`
- Test: `lib/content.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks directly (parallel to i18n), but its singleton/collection key naming convention (`${slug}_${locale}`, e.g. `home_fr`) is what Task 5–12's content files and `lib/content.ts` both rely on.
- Produces from `lib/content.ts`:
  - `type Locale = 'fr' | 'en' | 'ru' | 'de'`
  - `type PageSlug = 'about' | 'methodology' | 'research' | 'programs' | 'contact'`
  - `type HomeContent = { eyebrow: string; headline: string; subhead: string }`
  - `type PageContent = { title: string; lead: string; sections: { heading: string; body: string }[] }`
  - `type CatalogueWork = { slug: string; title: string; artist: string; date: string; medium: string; image: string; tags: string[]; caption: string; sourceCitation: string }`
  - `getHomeContent(locale: Locale): Promise<HomeContent>`
  - `getPageContent(locale: Locale, slug: PageSlug): Promise<PageContent>`
  - `getCatalogueWorks(locale: Locale): Promise<CatalogueWork[]>` — only entries with `reviewStatus: 'approved'`, ordered by `title`.

- [ ] **Step 1: Install Keystatic**

```bash
npm install @keystatic/core@0.5.51 @keystatic/next@5.0.4
```

- [ ] **Step 2: Write keystatic.config.ts with generated page singletons**

```typescript
// keystatic.config.ts
import { config, fields, singleton, collection } from '@keystatic/core';

const LOCALES = ['fr', 'en', 'ru', 'de'] as const;
const PAGE_SLUGS = ['about', 'methodology', 'research', 'programs', 'contact'] as const;

function homeSingleton(locale: string) {
  return singleton({
    label: `Home (${locale})`,
    path: `content/pages/home/${locale}/`,
    schema: {
      eyebrow: fields.text({ label: 'Eyebrow' }),
      headline: fields.text({ label: 'Headline' }),
      subhead: fields.text({ label: 'Subhead', multiline: true }),
    },
  });
}

function prosePageSingleton(slug: string, locale: string) {
  return singleton({
    label: `${slug} (${locale})`,
    path: `content/pages/${slug}/${locale}/`,
    schema: {
      title: fields.text({ label: 'Title' }),
      lead: fields.text({ label: 'Lead', multiline: true }),
      sections: fields.array(
        fields.object({
          heading: fields.text({ label: 'Section heading' }),
          body: fields.text({ label: 'Section body', multiline: true }),
        }),
        { label: 'Sections', itemLabel: (props) => props.fields.heading.value || 'Section' }
      ),
    },
  });
}

const homeSingletons = Object.fromEntries(
  LOCALES.map((locale) => [`home_${locale}`, homeSingleton(locale)])
);

const proseSingletons = Object.fromEntries(
  PAGE_SLUGS.flatMap((slug) =>
    LOCALES.map((locale) => [`${slug}_${locale}`, prosePageSingleton(slug, locale)])
  )
);

export default config({
  storage: {
    kind: 'github',
    repo: 'artscion/ieha',
  },
  singletons: {
    ...homeSingletons,
    ...proseSingletons,
  },
  collections: {
    catalogue_works: collection({
      label: 'Catalogue works',
      slugField: 'title',
      path: 'content/catalogue/*',
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        artist: fields.text({ label: 'Artist' }),
        date: fields.text({ label: 'Date / period' }),
        medium: fields.text({ label: 'Medium' }),
        image: fields.image({ label: 'Image', directory: 'public/catalogue', publicPath: '/catalogue/' }),
        tags: fields.array(fields.text({ label: 'Tag' }), { label: 'Tags', itemLabel: (props) => props.value }),
        sourceCitation: fields.text({ label: 'Source citation (which CATALOGUE_AVANTGARDE file this came from)' }),
        reviewStatus: fields.select({
          label: 'Review status',
          options: [
            { label: 'Draft (not shown publicly)', value: 'draft' },
            { label: 'Approved', value: 'approved' },
          ],
          defaultValue: 'draft',
        }),
        caption_fr: fields.text({ label: 'Caption (FR)', multiline: true }),
        caption_en: fields.text({ label: 'Caption (EN)', multiline: true }),
        caption_ru: fields.text({ label: 'Caption (RU)', multiline: true }),
        caption_de: fields.text({ label: 'Caption (DE)', multiline: true }),
      },
    }),
  },
});
```

- [ ] **Step 3: Mount the admin UI**

```tsx
// app/keystatic/[[...params]]/page.tsx
'use client';
import { makePage } from '@keystatic/next/ui/app';
import keystaticConfig from '../../../keystatic.config';

export default makePage(keystaticConfig);
```

- [ ] **Step 4: Mount the API route**

```typescript
// app/api/keystatic/[...params]/route.ts
import { makeRouteHandler } from '@keystatic/next/route-handler';
import keystaticConfig from '../../../../keystatic.config';

export const { POST, GET } = makeRouteHandler({ config: keystaticConfig });
```

- [ ] **Step 5: Write lib/content.ts**

```typescript
// lib/content.ts
import { createReader } from '@keystatic/core/reader';
import keystaticConfig from '../keystatic.config';

const reader = createReader(process.cwd(), keystaticConfig);

export type Locale = 'fr' | 'en' | 'ru' | 'de';
export type PageSlug = 'about' | 'methodology' | 'research' | 'programs' | 'contact';

export type HomeContent = {
  eyebrow: string;
  headline: string;
  subhead: string;
};

export type PageContent = {
  title: string;
  lead: string;
  sections: { heading: string; body: string }[];
};

export type CatalogueWork = {
  slug: string;
  title: string;
  artist: string;
  date: string;
  medium: string;
  image: string;
  tags: string[];
  caption: string;
  sourceCitation: string;
};

const CAPTION_FIELD: Record<Locale, 'caption_fr' | 'caption_en' | 'caption_ru' | 'caption_de'> = {
  fr: 'caption_fr',
  en: 'caption_en',
  ru: 'caption_ru',
  de: 'caption_de',
};

export async function getHomeContent(locale: Locale): Promise<HomeContent> {
  const key = `home_${locale}` as keyof typeof reader.singletons;
  const entry = await reader.singletons[key].read();
  if (!entry) throw new Error(`Missing home content for locale "${locale}"`);
  return { eyebrow: entry.eyebrow, headline: entry.headline, subhead: entry.subhead };
}

export async function getPageContent(locale: Locale, slug: PageSlug): Promise<PageContent> {
  const key = `${slug}_${locale}` as keyof typeof reader.singletons;
  const entry = await reader.singletons[key].read();
  if (!entry) throw new Error(`Missing "${slug}" content for locale "${locale}"`);
  return {
    title: entry.title,
    lead: entry.lead,
    sections: entry.sections.map((s: { heading: string; body: string }) => ({
      heading: s.heading,
      body: s.body,
    })),
  };
}

export async function getCatalogueWorks(locale: Locale): Promise<CatalogueWork[]> {
  const slugs = await reader.collections.catalogue_works.list();
  const entries = await Promise.all(
    slugs.map(async (slug) => {
      const entry = await reader.collections.catalogue_works.read(slug);
      return entry ? { slug, entry } : null;
    })
  );

  const captionField = CAPTION_FIELD[locale];

  return entries
    .filter((e): e is { slug: string; entry: NonNullable<typeof e>['entry'] } => e !== null)
    .filter(({ entry }) => entry.reviewStatus === 'approved')
    .map(({ slug, entry }) => ({
      slug,
      title: entry.title,
      artist: entry.artist,
      date: entry.date,
      medium: entry.medium,
      image: entry.image ?? '',
      tags: entry.tags,
      caption: entry[captionField],
      sourceCitation: entry.sourceCitation,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}
```

- [ ] **Step 6: Add required Keystatic env vars to a local .env.local (not committed) and document them**

```bash
# .env.local (create manually, already gitignored)
KEYSTATIC_GITHUB_CLIENT_ID=<from GitHub App>
KEYSTATIC_GITHUB_CLIENT_SECRET=<from GitHub App>
KEYSTATIC_SECRET=<openssl rand -base64 32>
```

Registering the GitHub App itself (Settings → Developer settings → GitHub Apps on the `artscion` org, with callback URL `<sandbox-site-url>/api/keystatic/github/oauth/callback`) is a manual one-time step for whoever has org admin — not scriptable, do it before Task 14's deploy and add the same three vars in the Netlify site's environment settings.

- [ ] **Step 7: Write a failing test for the content reader against fixture content**

```typescript
// lib/content.test.ts
import { describe, it, expect } from 'vitest';
import { getHomeContent } from './content';

describe('getHomeContent', () => {
  it('reads the fr home content with the DC-provided headline', async () => {
    const content = await getHomeContent('fr');
    expect(content.headline).toBe("Restituer son objectivité à l'art de l'avant-garde.");
  });
});
```

- [ ] **Step 8: Run the test to verify it fails (no content committed yet)**

Run: `npx vitest run lib/content.test.ts`
Expected: FAIL — `content/pages/home/fr` doesn't exist yet, reader throws or returns null.

- [ ] **Step 9: Add minimal fr home content so the test passes**

```yaml
# content/pages/home/fr/index.yaml
eyebrow: Institut Européen du Patrimoine de l'Avant-Garde
headline: Restituer son objectivité à l'art de l'avant-garde.
subhead: >-
  Nous étudions les œuvres étalons du haut avant-gardisme — sine ira et
  studio, sans colère ni parti pris — pour percevoir, au-delà du mythe et
  du marché, la substance artistique elle-même.
```

- [ ] **Step 10: Run the test to verify it passes**

Run: `npx vitest run lib/content.test.ts`
Expected: PASS

- [ ] **Step 11: Run the full build to make sure Keystatic's admin route compiles**

Run: `npm run build`
Expected: build succeeds, `/keystatic` appears in the route table.

- [ ] **Step 12: Commit**

```bash
git add keystatic.config.ts app/keystatic app/api/keystatic lib/content.ts lib/content.test.ts content/pages/home/fr package.json package-lock.json
git commit -m "feat: Keystatic CMS (GitHub-storage mode) + content reader layer"
```

---

### Task 4: Shared UI shell (Nav + Footer)

**Files:**
- Create: `components/Nav.tsx`, `components/Footer.tsx`
- Modify: `app/[locale]/layout.tsx`
- Test: `components/Nav.test.tsx`

**Interfaces:**
- Consumes: `i18n/navigation.ts`'s `Link`, `i18n/routing.ts`'s `routing.locales`.
- Produces: `<Nav locale={locale} />`, `<Footer />` — consumed by `app/[locale]/layout.tsx` and, transitively, every page.

- [ ] **Step 1: Write a failing test for the locale switcher**

```tsx
// components/Nav.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { Nav } from './Nav';

describe('Nav', () => {
  it('renders a link for all four locales', () => {
    render(
      <NextIntlClientProvider locale="fr">
        <Nav locale="fr" />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('FR')).toBeInTheDocument();
    expect(screen.getByText('EN')).toBeInTheDocument();
    expect(screen.getByText('RU')).toBeInTheDocument();
    expect(screen.getByText('DE')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/Nav.test.tsx`
Expected: FAIL — `./Nav` module doesn't exist yet.

- [ ] **Step 3: Write Nav.tsx**

```tsx
// components/Nav.tsx
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/Nav.test.tsx`
Expected: PASS

- [ ] **Step 5: Write Footer.tsx**

```tsx
// components/Footer.tsx
export function Footer() {
  return (
    <footer className="mt-24 border-t px-6 py-8 text-sm text-neutral-500">
      <p>European Institute of Avant-Garde Heritage — Founded 2013</p>
      <p>info@ieha.org</p>
    </footer>
  );
}
```

- [ ] **Step 6: Wire Nav + Footer into the locale layout**

```tsx
// app/[locale]/layout.tsx
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import type { Locale } from '@/lib/content';
import '../globals.css';

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
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>
          <Nav locale={locale as Locale} />
          {children}
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 7: Run the build to verify nothing broke**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 8: Commit**

```bash
git add components/Nav.tsx components/Nav.test.tsx components/Footer.tsx app/[locale]/layout.tsx
git commit -m "feat: Nav with locale switcher + Footer"
```

---

### Task 5: Home page (hero content, all 4 locales)

**Files:**
- Create: `components/Hero.tsx`, `content/pages/home/{en,ru,de}/index.yaml` (fr already exists from Task 3)
- Modify: `app/[locale]/page.tsx`
- Test: `components/Hero.test.tsx`

**Interfaces:**
- Consumes: `getHomeContent(locale)` from `lib/content.ts` (Task 3).
- Produces: `<Hero content={content} />` — used only by `app/[locale]/page.tsx`.

- [ ] **Step 1: Write a failing test for the Latin-phrase italicization**

```tsx
// components/Hero.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Hero } from './Hero';

describe('Hero', () => {
  it('italicizes "sine ira et studio" inside the subhead', () => {
    render(
      <Hero
        content={{
          eyebrow: 'Test Eyebrow',
          headline: 'Test Headline',
          subhead: 'We study the works — sine ira et studio, without anger.',
        }}
      />
    );
    const em = screen.getByText('sine ira et studio');
    expect(em.tagName).toBe('EM');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/Hero.test.tsx`
Expected: FAIL — `./Hero` doesn't exist.

- [ ] **Step 3: Write Hero.tsx**

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
    <header className="mx-auto max-w-4xl px-6 py-24 text-center">
      <p className="text-sm uppercase tracking-widest text-neutral-500">{content.eyebrow}</p>
      <h1 className="mt-4 text-5xl font-semibold leading-tight">{content.headline}</h1>
      <p className="mt-6 text-lg text-neutral-600">{renderSubhead(content.subhead)}</p>
    </header>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/Hero.test.tsx`
Expected: PASS

- [ ] **Step 5: Add en/ru/de home content (DC's final copy from the spec)**

```yaml
# content/pages/home/en/index.yaml
eyebrow: European Institute of Avant-Garde Heritage
headline: Restoring objectivity to the art of the avant-garde.
subhead: >-
  We study the benchmark works of the high avant-garde — sine ira et
  studio, without anger or partiality — to see past the mythology and
  the market, to the artistic substance itself.
```

```yaml
# content/pages/home/ru/index.yaml
eyebrow: Европейский Институт Наследия Авангарда
headline: Возвращая объективность искусству авангарда.
subhead: >-
  Мы изучаем эталонные произведения высокого авангарда — sine ira et
  studio, без гнева и пристрастия — чтобы за мифологией и рынком
  увидеть само художественное вещество.
```

```yaml
# content/pages/home/de/index.yaml
eyebrow: Europäisches Institut für das Erbe der Avantgarde
headline: Der Kunst der Avantgarde ihre Objektivität zurückgeben.
subhead: >-
  Wir untersuchen die Referenzwerke der Hochavantgarde — sine ira et
  studio, ohne Zorn und ohne Voreingenommenheit — um hinter Mythos und
  Markt die künstlerische Substanz selbst sichtbar zu machen.
```

- [ ] **Step 6: Wire the Home page**

```tsx
// app/[locale]/page.tsx
import { setRequestLocale } from 'next-intl/server';
import { getHomeContent } from '@/lib/content';
import { Hero } from '@/components/Hero';
import type { Locale } from '@/lib/content';

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const content = await getHomeContent(locale);
  return <Hero content={content} />;
}
```

- [ ] **Step 7: Run the build and manually verify all 4 locale homepages**

Run: `npm run build && npm run start`
Then visit `http://localhost:3000/`, `/en`, `/ru`, `/de` and confirm each shows its own headline (the fr, en, ru, de strings written above respectively) and that "sine ira et studio" is italicized in each.

- [ ] **Step 8: Commit**

```bash
git add components/Hero.tsx components/Hero.test.tsx app/[locale]/page.tsx content/pages/home
git commit -m "feat: Home page with DC-provided hero copy in all 4 locales"
```

---

### Task 6: About page (content + translations, all 4 locales)

**Files:**
- Create: `components/ProsePage.tsx`, `content/pages/about/{fr,en,ru,de}/index.yaml`
- Create: `app/[locale]/about/page.tsx`
- Test: `components/ProsePage.test.tsx`

**Interfaces:**
- Consumes: `getPageContent(locale, 'about')` from `lib/content.ts`.
- Produces: `<ProsePage content={content} />` — generic component reused by Tasks 7–10 for Methodology/Research/Programs/Contact.

**Content note:** the source EN text below is condensed from the existing `~/Sites/ieha_fr/about.html` (Mission, guiding principle, approach) rather than porting every card/grid from that denser academic-brochure layout — a deliberate simplification consistent with the spec's visual-design section (clean, purpose-built identity, not a literal port). RU/DE/FR are translated here using the glossary established by DC's hero copy: "avant-garde" → авангард/Avantgarde/avant-garde, "objectivity" → объективность/Objektivität/objectivité, "sine ira et studio" stays Latin everywhere. **These translations are drafts — flagged per spec for DC/fluent-reviewer sign-off before go-live, same as every other non-hero translation in this plan.**

- [ ] **Step 1: Write a failing test for ProsePage**

```tsx
// components/ProsePage.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProsePage } from './ProsePage';

describe('ProsePage', () => {
  it('renders title, lead, and every section heading', () => {
    render(
      <ProsePage
        content={{
          title: 'Test Title',
          lead: 'Test lead paragraph.',
          sections: [
            { heading: 'Section One', body: 'Body one.' },
            { heading: 'Section Two', body: 'Body two.' },
          ],
        }}
      />
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Test Title' })).toBeInTheDocument();
    expect(screen.getByText('Test lead paragraph.')).toBeInTheDocument();
    expect(screen.getByText('Section One')).toBeInTheDocument();
    expect(screen.getByText('Section Two')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/ProsePage.test.tsx`
Expected: FAIL — `./ProsePage` doesn't exist.

- [ ] **Step 3: Write ProsePage.tsx**

```tsx
// components/ProsePage.tsx
import type { PageContent } from '@/lib/content';

export function ProsePage({ content }: { content: PageContent }) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-semibold">{content.title}</h1>
      <p className="mt-4 text-lg text-neutral-600">{content.lead}</p>
      <div className="mt-12 space-y-10">
        {content.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-2xl font-medium">{section.heading}</h2>
            <p className="mt-3 whitespace-pre-line text-neutral-700">{section.body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/ProsePage.test.tsx`
Expected: PASS

- [ ] **Step 5: Add About content — EN**

```yaml
# content/pages/about/en/index.yaml
title: About IEHA
lead: >-
  Restoring objective artistic quality as the foundation for understanding
  and authenticating high avant-garde art.
sections:
  - heading: Our Mission
    body: >-
      To reestablish objective artistic quality as the foundation for
      understanding and authenticating high avant-garde art, moving beyond
      excessive interpretation, mythology, and market-driven hype.
  - heading: Sine ira et studio
    body: >-
      "Without anger and prejudice." This classical principle demands
      rigorous objectivity — free from uncritical reverence for formerly
      forbidden works, reflexive skepticism, over-intellectualization that
      obscures the artwork itself, and fashion-driven market valuations.
  - heading: Our Approach
    body: >-
      Our methodology prioritizes direct engagement with artworks, allowing
      formal qualities, technical mastery, and genuine innovation to speak
      louder than theoretical constructs or marketplace enthusiasm. We
      specialize in the transformative period of 1890-1930 — the classical
      avant-garde's peak, before commercialization and dilution.
```

- [ ] **Step 6: Add About content — RU**

```yaml
# content/pages/about/ru/index.yaml
title: Об институте
lead: >-
  Восстановление объективного художественного качества как основы для
  понимания и атрибуции высокого авангарда.
sections:
  - heading: Наша миссия
    body: >-
      Восстановить объективное художественное качество как основу для
      понимания и атрибуции высокого авангарда, выходя за пределы
      избыточной интерпретации, мифологизации и рыночного ажиотажа.
  - heading: Sine ira et studio
    body: >-
      «Без гнева и пристрастия». Этот классический принцип требует строгой
      объективности — свободной от некритического преклонения перед некогда
      запрещёнными произведениями, обывательского скептицизма, чрезмерной
      интеллектуализации, заслоняющей само произведение, и рыночной
      конъюнктуры.
  - heading: Наш подход
    body: >-
      Наша методология отдаёт приоритет непосредственному контакту с
      произведением, позволяя формальным качествам, техническому мастерству
      и подлинному новаторству говорить громче теоретических построений и
      рыночного энтузиазма. Мы специализируемся на переломном периоде
      1890-1930 годов — вершине классического авангарда, предшествующей
      коммерциализации и размыванию.
```

- [ ] **Step 7: Add About content — DE**

```yaml
# content/pages/about/de/index.yaml
title: Über IEHA
lead: >-
  Die objektive künstlerische Qualität als Grundlage für das Verständnis
  und die Authentifizierung der Hochavantgarde wiederherstellen.
sections:
  - heading: Unsere Mission
    body: >-
      Die objektive künstlerische Qualität als Grundlage für das Verständnis
      und die Authentifizierung der Hochavantgarde wiederherzustellen -
      jenseits von Überinterpretation, Mythologisierung und
      marktgetriebenem Hype.
  - heading: Sine ira et studio
    body: >-
      "Ohne Zorn und Voreingenommenheit." Dieses klassische Prinzip verlangt
      strenge Objektivität - frei von unkritischer Verehrung einst
      verbotener Werke, plebejischer Skepsis, einer Überintellektualisierung,
      die das Werk selbst verdeckt, sowie modeabhängigen Marktbewertungen.
  - heading: Unser Ansatz
    body: >-
      Unsere Methodik stellt die unmittelbare Auseinandersetzung mit dem
      Werk in den Vordergrund und lässt formale Qualität, technische
      Meisterschaft und echte Innovation lauter sprechen als theoretische
      Konstrukte oder Marktbegeisterung. Wir widmen uns der Umbruchzeit von
      1890 bis 1930 - dem Höhepunkt der klassischen Avantgarde vor
      Kommerzialisierung und Verwässerung.
```

- [ ] **Step 8: Add About content — FR**

```yaml
# content/pages/about/fr/index.yaml
title: À propos de l'IEHA
lead: >-
  Rétablir la qualité artistique objective comme fondement de la
  compréhension et de l'authentification du haut avant-gardisme.
sections:
  - heading: Notre mission
    body: >-
      Rétablir la qualité artistique objective comme fondement de la
      compréhension et de l'authentification du haut avant-gardisme,
      au-delà de l'interprétation excessive, de la mythologisation et de
      l'engouement du marché.
  - heading: Sine ira et studio
    body: >-
      « Sans colère ni parti pris. » Ce principe classique exige une
      objectivité rigoureuse - libre de la vénération irraisonnée des
      œuvres autrefois interdites, du scepticisme populaire, d'une
      sur-intellectualisation qui occulte l'œuvre elle-même, et des
      cotations dictées par les modes du marché.
  - heading: Notre démarche
    body: >-
      Notre méthodologie privilégie la confrontation directe à l'œuvre,
      laissant les qualités formelles, la maîtrise technique et
      l'innovation véritable primer sur les constructions théoriques ou
      l'enthousiasme marchand. Nous nous consacrons à la période charnière
      de 1890 à 1930 - l'apogée de l'avant-garde classique, avant sa
      commercialisation et sa dilution.
```

- [ ] **Step 9: Wire the About page**

```tsx
// app/[locale]/about/page.tsx
import { setRequestLocale } from 'next-intl/server';
import { getPageContent } from '@/lib/content';
import { ProsePage } from '@/components/ProsePage';
import type { Locale } from '@/lib/content';

export default async function AboutPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const content = await getPageContent(locale, 'about');
  return <ProsePage content={content} />;
}
```

- [ ] **Step 10: Build and manually verify all 4 locales render distinct About content**

Run: `npm run build && npm run start`, visit `/about`, `/en/about`, `/ru/about`, `/de/about`.

- [ ] **Step 11: Commit**

```bash
git add components/ProsePage.tsx components/ProsePage.test.tsx content/pages/about app/[locale]/about
git commit -m "feat: About page (generic ProsePage renderer + 4-locale content, draft translations)"
```

---

### Task 7: Methodology page

**Files:**
- Create: `content/pages/methodology/{fr,en,ru,de}/index.yaml`, `app/[locale]/methodology/page.tsx`

**Interfaces:**
- Consumes: `getPageContent(locale, 'methodology')`, `ProsePage` (both from Task 6/3 — unchanged).
- Produces: nothing new consumed elsewhere.

**Content note:** condensed from `~/Sites/ieha_fr/methodology.html`'s six-stage framework into three sections, same condensation rationale as Task 6. Draft translations, review-gated.

- [ ] **Step 1: Add Methodology content — EN**

```yaml
# content/pages/methodology/en/index.yaml
title: Analytical Methodology
lead: >-
  The Black Square Template: a systematic, six-stage approach to artwork
  evaluation that prioritizes direct engagement over theoretical overlay.
sections:
  - heading: Direct Observation
    body: >-
      We approach each artwork without preconceptions, temporarily setting
      aside artist statements, manifestos, and historical canonization, to
      let authentic formal properties emerge undistorted by reputation or
      theory.
  - heading: Formal and Technical Analysis
    body: >-
      We examine geometry, color, light, space, and composition alongside
      materials, execution, and craftsmanship - then situate the work
      through comparison with the artist's oeuvre, contemporaries,
      precedents, and successors.
  - heading: Benchmark Evaluation
    body: >-
      Historical context is introduced last, as background rather than
      explanation. Each work is finally assessed against necessary and
      sufficient qualities for attribution, with a confidence rating built
      from the accumulated evidence - demonstrated on our methodological
      flagship, Malevich's Black Square (1915).
```

- [ ] **Step 2: Add Methodology content — RU**

```yaml
# content/pages/methodology/ru/index.yaml
title: Аналитическая методология
lead: >-
  Модель «Чёрного квадрата»: системный шестиэтапный подход к оценке
  произведения, отдающий приоритет непосредственному контакту перед
  теоретическими наслоениями.
sections:
  - heading: Непосредственное наблюдение
    body: >-
      Мы подходим к каждому произведению без предубеждений, временно
      отставляя в сторону заявления художника, манифесты и историческую
      канонизацию, позволяя подлинным формальным качествам проявиться без
      искажающей призмы репутации или теории.
  - heading: Формальный и технический анализ
    body: >-
      Мы исследуем геометрию, цвет, свет, пространство и композицию наряду
      с материалами, исполнением и мастерством - а затем помещаем
      произведение в контекст через сравнение с творчеством самого
      художника, современниками, предшественниками и последователями.
  - heading: Эталонная оценка
    body: >-
      Исторический контекст вводится последним - как фон, а не объяснение.
      Каждое произведение оценивается по необходимым и достаточным
      признакам атрибуции с рейтингом достоверности, основанным на
      накопленных данных - что продемонстрировано на нашем флагманском
      примере, «Чёрном квадрате» Малевича (1915).
```

- [ ] **Step 3: Add Methodology content — DE**

```yaml
# content/pages/methodology/de/index.yaml
title: Analytische Methodik
lead: >-
  Die Schwarzes-Quadrat-Vorlage: ein systematischer, sechsstufiger Ansatz
  zur Werkbewertung, der die unmittelbare Auseinandersetzung vor
  theoretische Überlagerung stellt.
sections:
  - heading: Unmittelbare Beobachtung
    body: >-
      Wir nähern uns jedem Werk ohne Vorannahmen und stellen
      Künstleraussagen, Manifeste und historische Kanonisierung zunächst
      zurück, damit authentische formale Eigenschaften unverzerrt von Ruf
      oder Theorie hervortreten können.
  - heading: Formale und technische Analyse
    body: >-
      Wir untersuchen Geometrie, Farbe, Licht, Raum und Komposition sowie
      Materialien, Ausführung und handwerkliches Können - und ordnen das
      Werk anschließend durch Vergleich mit dem Œuvre der Künstlerin oder
      des Künstlers, Zeitgenossen, Vorläufern und Nachfolgern ein.
  - heading: Referenzbewertung
    body: >-
      Der historische Kontext wird zuletzt eingeführt - als Hintergrund,
      nicht als Erklärung. Jedes Werk wird abschließend anhand notwendiger
      und hinreichender Merkmale für die Zuschreibung bewertet, mit einer
      aus den gesammelten Belegen gebildeten Vertrauensbewertung -
      demonstriert an unserem methodischen Flaggschiff, Malewitschs
      Schwarzes Quadrat (1915).
```

- [ ] **Step 4: Add Methodology content — FR**

```yaml
# content/pages/methodology/fr/index.yaml
title: Méthodologie analytique
lead: >-
  Le modèle du Carré noir : une démarche systématique en six étapes pour
  l'évaluation des œuvres, privilégiant la confrontation directe à la
  surcharge théorique.
sections:
  - heading: Observation directe
    body: >-
      Nous abordons chaque œuvre sans préconception, en mettant
      temporairement de côté les déclarations de l'artiste, les manifestes
      et la canonisation historique, afin de laisser émerger les qualités
      formelles authentiques, non déformées par la réputation ou la
      théorie.
  - heading: Analyse formelle et technique
    body: >-
      Nous examinons la géométrie, la couleur, la lumière, l'espace et la
      composition, ainsi que les matériaux, l'exécution et la maîtrise
      technique - puis situons l'œuvre par comparaison avec le corpus de
      l'artiste, ses contemporains, ses précédents et ses successeurs.
  - heading: Évaluation étalon
    body: >-
      Le contexte historique n'est introduit qu'en dernier lieu, comme
      arrière-plan et non comme explication. Chaque œuvre est enfin évaluée
      selon des qualités nécessaires et suffisantes à l'attribution, avec
      un indice de confiance construit à partir des éléments accumulés -
      démontré sur notre étude phare, le Carré noir de Malevitch (1915).
```

- [ ] **Step 5: Wire the Methodology page**

```tsx
// app/[locale]/methodology/page.tsx
import { setRequestLocale } from 'next-intl/server';
import { getPageContent } from '@/lib/content';
import { ProsePage } from '@/components/ProsePage';
import type { Locale } from '@/lib/content';

export default async function MethodologyPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const content = await getPageContent(locale, 'methodology');
  return <ProsePage content={content} />;
}
```

- [ ] **Step 6: Build and manually verify all 4 locales**

Run: `npm run build && npm run start`, visit `/methodology`, `/en/methodology`, `/ru/methodology`, `/de/methodology`.

- [ ] **Step 7: Commit**

```bash
git add content/pages/methodology app/[locale]/methodology
git commit -m "feat: Methodology page (4-locale content, draft translations)"
```

---

### Task 8: Research page

**Files:**
- Create: `content/pages/research/{fr,en,ru,de}/index.yaml`, `app/[locale]/research/page.tsx`

**Interfaces:** same pattern as Task 7, `slug: 'research'`.

**Content note:** condensed from `~/Sites/ieha_fr/research.html` (database overview, case studies, publications). This is the page's text-only intro/overview — the actual curated catalogue lives on the separate Collection page (Task 11-12), not embedded here, per the spec's explicit split.

- [ ] **Step 1: Add Research content — EN**

```yaml
# content/pages/research/en/index.yaml
title: Research
lead: Benchmark Database, Case Studies, and Publications.
sections:
  - heading: Benchmark Collection Database
    body: >-
      An authoritative catalog targeting 500+ benchmark artworks across the
      major high avant-garde movements - Suprematism, Constructivism,
      Futurism, De Stijl, Bauhaus, and beyond - each entry documented with
      full provenance, technical specifications, and authentication notes.
  - heading: Methodology Case Studies
    body: >-
      Exemplar analyses applying the IEHA framework, from the flagship
      study of Malevich's Black Square to works by Kandinsky, El Lissitzky,
      Mondrian, Tatlin, Popova, and Rodchenko.
  - heading: Publications
    body: >-
      The IEHA Founding Manifesto, a Methodology Handbook, a multilingual
      glossary of avant-garde terminology, and a peer-reviewed academic
      journal covering authentication, conservation, and provenance
      research.
```

- [ ] **Step 2: Add Research content — RU**

```yaml
# content/pages/research/ru/index.yaml
title: Исследования
lead: Эталонная база данных, кейс-стади и публикации.
sections:
  - heading: База эталонных произведений
    body: >-
      Авторитетный каталог, нацеленный на 500+ эталонных произведений всех
      основных течений высокого авангарда - супрематизма, конструктивизма,
      футуризма, неопластицизма, Баухауза и других - каждая запись с полным
      провенансом, техническими характеристиками и заметками об атрибуции.
  - heading: Методологические кейс-стади
    body: >-
      Показательные разборы, применяющие методологию IEHA - от
      флагманского исследования «Чёрного квадрата» Малевича до работ
      Кандинского, Эль Лисицкого, Мондриана, Татлина, Поповой и Родченко.
  - heading: Публикации
    body: >-
      Учредительный манифест IEHA, методологическое руководство,
      многоязычный глоссарий терминологии авангарда и рецензируемый
      академический журнал, посвящённый атрибуции, консервации и
      исследованиям провенанса.
```

- [ ] **Step 3: Add Research content — DE**

```yaml
# content/pages/research/de/index.yaml
title: Forschung
lead: Referenzdatenbank, Fallstudien und Publikationen.
sections:
  - heading: Referenzsammlung-Datenbank
    body: >-
      Ein maßgeblicher Katalog mit dem Ziel von 500+ Referenzwerken aus den
      wichtigsten Strömungen der Hochavantgarde - Suprematismus,
      Konstruktivismus, Futurismus, De Stijl, Bauhaus und mehr - jeder
      Eintrag mit vollständiger Provenienz, technischen Angaben und
      Authentifizierungsvermerken.
  - heading: Methodische Fallstudien
    body: >-
      Beispielhafte Analysen, die das IEHA-Rahmenwerk anwenden - von der
      Leitstudie zu Malewitschs Schwarzem Quadrat bis zu Werken von
      Kandinsky, El Lissitzky, Mondrian, Tatlin, Popowa und Rodtschenko.
  - heading: Publikationen
    body: >-
      Das IEHA-Gründungsmanifest, ein Methodikhandbuch, ein mehrsprachiges
      Glossar der Avantgarde-Terminologie sowie eine begutachtete
      Fachzeitschrift zu Authentifizierung, Konservierung und
      Provenienzforschung.
```

- [ ] **Step 4: Add Research content — FR**

```yaml
# content/pages/research/fr/index.yaml
title: Recherche
lead: Base de données étalon, études de cas et publications.
sections:
  - heading: Base de données des œuvres étalons
    body: >-
      Un catalogue faisant autorité, visant plus de 500 œuvres étalons à
      travers les principaux mouvements du haut avant-gardisme -
      suprématisme, constructivisme, futurisme, néoplasticisme, Bauhaus et
      au-delà - chaque entrée documentée avec provenance complète,
      spécifications techniques et notes d'authentification.
  - heading: Études de cas méthodologiques
    body: >-
      Des analyses exemplaires appliquant le cadre de l'IEHA, de l'étude
      phare du Carré noir de Malevitch aux œuvres de Kandinsky, El
      Lissitzky, Mondrian, Tatline, Popova et Rodtchenko.
  - heading: Publications
    body: >-
      Le manifeste fondateur de l'IEHA, un manuel de méthodologie, un
      glossaire multilingue de la terminologie de l'avant-garde, et une
      revue académique à comité de lecture couvrant l'authentification, la
      conservation et la recherche en provenance.
```

- [ ] **Step 5: Wire the Research page**

```tsx
// app/[locale]/research/page.tsx
import { setRequestLocale } from 'next-intl/server';
import { getPageContent } from '@/lib/content';
import { ProsePage } from '@/components/ProsePage';
import type { Locale } from '@/lib/content';

export default async function ResearchPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const content = await getPageContent(locale, 'research');
  return <ProsePage content={content} />;
}
```

- [ ] **Step 6: Build and manually verify all 4 locales**

Run: `npm run build && npm run start`, visit `/research`, `/en/research`, `/ru/research`, `/de/research`.

- [ ] **Step 7: Commit**

```bash
git add content/pages/research app/[locale]/research
git commit -m "feat: Research page (4-locale content, draft translations)"
```

---

### Task 9: Programs page

**Files:**
- Create: `content/pages/programs/{fr,en,ru,de}/index.yaml`, `app/[locale]/programs/page.tsx`

**Interfaces:** same pattern as Task 7, `slug: 'programs'`.

**Content note:** condensed from `~/Sites/ieha_fr/programs.html`.

- [ ] **Step 1: Add Programs content — EN**

```yaml
# content/pages/programs/en/index.yaml
title: Programs & Services
lead: Educational Programs, Authentication Services, and Institutional Partnerships.
sections:
  - heading: Educational Programs
    body: >-
      An annual three-day symposium, hands-on workshop series, a
      twelve-month Authentication Specialist certification, self-paced
      online methodology modules, and research internships for graduate
      students.
  - heading: Authentication Services
    body: >-
      Expert evaluation and consultation for collectors, museums, dealers,
      and insurers, following a six-step process from initial review
      through expert panel evaluation to a certified authentication
      report.
  - heading: Institutional Partnerships
    body: >-
      Collaborative research and knowledge exchange with museums,
      universities, and professional organizations across Europe and the
      United States.
```

- [ ] **Step 2: Add Programs content — RU**

```yaml
# content/pages/programs/ru/index.yaml
title: Программы и услуги
lead: Образовательные программы, услуги атрибуции и партнёрства с институциями.
sections:
  - heading: Образовательные программы
    body: >-
      Ежегодный трёхдневный симпозиум, серия практических мастер-классов,
      двенадцатимесячная сертификация специалиста по атрибуции,
      онлайн-модули методологии в собственном темпе и научные стажировки
      для аспирантов.
  - heading: Услуги атрибуции
    body: >-
      Экспертная оценка и консультации для коллекционеров, музеев,
      арт-дилеров и страховых компаний по шестиэтапному процессу - от
      первичного рассмотрения до заключения экспертной комиссии и
      сертифицированного отчёта об атрибуции.
  - heading: Партнёрства с институциями
    body: >-
      Совместные исследования и обмен знаниями с музеями, университетами и
      профессиональными организациями Европы и США.
```

- [ ] **Step 3: Add Programs content — DE**

```yaml
# content/pages/programs/de/index.yaml
title: Programme & Dienstleistungen
lead: Bildungsprogramme, Authentifizierungsdienste und institutionelle Partnerschaften.
sections:
  - heading: Bildungsprogramme
    body: >-
      Ein jährliches dreitägiges Symposium, eine praxisorientierte
      Workshop-Reihe, eine zwölfmonatige Zertifizierung zum
      Authentifizierungsspezialisten, selbstgesteuerte Online-Module zur
      Methodik sowie Forschungspraktika für Graduiertenstudierende.
  - heading: Authentifizierungsdienste
    body: >-
      Fachliche Begutachtung und Beratung für Sammlerinnen und Sammler,
      Museen, Händler und Versicherer nach einem sechsstufigen Prozess von
      der Erstprüfung über die Bewertung durch ein Expertengremium bis zum
      zertifizierten Authentifizierungsbericht.
  - heading: Institutionelle Partnerschaften
    body: >-
      Gemeinsame Forschung und Wissensaustausch mit Museen, Universitäten
      und Fachorganisationen in Europa und den Vereinigten Staaten.
```

- [ ] **Step 4: Add Programs content — FR**

```yaml
# content/pages/programs/fr/index.yaml
title: Programmes et services
lead: Programmes éducatifs, services d'authentification et partenariats institutionnels.
sections:
  - heading: Programmes éducatifs
    body: >-
      Un symposium annuel de trois jours, une série d'ateliers pratiques,
      une certification de spécialiste en authentification sur douze mois,
      des modules de méthodologie en ligne à rythme libre, et des stages de
      recherche pour doctorants.
  - heading: Services d'authentification
    body: >-
      Évaluation et conseil d'experts pour collectionneurs, musées,
      marchands et assureurs, selon un processus en six étapes, de
      l'examen initial à un rapport d'authentification certifié, en
      passant par l'évaluation d'un comité d'experts.
  - heading: Partenariats institutionnels
    body: >-
      Recherche collaborative et échange de connaissances avec des musées,
      universités et organisations professionnelles à travers l'Europe et
      les États-Unis.
```

- [ ] **Step 5: Wire the Programs page**

```tsx
// app/[locale]/programs/page.tsx
import { setRequestLocale } from 'next-intl/server';
import { getPageContent } from '@/lib/content';
import { ProsePage } from '@/components/ProsePage';
import type { Locale } from '@/lib/content';

export default async function ProgramsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const content = await getPageContent(locale, 'programs');
  return <ProsePage content={content} />;
}
```

- [ ] **Step 6: Build and manually verify all 4 locales**

Run: `npm run build && npm run start`, visit `/programs`, `/en/programs`, `/ru/programs`, `/de/programs`.

- [ ] **Step 7: Commit**

```bash
git add content/pages/programs app/[locale]/programs
git commit -m "feat: Programs page (4-locale content, draft translations)"
```

---

### Task 10: Contact page

**Files:**
- Create: `content/pages/contact/{fr,en,ru,de}/index.yaml`, `app/[locale]/contact/page.tsx`

**Interfaces:** same pattern as Task 7, `slug: 'contact'`.

**Content note:** condensed from `~/Sites/ieha_fr/contact.html`. Email addresses are copied verbatim (not translated) since they're existing real addresses.

- [ ] **Step 1: Add Contact content — EN**

```yaml
# content/pages/contact/en/index.yaml
title: Contact IEHA
lead: Get in touch with the European Institute of Avant-Garde Heritage.
sections:
  - heading: Professional Inquiries
    body: >-
      The Institute welcomes inquiries from scholars, curators, collectors,
      and students. Authentication consultations: authentication@ieha.org.
      Research and academic collaboration: research@ieha.org. Educational
      programs: education@ieha.org. General inquiries: info@ieha.org.
  - heading: Multilingual Support
    body: IEHA provides services and communications in English, Russian, German, and French.
  - heading: Response Time
    body: >-
      General inquiries: 3-5 business days. Authentication submissions:
      initial review within 7 business days. Research proposals: 2-3 weeks
      for evaluation.
```

- [ ] **Step 2: Add Contact content — RU**

```yaml
# content/pages/contact/ru/index.yaml
title: Связаться с IEHA
lead: Свяжитесь с Европейским институтом наследия авангарда.
sections:
  - heading: Профессиональные обращения
    body: >-
      Институт приветствует обращения учёных, кураторов, коллекционеров и
      студентов. Консультации по атрибуции: authentication@ieha.org.
      Исследования и академическое сотрудничество: research@ieha.org.
      Образовательные программы: education@ieha.org. Общие вопросы:
      info@ieha.org.
  - heading: Многоязычная поддержка
    body: IEHA предоставляет услуги и коммуникацию на английском, русском, немецком и французском языках.
  - heading: Сроки ответа
    body: >-
      Общие обращения: 3-5 рабочих дней. Заявки на атрибуцию: первичное
      рассмотрение в течение 7 рабочих дней. Исследовательские заявки:
      2-3 недели на оценку.
```

- [ ] **Step 3: Add Contact content — DE**

```yaml
# content/pages/contact/de/index.yaml
title: Kontakt zu IEHA
lead: Nehmen Sie Kontakt mit dem Europäischen Institut für das Erbe der Avantgarde auf.
sections:
  - heading: Fachliche Anfragen
    body: >-
      Das Institut freut sich über Anfragen von Wissenschaftlerinnen und
      Wissenschaftlern, Kuratoren, Sammlern und Studierenden.
      Authentifizierungsberatung: authentication@ieha.org. Forschung und
      akademische Zusammenarbeit: research@ieha.org. Bildungsprogramme:
      education@ieha.org. Allgemeine Anfragen: info@ieha.org.
  - heading: Mehrsprachiger Support
    body: IEHA bietet Dienstleistungen und Kommunikation auf Englisch, Russisch, Deutsch und Französisch.
  - heading: Antwortzeit
    body: >-
      Allgemeine Anfragen: 3-5 Werktage. Authentifizierungseinreichungen:
      Erstprüfung innerhalb von 7 Werktagen. Forschungsvorschläge:
      2-3 Wochen Bearbeitungszeit.
```

- [ ] **Step 4: Add Contact content — FR**

```yaml
# content/pages/contact/fr/index.yaml
title: Contacter l'IEHA
lead: Contactez l'Institut Européen du Patrimoine de l'Avant-Garde.
sections:
  - heading: Demandes professionnelles
    body: >-
      L'Institut accueille les demandes des chercheurs, conservateurs,
      collectionneurs et étudiants. Consultations d'authentification :
      authentication@ieha.org. Recherche et collaboration académique :
      research@ieha.org. Programmes éducatifs : education@ieha.org.
      Demandes générales : info@ieha.org.
  - heading: Support multilingue
    body: L'IEHA propose des services et communications en anglais, russe, allemand et français.
  - heading: Délai de réponse
    body: >-
      Demandes générales : 3 à 5 jours ouvrés. Soumissions
      d'authentification : premier examen sous 7 jours ouvrés. Propositions
      de recherche : 2 à 3 semaines d'évaluation.
```

- [ ] **Step 5: Wire the Contact page**

```tsx
// app/[locale]/contact/page.tsx
import { setRequestLocale } from 'next-intl/server';
import { getPageContent } from '@/lib/content';
import { ProsePage } from '@/components/ProsePage';
import type { Locale } from '@/lib/content';

export default async function ContactPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const content = await getPageContent(locale, 'contact');
  return <ProsePage content={content} />;
}
```

- [ ] **Step 6: Build and manually verify all 4 locales**

Run: `npm run build && npm run start`, visit `/contact`, `/en/contact`, `/ru/contact`, `/de/contact`.

- [ ] **Step 7: Commit**

```bash
git add content/pages/contact app/[locale]/contact
git commit -m "feat: Contact page (4-locale content, draft translations)"
```

---

### Task 11: Catalogue content curation (draft, review-gated)

**Files:**
- Create: `content/catalogue/{work-slug}.yaml` (~10 entries, flat files — no subdirectory; see note below), `public/catalogue/*.jpg`

**Interfaces:**
- Consumes: `keystatic.config.ts`'s `catalogue_works` collection schema (Task 3).
- Produces: raw content that `getCatalogueWorks()` (Task 3, already written) reads — but every entry here has `reviewStatus: draft`, so `getCatalogueWorks()` returns an empty list until Task 12's manual review step flips entries to `approved`. This is the concrete mechanism implementing the spec's provenance review gate.

- [ ] **Step 1: Survey the source material**

```bash
ls -la "/Users/dcshch/My Drive/!CATALOGUE_AVANTGARDE/JPG"
```

Open `Catalogue (spreads sm)-1.pdf`, `Catalogue_Pochoirs_Spreads.pdf`, `final text.pdf`, and `other worlds.docx` in that folder and note, for each image you plan to use: artist name, title (if given), approximate date/period, medium, and which source file it came from (page number or filename) — this citation is mandatory per `sourceCitation`, since these are unverified extractions pending DC's review, not confirmed catalog records.

- [ ] **Step 2: Select ~10 representative works**

Prioritize images with the clearest attribution in the source material (the `JPG/` folder's `zdanevitch-*.jpg`, `Larionov *.jpg`, `Kruch*.jpg` files are named after artists, which is a starting signal, not a confirmed attribution).

- [ ] **Step 3: Copy selected images into the repo**

```bash
mkdir -p public/catalogue
cp "/Users/dcshch/My Drive/!CATALOGUE_AVANTGARDE/JPG/<selected-file>.jpg" public/catalogue/<work-slug>.jpg
```

Repeat for each selected work. Keep filenames lowercase-kebab-case matching the Keystatic slug.

- [ ] **Step 4: Write one content entry per work, reviewStatus: draft**

**File layout is flat, not folder+index.yaml.** Unlike the page singletons (Task 3), the `catalogue_works` collection is configured with `path: 'content/catalogue/*'` — no trailing slash — which Keystatic resolves to flat-file storage (`content/catalogue/<slug>.yaml`), not a directory per entry. Verify against `reader.collections.catalogue_works.list()` if in doubt; a directory+index.yaml layout will silently return zero entries.

```yaml
# content/catalogue/<work-slug>.yaml
title: <best-available title, or "Untitled" if none found>
artist: <artist name as found in source>
date: <date or period, or "date undetermined" if unknown>
medium: <medium, or "medium undetermined" if unknown>
image: <work-slug>.jpg
tags:
  - <movement, e.g. Russian Avant-Garde>
sourceCitation: >-
  CATALOGUE_AVANTGARDE/<exact source filename>, <page number if from a PDF>
reviewStatus: draft
caption_en: <1-2 sentence caption in English>
caption_ru: <1-2 sentence caption in Russian>
caption_de: <1-2 sentence caption in German>
caption_fr: <1-2 sentence caption in French>
```

Do this for every selected work. Where a field is genuinely unknown from the source material, write the literal placeholder text shown above (`"Untitled"`, `"date undetermined"`, `"medium undetermined"`) rather than guessing — this makes gaps visible to DC during review rather than silently fabricating provenance detail.

- [ ] **Step 5: Verify every entry has all required fields**

Run:
```bash
for f in content/catalogue/*/index.yaml; do
  echo "=== $f ==="
  grep -E "^(title|artist|date|medium|image|sourceCitation|reviewStatus):" "$f" | wc -l
done
```
Expected: each file prints `7` (all seven single-value required fields present — `tags` and the four `caption_*` fields are checked separately since they're multi-line/array).

- [ ] **Step 6: Commit (still draft — nothing publishes yet)**

```bash
git add content/catalogue public/catalogue
git commit -m "feat: draft catalogue entries from CATALOGUE_AVANTGARDE (all draft, pending review)"
```

- [ ] **Step 7: Flag for DC's review**

This step has no code output — note in the PR/handoff that follows this plan: "Catalogue entries in `content/catalogue/` are DRAFT and will not appear on the live Collection page until reviewed. To publish an entry, open `/keystatic`, open the entry, verify title/artist/date/medium/citation against the source, and change Review status to Approved."

---

### Task 12: Collection page UI

**Files:**
- Create: `components/CatalogueGrid.tsx`, `components/CatalogueFilter.tsx`, `app/[locale]/collection/page.tsx`
- Test: `components/CatalogueFilter.test.tsx`

**Interfaces:**
- Consumes: `getCatalogueWorks(locale)` (Task 3), `CatalogueWork` type.
- Produces: `<CatalogueGrid works={works} />`, `<CatalogueFilter works={works} onFilteredChange={...} />` — consumed only by the Collection page.

- [ ] **Step 1: Write a failing test for the filter logic**

```tsx
// components/CatalogueFilter.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CatalogueFilter } from './CatalogueFilter';
import type { CatalogueWork } from '@/lib/content';

const WORKS: CatalogueWork[] = [
  { slug: 'a', title: 'Work A', artist: 'Zdanevich', date: '1919', medium: 'Lithograph', image: '/catalogue/a.jpg', tags: ['Futurism'], caption: 'Caption A', sourceCitation: 'src A' },
  { slug: 'b', title: 'Work B', artist: 'Larionov', date: '1913', medium: 'Oil on canvas', image: '/catalogue/b.jpg', tags: ['Rayonism'], caption: 'Caption B', sourceCitation: 'src B' },
];

describe('CatalogueFilter', () => {
  it('filters works by artist', () => {
    let filtered: CatalogueWork[] = WORKS;
    render(<CatalogueFilter works={WORKS} onFilteredChange={(w) => (filtered = w)} />);
    fireEvent.change(screen.getByLabelText('Filter by artist'), { target: { value: 'Larionov' } });
    expect(filtered).toEqual([WORKS[1]]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/CatalogueFilter.test.tsx`
Expected: FAIL — `./CatalogueFilter` doesn't exist.

- [ ] **Step 3: Write CatalogueFilter.tsx**

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
      <span className="text-sm font-medium">Filter by artist</span>
      <select
        aria-label="Filter by artist"
        value={artist}
        onChange={(e) => handleChange(e.target.value)}
        className="mt-1 block"
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

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/CatalogueFilter.test.tsx`
Expected: PASS

- [ ] **Step 5: Write CatalogueGrid.tsx**

```tsx
// components/CatalogueGrid.tsx
import Image from 'next/image';
import type { CatalogueWork } from '@/lib/content';

export function CatalogueGrid({ works }: { works: CatalogueWork[] }) {
  if (works.length === 0) {
    return <p className="text-neutral-500">No approved works match this filter yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {works.map((work) => (
        <figure key={work.slug}>
          <Image src={work.image} alt={work.title} width={400} height={400} className="w-full object-cover" />
          <figcaption className="mt-2">
            <p className="font-medium">
              {work.artist} — {work.title}
            </p>
            <p className="text-sm text-neutral-500">
              {work.date} · {work.medium}
            </p>
            <p className="mt-1 text-sm text-neutral-700">{work.caption}</p>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Wire the Collection page as a client-composed server page**

```tsx
// app/[locale]/collection/page.tsx
import { setRequestLocale } from 'next-intl/server';
import { getCatalogueWorks } from '@/lib/content';
import { CollectionBrowser } from './CollectionBrowser';
import type { Locale } from '@/lib/content';

export default async function CollectionPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const works = await getCatalogueWorks(locale);
  return <CollectionBrowser works={works} />;
}
```

```tsx
// app/[locale]/collection/CollectionBrowser.tsx
'use client';
import { useState } from 'react';
import { CatalogueFilter } from '@/components/CatalogueFilter';
import { CatalogueGrid } from '@/components/CatalogueGrid';
import type { CatalogueWork } from '@/lib/content';

export function CollectionBrowser({ works }: { works: CatalogueWork[] }) {
  const [filtered, setFiltered] = useState(works);

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-4xl font-semibold">Collection</h1>
      <div className="mt-8 max-w-xs">
        <CatalogueFilter works={works} onFilteredChange={setFiltered} />
      </div>
      <div className="mt-8">
        <CatalogueGrid works={filtered} />
      </div>
    </main>
  );
}
```

(Split into a Server Component page that fetches data, plus a small Client Component for the interactive filter — Next.js App Router requires this boundary since `useState` needs `'use client'`.)

- [ ] **Step 7: Configure next.config.ts to allow local catalogue images with next/image**

```typescript
// next.config.ts
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  images: {
    localPatterns: [{ pathname: '/catalogue/**' }],
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
```

- [ ] **Step 8: Build and verify the Collection page shows the "no approved works" empty state**

Run: `npm run build && npm run start`, visit `/collection`.
Expected: "No approved works match this filter yet." — correct, since Task 11's entries are all still `draft`. This confirms the review gate works before any content is published.

- [ ] **Step 9: Commit**

```bash
git add components/CatalogueGrid.tsx components/CatalogueFilter.tsx components/CatalogueFilter.test.tsx app/[locale]/collection next.config.ts
git commit -m "feat: Collection page (filter + grid), correctly empty until entries are approved"
```

---

### Task 13: Site-wide content and build validation

**Files:**
- Test: `content-completeness.test.ts`

**Interfaces:**
- Consumes: `getHomeContent`, `getPageContent`, all `Locale`/`PageSlug` types from `lib/content.ts`.
- Produces: nothing consumed elsewhere — this is a pure verification task, the QA checklist's "no missing-content fallbacks" item from the spec made concrete and automated.

- [ ] **Step 1: Write the completeness test**

```typescript
// content-completeness.test.ts
import { describe, it, expect } from 'vitest';
import { getHomeContent, getPageContent } from './lib/content';
import type { Locale, PageSlug } from './lib/content';

const LOCALES: Locale[] = ['fr', 'en', 'ru', 'de'];
const PAGE_SLUGS: PageSlug[] = ['about', 'methodology', 'research', 'programs', 'contact'];

describe('content completeness', () => {
  for (const locale of LOCALES) {
    it(`has non-empty home content for "${locale}"`, async () => {
      const content = await getHomeContent(locale);
      expect(content.eyebrow.length).toBeGreaterThan(0);
      expect(content.headline.length).toBeGreaterThan(0);
      expect(content.subhead.length).toBeGreaterThan(0);
    });

    for (const slug of PAGE_SLUGS) {
      it(`has non-empty "${slug}" content with at least one section for "${locale}"`, async () => {
        const content = await getPageContent(locale, slug);
        expect(content.title.length).toBeGreaterThan(0);
        expect(content.lead.length).toBeGreaterThan(0);
        expect(content.sections.length).toBeGreaterThan(0);
        for (const section of content.sections) {
          expect(section.heading.length).toBeGreaterThan(0);
          expect(section.body.length).toBeGreaterThan(0);
        }
      });
    }
  }
});
```

- [ ] **Step 2: Run the test**

Run: `npx vitest run content-completeness.test.ts`
Expected: PASS, 24 tests (4 locales × 6 pages, home counted separately) — if any earlier task's content file is missing or malformed, this fails and names exactly which locale/page.

- [ ] **Step 3: Run the full test suite and full build as a final check**

Run: `npm run test && npm run build`
Expected: all tests pass, build succeeds with routes for all 4 locales × 7 pages (6 prose + Collection) in the route table.

- [ ] **Step 4: Commit**

```bash
git add content-completeness.test.ts
git commit -m "test: site-wide content completeness check across all locales and pages"
```

---

### Task 14: Sandbox Netlify deployment

**Files:** none (operational task — Netlify site creation + env config, no repo changes beyond what's already committed).

**Interfaces:** consumes the fully built app from Tasks 1-13. Produces: a public sandbox preview URL for DC to review.

- [ ] **Step 1: Push the branch**

```bash
git push -u origin feat/site-rebuild
```

- [ ] **Step 2: Create a new, separate Netlify site (NOT the existing "ieha" project)**

```bash
netlify sites:create --name ieha-rebuild-sandbox
```

Confirm the output site name/ID is new and distinct from the existing `ieha` site (`66e7936a-8e0f-46ba-bd4c-da509d619cc6`) — do not reuse that ID.

- [ ] **Step 3: Link this local repo checkout to the new sandbox site**

```bash
netlify link --id <new-site-id-from-step-2>
```

- [ ] **Step 4: Set the Keystatic env vars on the sandbox site**

```bash
netlify env:set KEYSTATIC_GITHUB_CLIENT_ID <value>
netlify env:set KEYSTATIC_GITHUB_CLIENT_SECRET <value>
netlify env:set KEYSTATIC_SECRET <value>
```

(Requires the GitHub App from Task 3 Step 6 to already exist, with its callback URL set to `https://<sandbox-site-url>/api/keystatic/github/oauth/callback`.)

- [ ] **Step 5: Deploy a preview build**

```bash
netlify deploy --build
```

(No `--prod` flag — this creates a draft/preview deploy on the sandbox site, not production. There is no production concept on this new sandbox site that matters yet, but omitting `--prod` is still correct practice.)

- [ ] **Step 6: Verify the deploy**

Visit the preview URL printed by the command above. Check:
- `/`, `/about`, `/methodology`, `/research`, `/programs`, `/collection`, `/contact` all load (FR, default).
- `/en`, `/ru`, `/de` prefixed equivalents load with distinct content.
- `/keystatic` loads and prompts GitHub sign-in.
- `/collection` shows the empty state (no approved works yet).

- [ ] **Step 7: Report the sandbox URL to DC**

No code — this is the handoff point. Confirm explicitly in your final message that the production `ieha` Netlify project and `ieha.fr` were not touched at any point in this task.

---

## Self-Review Notes

**Spec coverage:** Architecture (Task 1-3), fr-default i18n routing (Task 2), all 6 pages × 4 locales (Tasks 5-10), Collection page with review gate (Task 11-12), Keystatic GitHub-mode CMS (Task 3), sandbox-only deployment (Task 14), content-completeness QA (Task 13). Visual design section is intentionally left to implementation-time judgment per the spec ("refined during implementation using the frontend-design/impeccable skill") rather than prescribed here as rigid Tailwind classes — the class names shown in this plan are functional placeholders sufficient to ship and test against, not a final design pass.

**Placeholder scan:** no TBD/TODO. Task 11's per-field literal fallback strings (`"Untitled"`, `"date undetermined"`) are deliberate, visible markers for unknown provenance data, not vague instructions — flagged as such in that task.

**Type consistency:** `Locale`, `PageSlug`, `HomeContent`, `PageContent`, `CatalogueWork` are defined once in Task 3's `lib/content.ts` and referenced by identical name/shape in every later task (Hero, ProsePage, Nav, CatalogueGrid/Filter, the completeness test). Singleton/collection key convention (`${slug}_${locale}`, `catalogue_works`) is consistent between `keystatic.config.ts` (Task 3) and every content file's directory path in Tasks 5-11.
