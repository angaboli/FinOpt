# Finopt

Application mobile de gestion de budget personnel multi-comptes, augmentée par IA.

![Python](https://img.shields.io/badge/Python-3.12%2B-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2-D71F00?logo=sqlalchemy&logoColor=white)
![Alembic](https://img.shields.io/badge/Alembic-migrations-6BA81E)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-0.76-61DAFB?logo=react&logoColor=black)
![Expo](https://img.shields.io/badge/Expo-54-000020?logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-5-FF6B35)
![Axios](https://img.shields.io/badge/Axios-1-5A29E4?logo=axios&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-CI-2088FF?logo=githubactions&logoColor=white)
![pytest](https://img.shields.io/badge/pytest-coverage%2085%25-0A9EDC?logo=pytest&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-tests-C21325?logo=jest&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow)

## Structure

```
backend/src/
  domain/          # Entités, Value Objects, exceptions métier, Ports
  application/     # Use Cases, DTOs
  infrastructure/  # SQLAlchemy, repositories, settings, JWT
  presentation/    # Routes FastAPI, schemas Pydantic, DI

frontend/src/
  domain/          # Types TypeScript métier
  application/     # Stores Zustand, hooks applicatifs
  infrastructure/  # Clients Axios, stockage SecureStore
  presentation/    # Composants RN, écrans, thème
```

## Backend Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
```

Variables d'environnement (`.env` ou PowerShell) :

```powershell
$env:FINOPT_DATABASE_URL="postgresql+asyncpg://finopt:finopt@localhost:5432/finopt"
$env:FINOPT_JWT_SECRET_KEY="replace-with-a-long-secret"
```

Démarrage :

```powershell
docker compose up db          # PostgreSQL
alembic upgrade head          # migrations
uvicorn src.presentation.main:app --reload --host 0.0.0.0 --port 8000
```

> **Important** : utiliser `--host 0.0.0.0` pour que l'app mobile (Expo Go sur téléphone physique) puisse joindre le serveur sur le réseau local.

Checks qualité :

```powershell
cd backend
ruff check .
black --check .
mypy src
coverage run -m pytest
coverage report
```

## Frontend Setup

Créer `frontend/.env` :

```
EXPO_PUBLIC_API_URL=http://<IP_LOCAL_MACHINE>:8000
```

> Remplacer `<IP_LOCAL_MACHINE>` par l'IP locale de votre machine (ex. `192.168.1.199`). Trouver avec `ipconfig` (Windows) ou `ifconfig` (Mac/Linux).

```powershell
cd frontend
npm install
npx expo start
```

Checks qualité :

```powershell
cd frontend
npm run lint
npm run typecheck
npm test
```

## API

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/auth/signup` | Créer un compte |
| POST | `/auth/login` | Obtenir access + refresh tokens |
| POST | `/auth/refresh` | Renouveler l'access token |
| POST | `/auth/logout` | Révoquer le refresh token |
| GET | `/users/me` | Profil utilisateur |
| GET/POST | `/accounts` | Comptes bancaires |
| GET/POST | `/income-sources` | Sources de revenus |
| GET/POST | `/categories` | Catégories |
| GET/POST | `/transactions` | Transactions |
| GET/PUT | `/budgets` | Budget mensuel |
| POST | `/bank-imports` | Import relevé CSV |
| POST | `/receipts/scan` | Scan ticket (OCR Claude vision) |
| GET/POST | `/savings-goals` | Objectifs d'épargne |
| POST | `/budget-advice` | Conseils IA (Claude Haiku) |
| GET | `/health` | Statut du service |

## Quality Gates

- Backend coverage ≥ 85 % (pytest-cov)
- CI : lint + typecheck + tests (backend & frontend)
