import { refreshAuth } from './auth.js';
import { renderHeader } from './components/header.js';
import { renderFooter } from './components/footer.js';
import { renderHome } from './pages/home.js';
import { renderSearch } from './pages/search.js';
import { renderPackage } from './pages/package.js';
import { renderSignup } from './pages/signup.js';
import { renderSignin } from './pages/signin.js';
import { renderRepos } from './pages/repos.js';
import { renderRepo } from './pages/repo.js';

const routes = [
  { path: '/', render: renderHome },
  { path: '/search', render: renderSearch },
  { path: '/package/:name', render: renderPackage },
  { path: '/signup', render: renderSignup },
  { path: '/signin', render: renderSignin },
  { path: '/repos', render: renderRepos },
  { path: '/repo/:owner/:repo', render: renderRepo },
];

function getRoute() {
  let path = window.location.pathname;
  if (path.endsWith('/') && path.length > 1) path = path.slice(0, -1);
  if (path === '' || path === '/' || path === '/index.html') return { route: routes[0], params: {} };
  if (path === '/search') return { route: routes[1], params: {} };
  const pkgMatch = path.match(/^\/package\/(.+)$/);
  if (pkgMatch) return { route: routes[2], params: { name: decodeURIComponent(pkgMatch[1]) } };
  if (path === '/signup') return { route: routes[3], params: {} };
  if (path === '/signin') return { route: routes[4], params: {} };
  if (path === '/repos') return { route: routes[5], params: {} };
  const repoMatch = path.match(/^\/repo\/([^/]+)\/([^/]+)$/);
  if (repoMatch) return { route: routes[6], params: { owner: decodeURIComponent(repoMatch[1]), repo: decodeURIComponent(repoMatch[2]) } };
  return null;
}

function init() {
  const app = document.getElementById('app');
  const { route, params } = getRoute() || { route: routes[0], params: {} };

  app.innerHTML = '';
  app.appendChild(renderHeader());
  const main = document.createElement('main');
  main.className = 'main-content';
  main.appendChild(route.render(params));
  app.appendChild(main);
  app.appendChild(renderFooter());
}

async function boot() {
  await refreshAuth();
  init();
}

// Delegated SPA nav so links added after async content (e.g. search) work
document.getElementById('app').addEventListener('click', (e) => {
  const link = e.target.closest('a[data-spa]');
  if (!link || !link.href) return;
  const href = link.getAttribute('href');
  if (href && href.startsWith('/')) {
    e.preventDefault();
    window.history.pushState({}, '', href);
    init();
  }
});

window.addEventListener('popstate', init);
window.addEventListener('DOMContentLoaded', boot);
