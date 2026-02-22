import { getRepo } from '../api.js';

function escapeHtml(s) {
  if (s == null) return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function formatDate(ms) {
  if (!ms) return '—';
  try {
    return new Date(ms).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

export function renderRepo(params) {
  const { owner, repo } = params;
  const section = document.createElement('div');
  section.innerHTML = `
    <div id="repo-content" class="package-content">
      <div class="empty-state">Loading…</div>
    </div>
  `;

  const contentEl = section.querySelector('#repo-content');

  function getRelatedLinks(r) {
    return (r.relatedLinks && Array.isArray(r.relatedLinks)) ? r.relatedLinks : [];
  }

  function renderRelatedLinks(links) {
    if (!links.length) return '';
    return `
      <p class="related-links-list">
        ${links.map((l) => `<a href="${escapeHtml(l.url)}" target="_blank" rel="noopener" class="btn btn-outline">${escapeHtml(l.label || 'Link')}</a>`).join(' ')}
      </p>
    `;
  }

  (async () => {
    try {
      const r = await getRepo(owner, repo);
      if (!r) {
        contentEl.innerHTML = `
          <div class="empty-state">
            <p><strong>Repo not found</strong></p>
            <p>This repo isn’t in your list, or you’re not signed in.</p>
            <p><a href="/repos" data-spa>Your repos</a></p>
          </div>
        `;
        return;
      }
      const name = r.name || `${owner}/${repo}`;
      const relatedLinks = getRelatedLinks(r);
      contentEl.innerHTML = `
        <div class="package-header">
          <div class="package-title">
            <h1>${escapeHtml(name)}</h1>
            <span class="package-badge">Repo</span>
          </div>
          <p class="package-desc-main">${escapeHtml(r.description || 'No description.')}</p>
        </div>
        <div class="package-layout">
          <div class="package-readme">
            <h2>GitHub repository</h2>
            <p>This is a GitHub repo you added to your registry. It appears first when you search for it.</p>
            <p><a href="${escapeHtml(r.repoUrl)}" target="_blank" rel="noopener" class="btn btn-primary">Open on GitHub</a></p>
            ${renderRelatedLinks(relatedLinks)}
          </div>
          <aside>
            <div class="sidebar-box">
              <h3>Repository</h3>
              <div class="meta-row"><strong>Added</strong> ${formatDate(r.addedAt)}</div>
              <div class="meta-row"><a href="${escapeHtml(r.repoUrl)}" target="_blank" rel="noopener">View on GitHub</a></div>
              ${relatedLinks.map((l) => `<div class="meta-row"><strong>${escapeHtml(l.label || 'Related')}</strong> <a href="${escapeHtml(l.url)}" target="_blank" rel="noopener">Link</a></div>`).join('')}
            </div>
          </aside>
        </div>
      `;
    } catch (err) {
      contentEl.innerHTML = `
        <div class="empty-state">
          <p><strong>Failed to load repo</strong></p>
          <p>${escapeHtml(err.message)}</p>
          <p><a href="/repos" data-spa>Your repos</a></p>
        </div>
      `;
    }
  })();

  return section;
}
