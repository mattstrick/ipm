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
  getLanguages,
} from './db.js';
import { getRelatedLinksForRepo, getReposFromConversions, packageNameFromRepoFullName } from './repo-conversions.js';
import { searchRegistry, getPackageFromRegistry, getPackageDetailsFromRegistry } from './registry.js';
import { parseRepoUrl, fetchRepoMetadata, fetchRepoReadme } from './github.js';
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

app.get('/api/languages', (req, res) => {
  try {
    const db = getDb();
    res.json(getLanguages(db));
  } catch (err) {
    console.error('Languages error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/search', (req, res) => {
  try {
    const q = (req.query.q || '').trim().toLowerCase();
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
          relatedLinks: getRelatedLinksForRepo(r.name),
        });
      }
    } else {
      const repoNames = getReposFromConversions();
      const filtered = q
        ? repoNames.filter((name) => {
            const nameLower = name.toLowerCase();
            const pkgLower = packageNameFromRepoFullName(name).toLowerCase();
            return nameLower.includes(q) || pkgLower.includes(q);
          })
        : repoNames;
      for (const name of filtered.slice(0, 25)) {
        const [owner, repo] = name.split('/');
        results.push({
          name,
          description: '',
          version: null,
          weeklyDownloads: null,
          source: 'public',
          repoUrl: `https://github.com/${owner}/${repo}`,
          id: null,
          relatedLinks: getRelatedLinksForRepo(name),
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

app.post('/api/repos/add-from-conversions', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not signed in' });
  try {
    const repoNames = getReposFromConversions();
    const db = getDb();
    const added = [];
    const skipped = [];
    const errors = [];
    for (const name of repoNames) {
      const parsed = parseRepoUrl(name);
      if (!parsed) {
        errors.push({ name, error: 'Invalid owner/repo format' });
        continue;
      }
      if (getUserRepoByName(db, req.user.id, name)) {
        skipped.push(name);
        continue;
      }
      let meta;
      try {
        meta = await fetchRepoMetadata(parsed.owner, parsed.repo);
      } catch (err) {
        errors.push({ name, error: err.message || 'GitHub fetch failed' });
        continue;
      }
      if (!meta) {
        errors.push({ name, error: 'Repo not found' });
        continue;
      }
      const id = addUserRepo(db, {
        userId: req.user.id,
        repoUrl: meta.repoUrl,
        name: meta.name,
        description: meta.description,
      });
      const repos = getUserRepos(db, req.user.id);
      const row = repos.find((r) => r.id === id);
      added.push(row || { id, name: meta.name, repoUrl: meta.repoUrl, description: meta.description });
    }
    res.json({ added, skipped, errors });
  } catch (err) {
    console.error('Add from conversions error:', err);
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

app.get('/api/repo/:owner/:repo', async (req, res) => {
  try {
    const name = `${req.params.owner}/${req.params.repo}`;
    const db = getDb();

    if (req.user) {
      const row = getUserRepoByName(db, req.user.id, name);
      if (row) {
        let readme = null;
        try {
          readme = await fetchRepoReadme(req.params.owner, req.params.repo);
        } catch {
          // leave readme null on fetch error
        }
        const repo = { ...row, relatedLinks: getRelatedLinksForRepo(name), readme };
        return res.json(repo);
      }
    }

    const conversionsRepos = getReposFromConversions();
    if (conversionsRepos.includes(name)) {
      let meta;
      try {
        meta = await fetchRepoMetadata(req.params.owner, req.params.repo);
      } catch (err) {
        return res.status(404).json({ error: err.message || 'Repo not found' });
      }
      if (!meta) return res.status(404).json({ error: 'Repo not found' });
      let readme = null;
      try {
        readme = await fetchRepoReadme(req.params.owner, req.params.repo);
      } catch {
        // leave readme null
      }
      const repo = {
        name: meta.name,
        repoUrl: meta.repoUrl,
        description: meta.description,
        addedAt: null,
        relatedLinks: getRelatedLinksForRepo(name),
        readme,
      };
      return res.json(repo);
    }

    if (!req.user) return res.status(401).json({ error: 'Not signed in' });
    return res.status(404).json({ error: 'Repo not found in your list' });
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
        // Resolve by repo: package name = repo name minus everything after last hyphen.
        // Prefer a repo that has related links (is in repo-conversions) so the language list shows.
        if (req.user) {
          const repos = getUserRepos(db, req.user.id);
          const candidates = repos.filter((r) => packageNameFromRepoFullName(r.name) === name);
          if (candidates.length > 0) {
            const conversionsRepos = getReposFromConversions();
            const match =
              candidates.find((r) => conversionsRepos.includes(r.name)) || candidates[0];
            const [owner, repo] = match.name.split('/');
            return res.json({ isRepo: true, owner, repo });
          }
        }
        const conversionsRepos = getReposFromConversions();
        const publicMatch = conversionsRepos.find(
          (fullName) => packageNameFromRepoFullName(fullName) === name
        );
        if (publicMatch) {
          const [owner, repo] = publicMatch.split('/');
          return res.json({ isRepo: true, owner, repo });
        }
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
