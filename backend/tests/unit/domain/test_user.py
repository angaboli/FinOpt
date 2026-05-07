from datetime import UTC, datetime
from uuid import UUID

import pytest

from src.domain.entities.user import User
from src.domain.exceptions import InvalidUserError
from src.domain.value_objects import Email, UserId


def test_create_user_requires_password_hash() -> None:
    with pytest.raises(InvalidUserError):
        User.create(email=Email("person@example.com"), password_hash="")


def test_create_user_sets_identity_and_timestamp() -> None:
    user = User.create(email=Email("person@example.com"), password_hash="hash")

    assert isinstance(user.id.value, UUID)
    assert user.email.value == "person@example.com"
    assert user.password_hash == "hash"
    assert user.created_at.tzinfo == UTC


def test_rehydrate_user_preserves_state() -> None:
    created_at = datetime(2026, 1, 2, tzinfo=UTC)
    user = User(
        id=UserId.new(),
        email=Email("person@example.com"),
        password_hash="hash",
        created_at=created_at,
    )

    assert user.created_at == created_at
