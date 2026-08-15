import api from '../constants/api';
import { ApiResponse, PaginatedResponse, Trip, Schedule } from '../types';

export interface GenerateTripsPayload {
  from_date: string; // YYYY-MM-DD
  to_date: string; // YYYY-MM-DD
  publish?: boolean; // Nếu true, chuyến được mở bán ngay sau khi tạo
  reason: string;
  tracking_id?: string;
}

export interface GenerateTripsResult {
  object: 'TripGenerationSummary';
  schedule_id: string;
  from_date: string;
  to_date: string;
  publish: boolean;
  created_count: number;
  skipped_count: number;
}

export interface CreateTripPayload {
  schedule_id?: string | number;
  route_id?: string | number;
  boat_id?: string | number;
  start_at: string; // ISO 8601 hoặc YYYY-MM-DD HH:mm:ss
  end_at: string; // ISO 8601 hoặc YYYY-MM-DD HH:mm:ss
  status?: 'draft' | 'selling' | 'closed' | 'started' | 'completed' | 'cancelled';
  reason: string;
  shuttle_phone?: string;
  tracking_id?: string;
}

export interface TripActionPayload {
  expected_version?: number;
  reason?: string;
  tracking_id?: string;
}

export interface ChangeTripBoatPayload extends TripActionPayload {
  boat_id: string | number;
}

export interface ChangeTripTimePayload extends TripActionPayload {
  start_at: string;
  end_at: string;
}

function normalizePayload(data?: TripActionPayload | string): TripActionPayload {
  if (typeof data === 'string') {
    return { reason: data };
  }
  return data || {};
}

/**
 * LOGIC: Lấy danh sách chuyến tàu thực tế (hỗ trợ lọc theo schedule_id, route_id, boat_id, status, start_from, start_to)
 */
export async function getTrips(params?: Record<string, any>): Promise<PaginatedResponse<Trip>> {
  const response = await api.get<PaginatedResponse<Trip>>('/trips', { params });
  return response.data;
}

/**
 * LOGIC: Lấy thông tin chi tiết một chuyến tàu thực tế theo Hash ID
 */
export async function findTrip(id: string | number): Promise<ApiResponse<Trip>> {
  const response = await api.get<ApiResponse<Trip>>(`/trips/${id}`);
  return response.data;
}

/**
 * LOGIC: Tạo một chuyến tàu thực tế (Hỗ trợ Mode 1 theo Schedule hoặc Mode 2 tạo lẻ theo Route + Boat)
 */
export async function createTrip(data: CreateTripPayload | Partial<Trip>): Promise<ApiResponse<Trip>> {
  const response = await api.post<ApiResponse<Trip>>('/trips', data);
  return response.data;
}

/**
 * LOGIC: Xóa chuyến tàu (chỉ áp dụng cho chuyến draft chưa bán vé)
 */
export async function deleteTrip(id: string | number, data?: { reason?: string }): Promise<{ message: string }> {
  const response = await api.delete<{ message: string }>(`/trips/${id}`, { data });
  return response.data;
}

/**
 * LOGIC: Sinh hàng loạt chuyến tàu thực tế từ Lịch chạy định kỳ (Schedule)
 */
export async function generateTripsFromSchedule(
  scheduleId: string | number,
  payload: GenerateTripsPayload
): Promise<ApiResponse<GenerateTripsResult>> {
  const response = await api.post<ApiResponse<GenerateTripsResult>>(
    `/trip-schedules/${scheduleId}/trips/generate`,
    payload
  );
  return response.data;
}

/**
 * LOGIC: Mở bán vé cho chuyến tàu (status -> selling)
 */
export async function openTripForSale(
  id: string | number,
  data?: TripActionPayload | string
): Promise<ApiResponse<Trip>> {
  const normalized = normalizePayload(data);
  const response = await api.post<ApiResponse<Trip>>(`/trips/${id}/open-sale`, {
    expected_version: normalized.expected_version,
    reason: normalized.reason || 'Mở bán vé chuyến tàu từ dashboard',
    tracking_id: normalized.tracking_id,
  });
  return response.data;
}

/**
 * LOGIC: Đóng/khóa mở bán vé cho chuyến tàu (status -> closed)
 */
export async function closeTripForSale(
  id: string | number,
  data?: TripActionPayload | string
): Promise<ApiResponse<Trip>> {
  const normalized = normalizePayload(data);
  const response = await api.post<ApiResponse<Trip>>(`/trips/${id}/close-sale`, {
    expected_version: normalized.expected_version,
    reason: normalized.reason || 'Đóng bán vé chuyến tàu từ dashboard',
    tracking_id: normalized.tracking_id,
  });
  return response.data;
}

/**
 * LOGIC: Đánh dấu chuyến tàu đã xuất bến (status -> started)
 */
