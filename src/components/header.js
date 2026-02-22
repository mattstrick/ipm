import { getCurrentUser, signout } from '../auth.js';

export function renderHeader() {
  const user = getCurrentUser();
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
    <div class="header-actions" id="header-actions">
      ${user
        ? `
        <span class="header-user">${escapeHtml(user.name || user.email)}</span>
        <button type="button" class="btn btn-outline" id="header-signout">Sign out</button>
      `
        : `
        <a href="/signup" class="btn btn-outline" data-spa>Sign Up</a>
        <a href="/signin" class="btn btn-primary" data-spa>Sign In</a>
      `}
    </div>
  `;

  const signOutBtn = header.querySelector('#header-signout');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
      await signout();
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
  }

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

function escapeHtml(s) {
  if (s == null) return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}
