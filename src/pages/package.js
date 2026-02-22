import { getPackage } from '../api.js';

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

export function renderPackage(params) {
  const section = document.createElement('div');
  section.innerHTML = `
    <div id="package-content" class="package-content">
      <div class="empty-state">Loading…</div>
    </div>
  `;

  const contentEl = section.querySelector('#package-content');

  (async () => {
    try {
      const pkg = await getPackage(params.name);

      if (!pkg) {
        contentEl.innerHTML = `
          <div class="empty-state">
            <p><strong>Package not found</strong></p>
            <p>There is no package named "${escapeHtml(params.name)}".</p>
            <p><a href="/search" data-spa>Browse packages</a></p>
          </div>
        `;
        return;
      }

      const license = pkg.license || '—';
      contentEl.innerHTML = `
        <div class="package-header">
          <div class="package-title">
            <h1>${escapeHtml(pkg.name)}</h1>
            <span class="package-badge">v${escapeHtml(pkg.version || '')}</span>
            <span class="package-badge">Public</span>
          </div>
          <p class="package-desc-main">${escapeHtml(pkg.description || 'No description.')}</p>
        </div>

        <nav class="package-tabs">
          <a href="#" class="active">Readme</a>
          <a href="#">Dependencies</a>
          <a href="#">Dependents</a>
          <a href="#">Versions</a>
        </nav>

        <div class="package-layout">
          <div class="package-readme">
            <h2>Install</h2>
            <pre><code>ipm install ${escapeHtml(pkg.name)}</code></pre>
            <h2>About</h2>
            <p>${escapeHtml(pkg.description || 'No description provided.')}</p>
            ${pkg.readme ? `<div class="readme-content">${escapeHtml(pkg.readme).replace(/\n/g, '<br>')}</div>` : ''}
          </div>
          <aside>
            <div class="sidebar-box">
              <h3>Install</h3>
              <div class="command">ipm install ${escapeHtml(pkg.name)}</div>
            </div>
            <div class="sidebar-box">
              <h3>Metadata</h3>
              <div class="meta-row"><strong>Version</strong> ${escapeHtml(pkg.version || '')}</div>
              <div class="meta-row"><strong>Weekly downloads</strong> ${formatDownloads(pkg.weeklyDownloads || 0)}</div>
              <div class="meta-row"><strong>License</strong> ${escapeHtml(license)}</div>
              ${pkg.repositoryUrl ? `<div class="meta-row"><strong>Repository</strong> <a href="${escapeHtml(pkg.repositoryUrl)}" target="_blank" rel="noopener">Link</a></div>` : ''}
              ${pkg.homepage ? `<div class="meta-row"><strong>Homepage</strong> <a href="${escapeHtml(pkg.homepage)}" target="_blank" rel="noopener">Link</a></div>` : ''}
            </div>
          </aside>
        </div>
      `;
    } catch (err) {
      contentEl.innerHTML = `
        <div class="empty-state">
          <p><strong>Failed to load package</strong></p>
          <p>Make sure the API server is running: <code>npm run server</code> from the project root</p>
          <p>${escapeHtml(err.message)}</p>
        </div>
      `;
    }
  })();

  return section;
}
