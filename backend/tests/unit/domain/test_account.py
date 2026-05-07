from decimal import Decimal

import pytest

from src.domain.entities.account import Account, AccountType
from src.domain.exceptions import InvalidAccountError
from src.domain.value_objects import UserId


def test_create_account_normalizes_name_and_currency() -> None:
    account = Account.create(
        user_id=UserId.new(),
        name="  Compte Courant  ",
        account_type=AccountType.CURRENT,
        balance=Decimal("125.50"),
        currency="eur",
        color="#006D36",
    )

    assert account.name == "Compte Courant"
    assert account.currency == "EUR"
    assert account.balance == Decimal("125.50")


def test_create_account_rejects_blank_name() -> None:
    with pytest.raises(InvalidAccountError):
        Account.create(
            user_id=UserId.new(),
            name=" ",
            account_type=AccountType.CURRENT,
            balance=Decimal("0"),
            currency="EUR",
            color="#006D36",
        )


def test_create_account_rejects_invalid_currency() -> None:
    with pytest.raises(InvalidAccountError):
        Account.create(
            user_id=UserId.new(),
            name="Compte",
            account_type=AccountType.CURRENT,
            balance=Decimal("0"),
            currency="EURO",
            color="#006D36",
        )
