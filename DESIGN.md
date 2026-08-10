# DESIGN.md — Brand Token Reference

Every visual decision in this boilerplate is driven by CSS custom properties declared in
`:root` at the top of `src/styles/global.css`. A client rebrand should touch that block and
nothing else.

## Brand tokens

| Token | Default | What it controls |
|---|---|---|
| `--primary` | `#1e88e5` | Buttons, links, icons, accent word in hero H1, section labels, active nav |
| `--primary-hover` | `#61a82f` | Button and link hover states |
| `--secondary` | `#0d1b2a` | Footer background, CTA gradient start, mobile CTA bar, hero overlay |
| `--accent` | `#f5ca13` | Star ratings, CTA button hover on dark backgrounds |

**Swap rule:** set `--primary` to the client's brand colour and `--primary-hover` to a darker or
complementary shade. Check contrast against `--text-white` (buttons render white text on
`--primary`) — aim for 4.5:1 or better.

## Semantic colours

| Token | Light | Dark | Role |
|---|---|---|---|
| `--bg-dark` | `#f8f9fa` | `#0a0a0f` | Alternating section background (`.section-alt`) |
| `--bg-darker` | `#ffffff` | `#0d0d14` | Default page background |
| `--text-primary` | `#121212` | `#f0f0f0` | Headings, body emphasis |
| `--text-secondary` | `#4a4a4a` | `#a0a0a0` | Body copy, muted meta text |
| `--text-white` | `#ffffff` | `#ffffff` | Text on dark surfaces |

Dark values swap automatically under `@media (prefers-color-scheme: dark)`. The glass-morphism
aesthetic is designed dark-first — verify both modes after a rebrand.

## Glassmorphism

| Token | Light | Dark |
|---|---|---|
| `--glass-bg` | `rgba(255,255,255,0.8)` | `rgba(255,255,255,0.05)` |
| `--glass-border` | `rgba(0,0,0,0.1)` | `rgba(255,255,255,0.1)` |
| `--glass-blur` | `10px` | `10px` |

`.glass-panel` is the base surface: padded, 16px radius, 1px border, backdrop blur. Add
`.glass-panel-hover` for the lift-and-glow interaction on cards.

If a client's brand colour is very light, raise `--glass-bg` opacity so panel text stays legible.

## Spacing and sizing

| Token | Default | Role |
|---|---|---|
| `--container-max` | `1200px` | `.container` max width |
| `--section-padding` | `6rem` | Vertical rhythm on `.section` |
| `--transition-speed` | `0.3s` | Every hover/state transition |

## Typography

| Token | Value |
|---|---|
| `--font-primary` | `'Inter', system-ui, -apple-system, sans-serif` |
| `--font-weight-light` … `--font-weight-extrabold` | `300` … `800` |

Inter is preconnected and preloaded in `Layout.astro`. Headings use fluid `clamp()` sizing, so
they scale without breakpoints:

| Element | Size |
|---|---|
| `h1` | `clamp(2.1rem, 5vw, 3.5rem)` @ 800 |
| `h2` | `clamp(1.7rem, 3.6vw, 2.5rem)` @ 700 |
| `h3` | `clamp(1.2rem, 2.2vw, 1.5rem)` @ 700 |

## Component classes

| Class | Purpose |
|---|---|
| `.container` | Centred max-width wrapper |
| `.section` / `.section-alt` | Vertical section, alternating background |
| `.section-label` / `.section-title` / `.section-intro` | Section heading stack |
| `.section-head-center` | Centres the heading stack |
| `.grid` + `.grid-2` / `.grid-3` / `.grid-4` | Auto-fit responsive grids |
| `.glass-panel` / `.glass-panel-hover` | Glass surfaces |
| `.btn` + `.btn-primary` / `.btn-outline` / `.btn-sm` | Button system |
| `.animate-on-scroll` | Fade-up on intersection (adds `.is-visible`) |
| `.chip` / `.chip-list` | Neighborhood, landmark, and tag pills |
| `.article-body` | Blog prose column with table, blockquote, and `<dfn>` styling |

## Breakpoints

| Width | Behaviour |
|---|---|
| `≤ 900px` | Nav collapses to hamburger; menu becomes a full-width dropdown |
| `≤ 768px` | Floating mobile CTA bar appears; footer gains 5rem bottom padding to clear it |
| `≥ 1024px` | Exit-intent popup is eligible to fire (desktop only) |

## Accessibility floor

- Skip link is the first focusable element on every page
- `:focus-visible` renders a 3px `--primary` outline at 2px offset
- All animation is disabled under `prefers-reduced-motion: reduce`
- Icon-only links carry `aria-label`; decorative icons carry `aria-hidden="true"`
- FAQ accordion buttons manage `aria-expanded` and `aria-controls`
