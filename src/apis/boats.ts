import api from '../constants/api';
import { ApiResponse, PaginatedResponse, Boat, SeatClass, SeatMap } from '../types';

/**
 * LOGIC: Lấy danh sách tàu cao tốc (có phân trang & lọc)
 */
export async function getBoats(params?: Record<string, any>): Promise<PaginatedResponse<Boat>> {
  const response = await api.get<PaginatedResponse<Boat>>('/boats', { params });
  return response.data;
}

/**
 * LOGIC: Tạo mới thông tin tàu
 */
export async function createBoat(data: Partial<Boat>): Promise<ApiResponse<Boat>> {
  const response = await api.post<ApiResponse<Boat>>('/boats', data);
  return response.data;
}

/**
 * LOGIC: Cập nhật thông tin tàu hiện có
 */
export async function updateBoat(id: string | number, data: Partial<Boat>): Promise<ApiResponse<Boat>> {
  const response = await api.patch<ApiResponse<Boat>>(`/boats/${id}`, data);
  return response.data;
}

/**
 * LOGIC: Ngưng hoạt động (vô hiệu hóa) tàu
 */
export async function deactivateBoat(id: string | number): Promise<ApiResponse<Boat>> {
  const response = await api.patch<ApiResponse<Boat>>(`/boats/${id}/deactivate`);
  return response.data;
}

export async function findBoatById(id: string | number): Promise<ApiResponse<Boat>> {
  const response = await api.get<ApiResponse<Boat>>(`/boats/${id}`);
  return response.data;
}

/**
 * LOGIC: Xóa thông tin tàu
 */
export async function deleteBoat(id: string | number): Promise<ApiResponse<void>> {
  const response = await api.delete<ApiResponse<void>>(`/boats/${id}`);
  return response.data;
}

/**
 * LOGIC: Lấy danh sách phân hạng ghế (VIP, ECO, etc.)
 */
export async function getSeatClasses(): Promise<ApiResponse<SeatClass[]>> {
  const response = await api.get<ApiResponse<SeatClass[]>>('/seat-classes');
  return response.data;
}

/**
 * LOGIC: Tạo mới phân hạng ghế
 */
export async function createSeatClass(data: Partial<SeatClass>): Promise<ApiResponse<SeatClass>> {
  const response = await api.post<ApiResponse<SeatClass>>('/seat-classes', data);
  return response.data;
}

/**
 * LOGIC: Cập nhật phân hạng ghế
 */
export async function updateSeatClass(id: string | number, data: Partial<SeatClass>): Promise<ApiResponse<SeatClass>> {
  const response = await api.put<ApiResponse<SeatClass>>(`/seat-classes/${id}`, data);
  return response.data;
}

/**
 * LOGIC: Lấy sơ đồ ghế chi tiết của một tàu
 */
export async function getSeatMap(boatId: string | number): Promise<ApiResponse<SeatMap>> {
  const response = await api.get<ApiResponse<SeatMap>>(`/boats/${boatId}/seat-map`);
  return response.data;
}

/**
 * LOGIC: Tạo sơ đồ ghế mới cho tàu
 */
export async function createSeatMap(boatId: string | number, data: Partial<SeatMap>): Promise<ApiResponse<SeatMap>> {
  const response = await api.post<ApiResponse<SeatMap>>(`/boats/${boatId}/seat-map`, data);
  return response.data;
}

export default {
  getBoats,
  findBoatById,
  createBoat,
  updateBoat,
  deleteBoat,
  deactivateBoat,
  getSeatClasses,
  createSeatClass,
  updateSeatClass,
  getSeatMap,
  createSeatMap,
};
