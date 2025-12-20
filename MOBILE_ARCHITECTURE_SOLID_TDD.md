# 🏗️ Architecture Mobile - SOLID & TDD

## 🎯 Objectif

Construire une app mobile React Native avec:
- ✅ **Test-Driven Development (TDD)** - Tests avant le code
- ✅ **Principes SOLID** - Code maintenable et évolutif
- ✅ **Architecture propre** - Séparation des responsabilités
- ✅ **Facilité de changement** - Ajout de features sans casser l'existant

---

## 📚 Principes SOLID dans React Native

### 1️⃣ **S - Single Responsibility Principle**
*Une classe/composant/fonction = une seule responsabilité*

#### ❌ Mauvais Exemple
```tsx
// TransactionItem.tsx - Fait TROP de choses
export function TransactionItem({ transactionId }) {
  const [transaction, setTransaction] = useState(null);

  // ❌ Responsabilité 1: Fetch data
  useEffect(() => {
    fetch(`/api/transactions/${transactionId}`)
      .then(res => res.json())
      .then(setTransaction);
  }, [transactionId]);

  // ❌ Responsabilité 2: Format data
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(transaction?.amount || 0);

  // ❌ Responsabilité 3: Business logic
  const isExpense = transaction?.amount < 0;
  const categoryColor = getCategoryColor(transaction?.category);

  // ❌ Responsabilité 4: UI rendering
  return (
    <View>
      <Text>{transaction?.description}</Text>
      <Text style={{ color: isExpense ? 'red' : 'green' }}>
        {formattedAmount}
      </Text>
    </View>
  );
}
```

#### ✅ Bon Exemple (SOLID)
```tsx
// hooks/useTransaction.ts - Responsabilité: Data fetching
export function useTransaction(transactionId: string) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    transactionService.getById(transactionId)
      .then(setTransaction)
      .finally(() => setLoading(false));
  }, [transactionId]);

  return { transaction, loading };
}

// utils/formatters.ts - Responsabilité: Formatting
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}

// utils/transactionHelpers.ts - Responsabilité: Business logic
export function isExpense(amount: number): boolean {
  return amount < 0;
}

export function getAmountColor(amount: number): string {
  return isExpense(amount) ? colors.danger : colors.success;
}

// components/TransactionItem.tsx - Responsabilité: UI only
export function TransactionItem({ transactionId }: Props) {
  const { transaction, loading } = useTransaction(transactionId);

  if (loading) return <Skeleton />;
  if (!transaction) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        {transaction.description}
      </Text>
      <Text style={{ color: getAmountColor(transaction.amount) }}>
        {formatCurrency(transaction.amount)}
      </Text>
    </View>
  );
}
```

---

### 2️⃣ **O - Open/Closed Principle**
*Ouvert à l'extension, fermé à la modification*

#### ✅ Exemple: Système de notifications extensible
```tsx
// services/notifications/INotificationService.ts
export interface INotificationService {
  send(notification: Notification): Promise<void>;
}

// services/notifications/PushNotificationService.ts
export class PushNotificationService implements INotificationService {
  async send(notification: Notification): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
      },
      trigger: null,
    });
  }
}

// services/notifications/EmailNotificationService.ts
export class EmailNotificationService implements INotificationService {
  async send(notification: Notification): Promise<void> {
    await emailAPI.send({
      to: notification.recipient,
      subject: notification.title,
      body: notification.body,
    });
  }
}

// services/notifications/NotificationManager.ts
export class NotificationManager {
  constructor(private services: INotificationService[]) {}

  async sendAll(notification: Notification): Promise<void> {
    await Promise.all(
      this.services.map(service => service.send(notification))
    );
  }
}

// Usage - Ajouter un nouveau service SANS modifier le code existant
const notificationManager = new NotificationManager([
  new PushNotificationService(),
  new EmailNotificationService(),
  // ✅ Facile d'ajouter: new SMSNotificationService(),
]);
```

---

