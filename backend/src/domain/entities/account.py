from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from enum import StrEnum

from src.domain.exceptions import InvalidAccountError
from src.domain.value_objects import AccountId, UserId


class AccountType(StrEnum):
    CURRENT = "CURRENT"
    SAVINGS = "SAVINGS"
    JOINT = "JOINT"
    INVESTMENT = "INVESTMENT"
    CASH = "CASH"


@dataclass
class Account:
    id: AccountId
    user_id: UserId
    name: str
    account_type: AccountType
    balance: Decimal
    currency: str
    color: str

    @classmethod
    def create(
        cls,
        user_id: UserId,
        name: str,
        account_type: AccountType,
        balance: Decimal,
        currency: str,
        color: str,
    ) -> Account:
        return cls(
            id=AccountId.new(),
            user_id=user_id,
            name=name,
            account_type=account_type,
            balance=balance,
            currency=currency,
            color=color,
        )

    def __post_init__(self) -> None:
        normalized_name = self.name.strip()
        normalized_currency = self.currency.strip().upper()
        normalized_color = self.color.strip()

        if not normalized_name:
            raise InvalidAccountError("Account name is required")
        if len(normalized_currency) != 3 or not normalized_currency.isalpha():
            raise InvalidAccountError("Currency must be an ISO 4217 code")
        if not normalized_color:
            raise InvalidAccountError("Account color is required")

        object.__setattr__(self, "name", normalized_name)
        object.__setattr__(self, "currency", normalized_currency)
        object.__setattr__(self, "color", normalized_color)

    def update(
        self,
        name: str,
        account_type: AccountType,
        balance: Decimal,
        currency: str,
        color: str,
    ) -> None:
        self.name = name
        self.account_type = account_type
        self.balance = balance
        self.currency = currency
        self.color = color
        self.__post_init__()
