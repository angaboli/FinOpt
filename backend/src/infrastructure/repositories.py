from datetime import UTC, datetime

from sqlalchemy import select, and_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from datetime import date as DateType

from src.domain.entities.account import Account, AccountType
from src.domain.entities.bank_import import BankImport
from src.domain.entities.budget import Budget, BudgetLine
from src.domain.entities.category import Category
from src.domain.entities.income_source import Frequency, IncomeSource
from src.domain.entities.receipt import Receipt, ReceiptItem
from src.domain.entities.refresh_token import RefreshToken
from src.domain.entities.savings_goal import SavingsGoal
from src.domain.entities.transaction import Transaction, TransactionType
from src.domain.entities.user import User
from src.domain.exceptions import DuplicateEmailError
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
from src.domain.value_objects import (
    AccountId,
    BankImportId,
    BudgetId,
    CategoryId,
    Email,
    IncomeSourceId,
    ReceiptId,
    RefreshTokenId,
    SavingsGoalId,
    TransactionId,
    UserId,
)
from src.infrastructure.models import (
    AccountModel,
    BankImportModel,
    BudgetLineModel,
    BudgetModel,
    CategoryModel,
    IncomeSourceModel,
    ReceiptItemModel,
    ReceiptModel,
    RefreshTokenModel,
    SavingsGoalModel,
    TransactionModel,
    UserModel,
)


def ensure_aware(timestamp: datetime) -> datetime:
    if timestamp.tzinfo is None:
        return timestamp.replace(tzinfo=UTC)
    return timestamp


