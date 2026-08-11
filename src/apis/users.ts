import api from '../constants/api';
import { ApiResponse, PaginatedResponse, User, Role, Permission } from '../types';

/**
 * LOGIC: Lấy danh sách tài khoản người dùng / nhân viên admin
 */
export async function getUsers(params?: Record<string, any>): Promise<PaginatedResponse<User>> {
  const response = await api.get<PaginatedResponse<User>>('/users', { params });
  return response.data;
}

/**
 * LOGIC: Tìm thông tin người dùng theo ID
 */
export async function findUserById(id: string | number): Promise<ApiResponse<User>> {
  const response = await api.get<ApiResponse<User>>(`/users/${id}`);
  return response.data;
}

/**
 * LOGIC: Tạo tài khoản người dùng / nhân viên mới (Hỗ trợ fallback POST /register nếu POST /users 404)
 */
export async function createUser(data: Record<string, any>): Promise<ApiResponse<User>> {
  try {
    const response = await api.post<ApiResponse<User>>('/users', data);
    return response.data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      // Fallback sang endpoint /register trong Apiato Authentication container
      const response = await api.post<ApiResponse<User>>('/register', {
        name: data.name,
        email: data.email,
        password: data.password || 'Superdong@2026',
      });
      return response.data;
    }
    throw err;
  }
}

/**
 * LOGIC: Cập nhật thông tin tài khoản người dùng
 */
export async function updateUser(id: string | number, data: Partial<User>): Promise<ApiResponse<User>> {
  const response = await api.patch<ApiResponse<User>>(`/users/${id}`, data);
  return response.data;
}

/**
 * LOGIC: Xóa hoặc vô hiệu hóa tài khoản người dùng
 */
export async function deleteUser(id: string | number): Promise<ApiResponse<void>> {
  const response = await api.delete<ApiResponse<void>>(`/users/${id}`);
  return response.data;
}

/**
 * LOGIC: Lấy danh sách các vai trò / quyền hạn trong hệ thống
 */
export async function getRoles(): Promise<ApiResponse<Role[]>> {
  const response = await api.get<ApiResponse<Role[]>>('/roles');
  return response.data;
}

/**
 * LOGIC: Lấy danh sách tất cả các quyền (permissions) chi tiết
 */
export async function getPermissions(): Promise<ApiResponse<Permission[]>> {
  const response = await api.get<ApiResponse<Permission[]>>('/permissions');
  return response.data;
}

/**
 * QUYỀN: Gán danh sách vai trò cho người dùng
 */
export async function assignRoles(
  userId: string | number,
  roleIds: Array<string | number>
): Promise<ApiResponse<User>> {
  const response = await api.post<ApiResponse<User>>(`/users/${userId}/assign-roles`, { role_ids: roleIds });
  return response.data;
}

/**
 * LOGIC: Tạo vai trò mới
 */
export async function createRole(data: Partial<Role>): Promise<ApiResponse<Role>> {
  const response = await api.post<ApiResponse<Role>>('/roles', data);
  return response.data;
}

/**
 * LOGIC: Cập nhật vai trò
 */
export async function updateRole(id: string | number, data: Partial<Role>): Promise<ApiResponse<Role>> {
  const response = await api.put<ApiResponse<Role>>(`/roles/${id}`, data);
  return response.data;
}

export default {
  getUsers,
  findUserById,
  createUser,
  updateUser,
  deleteUser,
  getRoles,
  createRole,
  updateRole,
  getPermissions,
  assignRoles,
};
