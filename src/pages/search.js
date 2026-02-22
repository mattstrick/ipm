import { searchPackages, packageNameFromRepoFullName } from '../api.js';
import { getCurrentUser } from '../auth.js';

function escapeHtml(s) {
  if (s == null) return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

export function renderSearch(params) {
  const q = new URLSearchParams(window.location.search).get('q') || '';
  const section = document.createElement('div');
  section.innerHTML = `
    <div class="search-bar-large">
      <div class="wrap">
        <span class="search-icon" aria-hidden="true">⌕</span>
        <form action="/search" method="get" id="search-form">
          <input
            type="search"
            name="q"
            placeholder="Search repos"
            value="${escapeHtml(q)}"
            aria-label="Search repos"
            autocomplete="off"
          />
        </form>
      </div>
    </div>
    <div id="search-results" class="search-results">
      <div class="empty-state">Loading…</div>
    </div>
  `;

  const form = section.querySelector('#search-form');
  const input = section.querySelector('input[name="q"]');
  const resultsEl = section.querySelector('#search-results');

  if (form && input) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = input.value.trim();
      const url = val ? `/search?q=${encodeURIComponent(val)}` : '/search';
      window.history.pushState({}, '', url);
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
  }

  (async () => {
    try {
      const results = await searchPackages(q);
      if (results.length === 0) {
        const user = getCurrentUser();
        resultsEl.innerHTML = `
          <div class="empty-state">
            <p><strong>No repos found</strong></p>
            <p>${user ? 'Try a different search or <a href="/repos" data-spa>add more repos</a>.' : 'Try a different search, or <a href="/signin" data-spa>sign in</a> to search your own repos.'}</p>
          </div>
        `;
      } else {
        resultsEl.innerHTML = `
          <ul class="package-list">
            ${results
              .map((p) => {
                const packageName = packageNameFromRepoFullName(p.name);
                const href = packageName ? `/package/${encodeURIComponent(packageName)}` : '#';
                const relatedLinks = p.relatedLinks && Array.isArray(p.relatedLinks) ? p.relatedLinks : [];
                const relatedLinksHtml =
                  relatedLinks.length > 0
                    ? `<p class="search-related-links">${relatedLinks.map((l) => `<a href="${escapeHtml(l.url)}" target="_blank" rel="noopener" class="search-related-link">${escapeHtml(l.label || 'Link')}</a>`).join(' · ')}</p>`
                    : '';
                const metaLabel = p.source === 'public' ? 'Repo' : 'Your repo';
                return `
              <li class="package-item">
                <a href="${href}" class="package-name" data-spa>${escapeHtml(p.name)}</a>
                <span class="package-meta">${escapeHtml(metaLabel)}</span>
                <p class="package-desc">${escapeHtml(p.description || '')}</p>
                ${relatedLinksHtml}
              </li>
            `;
              })
              .join('')}
          </ul>
        `;
      }
    } catch (err) {
      resultsEl.innerHTML = `
        <div class="empty-state">
          <p><strong>Search failed</strong></p>
          <p>Make sure the API server is running: <code>npm run server</code> from the project root</p>
          <p>${escapeHtml(err.message)}</p>
        </div>
      `;
    }
  })();

  return section;
}
