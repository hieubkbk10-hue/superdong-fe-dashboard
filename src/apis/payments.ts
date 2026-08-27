import api from '../constants/api';
import { ApiResponse, PaginatedResponse, Payment, OfficePaymentConfirm } from '../types';

const MOCK_PAYMENTS: Payment[] = [
  {
    id: 'PAY-1001',
    booking_id: 'BK1001',
    booking_code: 'SD20260827RG01',
    amount: 680000,
    payment_method: 'vnpay',
    gateway: 'VNPay QR',
    transaction_reference: 'VNP1489201948',
    status: 'success',
    confirmed_at: '2026-08-27T08:35:00.000Z',
    notes: 'Thanh toán quét mã VNPAY-QR thành công',
    created_at: '2026-08-27T08:30:00.000Z',
  },
  {
    id: 'PAY-1002',
    booking_id: 'BK1002',
    booking_code: 'SD20260827PQ02',
    amount: 340000,
    payment_method: 'counter_cash',
    gateway: 'Tiền mặt tại quầy',
    transaction_reference: 'CASH-RG-001',
    status: 'pending',
    notes: 'Khách hẹn thanh toán tiền mặt tại quầy Rạch Giá trước giờ tàu chạy',
    created_at: '2026-08-27T09:15:00.000Z',
  },
  {
    id: 'PAY-1003',
    booking_id: 'BK1003',
    booking_code: 'SD20260826HT03',
    amount: 860000,
    payment_method: 'vietqr',
    gateway: 'PayOS / VietQR PRO',
    transaction_reference: 'PAYOS-99182374',
    status: 'success',
    confirmed_at: '2026-08-26T14:25:00.000Z',
    notes: 'Khách chuyển khoản tự động qua VietQR Vietcombank',
    created_at: '2026-08-26T14:20:00.000Z',
  },
  {
    id: 'PAY-1004',
    booking_id: 'BK1004',
    booking_code: 'SD20260825CD04',
    amount: 520000,
    payment_method: 'vnpay',
    gateway: 'VNPay Cổng thẻ',
    transaction_reference: 'VNP1489001234',
    status: 'cancelled',
    notes: 'Đã hoàn tiền theo yêu cầu hủy vé của khách',
    created_at: '2026-08-25T11:00:00.000Z',
  },
  {
    id: 'PAY-1005',
    booking_id: 'BK1005',
    booking_code: 'SD20260825ST05',
    amount: 320000,
    payment_method: 'momo',
    gateway: 'Ví điện tử MoMo',
    transaction_reference: 'MOMO-20260825-9988',
    status: 'success',
    confirmed_at: '2026-08-25T16:48:00.000Z',
    notes: 'Thanh toán App MoMo tự động',
    created_at: '2026-08-25T16:45:00.000Z',
  },
];

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
  try {
    const response = await api.get<PaginatedResponse<Payment>>('/payments', { params });
    if (response.data && Array.isArray(response.data.data)) {
      return response.data;
    }
    return {
      data: MOCK_PAYMENTS,
      meta: {
        pagination: {
          total: MOCK_PAYMENTS.length,
          count: MOCK_PAYMENTS.length,
          per_page: 20,
          current_page: 1,
          total_pages: 1,
        },
      },
    };
  } catch (error: any) {
    console.warn('GET /payments error, using mock fallback data:', error?.message);
    return {
      data: MOCK_PAYMENTS,
      meta: {
        pagination: {
          total: MOCK_PAYMENTS.length,
          count: MOCK_PAYMENTS.length,
          per_page: 20,
          current_page: 1,
          total_pages: 1,
        },
      },
    };
  }
}

export default {
  getPayments,
  createPayment,
  getPaymentStatus,
  confirmOfficePayment,
  reconcilePaymentAttempt,
};
