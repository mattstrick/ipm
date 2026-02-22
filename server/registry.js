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
  return {
    name: data.name,
    description: desc,
    version: latest || (data.versions && Object.keys(data.versions).pop()) || null,
    weeklyDownloads: data.downloads?.lastWeek ?? data.downloads?.lastMonth ?? 0,
    readme: data.readme ?? null,
    license,
    repositoryUrl,
    homepage: versionData?.homepage ?? data.homepage ?? null,
  };
}
