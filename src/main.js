import { renderHeader } from './components/header.js';
import { renderFooter } from './components/footer.js';
import { renderHome } from './pages/home.js';
import { renderSearch } from './pages/search.js';
import { renderPackage } from './pages/package.js';

const routes = [
  { path: '/', render: renderHome },
  { path: '/search', render: renderSearch },
  { path: '/package/:name', render: renderPackage },
];

function getRoute() {
  let path = window.location.pathname;
  if (path.endsWith('/') && path.length > 1) path = path.slice(0, -1);
  if (path === '' || path === '/' || path === '/index.html') return { route: routes[0], params: {} };
  if (path === '/search') return { route: routes[1], params: {} };
  const pkgMatch = path.match(/^\/package\/(.+)$/);
  if (pkgMatch) return { route: routes[2], params: { name: decodeURIComponent(pkgMatch[1]) } };
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

  // Client-side nav for link clicks
  app.querySelectorAll('a[data-spa]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');
      if (href && href.startsWith('/')) {
        window.history.pushState({}, '', href);
        init();
      }
    });
  });
}

window.addEventListener('popstate', init);
window.addEventListener('DOMContentLoaded', init);
