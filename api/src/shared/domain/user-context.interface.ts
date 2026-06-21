export interface UserContext {
  sub: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'SYSTEM';
  permissions: string[];
}