### 3️⃣ **L - Liskov Substitution Principle**
*Les sous-types doivent être substituables à leurs types de base*

#### ✅ Exemple: Repository pattern
```tsx
// repositories/ITransactionRepository.ts
export interface ITransactionRepository {
  getAll(filters?: TransactionFilters): Promise<Transaction[]>;
  getById(id: string): Promise<Transaction | null>;
  create(data: CreateTransactionDto): Promise<Transaction>;
  update(id: string, data: UpdateTransactionDto): Promise<Transaction>;
  delete(id: string): Promise<void>;
}

// repositories/ApiTransactionRepository.ts
export class ApiTransactionRepository implements ITransactionRepository {
  async getAll(filters?: TransactionFilters): Promise<Transaction[]> {
    const response = await api.get('/transactions', { params: filters });
    return response.data;
  }

  async getById(id: string): Promise<Transaction | null> {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  }

  // ... autres méthodes
}

// repositories/LocalTransactionRepository.ts (pour mode offline)
export class LocalTransactionRepository implements ITransactionRepository {
  async getAll(filters?: TransactionFilters): Promise<Transaction[]> {
    const stored = await AsyncStorage.getItem('transactions');
    const transactions = stored ? JSON.parse(stored) : [];
    return this.applyFilters(transactions, filters);
  }

  async getById(id: string): Promise<Transaction | null> {
    const transactions = await this.getAll();
    return transactions.find(t => t.id === id) || null;
  }

  // ... autres méthodes
}

// ✅ Les deux implémentations sont interchangeables!
// hooks/useTransactions.ts
export function useTransactions(repository: ITransactionRepository) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    repository.getAll().then(setTransactions);
  }, [repository]);

  return transactions;
}

// Usage
const onlineRepo = new ApiTransactionRepository();
const offlineRepo = new LocalTransactionRepository();

// ✅ Même interface, comportement différent
<TransactionsList repository={isOnline ? onlineRepo : offlineRepo} />
```

---

### 4️⃣ **I - Interface Segregation Principle**
*Les clients ne devraient pas dépendre d'interfaces qu'ils n'utilisent pas*

#### ❌ Mauvais Exemple
```tsx
// ❌ Interface trop large
interface IDataService {
  getAll(): Promise<any[]>;
  getById(id: string): Promise<any>;
  create(data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<void>;
  export(): Promise<Blob>;
  import(file: File): Promise<void>;
  sync(): Promise<void>;
  backup(): Promise<void>;
}

// Un composant qui veut juste lire n'a pas besoin de toutes ces méthodes!
```

#### ✅ Bon Exemple (SOLID)
```tsx
// Interfaces ségrégées
interface IReadable<T> {
  getAll(filters?: any): Promise<T[]>;
  getById(id: string): Promise<T | null>;
}

interface IWritable<T> {
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

interface IExportable {
  export(): Promise<Blob>;
}

interface IImportable {
  import(file: File): Promise<void>;
}

// Les composants utilisent seulement ce dont ils ont besoin
export function TransactionsList({ repository }: { repository: IReadable<Transaction> }) {
  // Utilise seulement getAll et getById
}

export function TransactionForm({ repository }: { repository: IWritable<Transaction> }) {
  // Utilise seulement create et update
}

export function ExportButton({ service }: { service: IExportable }) {
  // Utilise seulement export
}
```

---

### 5️⃣ **D - Dependency Inversion Principle**
*Dépendre des abstractions, pas des implémentations concrètes*

#### ❌ Mauvais Exemple
```tsx
// ❌ Dépendance directe à une implémentation concrète
export function BudgetScreen() {
  const budgets = useBudgets(); // ❌ Dépend de l'implémentation

  return (
    <View>
      {budgets.map(budget => <BudgetCard key={budget.id} budget={budget} />)}
    </View>
  );
}
```

