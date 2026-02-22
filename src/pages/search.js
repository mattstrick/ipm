import { findPackages } from '../data/packages.js';

function formatDownloads(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

export function renderSearch(params) {
  const q = new URLSearchParams(window.location.search).get('q') || '';
  const results = findPackages(q);

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
            value="${q.replace(/"/g, '&quot;')}"
            aria-label="Search packages"
            autocomplete="off"
          />
        </form>
      </div>
    </div>

    ${results.length === 0 ? `
      <div class="empty-state">
        <p><strong>No packages found</strong></p>
        <p>Try a different search term or browse the homepage.</p>
      </div>
    ` : `
      <ul class="package-list">
        ${results
          .map(
            (p) => `
          <li class="package-item">
            <a href="/package/${encodeURIComponent(p.name)}" class="package-name" data-spa>${p.name}</a>
            <span class="package-meta">${p.version} · ${formatDownloads(p.weeklyDownloads)} weekly downloads</span>
            <p class="package-desc">${p.description || ''}</p>
          </li>
        `
          )
          .join('')}
      </ul>
    `}
  `;

  const form = section.querySelector('#search-form');
  const input = section.querySelector('input[name="q"]');
  if (form && input) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = input.value.trim();
      window.location.href = val ? `/search?q=${encodeURIComponent(val)}` : '/search';
    });
  }

  return section;
}
