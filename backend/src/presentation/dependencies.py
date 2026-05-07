from collections.abc import AsyncIterator
from datetime import timedelta

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from src.application.accounts.use_cases import (
    CreateAccount,
    DeleteAccount,
    ListAccounts,
    UpdateAccount,
)
from src.application.auth.use_cases import (
    GetCurrentUser,
    LoginUser,
    LogoutSession,
    RefreshSession,
    SignUpUser,
)
from src.application.categories.use_cases import (
    CreateCategory,
    DeleteCategory,
    ListCategories,
    UpdateCategory,
)
from src.application.income_sources.use_cases import (
    CreateIncomeSource,
    DeleteIncomeSource,
    ListIncomeSources,
    UpdateIncomeSource,
)
from src.application.bank_imports.use_cases import ImportBankStatement, ListBankImports, ParsePdfStatement
from src.application.budget_advice.use_cases import GenerateBudgetAdvice
from src.application.budgets.use_cases import GetBudget, SetBudget
from src.application.receipts.use_cases import ListReceipts, SaveReceipt, ScanReceipt
from src.application.savings_goals.use_cases import (
    CreateSavingsGoal,
    DeleteSavingsGoal,
    ListSavingsGoals,
    UpdateSavingsGoal,
)
from src.application.transactions.use_cases import (
    CreateTransaction,
    DeleteTransaction,
    ListTransactions,
    TransferBetweenAccounts,
    UpdateTransaction,
)
from src.domain.ports.repositories import (
    AccountRepository,
    BankImportRepository,
    BudgetRepository,
    CategoryRepository,
    IncomeSourceRepository,
    ReceiptRepository,
    RefreshTokenRepository,
    SavingsGoalRepository,
    TransactionRepository,
    UserRepository,
)
from src.infrastructure.database import get_session
from src.infrastructure.repositories import (
    SqlAlchemyAccountRepository,
    SqlAlchemyBankImportRepository,
    SqlAlchemyBudgetRepository,
    SqlAlchemyCategoryRepository,
    SqlAlchemyIncomeSourceRepository,
    SqlAlchemyReceiptRepository,
    SqlAlchemyRefreshTokenRepository,
    SqlAlchemySavingsGoalRepository,
    SqlAlchemyTransactionRepository,
    SqlAlchemyUserRepository,
)
from src.infrastructure.security import (
    Argon2PasswordHasher,
    JwtTokenIssuer,
    SecureRefreshTokenGenerator,
)
from src.infrastructure.settings import Settings, get_settings

bearer_scheme = HTTPBearer()


async def user_repository(
    session: AsyncSession = Depends(get_session),
) -> AsyncIterator[UserRepository]:
    yield SqlAlchemyUserRepository(session)


async def refresh_token_repository(
    session: AsyncSession = Depends(get_session),
) -> AsyncIterator[RefreshTokenRepository]:
    yield SqlAlchemyRefreshTokenRepository(session)


async def account_repository(
    session: AsyncSession = Depends(get_session),
) -> AsyncIterator[AccountRepository]:
    yield SqlAlchemyAccountRepository(session)


async def income_source_repository(
    session: AsyncSession = Depends(get_session),
) -> AsyncIterator[IncomeSourceRepository]:
    yield SqlAlchemyIncomeSourceRepository(session)


async def category_repository(
    session: AsyncSession = Depends(get_session),
) -> AsyncIterator[CategoryRepository]:
    yield SqlAlchemyCategoryRepository(session)


async def transaction_repository(
    session: AsyncSession = Depends(get_session),
) -> AsyncIterator[TransactionRepository]:
    yield SqlAlchemyTransactionRepository(session)


def password_hasher() -> Argon2PasswordHasher:
    return Argon2PasswordHasher()


def token_issuer(settings: Settings = Depends(get_settings)) -> JwtTokenIssuer:
    return JwtTokenIssuer(settings)


def refresh_token_generator() -> SecureRefreshTokenGenerator:
    return SecureRefreshTokenGenerator()


