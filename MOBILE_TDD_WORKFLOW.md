# 🔄 Workflow TDD - Phase 1 Revisité

## 🎯 Plan d'Implémentation avec TDD + SOLID

Même planning de 7 jours, mais avec TDD intégré!

---

## 📅 Jour 1: Foundation + TDD Setup

### Matin: Configuration (3-4h)

#### 1. Setup Testing Environment
```bash
cd apps/mobile

# Installer les dépendances de test
npm install --save-dev \
  @testing-library/react-native \
  @testing-library/jest-native \
  @testing-library/react-hooks \
  jest \
  @types/jest

# Configurer Jest
```

**jest.config.js:**
```javascript
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/src/test/setup.ts'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation)/)'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.stories.{ts,tsx}',
  ],
};
```

**src/test/setup.ts:**
```typescript
import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));
```

#### 2. Structure de Dossiers SOLID
```bash
mkdir -p src/{core,infrastructure,presentation,shared,di}
mkdir -p src/core/{entities,useCases,interfaces}
mkdir -p src/infrastructure/{repositories,services}
mkdir -p src/presentation/{screens,components,hooks}
mkdir -p src/shared/{utils,constants,types}
```

#### 3. Design System avec Tests

**❌ RED: Écrire les tests**
```typescript
// src/shared/utils/__tests__/formatters.test.ts
describe('formatCurrency', () => {
  it('should format positive amount correctly', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('should format negative amount correctly', () => {
    expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
  });

  it('should handle zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('should support different currencies', () => {
    expect(formatCurrency(1000, 'EUR')).toBe('€1,000.00');
  });
});

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date)).toBe('Jan 15, 2024');
  });

  it('should support different formats', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date, 'short')).toBe('01/15/2024');
  });
});
```

**✅ GREEN: Implémenter**
```typescript
// src/shared/utils/formatters.ts
export function formatCurrency(
  amount: number,
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatDate(
  date: Date,
  format: 'long' | 'short' = 'long'
): string {
  if (format === 'short') {
    return date.toLocaleDateString('en-US');
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
```

**♻️ REFACTOR: Tester et améliorer**
```bash
npm test
```

### Après-midi: Core Entities + Services (3-4h)

#### 4. Entities avec Validation

**❌ RED: Tests d'entités**
```typescript
// src/core/entities/__tests__/Transaction.test.ts
describe('Transaction', () => {
  describe('validation', () => {
    it('should create valid transaction', () => {
      const transaction = new Transaction({
        id: '1',
        amount: -50,
        description: 'Coffee',
        date: new Date(),
        accountId: 'acc1',
      });

      expect(transaction.isValid()).toBe(true);
    });

    it('should fail with empty description', () => {
      const transaction = new Transaction({
        id: '1',
        amount: -50,
        description: '',
        date: new Date(),
        accountId: 'acc1',
      });

      expect(transaction.isValid()).toBe(false);
      expect(transaction.errors).toContain('Description is required');
    });

    it('should fail with zero amount', () => {
      const transaction = new Transaction({
        id: '1',
        amount: 0,
        description: 'Test',
        date: new Date(),
        accountId: 'acc1',
      });

      expect(transaction.isValid()).toBe(false);
    });
  });

  describe('type detection', () => {
    it('should detect expense', () => {
      const transaction = new Transaction({
        amount: -50,
        // ... autres props
      });

      expect(transaction.isExpense()).toBe(true);
      expect(transaction.isIncome()).toBe(false);
    });

    it('should detect income', () => {
      const transaction = new Transaction({
        amount: 1000,
        // ... autres props
      });

      expect(transaction.isIncome()).toBe(true);
      expect(transaction.isExpense()).toBe(false);
    });
  });
});
```

**✅ GREEN: Implémenter**
```typescript
// src/core/entities/Transaction.ts
export class Transaction {
  errors: string[] = [];

  constructor(
    public id: string,
    public amount: number,
    public description: string,
    public date: Date,
    public accountId: string,
    public categoryId?: string
  ) {}

  isValid(): boolean {
    this.errors = [];

    if (!this.description?.trim()) {
      this.errors.push('Description is required');
    }

    if (this.amount === 0) {
      this.errors.push('Amount cannot be zero');
    }

    return this.errors.length === 0;
  }

  isExpense(): boolean {
    return this.amount < 0;
  }

  isIncome(): boolean {
    return this.amount > 0;
  }
}
```

#### 5. API Service avec Tests

**❌ RED: Tests du service**
```typescript
// src/infrastructure/services/__tests__/ApiClient.test.ts
describe('ApiClient', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    apiClient = new ApiClient('https://api.example.com');
  });

  it('should make GET request', async () => {
    const mockResponse = { data: [{ id: '1' }] };
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
    ) as jest.Mock;

    const result = await apiClient.get('/transactions');

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/transactions',
      expect.objectContaining({
        method: 'GET',
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it('should throw error on failed request', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })
    ) as jest.Mock;

    await expect(apiClient.get('/transactions')).rejects.toThrow(
      'Request failed: 404 Not Found'
    );
  });

  it('should add auth token to headers', async () => {
    apiClient.setAuthToken('test-token');
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    ) as jest.Mock;

    await apiClient.get('/transactions');

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    );
  });
});
```

