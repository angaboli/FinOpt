# Finopt – Contexte projet

Application mobile de gestion de budget personnel multi-comptes, augmentée par IA.

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Backend | Python 3.12+, FastAPI, SQLAlchemy 2 (async), Alembic, PostgreSQL |
| Frontend | React Native + Expo (managed), TypeScript strict, Zustand, Axios |
| Tests backend | pytest, pytest-asyncio, HTTPX, coverage.py (seuil 85%) |
| Tests frontend | Jest, React Native Testing Library |
| Qualité | black, ruff, mypy, ESLint, Prettier, pre-commit |
| CI/CD | GitHub Actions |
| Docker | docker-compose.yml (PostgreSQL 16 local) |

## Architecture (strictement respectée)

### Backend – Clean / Hexagonal Architecture

```
backend/src/
  domain/          # Entités, Value Objects, exceptions métier, Ports (Protocoles)
  application/     # Use Cases (classe + méthode execute()), DTOs (dataclasses)
  infrastructure/  # SQLAlchemy models, repositories, security, settings
  presentation/    # Routes FastAPI, schemas Pydantic, dependencies (DI)
```

**Règle absolue** : le domaine n'importe jamais un module framework (FastAPI, SQLAlchemy, etc.).
Les variables d'env ne sont lues que dans `infrastructure/settings.py`.

### Frontend – Architecture en couches

```
frontend/src/
  domain/          # Types TypeScript métier (interfaces, types)
  application/     # Stores Zustand, hooks applicatifs
  infrastructure/  # Clients Axios (api/), stockage (storage/)
  presentation/    # Composants RN, écrans, navigation, thème
```

### Patterns utilisés

- **Repository Pattern** : accès données via interfaces (Protocoles Python), implémentations SQLAlchemy dans infrastructure
- **Use Case Pattern** : `class CreateFoo: def __init__(self, repo): ... async def execute(cmd) -> result`
- **DTOs** : `@dataclass(frozen=True)` pour commands/queries/results
- **Dependency Injection** : `FastAPI Depends()` dans presentation/dependencies.py
- **Zustand stores** : un store par domaine, méthodes async

## État des versions

| Version | Statut | Contenu |
|---------|--------|---------|
| V1 | ✅ Livré | Auth JWT (access + refresh token), squelette monorepo, CI, Docker |
| V2 | ✅ Livré | Port Figma → React Native, onboarding, dashboard, multi-account switcher mocké |
| V3 | ✅ Livré | Gestion multi-comptes réelle (Account CRUD, API /accounts, branché sur backend) |
| V4 | ✅ Livré | Revenus (IncomeSource CRUD, /income-sources) + Catégories (Category CRUD, /categories, défauts auto-seedés) |
| V5 | ✅ Livré | Transactions (Transaction CRUD, /transactions, TransactionsScreen, AddTransactionScreen, branché sur backend) |
| V6 | ✅ Livré | Budget mensuel (Budget entity, /budgets GET+PUT, BudgetScreen, SetBudgetScreen, tendance réelle mois/mois, barre progression budget, logo réel) |
| V7 | ✅ Livré | Import relevés bancaires (BankImport entity, POST /bank-imports, parser CSV multi-format, ImportScreen 3 étapes : coller → mapper colonnes → preview + catégories → confirmer) |
| V8 | ✅ Livré | Scan ticket OCR (Receipt entity, POST /receipts/scan Claude vision, POST /receipts, GET /receipts, ScanReceiptScreen expo-image-picker, store receiptsStore) |
| V9 | ✅ Livré | Conseils IA + objectifs d'épargne (SavingsGoal CRUD, /savings-goals, /budget-advice, SavingsGoalsScreen, AddSavingsGoalScreen, BudgetAdviceScreen, Claude Haiku conseils FR) |
| V10 | ✅ Livré | Notifications locales (expo-notifications, alerte budget >80%, milestone épargne), E2E intégration (budgets + savings-goals), durcissement production (security headers, request-ID logging, JSON structuré, /health, CORS configurable, migrations Alembic V6-V9) |

## Entités domaine (cibles)

- `User` ✅
- `Account` ✅ (courant, épargne, joint, investissement, espèces)
- `IncomeSource` ✅ V4 (nom, montant, fréquence : MONTHLY/WEEKLY/BIWEEKLY/QUARTERLY/ANNUAL/ONCE)
- `Category` ✅ V4 (nom, couleur, liée à l'utilisateur, avec défauts auto-seedés)
- `Transaction` ✅ V5 (liée Account + Category, montant, date, type income/expense)
- `Budget` ✅ V6 (mois/année, lignes par catégorie avec montant planifié, upsert via PUT /budgets)
- `Receipt` ✅ V8 (merchant, total, date, items OCR, transaction_id, scan via Claude Haiku vision)
- `BankImport` ✅ V7 (id, user_id, account_id, source_name, row_count, imported_count, created_at)
- `SavingsGoal` ✅ V9 (name, target_amount, current_amount, deadline, progress_ratio, remaining_amount)
- `BudgetAdvice` ✅ V9 (génération via Claude Haiku, analyse mensuelle FR)

## Convention TDD

Pour chaque fonctionnalité :
1. Test d'acceptation (integration) → rouge
2. Tests unitaires domaine/use cases → rouge
3. Implémentation minimale → vert
4. Refactor → vert
5. Tests composants/hooks frontend

## Conventions de nommage

- **Backend** : PEP 8, snake_case fonctions/variables, CamelCase classes, modules en minuscules
- **Frontend** : PascalCase composants, camelCase fonctions/variables, dossiers par domaine
- **Commits** : Conventional Commits (feat:, fix:, test:, refactor:)

## Fichiers clés

| Fichier | Rôle |
|---------|------|
| `backend/src/domain/exceptions.py` | Exceptions métier |
| `backend/src/domain/value_objects.py` | Value Objects (Email, UserId, AccountId…) |
| `backend/src/domain/ports/repositories.py` | Interfaces des repositories |
| `backend/src/infrastructure/models.py` | Modèles SQLAlchemy |
| `backend/src/infrastructure/repositories.py` | Implémentations repository |
| `backend/src/presentation/routes.py` | Routes FastAPI |
| `backend/src/presentation/dependencies.py` | Injection de dépendances |
| `backend/src/presentation/schemas.py` | Schémas Pydantic API |
| `frontend/App.tsx` | Root + navigation stack |
| `frontend/src/presentation/theme/theme.ts` | Design tokens (couleurs, spacing, radius) |

## Maquette Figma

Le dossier `Multi-Account Management Interface/` est une maquette web (React + Tailwind, non compatible RN).
Elle sert de **référence visuelle** uniquement. Le code ne peut pas être importé directement dans Expo.
URL Figma originale : https://www.figma.com/design/ztoLDtuwHgKITF9awPjoPX/Multi-Account-Management-Interface

## Démarrage local

```bash
# Backend
cd backend
docker-compose up -d          # PostgreSQL
pip install -e ".[dev]"
alembic upgrade head
uvicorn src.presentation.main:app --reload

# Tests backend
pytest --cov=src --cov-fail-under=85

# Frontend
cd frontend
npm install
npx expo start
```
