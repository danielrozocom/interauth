# Troubleshooting: "vite dev" Runs in Production

## ⚡ Quick Fix

If you see this in your production logs:
```
> interauth@1.0.0 dev /app
> vite dev --host 0.0.0.0 --port 5173
```

**You're using the wrong Dockerfile.**

### Step 1: Verify Locally
```bash
node scripts/verify-dockerfile.js
```

### Step 2: Fix Your Deployment Platform

| Platform | Solution |
|----------|----------|
| **Dokploy** | Settings → Docker → Select `Dockerfile` (not `Dockerfile.dev`) |
| **Railway** | Build → Dockerfile → Set to `Dockerfile` |
| **Coolify** | Build → Docker → Dockerfile path: `./Dockerfile` |
| **Docker CLI** | Use: `docker build -f Dockerfile -t app .` |
| **Docker Compose** | Use: `docker-compose -f docker-compose.prod.yml up` |

### Step 3: Verify in Container
```bash
docker exec <container-id> node /app/scripts/diagnose-dockerfile.js
```

Expected output: