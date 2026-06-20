export const staffRoles = ['OWNER', 'OPERATIONS', 'SUPPORT', 'FINANCE', 'MARKETING', 'VIEWER'] as const;

export const staffPermissions = [
  'ADMIN_DASHBOARD_VIEW',
  'ORDER_READ',
  'ORDER_MANAGE',
  'ORDER_REFUND',
  'USER_READ',
  'USER_MANAGE',
  'WALLET_READ',
  'WALLET_MANAGE',
  'MANUAL_DEPOSIT_REVIEW',
  'PRODUCT_MANAGE',
  'PROVIDER_MANAGE',
  'PROMOTION_MANAGE',
  'BANNER_MANAGE',
  'CURRENCY_MANAGE',
  'PRICING_MANAGE',
  'EXPORT_DATA',
  'WHATSAPP_MARKETING',
  'JOB_RUN',
] as const;

export type StaffRole = (typeof staffRoles)[number];
export type StaffPermission = (typeof staffPermissions)[number];

type UserRoleLike = 'USER' | 'ADMIN' | 'STAFF' | 'user' | 'admin' | 'staff';

interface PermissionUser {
  role?: UserRoleLike | null;
  staffRole?: StaffRole | Lowercase<StaffRole> | null;
  staffPermissions?: Array<StaffPermission | Lowercase<StaffPermission>> | null;
}

const allStaffPermissions = [...staffPermissions];

export const staffRolePermissionMap: Record<StaffRole, StaffPermission[]> = {
  OWNER: allStaffPermissions,
  OPERATIONS: [
    'ADMIN_DASHBOARD_VIEW',
    'ORDER_READ',
    'ORDER_MANAGE',
    'USER_READ',
    'WALLET_READ',
    'MANUAL_DEPOSIT_REVIEW',
    'PRODUCT_MANAGE',
    'PROVIDER_MANAGE',
    'JOB_RUN',
  ],
  SUPPORT: [
    'ADMIN_DASHBOARD_VIEW',
    'ORDER_READ',
    'USER_READ',
    'WALLET_READ',
    'MANUAL_DEPOSIT_REVIEW',
  ],
  FINANCE: [
    'ADMIN_DASHBOARD_VIEW',
    'ORDER_READ',
    'ORDER_REFUND',
    'USER_READ',
    'WALLET_READ',
    'WALLET_MANAGE',
    'MANUAL_DEPOSIT_REVIEW',
    'CURRENCY_MANAGE',
    'EXPORT_DATA',
  ],
  MARKETING: [
    'ADMIN_DASHBOARD_VIEW',
    'USER_READ',
    'PROMOTION_MANAGE',
    'BANNER_MANAGE',
    'WHATSAPP_MARKETING',
  ],
  VIEWER: [
    'ADMIN_DASHBOARD_VIEW',
    'ORDER_READ',
    'USER_READ',
    'WALLET_READ',
  ],
};

function normalizeRole(role?: UserRoleLike | null) {
  return role?.toUpperCase();
}

function normalizeStaffRole(role?: PermissionUser['staffRole']) {
  return role?.toUpperCase() as StaffRole | undefined;
}

function normalizePermission(permission: StaffPermission | Lowercase<StaffPermission>) {
  return permission.toUpperCase() as StaffPermission;
}

export function hasPermission(user: PermissionUser | null | undefined, permission: StaffPermission) {
  const role = normalizeRole(user?.role);
  if (role === 'ADMIN') return true;
  if (role !== 'STAFF') return false;

  const staffRole = normalizeStaffRole(user?.staffRole);
  const inheritedPermissions = staffRole ? staffRolePermissionMap[staffRole] ?? [] : [];
  const explicitPermissions = (user?.staffPermissions ?? []).map(normalizePermission);

  return inheritedPermissions.includes(permission) || explicitPermissions.includes(permission);
}

export function requireStaffPermission(user: PermissionUser | null | undefined, permission: StaffPermission) {
  if (!hasPermission(user, permission)) throw new Error('FORBIDDEN');
}
