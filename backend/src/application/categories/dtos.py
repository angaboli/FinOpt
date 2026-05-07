from dataclasses import dataclass


@dataclass(frozen=True)
class CreateCategoryCommand:
    user_id: str
    name: str
    color: str


@dataclass(frozen=True)
class UpdateCategoryCommand:
    user_id: str
    category_id: str
    name: str
    color: str


@dataclass(frozen=True)
class ListCategoriesQuery:
    user_id: str


@dataclass(frozen=True)
class DeleteCategoryCommand:
    user_id: str
    category_id: str


@dataclass(frozen=True)
class CategoryResult:
    id: str
    user_id: str
    name: str
    color: str
