# CLAUDE.md — Brand Hyve Astro Starter

Agent instructions for this workspace. Read this before changing anything.

## What this repo is

The Brand Hyve boilerplate for local-service business websites. Every client site starts as a
clone of this repo. It is **not** a client site itself — the data in `src/config/` is sample data
for an example HVAC business.

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
| Font Awesome | 6.4 CDN | Icon classes live in `business.json` (`services[].icon`) |

No React/Vue/Svelte. No CSS framework beyond Tailwind's utility layer. Interactivity is plain
vanilla JS in `<script>` blocks.

## Commands

```bash
npm run dev      # local dev server
npm run build    # production build — must finish with zero errors
npm run preview  # serve the built output
npm run lint     # astro check (type + template diagnostics)
npm run qa       # hyve-qa-pipeline against a deployed URL
```

## Conventions

- **Components:** PascalCase (`ServicesGrid.astro`). **Pages:** kebab-case. **Lib/config:** camelCase.
- **Every component exports a TypeScript `Props` interface.** No untyped `Astro.props`.
- **Every editable element carries a `data-cms` attribute** so the Hyve visual editor can target it.
  Naming: `{cmsPrefix}-{element}`, and `{cmsPrefix}-item-{id}` for repeated items.
- **Styling lives in `src/styles/global.css`.** Brand changes are CSS custom properties in `:root` —
  do not edit component internals to restyle a client.
- **Scripts bind on `astro:page-load`**, never bare `DOMContentLoaded`, so they survive View
  Transitions.
- **Trailing slashes are enforced sitewide.** Internal links end in `/`; `Layout.astro` normalizes
  the canonical to match.

## SEO invariants — do not break these

1. **One `<script type="application/ld+json">` per page**, containing a single `@graph`.
   `FAQSection.astro` is the sole exception (it emits its own `FAQPage` block).
2. **Every `@id` is an absolute URL with a fragment**, and every cross-reference (`provider`,
   `publisher`, `author`, `isPartOf`, `breadcrumb`) resolves to a node in the same graph.
   All of this lives in `src/lib/schema.ts` — add schema there, not inline in a page.
3. **Titles under 60 characters. Descriptions 150–160 characters. Both unique per page.**
4. **Canonical matches the URL that returns 200** — same protocol, host, case, and trailing slash.
5. **NAP is byte-identical** across the footer, the JSON-LD, and the client's Google Business
   Profile. Change it in `business.json` only.
6. **`sameAs` order mirrors `business.json` declaration order** exactly.
7. **Content renders server-side.** Nav links are real `<a href>`, the H1 and body copy are in the
   static HTML. Nothing primary is hydrated client-side.

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
- Empty `ghlWebhookUrl` → contact form logs the payload to the console instead of posting

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
