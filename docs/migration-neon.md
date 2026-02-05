# Migration Supabase → Neon - Résumé des Changements

## Changements effectués

### 1. Base de données

**Avant:** Supabase (Postgres avec auth intégré)
**Après:** Neon (Postgres serverless)

**Fichiers modifiés:**
- `infra/supabase/schema.sql` → Adapté pour fonctionner avec Neon
  - Supprimé les références `auth.users`
  - Ajouté `password_hash` à la table `users`
  - Modifié les triggers pour utiliser une fonction `current_user_id()`
  - Adapté RLS policies pour PostgreSQL standard

### 2. Backend - Connection

**Avant:** Client Supabase
**Après:** SQLAlchemy avec AsyncPG

**Fichiers modifiés:**
- `apps/api/src/infrastructure/database/connection.py`
  - Remplacé Supabase client par SQLAlchemy AsyncSession
  - Utilisé asyncpg pour connexion async
  - Pool NullPool pour serverless (recommandé Neon)

### 3. Backend - Authentication

**Avant:** Supabase Auth
**Après:** JWT custom avec passlib

**Fichiers modifiés:**
- `apps/api/src/presentation/api/routers/auth.py`
  - Implémenté signup/signin avec JWT
  - Hash passwords avec argon2
  - Token JWT généré manuellement

- `apps/api/src/presentation/api/dependencies.py`
  - Remplacé validation Supabase par validation JWT
  - Decode et vérifie JWT token

### 4. Backend - Repositories

**Avant:** Supabase client avec `.table().select()`
**Après:** SQLAlchemy avec raw SQL

**Fichiers modifiés:**
- `apps/api/src/infrastructure/repositories/transaction_repository_impl.py`
  - Remplacé appels Supabase par `text()` queries
  - Utilisé `AsyncSession` au lieu de `Client`
  - Adapté toutes les méthodes pour SQLAlchemy

### 5. Configuration

**Fichiers modifiés:**
- `apps/api/src/config.py`
  - Ajouté `neon_project_id`
  - Supprimé config Supabase

- `apps/api/.env.example`
  - Remplacé `SUPABASE_URL` par `DATABASE_URL`
  - Supprimé clés Supabase
  - Ajouté `NEON_PROJECT_ID`

- `apps/api/requirements.txt`
  - Supprimé `supabase`
  - Gardé `asyncpg`, `sqlalchemy`
  - Ajouté `argon2-cffi` pour hash passwords

### 6. Docker

**Fichiers modifiés:**
- `docker-compose.yml`
  - PostgreSQL local devient optionnel (profile `local-db`)
  - Services ne dépendent plus de postgres par défaut
  - Se connectent à Neon directement

- `apps/api/Dockerfile`
  - Mis à jour Python 3.11 → 3.12

### 7. Documentation

**Fichiers créés:**
- `docs/docker-guide.md` - Guide complet Docker
- `scripts/setup.sh` - Script setup automatisé (Linux/Mac)
- `scripts/setup.bat` - Script setup automatisé (Windows)
- `scripts/test-setup.sh` - Script test setup (Linux/Mac)
- `scripts/test-setup.bat` - Script test setup (Windows)
- `scripts/README.md` - Documentation des scripts

**Fichiers modifiés:**
- `README.md` - Mis à jour instructions
- `docs/setup-guide.md` - Ajouté section Docker et scripts
- `docs/architecture.md` - Adapté pour Neon
- `CONTRIBUTING.md` - Mentions de Neon

### 8. Mobile App

**Fichiers modifiés:**
- `apps/mobile/.env.example`
  - Supprimé références Supabase
  - API handle la connexion DB

- `apps/mobile/package.json`
  - Mis à jour versions Expo et React Navigation

## Avantages de Neon

✅ **Serverless**: Auto-scaling, pas de gestion de serveur
✅ **Branching**: Branches de base de données pour dev/test
✅ **Performance**: Connection pooling optimisé
✅ **Prix**: Free tier généreux, pay-per-use
✅ **Simplicité**: Pas besoin de gérer auth séparément

## Comment tester

### 1. Setup

```bash
# Utiliser le script automatisé
./scripts/setup.sh  # Linux/Mac
scripts\setup.bat   # Windows

# Ou manuellement
cp apps/api/.env.example apps/api/.env
# Éditer .env avec vos credentials Neon
```

### 2. Créer base de données Neon

1. Aller sur https://neon.tech
2. Créer un projet
3. Copier la connection string
4. Exécuter `infra/supabase/schema.sql` dans Neon SQL Editor

### 3. Démarrer

```bash
docker-compose up -d
```

### 4. Tester

```bash
# Test automatisé
./scripts/test-setup.sh  # Linux/Mac
scripts\test-setup.bat   # Windows

# Test manuel
curl http://localhost:8000/health
```

### 5. Créer un utilisateur

```bash
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "full_name": "Test User"
  }'
```

## Points d'attention

### Python Version
- ✅ Python 3.12 supporté
- ✅ Python 3.11 supporté
- ⚠️ Utiliser Docker pour éviter problèmes dépendances

### Database URL Format
- ✅ Doit inclure `?sslmode=require` pour Neon
- ✅ Exemple: `postgresql://user:pass@host.neon.tech/db?sslmode=require`
- ⚠️ asyncpg est ajouté automatiquement par le code

### RLS (Row Level Security)
- ✅ Activé avec `current_user_id()` function
- ⚠️ Application doit set `app.current_user_id` pour chaque requête
- 📝 TODO: Implémenter dans middleware

### Authentication
- ✅ JWT fonctionne
- ✅ Passwords hashés avec argon2
- ⚠️ Pas de reset password implémenté (TODO)
- ⚠️ Pas de email verification (TODO)

## Migration de données existantes

Si vous aviez déjà des données dans Supabase :

```bash
# 1. Export depuis Supabase
pg_dump "postgresql://..." > backup.sql

# 2. Adapter le SQL si nécessaire
# Supprimer références à auth.users, etc.

# 3. Import dans Neon
psql "postgresql://..." < backup.sql
```

## Prochaines étapes

- [ ] Implémenter middleware RLS avec `app.current_user_id`
- [ ] Ajouter reset password
- [ ] Ajouter email verification
- [ ] Compléter tous les repositories
- [ ] Tests end-to-end
- [ ] Documentation API endpoints complets

## Questions fréquentes

**Q: Puis-je revenir à Supabase ?**
A: Oui, gardez une branche avec Supabase. Les changements sont localisés.

**Q: Neon est-il plus cher que Supabase ?**
A: Non, Neon a un free tier et est souvent moins cher. Pay-per-use.

**Q: Dois-je migrer maintenant ?**
A: Non, Supabase fonctionne. Neon offre plus de flexibilité serverless.

**Q: Python 3.14 ?**
A: N'existe pas encore. Python 3.12 est la dernière version stable.

**Q: Docker obligatoire ?**
A: Fortement recommandé. Setup local possible mais plus complexe.

## Support

- 📖 Docs: `docs/`
- 🐳 Docker: `docs/docker-guide.md`
- 🔧 Setup: `docs/setup-guide.md`
- 🚀 Scripts: `scripts/README.md`
