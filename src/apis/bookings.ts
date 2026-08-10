import api from '../constants/api';
import { ApiResponse, PaginatedResponse, Booking } from '../types';

export interface SeatReassignment {
  traveler_id: string | number;
  new_seat_code: string;
}

/**
 * LOGIC: Lấy danh sách booking (có lọc theo mã, ngày, trạng thái...)
 */
export async function getBookings(params?: Record<string, any>): Promise<PaginatedResponse<Booking>> {
  const response = await api.get<PaginatedResponse<Booking>>('/bookings', { params });
  return response.data;
}

/**
 * LOGIC: Tìm kiếm booking theo mã booking_code hoặc id
 */
export async function findBooking(codeOrId: string | number): Promise<ApiResponse<Booking>> {
  const response = await api.get<ApiResponse<Booking>>(`/bookings/${codeOrId}`);
  return response.data;
}

/**
 * LOGIC: Lấy danh sách đơn hàng của một người dùng cụ thể
 */
export async function listUserBookings(
  userId: string | number,
  params?: Record<string, any>
): Promise<PaginatedResponse<Booking>> {
  const response = await api.get<PaginatedResponse<Booking>>(`/users/${userId}/bookings`, { params });
  return response.data;
}

/**
 * LOGIC: Điều chuyển / đổi ghế cho hành khách trong đơn hàng
 */
export async function reassignSeats(
  bookingId: string | number,
  reassignments: SeatReassignment[]
): Promise<ApiResponse<Booking>> {
  const response = await api.post<ApiResponse<Booking>>(`/bookings/${bookingId}/reassign-seats`, {
    reassignments,
  });
  return response.data;
}

/**
 * LOGIC: Tạo booking mới
 */
export async function createBooking(data: Partial<Booking>): Promise<ApiResponse<Booking>> {
  const response = await api.post<ApiResponse<Booking>>('/bookings', data);
  return response.data;
}

/**
 * LOGIC: Cập nhật thông tin booking
 */
export async function updateBooking(id: string | number, data: Partial<Booking>): Promise<ApiResponse<Booking>> {
  const response = await api.put<ApiResponse<Booking>>(`/bookings/${id}`, data);
  return response.data;
}

export default {
  getBookings,
  findBooking,
  listUserBookings,
  reassignSeats,
  createBooking,
  updateBooking,
};

