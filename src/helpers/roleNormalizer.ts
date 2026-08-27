export interface NormalizedPermissionItem {
  id: string | number;
  name: string;
  display_name: string;
  description?: string;
  guard_name: string;
}

export interface NormalizedRoleItem {
  id: string;
  name: string;
  guard_name: string;
  display_name: string;
  description: string;
  user_count: number;
  is_system: boolean;
  permissions: NormalizedPermissionItem[];
}

export function normalizeApiatoCollection<T = unknown>(value: unknown): T[] {
  if (value && typeof value === 'object' && Array.isArray((value as { data?: unknown }).data)) {
    return (value as { data: T[] }).data;
  }

  return Array.isArray(value) ? value : [];
}

export function normalizeRoleItem(role: Record<string, any>): NormalizedRoleItem {
  return {
    id: String(role?.id ?? ''),
    name: role?.name ?? '',
    guard_name: role?.guard_name || 'api',
    display_name: role?.display_name || role?.name || '',
    description: role?.description || '',
    user_count: Number(role?.user_count ?? 0),
    is_system: role?.name === 'admin',
    permissions: normalizeApiatoCollection<any>(role?.permissions).map((permission) => ({
      id: permission?.id,
      name: permission?.name || permission,
      display_name: permission?.display_name || permission?.name || permission,
      description: permission?.description,
      guard_name: permission?.guard_name || 'api',
    })).filter((permission) => permission.guard_name === 'api'),
  };
}

export function normalizeRolesResponse(response: unknown): NormalizedRoleItem[] {
  const data = response && typeof response === 'object'
    ? (response as { data?: unknown }).data
    : [];

  return normalizeApiatoCollection<Record<string, any>>(data)
    .filter((role) => (role?.guard_name || 'api') === 'api')
    .map(normalizeRoleItem);
}