export async function markTripDeparted(
  id: string | number,
  data?: TripActionPayload | string
): Promise<ApiResponse<Trip>> {
  const normalized = normalizePayload(data);
  const response = await api.post<ApiResponse<Trip>>(`/trips/${id}/depart`, {
    expected_version: normalized.expected_version,
    reason: normalized.reason || 'Xác nhận tàu đã xuất bến từ cảng',
    tracking_id: normalized.tracking_id,
  });
  return response.data;
}

/**
 * LOGIC: Đánh dấu chuyến tàu đã hoàn tất hải trình (status -> completed)
 */
export async function completeTrip(
  id: string | number,
  data?: TripActionPayload | string
): Promise<ApiResponse<Trip>> {
  const normalized = normalizePayload(data);
  const response = await api.post<ApiResponse<Trip>>(`/trips/${id}/complete`, {
    expected_version: normalized.expected_version,
    reason: normalized.reason || 'Xác nhận tàu đã cập bến an toàn',
    tracking_id: normalized.tracking_id,
  });
  return response.data;
}

/**
 * LOGIC: Hủy chuyến tàu và cấp BookingChange grants cho hành khách đã đặt (status -> cancelled)
 */
export async function cancelTrip(
  id: string | number,
  data?: TripActionPayload | string
): Promise<ApiResponse<Trip>> {
  const normalized = normalizePayload(data);
  const response = await api.post<ApiResponse<Trip>>(`/trips/${id}/cancel`, {
    expected_version: normalized.expected_version,
    reason: normalized.reason || 'Hủy chuyến tàu do sự cố thời tiết/kỹ thuật',
    tracking_id: normalized.tracking_id,
  });
  return response.data;
}

/**
 * LOGIC: Đổi tàu điều hành cho chuyến và khởi tạo lại tồn kho ghế theo sơ đồ mới
 */
export async function changeTripBoat(
  id: string | number,
  data: ChangeTripBoatPayload
): Promise<ApiResponse<Trip>> {
  const response = await api.post<ApiResponse<Trip>>(`/trips/${id}/change-boat`, {
    boat_id: data.boat_id,
    expected_version: data.expected_version,
    reason: data.reason || 'Điều động đổi tàu cho chuyến từ dashboard',
    tracking_id: data.tracking_id,
  });
  return response.data;
}

/**
 * LOGIC: Điều chỉnh giờ khởi hành và giờ đến của chuyến
 */
export async function changeTripTime(
  id: string | number,
  data: ChangeTripTimePayload
): Promise<ApiResponse<Trip>> {
  const response = await api.post<ApiResponse<Trip>>(`/trips/${id}/change-time`, {
    start_at: data.start_at,
    end_at: data.end_at,
    expected_version: data.expected_version,
    reason: data.reason || 'Điều chỉnh giờ khởi hành/cập bến chuyến tàu',
    tracking_id: data.tracking_id,
  });
  return response.data;
}

/**
 * LOGIC: Lấy danh sách mẫu lịch chạy định kỳ
 */
export async function getSchedules(params?: Record<string, any>): Promise<PaginatedResponse<Schedule>> {
  const response = await api.get<PaginatedResponse<Schedule>>('/trip-schedules', { params });
  return response.data;
}

/**
 * LOGIC: Tìm một lịch chạy định kỳ
 */
export async function findSchedule(id: string | number): Promise<Schedule | null> {
  try {
    const res = await getSchedules({ limit: 100 });
    const found = res?.data?.find((s: any) => String(s.id) === String(id));
    if (found) return found;
  } catch (e) {}

  const cachedStr = typeof window !== 'undefined' ? localStorage.getItem(`superdong_schedule_cache_${id}`) : null;
  if (cachedStr) {
    try {
      return JSON.parse(cachedStr);
    } catch (e) {}
  }

  return null;
}

/**
 * LOGIC: Tạo mẫu lịch chạy định kỳ
 */
export async function createSchedule(data: Partial<Schedule>): Promise<ApiResponse<Schedule>> {
  const response = await api.post<ApiResponse<Schedule>>('/trip-schedules', data);
  return response.data;
}

/**
 * LOGIC: Cập nhật mẫu lịch chạy định kỳ
 */
export async function updateSchedule(id: string | number, data: Partial<Schedule>): Promise<ApiResponse<Schedule>> {
  const response = await api.patch<ApiResponse<Schedule>>(`/trip-schedules/${id}`, data);
  return response.data;
}

/**
 * LOGIC: Xóa lịch chạy định kỳ
 */
export async function deleteSchedule(id: string | number, data?: { reason?: string }): Promise<ApiResponse<any>> {
  const response = await api.delete<ApiResponse<any>>(`/trip-schedules/${id}`, { data });
  return response.data;
}

export default {
  getTrips,
  findTrip,
  createTrip,
  deleteTrip,
  generateTripsFromSchedule,
  openTripForSale,
  closeTripForSale,
  markTripDeparted,
  completeTrip,
  cancelTrip,
  changeTripBoat,
  changeTripTime,
  getSchedules,
  findSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
};
