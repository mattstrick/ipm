export function renderHome() {
  const section = document.createElement('div');
  section.innerHTML = `
    <section class="hero">
      <h1>Build amazing things</h1>
      <p class="subtitle">
        We're the company behind the npm Registry and npm CLI. We offer those to the community for free,
        but our day job is building useful tools for developers like you.
      </p>
      <div class="hero-cta">
        <a href="/search" class="btn btn-primary" data-spa>Sign up for free</a>
        <a href="/search" class="btn btn-outline" data-spa>Learn about Pro</a>
      </div>
    </section>

    <section class="section">
      <h2>Take your JavaScript development up a notch</h2>
      <p>
        Get started today for free, or step up to npm Pro to enjoy a premium JavaScript development experience,
        with features like private packages.
      </p>
    </section>

    <section class="section">
      <h2>Bring the best of open source to you</h2>
      <p>
        Relied upon by millions of developers worldwide, the npm Registry has become the center of JavaScript
        code sharing, and with more than two million packages, the largest software registry in the world.
      </p>
    </section>
  `;
  section.querySelectorAll('.btn-outline').forEach((btn) => {
    btn.style.background = 'transparent';
    btn.style.color = 'var(--npm-red)';
    btn.style.borderColor = 'var(--npm-red)';
  });
  return section;
}
