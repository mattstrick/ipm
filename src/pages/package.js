import { getPackage } from '../data/packages.js';

function formatDownloads(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

export function renderPackage(params) {
  const pkg = getPackage(params.name);

  if (!pkg) {
    const notFound = document.createElement('div');
    notFound.className = 'empty-state';
    notFound.innerHTML = `
      <p><strong>Package not found</strong></p>
      <p>There is no package named "${params.name}".</p>
      <p><a href="/search" data-spa>Browse packages</a></p>
    `;
    return notFound;
  }

  const section = document.createElement('div');
  section.innerHTML = `
    <div class="package-header">
      <div class="package-title">
        <h1>${pkg.name}</h1>
        <span class="package-badge">v${pkg.version}</span>
        <span class="package-badge">Public</span>
      </div>
      <p class="package-desc-main">${pkg.description || 'No description.'}</p>
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
        <pre><code>npm install ${pkg.name}</code></pre>
        <h2>About</h2>
        <p>${pkg.description || 'No description provided.'}</p>
        <p>This is a mock package page for the ipm (npm clone) demo.</p>
      </div>
      <aside>
        <div class="sidebar-box">
          <h3>Install</h3>
          <div class="command">npm install ${pkg.name}</div>
        </div>
        <div class="sidebar-box">
          <h3>Metadata</h3>
          <div class="meta-row"><strong>Version</strong> ${pkg.version}</div>
          <div class="meta-row"><strong>Weekly downloads</strong> ${formatDownloads(pkg.weeklyDownloads)}</div>
          <div class="meta-row"><strong>License</strong> MIT</div>
        </div>
      </aside>
    </div>
  `;

  return section;
}
