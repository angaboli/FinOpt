# Finopt API Documentation

## Base URL

```
Development: http://localhost:8000/api/v1
Production: https://api.finopt.app/api/v1
```

## Authentication

All endpoints (except auth endpoints) require Bearer token authentication.

```http
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### Sign Up

Create a new user account.

```http
POST /auth/signup
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "full_name": "John Doe"
}
```

**Response:** `201 Created`
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe"
  }
}
```

### Sign In

Authenticate existing user.

```http
POST /auth/signin
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:** `200 OK` (same as sign up)

### Sign Out

```http
POST /auth/signout
```

**Response:** `200 OK`

---

## Accounts Endpoints

### List Accounts

```http
GET /accounts
```

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "Compte Courant",
    "type": "CHECKING",
    "owner_scope": "PERSONAL",
    "currency": "EUR",
    "balance": 2543.67,
    "bank_name": "BNP Paribas",
    "iban_last4": "1234",
    "is_active": true,
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
]
```

### Create Account

```http
POST /accounts
```

**Request Body:**
```json
{
  "name": "Livret A",
  "type": "SAVINGS",
  "owner_scope": "PERSONAL",
  "currency": "EUR",
  "bank_name": "La Banque Postale",
  "iban_last4": "5678"
}
```

**Response:** `201 Created` (account object)

### Get Account

```http
GET /accounts/{account_id}
```

**Response:** `200 OK` (account object)

### Update Account

```http
PUT /accounts/{account_id}
```

**Request Body:**
```json
{
  "name": "Livret A - Épargne",
  "is_active": true
}
```

**Response:** `200 OK` (updated account)

### Delete Account

```http
DELETE /accounts/{account_id}
```

**Response:** `204 No Content`

---

## Transactions Endpoints

### List Transactions

```http
GET /transactions?account_id={id}&start_date={date}&end_date={date}&page=1&limit=20
```

