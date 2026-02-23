function escapeHtml(s) {
  if (s == null) return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

export function renderStatus() {
  const section = document.createElement('div');
  section.className = 'status-page';
  section.innerHTML = `
    <h1>Status</h1>
    <div id="status-content" class="section">
      <p>Checking…</p>
    </div>
  `;

  const contentEl = section.querySelector('#status-content');

  (async () => {
    try {
      const res = await fetch('/api/languages', { credentials: 'include' });
      if (res.ok) {
        contentEl.innerHTML = `
          <div class="status-ok">
            <p><strong>All systems operational</strong></p>
            <p>The registry API is responding normally.</p>
          </div>
        `;
      } else {
        contentEl.innerHTML = `
          <div class="status-degraded">
            <p><strong>Degraded</strong></p>
            <p>The registry API returned ${escapeHtml(res.status)}. Make sure the server is running: <code>npm run server</code></p>
          </div>
        `;
      }
    } catch (err) {
      contentEl.innerHTML = `
        <div class="status-outage">
          <p><strong>Service unavailable</strong></p>
          <p>Could not reach the registry API. Start the server with <code>npm run server</code> from the project root.</p>
          <p>${escapeHtml(err.message)}</p>
        </div>
      `;
    }
  })();

  return section;
}