class SqlAlchemyUserRepository(UserRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_email(self, email: Email) -> User | None:
        result = await self._session.execute(
            select(UserModel).where(UserModel.email == email.value)
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def get_by_id(self, user_id: UserId) -> User | None:
        model = await self._session.get(UserModel, user_id.value)
        return self._to_entity(model) if model else None

    async def save(self, user: User) -> None:
        self._session.add(
            UserModel(
                id=user.id.value,
                email=user.email.value,
                password_hash=user.password_hash,
                created_at=user.created_at,
            )
        )
        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise DuplicateEmailError(user.email.value) from exc

    def _to_entity(self, model: UserModel) -> User:
        return User(
            id=UserId(model.id),
            email=Email(model.email),
            password_hash=model.password_hash,
            created_at=ensure_aware(model.created_at),
        )


class SqlAlchemyRefreshTokenRepository(RefreshTokenRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def save(self, refresh_token: RefreshToken) -> None:
        self._session.add(
            RefreshTokenModel(
                id=refresh_token.id.value,
                user_id=refresh_token.user_id.value,
                token_hash=refresh_token.token_hash,
                expires_at=refresh_token.expires_at,
                revoked_at=refresh_token.revoked_at,
            )
        )
        await self._session.commit()

    async def get_by_hash(self, token_hash: str) -> RefreshToken | None:
        result = await self._session.execute(
            select(RefreshTokenModel).where(RefreshTokenModel.token_hash == token_hash)
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def revoke(self, token_id: RefreshTokenId) -> None:
        model = await self._session.get(RefreshTokenModel, token_id.value)
        if model is None:
            return
        token = self._to_entity(model)
        token.revoke()
        model.revoked_at = token.revoked_at
        await self._session.commit()

    def _to_entity(self, model: RefreshTokenModel) -> RefreshToken:
        return RefreshToken(
            id=RefreshTokenId(model.id),
            user_id=UserId(model.user_id),
            token_hash=model.token_hash,
            expires_at=ensure_aware(model.expires_at),
            revoked_at=ensure_aware(model.revoked_at) if model.revoked_at else None,
        )


class SqlAlchemyAccountRepository(AccountRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def save(self, account: Account) -> None:
        model = await self._session.get(AccountModel, account.id.value)
        if model is None:
            self._session.add(
                AccountModel(
                    id=account.id.value,
                    user_id=account.user_id.value,
                    name=account.name,
                    account_type=account.account_type.value,
                    balance=account.balance,
                    currency=account.currency,
                    color=account.color,
                )
            )
        else:
            model.name = account.name
            model.account_type = account.account_type.value
            model.balance = account.balance
            model.currency = account.currency
            model.color = account.color
        await self._session.commit()

    async def list_by_user(self, user_id: UserId) -> list[Account]:
        result = await self._session.execute(
            select(AccountModel)
            .where(AccountModel.user_id == user_id.value)
            .order_by(AccountModel.name.asc())
        )
        return [self._to_entity(model) for model in result.scalars().all()]

    async def get_by_id_for_user(self, account_id: AccountId, user_id: UserId) -> Account | None:
        result = await self._session.execute(
            select(AccountModel).where(
                AccountModel.id == account_id.value,
                AccountModel.user_id == user_id.value,
            )
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def delete(self, account_id: AccountId, user_id: UserId) -> None:
        result = await self._session.execute(
            select(AccountModel).where(
                AccountModel.id == account_id.value,
                AccountModel.user_id == user_id.value,
            )
        )
        model = result.scalar_one_or_none()
        if model:
            await self._session.delete(model)
            await self._session.commit()

    def _to_entity(self, model: AccountModel) -> Account:
        return Account(
            id=AccountId(model.id),
            user_id=UserId(model.user_id),
            name=model.name,
            account_type=AccountType(model.account_type),
            balance=model.balance,
            currency=model.currency,
            color=model.color,
        )


class SqlAlchemyIncomeSourceRepository(IncomeSourceRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def save(self, source: IncomeSource) -> None:
        model = await self._session.get(IncomeSourceModel, source.id.value)
        if model is None:
            self._session.add(
                IncomeSourceModel(
                    id=source.id.value,
                    user_id=source.user_id.value,
                    name=source.name,
                    amount=source.amount,
                    frequency=source.frequency.value,
                )
            )
        else:
            model.name = source.name
            model.amount = source.amount
            model.frequency = source.frequency.value
        await self._session.commit()

    async def list_by_user(self, user_id: UserId) -> list[IncomeSource]:
        result = await self._session.execute(
            select(IncomeSourceModel)
            .where(IncomeSourceModel.user_id == user_id.value)
            .order_by(IncomeSourceModel.name.asc())
        )
        return [self._to_entity(m) for m in result.scalars().all()]

    async def get_by_id_for_user(
        self, source_id: IncomeSourceId, user_id: UserId
    ) -> IncomeSource | None:
        result = await self._session.execute(
            select(IncomeSourceModel).where(
                IncomeSourceModel.id == source_id.value,
                IncomeSourceModel.user_id == user_id.value,
            )
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def delete(self, source_id: IncomeSourceId, user_id: UserId) -> None:
        result = await self._session.execute(
            select(IncomeSourceModel).where(
                IncomeSourceModel.id == source_id.value,
                IncomeSourceModel.user_id == user_id.value,
            )
        )
        model = result.scalar_one_or_none()
        if model:
            await self._session.delete(model)
            await self._session.commit()

    def _to_entity(self, model: IncomeSourceModel) -> IncomeSource:
        return IncomeSource(
            id=IncomeSourceId(model.id),
            user_id=UserId(model.user_id),
            name=model.name,
            amount=model.amount,
            frequency=Frequency(model.frequency),
        )


class SqlAlchemyCategoryRepository(CategoryRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def save(self, category: Category) -> None:
        model = await self._session.get(CategoryModel, category.id.value)
        if model is None:
            self._session.add(
                CategoryModel(
                    id=category.id.value,
                    user_id=category.user_id.value,
                    name=category.name,
                    color=category.color,
                )
            )
        else:
            model.name = category.name
            model.color = category.color
        await self._session.commit()

    async def save_many(self, categories: list[Category]) -> None:
        for category in categories:
            self._session.add(
                CategoryModel(
                    id=category.id.value,
                    user_id=category.user_id.value,
                    name=category.name,
                    color=category.color,
                )
            )
        await self._session.commit()

    async def list_by_user(self, user_id: UserId) -> list[Category]:
        result = await self._session.execute(
            select(CategoryModel)
            .where(CategoryModel.user_id == user_id.value)
            .order_by(CategoryModel.name.asc())
        )
        return [self._to_entity(m) for m in result.scalars().all()]

    async def get_by_id_for_user(
        self, category_id: CategoryId, user_id: UserId
    ) -> Category | None:
        result = await self._session.execute(
            select(CategoryModel).where(
                CategoryModel.id == category_id.value,
                CategoryModel.user_id == user_id.value,
            )
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def delete(self, category_id: CategoryId, user_id: UserId) -> None:
        result = await self._session.execute(
            select(CategoryModel).where(
                CategoryModel.id == category_id.value,
                CategoryModel.user_id == user_id.value,
            )
        )
        model = result.scalar_one_or_none()
        if model:
            await self._session.delete(model)
            await self._session.commit()

    def _to_entity(self, model: CategoryModel) -> Category:
        return Category(
            id=CategoryId(model.id),
            user_id=UserId(model.user_id),
            name=model.name,
            color=model.color,
        )


class SqlAlchemyTransactionRepository(TransactionRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def save(self, transaction: Transaction) -> None:
        model = await self._session.get(TransactionModel, transaction.id.value)
        if model is None:
            self._session.add(
                TransactionModel(
                    id=transaction.id.value,
                    user_id=transaction.user_id.value,
                    account_id=transaction.account_id.value,
                    category_id=transaction.category_id.value,
                    title=transaction.title,
                    amount=transaction.amount,
                    transaction_type=transaction.transaction_type.value,
                    date=transaction.date,
                    note=transaction.note,
                )
            )
        else:
            model.category_id = transaction.category_id.value
            model.title = transaction.title
            model.amount = transaction.amount
            model.transaction_type = transaction.transaction_type.value
            model.date = transaction.date
            model.note = transaction.note
        await self._session.commit()

    async def list_by_user(
        self,
        user_id: UserId,
        account_id: AccountId | None,
        category_id: CategoryId | None,
        from_date: DateType | None,
        to_date: DateType | None,
        limit: int,
        offset: int,
    ) -> list[Transaction]:
        conditions = [TransactionModel.user_id == user_id.value]
        if account_id:
            conditions.append(TransactionModel.account_id == account_id.value)
        if category_id:
            conditions.append(TransactionModel.category_id == category_id.value)
        if from_date:
            conditions.append(TransactionModel.date >= from_date)
        if to_date:
            conditions.append(TransactionModel.date <= to_date)

        result = await self._session.execute(
            select(TransactionModel)
            .where(and_(*conditions))
            .order_by(TransactionModel.date.desc())
            .offset(offset)
            .limit(limit)
        )
        return [self._to_entity(m) for m in result.scalars().all()]

    async def get_by_id_for_user(
        self, transaction_id: TransactionId, user_id: UserId
    ) -> Transaction | None:
        result = await self._session.execute(
            select(TransactionModel).where(
                TransactionModel.id == transaction_id.value,
                TransactionModel.user_id == user_id.value,
            )
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def delete(self, transaction_id: TransactionId, user_id: UserId) -> None:
        result = await self._session.execute(
            select(TransactionModel).where(
                TransactionModel.id == transaction_id.value,
                TransactionModel.user_id == user_id.value,
            )
        )
        model = result.scalar_one_or_none()
        if model:
            await self._session.delete(model)
            await self._session.commit()

    def _to_entity(self, model: TransactionModel) -> Transaction:
        return Transaction(
            id=TransactionId(model.id),
            user_id=UserId(model.user_id),
            account_id=AccountId(model.account_id),
            category_id=CategoryId(model.category_id),
            title=model.title,
            amount=model.amount,
            transaction_type=TransactionType(model.transaction_type),
            date=model.date,
            note=model.note,
        )


class SqlAlchemyBankImportRepository(BankImportRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def save(self, bank_import: BankImport) -> None:
        self._session.add(
            BankImportModel(
                id=bank_import.id.value,
                user_id=bank_import.user_id.value,
                account_id=bank_import.account_id.value,
                source_name=bank_import.source_name,
                row_count=bank_import.row_count,
                imported_count=bank_import.imported_count,
                created_at=bank_import.created_at,
            )
        )
        await self._session.commit()

    async def list_by_user(self, user_id: UserId) -> list[BankImport]:
        result = await self._session.execute(
            select(BankImportModel)
            .where(BankImportModel.user_id == user_id.value)
            .order_by(BankImportModel.created_at.desc())
        )
        return [self._to_entity(m) for m in result.scalars().all()]

    def _to_entity(self, model: BankImportModel) -> BankImport:
        return BankImport(
            id=BankImportId(model.id),
            user_id=UserId(model.user_id),
            account_id=AccountId(model.account_id),
            source_name=model.source_name,
            row_count=model.row_count,
            imported_count=model.imported_count,
            created_at=ensure_aware(model.created_at),
        )


class SqlAlchemyBudgetRepository(BudgetRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_month(self, user_id: UserId, year: int, month: int) -> Budget | None:
        result = await self._session.execute(
            select(BudgetModel).where(
                BudgetModel.user_id == user_id.value,
                BudgetModel.year == year,
                BudgetModel.month == month,
            )
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def save(self, budget: Budget) -> None:
        model = await self._session.get(BudgetModel, budget.id.value)
        if model is None:
            model = BudgetModel(
                id=budget.id.value,
                user_id=budget.user_id.value,
                year=budget.year,
                month=budget.month,
                lines=[],
            )
            self._session.add(model)
        else:
            for existing_line in list(model.lines):
                await self._session.delete(existing_line)
            await self._session.flush()
        from uuid import uuid4
        model.lines = [
            BudgetLineModel(
                id=uuid4(),
                budget_id=budget.id.value,
                category_id=line.category_id.value,
                planned_amount=line.planned_amount,
            )
            for line in budget.lines
        ]
        await self._session.commit()

    def _to_entity(self, model: BudgetModel) -> Budget:
        return Budget(
            id=BudgetId(model.id),
            user_id=UserId(model.user_id),
            year=model.year,
            month=model.month,
            lines=[
                BudgetLine(
                    category_id=CategoryId(line.category_id),
                    planned_amount=line.planned_amount,
                )
                for line in model.lines
            ],
        )


class SqlAlchemyReceiptRepository(ReceiptRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def save(self, receipt: Receipt) -> None:
        from uuid import uuid4

        model = await self._session.get(ReceiptModel, receipt.id.value)
        if model is None:
            model = ReceiptModel(
                id=receipt.id.value,
                user_id=receipt.user_id.value,
                merchant=receipt.merchant,
                total=receipt.total,
                date=receipt.date,
                transaction_id=receipt.transaction_id,
                created_at=receipt.created_at,
                items=[],
            )
            self._session.add(model)
        model.items = [
            ReceiptItemModel(
                id=uuid4(),
                receipt_id=receipt.id.value,
                name=item.name,
                amount=item.amount,
            )
            for item in receipt.items
        ]
        await self._session.commit()

    async def list_by_user(self, user_id: UserId) -> list[Receipt]:
        result = await self._session.execute(
            select(ReceiptModel)
            .where(ReceiptModel.user_id == user_id.value)
            .order_by(ReceiptModel.created_at.desc())
        )
        return [self._to_entity(m) for m in result.scalars().all()]

    async def get_by_id_for_user(
        self, receipt_id: ReceiptId, user_id: UserId
    ) -> Receipt | None:
        result = await self._session.execute(
            select(ReceiptModel).where(
                ReceiptModel.id == receipt_id.value,
                ReceiptModel.user_id == user_id.value,
            )
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    def _to_entity(self, model: ReceiptModel) -> Receipt:
        return Receipt(
            id=ReceiptId(model.id),
            user_id=UserId(model.user_id),
            merchant=model.merchant,
            total=model.total,
            date=model.date,
            transaction_id=model.transaction_id,
            created_at=ensure_aware(model.created_at),
            items=[ReceiptItem(name=i.name, amount=i.amount) for i in model.items],
        )


class SqlAlchemySavingsGoalRepository(SavingsGoalRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def save(self, goal: SavingsGoal) -> None:
        model = await self._session.get(SavingsGoalModel, goal.id.value)
        if model is None:
            model = SavingsGoalModel(
                id=goal.id.value,
                user_id=goal.user_id.value,
                name=goal.name,
                target_amount=goal.target_amount,
                current_amount=goal.current_amount,
                deadline=goal.deadline,
                created_at=goal.created_at,
            )
            self._session.add(model)
        else:
            model.name = goal.name
            model.target_amount = goal.target_amount
            model.current_amount = goal.current_amount
            model.deadline = goal.deadline
        await self._session.commit()

    async def list_by_user(self, user_id: UserId) -> list[SavingsGoal]:
        result = await self._session.execute(
            select(SavingsGoalModel)
            .where(SavingsGoalModel.user_id == user_id.value)
            .order_by(SavingsGoalModel.created_at.asc())
        )
        return [self._to_entity(m) for m in result.scalars().all()]

    async def get_by_id_for_user(
        self, goal_id: SavingsGoalId, user_id: UserId
    ) -> SavingsGoal | None:
        result = await self._session.execute(
            select(SavingsGoalModel).where(
                SavingsGoalModel.id == goal_id.value,
                SavingsGoalModel.user_id == user_id.value,
            )
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def delete(self, goal_id: SavingsGoalId, user_id: UserId) -> None:
        result = await self._session.execute(
            select(SavingsGoalModel).where(
                SavingsGoalModel.id == goal_id.value,
                SavingsGoalModel.user_id == user_id.value,
            )
        )
        model = result.scalar_one_or_none()
        if model:
            await self._session.delete(model)
            await self._session.commit()

    def _to_entity(self, model: SavingsGoalModel) -> SavingsGoal:
        return SavingsGoal(
            id=SavingsGoalId(model.id),
            user_id=UserId(model.user_id),
            name=model.name,
            target_amount=model.target_amount,
            current_amount=model.current_amount,
            deadline=model.deadline,
            created_at=ensure_aware(model.created_at),
        )
