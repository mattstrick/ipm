import { getRepos, addRepo, deleteRepo } from '../api.js';

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

export function renderRepos() {
  const section = document.createElement('div');
  section.innerHTML = `
    <h1>Your GitHub repos</h1>
    <p class="section-desc">Repos you add here appear first in search results.</p>
    <form class="add-repo-form" id="add-repo-form">
      <label for="repo-url">Add a repo</label>
      <div class="add-repo-row">
        <input id="repo-url" name="url" type="text" placeholder="https://github.com/owner/repo or owner/repo" />
        <button type="submit" class="btn btn-primary">Add</button>
      </div>
      <div class="error" id="add-repo-error" role="alert" hidden></div>
    </form>
    <div id="repos-list" class="repos-list">
      <div class="empty-state">Loading…</div>
    </div>
  `;

  const form = section.querySelector('#add-repo-form');
  const errorEl = section.querySelector('#add-repo-error');
  const listEl = section.querySelector('#repos-list');

  async function loadRepos() {
    try {
      const repos = await getRepos();
      if (repos.length === 0) {
        listEl.innerHTML = '<div class="empty-state"><p>No repos yet. Add one above.</p></div>';
        return;
      }
      listEl.innerHTML = `
        <ul class="package-list">
          ${repos
            .map((r) => {
              const [owner, repo] = (r.name || '').split('/');
              const href = owner && repo ? `/repo/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}` : '#';
              return `
            <li class="package-item repo-list-item">
              <a href="${href}" class="package-name" data-spa>${escapeHtml(r.name)}</a>
              <span class="package-meta">Added ${formatDate(r.addedAt)}</span>
              <p class="package-desc">${escapeHtml(r.description || '')}</p>
              <button type="button" class="btn btn-outline btn-sm delete-repo-btn" data-id="${r.id}" data-name="${escapeHtml(r.name)}">Remove</button>
            </li>
          `;
            })
            .join('')}
        </ul>
      `;
      listEl.querySelectorAll('.delete-repo-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = Number(btn.dataset.id);
          try {
            await deleteRepo(id);
            loadRepos();
          } catch (err) {
            errorEl.textContent = err.message;
            errorEl.hidden = false;
          }
        });
      });
    } catch (err) {
      listEl.innerHTML = `<div class="empty-state"><p>Failed to load repos: ${escapeHtml(err.message)}</p></div>`;
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.hidden = true;
    errorEl.textContent = '';
    const url = form.url?.value?.trim();
    if (!url) {
      errorEl.textContent = 'Enter a GitHub URL or owner/repo';
      errorEl.hidden = false;
      return;
    }
    try {
      await addRepo(url);
      form.reset();
      loadRepos();
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    }
  });

  loadRepos();
  return section;
}
