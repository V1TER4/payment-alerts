import dayjs from 'dayjs';

export const toDateKey = (date: Date): string => dayjs(date).format('YYYY-MM-DD');

export const startOfBusinessDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(8, 0, 0, 0);
  return d;
};

export const startOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const endOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};
