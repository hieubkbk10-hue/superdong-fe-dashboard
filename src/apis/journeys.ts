import api from '../constants/api';
import { ApiResponse, PaginatedResponse, Location, Journey } from '../types';

/**
 * LOGIC: Lấy danh sách điểm đến/bến cảng công khai
 */
export async function getLocations(params?: Record<string, any>): Promise<ApiResponse<Location[]>> {
  const response = await api.get<ApiResponse<Location[]>>('/locations', { params });
  return response.data;
}

/**
 * LOGIC: Lấy danh sách bến cảng quản trị đầy đủ (bao gồm cả bến ngưng hoạt động)
 */
export async function getAdminLocations(params?: Record<string, any>): Promise<PaginatedResponse<Location>> {
  const response = await api.get<PaginatedResponse<Location>>('/admin/locations', { params });
  return response.data;
}

/**
 * LOGIC: Tạo mới địa điểm / bến cảng
 */
export async function createLocation(data: Partial<Location>): Promise<ApiResponse<Location>> {
  const response = await api.post<ApiResponse<Location>>('/locations', data);
  return response.data;
}

/**
 * LOGIC: Cập nhật thông tin địa điểm / bến cảng
 */
export async function updateLocation(id: string | number, data: Partial<Location>): Promise<ApiResponse<Location>> {
  const response = await api.put<ApiResponse<Location>>(`/locations/${id}`, data);
  return response.data;
}

/**
 * LOGIC: Lấy danh sách hành trình / tuyến đường
 */
export async function getJourneys(params?: Record<string, any>): Promise<PaginatedResponse<Journey>> {
  const response = await api.get<PaginatedResponse<Journey>>('/journeys', { params });
  return response.data;
}

/**
 * LOGIC: Tạo mới hành trình / tuyến đường
 */
export async function createJourney(data: Partial<Journey>): Promise<ApiResponse<Journey>> {
  const response = await api.post<ApiResponse<Journey>>('/journeys', data);
  return response.data;
}

/**
 * LOGIC: Cập nhật thông tin hành trình / tuyến đường
 */
export async function updateJourney(id: string | number, data: Partial<Journey>): Promise<ApiResponse<Journey>> {
  const response = await api.put<ApiResponse<Journey>>(`/journeys/${id}`, data);
  return response.data;
}

/**
 * LOGIC: Thêm mới hoặc cập nhật thông tin hành trình / tuyến đường
 */
export async function manageJourneys(data: Partial<Journey>): Promise<ApiResponse<Journey>> {
  if (data.id) {
    const response = await api.put<ApiResponse<Journey>>(`/admin/journeys/${data.id}`, data);
    return response.data;
  }
  const response = await api.post<ApiResponse<Journey>>('/admin/journeys', data);
  return response.data;
}

export default {
  getLocations,
  getAdminLocations,
  createLocation,
  updateLocation,
  getJourneys,
  createJourney,
  updateJourney,
  manageJourneys,
};
