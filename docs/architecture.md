# Finopt Architecture Documentation

## Overview

Finopt follows Clean Architecture principles to ensure maintainability, testability, and scalability.

## Architecture Layers

### 1. Domain Layer (`src/domain/`)

The innermost layer containing business logic and entities.

**Components:**
- **Entities** (`entities.py`): Core business objects with behavior
  - `Account`, `Transaction`, `Budget`, `Goal`, etc.
  - Pure business logic, no external dependencies
  - Rich domain models with validation and behavior

- **Repository Interfaces** (`repositories.py`): Data access contracts
  - Abstract base classes defining data operations
  - Dependency Inversion Principle in action
  - Agnostic to data source implementation

- **Service Interfaces** (`services.py`): External service contracts
  - LLM client, push notifications, parsers, etc.
  - Ports in Hexagonal Architecture terminology

**Key Principles:**
- No dependencies on outer layers
- Framework-agnostic
- Testable in isolation

### 2. Application Layer (`src/application/`)

Business workflows and use cases.

**Components:**
- **Use Cases** (`use_cases/`): Application business logic
  - `CreateManualTransactionUseCase`
  - `EvaluateBudgetThresholdsUseCase`
  - `GenerateMonthlyInsightsUseCase`
  - Each use case represents a single business operation
  - Orchestrates domain entities and repositories

**Characteristics:**
- Depends only on domain layer
- Coordinates multiple repositories and services
- Transaction boundaries
- Application-specific business rules

### 3. Infrastructure Layer (`src/infrastructure/`)

External concerns and implementations.

**Components:**
- **Database** (`database/`): Database connection and ORM
  - Supabase client configuration
  - Connection pooling

- **Repositories** (`repositories/`): Concrete repository implementations
  - `TransactionRepositoryImpl`
  - Implements domain repository interfaces
  - Data mapping and persistence

- **Services** (`services/`): External service implementations
  - `AnthropicLLMClient`: AI insights using Claude
  - `ExpoPushNotificationService`: Push notifications
  - `StatementParserImpl`: File parsing (CSV, OFX, PDF)

- **Workers** (`workers/`): Background job processing
  - Celery configuration
  - Task definitions for imports, insights, budgets

**Key Points:**
- Implements domain interfaces
- External dependencies isolated here
- Easily replaceable implementations

### 4. Presentation Layer (`src/presentation/`)

API and user interfaces.

**Components:**
- **API** (`api/`): FastAPI application
  - REST endpoints
  - Request/response models (DTOs)
  - Authentication and authorization
  - OpenAPI documentation

- **Routers** (`api/routers/`): Endpoint organization
  - `/auth`: Authentication
  - `/accounts`: Account management
  - `/transactions`: Transaction CRUD + manual entry
  - `/budgets`: Budget management
  - `/insights`: AI insights
  - `/notifications`: Notification management
  - `/goals`: Goal tracking

**Responsibilities:**
- HTTP request/response handling
- Input validation (Pydantic)
- Authentication/authorization
- Error handling
- API documentation

## Data Flow

```
User Request
    ↓
[Presentation Layer]
Router → Dependency Injection → Authentication
    ↓
[Application Layer]
Use Case → Orchestration
    ↓
[Domain Layer]
Entity Business Logic
    ↓
[Infrastructure Layer]
Repository → Database/External Services
```

## Key Design Patterns

### 1. Dependency Injection
- Dependencies passed through constructors
- Easy testing with mocks
- Flexible configuration

### 2. Repository Pattern
- Abstracts data access
- Swappable data sources
- Clean testing

### 3. Use Case Pattern
- Single Responsibility Principle
- Clear business operations
- Testable workflows

### 4. Ports and Adapters (Hexagonal)
- Domain defines interfaces (ports)
- Infrastructure provides implementations (adapters)
- Decoupled from external systems

## Database Design

### Core Tables

**users**: User accounts (extends Supabase auth)
**accounts**: Financial accounts with types
**transactions**: Financial transactions (manual + imported)
**categories**: Transaction categories (system + custom)
**budgets**: Category-based budgets with thresholds
**budget_events**: Budget threshold breach history
**notifications**: User notifications
**notification_preferences**: Notification settings
**insights**: AI-generated monthly insights
**goals**: Financial goals with AI planning
**import_history**: Bank statement import logs

### Key Features

- **Row Level Security (RLS)**: Enforced at database level
- **Soft Deletes**: Transactions support soft deletion
- **Triggers**: Auto-update timestamps
- **Functions**: Budget consumption calculation
- **Indexes**: Optimized queries on common patterns

