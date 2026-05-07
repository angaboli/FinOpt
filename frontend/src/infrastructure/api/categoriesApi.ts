import type { Category, CategoryFormValues } from "@/domain/categories/types";
import { httpClient } from "@/infrastructure/api/httpClient";

interface CategoryApiResponse {
  id: string;
  user_id: string;
  name: string;
  color: string;
}

function toCategory(r: CategoryApiResponse): Category {
  return { id: r.id, userId: r.user_id, name: r.name, color: r.color };
}

export const categoriesApi = {
  async list(): Promise<Category[]> {
    const response = await httpClient.get<CategoryApiResponse[]>("/categories");
    return response.data.map(toCategory);
  },

  async create(values: CategoryFormValues): Promise<Category> {
    const response = await httpClient.post<CategoryApiResponse>("/categories", values);
    return toCategory(response.data);
  },

  async update(id: string, values: CategoryFormValues): Promise<Category> {
    const response = await httpClient.put<CategoryApiResponse>(`/categories/${id}`, values);
    return toCategory(response.data);
  },

  async remove(id: string): Promise<void> {
    await httpClient.delete(`/categories/${id}`);
  },
};
