# Site images

These are Comffordable Air's real photos, not boilerplate placeholders. Every file is served
as **WebP** — keep it that way, and keep the filenames identical, because they are referenced
from `src/config/business.json` and the page templates.

| File | Dimensions on disk | Used by |
|---|---|---|
| `logo.webp` | 512×512 | Navbar, Footer, Organization schema, OG fallback |
| `hero.webp` | 1024×685 | Homepage hero, service page heroes, blog hero |
| `about.webp` | 1920×1280 | About page hero + About OG image |
| `contact-hero.webp` | 1080×1080 | Contact hero + Contact OG image |
| `service-areas-hero.webp` | 1920×1280 | `/service-areas/` hero |
| `{area-id}-hero.webp` | 1440×1920 | `service-areas/[city]` hero — one per `serviceAreas[].id` |
| `service-{id}.webp` | varies | `services[].heroImage` in `business.json` |
| `owner-portrait.webp` | 1080×1440 | About page owner photo |
| `blog/{slug}.webp` | 1200×675 (16:9) | Blog card + `BlogPosting` schema image |

## Adding or replacing an image

Convert to WebP before committing. The source JPEGs here were already heavily compressed, so a
fixed quality can come out *larger* than the original — step the quality down until the WebP
actually wins, and if it never does, keep the original format rather than ship a regression.
`contact-hero` needed q70 and `st-petersburg-fl-hero` needed q76 for this reason; everything
else converted cleanly at q82.

Root-level icons stay in their current formats (browsers and the manifest expect them):

| File | Size |
|---|---|
| `/favicon.ico` | 32×32 |
| `/favicon.png` | 64×64 |
| `/apple-touch-icon.png` | 180×180 |
