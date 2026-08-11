import { Permission } from '@/types';

const ACTION_LABELS: Record<string, string> = {
  access: 'Truy cập',
  attach: 'Gán',
  create: 'Tạo mới',
  delete: 'Xóa',
  detach: 'Gỡ',
  list: 'Xem danh sách',
  manage: 'Quản lý',
  refresh: 'Làm mới',
  search: 'Tìm kiếm',
  update: 'Cập nhật',
  view: 'Xem',
};

const RESOURCE_LABELS: Record<string, string> = {
  admins: 'tài khoản admin',
  'admins-access': 'phân quyền nhân viên',
  dashboard: 'dashboard',
  docs: 'tài liệu nội bộ',
  permissions: 'quyền truy cập',
  roles: 'vai trò',
  users: 'người dùng',
  'private-docs': 'tài liệu nội bộ',
};

const GROUP_LABELS: Record<string, string> = {
  dashboard: 'Truy cập hệ thống',
  docs: 'Tài liệu nội bộ',
  permissions: 'Quyền truy cập',
  roles: 'Vai trò',
  users: 'Người dùng & nhân viên',
};

export function getPermissionLabel(permission: Pick<Permission, 'name' | 'display_name'>): string {
  if (permission.display_name && permission.display_name.trim()) {
    return permission.display_name;
  }

  const [action, ...resourceParts] = (permission.name || '').split('-');
  const resourceKey = resourceParts.join('-');
  const actionLabel = ACTION_LABELS[action] || action;
  const resourceLabel = RESOURCE_LABELS[resourceKey] || resourceKey.replace(/-/g, ' ');

  return `${actionLabel} ${resourceLabel}`.trim();
}

export function getPermissionGroupLabel(permissionName: string): string {
  const parts = permissionName.split('-');
  const resourceKey = parts.slice(1).join('-');

  if (resourceKey.includes('admin') || resourceKey.includes('user')) {
    return GROUP_LABELS.users;
  }
  if (resourceKey.includes('role')) {
    return GROUP_LABELS.roles;
  }
  if (resourceKey.includes('permission')) {
    return GROUP_LABELS.permissions;
  }
  if (resourceKey.includes('dashboard')) {
    return GROUP_LABELS.dashboard;
  }
  if (resourceKey.includes('docs')) {
    return GROUP_LABELS.docs;
  }

  return 'Khác';
}

export function sortPermissionsForAdmin<T extends Pick<Permission, 'name' | 'display_name'>>(permissions: T[]): T[] {
  return [...permissions].sort((a, b) => {
    const groupCompare = getPermissionGroupLabel(a.name).localeCompare(getPermissionGroupLabel(b.name), 'vi');
    if (groupCompare !== 0) return groupCompare;

    return getPermissionLabel(a).localeCompare(getPermissionLabel(b), 'vi');
  });
}
