# IEHA site rebuild — design spec

Date: 2026-07-13
Repo: `artscion/ieha` (was empty at start of this project)
Branch: `feat/site-rebuild`

## Goal

Build a fully operational, multilingual (EN/RU/DE/FR) marketing website for the
European Institute of Avant-Garde Heritage (IEHA) in `artscion/ieha`, to
eventually become the production site for `ieha.fr`.

## Background

`ieha.fr` is a live domain on a Netlify project named `ieha`. At the time this
project started:

- The domain was serving an unrelated Next.js app ("materielart.tech —
  Material Art"), published out-of-band (not via a normal git-triggered
  build) shortly before this project began. **Investigating how that
  happened is explicitly out of scope** — DC declined to pursue it and wants
  effort spent on building the real site instead.
- The Netlify project's git integration was pointed at `dcpreo/astro-ieha`
  (an unrelated, actively-developed Astro site for `astro.ieha.art`).
- A separate static HTML site exists locally at `~/Sites/ieha_fr` (6 pages:
  Home, About, Methodology, Research, Programs, Contact), English only, with
  a non-functional EN/RU/DE/FR language-selector stub in the nav. This site's
  English copy is the content source for this rebuild.
- `artscion/ieha` is a private GitHub repo DC has admin access to, and was
  completely empty (0 commits) before this project.

This spec covers building the new site from scratch in `artscion/ieha`. It
does **not** cover cutting `ieha.fr` over to it — that's an explicit, separate
go-live step requiring DC's approval (see Deployment).

## Architecture & stack

- **Framework:** Next.js, App Router.
- **Deployment target:** Netlify, via `@netlify/plugin-nextjs`.
- **CMS:** Keystatic, GitHub-storage mode, mounted at `/keystatic` inside the
  same Next.js app.

## Routing & i18n

- Locale segment: `app/[locale]/...` for `en`, `ru`, `de`, `fr`.
- **`fr` is the default locale and is unprefixed** at the root
  (`ieha.fr/about`), matching the `.fr` domain. `en`, `ru`, `de` are prefixed
  (`ieha.fr/en/about`, `ieha.fr/ru/about`, `ieha.fr/de/about`).
- All 6 pages ship in all 4 locales at launch (no partial/fallback locales
  planned for v1).

## Visual design

Your original ask for this whole effort included "redesign/rebuild the
site," not just a content swap. The existing `~/Sites/ieha_fr` static site's
CSS is dated (plain nav, generic card/hero layout) and is not being
pixel-ported as-is. Default approach: keep continuity of brand *content*
(institution name, "sine ira et studio" mark, the general museum/scholarly
tone) but build a clean, purpose-built visual identity for the new Next.js
site — typography, color, and layout system chosen fresh, refined during
implementation using the `frontend-design`/`impeccable` design skill rather
than copied from the old static CSS or from `astro-ieha`'s separate brand
system. This is a judgment call, not something explicitly specified — flag
any objection when reviewing this spec (e.g. if you'd rather I closely match
the existing static site's look, or `astro-ieha`'s, instead).

## Pages & content model

Six "prose" pages, mirroring the existing static site's structure: **Home,
About, Methodology, Research, Programs, Contact.** Plus one new page:
**Collection** (see below).

Each prose page is a Keystatic singleton per locale, e.g.:

```
content/fr/pages/home.yaml
content/en/pages/home.yaml
content/ru/pages/home.yaml
content/de/pages/home.yaml
```

### Content sourcing

- **Home hero:** final copy already provided by DC for all 4 locales (see
  Appendix A). "Sine ira et studio" stays in Latin, unset from translation,
  in all locales; italicized consistently where styling allows.
- **About, Methodology, Research (intro), Programs, Contact:** English text
  sourced from the existing `~/Sites/ieha_fr` static pages, used as the
  authoritative EN source. RU/DE/FR are LLM-drafted translations from that
  source.
- **Translation review gate:** every LLM-drafted translation (i.e. everything
  except the Home hero) is flagged for DC's or a fluent reviewer's sign-off
  before go-live. Nothing auto-publishes as final.

## Collection page (catalogue)

A new page presenting a curated set of avant-garde works with images and
provenance information, sourced from `~/My Drive/!CATALOGUE_AVANTGARDE`
(catalogue PDF, essays, and JPGs of works by artists including Zdanevich,
Larionov, and Kruchenykh).

- **Data model** (Keystatic collection, one entry per work):
  `title`, `artist`, `date`/period, `medium`, `image`, `provenanceText`,
  optional `tags` (movement/school). Per-locale caption/provenance text,
  same per-locale pattern as the prose pages.
