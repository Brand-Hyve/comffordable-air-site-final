# Placeholder images

Every file in this directory is a **generated placeholder**, not real artwork. Replace all of
them during client setup (spec §11, Step 3). Keep the filenames identical — they are referenced
from `src/config/business.json`, `src/config/gallery.json`, and the page templates.

| File | Target dimensions | Used by |
|---|---|---|
| `logo.png` | 180×180 (or larger, square) | Navbar, Footer, Organization schema, OG fallback |
| `hero.jpg` | 1920×1080 | Homepage hero, service page heroes, blog hero |
| `about.jpg` | 1920×1080 | About page hero |
| `{area-id}-hero.jpg` | 1920×1080 | `service-areas/[city]` hero — one per `serviceAreas[].id` |
| `team-{name}.png` | 400×400 square | About page team grid, `Person` schema |
| `gallery/project-NN.jpg` | 1200×900 | `gallery.json` photo grid |
| `blog/{slug}.jpg` | 1200×675 (16:9) | Blog card + `BlogPosting` schema image |

Root-level icons to replace from the client brand kit:

| File | Size |
|---|---|
| `/favicon.ico` | 32×32 |
| `/favicon.png` | 64×64 |
| `/apple-touch-icon.png` | 180×180 |

Also update `/site.webmanifest` — it ships with `{{BUSINESS_NAME}}`,
`{{BUSINESS_SHORT_NAME}}`, and `{{BUSINESS_DESCRIPTION}}` placeholders.
