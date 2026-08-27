import api from '../constants/api';
import { ApiResponse, PaginatedResponse, BookingChange } from '../types';

/**
 * LOGIC: Lấy hàng chờ các yêu cầu thay đổi booking / hoàn vé chờ duyệt từ Backend Apiato Porto
 */
export async function getBookingChangeQueue(
  params?: Record<string, any>
): Promise<PaginatedResponse<BookingChange>> {
  const response = await api.get<PaginatedResponse<BookingChange>>('/staff-queues/booking-changes', { params });
  return response.data;
}

/**
 * LOGIC: Duyệt hoặc từ chối yêu cầu thay đổi / hủy đổi vé
 */
export async function reviewBookingChange(
  id: string | number,
  decision: 'approve' | 'reject',
  reason: string = 'Đã xử lý từ giao diện quản trị'
): Promise<ApiResponse<BookingChange>> {
  const response = await api.post<ApiResponse<BookingChange>>(`/booking-changes/${id}/review`, {
    decision,
    reason,
  });
  return response.data;
}

export default {
  getBookingChangeQueue,
  reviewBookingChange,
};