**Query Parameters:**
- `account_id` (optional): Filter by account
- `category_id` (optional): Filter by category
- `start_date` (optional): ISO date (YYYY-MM-DD)
- `end_date` (optional): ISO date
- `search` (optional): Search in description
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "account_id": "uuid",
      "amount": -45.50,
      "currency": "EUR",
      "date": "2024-01-15T14:30:00Z",
      "description": "Restaurant Le Comptoir",
      "category_id": "uuid",
      "merchant_name": "Le Comptoir",
      "is_manual": true,
      "is_recurring": false,
      "status": "COMPLETED",
      "notes": "Déjeuner d'affaires",
      "tags": ["restaurant", "business"],
      "created_at": "2024-01-15T15:00:00Z",
      "updated_at": "2024-01-15T15:00:00Z"
    }
  ],
  "total": 157,
  "page": 1,
  "limit": 20,
  "total_pages": 8
}
```

### Create Transaction (Manual)

```http
POST /transactions
```

**Request Body:**
```json
{
  "account_id": "uuid",
  "amount": -35.99,
  "date": "2024-01-15T18:30:00Z",
  "description": "Courses Carrefour",
  "category_id": "uuid",
  "merchant_name": "Carrefour",
  "notes": "Courses hebdomadaires",
  "tags": ["groceries"]
}
```

**Response:** `201 Created` (transaction object)

### Get Transaction

```http
GET /transactions/{transaction_id}
```

**Response:** `200 OK` (transaction object)

### Update Transaction

```http
PUT /transactions/{transaction_id}
```

**Request Body:**
```json
{
  "amount": -38.50,
  "category_id": "uuid",
  "notes": "Updated note"
}
```

**Response:** `200 OK` (updated transaction)

**Note:** Only manual transactions can be updated.

### Delete Transaction

```http
DELETE /transactions/{transaction_id}
```

**Response:** `204 No Content`

**Note:** Soft delete. Only manual transactions can be deleted.

---

## Budgets Endpoints

### List Budgets

```http
GET /budgets?category_id={id}&is_active={bool}
```

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "category_id": "uuid",
    "amount": 300.00,
    "period_start": "2024-01-01",
    "period_end": "2024-01-31",
    "warning_threshold": 0.80,
    "critical_threshold": 1.00,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

### Create Budget

```http
POST /budgets
```

**Request Body:**
```json
{
  "category_id": "uuid",
  "amount": 500.00,
  "period_start": "2024-02-01",
  "period_end": "2024-02-29",
  "warning_threshold": 0.85,
  "critical_threshold": 1.00
}
```

**Response:** `201 Created` (budget object)

### Get Budget Consumption

```http
GET /budgets/{budget_id}/consumption
```

**Response:** `200 OK`
```json
{
  "budget_id": "uuid",
  "budget_amount": 300.00,
  "spent": 247.50,
  "percentage": 82.5
}
```

### Update Budget

```http
PUT /budgets/{budget_id}
```

**Request Body:**
```json
{
  "amount": 350.00,
  "warning_threshold": 0.90
}
```

**Response:** `200 OK` (updated budget)

### Delete Budget

```http
DELETE /budgets/{budget_id}
```

**Response:** `204 No Content`

---

## Insights Endpoints

### Generate Insights

Trigger AI insights generation for a specific month.

```http
POST /insights/generate
```

**Request Body:**
```json
{
  "month_year": "2024-01"
}
```

**Response:** `202 Accepted`
```json
{
  "message": "Insight generation started",
  "task_id": "celery-task-id"
}
```

**Note:** Processing is asynchronous. Poll the GET endpoint to retrieve results.

### Get Insights

```http
GET /insights/{month_year}
```

**Example:** `GET /insights/2024-01`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "month_year": "2024-01",
  "data": {
    "month": "2024-01",
    "currency": "EUR",
    "income_estimate": 3200.00,
    "fixed_costs_estimate": 1450.00,
    "savings_opportunities": [
      {
        "title": "Réduire les livraisons",
        "estimated_monthly_saving": 80.00,
        "confidence": 0.74,
        "evidence": ["UberEats 6x", "Deliveroo 4x"]
      }
    ],
    "saving_strategies": [
      {
        "strategy": "Épargne automatique 10%",
        "amount": 320.00,
        "why": "Marge confortable après charges fixes",
        "confidence": 0.82
      }
    ],
    "subscriptions": [
      {
        "merchant": "Netflix",
        "amount": 13.49,
        "period": "monthly",
        "confidence": 0.95
      }
    ],
    "anomalies": [],
    "budget_adjustments": [
      {
        "category": "Restaurants",
        "action": "decrease",
        "amount": 50.00,
        "reason": "Dépassement 3 mois consécutifs"
      }
    ],
    "avoid_spending_triggers": [
      {
        "pattern": "Achats en ligne le soir",
        "description": "7 achats entre 21h-23h",
        "frequency": 7,
        "total_amount": 320.00,
        "advice": "Désactiver notifications shopping après 20h"
      }
    ],
    "next_actions": [
      "Mettre en place un virement automatique de 320€ vers épargne",
      "Évaluer l'utilité de Netflix (2 vues ce mois)"
    ]
  },
  "generated_at": "2024-02-01T08:00:00Z"
}
```

### List Insights

```http
GET /insights?limit=12
```

**Response:** `200 OK` (array of insight objects)

---

## Notifications Endpoints

### List Notifications

```http
GET /notifications?is_read={bool}&page=1&limit=20
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "BUDGET_WARNING",
      "title": "Budget Restaurants : Attention",
      "body": "Vous avez atteint 85% de votre budget (255€ / 300€)",
      "data": {
        "budget_id": "uuid",
        "category_id": "uuid",
        "spent": 255.00,
        "budget_amount": 300.00,
        "percentage": 85.0
      },
      "is_read": false,
      "created_at": "2024-01-28T16:30:00Z"
    }
  ],
  "total": 23,
  "page": 1,
  "limit": 20
}
```

### Mark as Read

```http
PUT /notifications/{notification_id}/read
```

