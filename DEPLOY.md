# Deploy Surakhsa Core

**Surakhsa Core - Smart Healthcare Emergency Monitoring System**

## Option A: Render (recommended, free tier)

1. Push this project to GitHub.
2. Go to [render.com](https://render.com) → **New** → **Blueprint**.
3. Connect the repo — Render reads `render.yaml` automatically.
4. Set environment variable `JWT_SECRET` (Render can auto-generate it).
5. Deploy. Your app will be live at `https://your-app.onrender.com`.

**Build:** `npm install && npm run build`  
**Start:** `npm start` (serves API + React build on one port)

## Option B: Run locally (production mode)

```powershell
cd "c:\Users\bidha\OneDrive\Desktop\smart health"
npm install
npm run build
$env:NODE_ENV="production"
$env:JWT_SECRET="your-secret-here"
npm start
```

Open http://localhost:5001

## Option C: Development

```powershell
npm run dev
```

- Backend: http://localhost:5001  
- Frontend: http://localhost:3000 (proxied to API)

## After deploy

| URL | Purpose |
|-----|---------|
| `/` | Guardian login |
| `/register` | Sign up |
| `/dashboard` | Guardian monitor |
| `/patient` | Patient phone sensors |
| `/admin` | Admin (login page → click title 3× → code `911`) |

Patient page needs **HTTPS** on a real phone for GPS/camera/motion sensors.
