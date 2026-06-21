export const Permissions = [
  'dashboard.view',
  'users.view',
  'users.create',
  'users.update',
  'users.delete',
  'permissions.view',
  'permissions.update',
  'categories.view',
  'categories.create',
  'categories.update',
  'categories.delete',
  'bills.view',
  'bills.create',
  'bills.update',
  'bills.delete',
  'notifications.view',
  'notifications.create',
  'notifications.update',
  'notifications.delete',
  'history.view',
] as const;

export type Permission = (typeof Permissions)[number];

export const UserDefaultPermissions: Permission[] = [
  'dashboard.view',
  'users.view',
  'users.update',
  'categories.view',
  'categories.create',
  'categories.update',
  'categories.delete',
  'bills.view',
  'bills.create',
  'bills.update',
  'bills.delete',
  'notifications.view',
  'history.view',
];

export const AdminDefaultPermissions: Permission[] = [...Permissions];
