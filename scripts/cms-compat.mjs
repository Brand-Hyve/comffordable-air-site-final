/**
 * CMS-compatibility end-to-end check: run the REAL Hyve CMS engine
 * (autotag → render → resync) over this repo's built output and assert the
 * contracts this boilerplate promises:
 *
 *   1. every page survives script-stripping (content visible, no JS required)
 *   2. hand-authored data-cms / data-cms-img ids are preserved by ingest
 *   3. structural wrappers are NOT registered as editable fields
 *   4. the page's @graph JSON-LD survives and the CMS stands down (no data-cms-ld)
 *   5. data-cms-item elements are DIRECT children of their data-cms-collection
 *   6. client edits on authored ids survive a rebuild resync verbatim
 *
 * Usage:
 *   npm run build && npm run test:cms
 *   (set HYVE_CMS_DIR if the CMS checkout lives somewhere else)
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { register } from 'node:module';

const CMS_DIR =
  process.env.HYVE_CMS_DIR ??
  'C:/Users/avery/IDE Workspaces/Antigravity/Internal/Brand Hyve CMS/hyve-cms';
const DIST = process.env.BOILERPLATE_DIST ?? path.resolve('dist');

if (!fs.existsSync(path.join(CMS_DIR, 'lib/cms/autotag.ts'))) {
  console.error(`Hyve CMS not found at ${CMS_DIR} — set HYVE_CMS_DIR.`);
  process.exit(1);
}
if (!fs.existsSync(DIST)) {
  console.error(`No build at ${DIST} — run \`npm run build\` first.`);
  process.exit(1);
}

const cmsUrl = (p) => pathToFileURL(path.join(CMS_DIR, p)).href;
// The CMS engine uses extensionless internal imports — reuse its own resolver.
register(cmsUrl('test/ts-resolve.mjs'));
const { autotag } = await import(cmsUrl('lib/cms/autotag.ts'));
const { render } = await import(cmsUrl('lib/cms/render.ts'));
const { resyncContent } = await import(cmsUrl('lib/cms/resync.ts'));
const { load } = await import(cmsUrl('node_modules/cheerio/dist/esm/index.js'));

const pages = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.html')) pages.push(p);
  }
})(DIST);

let pass = 0;
let fail = 0;
const check = (page, name, ok, detail = '') => {
  if (ok) pass++;
  else {
    fail++;
    console.log(`  FAIL  [${path.relative(DIST, page)}] ${name}${detail ? ' — ' + detail : ''}`);
  }
};

const isAuthored = (id) => Boolean(id) && !/^cms-\d+$/.test(id);

for (const page of pages) {
  const html = fs.readFileSync(page, 'utf8');
  const rel = path.relative(DIST, page).replace(/\\/g, '/');
  const url = `https://www.example.com/${rel.replace(/index\.html$/, '')}`;
  const tagged = autotag(html, url);
  const $t = load(tagged.templateHtml);

  // 1. Script-stripping resilience: page keeps only JSON-LD scripts.
  check(page, 'behaviour scripts stripped', $t('script').not('[type="application/ld+json"]').length === 0);
  check(page, 'JSON-LD survives ingest', $t('script[type="application/ld+json"]').length >= 1);

  // Content reachable without JS: FAQ answers inside native <details>.
  const $src = load(html);
  if ($src('.faq-item').length) {
    check(page, 'FAQ items are native <details>', $src('details.faq-item').length === $src('.faq-item').length);
  }
  // Mobile nav is CSS-only (checkbox + label present).
  check(page, 'CSS-only nav toggle present', $src('input.nav-checkbox').length === 1 && $src('label.nav-toggle').length === 1);

  // 2. Authored ids preserved by ingest.
  const authoredInHtml = new Set(
    [...html.matchAll(/data-cms="([^"]+)"/g), ...html.matchAll(/data-cms-img="([^"]+)"/g)]
      .map((m) => m[1])
      .filter(isAuthored)
  );
  const missing = [...authoredInHtml].filter((id) => !(id in tagged.schema));
  check(page, 'every authored id registered in schema', missing.length === 0, missing.slice(0, 5).join(', '));

  // 3. No structural wrapper registered: a registered data-cms element must not
  //    contain other authored-tagged elements.
  const doubles = [];
  $t('[data-cms]').each((_, el) => {
    const id = $t(el).attr('data-cms');
    if (!isAuthored(id) || !(id in tagged.schema)) return;
    const wrapsAuthored = $t(el)
      .find('[data-cms],[data-cms-img]')
      .toArray()
      .some((d) => isAuthored(d.attribs['data-cms'] || d.attribs['data-cms-img']));
    if (wrapsAuthored) doubles.push(id);
  });
  check(page, 'no structural wrapper registered as a field', doubles.length === 0, doubles.slice(0, 5).join(', '));

  // 4. CMS stands down on author-owned schema.
  const rendered = render(tagged.templateHtml, tagged.schema, tagged.content);
  check(page, 'CMS generates no competing schema', load(rendered)('script[data-cms-ld]').length === 0);

  // 5. HAND-AUTHORED collection items are direct children of their container.
  //    (CMS auto-detected colN groups are excluded — when two groups share a
  //    parent the CMS overwrites the parent attribute, a known engine quirk.)
  let orphanItems = 0;
  $t('[data-cms-item]').each((_, el) => {
    const colId = $t(el).attr('data-cms-item');
    if (/^col\d+$/.test(colId)) return;
    const parent = $t(el).parent();
    if (parent.attr('data-cms-collection') !== colId) orphanItems++;
  });
  check(page, 'collection items are direct children', orphanItems === 0, `${orphanItems} orphaned`);

  // 6. Resync: edit every authored text field, re-ingest the same page, expect
  //    verbatim carry-over with nothing dropped.
  const editable = Object.keys(tagged.schema).filter(
    (id) => isAuthored(id) && tagged.schema[id].type === 'text'
  );
  const current = { ...tagged.content };
  editable.forEach((id, i) => (current[id] = `CLIENT EDIT ${i}`));
  const v2 = autotag(html, url);
  const { content, dropped } = resyncContent(tagged.templateHtml, tagged.content, current, v2.templateHtml, v2.content);
  const lost = dropped.filter((d) => String(d.value).startsWith('CLIENT EDIT'));
  check(page, 'no authored edit dropped on resync', lost.length === 0, `${lost.length} dropped`);
  const notVerbatim = editable.filter((id) => id in v2.content && content[id] !== current[id]);
  check(page, 'authored edits carried verbatim', notVerbatim.length === 0, notVerbatim.slice(0, 5).join(', '));
}

console.log(`\n${pass}/${pass + fail} checks passed across ${pages.length} pages`);
process.exit(fail ? 1 : 0);
