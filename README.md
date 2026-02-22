# ipm

A package registry UI — same look and feel as classic registry sites, with optional **real data** from a public JavaScript package registry stored in a local database.

## What’s included

- **Home** – Hero and marketing copy in ipm style
- **Search** – Search bar and package list (from API/database or upstream registry)
- **Package** – Package detail page with install command (`ipm install`), readme, and sidebar metadata

Design uses ipm’s red/black palette, header with search, and familiar layout.

## Run locally

### With real data (database + registry)

1. Install and start the **API server** (Express + SQLite). It fetches from the public registry and caches results in `data/packages.db`:

   ```bash
   npm install
   npm run server
   ```

   Keep this running (e.g. in one terminal). Default: [http://localhost:3001](http://localhost:3001). Use `PORT=3002 npm run server` if 3001 is in use.

2. In another terminal, start the frontend. Vite proxies `/api` to the server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173). Search and package pages will load real data; the first time you search or open a package, the server fetches from the registry and stores it in SQLite.

**One-command option:** from the project root run `npm run dev:all` to start both the server and Vite together (requires `concurrently`).

### Without the server (static only)

If you don’t run the API server, the search and package pages will show an error message asking you to run `npm run server`. The homepage and static shell still work.

## Database

- **Location:** `data/packages.db` (SQLite). Created automatically on first request.
- **Custom path:** set `IPM_DB_PATH` to a full path to the DB file.
- **Behavior:** Search and package-detail requests hit the upstream registry when data isn’t in the DB; results are cached so repeat requests are fast.

## Build

```bash
npm run build
npm run preview   # serve dist/
```

For production you’d run the API server separately and point the frontend at it (e.g. same host with a reverse proxy, or set the API base URL in the frontend).

## Tech

- **Frontend:** [Vite](https://vitejs.dev/), vanilla JS, no framework
- **Backend:** Express, [better-sqlite3](https://github.com/WiseLibs/better-sqlite3), public registry API
- **Data:** SQLite database; data is fetched from the public JavaScript package registry and cached

## License

MIT
