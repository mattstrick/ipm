const API = '/api';
let currentUser = null;

export function getCurrentUser() {
  return currentUser;
}

export async function refreshAuth() {
  try {
    const res = await fetch(`${API}/me`, { credentials: 'include' });
    if (res.ok) {
      currentUser = await res.json();
      return currentUser;
    }
  } catch {
    // ignore
  }
  currentUser = null;
  return null;
}

export async function signup({ email, password, name }) {
  const res = await fetch(`${API}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password, name }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Sign up failed');
  currentUser = data.user;
  return data.user;
}

export async function signin({ email, password }) {
  const res = await fetch(`${API}/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Sign in failed');
  currentUser = data.user;
  return data.user;
}

export async function signout() {
  await fetch(`${API}/signout`, { method: 'POST', credentials: 'include' });
  currentUser = null;
}
