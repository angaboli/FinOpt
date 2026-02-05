# CLAUDE.md - Finopt Project Context

## Project Overview
**Finopt** is an AI-powered personal finance management platform built as a monorepo.
- **Backend**: Python 3.12 / FastAPI / SQLAlchemy / Celery + Redis
- **Mobile**: React Native 0.81.5 / Expo 54 / TypeScript / Zustand
- **Database**: PostgreSQL 15 (Neon serverless) with RLS
- **AI**: Anthropic Claude API for insights & goal planning
- **Infra**: Docker Compose, GitHub Actions CI/CD

## Monorepo Structure
```
finopt/
├── apps/api/             # FastAPI backend (Clean Architecture)
├── apps/mobile/          # React Native + Expo mobile app
├── packages/shared/      # Shared TypeScript types & validation (zod)
├── infra/supabase/       # PostgreSQL schema (schema.sql)
├── docs/                 # Architecture, API, Docker, Setup guides
├── scripts/              # Setup & test scripts (sh/bat)
└── .github/workflows/    # CI/CD pipeline
```

## Architecture - Backend (Clean Architecture / SOLID)
```
Presentation → Application → Domain ← Infrastructure
```
- **Domain** (`src/domain/`): Entities (User, Account, Transaction, Budget, Category, Goal, Notification, Insight), abstract Repository & Service interfaces
- **Application** (`src/application/use_cases/`): Single-responsibility use cases (Create/Update/Delete/List for each entity)
- **Infrastructure** (`src/infrastructure/`): Repository implementations (SQLAlchemy), services (Anthropic LLM, Expo Push, Statement Parsers), Celery workers
- **Presentation** (`src/presentation/api/`): FastAPI routers (auth, accounts, transactions, budgets, insights, notifications, goals), dependency injection

## Architecture - Mobile
- **Screens**: Dashboard, Accounts, Transactions, Budgets, Goals, Settings, SignIn + Add modals
- **State**: Zustand stores (useAuthStore, useDataStore)
- **Navigation**: React Navigation (bottom tabs + stack for modals)
- **API Client**: Axios with JWT interceptors (`src/lib/api.ts`)
- **Components**: `src/presentation/components/` (cards, common UI)
- **Entities**: `src/core/entities/`
- **Shared**: `src/shared/` (constants, utils, types)

## Key Commands
```bash
# Backend
cd apps/api && uvicorn src.presentation.api.main:app --reload --port 8000
# or from root:
npm run api

# Mobile
cd apps/mobile && npx expo start
# or from root:
npm run mobile

# Docker (all services)
docker-compose up -d          # Start API + Redis + Celery
docker-compose down           # Stop all
docker-compose --profile local-db up -d  # Include local Postgres

# Tests
cd apps/api && pytest                     # Backend tests
cd apps/mobile && npx jest               # Mobile tests

# Linting
cd apps/api && ruff check . && mypy .    # Python
npm run lint                              # TypeScript/ESLint
```

## Database
- **12+ tables**: users, accounts, transactions, categories, budgets, budget_events, notifications, notification_preferences, insights, goals, import_history, notification_push_tokens
- **Schema**: `infra/supabase/schema.sql`
- **RLS**: Row-Level Security policies for user data isolation
- **Migrations**: Alembic (apps/api/alembic/)

## API Endpoints (30+)
- `POST /api/v1/auth/{signup,signin,signout}` - Authentication (JWT)
- `GET|POST|PUT|DELETE /api/v1/accounts/` - Account CRUD
- `GET|POST|PUT|DELETE /api/v1/transactions/` - Transaction CRUD + filters
- `GET|POST|PUT|DELETE /api/v1/budgets/` - Budget management
- `POST /api/v1/insights/generate` | `GET /api/v1/insights/` - AI insights
- `GET|PUT /api/v1/notifications/` - Notification management
- `GET|POST|PUT|DELETE /api/v1/goals/` - Goal tracking + AI plan generation
- **Docs**: http://localhost:8000/docs (Swagger) | http://localhost:8000/redoc

## Background Workers (Celery)
- **import_tasks**: CSV/OFX/PDF statement parsing, deduplication, auto-categorization
- **insight_tasks**: Monthly AI insights generation (spending patterns, anomalies, recommendations)
- **budget_tasks**: Threshold breach evaluation, push notifications, daily checks

## Environment Variables (apps/api/.env)
- `DATABASE_URL` - Neon Postgres connection string
- `ANTHROPIC_API_KEY` - Claude API key
- `JWT_SECRET_KEY` - JWT signing secret
- `REDIS_URL` / `CELERY_BROKER_URL` - Redis connection

## Current Status & Known Issues
- **Implemented**: Full architecture scaffold, auth, transaction CRUD, Docker setup, CI/CD
- **Partial**: AccountRepository (new file), BudgetRepository (scaffolded), some endpoints return 501
- **Missing**: Statement parser implementations, auto-categorization service, comprehensive tests, rate limiting, monitoring
- **Tech debt**: Many redundant documentation files, old app directory, unused batch scripts

## Coding Conventions
- **Python**: Black formatting, Ruff linting, mypy type checking, pytest for tests
- **TypeScript**: ESLint + Prettier, Jest + React Testing Library
- **Git**: Conventional-style commits, French documentation allowed
- **Architecture**: Always follow Clean Architecture layers, SOLID principles, dependency injection
