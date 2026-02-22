import { signup } from '../auth.js';

function escapeHtml(s) {
  if (s == null) return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

export function renderSignup() {
  const section = document.createElement('div');
  section.className = 'auth-page';
  section.innerHTML = `
    <h1>Create your account</h1>
    <form class="auth-form" id="signup-form">
      <div class="field">
        <label for="signup-email">Email</label>
        <input id="signup-email" name="email" type="email" required autocomplete="email" />
      </div>
      <div class="field">
        <label for="signup-name">Name (optional)</label>
        <input id="signup-name" name="name" type="text" autocomplete="name" />
      </div>
      <div class="field">
        <label for="signup-password">Password</label>
        <input id="signup-password" name="password" type="password" required minlength="8" autocomplete="new-password" />
      </div>
      <div class="field">
        <label for="signup-confirm">Confirm password</label>
        <input id="signup-confirm" name="confirm" type="password" required minlength="8" autocomplete="new-password" />
      </div>
      <div class="error" id="signup-error" role="alert" hidden></div>
      <div class="submit-wrap">
        <button type="submit" class="btn btn-primary">Sign up</button>
      </div>
    </form>
    <p class="footer-link">Already have an account? <a href="/signin" data-spa>Sign in</a></p>
  `;

  const form = section.querySelector('#signup-form');
  const errorEl = section.querySelector('#signup-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.hidden = true;
    errorEl.textContent = '';
    const email = form.email.value.trim();
    const name = form.name.value.trim();
    const password = form.password.value;
    const confirm = form.confirm.value;
    if (password !== confirm) {
      errorEl.textContent = 'Passwords do not match';
      errorEl.hidden = false;
      return;
    }
    try {
      await signup({ email, password, name });
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (err) {
      errorEl.textContent = err.message || 'Sign up failed';
      errorEl.hidden = false;
    }
  });

  return section;
}