**✅ GREEN: Implémenter**
```typescript
// src/infrastructure/services/ApiClient.ts
export class ApiClient {
  private authToken?: string;

  constructor(private baseUrl: string) {}

  setAuthToken(token: string) {
    this.authToken = token;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>('GET', endpoint);
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>('POST', endpoint, data);
  }

  private async request<T>(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}
```

---

## 📅 Jour 2: Home Screen avec TDD

### Use Cases d'abord!

**❌ RED: Tests des use cases**
```typescript
// src/core/useCases/dashboard/__tests__/GetDashboardData.test.ts
describe('GetDashboardData', () => {
  let useCase: GetDashboardData;
  let mockAccountRepo: jest.Mocked<IAccountRepository>;
  let mockTransactionRepo: jest.Mocked<ITransactionRepository>;

  beforeEach(() => {
    mockAccountRepo = {
      getAll: jest.fn(),
    } as any;
    mockTransactionRepo = {
      getAll: jest.fn(),
    } as any;

    useCase = new GetDashboardData(mockAccountRepo, mockTransactionRepo);
  });

  it('should calculate total balance from accounts', async () => {
    mockAccountRepo.getAll.mockResolvedValue([
      { id: '1', balance: 1000 },
      { id: '2', balance: 500 },
    ]);
    mockTransactionRepo.getAll.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result.totalBalance).toBe(1500);
  });

  it('should calculate monthly income', async () => {
    mockAccountRepo.getAll.mockResolvedValue([]);
    mockTransactionRepo.getAll.mockResolvedValue([
      { amount: 1000, date: new Date() },
      { amount: 500, date: new Date() },
      { amount: -200, date: new Date() },
    ]);

    const result = await useCase.execute();

    expect(result.monthlyIncome).toBe(1500);
  });

  it('should calculate monthly expenses', async () => {
    mockAccountRepo.getAll.mockResolvedValue([]);
    mockTransactionRepo.getAll.mockResolvedValue([
      { amount: -100, date: new Date() },
      { amount: -200, date: new Date() },
      { amount: 1000, date: new Date() },
    ]);

    const result = await useCase.execute();

    expect(result.monthlyExpenses).toBe(300);
  });
});
```

**✅ GREEN: Implémenter le use case**
```typescript
// src/core/useCases/dashboard/GetDashboardData.ts
export class GetDashboardData {
  constructor(
    private accountRepo: IAccountRepository,
    private transactionRepo: ITransactionRepository
  ) {}

  async execute(): Promise<DashboardData> {
    const accounts = await this.accountRepo.getAll();
    const transactions = await this.transactionRepo.getAll({
      startDate: startOfMonth(new Date()),
    });

    const totalBalance = accounts.reduce(
      (sum, acc) => sum + acc.balance,
      0
    );

    const monthlyIncome = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
    };
  }
}
```

### Puis les Composants!

**❌ RED: Tests du composant**
```typescript
// src/presentation/components/cards/__tests__/BalanceCard.test.tsx
describe('BalanceCard', () => {
  it('should render total balance', () => {
    render(
      <BalanceCard
        balance={12450}
        thisMonth={1530}
        vsLastMonth={8.5}
      />
    );

    expect(screen.getByText('$12,450')).toBeTruthy();
  });

  it('should render monthly change', () => {
    render(
      <BalanceCard
        balance={12450}
        thisMonth={1530}
        vsLastMonth={8.5}
      />
    );

    expect(screen.getByText('$+1,530')).toBeTruthy();
    expect(screen.getByText('+8.5%')).toBeTruthy();
  });

  it('should show green color for positive change', () => {
    render(
      <BalanceCard
        balance={12450}
        thisMonth={1530}
        vsLastMonth={8.5}
      />
    );

    const changeText = screen.getByText('+8.5%');
    expect(changeText.props.style).toMatchObject({
      color: colors.success,
    });
  });

  it('should show red color for negative change', () => {
    render(
      <BalanceCard
        balance={12450}
        thisMonth={-1530}
        vsLastMonth={-8.5}
      />
    );

    const changeText = screen.getByText('-8.5%');
    expect(changeText.props.style).toMatchObject({
      color: colors.danger,
    });
  });
});
```

