import { signin } from '../auth.js';

export function renderSignin() {
  const section = document.createElement('div');
  section.className = 'auth-page';
  section.innerHTML = `
    <h1>Sign in</h1>
    <form class="auth-form" id="signin-form">
      <div class="field">
        <label for="signin-email">Email</label>
        <input id="signin-email" name="email" type="email" required autocomplete="email" />
      </div>
      <div class="field">
        <label for="signin-password">Password</label>
        <input id="signin-password" name="password" type="password" required autocomplete="current-password" />
      </div>
      <div class="error" id="signin-error" role="alert" hidden></div>
      <div class="submit-wrap">
        <button type="submit" class="btn btn-primary">Sign in</button>
      </div>
    </form>
    <p class="footer-link">Don't have an account? <a href="/signup" data-spa>Sign up</a></p>
  `;

  const form = section.querySelector('#signin-form');
  const errorEl = section.querySelector('#signin-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.hidden = true;
    errorEl.textContent = '';
    const email = form.email.value.trim();
    const password = form.password.value;
    try {
      await signin({ email, password });
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (err) {
      errorEl.textContent = err.message || 'Sign in failed';
      errorEl.hidden = false;
    }
  });

  return section;
}
