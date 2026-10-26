#!/usr/bin/env node
/* Regenerates the "Built-in RSS sources" section of both READMEs from
   server/seeds.ts, so the documented URLs cannot drift from the shipped ones.
   Run with: npm run docs:sources */

import { readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../..');

const seeds = readFileSync(resolve(here, '../server/seeds.ts'), 'utf8');

const entry =
  /\{\s*name:\s*'((?:[^'\\]|\\.)*)',\s*rssUrl:\s*'([^']*)',\s*category:\s*'([^']*)'([^}]*)\}/g;

const sources = [];
for (const m of seeds.matchAll(entry)) {
  const [, name, rssUrl, category, rest] = m;
  const inactive = /active:\s*false/.test(rest);
  const reason = rest.match(/brokenReason:\s*'([^']*)'/)?.[1] ?? null;
  sources.push({ name: name.replace(/\\'/g, "'"), rssUrl, category, inactive, reason });
}

if (sources.length === 0) {
  console.error('No sources parsed from seeds.ts — refusing to rewrite the READMEs.');
  process.exit(1);
}

const active = sources.filter((s) => !s.inactive);
const retired = sources.filter((s) => s.inactive);

const byCategory = new Map();
for (const s of active) {
  if (!byCategory.has(s.category)) byCategory.set(s.category, []);
  byCategory.get(s.category).push(s);
}

const COPY = {
  en: {
    heading: `## Built-in RSS sources (${sources.length} sources, ${active.length} active)`,
    intro:
      `CyberPulse ships with ${sources.length} cybersecurity feeds, ${active.length} of them enabled by default. ` +
      `This list is generated from \`app/server/seeds.ts\` — run \`npm run docs:sources\` after changing it.`,
    retiredHeading: `### Retired (${retired.length})`,
    retiredIntro:
      'Verified unreachable, so they ship disabled rather than costing a request on every scrape. ' +
      'They stay listed in Settings and can be re-enabled at any time.',
    cols: '| Source | RSS URL |\n|--------|---------|',
    retiredCols: '| Source | Reason |\n|--------|--------|',
  },
  es: {
    heading: `## Fuentes RSS incluidas (${sources.length} fuentes, ${active.length} activas)`,
    intro:
      `CyberPulse incluye ${sources.length} feeds de ciberseguridad, ${active.length} habilitados por defecto. ` +
      `Esta lista se genera desde \`app/server/seeds.ts\` — ejecutá \`npm run docs:sources\` después de modificarlo.`,
    retiredHeading: `### Retiradas (${retired.length})`,
    retiredIntro:
      'Verificadas como inalcanzables, por eso se incluyen deshabilitadas en lugar de costar una petición en cada scrape. ' +
      'Siguen visibles en Settings y se pueden reactivar cuando quieras.',
    cols: '| Fuente | URL del RSS |\n|--------|-------------|',
    retiredCols: '| Fuente | Motivo |\n|--------|--------|',
  },
};

function render(lang) {
  const t = COPY[lang];
  const parts = [t.heading, '', t.intro, ''];

  for (const category of [...byCategory.keys()].sort()) {
    parts.push(`### ${category}`, '', t.cols);
    for (const s of byCategory.get(category).sort((a, b) => a.name.localeCompare(b.name))) {
      parts.push(`| ${s.name} | ${s.rssUrl} |`);
    }
    parts.push('');
  }

  if (retired.length) {
    parts.push(t.retiredHeading, '', t.retiredIntro, '', t.retiredCols);
    for (const s of retired.sort((a, b) => a.name.localeCompare(b.name))) {
      parts.push(`| ${s.name} | ${s.reason ?? '—'} |`);
    }
    parts.push('');
  }

  return parts.join('\n');
}

const TARGETS = [
  { file: resolve(repo, 'README.md'), lang: 'en', startsWith: '## Built-in RSS sources' },
  { file: resolve(repo, 'README.es.md'), lang: 'es', startsWith: '## Fuentes RSS incluidas' },
];

for (const { file, lang, startsWith } of TARGETS) {
  const md = readFileSync(file, 'utf8');
  const lines = md.split('\n');

  const start = lines.findIndex((l) => l.startsWith(startsWith));
  if (start === -1) {
    console.error(`Could not find "${startsWith}" in ${file} — skipped.`);
    continue;
  }
  // The section runs until the next level-2 heading.
  let end = lines.findIndex((l, i) => i > start && /^## /.test(l));
  if (end === -1) end = lines.length;

  const next = [...lines.slice(0, start), render(lang), ...lines.slice(end)].join('\n');
  writeFileSync(file, next);
  console.log(`${file}: ${active.length} active + ${retired.length} retired written`);
}
