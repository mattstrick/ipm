const GITHUB_API = 'https://api.github.com';

/**
 * Parse GitHub repo URL or "owner/repo" into { owner, repo }.
 */
export function parseRepoUrl(input) {
  const s = String(input).trim();
  const urlMatch = s.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?\/?$/i);
  if (urlMatch) return { owner: urlMatch[1], repo: urlMatch[2].replace(/\.git$/, '') };
  const slashMatch = s.match(/^([^/]+)\/([^/]+)$/);
  if (slashMatch) return { owner: slashMatch[1], repo: slashMatch[2] };
  return null;
}

/**
 * Fetch repo metadata from GitHub API. No token = 60 req/hr.
 */
export async function fetchRepoMetadata(owner, repo) {
  const url = `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'ipm-repo-fetcher',
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
  const data = await res.json();
  return {
    name: data.full_name || `${owner}/${repo}`,
    description: data.description || null,
    repoUrl: data.html_url || `https://github.com/${owner}/${repo}`,
  };
}
