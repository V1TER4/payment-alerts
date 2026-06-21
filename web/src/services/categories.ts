import api from '../lib/api';
import { Category } from '../types';

export async function listCategories() {
  const { data } = await api.get<Category[]>('/categories');
  return data;
}

export async function createCategory(payload: { name: string; color?: string }) {
  const { data } = await api.post<Category>('/categories', payload);
  return data;
}

export async function updateCategory(id: string, payload: { name?: string; color?: string }) {
  const { data } = await api.patch<Category>(`/categories/${id}`, payload);
  return data;
}

export async function deleteCategory(id: string) {
  const { data } = await api.delete(`/categories/${id}`);
  return data;
}
