# Environment Variables Reference

This document explains every environment variable used by the application, where to find its value, whether it is a secret, and which side (frontend or backend) it belongs to.

---

## FRONTEND (`frontend/.env`)

| Variable | Example | Secret? | Description |
|---|---|---|---|
| `VITE_APP_NAME` | `Campus Connect` | No | Application display name shown in the browser tab and navigation |
| `VITE_API_BASE_URL` | `http://localhost:5000/api` | No | Backend API base URL. In production, use your Render HTTPS URL |

> [!IMPORTANT]
> Every `VITE_` variable is embedded into the frontend bundle and **visible to anyone** who downloads the page. Never put database credentials, API secrets, session keys, or admin passwords here.

---

## BACKEND (`backend/.env`)

### Server

| Variable | Example | Secret? | Description |
|---|---|---|---|
| `PORT` | `5000` | No | Port the Express server listens on. Render sets this automatically |
| `NODE_ENV` | `development` | No | Runtime environment: `development`, `production`, or `test` |
| `API_BASE_URL` | `http://localhost:5000` | No | Base URL of the backend itself (used for constructing callback URLs) |
| `FRONTEND_URL` | `http://localhost:5173` | No | Origin of the frontend. Added to CORS allowlist. Use your Vercel URL in production |

### Database

| Variable | Example | Secret? | Description |
|---|---|---|---|
| `DATABASE_URL` | `postgresql://user:pass@host/db?sslmode=require` | **YES** | Neon PostgreSQL connection string. Get it from your Neon project dashboard → Connection Details. **Never commit this.** |

**How to get it:** Go to [neon.tech](https://neon.tech) → Your project → Connection Details → copy the "Pooled connection" string.

### Session & Cookies

| Variable | Example | Secret? | Description |
|---|---|---|---|
| `SESSION_SECRET` | `a-random-32+-char-string` | **YES** | Signs session cookies. Generate with: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `COOKIE_DOMAIN` | *(empty)* | No | Cookie domain. Leave empty for localhost. Set to `.yourdomain.com` in production if needed |
| `COOKIE_SECURE` | `false` | No | Set to `true` in production (HTTPS only). Render sets HTTPS automatically |

### Admin Bootstrap

| Variable | Example | Secret? | Description |
|---|---|---|---|
| `ADMIN_NAME` | `System Administrator` | No | Display name for the initial admin account |
| `ADMIN_EMAIL` | `admin@college.edu` | **YES** | Email of the initial admin. Used to log in |
| `ADMIN_INITIAL_PASSWORD` | `Admin@Secure2026!` | **YES** | Initial admin password. Hash stored in DB. Can be removed from env after first login and password change |

> [!WARNING]
> After your first successful login as admin, change your password through the app's profile page, then **remove `ADMIN_INITIAL_PASSWORD` from your production environment**. The bootstrap code only creates the account once — it will never overwrite an existing admin password.

### Google OAuth

| Variable | Example | Secret? | Description |
|---|---|---|---|
| `GOOGLE_CLIENT_ID` | `123abc.apps.googleusercontent.com` | No (public) | Google OAuth client ID. Get from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-xxxxx` | **YES** | Google OAuth client secret. Keep only in backend |
| `GOOGLE_CALLBACK_URL` | `http://localhost:5000/api/auth/google/callback` | No | OAuth redirect URI. Must exactly match what you register in Google Cloud |

**How to set up Google OAuth:**
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID (Web application)
4. Add Authorized JavaScript origins: `http://localhost:5173` (dev) + your Vercel URL (prod)
5. Add Authorized redirect URIs:
   - Dev: `http://localhost:5000/api/auth/google/callback`
   - Prod: `https://your-backend.onrender.com/api/auth/google/callback`
6. Copy Client ID and Client Secret

### Email (SMTP)

| Variable | Example | Secret? | Description |
|---|---|---|---|
| `SMTP_HOST` | `smtp.gmail.com` | No | SMTP server hostname |
| `SMTP_PORT` | `587` | No | SMTP port (587 for STARTTLS, 465 for SSL) |
| `SMTP_SECURE` | `false` | No | `true` for port 465, `false` for 587 |
| `SMTP_USER` | `notifications@college.edu` | No | SMTP login username |
| `SMTP_PASS` | `abcd efgh ijkl mnop` | **YES** | SMTP password. For Gmail, use an App Password (not your real password) |
| `EMAIL_FROM` | `Campus Connect <no-reply@college.edu>` | No | "From" address shown in sent emails |
| `ADMIN_NOTIFICATION_EMAIL` | `lab-admin@college.edu` | No | Email address that receives lab complaint notifications |

**For Gmail:** Enable 2-Step Verification → Google Account → Security → App Passwords → Generate for "Mail"

### Telegram (Lab Complaints)

| Variable | Example | Secret? | Description |
|---|---|---|---|
| `TELEGRAM_BOT_TOKEN` | `123456789:ABCdef...` | **YES** | Token from [@BotFather](https://t.me/BotFather) on Telegram |
| `TELEGRAM_CHAT_ID` | `-1001234567890` | No | Chat ID of the group or channel to receive complaints |

**How to set up:**
1. Message [@BotFather](https://t.me/BotFather) → `/newbot` → get token
2. Add the bot to your staff group
3. Get the chat ID: send a message to the group, then visit `https://api.telegram.org/bot<TOKEN>/getUpdates`
4. Look for `"chat":{"id":...}` — that is your `TELEGRAM_CHAT_ID`

### AI Service (Exam Timetable Extraction)

| Variable | Example | Secret? | Description |
|---|---|---|---|
| `AI_PROVIDER` | `MOCK` | No | Which AI provider to use: `GEMINI`, `OPENAI`, or `MOCK` (no real AI, for dev/testing) |
| `GEMINI_API_KEY` | `AIzaSy...` | **YES** | Google Gemini API key from [aistudio.google.com](https://aistudio.google.com) |
| `OPENAI_API_KEY` | `sk-...` | **YES** | OpenAI API key from [platform.openai.com](https://platform.openai.com) |

### File Storage

| Variable | Example | Secret? | Description |
|---|---|---|---|
| `STORAGE_DRIVER` | `LOCAL` | No | Storage backend: `LOCAL` (dev), `S3` (AWS), or `CLOUDINARY` |
| `UPLOAD_DIR` | `./uploads` | No | Local directory for uploaded files (dev only) |
| `AWS_S3_BUCKET` | `my-college-bucket` | No | S3 bucket name (if using S3) |
| `AWS_ACCESS_KEY_ID` | `AKIA...` | **YES** | AWS access key (if using S3) |
| `AWS_SECRET_ACCESS_KEY` | `wJal...` | **YES** | AWS secret key (if using S3) |
| `AWS_REGION` | `us-east-1` | No | AWS region for S3 |

> [!NOTE]
> For production, use `STORAGE_DRIVER=S3` with an AWS S3 bucket, or configure Cloudinary. `LOCAL` storage is not persistent on Render's ephemeral filesystem.

---

## Security Checklist

- [ ] `DATABASE_URL` is in Render environment only
- [ ] `SESSION_SECRET` is a 48+ character random hex string
- [ ] `ADMIN_INITIAL_PASSWORD` removed from production env after first login
- [ ] `GOOGLE_CLIENT_SECRET` is never in frontend code or Vercel env
- [ ] `SMTP_PASS` / `TELEGRAM_BOT_TOKEN` / AI keys are never committed to Git
- [ ] `.env` files are in `.gitignore`
- [ ] Only `.env.example` files (with placeholders) are committed
