# portfoliobacktesting.com

A full-stack portfolio backtesting tool. Build custom stock allocations, run historical backtests with DCA simulation, and compare performance against S&P 500 and USD cash benchmarks.

**Live:** [portfoliobacktesting.com](https://portfoliobacktesting.com)

---

## What It Does

- Allocate up to 10 tickers with custom weights
- Backtest over 1–30 years of Yahoo Finance historical data
- Dollar-cost averaging simulation with configurable monthly investment
- Rebalancing strategies: none, annual, or quarterly
- Monte Carlo analysis (1,000 bootstrap simulations)
- Compare against S&P 500 and USD cash benchmarks
- Export results as CSV
- Blog with admin-only CRUD

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15 · React 19 · Tailwind v4 · TradingView Lightweight Charts |
| **Backend** | Go · Fiber v2 · Native MongoDB Driver · JWT Auth |
| **Database** | MongoDB Atlas |
| **Hosting** | Vercel (frontend) · Fly.io (backend) |


Auth is basic JWT — suitable for demo/portfolio use, not production financial applications.

---

## Monorepo Structure

```
├── frontend/          Next.js app (App Router)
│   ├── app/
│   │   ├── components/    UI components
│   │   ├── context/       Auth context
│   │   ├── lib/           API client
│   │   └── [routes]/      Pages
│   └── public/            Static assets
│
├── backend/           Go/Fiber API server
│   ├── handlers/      Route handlers (user, portfolio, blog)
│   ├── services/      Business logic (backtesting, Yahoo Finance, Monte Carlo)
│   ├── middleware/    Auth middleware
│   ├── models/        MongoDB models
│   ├── config/        DB connection
│   ├── Dockerfile     Multi-stage build
│   └── fly.toml       Fly.io config
│
├── ARCHITECTURE.md    Full system design, costs, and infrastructure details
└── README.md
```

---

## Running Locally

### Backend

```bash
cd backend
cp .env.example .env        # Add your MongoDB URI and JWT secret
go run .                    # Starts on :4000
```

**Required env vars:**
| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing tokens |
| `ADMIN_IDS` | Comma-separated user IDs for blog admin access |

### Frontend

```bash
cd frontend
cp .env.example .env.local  # Set API URL
npm install
npm run dev                 # Starts on :3000
```

**Required env vars:**
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend URL (e.g., `http://localhost:4000`) |

---

## API Overview

| Group | Endpoints | Auth |
|-------|-----------|------|
| **User** | signup, login, password-reset, profile, subscribe | Partial |
| **Portfolio** | assets, search-ticker, validate, analyze, generations CRUD, CSV export | Most |
| **Blog** | list, read, create, update, delete | Admin |

Full API documentation in [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Architecture Highlights

- **Go backend** — ~5-10MB RAM at idle, ~1-2s cold start (vs ~80-150MB / ~5-10s for the previous Node.js version)
- **Auto-stop on Fly.io** — machine scales to zero when idle, wakes on request. Running cost with low traffic: ~$0.01/month
- **No ORM** — native MongoDB Go driver for full control
- **Parallel ticker fetching** — all tickers fetched concurrently with goroutines
- **Monte Carlo bootstrap** — 1,000 simulations for projected outcome distributions
- **Migrated from v1** (Node.js/Express + Recharts + Heroku) to v2 (Go/Fiber + Lightweight Charts + Fly.io) for 3-5x cost reduction and faster performance

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full system design, infrastructure details, expected costs, and scaling thresholds.

---

## License

MIT
