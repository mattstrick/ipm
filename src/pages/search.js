import { searchPackages } from '../api.js';

function formatDownloads(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

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
            placeholder="Search packages"
            value="${escapeHtml(q)}"
            aria-label="Search packages"
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
        resultsEl.innerHTML = `
          <div class="empty-state">
            <p><strong>No packages found</strong></p>
            <p>Try a different search term or browse the homepage.</p>
          </div>
        `;
      } else {
        resultsEl.innerHTML = `
          <ul class="package-list">
            ${results
              .map(
                (p) => `
              <li class="package-item">
                <a href="/package/${encodeURIComponent(p.name)}" class="package-name" data-spa>${escapeHtml(p.name)}</a>
                <span class="package-meta">${escapeHtml(p.version || '')} · ${formatDownloads(p.weeklyDownloads || 0)} weekly downloads</span>
                <p class="package-desc">${escapeHtml(p.description || '')}</p>
              </li>
            `
              )
              .join('')}
          </ul>
        `;
      }
    } catch (err) {
      resultsEl.innerHTML = `
        <div class="empty-state">
          <p><strong>Search failed</strong></p>
          <p>Make sure the API server is running: <code>npm run server</code></p>
          <p>${escapeHtml(err.message)}</p>
        </div>
      `;
    }
  })();

  return section;
}
