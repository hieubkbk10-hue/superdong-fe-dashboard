import api from '../constants/api';
import { ApiResponse, SystemSetting } from '../types';

/**
 * LOGIC: Lấy danh sách tất cả các cấu hình hệ thống
 */
export async function getSettings(): Promise<ApiResponse<SystemSetting[]>> {
  const response = await api.get<ApiResponse<SystemSetting[]>>('/settings');
  return response.data;
}

/**
 * LOGIC: Cập nhật giá trị một cấu hình hệ thống theo key
 */
export async function updateSetting(key: string, value: string): Promise<ApiResponse<SystemSetting>> {
  const response = await api.put<ApiResponse<SystemSetting>>(`/settings/${key}`, { value });
  return response.data;
}

export default {
  getSettings,
  updateSetting,
};