**✅ GREEN: Implémenter le composant**
```typescript
// src/presentation/components/cards/BalanceCard.tsx
export function BalanceCard({ balance, thisMonth, vsLastMonth }: Props) {
  const changeColor = vsLastMonth >= 0 ? colors.success : colors.danger;
  const changeSign = vsLastMonth >= 0 ? '+' : '';

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Total Balance</Text>
      <Text style={styles.balance}>{formatCurrency(balance)}</Text>

      <View style={styles.row}>
        <View>
          <Text style={styles.label}>This month</Text>
          <Text style={styles.value}>
            ${changeSign}{formatCurrency(Math.abs(thisMonth))}
          </Text>
        </View>

        <View>
          <Text style={styles.label}>vs last month</Text>
          <Text style={[styles.value, { color: changeColor }]}>
            {changeSign}{vsLastMonth}%
          </Text>
        </View>
      </View>
    </View>
  );
}
```

**♻️ REFACTOR: Tester**
```bash
npm test -- BalanceCard
```

---

## 📅 Jour 3-7: Pattern pour Chaque Feature

### Pour chaque feature, suivez ce workflow:

#### 1. ❌ RED: Use Case Tests
```typescript
// Écrire les tests du use case
describe('CreateTransaction', () => {
  it('should create transaction with valid data', async () => {
    // Test
  });

  it('should fail with invalid data', async () => {
    // Test
  });
});
```

#### 2. ✅ GREEN: Use Case Implementation
```typescript
// Implémenter le use case
export class CreateTransaction {
  async execute(data: CreateTransactionDto): Promise<Transaction> {
    // Implementation
  }
}
```

#### 3. ❌ RED: Repository Tests
```typescript
// Écrire les tests du repository
describe('TransactionRepository', () => {
  it('should save transaction to API', async () => {
    // Test
  });
});
```

#### 4. ✅ GREEN: Repository Implementation
```typescript
// Implémenter le repository
export class ApiTransactionRepository implements ITransactionRepository {
  async create(data: CreateTransactionDto): Promise<Transaction> {
    // Implementation
  }
}
```

#### 5. ❌ RED: Component Tests
```typescript
// Écrire les tests du composant
describe('TransactionForm', () => {
  it('should render form fields', () => {
    // Test
  });

  it('should validate on submit', () => {
    // Test
  });
});
```

#### 6. ✅ GREEN: Component Implementation
```typescript
// Implémenter le composant
export function TransactionForm({ onSubmit }: Props) {
  // Implementation
}
```

#### 7. ♻️ REFACTOR
```bash
npm test
npm run lint
# Améliorer le code sans casser les tests
```

---

## 📊 Métriques de Succès

### Coverage Targets
- **Use Cases**: 100% coverage (business logic critique)
- **Repositories**: 90% coverage
- **Composants**: 80% coverage
- **Utils**: 100% coverage

### Commandes
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch

# Run specific file
npm test -- TransactionForm
```

---

## 🎯 Checklist Quotidienne

### Chaque jour, avant de commit:

- [ ] Tous les tests passent (`npm test`)
- [ ] Coverage > 80% sur les nouveaux fichiers
- [ ] Pas de console.log/console.error
- [ ] Code formaté (`npm run lint -- --fix`)
- [ ] Au moins 1 test par fonction publique
- [ ] Use cases testés en isolation
- [ ] Composants testés avec mocks

---

## 🚀 Exemple de Session TDD (30 min)

**Feature: Add Transaction Button**

**Minute 0-5: RED**
```typescript
it('should open modal when FAB is pressed', () => {
  const onPress = jest.fn();
  render(<FAB onPress={onPress} />);

  fireEvent.press(screen.getByTestId('fab'));

  expect(onPress).toHaveBeenCalled();
});
```

**Minute 5-15: GREEN**
```typescript
export function FAB({ onPress }: Props) {
  return (
    <TouchableOpacity testID="fab" onPress={onPress}>
      <View style={styles.fab}>
        <Text>+</Text>
      </View>
    </TouchableOpacity>
  );
}
```

**Minute 15-25: Tests Additionnels**
```typescript
it('should render with custom icon', () => {
  render(<FAB icon="plus" />);
  expect(screen.getByTestId('fab-icon')).toBeTruthy();
});

it('should be disabled when loading', () => {
  render(<FAB disabled={true} />);
  const fab = screen.getByTestID('fab');
  expect(fab.props.accessibilityState.disabled).toBe(true);
});
```

**Minute 25-30: REFACTOR**
```typescript
// Améliorer styles, ajouter animations, etc.
```

---

## ✅ Résumé du Workflow

1. **Jour 1**: Setup TDD + Foundation
2. **Jours 2-7**: Pour chaque feature:
   - ❌ RED: Tests use cases
   - ✅ GREEN: Implementation use cases
   - ❌ RED: Tests repositories
   - ✅ GREEN: Implementation repositories
   - ❌ RED: Tests composants
   - ✅ GREEN: Implementation composants
   - ♻️ REFACTOR: Amélioration continue

**Résultat: Code 100% testé, architecture SOLID, facile à faire évoluer!**
