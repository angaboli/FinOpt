from src.application.categories.dtos import (
    CategoryResult,
    CreateCategoryCommand,
    DeleteCategoryCommand,
    ListCategoriesQuery,
    UpdateCategoryCommand,
)
from src.domain.entities.category import Category
from src.domain.exceptions import CategoryNotFoundError
from src.domain.ports.repositories import CategoryRepository
from src.domain.value_objects import CategoryId, UserId


def to_category_result(category: Category) -> CategoryResult:
    return CategoryResult(
        id=str(category.id.value),
        user_id=str(category.user_id.value),
        name=category.name,
        color=category.color,
        usage=category.usage,
    )


class CreateCategory:
    def __init__(self, categories: CategoryRepository) -> None:
        self._categories = categories

    async def execute(self, command: CreateCategoryCommand) -> CategoryResult:
        category = Category.create(
            user_id=UserId.from_string(command.user_id),
            name=command.name,
            color=command.color,
            usage=command.usage,
        )
        await self._categories.save(category)
        return to_category_result(category)


class ListCategories:
    def __init__(self, categories: CategoryRepository) -> None:
        self._categories = categories

    async def execute(self, query: ListCategoriesQuery) -> list[CategoryResult]:
        user_id = UserId.from_string(query.user_id)
        existing = await self._categories.list_by_user(user_id)
        if not existing:
            defaults = Category.create_defaults(user_id)
            await self._categories.save_many(defaults)
            return [to_category_result(c) for c in defaults]
        return [to_category_result(c) for c in existing]


class UpdateCategory:
    def __init__(self, categories: CategoryRepository) -> None:
        self._categories = categories

    async def execute(self, command: UpdateCategoryCommand) -> CategoryResult:
        user_id = UserId.from_string(command.user_id)
        category = await self._categories.get_by_id_for_user(
            CategoryId.from_string(command.category_id), user_id
        )
        if category is None:
            raise CategoryNotFoundError("Category not found")
        category.update(name=command.name, color=command.color, usage=command.usage)
        await self._categories.save(category)
        return to_category_result(category)


class DeleteCategory:
    def __init__(self, categories: CategoryRepository) -> None:
        self._categories = categories

    async def execute(self, command: DeleteCategoryCommand) -> None:
        user_id = UserId.from_string(command.user_id)
        category_id = CategoryId.from_string(command.category_id)
        category = await self._categories.get_by_id_for_user(category_id, user_id)
        if category is None:
            raise CategoryNotFoundError("Category not found")
        await self._categories.delete(category_id, user_id)