def sign_up_use_case(
    users: UserRepository = Depends(user_repository),
    hasher: Argon2PasswordHasher = Depends(password_hasher),
) -> SignUpUser:
    return SignUpUser(users, hasher)


def login_use_case(
    users: UserRepository = Depends(user_repository),
    refresh_tokens: RefreshTokenRepository = Depends(refresh_token_repository),
    hasher: Argon2PasswordHasher = Depends(password_hasher),
    issuer: JwtTokenIssuer = Depends(token_issuer),
    generator: SecureRefreshTokenGenerator = Depends(refresh_token_generator),
    settings: Settings = Depends(get_settings),
) -> LoginUser:
    return LoginUser(
        users,
        refresh_tokens,
        hasher,
        issuer,
        generator,
        refresh_token_ttl=timedelta(days=settings.refresh_token_days),
    )


def refresh_session_use_case(
    users: UserRepository = Depends(user_repository),
    refresh_tokens: RefreshTokenRepository = Depends(refresh_token_repository),
    issuer: JwtTokenIssuer = Depends(token_issuer),
) -> RefreshSession:
    return RefreshSession(users, refresh_tokens, issuer)


def logout_session_use_case(
    refresh_tokens: RefreshTokenRepository = Depends(refresh_token_repository),
) -> LogoutSession:
    return LogoutSession(refresh_tokens)


def get_current_user_use_case(users: UserRepository = Depends(user_repository)) -> GetCurrentUser:
    return GetCurrentUser(users)


def create_account_use_case(
    accounts: AccountRepository = Depends(account_repository),
) -> CreateAccount:
    return CreateAccount(accounts)


def list_accounts_use_case(
    accounts: AccountRepository = Depends(account_repository),
) -> ListAccounts:
    return ListAccounts(accounts)


def update_account_use_case(
    accounts: AccountRepository = Depends(account_repository),
) -> UpdateAccount:
    return UpdateAccount(accounts)


def delete_account_use_case(
    accounts: AccountRepository = Depends(account_repository),
) -> DeleteAccount:
    return DeleteAccount(accounts)


def create_income_source_use_case(
    sources: IncomeSourceRepository = Depends(income_source_repository),
) -> CreateIncomeSource:
    return CreateIncomeSource(sources)


def list_income_sources_use_case(
    sources: IncomeSourceRepository = Depends(income_source_repository),
) -> ListIncomeSources:
    return ListIncomeSources(sources)


def update_income_source_use_case(
    sources: IncomeSourceRepository = Depends(income_source_repository),
) -> UpdateIncomeSource:
    return UpdateIncomeSource(sources)


def delete_income_source_use_case(
    sources: IncomeSourceRepository = Depends(income_source_repository),
) -> DeleteIncomeSource:
    return DeleteIncomeSource(sources)


def create_category_use_case(
    categories: CategoryRepository = Depends(category_repository),
) -> CreateCategory:
    return CreateCategory(categories)


def list_categories_use_case(
    categories: CategoryRepository = Depends(category_repository),
) -> ListCategories:
    return ListCategories(categories)


def update_category_use_case(
    categories: CategoryRepository = Depends(category_repository),
) -> UpdateCategory:
    return UpdateCategory(categories)


def delete_category_use_case(
    categories: CategoryRepository = Depends(category_repository),
) -> DeleteCategory:
    return DeleteCategory(categories)


def create_transaction_use_case(
    transactions: TransactionRepository = Depends(transaction_repository),
    accounts: AccountRepository = Depends(account_repository),
) -> CreateTransaction:
    return CreateTransaction(transactions, accounts)


def list_transactions_use_case(
    transactions: TransactionRepository = Depends(transaction_repository),
) -> ListTransactions:
    return ListTransactions(transactions)


def update_transaction_use_case(
    transactions: TransactionRepository = Depends(transaction_repository),
    accounts: AccountRepository = Depends(account_repository),
) -> UpdateTransaction:
    return UpdateTransaction(transactions, accounts)