#### ✅ Bon Exemple (SOLID)
```tsx
// services/budget/IBudgetService.ts
export interface IBudgetService {
  getAll(): Promise<Budget[]>;
  getById(id: string): Promise<Budget | null>;
  calculateProgress(budget: Budget): number;
}

// services/budget/BudgetService.ts
export class BudgetService implements IBudgetService {
  constructor(
    private repository: IBudgetRepository,
    private transactionRepository: ITransactionRepository
  ) {}

  async getAll(): Promise<Budget[]> {
    return this.repository.getAll();
  }

  async getById(id: string): Promise<Budget | null> {
    return this.repository.getById(id);
  }

  calculateProgress(budget: Budget): number {
    return (budget.spent / budget.amount) * 100;
  }
}

// context/ServiceContext.tsx
const ServiceContext = createContext<{
  budgetService: IBudgetService;
  transactionService: ITransactionService;
  // ... autres services
} | null>(null);

export function ServiceProvider({ children }: Props) {
  const budgetService = useMemo(() => new BudgetService(
    new ApiBudgetRepository(),
    new ApiTransactionRepository()
  ), []);

  return (
    <ServiceContext.Provider value={{ budgetService }}>
      {children}
    </ServiceContext.Provider>
  );
}

// hooks/useBudgetService.ts
export function useBudgetService(): IBudgetService {
  const context = useContext(ServiceContext);
  if (!context) throw new Error('ServiceProvider missing');
  return context.budgetService;
}

// screens/BudgetScreen.tsx
export function BudgetScreen() {
  const budgetService = useBudgetService(); // ✅ Dépend de l'abstraction
  const [budgets, setBudgets] = useState<Budget[]>([]);

  useEffect(() => {
    budgetService.getAll().then(setBudgets);
  }, [budgetService]);

  return (
    <View>
      {budgets.map(budget => (
        <BudgetCard
          key={budget.id}
          budget={budget}
          progress={budgetService.calculateProgress(budget)}
        />
      ))}
    </View>
  );
}
```

---

## 🧪 Test-Driven Development (TDD)

### Cycle Red-Green-Refactor

```
1. ❌ RED: Écrire un test qui échoue
2. ✅ GREEN: Écrire le code minimal pour passer le test
3. ♻️ REFACTOR: Améliorer le code sans casser les tests
```

---

## 📁 Structure de Dossiers SOLID + TDD

