# Quick Deployment Checklist

## 1. MongoDB Atlas (5 minutes)
- [ ] Create free cluster at mongodb.com/cloud/atlas
- [ ] Create database user and save password
- [ ] Allow access from anywhere (0.0.0.0/0)
- [ ] Copy connection string
- [ ] Add database name to connection string

## 2. Render Backend (10 minutes)
- [ ] Create new Web Service at render.com
- [ ] Connect GitHub repository
- [ ] Set root directory: `backend`
- [ ] Build command: `npm install && npm run build`
- [ ] Start command: `npm start`
- [ ] Add environment variables (see deployment_guide.md)
- [ ] Deploy and save backend URL

## 3. Vercel Frontend (5 minutes)
- [ ] Create new project at vercel.com
- [ ] Import GitHub repository
- [ ] Set root directory: `frontend`
- [ ] Add environment variables:
  - VITE_API_BASE_URL = (your Render URL)
  - VITE_SOCKET_URL = (your Render URL)
- [ ] Deploy and save frontend URL

## 4. Final Configuration (2 minutes)
- [ ] Update Render CLIENT_URL to your Vercel URL
- [ ] Test signup/login
- [ ] Test project creation
- [ ] Test Kanban board drag-and-drop
- [ ] Test real-time collaboration

## Environment Variables Quick Reference

### Render (Backend)
```
NODE_ENV=production
PORT=10000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/metacollab
JWT_SECRET=<generate-random-32-chars>
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=<generate-random-32-chars>
REFRESH_TOKEN_EXPIRES_IN=7d
CLIENT_URL=https://your-app.vercel.app
DB_MAX_RETRIES=5
DB_RETRY_DELAY=5000
ENABLE_CLUSTER=false
```

### Vercel (Frontend)
```
VITE_API_BASE_URL=https://metacollab-backend.onrender.com
VITE_SOCKET_URL=https://metacollab-backend.onrender.com
```

## Generate Secrets
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Total deployment time: ~20 minutes
