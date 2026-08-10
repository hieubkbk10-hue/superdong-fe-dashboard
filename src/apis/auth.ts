import api, { TOKEN_STORAGE_KEY } from '../constants/api';
import { ApiResponse, User } from '../types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponseData {
  token_type: string;
  access_token: string;
  expires_in?: number;
  user: User;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}

/**
 * LOGIC: Đăng nhập tài khoản admin và lưu token vào LocalStorage
 */
export async function login(payload: LoginPayload): Promise<ApiResponse<LoginResponseData>> {
  const response = await api.post<ApiResponse<LoginResponseData>>('/clients/web/login', payload);
  if (response.data?.data?.access_token || (response.data as any)?.access_token) {
    const token = response.data?.data?.access_token || (response.data as any)?.access_token;
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem('superdong_token', token);
  }
  return response.data;
}

/**
 * LOGIC: Đăng xuất khỏi hệ thống và xoá token
 */
export async function logout(): Promise<ApiResponse<void>> {
  try {
    const response = await api.post<ApiResponse<void>>('/auth/logout');
    return response.data;
  } finally {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

/**
 * LOGIC: Lấy thông tin cá nhân của admin đang đăng nhập
 */
export async function profile(): Promise<ApiResponse<User>> {
  const response = await api.get<ApiResponse<User>>('/auth/profile');
  return response.data;
}

/**
 * LOGIC: Alias cho profile() để đồng bộ naming convention
 */
export const getProfile = profile;

/**
 * LOGIC: Yêu cầu gửi email khôi phục mật khẩu
 */
export async function forgotPassword(payload: ForgotPasswordPayload): Promise<ApiResponse<void>> {
  const response = await api.post<ApiResponse<void>>('/auth/forgot-password', payload);
  return response.data;
}

/**
 * LOGIC: Đặt lại mật khẩu mới qua token
 */
export async function resetPassword(payload: ResetPasswordPayload): Promise<ApiResponse<void>> {
  const response = await api.post<ApiResponse<void>>('/auth/reset-password', payload);
  return response.data;
}

export default {
  login,
  logout,
  profile,
  getProfile,
  forgotPassword,
  resetPassword,
};
