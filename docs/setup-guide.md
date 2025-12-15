# Finopt Setup Guide

Complete guide to set up and run Finopt locally.

## Prerequisites

Ensure you have the following installed:

- **Node.js** 18+ and npm
- **Python** 3.11+
- **Docker** and Docker Compose
- **Expo CLI**: `npm install -g expo-cli`
- **Git**

## 1. Clone Repository

```bash
git clone https://github.com/your-org/finopt.git
cd finopt
```

## 2. Set Up Supabase

### Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and keys

### Run Database Schema

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `infra/supabase/schema.sql`
3. Execute the SQL

Your database is now ready with:
- All tables created
- Row Level Security enabled
- Triggers and functions set up
- Default categories inserted

## 3. Configure Environment Variables

### Backend (API)

```bash
cd apps/api
cp .env.example .env
```

Edit `apps/api/.env`:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database (from Supabase settings)
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# Anthropic AI
ANTHROPIC_API_KEY=your-anthropic-api-key

# JWT Secret (generate a secure random string)
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this

# Expo (optional for push notifications)
EXPO_ACCESS_TOKEN=your-expo-access-token
```

### Mobile App

```bash
cd apps/mobile
cp .env.example .env
```

Edit `apps/mobile/.env`:

```env
API_URL=http://localhost:8000/api/v1
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

## 4. Install Dependencies

### Root (Monorepo)

```bash
npm install
```

### Backend

```bash
cd apps/api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## 5. Running with Docker (Recommended)

The easiest way to run everything:

```bash
# From project root
docker-compose up -d
```

This starts:
- PostgreSQL (local dev database)
- Redis (for Celery)
- FastAPI backend (port 8000)
- Celery worker
- Celery beat (scheduler)

### Check Status

```bash
docker-compose ps
docker-compose logs -f
```

### Access Services

- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

## 6. Running Locally (Without Docker)

### Start Backend

Terminal 1 - API Server:
```bash
cd apps/api
source venv/bin/activate
uvicorn src.presentation.api.main:app --reload
```

Terminal 2 - Celery Worker:
```bash
cd apps/api
source venv/bin/activate
celery -A src.infrastructure.workers.celery_app worker --loglevel=info
```

Terminal 3 - Celery Beat (optional):
```bash
cd apps/api
source venv/bin/activate
celery -A src.infrastructure.workers.celery_app beat --loglevel=info
```

You'll also need Redis running:
```bash
docker run -p 6379:6379 redis:7-alpine
```

### Start Mobile App

```bash
cd apps/mobile
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your device

## 7. Create Your First User

### Using Supabase Dashboard

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user"
3. Enter email and password

### Using API

```bash
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!",
    "full_name": "Test User"
  }'
```

## 8. Test the API

### Get Health Status

```bash
curl http://localhost:8000/health
```

### Sign In

```bash
curl -X POST http://localhost:8000/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!"
  }'
```

Save the `access_token` from the response.

### Create an Account

```bash
curl -X POST http://localhost:8000/api/v1/accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Mon Compte Courant",
    "type": "CHECKING",
    "owner_scope": "PERSONAL",
    "currency": "EUR"
  }'
```

### Create a Transaction

```bash
curl -X POST http://localhost:8000/api/v1/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "account_id": "YOUR_ACCOUNT_ID",
    "amount": -45.50,
    "date": "2024-01-15T14:30:00Z",
    "description": "Déjeuner restaurant"
  }'
```

## 9. Generate AI Insights

After adding several transactions:

```bash
curl -X POST http://localhost:8000/api/v1/insights/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "month_year": "2024-01"
  }'
```

Then retrieve:

```bash
curl http://localhost:8000/api/v1/insights/2024-01 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 10. Run Tests

### Backend Tests

```bash
cd apps/api
pytest
```

With coverage:
```bash
pytest --cov=src --cov-report=html
```

### Mobile Tests

```bash
cd apps/mobile
npm test
```

## 11. Common Issues

### Database Connection Error

**Problem:** Cannot connect to database

**Solution:**
- Check Supabase is running
- Verify `DATABASE_URL` in `.env`
- Check network connectivity

### Redis Connection Error

**Problem:** Celery cannot connect to Redis

**Solution:**
```bash
docker run -p 6379:6379 redis:7-alpine
```

Or use Docker Compose.

### Anthropic API Error

**Problem:** Insights generation fails

**Solution:**
- Verify `ANTHROPIC_API_KEY` is valid
- Check API quota/limits
- Review error logs

### Mobile App Not Connecting

**Problem:** Mobile app cannot reach API

**Solution:**
- Check `API_URL` in mobile `.env`
- If using iOS Simulator: use `http://localhost:8000`
- If using Android Emulator: use `http://10.0.2.2:8000`
- If using physical device: use your computer's IP (e.g., `http://192.168.1.100:8000`)

### Port Already in Use

**Problem:** Port 8000 already in use

**Solution:**
```bash
# Find process
lsof -ti:8000

# Kill process
kill -9 $(lsof -ti:8000)
```

Or change port in `docker-compose.yml` or when running uvicorn.

## 12. Development Workflow

### Making Changes

1. Create a feature branch
```bash
git checkout -b feature/your-feature
```

2. Make changes and test

3. Run linters and type checks
```bash
npm run lint
npm run type-check
```

4. Run tests
```bash
npm test
```

5. Commit and push
```bash
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature
```

6. Create Pull Request

### Database Migrations

When modifying database schema:

1. Update `infra/supabase/schema.sql`
2. Apply changes in Supabase SQL Editor
3. Test locally
4. Document changes

For production: Use Supabase migrations or Alembic.

## 13. Debugging

### Backend Logs

```bash
# Docker
docker-compose logs -f api

# Local
# Logs print to stdout
```

### Worker Logs

```bash
# Docker
docker-compose logs -f worker

# Local
# Celery logs print to stdout
```

### Mobile Debugging

- Use Expo DevTools: press `d` in terminal
- React DevTools: press `shift + m`
- Console logs: `console.log()` in code

### Database Queries

Use Supabase Dashboard → Table Editor or SQL Editor to inspect data.

## 14. Next Steps

- **Add more transactions** to test the system
- **Create budgets** and test notifications
- **Generate insights** with AI
- **Set up goals** for financial planning
- **Customize categories** for your needs
- **Import bank statements** (implement parsers)
- **Enable push notifications** on mobile

## 15. Production Deployment

See `docs/deployment.md` for production deployment guide (create this file with specific deployment instructions for your infrastructure).

## 16. Getting Help

- Documentation: `docs/`
- API Docs: http://localhost:8000/docs
- Issues: GitHub Issues
- Architecture: `docs/architecture.md`
- API Reference: `docs/api.md`

## 17. Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Celery Documentation](https://docs.celeryq.dev/)
- [Anthropic API Documentation](https://docs.anthropic.com/)

---

**Happy coding! 🚀**

If you encounter issues not covered here, please check existing GitHub issues or create a new one.
