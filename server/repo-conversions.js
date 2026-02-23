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

/** Build target subpath in monorepo (must match registry BUILD_TARGET_DIR). */
const BUILD_TARGET_DIR = 'packages';

/**
 * Get related implementation links for a repo from repo-conversions.json.
 * Monorepo: one repo with multiple build targets; each language is a subpath (e.g. packages/typescript).
 * JSON format: { "owner/repo": [ "kotlin", "python" ] } -> links to github.com/owner/repo/tree/main/packages/kotlin etc.
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
    const baseUrl = `https://github.com/${owner}/${repo}`;
    return value
      .filter((item) => item != null)
      .map((item) => {
        if (typeof item === 'string') {
          return {
            label: labelForLang(item),
            url: `${baseUrl}/tree/main/${BUILD_TARGET_DIR}/${item}`,
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
 * Package name from full repo name.
 * Monorepo: repo is the package (e.g. "mattstrick/array-first" -> "array-first").
 * Legacy: repo part minus everything after the last hyphen (e.g. "mattstrick/array-first-javascript" -> "array-first").
 * Only strip the last segment when the repo has more than one hyphen (so "array-first" is not reduced to "array").
 */
export function packageNameFromRepoFullName(fullName) {
  if (!fullName || typeof fullName !== 'string') return '';
  const parts = fullName.trim().split('/');
  const repoPart = parts.length > 1 ? parts[1] : parts[0] || fullName;
  const lastHyphen = repoPart.lastIndexOf('-');
  const hyphenCount = (repoPart.match(/-/g) || []).length;
  return hyphenCount > 1 ? repoPart.slice(0, lastHyphen) : repoPart;
}