```
apps/mobile/
├── src/
│   ├── core/                      # Business logic (testable facilement)
│   │   ├── entities/              # Entités métier
│   │   │   ├── Transaction.ts
│   │   │   ├── Budget.ts
│   │   │   └── Goal.ts
│   │   ├── useCases/              # Cas d'utilisation (business logic)
│   │   │   ├── transactions/
│   │   │   │   ├── GetTransactions.ts
│   │   │   │   ├── CreateTransaction.ts
│   │   │   │   └── __tests__/
│   │   │   │       ├── GetTransactions.test.ts
│   │   │   │       └── CreateTransaction.test.ts
│   │   │   ├── budgets/
│   │   │   │   ├── CalculateBudgetProgress.ts
│   │   │   │   ├── CheckBudgetOverflow.ts
│   │   │   │   └── __tests__/
│   │   │   └── goals/
│   │   └── interfaces/            # Interfaces (DIP)
│   │       ├── ITransactionRepository.ts
│   │       ├── IBudgetRepository.ts
│   │       ├── INotificationService.ts
│   │       └── IAnalyticsService.ts
│   │
│   ├── infrastructure/            # Implémentations concrètes
│   │   ├── repositories/
│   │   │   ├── api/
│   │   │   │   ├── ApiTransactionRepository.ts
│   │   │   │   └── ApiBudgetRepository.ts
│   │   │   ├── local/
│   │   │   │   ├── LocalTransactionRepository.ts
│   │   │   │   └── LocalBudgetRepository.ts
│   │   │   └── __tests__/
│   │   ├── services/
│   │   │   ├── notifications/
│   │   │   │   ├── PushNotificationService.ts
│   │   │   │   └── __tests__/
│   │   │   ├── analytics/
│   │   │   └── api/
│   │   │       ├── apiClient.ts
│   │   │       └── interceptors.ts
│   │   └── storage/
│   │       └── AsyncStorageAdapter.ts
│   │
│   ├── presentation/              # UI Layer
│   │   ├── screens/
│   │   │   ├── Home/
│   │   │   │   ├── HomeScreen.tsx
│   │   │   │   ├── HomeScreen.test.tsx
│   │   │   │   └── useHomeViewModel.ts
│   │   │   ├── Transactions/
│   │   │   │   ├── TransactionsScreen.tsx
│   │   │   │   ├── TransactionsScreen.test.tsx
│   │   │   │   └── useTransactionsViewModel.ts
│   │   │   └── Budgets/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Button/
│   │   │   │   │   ├── Button.tsx
│   │   │   │   │   ├── Button.test.tsx
│   │   │   │   │   └── Button.stories.tsx
│   │   │   │   └── Input/
│   │   │   ├── cards/
│   │   │   └── lists/
│   │   ├── navigation/
│   │   └── hooks/                 # Custom hooks (UI logic)
│   │       ├── useTransactions.ts
│   │       ├── useTransactions.test.ts
│   │       ├── useBudgets.ts
│   │       └── useBudgets.test.ts
│   │
│   ├── shared/                    # Code partagé
│   │   ├── utils/
│   │   │   ├── formatters.ts
│   │   │   ├── formatters.test.ts
│   │   │   ├── validators.ts
│   │   │   └── validators.test.ts
│   │   ├── constants/
│   │   └── types/
│   │
│   └── di/                        # Dependency Injection
│       ├── ServiceContainer.ts
│       ├── ServiceProvider.tsx
│       └── hooks/
│           ├── useTransactionService.ts
│           └── useBudgetService.ts
│
└── __tests__/                     # Tests d'intégration
    ├── e2e/
    └── integration/
```

---

## 🧪 Exemples de Tests TDD

### 1. Test d'un Use Case

```typescript
// src/core/useCases/budgets/__tests__/CalculateBudgetProgress.test.ts
import { CalculateBudgetProgress } from '../CalculateBudgetProgress';
import { Budget } from '../../../entities/Budget';

describe('CalculateBudgetProgress', () => {
  let useCase: CalculateBudgetProgress;

  beforeEach(() => {
    useCase = new CalculateBudgetProgress();
  });

  it('should return 0% when no money is spent', () => {
    // Arrange
    const budget: Budget = {
      id: '1',
      amount: 1000,
      spent: 0,
      category: 'food',
    };

    // Act
    const progress = useCase.execute(budget);

    // Assert
    expect(progress).toBe(0);
  });

  it('should return 50% when half is spent', () => {
    const budget: Budget = {
      id: '1',
      amount: 1000,
      spent: 500,
      category: 'food',
    };

    const progress = useCase.execute(budget);

    expect(progress).toBe(50);
  });

  it('should return 100% when all is spent', () => {
    const budget: Budget = {
      id: '1',
      amount: 1000,
      spent: 1000,
      category: 'food',
    };

    const progress = useCase.execute(budget);

    expect(progress).toBe(100);
  });

  it('should return >100% when over budget', () => {
    const budget: Budget = {
      id: '1',
      amount: 1000,
      spent: 1200,
      category: 'food',
    };

    const progress = useCase.execute(budget);

    expect(progress).toBe(120);
  });

  it('should handle edge case of 0 budget', () => {
    const budget: Budget = {
      id: '1',
      amount: 0,
      spent: 100,
      category: 'food',
    };

    const progress = useCase.execute(budget);

    expect(progress).toBe(Infinity);
  });
});
```

### 2. Test d'un Repository avec Mock

