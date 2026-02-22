# ipm

A static clone of [npmjs.org](https://www.npmjs.com) — same look and feel, no backend. Built with vanilla JS and Vite.

## What’s included

- **Home** – Hero and marketing copy in npm style
- **Search** – Search bar and package list (mock data)
- **Package** – Package detail page with install command, readme area, and sidebar metadata

Design uses npm’s red/black palette, header with search, and familiar layout.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
npm run preview   # serve dist/
```

## Tech

- [Vite](https://vitejs.dev/) for dev server and build
- No framework; plain JS modules for routing and rendering
- Mock package list in `src/data/packages.js` (no real registry)

## License

MIT
