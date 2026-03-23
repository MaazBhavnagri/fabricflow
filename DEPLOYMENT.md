# FabricFlow Deployment Guide

## 🐳 Running Locally with Docker
You can easily spin up the entire application locally using Docker Compose:

1. Make sure you have Docker Desktop installed.
2. At the root of the project, run:
```bash
docker-compose up --build
```
3. Open your browser:
   - **Frontend App**: `http://localhost:8080`
   - **Backend API**: `http://localhost:5000/api/health`

---

## 🚀 Deploying to Production

### 1. Backend (Render / Heroku / DigitalOcean)

The backend is a Flask API using SQLite (which can easily be swapped to Postgres in `models.py`).

**Using Render (Free/Paid Tier):**
1. Create a **New Web Service** on Render.
2. Connect your GitHub repository containing this code.
3. Configure the service:
   - **Root Directory**: `backend`
   - **Runtime**: `Docker`
   - **Build Command**: Uses Dockerfile automatically.
   - **Start Command**: Uses `CMD` in Dockerfile.
4. **Environment Variables**:
   - Create a disk/volume in Render and mount it to `/app/instance` to persist SQLite data.
   - Same for `/app/uploads` for images.
5. Deploy.

### 2. Frontend (Vercel / Netlify)

Vercel is the easiest place to host a Vite React App, and properly supports the Service Worker for our PWA.

**Using Vercel:**
1. Log into Vercel and **Add a New Project**.
2. Connect your GitHub repository.
3. Configure Project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **IMPORTANT**: Update API Base URL
   - Go to `src/store/sync.js`.
   - Before deploying, change the `API_BASE` variable from `http://localhost:5000/api` to your deployed Render URL (e.g., `https://fabricflow-api.onrender.com/api`).
5. Deploy. 
6. Since it is a **PWA**, users can open the deployed Vercel link on their phones in Chrome/Safari, and select **"Add to Home Screen"** to install it as a native-like app!

## 📱 Offline Use Verification
1. Open the frontend on your phone browser.
2. Turn ON Airplane Mode.
3. Add a new Tailor or Order. Notice it saves instantly due to IndexedDB.
4. An indicator will say "Syncing to server..."
5. Turn OFF Airplane Mode.
6. The background sync will push it to the live backend seamlessly.
