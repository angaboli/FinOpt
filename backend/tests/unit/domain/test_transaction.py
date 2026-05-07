from datetime import date
from decimal import Decimal

import pytest

from src.domain.entities.transaction import Transaction, TransactionType
from src.domain.exceptions import InvalidTransactionError
from src.domain.value_objects import AccountId, CategoryId, UserId


def test_create_transaction_stores_fields() -> None:
    tx = Transaction.create(
        user_id=UserId.new(),
        account_id=AccountId.new(),
        category_id=CategoryId.new(),
        title="Salaire",
        amount=Decimal("3200.00"),
        transaction_type=TransactionType.INCOME,
        date=date(2026, 5, 5),
        note=None,
    )
    assert tx.title == "Salaire"
    assert tx.amount == Decimal("3200.00")
    assert tx.transaction_type == TransactionType.INCOME
    assert tx.note is None


def test_transaction_requires_non_empty_title() -> None:
    with pytest.raises(InvalidTransactionError):
        Transaction.create(
            user_id=UserId.new(),
            account_id=AccountId.new(),
            category_id=CategoryId.new(),
            title="  ",
            amount=Decimal("100"),
            transaction_type=TransactionType.EXPENSE,
            date=date.today(),
            note=None,
        )


def test_transaction_rejects_zero_amount() -> None:
    with pytest.raises(InvalidTransactionError):
        Transaction.create(
            user_id=UserId.new(),
            account_id=AccountId.new(),
            category_id=CategoryId.new(),
            title="Courses",
            amount=Decimal("0"),
            transaction_type=TransactionType.EXPENSE,
            date=date.today(),
            note=None,
        )


def test_transaction_rejects_negative_amount() -> None:
    with pytest.raises(InvalidTransactionError):
        Transaction.create(
            user_id=UserId.new(),
            account_id=AccountId.new(),
            category_id=CategoryId.new(),
            title="Courses",
            amount=Decimal("-10"),
            transaction_type=TransactionType.EXPENSE,
            date=date.today(),
            note=None,
        )


def test_transaction_title_is_stripped() -> None:
    tx = Transaction.create(
        user_id=UserId.new(),
        account_id=AccountId.new(),
        category_id=CategoryId.new(),
        title="  Courses  ",
        amount=Decimal("50"),
        transaction_type=TransactionType.EXPENSE,
        date=date.today(),
        note=None,
    )
    assert tx.title == "Courses"


def test_update_transaction_changes_fields() -> None:
    tx = Transaction.create(
        user_id=UserId.new(),
        account_id=AccountId.new(),
        category_id=CategoryId.new(),
        title="Salaire",
        amount=Decimal("3200"),
        transaction_type=TransactionType.INCOME,
        date=date(2026, 5, 1),
        note=None,
    )
    new_cat = CategoryId.new()
    tx.update(
        category_id=new_cat,
        title="Bonus",
        amount=Decimal("500"),
        transaction_type=TransactionType.INCOME,
        date=date(2026, 5, 5),
        note="Q1 bonus",
    )
    assert tx.title == "Bonus"
    assert tx.amount == Decimal("500")
    assert tx.note == "Q1 bonus"
    assert tx.category_id == new_cat


def test_transaction_type_values() -> None:
    assert TransactionType.INCOME.value == "INCOME"
    assert TransactionType.EXPENSE.value == "EXPENSE"
