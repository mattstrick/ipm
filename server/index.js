import express from 'express';
import cookieParser from 'cookie-parser';
import { getDb, searchPackages, getPackageByName, upsertPackage, createUser, getUserByEmail, getUserById } from './db.js';
import { searchRegistry, getPackageFromRegistry } from './registry.js';
import {
  hashPassword,
  verifyPassword,
  createToken,
  setAuthCookie,
  clearAuthCookie,
  authMiddleware,
} from './auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cookieParser());
app.use(authMiddleware);

app.get('/api/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const db = getDb();
    let results = searchPackages(db, q);

    // If no DB results and user searched, fetch from upstream registry and cache
    if (results.length === 0 && q) {
      const fromRegistry = await searchRegistry(q, 25);
      for (const pkg of fromRegistry) {
        upsertPackage(db, pkg);
      }
      results = searchPackages(db, q);
    }

    // If still empty (e.g. no query), seed a few from registry
    if (results.length === 0) {
      const seed = await searchRegistry('react', 10);
      for (const pkg of seed) {
        upsertPackage(db, pkg);
      }
      results = searchPackages(db, q);
    }

    res.json(results);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/me', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not signed in' });
  res.json(req.user);
});

app.post('/api/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const emailStr = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    const db = getDb();
    if (getUserByEmail(db, emailStr)) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    const passwordHash = await hashPassword(String(password));
    const userId = createUser(db, { email: emailStr, passwordHash, name });
    const user = getUserById(db, userId);
    const token = createToken(userId);
    setAuthCookie(res, token);
    res.status(201).json({ user });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/signin', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const db = getDb();
    const record = getUserByEmail(db, String(email).trim());
    if (!record || !(await verifyPassword(String(password), record.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const user = getUserById(db, record.id);
    const token = createToken(record.id);
    setAuthCookie(res, token);
    res.json({ user });
  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/signout', (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

app.get('/api/package/:name', async (req, res) => {
  try {
    const name = req.params.name;
    const db = getDb();
    let pkg = getPackageByName(db, name);

    if (!pkg) {
      const fromRegistry = await getPackageFromRegistry(name);
      if (!fromRegistry) {
        return res.status(404).json({ error: 'Package not found' });
      }
      upsertPackage(db, fromRegistry);
      pkg = getPackageByName(db, name);
    }

    res.json(pkg);
  } catch (err) {
    console.error('Package fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`ipm API running at http://localhost:${PORT}`);
});
