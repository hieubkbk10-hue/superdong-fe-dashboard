import { useState, useEffect, useCallback } from 'react';
import { User, Role, Permission } from '../types';
import usersApi from '../apis/users';

export function useUsers(params?: Record<string, any>) {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await usersApi.getUsers(params);
      setUsers(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải danh sách người dùng.');
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  const fetchMetadata = useCallback(async () => {
    try {
      const [rolesRes, permRes] = await Promise.all([
        usersApi.getRoles(),
        usersApi.getPermissions(),
      ]);
      setRoles(rolesRes.data);
      setPermissions(permRes.data);
    } catch (err) {
      // Quiet fail for permissions metadata
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchMetadata();
  }, [fetchUsers, fetchMetadata]);

  const updateUser = useCallback(async (id: string | number, data: Partial<User>) => {
    const res = await usersApi.updateUser(id, data);
    await fetchUsers();
    return res.data;
  }, [fetchUsers]);

  const assignRoles = useCallback(async (userId: string | number, roleIds: Array<string | number>) => {
    const res = await usersApi.assignRoles(userId, roleIds);
    await fetchUsers();
    return res.data;
  }, [fetchUsers]);

  const deleteUser = useCallback(async (id: string | number) => {
    await usersApi.deleteUser(id);
    await fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    roles,
    permissions,
    isLoading,
    error,
    refetch: fetchUsers,
    updateUser,
    assignRoles,
    deleteUser,
  };
}

export default useUsers;
