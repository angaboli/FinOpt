# FinOpt API — Documentation publique

Base URL: `https://<votre-backend>/` (ou `http://localhost:8000` en local)

Toutes les routes (sauf auth) requièrent un header :
```
Authorization: Bearer <access_token>
```

---

## Authentification

### `POST /auth/signup`
Créer un compte utilisateur.

**Body**
```json
{
  "email": "user@example.com",
  "password": "motdepasse123",
  "name": "Jean Dupont"
}
```

**Réponse 201**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "Jean Dupont"
}
```

---

### `POST /auth/login`
Obtenir les tokens d'accès.

**Body**
```json
{
  "email": "user@example.com",
  "password": "motdepasse123"
}
```

**Réponse 200**
```json
{
  "user": { "id": "uuid", "email": "user@example.com", "name": "Jean Dupont" },
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

---

### `POST /auth/refresh`
Renouveler l'access token avec le refresh token.

**Body**
```json
{ "refresh_token": "eyJ..." }
```

**Réponse 200** — même format que `/auth/login`

---

### `POST /auth/logout`
Révoquer le refresh token.

**Body**
```json
{ "refresh_token": "eyJ..." }
```

**Réponse 204** — pas de corps

---

### `GET /users/me`
Profil de l'utilisateur connecté.

**Réponse 200**
```json
{ "id": "uuid", "email": "user@example.com", "name": "Jean Dupont" }
```

---

## Comptes (`/accounts`)

### `GET /accounts`
Liste tous les comptes de l'utilisateur.

**Réponse 200**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Compte courant",
    "account_type": "CHECKING",
    "balance": "1500.00",
    "currency": "EUR",
    "color": "#6C47FF"
  }
]
```

Types disponibles : `CHECKING` | `SAVINGS` | `JOINT` | `INVESTMENT` | `CASH`

---

### `POST /accounts`
Créer un compte.

**Body**
```json
{
  "name": "Épargne livret A",
  "account_type": "SAVINGS",
  "balance": "5000.00",
  "currency": "EUR",
  "color": "#10B981"
}
```

**Réponse 201** — objet compte complet

---

### `PUT /accounts/{account_id}`
Modifier un compte existant.

**Body** — mêmes champs que `POST /accounts`

**Réponse 200** — objet compte mis à jour

---

### `DELETE /accounts/{account_id}`
Supprimer un compte.

**Réponse 204**

---

## Sources de revenus (`/income-sources`)

### `GET /income-sources`
Liste les revenus récurrents.

**Réponse 200**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Salaire",
    "amount": "2500.00",
    "frequency": "MONTHLY"
  }
]
```

Fréquences : `ONCE` | `WEEKLY` | `BIWEEKLY` | `MONTHLY` | `QUARTERLY` | `ANNUAL`

---

### `POST /income-sources`
Créer une source de revenu.

**Body**
```json
{
  "name": "Salaire",
  "amount": "2500.00",
  "frequency": "MONTHLY"
}
```

**Réponse 201**

---

### `PUT /income-sources/{source_id}`
Modifier une source de revenu.

**Réponse 200**

---

### `DELETE /income-sources/{source_id}`
Supprimer une source de revenu.

**Réponse 204**

---

## Catégories (`/categories`)

### `GET /categories`
Liste les catégories (inclut les défauts créés à l'inscription).

**Réponse 200**
```json
[
  { "id": "uuid", "user_id": "uuid", "name": "Alimentation", "color": "#F59E0B" }
]
```

---

### `POST /categories`
Créer une catégorie.

**Body**
```json
{ "name": "Transport", "color": "#3B82F6" }
```

**Réponse 201**

---

### `PUT /categories/{category_id}` / `DELETE /categories/{category_id}`
Modifier ou supprimer. Réponses 200 / 204.

---

## Transactions (`/transactions`)

### `GET /transactions`
Liste les transactions avec filtres optionnels.

**Query params**
| Param | Type | Description |
|-------|------|-------------|
| `account_id` | uuid | Filtrer par compte |
| `category_id` | uuid | Filtrer par catégorie |
| `from_date` | YYYY-MM-DD | Date début |
| `to_date` | YYYY-MM-DD | Date fin |
| `limit` | int (défaut 100) | Nombre max |
| `offset` | int (défaut 0) | Pagination |

**Réponse 200**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "account_id": "uuid",
    "category_id": "uuid",
    "title": "Carrefour",
    "amount": "45.20",
    "transaction_type": "EXPENSE",
    "date": "2025-05-07",
    "note": null
  }
]
```

---

### `POST /transactions`
Créer une transaction.

**Body**
```json
{
  "account_id": "uuid",
  "category_id": "uuid",
  "title": "Carrefour",
  "amount": "45.20",
  "transaction_type": "EXPENSE",
  "date": "2025-05-07",
  "note": null
}
```

`transaction_type` : `EXPENSE` | `INCOME`

**Réponse 201**

---

### `PUT /transactions/{transaction_id}`
Modifier une transaction.

**Réponse 200**

---

### `DELETE /transactions/{transaction_id}`
Supprimer une transaction.

**Réponse 204**

---

## Virements (`/transfers`)

### `POST /transfers`
Virement entre deux comptes de l'utilisateur. Crée automatiquement une dépense sur le compte source et un revenu sur le compte destination.

**Body**
```json
{
  "from_account_id": "uuid-source",
  "to_account_id": "uuid-destination",
  "category_id": "uuid",
  "amount": "200.00",
  "date": "2025-05-07",
  "note": null
}
```

**Réponse 201**
```json
{
  "debit_transaction_id": "uuid",
  "credit_transaction_id": "uuid"
}
```

---

## Budget mensuel (`/budgets`)

### `GET /budgets?year=2025&month=5`
Obtenir le budget du mois. Retourne `null` si aucun budget défini.

**Réponse 200**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "year": 2025,
  "month": 5,
  "lines": [
    {
      "category_id": "uuid",
      "planned_amount": "300.00"
    }
  ]
}
```

