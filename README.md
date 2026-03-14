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

## Stack considerations
React: Since it is relatively lightweight as a library rather than a full framework, it's a good choice for a small application like this.
Vite: For fast development iteration with optimized hot module reloading and dependency pre-bundling
TypeScript: For preventing type-based errors; transpilation helps catch bugs before they occur at compile-time
Express: Simplified routing for the single-page application
Prisma: Object-relational mapper that allows for simplified database workflows and intuitive schema definition for the database
PostGreSQL via Neon: Being a free option with minimal setup woes, it's a perfect option for a small project; since PostGres handles heavy writes well,
                     it's a good choice for an application that is going to be logging answer and score data for an entire exam's worth of questions at once.
Vercel: A free option for hosting with a variety of features, including load balancing (just in case a project like this scales upward).
