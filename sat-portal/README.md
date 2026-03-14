# SAT Portal

Full-stack SAT practice portal — React + TypeScript frontend, Express + TypeScript backend, PostgreSQL via Prisma, deployed on Vercel.

## Monorepo structure

```
sat-portal/
├── apps/
│   ├── web/          React + Vite + TypeScript
│   └── api/          Express + TypeScript + Prisma
├── packages/
│   └── shared/       Shared domain types (Question, TestSession, Score…)
└── vercel.json       Routes /api/* → Express, /* → SPA
```

## Getting started

### 1. Install
```bash
npm install
```

### 2. Environment
```bash
cp .env.example apps/api/.env
# Fill in DATABASE_URL and JWT secrets
```

### 3. Database
```bash
cd apps/api
npm run db:generate   # generate Prisma client
npm run db:migrate    # create tables
npm run db:seed       # seed sample questions (optional)
```

### 4. Dev
```bash
# From repo root — starts web (5173) and api (3001) in parallel
npm run dev
```

## Deploying to Vercel
1. Push to GitHub
2. Import in Vercel dashboard
3. Add env vars: DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, CLIENT_ORIGIN
4. Deploy — vercel.json handles routing automatically

## Roadmap
- [ ] LoginPage + RegisterPage UI
- [ ] DashboardPage with session history
- [ ] TestPage with timer + question navigation
- [ ] ResultsPage with score breakdown
- [ ] Prisma seed file with sample SAT questions