- **Scope for v1:** a curated highlight set of roughly 10 works (not a full
  sweep of the Drive folder). Expandable later via the CMS.
- **Browsing UI:** client-side filter/search by artist and tag. No search
  backend — the catalogue is small.
- **Provenance review gate:** this is the highest-risk content in the
  project — provenance claims about real, specific artworks are
  reputationally and potentially legally sensitive. I will compile a draft
  shortlist (work, image, extracted metadata, and a citation of which source
  file in the Drive folder it came from) and **DC must explicitly approve
  each entry before it is published**, in the CMS or the site. Nothing here
  is machine-verified and nothing auto-publishes.
- **Explicitly not connected:** the existing `kgb-fdc` (KGB Art Intel)
  Firebase Data Connect database is a separate, internal provenance-analysis
  tool. This project does not read from or write to it — the Collection
  page's content is independent, curated static/CMS content.

## CMS (Keystatic)

- Keystatic mounted at `/keystatic` in the Next.js app, **GitHub-storage
  mode**: content edits are written directly to the `artscion/ieha` repo via
  the GitHub API.
- **Access control:** GitHub OAuth via a Keystatic GitHub App (or fine-grained
  PAT) scoped to this repo. Only accounts with push access to `artscion/ieha`
  can sign in and edit. No Cloudflare Access or separate auth layer needed —
  `ieha.fr` is not on Cloudflare (EuroDNS/NS1), unlike `ieha.art`, so this
  sidesteps needing a DNS/zone change to gate the admin UI.

## Deployment & preview strategy

- **The current production `ieha` Netlify project and `ieha.fr` domain
  mapping are not touched by this project.** Its git integration stays
  pointed at `dcpreo/astro-ieha` and its currently-published content is left
  exactly as-is throughout the build.
- A **new, separate Netlify site** is created, git-linked to `artscion/ieha`,
  giving every push its own preview/production-of-its-own-sandbox URL,
  fully isolated from `ieha.fr`. All review during the build happens against
  this sandbox site.
- **Go-live cutover** (repointing the `ieha` Netlify project's git
  integration from `dcpreo/astro-ieha` to `artscion/ieha`, or otherwise
  making this the production site for `ieha.fr`) is an explicit, separate
  step requiring DC's direct approval. It is out of scope for this spec and
  the implementation plan that follows it.

## QA / go-live checklist

- Build passes; all 6 pages + Collection render in all 4 locales with no
  missing-content fallbacks.
- Nav / locale-switcher verified across all locale combinations.
- All LLM-drafted translations (About/Methodology/Research/Programs/Contact,
  Collection captions) reviewed and signed off.
- All Collection entries individually reviewed and approved by DC.
- Preview URL spot-checked in a real browser before any production-cutover
  step is even proposed.

## Out of scope (this project)

- Investigating how the stray "materielart.tech" Next.js app got deployed to
  the live `ieha` Netlify project.
- Any change to the current `ieha.fr` production deployment or domain
  mapping.
- Any integration with `kgb-fdc` / its Firebase Data Connect database.
- Migrating `dcpreo/astro-ieha` or `astro.ieha.art` to anything.

## Appendix A — Home hero copy (final, DC-provided)

**EN**
- Eyebrow: European Institute of Avant-Garde Heritage
- Headline: Restoring objectivity to the art of the avant-garde.
- Subhead: We study the benchmark works of the high avant-garde — *sine ira
  et studio*, without anger or partiality — to see past the mythology and
  the market, to the artistic substance itself.

**RU**
- Eyebrow: Европейский Институт Наследия Авангарда
- Headline: Возвращая объективность искусству авангарда.
- Subhead: Мы изучаем эталонные произведения высокого авангарда — *sine ira
  et studio*, без гнева и пристрастия — чтобы за мифологией и рынком увидеть
  само художественное вещество.

**DE**
- Eyebrow: Europäisches Institut für das Erbe der Avantgarde
- Headline: Der Kunst der Avantgarde ihre Objektivität zurückgeben.
- Subhead: Wir untersuchen die Referenzwerke der Hochavantgarde — *sine ira
  et studio*, ohne Zorn und ohne Voreingenommenheit — um hinter Mythos und
  Markt die künstlerische Substanz selbst sichtbar zu machen.

**FR**
- Eyebrow: Institut Européen du Patrimoine de l'Avant-Garde
- Headline: Restituer son objectivité à l'art de l'avant-garde.
- Subhead: Nous étudions les œuvres étalons du haut avant-gardisme — *sine
  ira et studio*, sans colère ni parti pris — pour percevoir, au-delà du
  mythe et du marché, la substance artistique elle-même.
