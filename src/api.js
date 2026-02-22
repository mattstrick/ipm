const API = '/api';

export async function searchPackages(query = '') {
  const url = query.trim()
    ? `${API}/search?q=${encodeURIComponent(query)}`
    : `${API}/search`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getPackage(name) {
  const res = await fetch(`${API}/package/${encodeURIComponent(name)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
