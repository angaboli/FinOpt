from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

from src.domain.exceptions import InvalidCategoryError
from src.domain.value_objects import CategoryId, UserId

CategoryUsage = Literal["EXPENSE", "INCOME", "BOTH"]

# (name, color, usage)
_DEFAULT_EXPENSE_CATEGORIES: list[tuple[str, str, str]] = [
    ("Alimentation", "#22C55E", "EXPENSE"),
    ("Transport", "#3B82F6", "EXPENSE"),
    ("Logement", "#8B5CF6", "EXPENSE"),
    ("Santé", "#EF4444", "EXPENSE"),
    ("Loisirs", "#F59E0B", "EXPENSE"),
    ("Restaurant", "#F97316", "EXPENSE"),
    ("Shopping", "#06B6D4", "EXPENSE"),
    ("Éducation", "#10B981", "EXPENSE"),
    ("Autres", "#6B7280", "BOTH"),
]

_DEFAULT_INCOME_CATEGORIES: list[tuple[str, str, str]] = [
    ("Salaire", "#16A34A", "INCOME"),
    ("Freelance", "#2563EB", "INCOME"),
    ("Dons", "#D97706", "INCOME"),
    ("Crypto", "#7C3AED", "INCOME"),
    ("Investissements", "#0891B2", "INCOME"),
    ("Remboursements", "#0D9488", "INCOME"),
    ("Divers", "#6B7280", "INCOME"),
]

DEFAULT_CATEGORIES = _DEFAULT_EXPENSE_CATEGORIES + _DEFAULT_INCOME_CATEGORIES


@dataclass
class Category:
    id: CategoryId
    user_id: UserId
    name: str
    color: str
    usage: str = field(default="EXPENSE")

    @classmethod
    def create(cls, user_id: UserId, name: str, color: str, usage: str = "EXPENSE") -> Category:
        return cls(id=CategoryId.new(), user_id=user_id, name=name, color=color, usage=usage)

    @classmethod
    def create_defaults(cls, user_id: UserId) -> list[Category]:
        return [cls.create(user_id, name, color, usage) for name, color, usage in DEFAULT_CATEGORIES]

    def __post_init__(self) -> None:
        normalized_name = self.name.strip()
        normalized_color = self.color.strip()
        if not normalized_name:
            raise InvalidCategoryError("Category name is required")
        if not normalized_color:
            raise InvalidCategoryError("Category color is required")
        if self.usage not in ("EXPENSE", "INCOME", "BOTH"):
            raise InvalidCategoryError("Category usage must be EXPENSE, INCOME, or BOTH")
        object.__setattr__(self, "name", normalized_name)
        object.__setattr__(self, "color", normalized_color)

    def update(self, name: str, color: str, usage: str = "EXPENSE") -> None:
        self.name = name
        self.color = color
        self.usage = usage
        self.__post_init__()
