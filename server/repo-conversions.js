import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const conversionsPath = process.env.IPM_REPO_CONVERSIONS_PATH ||
  join(__dirname, '..', 'scripts', 'repo-conversions.json');

let conversions = null;

function loadConversions() {
  if (conversions !== null) return conversions;
  if (!existsSync(conversionsPath)) {
    conversions = {};
    return conversions;
  }
  try {
    const raw = readFileSync(conversionsPath, 'utf8');
    conversions = JSON.parse(raw);
  } catch {
    conversions = {};
  }
  return conversions;
}

/** Capitalize first letter for display label */
function labelForLang(lang) {
  if (!lang || typeof lang !== 'string') return 'Link';
  return lang.charAt(0).toUpperCase() + lang.slice(1).toLowerCase();
}

/**
 * Get related implementation links for a repo from repo-conversions.json.
 * JSON format: { "owner/repo": [ "kotlin", "python" ] } -> links to github.com/owner/repo-kotlin etc.
 * Returns [ { label, url } ].
 */
export function getRelatedLinksForRepo(repoName) {
  const data = loadConversions();
  const key = repoName && typeof repoName === 'string' ? repoName.trim() : '';
  if (!key) return [];
  const value = data[key];
  if (!value) return [];
  if (Array.isArray(value)) {
    const [owner, repo] = key.split('/');
    if (!owner || !repo) return [];
    return value
      .filter((item) => item != null)
      .map((item) => {
        if (typeof item === 'string') {
          return {
            label: labelForLang(item),
            url: `https://github.com/${owner}/${repo}-${item}`,
          };
        }
        if (typeof item === 'object' && item !== null && item.url) {
          return {
            label: item.label || item.url,
            url: String(item.url),
          };
        }
        return null;
      })
      .filter(Boolean);
  }
  return [];
}

/**
 * Return list of repo names (owner/repo) from repo-conversions.json.
 */
export function getReposFromConversions() {
  return Object.keys(loadConversions());
}

/**
 * Package name from full repo name: repo part minus everything after the last hyphen.
 * e.g. "mattstrick/array-first-javascript" -> "array-first"
 */
export function packageNameFromRepoFullName(fullName) {
  if (!fullName || typeof fullName !== 'string') return '';
  const parts = fullName.trim().split('/');
  const repoPart = parts.length > 1 ? parts[1] : parts[0] || fullName;
  const lastHyphen = repoPart.lastIndexOf('-');
  return lastHyphen > 0 ? repoPart.slice(0, lastHyphen) : repoPart;
}
