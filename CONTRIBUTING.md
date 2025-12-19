# Contributing to Finopt

Thank you for considering contributing to Finopt! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what's best for the project and community

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/finopt.git`
3. Follow the setup guide: `docs/setup-guide.md`
4. Create a feature branch: `git checkout -b feature/your-feature`

## Development Guidelines

### Code Style

**Python (Backend):**
- Follow PEP 8
- Use Black for formatting: `black .`
- Use Ruff for linting: `ruff check .`
- Type hints required
- Max line length: 100 characters

**TypeScript (Mobile):**
- Follow ESLint configuration
- Use Prettier for formatting
- Functional components with hooks
- Strict type checking

### Architecture Principles

**Clean Architecture:**
- Maintain layer separation (Domain → Application → Infrastructure → Presentation)
- Dependencies flow inward
- Domain layer has no external dependencies
- Use dependency injection

**SOLID Principles:**
- Single Responsibility
- Open/Closed
- Liskov Substitution
- Interface Segregation
- Dependency Inversion

### Naming Conventions

**Python:**
- Classes: `PascalCase`
- Functions/methods: `snake_case`
- Constants: `UPPER_SNAKE_CASE`
- Private: prefix with `_`

**TypeScript:**
- Components: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Types/Interfaces: `PascalCase`

## Making Changes

### 1. Create an Issue

Before making changes:
- Check if an issue exists
- If not, create one describing the change
- Discuss the approach

### 2. Write Code

**Backend:**
```python
# Example use case structure
class CreateManualTransactionUseCase:
    def __init__(self, transaction_repo: TransactionRepository):
        self.transaction_repo = transaction_repo

    async def execute(self, ...):
        # Implementation
        pass
```

**Frontend:**
```typescript
// Example component structure
export default function MyComponent() {
  const [state, setState] = useState();

  useEffect(() => {
    // Side effects
  }, []);

  return <View>...</View>;
}
```

### 3. Write Tests

**Backend Tests:**
```python
@pytest.mark.asyncio
async def test_create_transaction():
    # Arrange
    mock_repo = Mock(spec=TransactionRepository)

    # Act
    use_case = CreateManualTransactionUseCase(mock_repo)
    result = await use_case.execute(...)

    # Assert
    assert result is not None
    mock_repo.create.assert_called_once()
```

**Frontend Tests:**
```typescript
describe('MyComponent', () => {
  it('renders correctly', () => {
    const { getByText } = render(<MyComponent />);
    expect(getByText('Expected Text')).toBeTruthy();
  });
});
```

### 4. Run Tests

```bash
# Backend
cd apps/api
pytest

# Mobile
cd apps/mobile
npm test

# All
npm test
```

### 5. Lint and Format

```bash
# Backend
cd apps/api
black .
ruff check .

# Mobile
npm run lint
```

### 6. Commit Changes

Follow Conventional Commits:

```bash
git commit -m "feat: add manual transaction creation"
git commit -m "fix: resolve budget calculation error"
git commit -m "docs: update API documentation"
git commit -m "test: add transaction use case tests"
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting)
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

### 7. Push and Create PR

```bash
git push origin feature/your-feature
```

Then create a Pull Request on GitHub.

## Pull Request Guidelines

### PR Title

Use Conventional Commits format:
- `feat: add budget threshold notifications`
- `fix: correct transaction amount calculation`

### PR Description

Include:
- **What**: What changes were made
- **Why**: Why these changes were necessary
- **How**: How the changes work
- **Testing**: How to test the changes
- **Screenshots**: For UI changes

Template:
```markdown
## Description
Brief description of changes

## Motivation
Why this change is needed

## Changes Made
- Change 1
- Change 2

## Testing
How to test these changes

## Screenshots (if applicable)
[Add screenshots]

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Code follows style guidelines
- [ ] All tests pass
```

### Review Process

1. CI checks must pass
2. At least one approval required
3. Address review comments
4. Keep PR up to date with main branch

## Project Structure

```
finopt/
├── apps/
│   ├── api/                    # FastAPI backend
│   │   ├── src/
│   │   │   ├── domain/         # Business logic (entities, repos)
│   │   │   ├── application/    # Use cases
│   │   │   ├── infrastructure/ # External services
│   │   │   └── presentation/   # API endpoints
│   │   └── tests/
│   └── mobile/                 # React Native app
│       ├── src/
│       │   ├── screens/
│       │   ├── components/
│       │   ├── store/
│       │   └── lib/
│       └── __tests__/
├── packages/
│   └── shared/                 # Shared types and validation
├── infra/                      # Infrastructure configs
├── docs/                       # Documentation
└── docker-compose.yml
```

## Adding New Features

### Backend Feature

1. **Domain Layer**: Create/update entities
2. **Domain Layer**: Define repository interface
3. **Application Layer**: Create use case
4. **Infrastructure Layer**: Implement repository
5. **Presentation Layer**: Add API endpoint
6. **Tests**: Write unit and integration tests

### Mobile Feature

1. **Types**: Add/update types in shared package
2. **API Client**: Add API methods
3. **Store**: Update Zustand store if needed
4. **Components**: Create reusable components
5. **Screens**: Implement screen
6. **Navigation**: Add to navigation
7. **Tests**: Write component tests

## Database Changes

### Schema Changes

1. Update `infra/supabase/schema.sql`
2. Test locally with Neon
3. Document changes
4. Update repository implementations
5. Update entity models

### Migrations

For production:
- Use Neon branching for safe migrations
- Or implement Alembic migrations
- Never make breaking changes without migration path

## API Changes

### Adding Endpoints

1. Define request/response models (Pydantic)
2. Create/update use case
3. Add router endpoint
4. Update OpenAPI docs
5. Update `docs/api.md`
6. Add tests

### Breaking Changes

- Increment API version
- Maintain backwards compatibility
- Provide migration guide
- Deprecate old endpoints gradually

## Documentation

Update documentation when:
- Adding new features
- Changing APIs
- Modifying architecture
- Adding configuration options

Files to update:
- `README.md`: High-level overview
- `docs/architecture.md`: Architecture changes
- `docs/api.md`: API changes
- `docs/setup-guide.md`: Setup changes
- Inline code comments: Complex logic

## Performance Considerations

### Backend

- Use database indexes
- Implement pagination
- Cache frequently accessed data
- Optimize N+1 queries
- Use async/await properly

### Mobile

- Lazy load components
- Optimize images
- Minimize re-renders
- Use pagination for lists
- Cache API responses

## Security Considerations

- Never commit secrets
- Validate all inputs
- Use parameterized queries
- Implement proper authentication
- Follow OWASP guidelines
- Keep dependencies updated

## Testing Requirements

### Minimum Coverage

- Use cases: 80%+
- Repositories: 70%+
- API endpoints: 80%+
- Critical paths: 100%

### Test Types

1. **Unit Tests**: Individual functions/methods
2. **Integration Tests**: Multiple components
3. **E2E Tests**: Full user flows
4. **Performance Tests**: Response times, load

## Release Process

1. Update version in `package.json` and `pyproject.toml`
2. Update `CHANGELOG.md`
3. Create release branch: `release/v1.x.x`
4. Test thoroughly
5. Merge to main
6. Tag release: `git tag v1.x.x`
7. Deploy to production

## Questions?

- Open an issue for discussion
- Check existing issues and PRs
- Review documentation
- Ask in PR comments

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Finopt! 🙏
