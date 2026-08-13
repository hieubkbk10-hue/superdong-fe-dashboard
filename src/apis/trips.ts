import api from '../constants/api';
import { ApiResponse, PaginatedResponse, Trip, Schedule } from '../types';

/**
 * LOGIC: Lấy danh sách chuyến tàu (lọc theo ngày, bến, trạng thái...)
 */
export async function getTrips(params?: Record<string, any>): Promise<PaginatedResponse<Trip>> {
  const response = await api.get<PaginatedResponse<Trip>>('/trips', { params });
  return response.data;
}

/**
 * LOGIC: Lấy danh sách lịch trình cố định
 */
export async function getSchedules(params?: Record<string, any>): Promise<PaginatedResponse<Schedule>> {
  const response = await api.get<PaginatedResponse<Schedule>>('/schedules', { params });
  return response.data;
}

/**
 * LOGIC: Tạo lịch trình khởi hành cố định
 */
export async function createSchedule(data: Partial<Schedule>): Promise<ApiResponse<Schedule>> {
  const response = await api.post<ApiResponse<Schedule>>('/schedules', data);
  return response.data;
}

/**
 * LOGIC: Tạo một chuyến tàu cụ thể cho ngày nhất định
 */
export async function createTrip(data: Partial<Trip>): Promise<ApiResponse<Trip>> {
  const response = await api.post<ApiResponse<Trip>>('/trips', data);
  return response.data;
}

/**
 * LOGIC: Hủy chuyến tàu với lý do
 */
export async function cancelTrip(id: string | number, reason?: string): Promise<ApiResponse<Trip>> {
  const response = await api.patch<ApiResponse<Trip>>(`/trips/${id}/cancel`, { reason });
  return response.data;
}

/**
 * LOGIC: Đổi tàu điều hành cho chuyến
 */
export async function changeTripBoat(id: string | number, boatId: string | number): Promise<ApiResponse<Trip>> {
  const response = await api.patch<ApiResponse<Trip>>(`/trips/${id}/change-boat`, { boat_id: boatId });
  return response.data;
}

/**
 * LOGIC: Điều chỉnh giờ khởi hành và giờ đến của chuyến
 */
export async function changeTripTime(
  id: string | number,
  departureTime: string,
  arrivalTime: string
): Promise<ApiResponse<Trip>> {
  const response = await api.patch<ApiResponse<Trip>>(`/trips/${id}/change-time`, {
    departure_time: departureTime,
    arrival_time: arrivalTime,
  });
  return response.data;
}

/**
 * LOGIC: Mở bán vé cho chuyến tàu
 */
export async function openTripForSale(id: string | number): Promise<ApiResponse<Trip>> {
  const response = await api.patch<ApiResponse<Trip>>(`/trips/${id}/open`);
  return response.data;
}

/**
 * LOGIC: Khóa mở bán vé cho chuyến tàu
 */
export async function closeTripForSale(id: string | number): Promise<ApiResponse<Trip>> {
  const response = await api.patch<ApiResponse<Trip>>(`/trips/${id}/close`);
  return response.data;
}

/**
 * LOGIC: Đánh dấu chuyến tàu đã xuất bến (departed)
 */
export async function markTripDeparted(id: string | number): Promise<ApiResponse<Trip>> {
  const response = await api.patch<ApiResponse<Trip>>(`/trips/${id}/depart`);
  return response.data;
}

/**
 * LOGIC: Đánh dấu chuyến tàu đã hoàn tất hành trình (completed)
 */
export async function completeTrip(id: string | number): Promise<ApiResponse<Trip>> {
  const response = await api.patch<ApiResponse<Trip>>(`/trips/${id}/complete`);
  return response.data;
}

/**
 * LOGIC: Cập nhật lịch trình cố định
 */
export async function updateSchedule(id: string | number, data: Partial<Schedule>): Promise<ApiResponse<Schedule>> {
  const response = await api.put<ApiResponse<Schedule>>(`/schedules/${id}`, data);
  return response.data;
}

/**
 * LOGIC: Cập nhật chuyến tàu
 */
export async function updateTrip(id: string | number, data: Partial<Trip>): Promise<ApiResponse<Trip>> {
  const response = await api.put<ApiResponse<Trip>>(`/trips/${id}`, data);
  return response.data;
}

export async function findSchedule(id: string | number): Promise<Schedule> {
  const response = await api.get<ApiResponse<Schedule>>(`/schedules/${id}`);
  return response.data.data;
}

export async function deleteSchedule(id: string | number): Promise<ApiResponse<any>> {
  const response = await api.delete<ApiResponse<any>>(`/schedules/${id}`);
  return response.data;
}

export default {
  getTrips,
  getSchedules,
  findSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  createTrip,
  updateTrip,
  cancelTrip,
  changeTripBoat,
  changeTripTime,
  openTripForSale,
  closeTripForSale,
  markTripDeparted,
  completeTrip,
};
