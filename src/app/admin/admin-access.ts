import type { User } from '@/types';
import { hasPermission } from '@/server/permissions';

export function shouldLoadAdminSummary(user: User | null) {
  return hasPermission(user, 'ADMIN_DASHBOARD_VIEW');
}