## Background Workers

### Celery Tasks

**Import Queue:**
- Parse bank statements (CSV, OFX, PDF)
- Deduplicate transactions
- Auto-categorization
- Trigger budget evaluation

**Insights Queue:**
- Generate monthly AI insights
- Analyze spending patterns
- Detect subscriptions and anomalies
- Schedule periodic generation

**Budgets Queue:**
- Evaluate threshold breaches
- Send notifications
- Daily budget checks

**Scheduler (Celery Beat):**
- Monthly insight generation
- Daily budget evaluation
- Cleanup old notifications

## AI Integration

### Anthropic Claude API

**Insights Generation:**
1. Fetch transactions, accounts, budgets
2. Calculate income and fixed costs
3. Build context for LLM
4. Generate structured JSON insights
5. Save and notify user

**Output Structure:**
- Savings opportunities
- Income-based saving strategies
- Subscription detection
- Anomaly detection
- Budget adjustment recommendations
- Spending trigger analysis
- Actionable next steps

**Fallback Strategy:**
- Basic insights if AI fails
- Ensures system resilience

## Mobile Application

### Technology Stack

- **React Native**: Cross-platform mobile framework
- **Expo**: Development and build toolchain
- **TypeScript**: Type safety
- **Zustand**: State management
- **React Navigation**: Navigation and routing

### Architecture

**API Client** (`lib/api.ts`):
- Axios-based HTTP client
- JWT token management
- Interceptors for auth and errors

**State Management** (`store/index.ts`):
- Auth state (user, token)
- Data state (accounts, transactions, budgets)
- Async data fetching
- Centralized error handling

**Screens:**
- Dashboard: Overview and quick stats
- Transactions: List with filters
- Add Transaction: Manual entry form
- Budgets: Budget management and tracking
- Insights: AI-powered recommendations
- Settings: Preferences and account

### Key Features

- **Push Notifications**: Expo Notifications
- **Offline Support**: Consider implementing
- **Biometric Auth**: Consider implementing
- **Charts**: Victory Native for data visualization

## Security Considerations

### Authentication
- Supabase Auth for user management
- JWT tokens for API authentication
- Secure token storage on mobile

### Authorization
- Row Level Security on database
- User-scoped queries
- Service role for workers

### Data Protection
- Environment variables for secrets
- HTTPS only in production
- Input validation (Pydantic + Zod)
- SQL injection prevention (parameterized queries)

### Best Practices
- Never log sensitive data
- Secure API keys in environment
- Regular dependency updates
- Security headers on API

## Testing Strategy

### Unit Tests
- Use cases with mocked repositories
- Entity business logic
- Utility functions

### Integration Tests
- API endpoints with test database
- Repository implementations
- Worker tasks

### E2E Tests
- Critical user flows
- Mobile app key features

### Test Fixtures
- Factory patterns for entities
- Mock data generators
- Test database seeding

## Deployment

### Development
```bash
docker-compose up -d
npm run mobile
```

### Production
- API: Docker containers (AWS ECS, GCP Cloud Run, etc.)
- Database: Supabase managed Postgres
- Workers: Separate container instances
- Mobile: Expo EAS Build

### CI/CD
- GitHub Actions for automated testing
- Docker image builds
- Automated deployment to staging
- Manual promotion to production

## Performance Optimization

### Database
- Proper indexing on frequent queries
- Connection pooling
- Query optimization with EXPLAIN

### API
- Response pagination
- Selective field loading
- Caching with Redis

### Workers
- Task prioritization
- Rate limiting for external APIs
- Retry strategies with exponential backoff

### Mobile
- Lazy loading
- Image optimization
- Efficient re-renders (React.memo)
- Data pagination

## Monitoring and Logging

### Structured Logging
- JSON formatted logs
- Log levels (DEBUG, INFO, WARNING, ERROR)
- Correlation IDs for tracing

### Metrics
- API response times
- Worker task duration
- Error rates
- User activity

### Alerting
- Budget notification failures
- Worker task failures
- API errors and downtime

## Future Enhancements

### Features
- Bank API integration (Plaid, TrueLayer)
- Receipt scanning (OCR)
- Multi-currency support
- Shared budgets (family/team)
- Investment tracking
- Tax optimization suggestions

### Technical
- GraphQL API option
- Real-time updates (WebSockets)
- Offline-first mobile app
- Advanced caching strategies
- Microservices architecture for scale

## Contributing

See `CONTRIBUTING.md` for development guidelines.

## License

MIT License - See `LICENSE` file.
