import pytest

from src.domain.exceptions import InvalidEmailError
from src.domain.value_objects import Email


def test_email_is_normalized() -> None:
    email = Email("  USER@Example.COM  ")

    assert email.value == "user@example.com"


def test_email_rejects_invalid_value() -> None:
    with pytest.raises(InvalidEmailError):
        Email("not-an-email")
