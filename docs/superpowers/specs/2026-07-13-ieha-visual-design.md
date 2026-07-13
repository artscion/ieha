# IEHA visual design — design spec

Date: 2026-07-13
Repo: `artscion/ieha`, branch: to be created off `feat/site-rebuild` (see plan)

## Goal

Replace the current placeholder Tailwind-default styling (system font, neutral
grays, no identity) with the purpose-built visual identity the original site
spec called for but deferred. The site is live in production (ieha.fr); this
is a pure visual/CSS pass — no content, routing, CMS, or data-flow changes.

## Background

Established via brainstorming with visual mockups (approved by DC):
- **Direction:** "Scholarly restraint" — archival/academic feel, not a literal
  quotation of the avant-garde art the institute studies. Deliberately avoids
  the red/black/Suprematist-pastiche cliché.
- **Typography + color:** "Archive/Academic" — one serif typeface throughout
  editorial content, muted forest-green accent instead of red.
- **Layout:** "Wide Editorial" — a wider page frame with an asymmetric,
  two-column hero composition, not a narrow single-column journal layout.

## Foundations

**Typeface:** [Newsreader](https://fonts.google.com/specimen/Newsreader)
(serif, variable, has italic) for all editorial content — headlines, body
copy, the nav wordmark, section headings. [Inter](https://fonts.google.com/specimen/Inter)
(sans, variable) for functional UI chrome only — nav links, eyebrow/label
text, footer fine print. This is a deliberate two-typeface system: serif for
reading, sans for wayfinding — not a single-typeface site.

**Color tokens:**
| Token | Value | Use |
|---|---|---|
| `--color-cream` | `#FBFAF7` | page background |
| `--color-ink` | `#242220` | primary text, headlines |
| `--color-ink-soft` | `#4E4A45` | body/subhead text |
| `--color-forest` | `#3F5643` | accent — rules, links, small marks |
| `--color-border` | `#E6E1D8` | hairline dividers (nav underline, hero rule) |
| `--color-label` | `#6B655D` | sans-serif nav/label text |

**Spacing:** generous vertical rhythm — section padding in the 48–56px range
(vs. the current site's tighter 16–24px defaults), page frame max-width
~1100px (vs. current 640–768px), reflecting the "wide editorial" direction.

## Component treatment

- **Nav:** italic Newsreader "IEHA" wordmark, small sans-serif tagline
  ("European Institute of Avant-Garde Heritage") underneath, nav links as
  small uppercase-tracked sans text, right-aligned, hairline border-bottom in
  `--color-border`. Locale switcher styling unchanged in structure, restyled
  to match (sans, small, current locale in `--color-forest` + underline).
- **Footer:** same restrained pairing as nav — small italic Newsreader
  institutional name/founding line, sans-serif fine print for the email line.
- **Home hero:** two-column split. Left column (~1.3fr): eyebrow (small sans,
  uppercase, `--color-forest`), headline (Newsreader, ~34px, ink), subhead
  (Newsreader, ~15px, ink-soft) — same italicized "sine ira et studio"
  handling already implemented in `Hero.tsx`, unchanged. Right column (~1fr):
  a vertical hairline rule (`--color-border`) with empty negative space
  behind it. **Do not invent new pull-quote copy for this space** — it's
  reserved for a future benchmark-artwork image once catalogue entries are
  approved (out of scope here; a content decision, not a visual one).
- **Prose pages** (About/Methodology/Research/Programs/Contact via the shared
  `ProsePage` component): single reading column, ~680px, left-weighted within
  the wider page frame (not centered, not the hero's two-column split — five
  text-only pages would leave the right rail permanently empty). Each
  section heading gets a thin horizontal rule above it in `--color-forest`,
  echoing the hero's rule motif.
- **Collection/catalogue grid** (`CatalogueGrid`/`CatalogueFilter`): same
  palette — cream background, thin forest-accent rules between grid items,
  Newsreader for artist/title, small sans for date/medium/caption meta.
  Reads as a museum catalog plate listing, not a generic image grid. Filter
  control restyled to match (small sans label + select, forest focus state).

## Responsive behavior

The hero's two-column split stacks to a single column on mobile (right rail
collapses/hides below a breakpoint — no meaningful content is lost since it's
currently just a rule + negative space). Every other component is already
single-column by design and needs no structural change, only token
substitution (fonts/colors/spacing).

## Implementation approach

- **Fonts:** load via `next/font/google` (Newsreader + Inter), not a raw
  `<link>` tag — gives Next's built-in font optimization (self-hosted,
  no layout shift) rather than what the brainstorming mockups used for quick
  preview convenience.
- **Design tokens:** define via Tailwind v4's CSS-first `@theme` block in
  `app/globals.css` (the project currently has zero custom theme — it's
  literally `@import "tailwindcss";`), mapping the color table above to
  named Tailwind utilities (e.g. `bg-cream`, `text-ink`, `border-border`,
  `text-forest`) so components stay in Tailwind utility-class style
  consistent with the rest of the codebase, rather than switching to inline
  styles or a separate CSS-in-JS system.
- **Scope of file changes:** `app/globals.css` (theme tokens + font
  variables), `components/Nav.tsx`, `components/Footer.tsx`,
  `components/Hero.tsx`, `components/ProsePage.tsx`,
  `components/CatalogueGrid.tsx`, `components/CatalogueFilter.tsx`,
  `app/[locale]/layout.tsx` (font loading). No changes to `lib/content.ts`,
  `keystatic.config.ts`, i18n routing, or any content/data files — this is
  styling only.

## Explicitly out of scope

- New copy (pull-quotes, imagery captions) — content decisions belong to a
  separate review, not this visual pass.
- Catalogue artwork imagery integration into the hero rail — deferred until
  catalogue entries are DC-approved (separate, already-tracked gate).
- Any change to routing, CMS, locale logic, or the Netlify/CI setup.
- A logo/mark beyond the italic Newsreader "IEHA" wordmark — no icon or
  symbol was scoped or approved in this pass.
