from __future__ import annotations

from dataclasses import dataclass

from src.domain.exceptions import InvalidCategoryError
from src.domain.value_objects import CategoryId, UserId

DEFAULT_CATEGORIES: list[tuple[str, str]] = [
    ("Alimentation", "#22C55E"),
    ("Transport", "#3B82F6"),
    ("Logement", "#8B5CF6"),
    ("Santé", "#EF4444"),
    ("Loisirs", "#F59E0B"),
    ("Abonnements", "#EC4899"),
    ("Restaurant", "#F97316"),
    ("Shopping", "#06B6D4"),
    ("Éducation", "#10B981"),
    ("Autres", "#6B7280"),
]


@dataclass
class Category:
    id: CategoryId
    user_id: UserId
    name: str
    color: str

    @classmethod
    def create(cls, user_id: UserId, name: str, color: str) -> Category:
        return cls(id=CategoryId.new(), user_id=user_id, name=name, color=color)

    @classmethod
    def create_defaults(cls, user_id: UserId) -> list[Category]:
        return [cls.create(user_id, name, color) for name, color in DEFAULT_CATEGORIES]

    def __post_init__(self) -> None:
        normalized_name = self.name.strip()
        normalized_color = self.color.strip()
        if not normalized_name:
            raise InvalidCategoryError("Category name is required")
        if not normalized_color:
            raise InvalidCategoryError("Category color is required")
        object.__setattr__(self, "name", normalized_name)
        object.__setattr__(self, "color", normalized_color)

    def update(self, name: str, color: str) -> None:
        self.name = name
        self.color = color
        self.__post_init__()
