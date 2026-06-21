export type UserRole = 'ADMIN' | 'USER' | 'SYSTEM';
export type NotificationChannel = 'EMAIL' | 'SMS' | 'WHATSAPP';
export type BillStatus = 'PENDING' | 'PAID' | 'OVERDUE';
export type RecurrenceFrequency = 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type Permission =
  | 'dashboard.view'
  | 'users.view'
  | 'users.create'
  | 'users.update'
  | 'users.delete'
  | 'permissions.view'
  | 'permissions.update'
  | 'categories.view'
  | 'categories.create'
  | 'categories.update'
  | 'categories.delete'
  | 'bills.view'
  | 'bills.create'
  | 'bills.update'
  | 'bills.delete'
  | 'notifications.view'
  | 'notifications.create'
  | 'notifications.update'
  | 'notifications.delete'
  | 'history.view';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  notificationChannels: NotificationChannel[];
  reminderDays: number[];
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  accessToken: string;
  user: User;
};

export type Bill = {
  id: string;
  userId: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  recurrenceSeriesId: string | null;
  name: string;
  description: string | null;
  amount: string;
  dueDate: string;
  status: BillStatus;
  isRecurring: boolean;
  recurrenceFrequency: RecurrenceFrequency | null;
  recurrenceDayOfMonth: number | null;
  recurrenceDayOfWeek: number | null;
  recurrenceDay: number | null;
  recurrenceMonth: number | null;
  lastPaidAt: string | null;
  createdAt: string;
  updatedAt: string;
  isDueDateNonBusinessDay: boolean;
  adjustedDueDate: string | null;
};

export type Category = {
  id: string;
  userId: string;
  name: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DashboardOverview = {
  period: {
    from: string;
    to: string;
  };
  metrics: {
    totalToPay: number;
    totalPaid: number;
    overdueCount: number;
  };
  upcomingBills: Array<
    Pick<
      Bill,
      | 'id'
      | 'name'
      | 'description'
      | 'amount'
      | 'dueDate'
      | 'status'
      | 'isRecurring'
      | 'recurrenceFrequency'
      | 'categoryName'
      | 'categoryColor'
      | 'isDueDateNonBusinessDay'
    >
  >;
  billsInRange: Array<
    Pick<
      Bill,
      | 'id'
      | 'name'
      | 'description'
      | 'amount'
      | 'dueDate'
      | 'status'
      | 'isRecurring'
      | 'recurrenceFrequency'
      | 'categoryName'
      | 'categoryColor'
      | 'isDueDateNonBusinessDay'
    >
  >;
};

export type NotificationHistoryItem = {
  id: string;
  userId: string;
  notificationId: string;
  sentAt: string;
  channel: NotificationChannel;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';
  provider: string | null;
  providerId: string | null;
  errorMessage: string | null;
  payload: unknown;
  notification: {
    id: string;
    billId: string;
    title: string;
    message: string;
    scheduledFor: string;
    status: 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';
    bill: {
      id: string;
      name: string;
      amount: string;
      dueDate: string;
      category: Category | null;
    };
  };
};
