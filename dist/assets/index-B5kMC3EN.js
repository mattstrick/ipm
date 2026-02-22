(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))s(t);new MutationObserver(t=>{for(const r of t)if(r.type==="childList")for(const n of r.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&s(n)}).observe(document,{childList:!0,subtree:!0});function o(t){const r={};return t.integrity&&(r.integrity=t.integrity),t.referrerPolicy&&(r.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?r.credentials="include":t.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(t){if(t.ep)return;t.ep=!0;const r=o(t);fetch(t.href,r)}})();function l(){const e=document.createElement("header");e.className="site-header",e.innerHTML=`
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
  `;const a=e.querySelector("#header-search-form"),o=e.querySelector('input[name="q"]');return a&&a.addEventListener("submit",s=>{var n;s.preventDefault();const t=(n=o==null?void 0:o.value)==null?void 0:n.trim(),r=t?`/search?q=${encodeURIComponent(t)}`:"/search";window.history.pushState({},"",r),window.dispatchEvent(new PopStateEvent("popstate"))}),e}function m(){const e=document.createElement("footer");return e.className="site-footer",e.innerHTML=`
    <p>
      <strong>ipm</strong> — a clone of npm. You're building amazing things.
    </p>
    <p>
      <a href="/" data-spa>Support</a> · <a href="/" data-spa>Documentation</a> · <a href="/" data-spa>Status</a>
    </p>
  `,e}function u(){const e=document.createElement("div");return e.innerHTML=`
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
  `,e.querySelectorAll(".btn-outline").forEach(a=>{a.style.background="transparent",a.style.color="var(--npm-red)",a.style.borderColor="var(--npm-red)"}),e}const c=[{name:"react",description:"React is a JavaScript library for building user interfaces.",version:"18.2.0",weeklyDownloads:25e6},{name:"lodash",description:"Lodash modular utilities.",version:"4.17.21",weeklyDownloads:52e6},{name:"express",description:"Fast, unopinionated, minimalist web framework for node.",version:"4.18.2",weeklyDownloads:28e6},{name:"vue",description:"Vue.js is a progressive, incrementally-adoptable JavaScript framework.",version:"3.4.0",weeklyDownloads:22e6},{name:"axios",description:"Promise based HTTP client for the browser and node.js",version:"1.6.2",weeklyDownloads:45e6},{name:"typescript",description:"TypeScript is a superset of JavaScript that compiles to clean JavaScript output.",version:"5.3.3",weeklyDownloads:38e6},{name:"webpack",description:"A bundler for javascript and friends.",version:"5.89.0",weeklyDownloads:15e6},{name:"next",description:"The React Framework for the Production.",version:"14.0.4",weeklyDownloads:6e6},{name:"jest",description:"Delightful JavaScript Testing.",version:"29.7.0",weeklyDownloads:22e6},{name:"eslint",description:"An AST-based pattern checker for JavaScript.",version:"8.55.0",weeklyDownloads:25e6}];function h(e=""){const a=e.trim().toLowerCase();return a?c.filter(o=>o.name.toLowerCase().includes(a)||o.description&&o.description.toLowerCase().includes(a)):c}function f(e){return c.find(a=>a.name.toLowerCase()===e.toLowerCase())||null}function g(e){return e>=1e6?(e/1e6).toFixed(1)+"M":e>=1e3?(e/1e3).toFixed(1)+"K":String(e)}function v(e){const a=new URLSearchParams(window.location.search).get("q")||"",o=h(a),s=document.createElement("div");s.innerHTML=`
    <div class="search-bar-large">
      <div class="wrap">
        <span class="search-icon" aria-hidden="true">⌕</span>
        <form action="/search" method="get" id="search-form">
          <input
            type="search"
            name="q"
            placeholder="Search packages"
            value="${a.replace(/"/g,"&quot;")}"
            aria-label="Search packages"
            autocomplete="off"
          />
        </form>
      </div>
    </div>

    ${o.length===0?`
      <div class="empty-state">
        <p><strong>No packages found</strong></p>
        <p>Try a different search term or browse the homepage.</p>
      </div>
    `:`
      <ul class="package-list">
        ${o.map(n=>`
          <li class="package-item">
            <a href="/package/${encodeURIComponent(n.name)}" class="package-name" data-spa>${n.name}</a>
            <span class="package-meta">${n.version} · ${g(n.weeklyDownloads)} weekly downloads</span>
            <p class="package-desc">${n.description||""}</p>
          </li>
        `).join("")}
      </ul>
    `}
  `;const t=s.querySelector("#search-form"),r=s.querySelector('input[name="q"]');return t&&r&&t.addEventListener("submit",n=>{n.preventDefault();const p=r.value.trim();window.location.href=p?`/search?q=${encodeURIComponent(p)}`:"/search"}),s}function w(e){return e>=1e6?(e/1e6).toFixed(1)+"M":e>=1e3?(e/1e3).toFixed(1)+"K":String(e)}function y(e){const a=f(e.name);if(!a){const s=document.createElement("div");return s.className="empty-state",s.innerHTML=`
      <p><strong>Package not found</strong></p>
      <p>There is no package named "${e.name}".</p>
      <p><a href="/search" data-spa>Browse packages</a></p>
    `,s}const o=document.createElement("div");return o.innerHTML=`
    <div class="package-header">
      <div class="package-title">
        <h1>${a.name}</h1>
        <span class="package-badge">v${a.version}</span>
        <span class="package-badge">Public</span>
      </div>
      <p class="package-desc-main">${a.description||"No description."}</p>
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
        <pre><code>npm install ${a.name}</code></pre>
        <h2>About</h2>
        <p>${a.description||"No description provided."}</p>
        <p>This is a mock package page for the ipm (npm clone) demo.</p>
      </div>
      <aside>
        <div class="sidebar-box">
          <h3>Install</h3>
          <div class="command">npm install ${a.name}</div>
        </div>
        <div class="sidebar-box">
          <h3>Metadata</h3>
          <div class="meta-row"><strong>Version</strong> ${a.version}</div>
          <div class="meta-row"><strong>Weekly downloads</strong> ${w(a.weeklyDownloads)}</div>
          <div class="meta-row"><strong>License</strong> MIT</div>
        </div>
      </aside>
    </div>
  `,o}const i=[{path:"/",render:u},{path:"/search",render:v},{path:"/package/:name",render:y}];function k(){let e=window.location.pathname;if(e.endsWith("/")&&e.length>1&&(e=e.slice(0,-1)),e===""||e==="/"||e==="/index.html")return{route:i[0],params:{}};if(e==="/search")return{route:i[1],params:{}};const a=e.match(/^\/package\/(.+)$/);return a?{route:i[2],params:{name:decodeURIComponent(a[1])}}:null}function d(){const e=document.getElementById("app"),{route:a,params:o}=k()||{route:i[0],params:{}};e.innerHTML="",e.appendChild(l());const s=document.createElement("main");s.className="main-content",s.appendChild(a.render(o)),e.appendChild(s),e.appendChild(m()),e.querySelectorAll("a[data-spa]").forEach(t=>{t.addEventListener("click",r=>{r.preventDefault();const n=t.getAttribute("href");n&&n.startsWith("/")&&(window.history.pushState({},"",n),d())})})}window.addEventListener("popstate",d);window.addEventListener("DOMContentLoaded",d);
