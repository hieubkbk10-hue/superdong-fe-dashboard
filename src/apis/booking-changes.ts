import api from '../constants/api';
import { ApiResponse, PaginatedResponse, BookingChange } from '../types';

/**
 * LOGIC: Lấy hàng chờ các yêu cầu thay đổi booking / hoàn vé chờ duyệt
 */
export async function getBookingChangeQueue(
  params?: Record<string, any>
): Promise<PaginatedResponse<BookingChange>> {
  const response = await api.get<PaginatedResponse<BookingChange>>('/booking-changes/queue', { params });
  return response.data;
}

/**
 * LOGIC: Duyệt hoặc từ chối yêu cầu thay đổi / hủy đổi vé
 */
export async function reviewBookingChange(
  id: string | number,
  action: 'approve' | 'reject',
  notes?: string
): Promise<ApiResponse<BookingChange>> {
  const response = await api.post<ApiResponse<BookingChange>>(`/booking-changes/${id}/review`, {
    action,
    notes,
  });
  return response.data;
}

export default {
  getBookingChangeQueue,
  reviewBookingChange,
};
