// Upstream JavaScript package registry (public API)
const REGISTRY = 'https://registry.npmjs.org';

export async function searchRegistry(text, size = 20) {
  const url = `${REGISTRY}/-/v1/search?text=${encodeURIComponent(text)}&size=${size}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Registry search failed: ${res.status}`);
  const data = await res.json();
  return (data.objects || []).map((o) => {
    const p = o.package || {};
    return {
      name: p.name,
      description: p.description || null,
      version: p.version || null,
      weeklyDownloads: p.weeklyDownloads ?? 0,
    };
  });
}

export async function getPackageFromRegistry(name) {
  const url = `${REGISTRY}/${encodeURIComponent(name)}`;
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Package fetch failed: ${res.status}`);
  const data = await res.json();
  const latest = data['dist-tags']?.latest;
  const versionData = latest && data.versions ? data.versions[latest] : null;
  const desc = versionData?.description ?? data.description ?? null;
  const license = typeof versionData?.license === 'string'
    ? versionData.license
    : versionData?.license?.type ?? data.license ?? null;
  let repositoryUrl = null;
  const repo = versionData?.repository ?? data.repository;
  if (repo) {
    if (typeof repo === 'string') repositoryUrl = repo;
    else if (repo.url) repositoryUrl = repo.url.replace(/^git\+/, '').replace(/\.git$/, '');
  }
  const time = data.time || {};
  const publishedAt = latest ? time[latest] : time.modified || null;
  return {
    name: data.name,
    description: desc,
    version: latest || (data.versions && Object.keys(data.versions).pop()) || null,
    weeklyDownloads: data.downloads?.lastWeek ?? data.downloads?.lastMonth ?? 0,
    readme: data.readme ?? null,
    license,
    repositoryUrl,
    homepage: versionData?.homepage ?? data.homepage ?? null,
    publishedAt,
  };
}

/** Build npm-style packument from an IPM packages table row (DB-only registry). */
export function buildPackumentFromIpmPackage(pkg) {
  const version = pkg.version || '0.0.0';
  const tarball = githubArchiveTarballFromRepoUrl(pkg.repositoryUrl, version);
  const packument = {
    name: pkg.name,
    'dist-tags': { latest: version },
    versions: {
      [version]: {
        name: pkg.name,
        version,
        description: pkg.description || undefined,
        license: pkg.license || undefined,
        repository: pkg.repositoryUrl ? { type: 'git', url: pkg.repositoryUrl } : undefined,
        homepage: pkg.homepage || undefined,
        readme: pkg.readme || undefined,
        dist: tarball ? { tarball, integrity: undefined } : undefined,
      },
    },
  };
  if (pkg.publishedAt) packument.time = { [version]: pkg.publishedAt, modified: pkg.publishedAt };
  return packument;
}

/** Return GitHub archive tarball URL from repo URL (e.g. https://github.com/owner/repo) and version. */
function githubArchiveTarballFromRepoUrl(repositoryUrl, version) {
  if (!repositoryUrl || typeof repositoryUrl !== 'string') return null;
  const m = repositoryUrl.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?\/?$/i);
  if (!m) return null;
  const [, owner, repo] = m;
  const v = (version || '0.0.0').trim().replace(/^v/, '');
  if (v === '0.0.0' || !v) {
    return `https://github.com/${owner}/${repo}/archive/refs/heads/main.tar.gz`;
  }
  return `https://github.com/${owner}/${repo}/archive/refs/tags/v${v}.tar.gz`;
}

/** Fetch full packument for dependencies and versions (not stored in DB). */
export async function getPackageDetailsFromRegistry(name) {
  const url = `${REGISTRY}/${encodeURIComponent(name)}`;
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Package fetch failed: ${res.status}`);
  const data = await res.json();
  const latest = data['dist-tags']?.latest;
  const versionData = latest && data.versions ? data.versions[latest] : null;
  const dependencies = versionData?.dependencies ? Object.entries(versionData.dependencies).map(([n, v]) => ({ name: n, version: v })) : [];
  const devDependencies = versionData?.devDependencies ? Object.entries(versionData.devDependencies).map(([n, v]) => ({ name: n, version: v })) : [];
  const versions = data.versions ? Object.keys(data.versions).sort(semverCompare) : [];
  return { dependencies, devDependencies, versions };
}

function semverCompare(a, b) {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const x = partsA[i] ?? 0;
    const y = partsB[i] ?? 0;
    if (x !== y) return y - x; // descending
  }
  return 0;
}
