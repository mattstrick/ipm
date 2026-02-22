import { getRepo, updateRepoRelatedLinks } from '../api.js';

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
    if (r.relatedLinks && Array.isArray(r.relatedLinks)) return r.relatedLinks;
    if (r.relatedLinkUrl && r.relatedLinkUrl.trim()) {
      return [{ label: r.relatedLinkLabel || 'Related', url: r.relatedLinkUrl }];
    }
    return [];
  }

  function renderRelatedLinks(links) {
    if (!links.length) return '';
    return `
      <p class="related-links-list">
        ${links.map((l) => `<a href="${escapeHtml(l.url)}" target="_blank" rel="noopener" class="btn btn-outline">${escapeHtml(l.label || 'Link')}</a>`).join(' ')}
      </p>
    `;
  }

  function renderRelatedLinkForm(r) {
    const links = getRelatedLinks(r);
    const rows = links.length
      ? links
          .map(
            (l, i) => `
          <div class="related-link-row" data-index="${i}">
            <input class="related-label" placeholder="Label" value="${escapeHtml(l.label || '')}" />
            <input class="related-url" type="url" placeholder="URL" value="${escapeHtml(l.url || '')}" />
            <button type="button" class="btn btn-outline btn-sm related-link-remove">Remove</button>
          </div>
        `
          )
          .join('')
      : '';
    return `
      <div class="related-link-form" id="related-link-form">
        <h3>Other implementations</h3>
        <p class="form-hint">e.g. Kotlin version, Python port. Add as many as you like.</p>
        <div id="related-link-rows">${rows}</div>
        <button type="button" class="btn btn-outline btn-sm" id="related-link-add">Add another</button>
        <div class="error" id="related-link-error" hidden></div>
        <button type="button" class="btn btn-primary" id="related-link-save">Save links</button>
      </div>
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
            ${renderRelatedLinkForm(r)}
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

      const rowsContainer = contentEl.querySelector('#related-link-rows');
      const addBtn = contentEl.querySelector('#related-link-add');
      const saveBtn = contentEl.querySelector('#related-link-save');
      const errorEl = contentEl.querySelector('#related-link-error');

      function addRow(label = '', url = '') {
        const div = document.createElement('div');
        div.className = 'related-link-row';
        div.innerHTML = `
          <input class="related-label" placeholder="Label" value="${escapeHtml(label)}" />
          <input class="related-url" type="url" placeholder="URL" value="${escapeHtml(url)}" />
          <button type="button" class="btn btn-outline btn-sm related-link-remove">Remove</button>
        `;
        div.querySelector('.related-link-remove').addEventListener('click', () => div.remove());
        rowsContainer.appendChild(div);
      }

      function collectLinks() {
        return [...rowsContainer.querySelectorAll('.related-link-row')]
          .map((row) => ({
            label: (row.querySelector('.related-label')?.value || '').trim(),
            url: (row.querySelector('.related-url')?.value || '').trim(),
          }))
          .filter((x) => x.url);
      }

      addBtn?.addEventListener('click', () => addRow());
      contentEl.querySelectorAll('.related-link-remove').forEach((btn) => {
        btn.addEventListener('click', () => btn.closest('.related-link-row')?.remove());
      });

      if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
          const links = collectLinks();
          errorEl.hidden = true;
          errorEl.textContent = '';
          try {
            await updateRepoRelatedLinks(r.id, links);
            window.history.pushState({}, '', window.location.pathname);
            window.dispatchEvent(new PopStateEvent('popstate'));
          } catch (err) {
            errorEl.textContent = err.message;
            errorEl.hidden = false;
          }
        });
      }
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
