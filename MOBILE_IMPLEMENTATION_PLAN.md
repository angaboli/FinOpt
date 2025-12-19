# 📱 Plan d'Implémentation - App Mobile Finopt

## 📸 Vue d'ensemble du Design

Basé sur les 5 captures d'écran fournies, voici l'analyse complète:

### Écrans à Implémenter

1. **Home/Dashboard** (screen1.png)
2. **Transactions** (screen2.png)
3. **Budgets** (screen3.png)
4. **Goals** (screen4.png)
5. **Settings** (screen5.png)

---

## 🎨 Analyse Détaillée des Écrans

### 1️⃣ Home/Dashboard Screen

**Éléments UI:**
- Header avec salutation ("Good morning") et titre "Your Finances"
- Carte principale "Total Balance" avec:
  - Montant principal ($12,450)
  - Stats du mois en cours ($+1,530)
  - Comparaison avec le mois dernier (+8.5%)
  - Background turquoise/teal
- Deux petites cartes côte à côte:
  - Income avec icône (flèche vers le bas verte)
  - Expenses avec icône (flèche vers le haut rouge)
- Section "AI Insight" avec:
  - Icône d'intelligence artificielle
  - Message personnalisé
  - Lien "View all insights →"
- Section "Top Spending" avec:
  - Titre + lien "See all"
  - Liste de catégories avec icônes et montants
  - Exemple: Shopping $1,240
- Floating Action Button (FAB) "+" en bas à droite
- Bottom Navigation Bar avec 5 onglets

**Données Requises:**
- Solde total des comptes
- Total income du mois
- Total expenses du mois
- Insights AI
- Top catégories de dépenses

**API Endpoints:**
- `GET /api/v1/accounts` - Liste des comptes
- `GET /api/v1/insights` - Insights AI
- `GET /api/v1/analytics/spending-by-category` - Top spending

---

### 2️⃣ Transactions Screen

**Éléments UI:**
- Titre "Transactions"
- Barre de recherche avec placeholder "Search transactions..."
- Bouton filtre (icône entonnoir)
- Liste groupée par date (Today, Yesterday, Dec 15, etc.)
- Items de transaction avec:
  - Icône de catégorie colorée
  - Nom de la transaction
  - Catégorie en petit texte gris
  - Montant à droite (rouge pour dépenses, vert pour revenus)
- FAB "+" pour ajouter une transaction
- Bottom Navigation Bar

**Données Requises:**
- Liste complète des transactions
- Catégories
- Icônes par catégorie

**API Endpoints:**
- `GET /api/v1/transactions` - Liste paginée
- `GET /api/v1/transactions?search=query` - Recherche
- `GET /api/v1/categories` - Catégories

**Fonctionnalités:**
- Recherche en temps réel
- Filtrage par date/catégorie/montant
- Scroll infini (pagination)
- Pull to refresh

---

### 3️⃣ Budgets Screen

**Éléments UI:**
- Titre "Budgets"
- Section "Overall Budget":
  - Pourcentage d'utilisation (90%)
  - Barre de progression horizontale (noir/gris)
  - Texte "$2,870 spent of $3,200"
- Section "Categories":
  - Liste de budgets par catégorie
  - Chaque budget contient:
    - Icône de catégorie
    - Nom de la catégorie
    - Pourcentage à droite
    - Montant dépensé / montant total
    - Barre de progression
    - Texte "remaining" ou "over budget" (en rouge si dépassé)
- Codes couleur:
  - Noir pour les barres normales
  - Rouge pour les dépassements
  - Rouge pour le texte "over budget"
- Bottom Navigation Bar

**Données Requises:**
- Budget global
- Budgets par catégorie
- Dépenses actuelles par catégorie

**API Endpoints:**
- `GET /api/v1/budgets` - Liste des budgets
- `GET /api/v1/budgets/summary` - Résumé global

**Fonctionnalités:**
- Calcul automatique des pourcentages
- Alertes visuelles pour dépassements
- Tap sur une catégorie pour voir les détails

---

### 4️⃣ Goals Screen

