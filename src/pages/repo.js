import { marked } from 'marked';
import { getRepo } from '../api.js';

function escapeHtml(s) {
  if (s == null) return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function renderMarkdown(md) {
  if (md == null || md === '') return '';
  try {
    return marked.parse(String(md), { async: false });
  } catch {
    return escapeHtml(md);
  }
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
      const buildTargets = (r.buildTargets && Array.isArray(r.buildTargets)) ? r.buildTargets : [];
      const buildTargetsHtml = buildTargets.length > 0
        ? `<div class="meta-row"><strong>Build targets</strong></div>
           <div class="repo-build-targets">${buildTargets.map((path) => `<code class="repo-build-target">${escapeHtml(path)}</code>`).join(' ')}</div>`
        : '';
      const defaultRepo = r.defaultRepo;
      const defaultRepoHtml = defaultRepo && defaultRepo.defaultRepo
        ? `<div class="meta-row"><strong>Source repo</strong></div>
           <div class="meta-row"><a href="https://github.com/${escapeHtml(defaultRepo.defaultRepo)}" target="_blank" rel="noopener">${escapeHtml(defaultRepo.defaultRepo)}</a> <span class="meta-muted">(${escapeHtml(defaultRepo.defaultLanguage)})</span></div>`
        : '';
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
            ${r.readme ? `
            <h2>Readme</h2>
            <div class="readme-content">${renderMarkdown(r.readme)}</div>
            ` : ''}
          </div>
          <aside>
            <div class="sidebar-box">
              <h3>Repository</h3>
              <div class="meta-row"><strong>Added</strong> ${formatDate(r.addedAt)}</div>
              <div class="meta-row"><a href="${escapeHtml(r.repoUrl)}" target="_blank" rel="noopener">View on GitHub</a></div>
              ${defaultRepoHtml}
              ${buildTargetsHtml}
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
