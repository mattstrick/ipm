export function renderFooter() {
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `
    <p>
      <strong>ipm</strong> — You're building amazing things.
    </p>
    <p>
      <a href="/support" data-spa>Support</a> · <a href="/docs" data-spa>Documentation</a> · <a href="/status" data-spa>Status</a>
    </p>
  `;
  return footer;
}