**Éléments UI:**
- Titre "Financial Goals"
- Sous-titre "Track your progress towards financial freedom"
- Bouton "+" en haut à droite pour créer un goal
- Liste de cards de goals:
  - Icône personnalisée avec background coloré
  - Nom du goal
  - Date cible
  - Montant actuel / montant cible
  - Barre de progression (noir/gris)
  - Pourcentage complété + montant restant
  - Bouton "Add funds" (turquoise)
- Bottom Navigation Bar

**Exemples de Goals:**
- Emergency Fund (icône bâtiment)
- Vacation to Japan (icône avion)
- New Laptop (icône ordinateur)

**Données Requises:**
- Liste des goals
- Progrès de chaque goal

**API Endpoints:**
- `GET /api/v1/goals` - Liste des goals
- `POST /api/v1/goals` - Créer un goal
- `PATCH /api/v1/goals/:id/add-funds` - Ajouter des fonds

**Fonctionnalités:**
- Créer un nouveau goal
- Ajouter des fonds à un goal
- Calculer automatiquement les pourcentages
- Voir l'historique des contributions

---

### 5️⃣ Settings Screen

**Éléments UI:**
- Titre "Settings"
- Section profil:
  - Avatar (cercle turquoise avec icône utilisateur)
  - Nom (Sarah Johnson)
  - Email (sarah.j@email.com)
  - Bouton "Edit" (turquoise)
- Section "Account":
  - Profile (avec icône et chevron)
  - Privacy & Security (avec icône et chevron)
- Section "Preferences":
  - Notifications (avec toggle switch)
- Section "Support":
  - Help Center (avec icône et chevron)
  - Terms & Privacy (avec icône et chevron)
- Version app "FinOpt Version 1.0.0"
- Bouton "Log Out" (rouge, outline)
- Bottom Navigation Bar

**Données Requises:**
- Informations utilisateur
- Préférences

**API Endpoints:**
- `GET /api/v1/users/me` - Profil utilisateur
- `PATCH /api/v1/users/me` - Mettre à jour le profil
- `POST /api/v1/auth/logout` - Déconnexion

**Fonctionnalités:**
- Éditer le profil
- Modifier les préférences
- Gérer les notifications
- Déconnexion

---

## 🧩 Composants Réutilisables à Créer

### 1. **BalanceCard** (Grande carte turquoise)
```tsx
Props: {
  amount: number
  thisMonth: number
  vsLastMonth: string
  currency?: string
}
```

### 2. **StatCard** (Petites cartes Income/Expenses)
```tsx
Props: {
  title: string
  amount: number
  icon: IconName
  iconColor: string
}
```

### 3. **InsightCard** (Carte AI Insight)
```tsx
Props: {
  message: string
  onViewAll: () => void
}
```

### 4. **TransactionItem** (Item de transaction)
```tsx
Props: {
  icon: string
  iconColor: string
  name: string
  category: string
  amount: number
  date: Date
  onPress?: () => void
}
```

### 5. **BudgetCategoryCard** (Carte de budget par catégorie)
```tsx
Props: {
  category: string
  icon: string
  iconColor: string
  spent: number
  total: number
  percentage: number
  isOverBudget: boolean
}
```

### 6. **ProgressBar** (Barre de progression)
```tsx
Props: {
  percentage: number
  color?: string
  backgroundColor?: string
  height?: number
}
```

### 7. **GoalCard** (Carte de goal)
```tsx
Props: {
  icon: string
  iconColor: string
  title: string
  targetDate: Date
  current: number
  target: number
  percentage: number
  onAddFunds: () => void
}
```

### 8. **SettingsItem** (Item de paramètre)
```tsx
Props: {
  icon: string
  title: string
  hasChevron?: boolean
  hasToggle?: boolean
  toggleValue?: boolean
  onToggle?: (value: boolean) => void
  onPress?: () => void
}
```

### 9. **FAB** (Floating Action Button)
```tsx
Props: {
  onPress: () => void
  icon?: string
}
```

### 10. **SearchBar** (Barre de recherche)
```tsx
Props: {
  placeholder: string
  value: string
  onChangeText: (text: string) => void
  onFilterPress?: () => void
}
```

