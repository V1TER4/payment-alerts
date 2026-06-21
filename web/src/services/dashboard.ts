import api from '../lib/api';
import { DashboardOverview } from '../types';

export async function getDashboardOverview(params?: { from?: string; to?: string }) {
  const { data } = await api.get<DashboardOverview>('/dashboard/overview', { params });
  return data;
}
