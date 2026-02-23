export function renderDocs() {
  const section = document.createElement('div');
  section.className = 'docs-page';
  section.innerHTML = `
    <h1>Documentation</h1>

    <section class="section">
      <h2>Getting started</h2>
      <p>ipm is a package registry that supports multiple programming languages. Packages are monorepos with build targets for each language (e.g. <code>packages/javascript</code>, <code>packages/typescript</code>).</p>
    </section>

    <section class="section">
      <h2>Installing packages</h2>
      <p>With the <a href="https://github.com/mattstrick/ipm-cli" target="_blank" rel="noopener">ipm CLI</a> and this registry running:</p>
      <pre><code>ipm install &lt;package-name&gt;</code></pre>
      <p>Set <code>IPM_REGISTRY</code> or <code>REGISTRY</code> to point at this server (default: <code>http://localhost:3001/registry</code>).</p>
    </section>

    <section class="section">
      <h2>package.json ipm config</h2>
      <p>The ipm CLI reads optional <code>ipm</code> fields from <code>package.json</code> to choose language variants when installing.</p>
      <ul>
        <li><strong><code>ipm.language</code></strong> — Default language for all dependencies (e.g. <code>"typescript"</code>, <code>"python"</code>).</li>
        <li><strong><code>ipm.languages</code></strong> — Per-package overrides: <code>{ "package-name": "language" }</code>.</li>
      </ul>
      <p>Example:</p>
      <pre><code>{
  "name": "my-app",
  "dependencies": { "array-first": "^1.0.0" },
  "ipm": {
    "language": "typescript",
    "languages": { "array-first": "python" }
  }
}</code></pre>
      <p>Here <code>array-first</code> is resolved with <code>?language=python</code>; other dependencies use <code>typescript</code>.</p>
    </section>

    <section class="section">
      <h2>Registry API</h2>
      <p><code>GET /registry/:name</code> returns an npm-style packument for the ipm CLI. Use <code>?language=typescript</code> to select a build target. The packument includes <code>ipm.buildTarget</code> (the subpath) and a tarball for the whole repo.</p>
    </section>
  `;
  return section;
}
