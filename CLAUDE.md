# CLAUDE.md — Comffordable Air Solutions

Agent instructions for this workspace. Read this before changing anything.

## What this repo is

**Comffordable Air Solutions' website** (comairfl.com), built on the Brand Hyve Astro
boilerplate. This file was inherited from that boilerplate and still describes its conventions —
they all apply here — but the data in `src/config/` is **real client data**, not sample data.
Everything below is the standard this site is held to; deviating from it is what put the
previous build out of compliance.

### Branch layout — read before you commit

- `main` — the boilerplate conversion, **LIVE**: it serves www.comairfl.com and auto-deploys on
  every push via Vercel (project `comffordable-air-site-final`). Treat every push to `main` as a
  production deploy.
- `rebuild/boilerplate` — the historical rebuild branch, long since merged. Do not base new work
  on it.

### Site-specific deviations from the boilerplate

- **No `/gallery/` page and no `gallery.json`.** Deliberately dropped. Recorded in
  `.boilerplate-audit.json` so the compliance audit reports it as an exemption rather than a
  missing page.
- **Images are WebP**, converted with per-file quality stepping — see `public/images/README.md`
  before adding or replacing one. Do not assume a fixed quality is safe.
- `og:image` is WebP too. If link previews ever misbehave on a platform, keep a JPEG/PNG copy
  *outside* `public/images/` rather than reverting the whole directory.
- `business.json` carries a `shortName` ("Comffordable Air") the boilerplate does not have; the
  home page title needs it to stay under the 60-char window.
- `lib/utils.ts` adds `serviceAreaList()` — worth upstreaming.

## The one rule that matters

**`src/config/business.json` is the single source of truth.** Never hardcode a business name,
phone number, address, service, service area, team member, or social URL into a component or
page. If a template needs business data, import the config. If the data does not exist in the
config yet, add the field to the config first.

The same applies to `gallery.json` (photos + videos) and `testimonials.json`.

## Stack

| Thing | Version | Notes |
|---|---|---|
| Astro | ^5.x | Static output, zero client JS by default |
| Tailwind CSS | ^4.x | Via `@tailwindcss/vite` — no `tailwind.config.js`, no PostCSS config |
| TypeScript | ^5.x | `astro/tsconfigs/strict` |
| @astrojs/sitemap | ^3.x | Auto sitemap at build |
| Font Awesome | ^7 self-hosted | `@fortawesome/fontawesome-free` (solid + brands), imported in `global.css`. Icon classes live in `business.json` (`services[].icon`) |
| Inter | self-hosted | `@fontsource-variable/inter`, imported in `global.css` |

No React/Vue/Svelte. No CSS framework beyond Tailwind's utility layer. Interactivity is plain
vanilla JS in `<script>` blocks. **No external origins on the critical path** — fonts and icons
are bundled; do not reintroduce CDN `<link>`s.

## Commands

```bash
npm run dev      # local dev server
npm run build    # production build — must finish with zero errors
npm run preview  # serve the built output
npm run lint     # astro check (type + template diagnostics)
npm run qa       # hyve-qa-pipeline against a deployed URL
npm run test:cms # run the real Hyve CMS engine over dist/ (build first; set HYVE_CMS_DIR)
```

## Conventions

- **Components:** PascalCase (`ServicesGrid.astro`). **Pages:** kebab-case. **Lib/config:** camelCase.
- **Every component exports a TypeScript `Props` interface.** No untyped `Astro.props`.
- **Styling lives in `src/styles/global.css`.** Brand changes are CSS custom properties in `:root` —
  do not edit component internals to restyle a client.
- **Scripts wrap their initializer in `onReady()`** (`src/lib/onReady.ts`), never bare
  `DOMContentLoaded` or a bare `astro:page-load` listener. This starter ships no ClientRouter, so
  `astro:page-load` never fires on its own; `onReady` runs at DOM-ready and re-runs after View
  Transitions swaps if a router is ever added.
- **Trailing slashes are enforced sitewide.** Internal links end in `/`; `Layout.astro` normalizes
  the canonical to match.

## Progressive enhancement — never require JS

Hyve CMS ingests the BUILT page and **strips every `<script>`** before publishing. Anything that
depends on JS is dead on a CMS-published site. The rules:

- Content is visible and functional by default; JS only *enhances*. JS-dependent hidden states in
  CSS must be gated behind `html.js` (an inline script in `Layout.astro` adds `.js` — the CMS
  strips it, so published pages never hide anything). `.animate-on-scroll` works this way.
- FAQ accordions are native `<details>/<summary>`. The mobile nav is a CSS-only checkbox
  disclosure. Gallery photos are plain `<a>` image links, video facades are `<a>` links to the
  YouTube watch page — JS upgrades them to lightbox/embed by intercepting the click.
- Verify with `npm run build && npm run test:cms` — it runs the real CMS engine
  (autotag → render → resync) over every built page and fails on regressions.

## Hyve CMS tagging

The CMS parses four attributes: `data-cms` (text field), `data-cms-img` (image field),
`data-cms-collection` / `data-cms-item` (repeatable grids).

- **Text:** `data-cms` on the LEAF element that holds the copy. Naming: `{cmsPrefix}-{element}`,
  and `{cmsPrefix}-item-{id}-{element}` inside repeated items.
- **Images:** `data-cms-img` on the `<img>` — never `data-cms`. Autotag falls back to sequential
  `cms-N` ids for untagged images; hand-authored ids are what let a client's edits survive a
  rebuild losslessly (resync matches authored ids exactly).
- **Collections:** `data-cms-collection="{id}"` on the grid container; `data-cms-item="{id}"`
  (same id) on each item, which must be a DIRECT child of the container.