def delete_transaction_use_case(
    transactions: TransactionRepository = Depends(transaction_repository),
    accounts: AccountRepository = Depends(account_repository),
) -> DeleteTransaction:
    return DeleteTransaction(transactions, accounts)


def transfer_use_case(
    transactions: TransactionRepository = Depends(transaction_repository),
    accounts: AccountRepository = Depends(account_repository),
) -> TransferBetweenAccounts:
    return TransferBetweenAccounts(transactions, accounts)


async def bank_import_repository(
    session: AsyncSession = Depends(get_session),
) -> AsyncIterator[BankImportRepository]:
    yield SqlAlchemyBankImportRepository(session)


def import_bank_statement_use_case(
    bank_imports: BankImportRepository = Depends(bank_import_repository),
    transactions: TransactionRepository = Depends(transaction_repository),
    accounts: AccountRepository = Depends(account_repository),
) -> ImportBankStatement:
    return ImportBankStatement(bank_imports, transactions, accounts)


def list_bank_imports_use_case(
    bank_imports: BankImportRepository = Depends(bank_import_repository),
) -> ListBankImports:
    return ListBankImports(bank_imports)


def parse_pdf_use_case(
    settings: Settings = Depends(get_settings),
) -> ParsePdfStatement:
    return ParsePdfStatement(settings)


async def budget_repository(
    session: AsyncSession = Depends(get_session),
) -> AsyncIterator[BudgetRepository]:
    yield SqlAlchemyBudgetRepository(session)


def set_budget_use_case(
    budgets: BudgetRepository = Depends(budget_repository),
) -> SetBudget:
    return SetBudget(budgets)


def get_budget_use_case(
    budgets: BudgetRepository = Depends(budget_repository),
) -> GetBudget:
    return GetBudget(budgets)


async def receipt_repository(
    session: AsyncSession = Depends(get_session),
) -> AsyncIterator[ReceiptRepository]:
    yield SqlAlchemyReceiptRepository(session)


def scan_receipt_use_case(
    settings: Settings = Depends(get_settings),
) -> ScanReceipt:
    return ScanReceipt(settings)


def save_receipt_use_case(
    receipts: ReceiptRepository = Depends(receipt_repository),
) -> SaveReceipt:
    return SaveReceipt(receipts)


def list_receipts_use_case(
    receipts: ReceiptRepository = Depends(receipt_repository),
) -> ListReceipts:
    return ListReceipts(receipts)


async def savings_goal_repository(
    session: AsyncSession = Depends(get_session),
) -> AsyncIterator[SavingsGoalRepository]:
    yield SqlAlchemySavingsGoalRepository(session)


def create_savings_goal_use_case(
    goals: SavingsGoalRepository = Depends(savings_goal_repository),
) -> CreateSavingsGoal:
    return CreateSavingsGoal(goals)


def list_savings_goals_use_case(
    goals: SavingsGoalRepository = Depends(savings_goal_repository),
) -> ListSavingsGoals:
    return ListSavingsGoals(goals)


def update_savings_goal_use_case(
    goals: SavingsGoalRepository = Depends(savings_goal_repository),
) -> UpdateSavingsGoal:
    return UpdateSavingsGoal(goals)


def delete_savings_goal_use_case(
    goals: SavingsGoalRepository = Depends(savings_goal_repository),
) -> DeleteSavingsGoal:
    return DeleteSavingsGoal(goals)


def generate_budget_advice_use_case(
    settings: Settings = Depends(get_settings),
    transactions: TransactionRepository = Depends(transaction_repository),
    budgets: BudgetRepository = Depends(budget_repository),
    income_sources: IncomeSourceRepository = Depends(income_source_repository),
    goals: SavingsGoalRepository = Depends(savings_goal_repository),
) -> GenerateBudgetAdvice:
    return GenerateBudgetAdvice(settings, transactions, budgets, income_sources, goals)


async def current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    issuer: JwtTokenIssuer = Depends(token_issuer),
) -> str:
    try:
        return issuer.decode_subject(credentials.credentials)
    except (jwt.InvalidTokenError, KeyError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token",
        ) from exc
