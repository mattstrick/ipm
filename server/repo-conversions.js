import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const conversionsPath = process.env.IPM_REPO_CONVERSIONS_PATH ||
  join(__dirname, '..', 'scripts', 'repo-conversions.json');
const descriptionsPath = process.env.IPM_REPO_DESCRIPTIONS_PATH ||
  join(__dirname, '..', 'scripts', 'repo-descriptions.json');

let conversions = null;
let descriptions = null;

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

/** Normalize entry: array -> { languages }, object -> as-is. */
function normalizeEntry(value) {
  if (Array.isArray(value)) return { languages: value };
  if (value && typeof value === 'object' && Array.isArray(value.languages)) return value;
  return null;
}

/**
 * Get related implementation links for a repo from repo-conversions.json.
 * Monorepo: one repo with multiple build targets; each language is a subpath (e.g. packages/typescript).
 * JSON format: { "owner/repo": { languages: ["kotlin","python"], defaultRepo?: "..." } } or legacy array.
 * Returns [ { label, url } ].
 */
export function getRelatedLinksForRepo(repoName) {
  const data = loadConversions();
  const key = repoName && typeof repoName === 'string' ? repoName.trim() : '';
  if (!key) return [];
  const raw = data[key];
  const entry = normalizeEntry(raw);
  if (!entry) return [];
  const languages = entry.languages || [];
  const [owner, repo] = key.split('/');
  if (!owner || !repo) return [];
  const baseUrl = `https://github.com/${owner}/${repo}`;
  return languages
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

/**
 * Get the list of packages/* build targets for a repo from repo-conversions.json.
 * Returns e.g. ["packages/javascript", "packages/typescript", "packages/python"].
 * Tries exact key first, then case-insensitive match, then base repo (e.g. array-first-javascript -> array-first).
 */
export function getBuildTargetsForRepo(repoName) {
  const data = loadConversions();
  const key = resolveConversionsKey(data, repoName);
  if (!key) return [];
  const entry = normalizeEntry(data[key]);
  if (!entry) return [];
  const languages = entry.languages || [];
  return languages
    .filter((item) => item != null)
    .map((item) => (typeof item === 'string' ? `${BUILD_TARGET_DIR}/${item}` : null))
    .filter(Boolean);
}

/** Resolve conversions key for a repo (exact, case-insensitive, or base repo). */
function resolveConversionsKey(data, repoName) {
  const key = repoName && typeof repoName === 'string' ? repoName.trim() : '';
  if (!key) return null;
  if (data[key]) return key;
  const keyLower = key.toLowerCase();
  const matchedKey = Object.keys(data).find((k) => k.toLowerCase() === keyLower);
  if (matchedKey) return matchedKey;
  const [owner, repoPart] = key.split('/');
  const baseRepo = packageNameFromRepoFullName(key);
  if (owner && baseRepo && baseRepo !== repoPart) {
    const baseKey = `${owner}/${baseRepo}`;
    if (data[baseKey]) return baseKey;
  }
  return null;
}

/**
 * Get the default/source repo for change detection and syncing build targets.
 * When the default repo changes, other build targets can be updated accordingly.
 *
 * @param {string} monorepoName - Full repo name (e.g. "mattstrick/array-first")
 * @returns {{ defaultRepo: string, defaultLanguage: string, monorepo: string } | null}
 */
export function getDefaultRepo(monorepoName) {
  const data = loadConversions();
  const key = resolveConversionsKey(data, monorepoName);
  if (!key) return null;
  const entry = normalizeEntry(data[key]);
  if (!entry) return null;
  const defaultRepo = entry.defaultRepo || key;
  const defaultLanguage = (entry.defaultLanguage || 'javascript').toLowerCase();
  return {
    defaultRepo: typeof defaultRepo === 'string' ? defaultRepo : key,
    defaultLanguage,
    monorepo: key,
  };
}

/**
 * Return list of repo names (owner/repo) from repo-conversions.json.
 */
export function getReposFromConversions() {
  return Object.keys(loadConversions());
}

/**
 * Get default repo for a package by name (e.g. "array-first").
 * Resolves package name to monorepo via repo-conversions, then returns default repo info.
 */
export function getDefaultRepoForPackage(packageName) {
  const repoNames = getReposFromConversions();
  const pkgLower = (packageName || '').toLowerCase();
  const match = repoNames.find((fullName) => packageNameFromRepoFullName(fullName).toLowerCase() === pkgLower);
  return match ? getDefaultRepo(match) : null;
}

function loadDescriptions() {
  if (descriptions !== null) return descriptions;
  if (!existsSync(descriptionsPath)) {
    descriptions = {};
    return descriptions;
  }
  try {
    const raw = readFileSync(descriptionsPath, 'utf8');
    descriptions = JSON.parse(raw);
  } catch {
    descriptions = {};
  }
  return descriptions;
}

/**
 * Get description override for a repo. Returns override if set, otherwise null.
 */
export function getDescriptionOverride(repoName) {
  const data = loadDescriptions();
  const key = repoName && typeof repoName === 'string' ? repoName.trim() : '';
  if (!key) return null;
  return data[key] ?? null;
}

/**
 * Apply description override: use override if set, otherwise return the given description.
 */
export function applyDescriptionOverride(repoName, description) {
  const override = getDescriptionOverride(repoName);
  return override != null ? override : (description ?? '');
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
