import api from '../constants/api';
import { ApiResponse, PaginatedResponse, Payment, OfficePaymentConfirm } from '../types';

/**
 * LOGIC: Khởi tạo giao dịch thanh toán mới cho đơn hàng
 */
export async function createPayment(data: Partial<Payment>): Promise<ApiResponse<Payment>> {
  const response = await api.post<ApiResponse<Payment>>('/payments', data);
  return response.data;
}

/**
 * LOGIC: Lấy trạng thái giao dịch thanh toán theo ID
 */
export async function getPaymentStatus(paymentId: string | number): Promise<ApiResponse<Payment>> {
  const response = await api.get<ApiResponse<Payment>>(`/payments/${paymentId}/status`);
  return response.data;
}

/**
 * LOGIC: Xác nhận thanh toán tiền mặt/chuyển khoản trực tiếp tại văn phòng
 */
export async function confirmOfficePayment(data: OfficePaymentConfirm): Promise<ApiResponse<Payment>> {
  const response = await api.post<ApiResponse<Payment>>('/payments/office-confirm', data);
  return response.data;
}

/**
 * LOGIC: Đối soát lại giao dịch thanh toán nghi ngờ lỗi với cổng thanh toán
 */
export async function reconcilePaymentAttempt(paymentId: string | number): Promise<ApiResponse<Payment>> {
  const response = await api.post<ApiResponse<Payment>>(`/payments/${paymentId}/reconcile`);
  return response.data;
}

/**
 * LOGIC: Lấy danh sách giao dịch thanh toán
 */
export async function getPayments(params?: Record<string, any>): Promise<PaginatedResponse<Payment>> {
  const response = await api.get<PaginatedResponse<Payment>>('/payments', { params });
  return response.data;
}

export default {
  getPayments,
  createPayment,
  getPaymentStatus,
  confirmOfficePayment,
  reconcilePaymentAttempt,
};
