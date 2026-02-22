export function renderHome() {
  const section = document.createElement('div');
  section.innerHTML = `
    <section class="hero">
      <h1>Write Once and Read in Anything</h1>
      <p class="subtitle">
        <span aria-hidden="true">🚧</span> ipm makes interoperability between computer languages possible. One format, every runtime—build in one language, consume in any other.
      </p>
      <div class="hero-cta">
        <a href="/signup" class="btn btn-primary" data-spa>Sign up for free</a>
      </div>
    </section>

    <section class="section">
      <h2>Interoperability across languages</h2>
      <p>
        ipm bridges the gap between ecosystems. Publish a package once and let developers use it from JavaScript, Python, Rust, Go, or whatever they're building with—no lock-in, no duplication.
      </p>
    </section>

    <section class="section">
      <h2>One registry, every language</h2>
      <p>
        The ipm registry is built for cross-language sharing. Write once, read in anything: share code and data across your stack and with the rest of the world.
      </p>
    </section>
  `;
  section.querySelectorAll('.btn-outline').forEach((btn) => {
    btn.style.background = 'transparent';
    btn.style.color = 'var(--ipm-red)';
    btn.style.borderColor = 'var(--ipm-red)';
  });
  return section;
}
