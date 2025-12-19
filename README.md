# FinOpt - AI-Powered Personal Finance Manager

Production-ready monorepo for personal and professional finance management with AI-powered insights.

## Features

- Multi-account management (checking, savings, credit cards, business, etc.)
- Automatic bank statement import (CSV, OFX, PDF)
- Manual transaction entry
- Smart budgeting with threshold alerts
- Push notifications for budget warnings
- AI-powered financial insights and recommendations
- Subscription detection and optimization
- Income-based savings strategies
- Future-ready goal tracking system

## Tech Stack

### Frontend
- React Native + TypeScript
- Expo (managed workflow)
- Zustand (state management)
- React Navigation
- Zod (validation)
- Victory Native (charts)

### Backend
- Python 3.11+ with FastAPI
- Clean Architecture (Domain/Application/Infrastructure/Presentation)
- Neon (Serverless Postgres)
- Celery + Redis (async workers)
- Pydantic (validation)
- Anthropic Claude API (AI insights)

### Infrastructure
- Docker + Docker Compose
- GitHub Actions (CI/CD)
- Expo Notifications (push)

## Project Structure

```
finopt/
├── apps/
│   ├── mobile/          # React Native app
│   └── api/             # FastAPI backend
├── packages/
│   └── shared/          # Shared types, constants, validation
├── infra/               # Docker, deployment configs
├── docs/                # Architecture, API specs
└── docker-compose.yml
```

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11 or 3.12 (recommended: 3.12)
- Docker & Docker Compose (strongly recommended)
- Expo CLI (`npm install -g expo-cli`)
- Neon account (free tier available at neon.tech)

### Environment Setup

1. Copy environment files:
```bash
cp apps/api/.env.example apps/api/.env
cp apps/mobile/.env.example apps/mobile/.env
```

2. Update `.env` files with your credentials:
   - Neon database connection string
   - Anthropic API key
   - Redis connection

### Quick Setup with Scripts

**Automated setup (recommended):**

Linux/Mac:
```bash
chmod +x scripts/setup.sh scripts/test-setup.sh
./scripts/setup.sh
```

Windows:
```bash
scripts\setup.bat
```

**Manual Docker setup:**

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Test setup
./scripts/test-setup.sh  # Linux/Mac
scripts\test-setup.bat   # Windows

# Stop services
docker-compose down
```

Services:
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Redis: localhost:6379

**Detailed Docker guide:** See `docs/docker-guide.md`

### Running Locally

#### Backend
```bash
cd apps/api
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
alembic upgrade head
uvicorn src.presentation.api.main:app --reload
```

#### Worker
```bash
cd apps/api
celery -A src.infrastructure.workers.celery_app worker --loglevel=info
```

#### Mobile
```bash
cd apps/mobile
npm install
npm start
# Then press 'i' for iOS or 'a' for Android
```

## Database Migrations

```bash
cd apps/api
# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Testing

```bash
# Backend tests
cd apps/api
pytest

# Mobile tests
cd apps/mobile
npm test
```

## API Documentation

Interactive API docs available at: http://localhost:8000/docs

## Architecture

This project follows Clean Architecture principles:

- **Domain Layer**: Business entities and logic
- **Application Layer**: Use cases and business workflows
- **Infrastructure Layer**: External services, DB, workers
- **Presentation Layer**: API endpoints, DTOs

See `docs/architecture.md` for detailed information.

## AI Insights

The system uses Anthropic's Claude API to provide:
- Spending pattern analysis
- Subscription detection
- Savings recommendations (income-based)
- Budget optimization
- Anomaly detection
- Goal planning strategies

## Contributing

See `docs/contributing.md` for development guidelines.

## License

MIT