- **Never put `data-cms` on a structural wrapper** (a section/div that contains other tagged
  elements). The CMS skips those, but emitting them is still a bug — the wrapper would otherwise
  double-register the copy of its children.
- `data-cms` ids must be unique per page — they are map keys; duplicates silently apply edits to
  the wrong element.

## SEO invariants — do not break these

1. **One `<script type="application/ld+json">` per page**, containing a single `@graph`.
   `FAQSection.astro` is the sole exception (it emits its own `FAQPage` block).
2. **Every `@id` is an absolute URL with a fragment**, and every cross-reference (`provider`,
   `publisher`, `author`, `isPartOf`, `breadcrumb`) resolves to a node in the same graph.
   All of this lives in `src/lib/schema.ts` — add schema there, not inline in a page.
3. **Titles under 60 characters. Descriptions 150–160 characters. Both unique per page.**
   Do not hand-write these into `Layout` props — client data swaps change string lengths and
   silently break the window. Route every page through `pageTitle()` and `metaDescription()`
   in `src/lib/utils.ts`, which enforce both bounds regardless of the config values.
4. **Canonical matches the URL that returns 200** — same protocol, host, case, and trailing slash.
5. **NAP is byte-identical** across the footer, the JSON-LD, and the client's Google Business
   Profile. Change it in `business.json` only.
6. **`sameAs` order mirrors `business.json` declaration order** exactly.
7. **Content renders server-side.** Nav links are real `<a href>`, the H1 and body copy are in the
   static HTML. Nothing primary is hydrated client-side.

## Gallery and CSP

`/gallery/` renders `gallery.json` photos (masonry + lightbox), videos, and the three most
recent blog posts. Video thumbnails are **local facades** — no remote image and no iframe loads
until the visitor clicks, which keeps the page off YouTube's network entirely on first paint.

**Before shipping a client site that uses videos**, extend the production CSP in spec §12 — the
default template's `frame-src` does not include YouTube, so the embed will be blocked on click:

```
frame-src 'self' https://maps.google.com https://www.youtube-nocookie.com;
```

If the client has no videos, leave `gallery.json > videos` empty and the section does not render.

## Adding a blog post

Drop a `.md` file in `src/content/blog/`. Schema is enforced by `src/content/config.ts`.

```yaml
---
title: "Post Title"                      # under 70 chars
description: "150-160 char description"
pubDate: 2025-01-15
updatedDate: 2025-02-01                  # optional — drives dateModified
author: "Jeremy Smith"                   # never "Admin" or anonymous
authorTitle: "Owner & Lead Technician"
authorImage: "/images/team-jeremy.png"
authorBio: "One-sentence bio."
authorLinkedin: ""
category: "Maintenance"
tags: [keyword1, keyword2]
image: "/images/blog/post-image.jpg"
imageAlt: "Descriptive alt text"
draft: false
---
```

Content guidelines (spec §6, Section C): phrase every H2 as a question or direct topic
statement, answer it in 40–60 words immediately below, open the post with a key-takeaways block,
use `<table>` with `<th scope>` for comparisons and `<dfn>` for industry terms.

`src/content/blog/example-post.md` is a working reference — delete it during client setup.

## Adding a service or service area

Add an entry to `services[]` or `serviceAreas[]` in `business.json`. The routes
(`/[service]`, `/service-areas/[city]`), navbar links, footer links, sitemap entries, and schema
`areaServed` all generate from it. No new files needed.

## Empty-data behavior (already handled — do not "fix")

- Empty `services` → navbar drops service links, services grid shows a "coming soon" panel
- Empty `serviceAreas` → footer areas column and service-area routes are omitted
- Empty `socials[platform]` → that icon is not rendered
- Empty `team` → About page omits the team section
- Empty `hours` → schema omits `openingHoursSpecification`
- Empty `gtmId` / `ga4Id` → those script blocks are omitted entirely
- `cookieConsentEnabled: false` → banner is not rendered at all
- Empty `ghlWebhookUrl` → the form is visibly NOT CONNECTED: submit disabled, a standing notice
  names the working phone/email, and a forced submit says nothing was sent while keeping the
  visitor's entries. Never add a success state without a delivery (boilerplate defect #14).

## Contact form → relay → GHL

GHL's inbound webhook accepts **JSON only** and **never redirects** — a native form POST aimed
straight at it strands the visitor on raw JSON. So the form never posts to GHL directly:

1. `ContactForm.astro` does a native form-encoded POST to the shared Brand Hyve relay
   (`business.json > formRelayUrl`, normally `https://relay.brandhyve.com/api/lead`) with hidden
   `_webhook` / `_redirect` / `_source` fields, all derived from `business.json` at build time.
2. The relay (`relay/` — deployed as its OWN Vercel project, never through the CMS) forwards the
   lead as JSON to that client's `ghlWebhookUrl` and 303-redirects to `/thank-you/`.
3. `/thank-you/` is noindex, excluded from the sitemap, and is the GA4 conversion page.

Zero JS involved, so the form works on CMS-published sites. Switching a client between GHL and
Google Forms is a `business.json` change (the relay allowlists both webhook host families).

## Client setup checklist

See spec §11 for the full workflow. Short version:

1. Fill in `src/config/business.json` (including `domain` — `astro.config.mjs` reads `site` from it)
2. Replace everything in `public/images/` (see `public/images/README.md` for dimensions)
3. Replace `{{DOMAIN}}` in `public/robots.txt`
4. Fill in the `{{...}}` placeholders in `public/site.webmanifest`
5. Set `--primary` / `--primary-hover` in `src/styles/global.css`
6. Populate `testimonials.json` and `gallery.json`
7. Delete `src/content/blog/example-post.md` and add real posts
8. Write page copy, then `npm run build` and `npm run qa`
