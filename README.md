# Campus Connect

A secure, full-stack college community platform with 8 integrated features, built with React, Node.js, Express, TypeScript, and Neon PostgreSQL.

## Features

| # | Feature | Description |
|---|---|---|
| 1 | 🎓 CGPA Calculator | Anna University Reg 2025 B.E. CSE semester-wise GPA and cumulative CGPA |
| 2 | ⏰ Exam Countdown | AI-powered timetable extraction, study leave analysis, study plan |
| 3 | 📢 Campus Events | Admin-approved event notifications with brochure uploads |
| 4 | 🤝 Partner Finder | Anonymous team-finding posts with private messaging |
| 5 | 🏆 Leaderboard | Academic CGPA leaderboard (Batch 2023–2027) with opt-in privacy |
| 6 | 🔧 Lab Complaints | Truly anonymous lab complaint system with Telegram + email alerts |
| 7 | 🔍 Lost & Found | Photo-based campus lost and found board |
| 8 | 🔥 Poll Wars | Admin-created classroom polls with anonymous voting |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, TypeScript, Tailwind CSS |
| Backend | Node.js 20, Express 4, TypeScript, Prisma ORM |
| Database | Neon PostgreSQL |
| Auth | express-session, Passport.js, Google OAuth 2.0 |
| Hosting | Vercel (frontend), Render (backend) |

## Quick Start (Local Development)

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/campus-connect.git
cd campus-connect

# 2. Set up backend
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL to your Neon connection string
npm install
npx prisma generate
npx prisma db push
npx ts-node prisma/seed.ts
npm run dev     # runs on http://localhost:5000

# 3. Set up frontend (new terminal)
cd ../frontend
cp .env.example .env
npm install
npm run dev     # runs on http://localhost:5173
```

## Project Structure

```
campus-connect/
├── frontend/          # React + Vite + TypeScript
│   └── src/
│       ├── components/    # UI components (Button, Modal, Card...)
│       ├── pages/         # User and admin pages
│       ├── services/      # API client services
│       ├── contexts/      # AuthContext, NotificationContext
│       └── routes/        # Protected + Admin route guards
├── backend/           # Express + TypeScript + Prisma
│   └── src/
│       ├── controllers/   # Request handlers for all features
│       ├── services/      # Business logic (email, telegram, AI)
│       ├── repositories/  # Database query layer
│       ├── routes/        # Express route definitions
│       ├── middleware/     # Auth, rate limiting, uploads, validation
│       └── validators/    # Zod validation schemas
│   └── prisma/
│       ├── schema.prisma  # Database schema (23 models)
│       └── seed.ts        # Anna University curriculum data
└── docs/
    ├── DEPLOYMENT.md          # Step-by-step deployment guide
    ├── ENVIRONMENT_VARIABLES.md
    └── SECURITY.md
```

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for complete step-by-step instructions.

**Short version:**
1. Create Neon DB → run `npx prisma db push` + seed
2. Deploy backend to Render (root: `backend/`)
3. Deploy frontend to Vercel (root: `frontend/`)
4. Set environment variables in both platforms

## Design

Zoho-inspired enterprise UI with:
- Primary red `#E42527`
- Inter font
- Clean cards, tables, and forms
- Responsive mobile/desktop layout
- Role-based navigation (user vs admin)

## Admin Access

On first startup, the backend creates an admin account from:
- `ADMIN_EMAIL` env var
- `ADMIN_INITIAL_PASSWORD` env var

Log in at `/login`, then navigate to `/admin` for the admin dashboard.

## License

MIT