---

### `PUT /budgets`
Créer ou remplacer le budget d'un mois (upsert).

**Body**
```json
{
  "year": 2025,
  "month": 5,
  "lines": [
    { "category_id": "uuid", "planned_amount": "300.00" },
    { "category_id": "uuid2", "planned_amount": "150.00" }
  ]
}
```

**Réponse 200** — budget complet

---

## Import relevés bancaires (`/bank-imports`)

### `POST /bank-imports`
Importer des transactions depuis un CSV ou XLSX.

**Body**
```json
{
  "account_id": "uuid",
  "source_name": "BNP Paribas",
  "rows": [
    {
      "date": "2025-05-01",
      "title": "LIDL",
      "amount": -32.50,
      "transaction_type": "EXPENSE",
      "category_id": "uuid"
    }
  ]
}
```

**Réponse 201**
```json
{
  "id": "uuid",
  "account_id": "uuid",
  "source_name": "BNP Paribas",
  "row_count": 10,
  "imported_count": 10,
  "created_at": "2025-05-07T10:00:00Z"
}
```

---

### `POST /bank-imports/parse-pdf`
Extraire les transactions d'un PDF de relevé bancaire (via IA).

**Body**
```json
{
  "base64_content": "<base64 du PDF>",
  "filename": "releve_mai.pdf"
}
```

**Réponse 200**
```json
[
  { "date": "2025-05-01", "title": "LIDL", "amount": -32.50 }
]
```

---

## Scan tickets OCR (`/receipts`)

### `POST /receipts/scan`
Analyser une photo de ticket de caisse par IA (vision).

**Body**
```json
{
  "base64_image": "<base64>",
  "mime_type": "image/jpeg"
}
```

**Réponse 200**
```json
{
  "merchant": "Carrefour",
  "total": 47.30,
  "date": "2025-05-07",
  "items": [
    { "name": "Lait demi-écrémé", "amount": 1.20 },
    { "name": "Pain complet", "amount": 2.50 }
  ]
}
```

---

### `POST /receipts`
Enregistrer un ticket (après scan ou saisie manuelle).

**Body**
```json
{
  "merchant": "Carrefour",
  "total": 47.30,
  "date": "2025-05-07",
  "items": [
    { "name": "Lait demi-écrémé", "amount": 1.20, "category_id": "uuid" }
  ],
  "transaction_id": null
}
```

**Réponse 201**

---

### `GET /receipts`
Liste les tickets enregistrés.

**Réponse 200** — tableau de tickets

---

## Objectifs d'épargne (`/savings-goals`)

### `GET /savings-goals`
Liste les objectifs.

**Réponse 200**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Vacances",
    "target_amount": "2000.00",
    "current_amount": "650.00",
    "deadline": "2025-08-01",
    "progress_ratio": 0.325,
    "remaining_amount": "1350.00",
    "created_at": "2025-01-15T09:00:00Z"
  }
]
```

---

### `POST /savings-goals`
Créer un objectif.

**Body**
```json
{
  "name": "Vacances",
  "target_amount": "2000.00",
  "current_amount": "650.00",
  "deadline": "2025-08-01"
}
```

**Réponse 201**

---

### `PUT /savings-goals/{goal_id}`
Mettre à jour (progression, montant cible, deadline).

**Réponse 200**

---

### `DELETE /savings-goals/{goal_id}`
Supprimer un objectif.

**Réponse 204**

---

## Conseils IA (`/budget-advice`)

### `POST /budget-advice`
Générer une analyse financière personnalisée par IA (GPT-4o-mini).
Analyse les 6 derniers mois de transactions, les revenus réguliers, le budget et les objectifs.

**Body**
```json
{ "year": 2025, "month": 5 }
```

**Réponse 200**
```json
{
  "summary": "Votre solde net ce mois est positif de 320 €.",
  "tips": [
    "Réduire les dépenses restaurant de 20%.",
    "Activer les virements automatiques vers l'épargne.",
    "Comparer les abonnements streaming."
  ],
  "savings_advice": "Votre objectif Vacances est à 32%. Augmentez de 50 €/mois pour l'atteindre avant août.",
  "cut_suggestions": [],
  "merchant_plan": [
    {
      "merchant": "Lidl",
      "items": ["Épicerie", "Produits frais"],
      "reason": "20 €/achat en moyenne, le moins cher de vos enseignes habituelles"
    }
  ],
  "period_label": "Mai 2025",
  "sentiment": "positive"
}
```

`sentiment` : `positive` | `neutral` | `negative`

---

## Santé (`/health`)

### `GET /health`
Vérification de disponibilité du service. Pas d'authentification requise.

**Réponse 200**
```json
{ "status": "ok" }
```

---

## Codes d'erreur

| Code | Signification |
|------|---------------|
| 400 | Données invalides (validation Pydantic) |
| 401 | Token manquant ou expiré |
| 403 | Accès interdit à cette ressource |
| 404 | Ressource introuvable |
| 409 | Conflit (ex : email déjà utilisé) |
| 422 | Erreur de validation des champs |
| 500 | Erreur interne serveur |

**Format d'erreur standard**
```json
{ "detail": "Message d'erreur explicite" }
```

---

## Environnements

| Environnement | URL |
|---------------|-----|
| Production | `https://finoptv2.onrender.com` |
| Local | `http://localhost:8000` |

Documentation interactive Swagger disponible sur `/docs` (désactivée en production).
