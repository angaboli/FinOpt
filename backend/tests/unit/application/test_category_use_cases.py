import pytest

from src.application.categories.dtos import (
    CreateCategoryCommand,
    DeleteCategoryCommand,
    ListCategoriesQuery,
    UpdateCategoryCommand,
)
from src.application.categories.use_cases import (
    CreateCategory,
    DeleteCategory,
    ListCategories,
    UpdateCategory,
)
from src.domain.entities.category import Category
from src.domain.exceptions import CategoryNotFoundError
from src.domain.ports.repositories import CategoryRepository
from src.domain.value_objects import CategoryId, UserId


class InMemoryCategoryRepository(CategoryRepository):
    def __init__(self) -> None:
        self.categories: dict[str, Category] = {}

    async def save(self, category: Category) -> None:
        self.categories[str(category.id.value)] = category

    async def save_many(self, categories: list[Category]) -> None:
        for category in categories:
            self.categories[str(category.id.value)] = category

    async def list_by_user(self, user_id: UserId) -> list[Category]:
        return [c for c in self.categories.values() if c.user_id == user_id]

    async def get_by_id_for_user(
        self, category_id: CategoryId, user_id: UserId
    ) -> Category | None:
        category = self.categories.get(str(category_id.value))
        if category is None or category.user_id != user_id:
            return None
        return category

    async def delete(self, category_id: CategoryId, user_id: UserId) -> None:
        category = await self.get_by_id_for_user(category_id, user_id)
        if category:
            del self.categories[str(category.id.value)]


@pytest.mark.asyncio
async def test_create_category_saves_and_returns_result() -> None:
    repo = InMemoryCategoryRepository()
    user_id = str(UserId.new().value)

    result = await CreateCategory(repo).execute(
        CreateCategoryCommand(user_id=user_id, name="Alimentation", color="#22C55E")
    )

    assert result.name == "Alimentation"
    assert result.color == "#22C55E"
    assert result.user_id == user_id
    assert len(repo.categories) == 1


@pytest.mark.asyncio
async def test_list_categories_returns_only_user_categories() -> None:
    repo = InMemoryCategoryRepository()
    user_a = str(UserId.new().value)
    user_b = str(UserId.new().value)
    create = CreateCategory(repo)
    await create.execute(CreateCategoryCommand(user_a, "Alimentation", "#22C55E"))
    await create.execute(CreateCategoryCommand(user_b, "Transport", "#3B82F6"))

    results = await ListCategories(repo).execute(ListCategoriesQuery(user_id=user_a))

    assert len(results) == 1
    assert results[0].name == "Alimentation"


@pytest.mark.asyncio
async def test_list_categories_seeds_defaults_when_user_has_none() -> None:
    repo = InMemoryCategoryRepository()
    user_id = str(UserId.new().value)

    results = await ListCategories(repo).execute(ListCategoriesQuery(user_id=user_id))

    assert len(results) >= 8
    names = [r.name for r in results]
    assert "Alimentation" in names
    assert "Transport" in names


@pytest.mark.asyncio
async def test_list_categories_does_not_seed_again_when_user_has_categories() -> None:
    repo = InMemoryCategoryRepository()
    user_id = str(UserId.new().value)
    await CreateCategory(repo).execute(
        CreateCategoryCommand(user_id=user_id, name="Ma catégorie", color="#000000")
    )

    results = await ListCategories(repo).execute(ListCategoriesQuery(user_id=user_id))

    assert len(results) == 1
    assert results[0].name == "Ma catégorie"


@pytest.mark.asyncio
async def test_update_category_changes_fields() -> None:
    repo = InMemoryCategoryRepository()
    user_id = str(UserId.new().value)
    created = await CreateCategory(repo).execute(
        CreateCategoryCommand(user_id=user_id, name="Alimentation", color="#22C55E")
    )

    updated = await UpdateCategory(repo).execute(
        UpdateCategoryCommand(
            user_id=user_id,
            category_id=created.id,
            name="Courses",
            color="#16A34A",
        )
    )

    assert updated.name == "Courses"
    assert updated.color == "#16A34A"


@pytest.mark.asyncio
async def test_update_category_raises_when_not_found() -> None:
    repo = InMemoryCategoryRepository()

    with pytest.raises(CategoryNotFoundError):
        await UpdateCategory(repo).execute(
            UpdateCategoryCommand(
                user_id=str(UserId.new().value),
                category_id=str(CategoryId.new().value),
                name="Courses",
                color="#16A34A",
            )
        )


@pytest.mark.asyncio
async def test_delete_category_removes_it() -> None:
    repo = InMemoryCategoryRepository()
    user_id = str(UserId.new().value)
    created = await CreateCategory(repo).execute(
        CreateCategoryCommand(user_id=user_id, name="Alimentation", color="#22C55E")
    )

    await DeleteCategory(repo).execute(
        DeleteCategoryCommand(user_id=user_id, category_id=created.id)
    )

    assert len(await repo.list_by_user(UserId.from_string(user_id))) == 0


@pytest.mark.asyncio
async def test_delete_category_raises_when_not_found() -> None:
    repo = InMemoryCategoryRepository()

    with pytest.raises(CategoryNotFoundError):
        await DeleteCategory(repo).execute(
            DeleteCategoryCommand(
                user_id=str(UserId.new().value),
                category_id=str(CategoryId.new().value),
            )
        )
