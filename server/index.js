import express from 'express';
import { getDb, searchPackages, getPackageByName, upsertPackage } from './db.js';
import { searchNpm, getPackageFromNpm } from './npm.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.get('/api/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const db = getDb();
    let results = searchPackages(db, q);

    // If no DB results and user searched, fetch from npm and cache
    if (results.length === 0 && q) {
      const fromNpm = await searchNpm(q, 25);
      for (const pkg of fromNpm) {
        upsertPackage(db, pkg);
      }
      results = searchPackages(db, q);
    }

    // If still empty (e.g. no query), seed a few from npm
    if (results.length === 0) {
      const seed = await searchNpm('react', 10);
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

app.get('/api/package/:name', async (req, res) => {
  try {
    const name = req.params.name;
    const db = getDb();
    let pkg = getPackageByName(db, name);

    if (!pkg) {
      const fromNpm = await getPackageFromNpm(name);
      if (!fromNpm) {
        return res.status(404).json({ error: 'Package not found' });
      }
      upsertPackage(db, fromNpm);
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
