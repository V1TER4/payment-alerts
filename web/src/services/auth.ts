import api from '../lib/api';
import { AuthResponse, User } from '../types';

export async function login(payload: { email: string; password: string }) {
  const { data } = await api.post<AuthResponse>('/auth/login', payload);
  return data;
}

export async function register(payload: { name: string; email: string; password: string }) {
  const { data } = await api.post<AuthResponse>('/auth/register', payload);
  return data;
}

export async function me() {
  const { data } = await api.get<User>('/users/me');
  return data;
}
