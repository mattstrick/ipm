import { getPackage, getPackageDetails, getRepo } from '../api.js';

function formatDownloads(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

function formatPublished(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

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

const NPM_PACKAGE_URL = 'https://www.npmjs.com/package';

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

      if (pkg.isRepo && pkg.owner && pkg.repo) {
        const r = await getRepo(pkg.owner, pkg.repo);
        if (!r) {
          contentEl.innerHTML = `
            <div class="empty-state">
              <p><strong>Repo not found</strong></p>
              <p>This repo isn't in your list, or you're not signed in.</p>
              <p><a href="/repos" data-spa>Your repos</a></p>
            </div>
          `;
          return;
        }
        const name = r.name || `${pkg.owner}/${pkg.repo}`;
        const relatedLinks = (r.relatedLinks && Array.isArray(r.relatedLinks)) ? r.relatedLinks : [];
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
              <div class="readme-content">${escapeHtml(r.readme).replace(/\n/g, '<br>')}</div>
              ` : ''}
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
        return;
      }

      const license = pkg.license || '—';
      const readmeHtml = `
        <h2>Install</h2>
        <pre><code>ipm install ${escapeHtml(pkg.name)}</code></pre>
        <h2>About</h2>
        <p>${escapeHtml(pkg.description || 'No description provided.')}</p>
        ${pkg.readme ? `<div class="readme-content">${escapeHtml(pkg.readme).replace(/\n/g, '<br>')}</div>` : ''}
      `;

      contentEl.innerHTML = `
        <div class="package-header">
          <div class="package-title">
            <h1>${escapeHtml(pkg.name)}</h1>
            <span class="package-badge">v${escapeHtml(pkg.version || '')}</span>
            <span class="package-badge">Public</span>
          </div>
          <p class="package-desc-main">${escapeHtml(pkg.description || 'No description.')}</p>
        </div>

        <nav class="package-tabs" id="package-tabs">
          <a href="#" class="tab-link active" data-tab="readme">Readme</a>
          <a href="#" class="tab-link" data-tab="dependencies">Dependencies</a>
          <a href="#" class="tab-link" data-tab="dependents">Dependents</a>
          <a href="#" class="tab-link" data-tab="versions">Versions</a>
        </nav>

        <div class="package-layout">
          <div class="package-readme" id="package-tab-content">
            ${readmeHtml}
          </div>
          <aside>
            <div class="sidebar-box">
              <h3>Install</h3>
              <div class="command">ipm install ${escapeHtml(pkg.name)}</div>
            </div>
            <div class="sidebar-box">
              <h3>Metadata</h3>
              <div class="meta-row"><strong>Version</strong> ${escapeHtml(pkg.version || '')}</div>
              <div class="meta-row"><strong>Published</strong> ${formatPublished(pkg.publishedAt)}</div>
              <div class="meta-row"><strong>Weekly downloads</strong> ${formatDownloads(pkg.weeklyDownloads || 0)}</div>
              <div class="meta-row"><strong>License</strong> ${escapeHtml(license)}</div>
              ${pkg.repositoryUrl ? `<div class="meta-row"><strong>Repository</strong> <a href="${escapeHtml(pkg.repositoryUrl)}" target="_blank" rel="noopener">Link</a></div>` : ''}
              ${pkg.homepage ? `<div class="meta-row"><strong>Homepage</strong> <a href="${escapeHtml(pkg.homepage)}" target="_blank" rel="noopener">Link</a></div>` : ''}
            </div>
          </aside>
        </div>
      `;

      const tabContent = contentEl.querySelector('#package-tab-content');
      const tabs = contentEl.querySelector('#package-tabs');

      let detailsCache = null;
      async function getDetails() {
        if (detailsCache) return detailsCache;
        detailsCache = await getPackageDetails(pkg.name);
        return detailsCache;
      }

      function setActiveTab(tab) {
        contentEl.querySelectorAll('.tab-link').forEach((a) => a.classList.toggle('active', a.dataset.tab === tab));
      }

      tabs.addEventListener('click', async (e) => {
        const link = e.target.closest('.tab-link');
        if (!link) return;
        e.preventDefault();
        const tab = link.dataset.tab;
        setActiveTab(tab);

        if (tab === 'readme') {
          tabContent.innerHTML = readmeHtml;
          return;
        }

        if (tab === 'dependents') {
          tabContent.innerHTML = `
            <h2>Dependents</h2>
            <p>Packages that depend on <strong>${escapeHtml(pkg.name)}</strong> are listed on the npm website.</p>
            <p><a href="${escapeHtml(NPM_PACKAGE_URL + '/' + pkg.name)}?activeTab=dependents" target="_blank" rel="noopener" class="btn btn-primary">View dependents on npm</a></p>
          `;
          return;
        }

        if (tab === 'dependencies') {
          tabContent.innerHTML = '<div class="empty-state">Loading…</div>';
          try {
            const details = await getDetails();
            const deps = details.dependencies || [];
            const devDeps = details.devDependencies || [];
            const depList = deps.length
              ? `<ul class="package-deps-list">${deps.map((d) => `<li><a href="/package/${encodeURIComponent(d.name)}" data-spa>${escapeHtml(d.name)}</a><span class="dep-version">${escapeHtml(d.version)}</span></li>`).join('')}</ul>`
              : '<p>No dependencies.</p>';
            const devList = devDeps.length
              ? `<ul class="package-deps-list">${devDeps.map((d) => `<li><a href="/package/${encodeURIComponent(d.name)}" data-spa>${escapeHtml(d.name)}</a><span class="dep-version">${escapeHtml(d.version)}</span></li>`).join('')}</ul>`
              : '<p>None.</p>';
            tabContent.innerHTML = `
              <h2>Dependencies</h2>
              ${deps.length ? depList : '<p>No dependencies.</p>'}
              ${devDeps.length ? '<h3>Dev dependencies</h3>' + devList : ''}
            `;
          } catch (err) {
            tabContent.innerHTML = `<div class="empty-state"><p>Failed to load dependencies: ${escapeHtml(err.message)}</p></div>`;
          }
          return;
        }

        if (tab === 'versions') {
          tabContent.innerHTML = '<div class="empty-state">Loading…</div>';
          try {
            const details = await getDetails();
            const versions = details.versions || [];
            const list = versions.length
              ? `<ul class="package-versions-list">${versions.map((v) => `<li><code>${escapeHtml(v)}</code></li>`).join('')}</ul>`
              : '<p>No version data.</p>';
            tabContent.innerHTML = `<h2>Versions</h2><p>${versions.length} version(s)</p>${list}`;
          } catch (err) {
            tabContent.innerHTML = `<div class="empty-state"><p>Failed to load versions: ${escapeHtml(err.message)}</p></div>`;
          }
        }
      });
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
