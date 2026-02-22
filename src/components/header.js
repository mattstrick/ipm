export function renderHeader() {
  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `
    <a href="/" class="header-logo" data-spa>ipm</a>
    <div class="header-search">
      <span class="search-icon" aria-hidden="true">⌕</span>
      <form action="/search" method="get" id="header-search-form">
        <input
          type="search"
          name="q"
          placeholder="Search packages"
          aria-label="Search packages"
          autocomplete="off"
        />
      </form>
    </div>
    <div class="header-actions">
      <a href="/search" class="btn btn-outline" data-spa>Sign Up</a>
      <a href="/search" class="btn btn-primary" data-spa>Sign In</a>
    </div>
  `;

  const form = header.querySelector('#header-search-form');
  const input = header.querySelector('input[name="q"]');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = input?.value?.trim();
      const url = q ? `/search?q=${encodeURIComponent(q)}` : '/search';
      window.history.pushState({}, '', url);
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
  }

  return header;
}
