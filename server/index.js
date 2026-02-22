import express from 'express';
import cookieParser from 'cookie-parser';
import {
  getDb,
  searchPackages,
  getPackageByName,
  upsertPackage,
  createUser,
  getUserByEmail,
  getUserById,
  searchUserRepos,
  getUserRepos,
  addUserRepo,
  deleteUserRepo,
  getUserRepoById,
  getUserRepoByName,
  updateUserRepoRelatedLinks,
  parseRelatedLinks,
} from './db.js';
import { searchRegistry, getPackageFromRegistry, getPackageDetailsFromRegistry } from './registry.js';
import { parseRepoUrl, fetchRepoMetadata } from './github.js';
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

app.get('/api/search', (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const db = getDb();
    const results = [];

    if (req.user) {
      const fromRepos = searchUserRepos(db, req.user.id, q, 25);
      for (const r of fromRepos) {
        results.push({
          name: r.name,
          description: r.description || '',
          version: null,
          weeklyDownloads: null,
          source: 'repo',
          repoUrl: r.repoUrl,
          id: r.id,
          relatedLinks: parseRelatedLinks(r),
        });
      }
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

app.get('/api/repos', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not signed in' });
  try {
    const db = getDb();
    const repos = getUserRepos(db, req.user.id);
    res.json(repos);
  } catch (err) {
    console.error('List repos error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/repos', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not signed in' });
  try {
    const { url } = req.body || {};
    const input = (url || req.body?.repoUrl || '').trim();
    if (!input) return res.status(400).json({ error: 'Repository URL or owner/repo is required' });
    const parsed = parseRepoUrl(input);
    if (!parsed) return res.status(400).json({ error: 'Invalid GitHub URL or owner/repo' });
    let meta;
    try {
      meta = await fetchRepoMetadata(parsed.owner, parsed.repo);
    } catch (err) {
      return res.status(400).json({ error: err.message || 'Could not fetch repo from GitHub' });
    }
    if (!meta) return res.status(400).json({ error: 'Repository not found. Check the URL or owner/repo—if the repo is private, we can\'t access it.' });
    const db = getDb();
    const existing = getUserRepoByName(db, req.user.id, meta.name);
    if (existing) return res.status(409).json({ error: 'You already added this repo' });
    const id = addUserRepo(db, {
      userId: req.user.id,
      repoUrl: meta.repoUrl,
      name: meta.name,
      description: meta.description,
    });
    const repos = getUserRepos(db, req.user.id);
    const added = repos.find((r) => r.id === id);
    res.status(201).json(added || { id, repoUrl: meta.repoUrl, name: meta.name, description: meta.description });
  } catch (err) {
    console.error('Add repo error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/repos/:id', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not signed in' });
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });
    const db = getDb();
    deleteUserRepo(db, id, req.user.id);
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete repo error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/repos/:id', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not signed in' });
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });
    const { relatedLinks } = req.body || {};
    const links = Array.isArray(relatedLinks)
      ? relatedLinks
          .filter((x) => x && (x.url || '').trim())
          .map((x) => ({ label: (x.label || '').trim() || 'Related', url: String(x.url).trim() }))
      : [];
    const db = getDb();
    updateUserRepoRelatedLinks(db, id, req.user.id, links);
    const row = getUserRepoById(db, id, req.user.id);
    const repo = row ? { ...row, relatedLinks: parseRelatedLinks(row) } : null;
    res.json(repo || { ok: true });
  } catch (err) {
    console.error('Update repo error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/repo/:owner/:repo', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not signed in' });
  try {
    const name = `${req.params.owner}/${req.params.repo}`;
    const db = getDb();
    const row = getUserRepoByName(db, req.user.id, name);
    if (!row) return res.status(404).json({ error: 'Repo not found in your list' });
    const repo = { ...row, relatedLinks: parseRelatedLinks(row) };
    res.json(repo);
  } catch (err) {
    console.error('Get repo error:', err);
    res.status(500).json({ error: err.message });
  }
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

app.get('/api/package/:name/details', async (req, res) => {
  try {
    const name = req.params.name;
    const details = await getPackageDetailsFromRegistry(name);
    if (!details) return res.status(404).json({ error: 'Package not found' });
    res.json(details);
  } catch (err) {
    console.error('Package details error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`ipm API running at http://localhost:${PORT}`);
});
