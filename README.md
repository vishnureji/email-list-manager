# MailFlow — Email Audience & Campaign Management Platform

A full-stack email marketing management platform built with **React**, **Node.js/Express**, and **PostgreSQL**.

---

## Features

- **Dashboard** — Overview stats, charts, and recent campaign activity
- **Audiences** — Create/manage email lists with drag-and-drop CSV import
- **Campaigns** — Full CRUD with status tracking and manual stats entry
- **Campaign Reports** — Track Delivered, Opens, Clicks, Bounces, Unsubscribes, CTR (auto-calculated)
- **Weekly Report** — Filter by audience/week, export as CSV
- **Campaign Comparison** — Select multiple campaigns for side-by-side analysis with charts
- **Admin Panel** — Change password, system overview

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router, Recharts |
| Backend | Node.js, Express 4 |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Deployment | Railway |

---

## Default Credentials

```
Username: admin
Password: admin
```

> Change this immediately in the Admin panel after first login.

---

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL running locally

### Setup

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd email-platform

# 2. Install all dependencies
npm run install:all

# 3. Copy and fill in environment variables
cp .env.example .env
# Edit .env:
#   DATABASE_URL=postgresql://user:password@localhost:5432/email_platform
#   JWT_SECRET=your_secret_here
#   NODE_ENV=development

# 4. Create the database
createdb email_platform

# 5. Run dev servers (backend + frontend concurrently)
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

---

## Deploying to Railway

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/email-platform.git
git push -u origin main
```

### Step 2 — Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your repository

### Step 3 — Add PostgreSQL

1. In your Railway project dashboard, click **+ New**
2. Select **Database** → **Add PostgreSQL**
3. Railway automatically sets the `DATABASE_URL` environment variable

### Step 4 — Set Environment Variables

In your Railway service settings → **Variables**, add:

```
JWT_SECRET=your_very_long_random_secret_here_change_this
NODE_ENV=production
```

> `DATABASE_URL` is automatically provided by Railway's PostgreSQL plugin.
> `PORT` is automatically set by Railway.

### Step 5 — Deploy

Railway will automatically:
1. Install Node.js dependencies
2. Build the React frontend (`cd frontend && npm run build`)
3. Start the Express server which serves both the API and the built React app

The build process (defined in `nixpacks.toml`):
- Installs root + frontend dependencies
- Builds React to `frontend/build/`
- Serves everything from `backend/server.js`

### Step 6 — Verify

Visit your Railway-provided URL. You should see the MailFlow login page.
Log in with `admin` / `admin` and immediately change the password in Admin → Change Password.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/change-password` | Change password |
| GET | `/api/audiences` | List audiences |
| POST | `/api/audiences` | Create audience (with members) |
| PUT | `/api/audiences/:id` | Update audience |
| DELETE | `/api/audiences/:id` | Delete audience |
| POST | `/api/audiences/:id/members` | Add members (CSV/drag-drop) |
| GET | `/api/campaigns` | List campaigns with stats |
| POST | `/api/campaigns` | Create campaign |
| PUT | `/api/campaigns/:id` | Update campaign |
| DELETE | `/api/campaigns/:id` | Delete campaign |
| PUT | `/api/campaigns/:id/report` | Update campaign stats |
| GET | `/api/reports/dashboard` | Dashboard summary |
| GET | `/api/reports/weekly` | Weekly report (filter by date/audience) |
| GET | `/api/reports/compare` | Compare multiple campaigns |
| GET | `/api/health` | Health check |

---

## Campaign Metrics Explained

| Metric | Description | Calculation |
|---|---|---|
| Total Sent | Number of emails attempted | Manual entry |
| Delivered | Successfully delivered | Manual entry |
| Opens | Total opens | Manual entry |
| Unique Opens | Unique subscribers who opened | Manual entry |
| Clicks | Total link clicks | Manual entry |
| Bounces | Emails that bounced | Manual entry |
| Unsubscribes | Subscribers who opted out | Manual entry |
| **CTR** | Click-through rate | `(Clicks / Delivered) × 100` |
| **Open Rate** | Open rate | `(Opens / Delivered) × 100` |
| **Bounce Rate** | Bounce rate | `(Bounces / Sent) × 100` |

CTR, Open Rate, and Bounce Rate are **automatically calculated** from the entered values.

---

## Project Structure

```
email-platform/
├── backend/
│   ├── db/index.js          # PostgreSQL pool + schema init
│   ├── middleware/auth.js   # JWT middleware
│   ├── routes/
│   │   ├── auth.js
│   │   ├── audiences.js
│   │   ├── campaigns.js
│   │   └── reports.js
│   └── server.js            # Express app entry
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/layout/
│       ├── context/AuthContext.js
│       ├── pages/
│       │   ├── Login.js
│       │   ├── Dashboard.js
│       │   ├── Audiences.js
│       │   ├── Campaigns.js
│       │   ├── WeeklyReport.js
│       │   ├── Compare.js
│       │   └── Admin.js
│       └── utils/api.js
├── railway.toml
├── nixpacks.toml
├── Procfile
└── package.json
```
