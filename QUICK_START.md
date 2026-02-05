# 🚀 Démarrage Rapide - Finopt

Guide ultra-rapide pour lancer Finopt en 10 minutes.

## Prérequis

- ✅ Docker Desktop installé
- ✅ Node.js 18+ installé
- ✅ Git installé

## Étapes

### 1️⃣ Cloner le repo

```bash
git clone https://github.com/your-org/finopt.git
cd finopt
```

### 2️⃣ Créer compte Neon (gratuit)

1. Aller sur https://neon.tech
2. Créer un compte (gratuit)
3. Créer un nouveau projet
4. Copier la **Connection String** depuis le dashboard

Votre connection string ressemble à :
```
postgresql://username:password@ep-xxx.neon.tech/neondb?sslmode=require
```

### 3️⃣ Initialiser la base de données

1. Dans Neon Console → **SQL Editor**
2. Copier tout le contenu de `infra/supabase/schema.sql`
3. Coller et **Run** le SQL

### 4️⃣ Obtenir clé API Anthropic

1. Aller sur https://console.anthropic.com
2. Créer un compte
3. Générer une API key
4. Copier la clé (`sk-ant-...`)

### 5️⃣ Setup automatique

**Linux/Mac:**
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

**Windows:**
```bash
scripts\setup.bat
```

### 6️⃣ Configurer .env

Éditer `apps/api/.env` :

```env
# OBLIGATOIRE - Votre connection string Neon
DATABASE_URL=postgresql://username:password@ep-xxx.neon.tech/neondb?sslmode=require

# OBLIGATOIRE - Votre clé Anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx

# OBLIGATOIRE - Générer une clé secrète aléatoire
JWT_SECRET_KEY=votre-super-secret-key-change-this-in-production

# Le reste peut rester par défaut
REDIS_URL=redis://localhost:6379/0
```

💡 **Astuce**: Générer une clé JWT sécurisée :
```bash
# Linux/Mac
openssl rand -hex 32

# Python
python -c "import secrets; print(secrets.token_hex(32))"
```

### 7️⃣ Démarrer Docker

```bash
docker-compose up -d
```

Attendre ~30 secondes que tout démarre...

### 8️⃣ Tester le setup

**Linux/Mac:**
```bash
chmod +x scripts/test-setup.sh
./scripts/test-setup.sh
```

**Windows:**
```bash
scripts\test-setup.bat
```

**Ou manuellement:**
```bash
curl http://localhost:8000/health
```

Devrait retourner : `{"status":"healthy",...}`

### 9️⃣ Accéder à l'API

Ouvrir dans le navigateur :
- 📚 **API Docs**: http://localhost:8000/docs
- 📖 **ReDoc**: http://localhost:8000/redoc

### 🔟 Créer votre premier utilisateur

Dans l'API Docs (http://localhost:8000/docs) :

1. Cliquer sur **POST /api/v1/auth/signup**
2. Cliquer **Try it out**
3. Remplir :
```json
{
  "email": "test@example.com",
  "password": "SecurePassword123!",
  "full_name": "Test User"
}
```
4. Cliquer **Execute**
5. Copier le `access_token` de la réponse

**Ou en ligne de commande:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!",
    "full_name": "Test User"
  }'
```

### 1️⃣1️⃣ Lancer l'app mobile (optionnel)

```bash
cd apps/mobile
npm install
npm start
```

Puis :
- Presser `i` pour iOS simulator
- Presser `a` pour Android emulator
- Scanner le QR code avec Expo Go sur votre téléphone

---

## ✅ C'est tout !

Votre setup est complet. Vous pouvez maintenant :

### Développer

```bash
# Voir les logs
docker-compose logs -f

# Redémarrer l'API
docker-compose restart api

# Arrêter tout
docker-compose down
```

### Utiliser l'API

1. Se connecter et obtenir un token
2. Utiliser le token dans les requêtes :
```bash
curl http://localhost:8000/api/v1/accounts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

3. Ou utiliser l'interface interactive : http://localhost:8000/docs

### Créer des données

**Créer un compte:**
```bash
POST /api/v1/accounts
{
  "name": "Mon Compte Courant",
  "type": "CHECKING",
  "owner_scope": "PERSONAL",
  "currency": "EUR"
}
```

**Créer une transaction manuelle:**
```bash
POST /api/v1/transactions
{
  "account_id": "uuid-du-compte",
  "amount": -45.50,
  "date": "2024-01-15T14:30:00Z",
  "description": "Restaurant"
}
```

**Créer un budget:**
```bash
POST /api/v1/budgets
{
  "category_id": "uuid-de-categorie",
  "amount": 300,
  "period_start": "2024-01-01",
  "period_end": "2024-01-31"
}
```

---

## 🆘 Problèmes ?

### L'API ne démarre pas

```bash
# Vérifier les logs
docker-compose logs api

# Vérifier .env
cat apps/api/.env

# Redémarrer
docker-compose restart api
```

### Erreur de connexion à Neon

- Vérifier que `?sslmode=require` est dans DATABASE_URL
- Vérifier votre connexion internet
- Vérifier que l'IP est autorisée dans Neon Settings

### Port 8000 déjà utilisé

```bash
# Trouver le processus
lsof -i:8000  # Linux/Mac
netstat -ano | findstr :8000  # Windows

# Ou changer le port dans docker-compose.yml
ports:
  - "8001:8000"
```

### Tests échouent

```bash
# Attendre que tout soit prêt
sleep 30
./scripts/test-setup.sh
```

---

## 📚 Documentation complète

- 🐳 **Docker**: `docs/docker-guide.md`
- 📖 **Setup détaillé**: `docs/setup-guide.md`
- 🏗️ **Architecture**: `docs/architecture.md`
- 🔌 **API**: `docs/api.md`
- 🔄 **Migration Neon**: `docs/migration-neon.md`

---

## 🎯 Prochaines étapes

1. ✅ Créer plusieurs transactions
2. ✅ Créer des budgets
3. ✅ Générer des insights AI
4. ✅ Tester les notifications
5. ✅ Développer de nouvelles features

---

**Besoin d'aide ?** Consultez `docs/` ou créez une issue sur GitHub.

**Bon développement ! 🚀**
