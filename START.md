# 🚀 Démarrage Ultra-Rapide - Finopt

Tout est maintenant automatisé dans Docker! Vous n'avez plus qu'à lancer une commande.

## 📋 Prérequis

- Docker Desktop installé et démarré
- Compte Neon (gratuit) OU PostgreSQL local via Docker
- Clé API Anthropic

## ⚡ Démarrage avec Neon (Recommandé)

### 1. Créer votre .env

Copiez le fichier d'exemple et éditez-le:

```bash
cp apps/api/.env.example apps/api/.env
```

Éditez `apps/api/.env` avec vos informations:

```env
# OBLIGATOIRE - Votre connection string Neon
DATABASE_URL=postgresql://username:password@ep-xxx.neon.tech/neondb?sslmode=require

# OBLIGATOIRE - Votre clé Anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx

# OBLIGATOIRE - Générer une clé secrète
JWT_SECRET_KEY=votre-super-secret-key-genere-avec-openssl

# Le reste peut rester par défaut
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0
```

**Générer une clé JWT:**
```bash
openssl rand -hex 32
# ou
python -c "import secrets; print(secrets.token_hex(32))"
```

### 2. Lancer l'application

```bash
docker-compose up -d
```

**C'est tout!** 🎉

L'application va automatiquement:
- ✅ Démarrer Redis
- ✅ Se connecter à Neon
- ✅ Vérifier si la base de données existe
- ✅ Créer automatiquement le schéma si nécessaire
- ✅ Démarrer l'API
- ✅ Démarrer les workers Celery
- ✅ Démarrer Celery Beat

### 3. Vérifier que tout fonctionne

Attendez ~30 secondes, puis:

```bash
curl http://localhost:8000/health
```

Devrait retourner: `{"status":"healthy",...}`

### 4. Accéder à l'API

Ouvrez dans votre navigateur:
- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### 5. Créer votre premier utilisateur

Dans l'API Docs, ou avec curl:

```bash
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!",
    "full_name": "Test User"
  }'
```

### 6. Lancer l'app mobile

```bash
cd apps/mobile
npm install
npm start
```

---

## 🐘 Alternative: PostgreSQL Local

Si vous préférez utiliser PostgreSQL local au lieu de Neon:

```bash
docker-compose -f docker-compose.yml -f docker-compose.local-db.yml up -d
```

Pas besoin de configurer DATABASE_URL dans le .env, PostgreSQL local sera utilisé automatiquement.

---

## 📊 Commandes Utiles

### Voir les logs

```bash
# Tous les services
docker-compose logs -f

# API seulement
docker-compose logs -f api

# Worker seulement
docker-compose logs -f worker
```

### Redémarrer un service

```bash
docker-compose restart api
docker-compose restart worker
docker-compose restart beat
```

### Arrêter l'application

```bash
docker-compose down
```

### Arrêter et supprimer les données

```bash
docker-compose down -v
```

### Reconstruire les images

```bash
docker-compose build --no-cache
docker-compose up -d
```

---

## 🔍 Vérification de l'Initialisation

Lors du premier démarrage, vous verrez dans les logs de l'API:

```
🚀 Starting Finopt API initialization...
⏳ Waiting for database to be ready...
📡 Checking connection to ep-xxx.neon.tech:5432...
✅ Database is ready!
🔍 Checking if database schema is already applied...
📝 Database schema not found, applying schema...
📊 Applying database schema...
✅ Schema applied successfully!
🎉 Database initialization complete!
🚀 Starting application...
```

Les démarrages suivants afficheront:

```
🚀 Starting Finopt API initialization...
✅ Database is ready!
✅ Database schema already exists, skipping initialization
🎉 Database initialization complete!
🚀 Starting application...
```

---

## 🆘 Dépannage

### L'API ne démarre pas

```bash
# Vérifier les logs
docker-compose logs api

# Vérifier le .env
cat apps/api/.env
```

### Erreur de connexion à Neon

- Vérifiez que `?sslmode=require` est dans DATABASE_URL
- Vérifiez votre connexion internet
- Vérifiez que l'IP est autorisée dans Neon Settings

### Réinitialiser la base de données

**Avec Neon:**
1. Aller dans Neon Console → SQL Editor
2. Supprimer toutes les tables
3. Redémarrer: `docker-compose restart api`

**Avec PostgreSQL local:**
```bash
docker-compose down -v
docker-compose -f docker-compose.yml -f docker-compose.local-db.yml up -d
```

### Rebuilder après modifications du Dockerfile

```bash
docker-compose down
docker-compose build --no-cache api worker beat
docker-compose up -d
```

---

## 🎯 Prochaines Étapes

1. ✅ Créer des comptes
2. ✅ Créer des transactions
3. ✅ Créer des budgets
4. ✅ Tester l'app mobile
5. ✅ Générer des insights AI

---

**Tout est automatisé! Plus besoin de scripts manuels! 🎉**