---

## 🎨 Design System

### Couleurs Principales
```typescript
const colors = {
  primary: '#14B8A6',      // Turquoise (boutons, FAB, liens)
  primaryDark: '#0D9488',  // Turquoise foncé

  success: '#10B981',      // Vert (revenus)
  danger: '#EF4444',       // Rouge (dépenses, over budget)
  warning: '#F59E0B',      // Orange

  background: '#F9FAFB',   // Gris très clair (background)
  card: '#FFFFFF',         // Blanc (cartes)

  text: {
    primary: '#111827',    // Noir (titres)
    secondary: '#6B7280',  // Gris (sous-textes)
    tertiary: '#9CA3AF',   // Gris clair
  },

  border: '#E5E7EB',       // Gris très clair (bordures)
}
```

### Typographie
```typescript
const typography = {
  h1: { fontSize: 28, fontWeight: '700' },      // Titres d'écrans
  h2: { fontSize: 24, fontWeight: '600' },      // Sous-titres
  h3: { fontSize: 18, fontWeight: '600' },      // Section titles
  body: { fontSize: 16, fontWeight: '400' },    // Texte normal
  bodyBold: { fontSize: 16, fontWeight: '600' },
  small: { fontSize: 14, fontWeight: '400' },   // Petits textes
  tiny: { fontSize: 12, fontWeight: '400' },    // Très petits textes
  amount: { fontSize: 36, fontWeight: '700' },  // Gros montants
}
```

### Espacements
```typescript
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
}
```

### Border Radius
```typescript
const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
}
```

---

## 📦 Structure des Dossiers

```
apps/mobile/
├── src/
│   ├── components/          # Composants réutilisables
│   │   ├── common/          # Boutons, inputs, etc.
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── FAB.tsx
│   │   │   └── SearchBar.tsx
│   │   ├── cards/           # Cartes
│   │   │   ├── BalanceCard.tsx
│   │   │   ├── StatCard.tsx
│   │   │   ├── InsightCard.tsx
│   │   │   ├── BudgetCategoryCard.tsx
│   │   │   └── GoalCard.tsx
│   │   ├── lists/           # Items de liste
│   │   │   ├── TransactionItem.tsx
│   │   │   └── SettingsItem.tsx
│   │   └── ui/              # Composants UI de base
│   │       ├── ProgressBar.tsx
│   │       ├── Icon.tsx
│   │       └── Avatar.tsx
│   ├── screens/             # Écrans
│   │   ├── HomeScreen.tsx   # Screen 1 (Dashboard)
│   │   ├── TransactionsScreen.tsx
│   │   ├── BudgetsScreen.tsx
│   │   ├── GoalsScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── AddTransactionScreen.tsx
│   │   ├── AddGoalScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── navigation/          # Navigation
│   │   └── RootNavigator.tsx
│   ├── services/            # Services API
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── accounts.ts
│   │   ├── transactions.ts
│   │   ├── budgets.ts
│   │   ├── goals.ts
│   │   └── insights.ts
│   ├── store/               # State management (Zustand)
│   │   ├── authStore.ts
│   │   ├── dataStore.ts
│   │   └── uiStore.ts
│   ├── hooks/               # Custom hooks
│   │   ├── useTransactions.ts
│   │   ├── useBudgets.ts
│   │   └── useGoals.ts
│   ├── utils/               # Utilitaires
│   │   ├── formatters.ts    # Format currency, dates, etc.
│   │   ├── calculations.ts  # Calculs financiers
│   │   └── colors.ts        # Gestion des couleurs
│   ├── constants/           # Constantes
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── icons.ts
│   └── types/               # Types TypeScript
│       ├── api.ts
│       ├── models.ts
│       └── navigation.ts
├── assets/                  # Assets (images, fonts)
│   ├── icons/
│   └── images/
└── App.tsx
```

---

## 🚀 Plan d'Implémentation - Procédure Étape par Étape

### Phase 1: Setup & Foundation (Jour 1)

