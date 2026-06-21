import api from '../lib/api';
import { NotificationHistoryItem } from '../types';

export async function listNotificationHistory(params?: { from?: string; to?: string }) {
  const { data } = await api.get<{ items: NotificationHistoryItem[] }>('/notifications/history', {
    params,
  });
  return data;
}
