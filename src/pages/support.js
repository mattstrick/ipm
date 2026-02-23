export function renderSupport() {
  const section = document.createElement('div');
  section.className = 'support-page';
  section.innerHTML = `
    <h1>Support</h1>

    <section class="section">
      <h2>Get help</h2>
      <p>For questions, bug reports, or feature requests, open an issue on GitHub:</p>
      <ul>
        <li><a href="https://github.com/mattstrick/ipm-cli/issues" target="_blank" rel="noopener">ipm CLI</a> — CLI installation and usage</li>
      </ul>
    </section>

    <section class="section">
      <h2>Documentation</h2>
      <p><a href="/docs" data-spa>View the documentation</a> for setup, package.json config, and the registry API.</p>
    </section>
  `;
  return section;
}