#### 1.1 Setup du Design System
- [ ] Créer `src/constants/colors.ts`
- [ ] Créer `src/constants/typography.ts`
- [ ] Créer `src/constants/spacing.ts`
- [ ] Créer `src/utils/formatters.ts` (currency, dates, percentages)

#### 1.2 Composants UI de Base
- [ ] `src/components/ui/ProgressBar.tsx`
- [ ] `src/components/ui/Icon.tsx`
- [ ] `src/components/ui/Avatar.tsx`
- [ ] `src/components/common/FAB.tsx`
- [ ] `src/components/common/SearchBar.tsx`

#### 1.3 Services API
- [ ] Configurer axios avec interceptors
- [ ] Créer `src/services/api.ts` (base config)
- [ ] Créer `src/services/transactions.ts`
- [ ] Créer `src/services/budgets.ts`
- [ ] Créer `src/services/goals.ts`
- [ ] Créer `src/services/insights.ts`

---

### Phase 2: Home Screen (Jour 2)

#### 2.1 Composants pour Home
- [ ] `src/components/cards/BalanceCard.tsx`
- [ ] `src/components/cards/StatCard.tsx`
- [ ] `src/components/cards/InsightCard.tsx`
- [ ] `src/components/lists/SpendingCategoryItem.tsx`

#### 2.2 Home Screen
- [ ] Créer layout de base
- [ ] Intégrer BalanceCard
- [ ] Intégrer Income/Expense cards
- [ ] Intégrer AI Insight
- [ ] Intégrer Top Spending section
- [ ] Ajouter pull-to-refresh
- [ ] Connecter aux APIs

#### 2.3 Tests Home Screen
- [ ] Tester avec données réelles
- [ ] Vérifier responsive
- [ ] Tester pull-to-refresh

---

### Phase 3: Transactions Screen (Jour 3)

#### 3.1 Composants pour Transactions
- [ ] `src/components/lists/TransactionItem.tsx`
- [ ] `src/components/common/DateSeparator.tsx`

#### 3.2 Transactions Screen
- [ ] Créer layout de base
- [ ] Intégrer SearchBar
- [ ] Intégrer liste groupée par date
- [ ] Implémenter recherche en temps réel
- [ ] Implémenter filtres
- [ ] Ajouter scroll infini (pagination)
- [ ] Connecter aux APIs

#### 3.3 Add Transaction Screen
- [ ] Créer formulaire d'ajout
- [ ] Sélecteur de catégorie
- [ ] Sélecteur de compte
- [ ] Date picker
- [ ] Validation
- [ ] Connecter à l'API POST

---

### Phase 4: Budgets Screen (Jour 4)

#### 4.1 Composants pour Budgets
- [ ] `src/components/cards/BudgetCategoryCard.tsx`
- [ ] `src/components/cards/OverallBudgetCard.tsx`

#### 4.2 Budgets Screen
- [ ] Créer layout de base
- [ ] Intégrer Overall Budget card
- [ ] Intégrer liste de catégories
- [ ] Calculer les pourcentages
- [ ] Gérer les états "over budget"
- [ ] Connecter aux APIs

#### 4.3 Budget Details Modal
- [ ] Modal pour voir détails d'un budget
- [ ] Graphique de progression
- [ ] Transactions liées

---

### Phase 5: Goals Screen (Jour 5)

#### 5.1 Composants pour Goals
- [ ] `src/components/cards/GoalCard.tsx`

#### 5.2 Goals Screen
- [ ] Créer layout de base
- [ ] Intégrer liste de goals
- [ ] Calculer les pourcentages
- [ ] Bouton "Add funds"
- [ ] Connecter aux APIs

#### 5.3 Add Goal Screen
- [ ] Créer formulaire de création
- [ ] Champs: nom, montant cible, date
- [ ] Sélecteur d'icône
- [ ] Validation
- [ ] Connecter à l'API POST

#### 5.4 Add Funds Modal
- [ ] Modal pour ajouter des fonds
- [ ] Input montant
- [ ] Connecter à l'API PATCH

---

### Phase 6: Settings Screen (Jour 6)

