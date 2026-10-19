# Deployment Guide — Campus Connect

> **Everything is automatic.** You do not run any migration or seed commands manually.
> Schema creation, curriculum seeding, and admin account creation all happen automatically on first deploy.

Deploy in this exact order: **1 → Neon → 2 → Render → 3 → Vercel**

---

## What Happens Automatically on Every Deploy

```
Render Build Phase
  └─ npm install
  └─ prisma generate        ← compiles Prisma client from schema

Render Start Phase  (node dist/server.js)
  ├─ STEP 1: npx prisma db push   ← creates / updates all DB tables in Neon
  ├─ STEP 2: Admin bootstrap      ← creates admin account if it doesn't exist yet
  └─ STEP 3: Curriculum seed      ← inserts Anna University courses if table is empty
  └─ 🚀 Server starts accepting traffic
```

All three startup steps are **idempotent** — safe to run on every restart.
- Schema push: no-ops if tables are already up to date
- Admin bootstrap: only creates if the email doesn't exist
- Seed: only inserts if curriculum table is empty

---

## STEP 1 — Neon PostgreSQL Database (5 min)

### 1.1 Create Project
1. Sign up / log in at [console.neon.tech](https://console.neon.tech)
2. Click **New Project**
3. Name: `campus-connect`, Region: **AWS ap-south-1 (Mumbai)**
4. Click **Create Project**

### 1.2 Get Your Connection String
1. In the project dashboard → **Connection Details**
2. Select **Pooled connection** tab
3. Copy the string — it looks like:
   ```
   postgresql://user:password@ep-xxx-pooler.ap-south-1.aws.neon.tech/neondb?sslmode=require
   ```
4. **Save this string** — paste it as `DATABASE_URL` in Render (next step)

> [!NOTE]
> That's all you need to do in Neon. The backend will create all tables automatically on first start.

---

## STEP 2 — Push Code to GitHub (5 min)

```powershell
cd c:\Users\Ajai\Downloads\webinar

git init
git add .
git commit -m "Initial commit - Campus Connect"
```

Go to [github.com/new](https://github.com/new) → create a repo named `campus-connect` (no README, no .gitignore) → then:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/campus-connect.git
git branch -M main
git push -u origin main
```

---

## STEP 3 — Render Backend (10 min)

### 3.1 Create Web Service
1. Go to [dashboard.render.com](https://dashboard.render.com)
2. **New** → **Web Service**
3. Connect GitHub → select `campus-connect` repo

### 3.2 Configure Build Settings

| Setting | Value |
|---|---|
| **Name** | `campus-connect-backend` |
| **Region** | Singapore (SE Asia) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `node dist/server.js` |
| **Instance Type** | Free |

> [!IMPORTANT]
> The Build Command is simply `npm install && npm run build`.
> `npm run build` already runs `prisma generate && tsc` — that's all Render needs.
> **Do NOT add** `prisma db push` to the build command — it runs inside the app at startup instead.

### 3.3 Add Environment Variables
Click the **Environment** tab → **Add Environment Variable** for each one:

**Required — must be set:**
```
NODE_ENV                  = production
PORT                      = 10000
DATABASE_URL              = postgresql://...your neon pooled connection string...
SESSION_SECRET            = (generate below)
ADMIN_EMAIL               = your-admin@email.com
ADMIN_INITIAL_PASSWORD    = YourStrongPassword123!
FRONTEND_URL              = https://campus-connect.vercel.app
```

**Generate SESSION_SECRET** (run this on your PC, paste the output):
```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

**Optional but recommended:**
```
ADMIN_NAME                = System Administrator
API_BASE_URL              = https://campus-connect-backend.onrender.com
COOKIE_SECURE             = true
GOOGLE_CLIENT_ID          = (from Google Cloud Console)
GOOGLE_CLIENT_SECRET      = (from Google Cloud Console)
GOOGLE_CALLBACK_URL       = https://campus-connect-backend.onrender.com/api/auth/google/callback
SMTP_HOST                 = smtp.gmail.com
SMTP_PORT                 = 587
SMTP_SECURE               = false
SMTP_USER                 = your-gmail@gmail.com
SMTP_PASS                 = (Gmail App Password — 16 chars)
EMAIL_FROM                = Campus Connect <your-gmail@gmail.com>
ADMIN_NOTIFICATION_EMAIL  = lab-admin@college.edu
TELEGRAM_BOT_TOKEN        = (from @BotFather)
TELEGRAM_CHAT_ID          = (your staff group ID)
AI_PROVIDER               = GEMINI
GEMINI_API_KEY            = (from aistudio.google.com)
```

### 3.4 Deploy
Click **Create Web Service**. Render will:
1. Clone your repo and enter `backend/`
2. Run `npm install && npm run build` (Prisma client generated + TypeScript compiled)
3. Run `node dist/server.js` which automatically:
   - Pushes schema to Neon ✅
   - Creates admin account ✅
   - Seeds curriculum data ✅
   - Starts the server ✅

**Confirm it worked** — click **Logs** in Render and look for:
```
✅ Database schema is up to date.
✅ Admin account bootstrapped.
✅ Seeded 7 grade scale entries
✅ Seeded 57 curriculum courses
🚀 Campus Connect backend running on port 10000 in production mode
```

Then test:
```
https://campus-connect-backend.onrender.com/api/health
```
Should return: `{ "status": "ok" }`

---

## STEP 4 — Vercel Frontend (5 min)

### 4.1 Import Project
1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your `campus-connect` GitHub repository

### 4.2 Configure
| Setting | Value |
|---|---|
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### 4.3 Add Environment Variables
```
VITE_APP_NAME       = Campus Connect
VITE_API_BASE_URL   = https://campus-connect-backend.onrender.com/api
```

### 4.4 Deploy
Click **Deploy**. In ~2 minutes your frontend is live at:
`https://campus-connect.vercel.app`

---

## STEP 5 — Wire Frontend ↔ Backend

Go back to **Render** → your backend service → **Environment** → update:
```
FRONTEND_URL = https://campus-connect.vercel.app
```
Click **Manual Deploy → Deploy latest commit**.

This is needed so the backend's CORS allows requests from your Vercel URL.

---

## STEP 6 — First Login & Security Hardening

1. Open `https://campus-connect.vercel.app/login`
2. Log in with `ADMIN_EMAIL` + `ADMIN_INITIAL_PASSWORD` you set in Render
3. Go to **Profile** → change your password to something new and strong
4. Go to **Render → Environment** → **delete** `ADMIN_INITIAL_PASSWORD` from env vars
5. Redeploy (the server will skip admin creation since the account already exists)

---

## Architecture Overview

```
User's Browser
     │
     ▼  HTTPS
Vercel CDN ─── serves React bundle (HTML/CSS/JS)
     │
     │  HTTPS REST API
     ▼
Render Web Service ─── Express + Node.js
     │
     │  Prisma ORM (SSL)
     ▼
Neon PostgreSQL ─── All application data
     │
     ├── /uploads ── Uploaded images (local disk — ephemeral on free Render)
     ├── Nodemailer ── Email via Gmail SMTP
     └── Telegram Bot API ── Lab complaint alerts
```

---

## ⚠️ File Storage Warning (Important for Production)

Lost & Found photos and event brochures are stored on **Render's local disk**.
Render's free tier uses an **ephemeral filesystem** — files are deleted on every redeploy.

**Fix:** Use AWS S3 or Cloudinary for persistent file storage:

```
# In Render environment variables, add:
STORAGE_DRIVER    = S3
AWS_S3_BUCKET     = your-bucket-name
AWS_ACCESS_KEY_ID = AKIA...
AWS_SECRET_ACCESS_KEY = ...
AWS_REGION        = ap-south-1
```

---

## Local Development

```powershell
# Terminal 1 — Backend
cd c:\Users\Ajai\Downloads\webinar\backend
copy .env.example .env
# Edit .env — set DATABASE_URL to your Neon connection string
npm run dev
# Server auto-runs: schema push → seed → admin bootstrap → start

# Terminal 2 — Frontend
cd c:\Users\Ajai\Downloads\webinar\frontend
copy .env.example .env
# VITE_API_BASE_URL is already set to http://localhost:5000/api
npm run dev
```

Open: http://localhost:5173

> [!TIP]
> In development (`NODE_ENV=development`) the server still runs `prisma db push` on startup.
> This means you can safely make schema changes in `prisma/schema.prisma` and just restart the server — no manual migration commands needed locally either.