```typescript
// src/infrastructure/repositories/__tests__/ApiTransactionRepository.test.ts
import { ApiTransactionRepository } from '../api/ApiTransactionRepository';
import { apiClient } from '../../services/api/apiClient';

jest.mock('../../services/api/apiClient');

describe('ApiTransactionRepository', () => {
  let repository: ApiTransactionRepository;
  const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

  beforeEach(() => {
    repository = new ApiTransactionRepository(mockApiClient);
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all transactions from API', async () => {
      // Arrange
      const mockTransactions = [
        { id: '1', amount: -50, description: 'Coffee' },
        { id: '2', amount: 1000, description: 'Salary' },
      ];
      mockApiClient.get.mockResolvedValue({ data: mockTransactions });

      // Act
      const transactions = await repository.getAll();

      // Assert
      expect(mockApiClient.get).toHaveBeenCalledWith('/transactions');
      expect(transactions).toEqual(mockTransactions);
    });

    it('should apply filters when provided', async () => {
      const filters = { category: 'food', startDate: '2024-01-01' };
      mockApiClient.get.mockResolvedValue({ data: [] });

      await repository.getAll(filters);

      expect(mockApiClient.get).toHaveBeenCalledWith('/transactions', {
        params: filters,
      });
    });

    it('should throw error when API fails', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'));

      await expect(repository.getAll()).rejects.toThrow('Network error');
    });
  });
});
```

### 3. Test d'un Composant React

```typescript
// src/presentation/components/cards/__tests__/BudgetCard.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { BudgetCard } from '../BudgetCard';
import { Budget } from '../../../../core/entities/Budget';

describe('BudgetCard', () => {
  const mockBudget: Budget = {
    id: '1',
    category: 'Food',
    amount: 1000,
    spent: 500,
  };

  it('should render budget information', () => {
    render(<BudgetCard budget={mockBudget} />);

    expect(screen.getByText('Food')).toBeTruthy();
    expect(screen.getByText('$500 of $1,000')).toBeTruthy();
  });

  it('should show progress bar at 50%', () => {
    render(<BudgetCard budget={mockBudget} />);

    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar.props.style).toMatchObject({
      width: '50%',
    });
  });

  it('should show danger color when over budget', () => {
    const overBudget = { ...mockBudget, spent: 1200 };
    render(<BudgetCard budget={overBudget} />);

    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar.props.style).toMatchObject({
      backgroundColor: colors.danger,
    });
  });

  it('should call onPress when tapped', () => {
    const onPress = jest.fn();
    render(<BudgetCard budget={mockBudget} onPress={onPress} />);

    const card = screen.getByTestId('budget-card');
    fireEvent.press(card);

    expect(onPress).toHaveBeenCalledWith(mockBudget);
  });
});
```

### 4. Test d'un Hook Personnalisé

```typescript
// src/presentation/hooks/__tests__/useTransactions.test.ts
import { renderHook, waitFor } from '@testing-library/react-native';
import { useTransactions } from '../useTransactions';
import { ITransactionRepository } from '../../../core/interfaces/ITransactionRepository';

const mockRepository: jest.Mocked<ITransactionRepository> = {
  getAll: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('useTransactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch transactions on mount', async () => {
    const mockTransactions = [
      { id: '1', amount: -50, description: 'Coffee' },
    ];
    mockRepository.getAll.mockResolvedValue(mockTransactions);

    const { result } = renderHook(() => useTransactions(mockRepository));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.transactions).toEqual(mockTransactions);
    });
  });

  it('should handle errors', async () => {
    mockRepository.getAll.mockRejectedValue(new Error('Failed'));

    const { result } = renderHook(() => useTransactions(mockRepository));

    await waitFor(() => {
      expect(result.current.error).toBe('Failed');
      expect(result.current.loading).toBe(false);
    });
  });
});
```

---

## 📋 Checklist TDD pour Chaque Feature

### Avant d'écrire du code:

1. **❌ RED: Écrire les tests qui échouent**
   ```typescript
   // 1. Test du use case
   it('should calculate budget progress correctly', () => {
     // Test échoue car la fonction n'existe pas encore
   });

   // 2. Test du repository
   it('should fetch budgets from API', () => {
     // Test échoue car le repository n'existe pas
   });

   // 3. Test du composant
   it('should render budget card', () => {
     // Test échoue car le composant n'existe pas
   });
   ```

