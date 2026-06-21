import api from '../lib/api';
import { Permission, User } from '../types';

export async function updatePreferences(payload: {
  notificationChannels: string[];
  reminderDays: number[];
}) {
  const { data } = await api.patch<User>('/users/me/preferences', payload);
  return data;
}

export async function listUsers() {
  const { data } = await api.get<User[]>('/users');
  return data;
}

export async function updateUserPermissions(id: string, permissions: Permission[]) {
  const { data } = await api.patch<User>(`/users/${id}/permissions`, { permissions });
  return data;
}
