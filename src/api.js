const API = '/api';

export async function searchPackages(query = '') {
  const url = query.trim()
    ? `${API}/search?q=${encodeURIComponent(query)}`
    : `${API}/search`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getRepos() {
  const res = await fetch(`${API}/repos`, { credentials: 'include' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function addRepo(url) {
  const res = await fetch(`${API}/repos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ url: url.trim() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || (res.status === 404 ? 'Repository not found or inaccessible.' : 'Failed to add repo'));
  return data;
}

export async function deleteRepo(id) {
  const res = await fetch(`${API}/repos/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function getRepo(owner, repo) {
  const res = await fetch(`${API}/repo/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, {
    credentials: 'include',
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateRepoRelatedLinks(id, relatedLinks) {
  const res = await fetch(`${API}/repos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ relatedLinks: Array.isArray(relatedLinks) ? relatedLinks : [] }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to update');
  return data;
}

export async function getPackage(name) {
  const res = await fetch(`${API}/package/${encodeURIComponent(name)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getPackageDetails(name) {
  const res = await fetch(`${API}/package/${encodeURIComponent(name)}/details`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
