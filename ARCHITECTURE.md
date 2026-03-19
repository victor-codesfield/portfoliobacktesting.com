# Portfolio Backtesting App — Architecture

## Overview

Full-stack portfolio backtesting application. Users create portfolio allocations with up to 10 tickers, run historical backtests using Yahoo Finance data, and compare performance against S&P 500 and USD cash benchmarks.

**Production URL:** portfoliobacktesting.com

---

## Context

### Creator

Built solo by Victor Codesfield — MEng Civil & Structural Engineering (Sheffield, First Class), former structural engineer turned self-taught full-stack developer.

### Why This Project Exists

1. **Portfolio tool** — a functional backtesting app for personal use and public users
2. **YouTube showcase** — one of the projects Victor is demonstrating publicly on his AI-assisted development YouTube channel
3. **Learning vehicle** — the v1→v2 migration (Node/Express → Go/Fiber, Recharts → lightweight-charts, Heroku → Fly.io) was a deliberate exercise in learning Go and optimising for cost/performance

### Project Priority

This is a **side project**, not Victor's primary business. Development is sporadic. The infrastructure choices reflect this — everything is optimised for near-zero cost at low traffic, with a clear upgrade path if it grows.

### Evolution

| Version | Backend | Frontend | Charts | Host | Status |
|---------|---------|----------|--------|------|--------|
| v1 | Node.js / Express / Mongoose | Next.js 15 / React 18 | Recharts | Heroku ($7/mo) | Retired |
| v2 | Go / Fiber / native MongoDB driver | Next.js 15 / React 19 | lightweight-charts | Fly.io (~$1-2/mo) | **Production** |

Key migrations: 3.5x cost reduction, ~5x memory reduction, ~3-5x faster cold starts, added quarterly rebalancing and Monte Carlo simulations.

---

## Stack

| Layer | Technology | Version | Host |
|-------|-----------|---------|------|
| Frontend | Next.js (App Router) + React | 15.3.3 / 19.1.0 | Vercel |
| Styling | Tailwind CSS | v4 | — |
| Charts | lightweight-charts (TradingView) | 4.2.2 | — |
| Backend | Go + Fiber | Go 1.25 / Fiber v2.52 | Fly.io (iad) |
| Database | MongoDB Atlas | — | Cloud (shared) |
| Auth | JWT (golang-jwt/v5) | 7-day expiry | — |

---

## Infrastructure

### Frontend — Vercel

- Automatic deployments from Git
- Edge network / CDN for static assets
- Server-side rendering for SEO pages (homepage, blog)
- No custom `vercel.json` — uses Next.js defaults
- Env: `NEXT_PUBLIC_API_URL` points to Fly.io backend

### Backend — Fly.io

- **Region:** iad (Ashburn, Virginia, US)
- **Machine:** shared-cpu-1x @ 256MB RAM
- **Container:** Multi-stage Docker build (golang:1.25-alpine → alpine:latest)
- **Port:** 4000
- **Auto-stop enabled:** Machine suspends when idle, wakes on incoming request (~1-2s cold start)
  - `auto_stop_machines = 'stop'`
  - `auto_start_machines = true`
  - `min_machines_running = 0`
- **Single machine** — no horizontal auto-scaling configured
- Security headers via Fiber Helmet middleware

### Database — MongoDB Atlas

- Shared/free-tier cluster
- Native Go driver (go.mongodb.org/mongo-driver v1.17.9) — no ORM
- Collections: users, generations (saved portfolios), blog posts

---

## Backend Architecture

### API Routes

**User** (`/api/user`):
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /signup | No | Create account |
| POST | /login | No | Login, returns JWT |
| POST | /password-reset | No | Reset password |
| GET | /profile | Yes | Fetch user profile |
| POST | /subscribe | Yes | Activate premium |

**Portfolio** (`/api/portfolio`):
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /assets | No | Available assets by category |
| GET | /search-ticker | No | Search/validate ticker |
| POST | /validate | Yes | Validate tickers have historical data |
| POST | /analyze | Yes | Run backtest analysis |
| GET | /generations | Yes | List saved portfolios |
| GET | /generations/:id | Yes | Get single portfolio |
| PUT | /generations/:id | Yes | Update portfolio |
| DELETE | /generations/:id | Yes | Delete portfolio |
| GET | /generations/:id/export-csv | Yes | Export as CSV |

**Blog** (`/api/blog`):
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | / | No | List posts |
| GET | /:slug | No | Read post |
| POST | / | Admin | Create post |
| PUT | /:slug | Admin | Update post |
| DELETE | /:slug | Admin | Delete post |

### Backend Services

- **Yahoo Finance fetcher** — pulls historical price data per ticker
- **DCA simulation** — dollar-cost averaging with configurable monthly investment
- **Rebalancing** — none, annual, or quarterly frequency
- **Monte Carlo** — 1000 bootstrap simulations for projected outcomes
- **CSV export** — server-generated downloadable CSV

### Auth Flow

1. User signs up/logs in → backend returns JWT (7-day expiry)
2. Frontend stores JWT in `localStorage` as part of user object
3. All authenticated requests send `Authorization: Bearer <token>` header
4. Backend middleware validates JWT, extracts user ID

### CORS

Allowed origins:
- `http://localhost:3000` (dev)
- `https://portfoliobacktesting.com`
- `https://api.portfoliobacktesting.com`

