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
