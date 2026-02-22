#!/usr/bin/env node
/**
 * Generate REPO_LANGUAGES.md: for each repo, list languages it has NOT been converted into.
 *
 * Edit scripts/repo-conversions.json to set which repos to include and which
 * language codes each has already been converted to. Run from project root:
 *
 *   node scripts/generate-repo-languages-md.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { getDb, getLanguages } from '../server/db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const configPath = join(__dirname, 'repo-conversions.json');
const conversions = JSON.parse(readFileSync(configPath, 'utf8'));

const db = getDb();
const allLanguages = getLanguages(db);

const codeToName = new Map(allLanguages.map((l) => [l.code.toLowerCase(), l.name]));

const lines = [
  '# Repos and languages not yet converted',
  '',
  'For each repo, languages from the registry that do not yet have a port.',
  '',
];

for (const [repo, convertedCodes] of Object.entries(conversions)) {
  const convertedSet = new Set(convertedCodes.map((c) => c.toLowerCase()));
  const notConverted = allLanguages
    .filter((l) => !convertedSet.has(l.code.toLowerCase()))
    .map((l) => l.name)
    .sort((a, b) => a.localeCompare(b));

  lines.push(`## ${repo}`);
  lines.push('');
  if (notConverted.length === 0) {
    lines.push('All compatible languages have been converted.');
  } else {
    lines.push('**Not yet converted:**');
    lines.push('');
    notConverted.forEach((name) => {
      lines.push(`- ${name}`);
    });
  }
  lines.push('');
}

const outPath = join(projectRoot, 'REPO_LANGUAGES.md');
writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log('Wrote', outPath);