---

## Frontend Architecture

### Pages

| Route | Rendering | Purpose |
|-------|-----------|---------|
| `/` | SSR | Homepage — hero, FAQ, CTA |
| `/backtester` | Client | List saved portfolio generations |
| `/backtester/[id]` | Client | Create/edit portfolio, run backtest |
| `/login` | Server | Login form |
| `/signup` | Server | Signup form |
| `/reset` | Server | Password reset |
| `/blog` | SSR | Blog listing (fetched server-side) |
| `/blog/[slug]` | SSR | Individual blog post |
| `/about` | Server | About page |
| `/pricing` | Client | Pricing tiers |
| `/privacy-policy` | Server | Privacy policy |
| `/terms-of-service` | Server | Terms of service |

### Key Components (`app/components/`)

- **Navbar** — sticky nav, auth state, responsive mobile menu
- **Footer** — links, branding
- **PortfolioBuilder** — main form: ticker search, allocation sliders, investment params
- **PortfolioChart** — TradingView lightweight-charts line chart
- **LoginForm / SignupForm** — auth forms with validation
- **UpgradeModal** — premium subscription activation

### State Management

- **AuthContext** — global auth state via React Context
  - `user`: `undefined` (loading) | `null` (logged out) | `object` (logged in)
  - `ready`: boolean (initialization complete)
- **Component-local state** — React hooks, no external state library
- **localStorage** — JWT persistence

### API Client (`app/lib/api.js`)

- `portfolioAPI` — all portfolio endpoints
- `userAPI` — all user endpoints
- `Authorization` header automatic injection from localStorage

---

## Business Rules

- Max **10 tickers** per portfolio allocation
- Max **10 saved generations** per user
- Allocation percentages must sum to **100%**
- Backtest periods: 1, 2, 5, 10, 20, 30 years
- `user.subscribed` field exists but is **not enforced** in v2 backend - this is to capture demand for potential monetization.
- Admin blog access controlled via environment variable (admin user IDs)

---

## Expected Demand & Volume

### Current Stage: Pre-growth / Personal Project

| Metric | Estimate |
|--------|----------|
| Monthly active users | < 5 |
| Monthly page views | < 50 |
| Monthly backtest runs | < 10 |
| Concurrent users | 1 |
| Database size | < 1 MB |
| Saved generations | < 50 total |

### Per-Request Resource Profile

| Operation | Duration | CPU Impact | Memory Impact |
|-----------|----------|------------|---------------|
| Auth (login/signup) | < 100ms | Minimal | Minimal |
| Ticker search | < 200ms | Minimal | Minimal |
| Backtest (5y, 3 tickers) | 2-5s | Moderate (Yahoo fetch + calc) | ~20-50MB spike |
| Backtest (30y, 10 tickers) | 5-15s | High (Yahoo fetch + Monte Carlo) | ~50-100MB spike |
| CSV export | < 500ms | Low | Low |
| Blog CRUD | < 100ms | Minimal | Minimal |

### Scaling Thresholds (single machine, current config)

The shared-cpu-1x @ 256MB can comfortably handle:
- **~10-20 concurrent backtest requests** before memory pressure
- **~100+ concurrent simple requests** (auth, reads, blog)
- Beyond this → upgrade to `shared-cpu-1x @ 512MB` (~$3.88/mo) or add auto-scaling

---

## Cost Breakdown

### Current Monthly Costs

| Service | Tier | Cost |
|---------|------|------|
| **Vercel** (frontend) | Free (Hobby) | $0.00 |
| **Fly.io** (backend) | Pay-as-you-go | ~$0.01 - $1.94 |
| **MongoDB Atlas** (database) | Free (M0 shared) | $0.00 |
| **Domain** (portfoliobacktesting.com) | Annual | ~$1.00/mo amortized |
| **Total** | | **~$1 - $3/mo** |

### Fly.io Cost Detail

| Scenario | Monthly Cost |
|----------|-------------|
| Machine running 24/7 | ~$1.94 |
| Auto-stop, ~2 visits/month | ~$0.01 |
| Auto-stop, ~100 visits/month | ~$0.10 |
| Auto-stop, ~1000 visits/month | ~$0.50 |

Machine: `shared-cpu-1x @ 256MB` = $0.00000268/sec when running.
Auto-stop is enabled — machine suspends on idle, wakes on request (~1-2s cold start).
Single machine, no auto-scaling — costs cannot spike unexpectedly.

### Cost Comparison vs Previous Stack

| | Old (Node/Heroku) | Current (Go/Fly.io) |
|---|---|---|
| Backend hosting | $7.00/mo (Eco dyno, 512MB) | ~$0.01-1.94/mo (256MB) |
| RAM used at idle | ~80-150MB | ~5-10MB |
| Cold start | ~5-10s | ~1-2s |
| Total infra cost | ~$8/mo | ~$1-3/mo |

### Upgrade Path (if traffic grows)

| Trigger | Action | New Cost |
|---------|--------|----------|
| Memory pressure (>200MB avg) | Upgrade to 512MB | ~$3.88/mo |
| Slow response under load | Upgrade to `performance-1x` | ~$30/mo |
| Need high availability | `min_machines_running = 1` | 2x base cost |
| Global users | Add regions (e.g., `ams`, `sin`) | +$1.94/region |