2. **✅ GREEN: Écrire le code minimal**
   ```typescript
   // Implémenter juste assez pour passer les tests
   export class CalculateBudgetProgress {
     execute(budget: Budget): number {
       return (budget.spent / budget.amount) * 100;
     }
   }
   ```

3. **♻️ REFACTOR: Améliorer le code**
   ```typescript
   // Améliorer sans casser les tests
   export class CalculateBudgetProgress {
     execute(budget: Budget): number {
       if (budget.amount === 0) return Infinity;
       return Math.round((budget.spent / budget.amount) * 100);
     }
   }
   ```

---

## 🎯 Avantages de cette Architecture

### ✅ Testabilité
- Chaque composant est testable indépendamment
- Les dépendances sont injectées (facile à mocker)
- Business logic séparée de l'UI

### ✅ Maintenabilité
- Code organisé et prévisible
- Responsabilités claires
- Facile à comprendre et modifier

### ✅ Évolutivité
- Ajouter des features sans casser l'existant
- Changer une implémentation sans toucher le reste
- Support de nouveaux cas d'usage facilement

### ✅ Changements Futurs Facilités

**Exemples de changements faciles:**

1. **Changer d'API**
   ```typescript
   // Avant: ApiTransactionRepository
   // Après: GraphQLTransactionRepository
   // ✅ Aucun changement dans les composants!
   ```

2. **Ajouter le mode offline**
   ```typescript
   // Créer LocalTransactionRepository
   // ✅ Utiliser la même interface ITransactionRepository
   ```

3. **Ajouter une nouvelle notification**
   ```typescript
   // Créer SMSNotificationService
   // ✅ Implémenter INotificationService
   ```

4. **Changer le calcul de progression**
   ```typescript
   // Modifier CalculateBudgetProgress
   // ✅ Les tests garantissent que ça marche
   ```

---

## 🚀 Workflow TDD Recommandé

### Pour chaque feature (ex: Budget Card):

**Jour 1: Tests & Entities**
1. Définir l'entité Budget
2. Écrire les tests pour CalculateBudgetProgress
3. Implémenter CalculateBudgetProgress
4. Écrire les tests pour BudgetRepository
5. Implémenter BudgetRepository

**Jour 2: UI & Integration**
6. Écrire les tests pour BudgetCard
7. Implémenter BudgetCard
8. Écrire les tests d'intégration
9. Refactoring

---

## 📚 Librairies de Test

```bash
# Installation
npm install --save-dev \
  @testing-library/react-native \
  @testing-library/jest-native \
  jest \
  @types/jest
```

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "jest": {
    "preset": "react-native",
    "setupFilesAfterEnv": ["@testing-library/jest-native/extend-expect"],
    "transformIgnorePatterns": [
      "node_modules/(?!(react-native|@react-native|@react-navigation)/)"
    ]
  }
}
```

---

## 🎯 Prochaines Étapes

1. **Setup initial** (Jour 1)
   - Configurer Jest et Testing Library
   - Créer la structure de dossiers SOLID
   - Setup Dependency Injection

2. **Premier feature en TDD** (Jour 2)
   - Choisir une feature simple (ex: formatters)
   - Écrire les tests
   - Implémenter en suivant TDD

3. **Appliquer à toutes les features** (Jours 3-7)
   - TDD pour chaque nouveau composant
   - Tests pour chaque use case
   - Tests d'intégration

---

## ✅ Résumé

**Avec SOLID + TDD, vous aurez:**
- ✅ Code testable et testé
- ✅ Architecture propre et maintenable
- ✅ Facilité d'ajout de features
- ✅ Confiance dans les changements
- ✅ Documentation vivante (les tests)
- ✅ Moins de bugs
- ✅ Refactoring sans peur

**C'est plus de travail initial, mais énormément de temps gagné sur le long terme!**
