# HeartLib Frontend

SPA for task list, music generation, lyrics transcription, playback and editing.

## Prerequisites

- Node.js and npm (or pnpm/yarn)
- Backend server running at `http://localhost:8000` (see `server/README.md`)

## Install and run (dev)

```bash
cd frontend
npm install
npm run dev
```

Frontend will be at `http://localhost:5173`. API requests to `/api` are proxied to `http://localhost:8000` (see `vite.config.ts`).

## Build for production

```bash
npm run build
```

Output is in `dist/`. Serve with any static host or mount under the backend (e.g. FastAPI static files).
