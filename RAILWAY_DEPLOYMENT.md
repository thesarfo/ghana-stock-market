# Railway Deployment Guide

This guide explains how to deploy the Ghana Stock Exchange (GSE) app to [Railway](https://railway.app).

## Architecture

The app consists of:

1. **Backend** (Rust) - API server in `server/`
2. **Frontend** (React/Vite) - Static app in `presentation/`

For a full deployment, create **two Railway services** from this repository.

---

## Backend Deployment

### Option A: Default (single service from repo root)

When you deploy this repo without a Root Directory, Railway will:

1. Detect the root `Dockerfile` (builds the Rust backend)
2. Use the root `railway.json` for build config

No additional configuration needed for backend-only deployment.

### Option B: Monorepo with Root Directory

1. Create a new service in your Railway project
2. Connect this GitHub repository
3. Leave **Root Directory** empty (or `/`)
4. Railway will use the root `Dockerfile` and `railway.json`

### Backend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port (Railway sets automatically) | `3000` |
| `RUST_LOG` | Log level | `info` |
| `SCRAPE_INTERVAL` | Equity data scrape interval (seconds) | `3600` |
| `DATABASE_PATH` | Path to RocksDB database | `/app/data/gse.db` |

### Data Persistence (Recommended)

The backend stores data in RocksDB at `/app/data`. Add a **Railway Volume**:

1. In your backend service, go to **Variables** → **Volumes**
2. Add a volume and set the mount path to `/app/data`

---

## Frontend Deployment

1. Create a **second service** in your Railway project
2. Connect the **same** GitHub repository
3. Set **Root Directory** to `presentation`
4. Railway will use `presentation/Dockerfile` and `presentation/railway.json`

### Frontend Build Configuration

The frontend must know the backend API URL at **build time** (Vite bakes it in).

Set this variable in the frontend service **before** the first deploy:

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Full URL of your deployed backend API (e.g. `https://your-backend.railway.app`) |

> **Tip:** Deploy the backend first, get its public URL from Railway, then set `VITE_API_URL` on the frontend service and deploy.

---

## Quick Start (Backend Only)

1. Push this repo to GitHub
2. In [Railway Dashboard](https://railway.app/dashboard), create a new project
3. **Add Service** → **GitHub Repo** → select this repository
4. Railway will auto-detect the root `Dockerfile` and build
5. Add a Volume: mount path `/app/data`
6. Click **Deploy**
7. After deploy, use **Settings** → **Generate Domain** to get a public URL

---

## Full Stack Deployment (Backend + Frontend)

1. **Backend service**
   - Add service from this repo (no Root Directory)
   - Add Volume at `/app/data`
   - Deploy → Generate Domain → copy the URL (e.g. `https://ghana-stock-backend.railway.app`)

2. **Frontend service**
   - Add another service from the same repo
   - Set **Root Directory** to `presentation`
   - Add variable: `VITE_API_URL` = `https://ghana-stock-backend.railway.app` (use your backend URL)
   - Deploy → Generate Domain → copy the frontend URL

3. **CORS** – The backend allows CORS from the frontend origin. If you use custom domains, you may need to update CORS configuration in the backend.

---

## Troubleshooting

### "Railpack could not determine how to build"

- Ensure the root `Dockerfile` and `railway.json` exist
- The config forces `DOCKERFILE` builder; Railpack should not run

### Build fails with "Cargo.toml not found"

- Root Dockerfile expects build context = repo root
- Ensure you did **not** set Root Directory for the backend service (or leave it empty)

### Frontend shows API errors / wrong API URL

- `VITE_API_URL` is used at build time
- Redeploy the frontend after changing `VITE_API_URL`