#### 6.1 Composants pour Settings
- [ ] `src/components/lists/SettingsItem.tsx`
- [ ] `src/components/cards/ProfileCard.tsx`

#### 6.2 Settings Screen
- [ ] Créer layout de base
- [ ] Intégrer profil utilisateur
- [ ] Intégrer sections (Account, Preferences, Support)
- [ ] Toggle pour notifications
- [ ] Bouton Log Out
- [ ] Connecter aux APIs

#### 6.3 Profile Screen
- [ ] Écran d'édition du profil
- [ ] Formulaire (nom, email)
- [ ] Upload d'avatar
- [ ] Connecter à l'API PATCH

---

### Phase 7: Navigation & Polish (Jour 7)

#### 7.1 Navigation
- [ ] Configurer Bottom Tab Navigator
- [ ] Icônes personnalisées pour chaque onglet
- [ ] États actifs/inactifs
- [ ] Animations de transition

#### 7.2 Polish & Amélioration
- [ ] Animations (react-native-reanimated)
- [ ] Haptic feedback
- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Skeleton loaders

#### 7.3 Tests Finaux
- [ ] Tester tous les écrans
- [ ] Tester la navigation
- [ ] Tester sur iOS et Android
- [ ] Vérifier les performances
- [ ] Tester avec données réelles

---

## 🔧 Librairies à Ajouter

```bash
# Icons
npm install @expo/vector-icons

# Animations (optionnel mais recommandé)
npm install react-native-reanimated

# Date handling
npm install date-fns

# Charts (pour les graphiques)
npm install victory-native react-native-svg
```

---

## ✅ Checklist Finale

### Fonctionnalités Essentielles
- [ ] Authentification (login/signup)
- [ ] Dashboard avec stats
- [ ] Liste des transactions avec recherche et filtres
- [ ] Ajout de transactions
- [ ] Budgets par catégorie
- [ ] Goals avec progression
- [ ] Insights AI
- [ ] Profil utilisateur
- [ ] Notifications push
- [ ] Pull-to-refresh sur tous les écrans
- [ ] Offline support (cache)

### UX/UI
- [ ] Design cohérent avec les maquettes
- [ ] Animations fluides
- [ ] Feedback visuel (loading, success, error)
- [ ] States vides
- [ ] Responsive sur différentes tailles d'écran
- [ ] Mode sombre (optionnel)

### Performance
- [ ] Images optimisées
- [ ] Lazy loading des listes
- [ ] Pagination
- [ ] Cache des données
- [ ] Temps de chargement < 2s

### Tests
- [ ] Test sur iOS
- [ ] Test sur Android
- [ ] Test avec données réelles
- [ ] Test des edge cases
- [ ] Test de la gestion d'erreurs

---

## 🎯 Ordre d'Implémentation Recommandé

**Priorité 1 (MVP):**
1. Home Screen (Dashboard)
2. Transactions Screen
3. Add Transaction Screen

**Priorité 2:**
4. Budgets Screen
5. Settings Screen

**Priorité 3:**
6. Goals Screen
7. Add Goal Screen

**Priorité 4 (Polish):**
8. Animations et transitions
9. Notifications push
10. Mode offline

---

## 📝 Notes Importantes

1. **API First**: Toujours vérifier que l'endpoint API existe avant d'implémenter la fonctionnalité
2. **Types TypeScript**: Créer les types pour toutes les données API
3. **Error Handling**: Gérer tous les cas d'erreur (network, 404, 500, etc.)
4. **Loading States**: Toujours afficher un loader pendant les requêtes
5. **Validation**: Valider toutes les entrées utilisateur
6. **Responsive**: Tester sur différentes tailles d'écran
7. **Accessibility**: Ajouter les labels pour l'accessibilité
8. **Performance**: Optimiser les re-renders avec React.memo et useMemo

---

## 🚦 Prochaine Étape

**Commencez par la Phase 1: Setup & Foundation**

Une fois le plan approuvé, nous allons:
1. Créer le design system
2. Créer les composants de base
3. Implémenter écran par écran en suivant l'ordre de priorité

**Êtes-vous prêt à commencer l'implémentation?**
