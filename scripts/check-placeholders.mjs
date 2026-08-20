/**
 * Pre-deploy placeholder gate. A client site must never ship with template
 * placeholders still in place — {{DOMAIN}} in robots.txt / package.json's qa
 * script, {{BUSINESS_*}} in site.webmanifest, or the sample HVAC config. The
 * setup checklist mentions all of them, but a checklist does not fail a
 * deploy; this does.
 *
 * Scans the BUILT output (dist/) plus package.json, and exits 1 on any hit.
 * Run via `npm run qa` (which chains it) or standalone:
 *   npm run build && node scripts/check-placeholders.mjs
 *
 * The boilerplate repo itself fails this check by design — it is full of
 * sample data. That is correct: the check exists for client clones.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.env.BOILERPLATE_DIST ?? path.resolve('dist');
const PLACEHOLDER = /\{\{[A-Z0-9_]+\}\}/;
// Sample-config values that mean setup step 1 was skipped.
const SAMPLE_DATA = /Example Home Services|www\.example\.com|\(727\) 555-1700|info@example\.com/;

if (!fs.existsSync(DIST)) {
  console.error(`No build at ${DIST} — run \`npm run build\` first.`);
  process.exit(1);
}

const failures = [];

function scanFile(file, label = file) {
  const text = fs.readFileSync(file, 'utf8');
  for (const [name, re] of [
    ['template placeholder {{...}}', PLACEHOLDER],
    ['sample HVAC data', SAMPLE_DATA],
  ]) {
    const hit = text.match(re);
    if (hit) failures.push(`${label}: ${name} — "${hit[0]}"`);
  }
}

(function walk(dir) {
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.(html|txt|xml|webmanifest|json)$/.test(entry)) scanFile(p);
  }
})(DIST);

// package.json's qa script ships with https://{{DOMAIN}} until setup fills it.
scanFile(path.resolve('package.json'), 'package.json');

if (failures.length) {
  console.error('PLACEHOLDER CHECK FAILED — this site is not ready to ship:\n');
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error(
    '\nComplete the client setup checklist (CLAUDE.md §Client setup): fill business.json, robots.txt, site.webmanifest, and the qa script domain.'
  );
  process.exit(1);
}

console.log('Placeholder check passed — no template placeholders or sample data in the build.');