**Response:** `204 No Content`

### Mark All as Read

```http
PUT /notifications/read-all
```

**Response:** `204 No Content`

### Get Notification Preferences

```http
GET /notifications/preferences
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "budget_warnings_enabled": true,
  "budget_exceeded_enabled": true,
  "anomaly_alerts_enabled": true,
  "insights_enabled": true,
  "warning_threshold": 0.80,
  "critical_threshold": 1.00,
  "push_token": "ExponentPushToken[xxx]",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

### Update Preferences

```http
PUT /notifications/preferences
```

**Request Body:**
```json
{
  "budget_warnings_enabled": false,
  "warning_threshold": 0.85,
  "push_token": "ExponentPushToken[new-token]"
}
```

**Response:** `200 OK` (updated preferences)

---

## Goals Endpoints

### List Goals

```http
GET /goals?status={status}
```

**Query Parameters:**
- `status` (optional): ACTIVE, PAUSED, COMPLETED, CANCELLED

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "title": "Épargner pour vacances",
    "description": "Voyage en Italie cet été",
    "target_amount": 2000.00,
    "current_amount": 450.00,
    "target_date": "2024-07-01",
    "priority": 1,
    "status": "ACTIVE",
    "plan": {
      "monthly_saving_target": 350.00,
      "budget_caps": [
        {
          "category_id": "uuid",
          "max_amount": 200.00,
          "reason": "Réduire sorties restaurants"
        }
      ],
      "arbitration_rules": [
        "Prioriser épargne avant achats non essentiels"
      ],
      "generated_at": "2024-01-15T10:00:00Z"
    },
    "progress_percentage": 22.5,
    "created_at": "2024-01-15T10:00:00Z"
  }
]
```

### Create Goal

```http
POST /goals
```

**Request Body:**
```json
{
  "title": "Fonds d'urgence",
  "description": "3 mois de dépenses",
  "target_amount": 4500.00,
  "target_date": "2024-12-31",
  "priority": 1,
  "linked_account_id": "uuid"
}
```

**Response:** `201 Created` (goal object)

### Get Goal

```http
GET /goals/{goal_id}
```

**Response:** `200 OK` (goal object)

### Generate Goal Plan

Trigger AI to generate a savings plan for achieving the goal.

```http
POST /goals/{goal_id}/generate-plan
```

**Response:** `200 OK`
```json
{
  "plan": {
    "monthly_saving_target": 400.00,
    "budget_caps": [...],
    "arbitration_rules": [...],
    "generated_at": "2024-01-15T12:00:00Z"
  }
}
```

### Update Goal

```http
PUT /goals/{goal_id}
```

**Request Body:**
```json
{
  "current_amount": 850.00,
  "status": "ACTIVE"
}
```

**Response:** `200 OK` (updated goal)

### Delete Goal

```http
DELETE /goals/{goal_id}
```

**Response:** `204 No Content`

---

## Error Responses

### 400 Bad Request

```json
{
  "detail": "Validation error message"
}
```

### 401 Unauthorized

```json
{
  "detail": "Authentication failed"
}
```

### 403 Forbidden

```json
{
  "detail": "Insufficient permissions"
}
```

### 404 Not Found

```json
{
  "detail": "Resource not found"
}
```

### 422 Unprocessable Entity

```json
{
  "detail": [
    {
      "loc": ["body", "amount"],
      "msg": "value must be a number",
      "type": "type_error.float"
    }
  ]
}
```

### 500 Internal Server Error

```json
{
  "detail": "Internal server error"
}
```

---

## Rate Limiting

- Default: 100 requests per minute per user
- Insights generation: 10 requests per hour
- Headers:
  - `X-RateLimit-Limit`: Max requests
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

---

## Webhook Events (Future)

Future support for webhooks:
- `budget.threshold_reached`
- `transaction.created`
- `insight.generated`
- `goal.completed`

---

## Interactive Documentation

Visit `/docs` for interactive Swagger UI documentation.
Visit `/redoc` for ReDoc documentation.
