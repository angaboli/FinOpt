# Docker Setup Guide - Finopt

Guide complet pour exécuter Finopt avec Docker (recommandé).

## Prérequis

- Docker Desktop installé
- Compte Neon (gratuit sur neon.tech)
- Clé API Anthropic

## Configuration Rapide

### 1. Configuration de la base de données Neon

```bash
# 1. Créez un compte sur https://neon.tech
# 2. Créez un nouveau projet
# 3. Copiez votre connection string depuis le dashboard
```

Votre connection string ressemblera à :
```
postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### 2. Initialiser la base de données

1. Allez dans Neon Console → SQL Editor
2. Copiez le contenu de `infra/supabase/schema.sql`
3. Exécutez le SQL

### 3. Configuration des variables d'environnement

```bash
# Copiez le fichier d'exemple
cp apps/api/.env.example apps/api/.env
```

Éditez `apps/api/.env` :
```env
# Database (OBLIGATOIRE - utilisez votre connection string Neon)
DATABASE_URL=postgresql://username:password@your-project.neon.tech/neondb?sslmode=require

# AI (OBLIGATOIRE)
ANTHROPIC_API_KEY=sk-ant-xxxxx

# JWT (OBLIGATOIRE - générez une clé sécurisée)
JWT_SECRET_KEY=votre-super-secret-key-change-this-in-production

# Le reste peut rester par défaut
```

### 4. Démarrage avec Docker

```bash
# Démarrer tous les services
docker-compose up -d

# Vérifier que tout fonctionne
docker-compose ps

# Voir les logs
docker-compose logs -f
```

Services démarrés :
- ✅ Redis (port 6379)
- ✅ API FastAPI (port 8000)
- ✅ Celery Worker
- ✅ Celery Beat

## Vérification

### 1. Tester l'API

```bash
# Health check
curl http://localhost:8000/health

# Devrait retourner :
# {"status":"healthy","app":"Finopt","version":"1.0.0","environment":"development"}
```

### 2. Accéder à la documentation

Ouvrez dans votre navigateur :
- API Docs : http://localhost:8000/docs
- ReDoc : http://localhost:8000/redoc

### 3. Créer votre premier utilisateur

```bash
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!",
    "full_name": "Test User"
  }'
```

Vous recevrez un `access_token` - gardez-le pour les prochaines requêtes.

## Commandes Utiles

### Gestion des conteneurs

```bash
# Démarrer
docker-compose up -d

# Arrêter
docker-compose down

# Redémarrer un service
docker-compose restart api

# Voir les logs d'un service
docker-compose logs -f api
docker-compose logs -f worker

# Voir tous les logs
docker-compose logs -f

# Rebuild après modification du code
docker-compose up -d --build
```

### Debugging

```bash
# Entrer dans le conteneur API
docker-compose exec api bash

# Entrer dans le conteneur Worker
docker-compose exec worker bash

# Exécuter des commandes Python
docker-compose exec api python -c "from src.config import settings; print(settings.database_url)"
```

### Nettoyage

```bash
# Arrêter et supprimer les conteneurs
docker-compose down

# Arrêter et supprimer les volumes (⚠️ supprime les données Redis)
docker-compose down -v

# Supprimer les images
docker-compose down --rmi all
```

## Mode Local Database (Optionnel)

Si vous préférez utiliser PostgreSQL local au lieu de Neon :

```bash
# Démarrer avec PostgreSQL local
docker-compose --profile local-db up -d

# Modifier DATABASE_URL dans .env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/finopt
```

⚠️ **Note** : Ce mode nécessite d'initialiser le schéma localement :
```bash
docker-compose exec postgres psql -U postgres -d finopt < infra/supabase/schema.sql
```

## Développement avec Hot Reload

Le setup Docker inclut le hot reload :

1. Modifiez le code dans `apps/api/src/`
2. L'API redémarre automatiquement
3. Vérifiez les logs : `docker-compose logs -f api`

## Problèmes Courants

### Port 8000 déjà utilisé

```bash
# Trouver le processus
lsof -i:8000

# Arrêter le processus ou changer le port dans docker-compose.yml
ports:
  - "8001:8000"  # Utilise le port 8001 à la place
```

### Erreur de connexion à Neon

**Problème** : `could not connect to server`

**Solutions** :
1. Vérifiez que `sslmode=require` est dans votre DATABASE_URL
2. Vérifiez votre connexion internet
3. Vérifiez que votre IP n'est pas bloquée dans Neon Settings → IP Allow
4. Le format doit être : `postgresql+asyncpg://...` (asyncpg ajouté automatiquement)

### Worker ne démarre pas

```bash
# Vérifier les logs
docker-compose logs worker

# Redémarrer le worker
docker-compose restart worker
```

### Redis connection refused

```bash
# Vérifier que Redis tourne
docker-compose ps redis

# Redémarrer Redis
docker-compose restart redis
```

## Architecture Docker

```
┌─────────────────────────────────────────┐
│             Docker Network              │
│                                         │
│  ┌──────────┐    ┌──────────┐         │
│  │   API    │◄───┤  Redis   │         │
│  │  :8000   │    │  :6379   │         │
│  └────┬─────┘    └─────▲────┘         │
│       │                 │               │
│       │          ┌──────┴────┐         │
│       │          │  Worker   │         │
│       │          └───────────┘         │
│       │                                 │
│       │          ┌───────────┐         │
│       └─────────►│   Beat    │         │
│                  └───────────┘         │
│                                         │
│         ▼                               │
│    [Neon DB]                           │
│   (externe)                            │
└─────────────────────────────────────────┘
```

## Monitoring

### Voir les ressources utilisées

```bash
docker stats
```

### Logs structurés

Tous les services loggent en JSON pour faciliter le parsing :
```bash
docker-compose logs api | grep "ERROR"
```

## Production

Pour la production, consultez `docs/deployment.md` pour :
- Configuration des secrets
- Scaling horizontal
- Health checks
- Monitoring avec Prometheus/Grafana
- Déploiement sur AWS ECS, GCP Cloud Run, etc.

## Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs : `docker-compose logs -f`
2. Vérifiez la configuration : `docker-compose config`
3. Redémarrez : `docker-compose restart`
4. Consultez la documentation : `docs/`

---

**Astuce** : Ajoutez ces alias à votre `.bashrc` ou `.zshrc` :

```bash
alias dcup='docker-compose up -d'
alias dcdown='docker-compose down'
alias dclogs='docker-compose logs -f'
alias dcps='docker-compose ps'
alias dcrestart='docker-compose restart'
```

Ensuite vous pouvez simplement :
```bash
dcup      # Démarrer
dclogs    # Voir les logs
dcps      # Statut
dcdown    # Arrêter
```
