# IEHA site

Multilingual (fr / en / ru / de) Next.js 16 marketing + catalogue site for the
European Institute of Avant-Garde Heritage. Content is authored with Keystatic
(read at build/runtime from `content/` via the local filesystem reader) and the
site is deployed on Netlify.

Key pieces:
- `app/[locale]/` — localized public pages (next-intl, locales in `i18n/routing.ts`).
- `lib/content.ts` — reads Keystatic content (home/pages singletons + `catalogue_works`).
- `keystatic.config.ts` + `app/api/keystatic/` + `app/keystatic/` — the CMS admin.
- Tests are Vitest (`*.test.ts[x]`); see `package.json` scripts.

## Cursor Cloud specific instructions

Standard commands live in `package.json` (`dev`, `build`, `start`, `test`).
There is no `lint` script; run `npx tsc --noEmit` for type checking.

Non-obvious caveats:
- **Use `npm run dev` for local development.** `npm run build` fails in this
  environment with "Missing required config in Keystatic API setup when using
  the 'github' storage mode" — the `/api/keystatic/[...params]` route needs the
  GitHub OAuth env vars (`KEYSTATIC_GITHUB_CLIENT_ID`,
  `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`, and in production
  `KEYSTATIC_URL`) at page-data collection time. These are configured on Netlify
  for production builds. The public site itself renders fine without them because
  it reads content from the local filesystem, so `next dev` and all public routes
  work with no secrets.
- The Keystatic admin UI at `/keystatic` also requires those GitHub OAuth vars to
  authenticate and edit content; browsing/testing the public site does not.
- The `/[locale]/collection` listing only shows catalogue works with
  `reviewStatus: approved` (see `getCatalogueWorks` in `lib/content.ts`).
  Currently every entry in `content/catalogue/*.yaml` is `draft`, so the
  collection page renders an empty listing by design — this is not a bug. The
  homepage hero (`getFeaturedWork`) is read by slug and is NOT gated on
  `reviewStatus`, so the featured artwork still shows.
