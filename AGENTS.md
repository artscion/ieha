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
- **Keystatic env vars** (needed for `npm run build` and the `/keystatic` admin;
  not needed to browse the public site under `next dev`):
  - `KEYSTATIC_GITHUB_CLIENT_ID` / `KEYSTATIC_GITHUB_CLIENT_SECRET` — GitHub App
    OAuth credentials.
  - `KEYSTATIC_SECRET` — a **random** session-signing string you generate (e.g.
    `openssl rand -base64 32`). It must **not** be a GitHub `SHA256:…` fingerprint.
  - `KEYSTATIC_URL` — production site **origin only**: `https://ieha.fr`. Used by
    `pinOrigin` in `app/api/keystatic/[...params]/route.ts` so OAuth
    `redirect_uri` is not a Netlify deploy subdomain. Do **not** include
    `/keystatic` in the path. For local `next dev`, leave this **unset** so
    callbacks stay on `http://localhost:3000`; if it is set while running on
    localhost, Keystatic can emit a broken `https://ieha.fr:3000/...` redirect.
- Without the three required Keystatic secrets, `npm run build` fails at page-data
  collection for `/api/keystatic/[...params]`; `next dev` and public routes still
  work because content is read from the local filesystem.
- **Production `/keystatic` “Authorization failed”:** that message is Keystatic’s
  opaque wrapper around a failed GitHub **token exchange** (HTTP 200 error JSON
  or a token response missing `refresh_token`/`expires_in`). Authorize can still
  succeed because it only uses the Client ID. Fix on **Netlify** (Cursor cloud
  secrets do not update Netlify): matching `KEYSTATIC_GITHUB_CLIENT_*`,
  `KEYSTATIC_SECRET`, `KEYSTATIC_URL=https://ieha.fr`, plus
  `NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG=ieha-keystatic`. On the GitHub App
  (`ieha-keystatic`), enable **Expire user authorization tokens**, and register
  callback `https://ieha.fr/api/keystatic/github/oauth/callback`. OAuth codes are
  single-use — never reload the callback URL; restart from `/keystatic`.
- The `/[locale]/collection` listing only shows catalogue works with
  `reviewStatus: approved` (see `getCatalogueWorks` in `lib/content.ts`).
  Currently every entry in `content/catalogue/*.yaml` is `draft`, so the
  collection page renders an empty listing by design — this is not a bug. The
  homepage hero (`getFeaturedWork`) is read by slug and is NOT gated on
  `reviewStatus`, so the featured artwork still shows.
