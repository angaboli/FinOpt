import pytest

from src.domain.entities.category import DEFAULT_CATEGORIES, Category
from src.domain.exceptions import InvalidCategoryError
from src.domain.value_objects import UserId


def test_create_category_stores_fields() -> None:
    category = Category.create(user_id=UserId.new(), name="Alimentation", color="#22C55E")
    assert category.name == "Alimentation"
    assert category.color == "#22C55E"


def test_category_requires_non_empty_name() -> None:
    with pytest.raises(InvalidCategoryError):
        Category.create(user_id=UserId.new(), name="", color="#22C55E")


def test_category_rejects_blank_name() -> None:
    with pytest.raises(InvalidCategoryError):
        Category.create(user_id=UserId.new(), name="   ", color="#22C55E")


def test_category_requires_color() -> None:
    with pytest.raises(InvalidCategoryError):
        Category.create(user_id=UserId.new(), name="Transport", color="  ")


def test_category_name_is_stripped() -> None:
    category = Category.create(user_id=UserId.new(), name="  Transport  ", color="#3B82F6")
    assert category.name == "Transport"


def test_category_color_is_stripped() -> None:
    category = Category.create(user_id=UserId.new(), name="Transport", color="  #3B82F6  ")
    assert category.color == "#3B82F6"


def test_update_category_changes_fields() -> None:
    category = Category.create(user_id=UserId.new(), name="Alimentation", color="#22C55E")
    category.update(name="Courses", color="#16A34A")
    assert category.name == "Courses"
    assert category.color == "#16A34A"


def test_update_category_rejects_empty_name() -> None:
    category = Category.create(user_id=UserId.new(), name="Alimentation", color="#22C55E")
    with pytest.raises(InvalidCategoryError):
        category.update(name="", color="#22C55E")


def test_default_categories_are_defined() -> None:
    assert len(DEFAULT_CATEGORIES) >= 8
    for name, color, usage in DEFAULT_CATEGORIES:
        assert name.strip()
        assert color.strip()
        assert usage in ("EXPENSE", "INCOME", "BOTH")


def test_default_category_names_are_unique() -> None:
    names = [name for name, _, _u in DEFAULT_CATEGORIES]
    assert len(names) == len(set(names))
