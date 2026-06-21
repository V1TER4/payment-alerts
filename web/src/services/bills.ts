import api from '../lib/api';
import { Bill } from '../types';

export type BillFormValues = {
  name: string;
  description?: string;
  amount: number;
  dueDate?: string;
  categoryId?: string;
  categoryName?: string;
  isRecurring?: boolean;
  recurrenceFrequency?: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  recurrenceDayOfMonth?: number;
  recurrenceDayOfWeek?: number;
  recurrenceDay?: number;
  recurrenceMonth?: number;
  status?: 'PENDING' | 'PAID' | 'OVERDUE';
};

export async function listBills(params?: {
  from?: string;
  to?: string;
  status?: string;
  categoryId?: string;
}) {
  const { data } = await api.get<{ items: Bill[] }>('/bills', { params });
  return data;
}

export async function getBill(id: string) {
  const { data } = await api.get<Bill>(`/bills/${id}`);
  return data;
}

export async function createBill(payload: BillFormValues) {
  const { data } = await api.post<Bill>('/bills', payload);
  return data;
}

export async function updateBill(id: string, payload: BillFormValues) {
  const { data } = await api.patch<Bill>(`/bills/${id}`, payload);
  return data;
}

export async function deleteBill(id: string) {
  const { data } = await api.delete(`/bills/${id}`);
  return data;
}
