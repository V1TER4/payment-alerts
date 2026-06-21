import api from '../lib/api';

export async function health() {
  const { data } = await api.get('/health');
  return data as { status: string };
}
