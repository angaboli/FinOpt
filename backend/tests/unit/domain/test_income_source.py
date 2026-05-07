from decimal import Decimal

import pytest

from src.domain.entities.income_source import Frequency, IncomeSource
from src.domain.exceptions import InvalidIncomeSourceError
from src.domain.value_objects import UserId


def test_create_income_source_stores_fields() -> None:
    source = IncomeSource.create(
        user_id=UserId.new(),
        name="Salaire",
        amount=Decimal("3200.00"),
        frequency=Frequency.MONTHLY,
    )
    assert source.name == "Salaire"
    assert source.amount == Decimal("3200.00")
    assert source.frequency == Frequency.MONTHLY


def test_income_source_requires_non_empty_name() -> None:
    with pytest.raises(InvalidIncomeSourceError):
        IncomeSource.create(
            user_id=UserId.new(),
            name="  ",
            amount=Decimal("100"),
            frequency=Frequency.MONTHLY,
        )


def test_income_source_rejects_negative_amount() -> None:
    with pytest.raises(InvalidIncomeSourceError):
        IncomeSource.create(
            user_id=UserId.new(),
            name="Salaire",
            amount=Decimal("-0.01"),
            frequency=Frequency.MONTHLY,
        )


def test_income_source_allows_zero_amount() -> None:
    source = IncomeSource.create(
        user_id=UserId.new(),
        name="Bonus",
        amount=Decimal("0"),
        frequency=Frequency.ONCE,
    )
    assert source.amount == Decimal("0")


def test_income_source_name_is_stripped() -> None:
    source = IncomeSource.create(
        user_id=UserId.new(),
        name="  Salaire  ",
        amount=Decimal("100"),
        frequency=Frequency.MONTHLY,
    )
    assert source.name == "Salaire"


def test_update_income_source_changes_fields() -> None:
    source = IncomeSource.create(
        user_id=UserId.new(),
        name="Salaire",
        amount=Decimal("3200"),
        frequency=Frequency.MONTHLY,
    )
    source.update(name="Freelance", amount=Decimal("1500"), frequency=Frequency.QUARTERLY)
    assert source.name == "Freelance"
    assert source.amount == Decimal("1500")
    assert source.frequency == Frequency.QUARTERLY


def test_update_income_source_rejects_empty_name() -> None:
    source = IncomeSource.create(
        user_id=UserId.new(),
        name="Salaire",
        amount=Decimal("3200"),
        frequency=Frequency.MONTHLY,
    )
    with pytest.raises(InvalidIncomeSourceError):
        source.update(name="", amount=Decimal("3200"), frequency=Frequency.MONTHLY)


def test_frequency_values_are_valid() -> None:
    expected = {"MONTHLY", "WEEKLY", "BIWEEKLY", "QUARTERLY", "ANNUAL", "ONCE"}
    assert {f.value for f in Frequency} == expected
