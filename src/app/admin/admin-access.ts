import type { User } from '@/types';

export function shouldLoadAdminSummary(user: User | null) {
  return user?.role === 'admin';
}
