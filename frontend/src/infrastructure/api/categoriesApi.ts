import type { Category, CategoryFormValues, CategoryUsage } from "@/domain/categories/types";
import { httpClient } from "@/infrastructure/api/httpClient";

interface CategoryApiResponse {
  id: string;
  user_id: string;
  name: string;
  color: string;
  usage: string;
}

function toCategory(r: CategoryApiResponse): Category {
  return {
    id: r.id,
    userId: r.user_id,
    name: r.name,
    color: r.color,
    usage: (r.usage as CategoryUsage) ?? "EXPENSE",
  };
}

export const categoriesApi = {
  async list(): Promise<Category[]> {
    const response = await httpClient.get<CategoryApiResponse[]>("/categories");
    return response.data.map(toCategory);
  },

  async create(values: CategoryFormValues): Promise<Category> {
    const response = await httpClient.post<CategoryApiResponse>("/categories", {
      name: values.name,
      color: values.color,
      usage: values.usage,
    });
    return toCategory(response.data);
  },

  async update(id: string, values: CategoryFormValues): Promise<Category> {
    const response = await httpClient.put<CategoryApiResponse>(`/categories/${id}`, {
      name: values.name,
      color: values.color,
      usage: values.usage,
    });
    return toCategory(response.data);
  },

  async remove(id: string): Promise<void> {
    await httpClient.delete(`/categories/${id}`);
  },
};
