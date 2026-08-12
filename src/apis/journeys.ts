import api from '../constants/api';
import { ApiResponse, PaginatedResponse, Location, Journey, Route } from '../types';

type RouteMutationPayload = Partial<Omit<Route, 'stops'>> & {
  stops?: Array<{ location_id: string | number; stop_order: number }>;
};

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
 * LOGIC: Lấy chi tiết một bến tàu cho màn chỉnh sửa quản trị
 */
export async function findAdminLocation(id: string | number): Promise<ApiResponse<Location>> {
  const response = await api.get<ApiResponse<Location>>(`/admin/locations/${id}`);
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
  const response = await api.patch<ApiResponse<Location>>(`/locations/${id}`, data);
  return response.data;
}

/**
 * LOGIC: Xóa bến tàu khỏi danh mục master data, backend sẽ trả 409 nếu đang bị ràng buộc bởi tuyến/chuyến
 */
export async function deleteLocation(id: string | number, data?: { reason?: string; tracking_id?: string }): Promise<{ message: string }> {
  const response = await api.delete<{ message: string }>(`/locations/${id}`, { data });
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
 * LOGIC: Tìm một hành trình từ API danh sách hiện có, không tự bịa endpoint detail khi backend chưa có.
 */
export async function findJourney(id: string | number): Promise<Journey | null> {
  let page = 1;
  let totalPages = 1;

  do {
    const response = await getJourneys({ limit: 100, page });
    const found = response.data?.find((journey) => String(journey.id) === String(id));
    if (found) return found;

    totalPages = response.meta?.pagination?.total_pages || page;
    page += 1;
  } while (page <= totalPages);

  return null;
}

/**
 * LOGIC: Lấy danh sách luồng tuyến cùng các điểm dừng để cấu hình hành trình.
 */
export async function getRoutes(params?: Record<string, any>): Promise<PaginatedResponse<Route>> {
  const response = await api.get<PaginatedResponse<Route>>('/routes', { params });
  return response.data;
}

/**
 * LOGIC: Tìm một luồng tuyến từ API danh sách hiện có, không tự bịa endpoint detail khi backend chưa có.
 */
export async function findRoute(id: string | number): Promise<Route | null> {
  let page = 1;
  let totalPages = 1;

  do {
    const response = await getRoutes({ limit: 100, page });
    const found = response.data?.find((route) => String(route.id) === String(id));
    if (found) return found;

    totalPages = response.meta?.pagination?.total_pages || page;
    page += 1;
  } while (page <= totalPages);

  return null;
}

/**
 * LOGIC: Tạo mới luồng tuyến và các điểm dừng theo thứ tự thật.
 */
export async function createRoute(data: RouteMutationPayload): Promise<ApiResponse<Route>> {
  const response = await api.post<ApiResponse<Route>>('/routes', data);
  return response.data;
}

/**
 * LOGIC: Cập nhật luồng tuyến và thay thế danh sách điểm dừng nếu có gửi stops.
 */
export async function updateRoute(id: string | number, data: RouteMutationPayload): Promise<ApiResponse<Route>> {
  const response = await api.patch<ApiResponse<Route>>(`/routes/${id}`, data);
  return response.data;
}

/**
 * LOGIC: Xóa luồng tuyến khỏi master data. Backend trả 409 nếu đang dính hành trình/lịch/chuyến.
 */
export async function deleteRoute(id: string | number, data?: { reason?: string; tracking_id?: string }): Promise<{ message: string }> {
  const response = await api.delete<{ message: string }>(`/routes/${id}`, { data });
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
  const response = await api.patch<ApiResponse<Journey>>(`/journeys/${id}`, data);
  return response.data;
}

/**
 * LOGIC: Xóa hành trình khỏi master data. Backend trả 409 nếu hành trình đang được tham chiếu bởi chặng đặt vé.
 */
export async function deleteJourney(id: string | number, data?: { reason?: string; tracking_id?: string }): Promise<{ message: string }> {
  const response = await api.delete<{ message: string }>(`/journeys/${id}`, { data });
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
  findAdminLocation,
  createLocation,
  updateLocation,
  deleteLocation,
  getJourneys,
  findJourney,
  getRoutes,
  findRoute,
  createRoute,
  updateRoute,
  deleteRoute,
  createJourney,
  updateJourney,
  deleteJourney,
  manageJourneys,
};
