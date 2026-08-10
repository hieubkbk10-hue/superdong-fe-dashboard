import api from '../constants/api';
import { ApiResponse, PaginatedResponse, TravelerType, Coupon } from '../types';

export interface QuoteBookingItem {
  traveler_type_id: string | number;
  seat_class_id?: string | number;
}

export interface QuoteBookingPayload {
  trip_ids: Array<string | number>;
  travelers: QuoteBookingItem[];
  coupon_code?: string;
}

export interface BookingQuoteResult {
  base_price: number;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  traveler_breakdown: Array<{
    traveler_type_id: string | number;
    original_price: number;
    final_price: number;
  }>;
  coupon_applied?: Coupon;
}

/**
 * LOGIC: Lấy danh sách phân loại hành khách (Người lớn, Trẻ em, Người cao tuổi...)
 */
export async function getTravelerTypes(): Promise<ApiResponse<TravelerType[]>> {
  const response = await api.get<ApiResponse<TravelerType[]>>('/traveler-types');
  return response.data;
}

/**
 * LOGIC: Tạo đối tượng phân loại hành khách mới
 */
export async function createTravelerType(data: Partial<TravelerType>): Promise<ApiResponse<TravelerType>> {
  const response = await api.post<ApiResponse<TravelerType>>('/traveler-types', data);
  return response.data;
}

/**
 * LOGIC: Cập nhật thông tin phân loại hành khách
 */
export async function updateTravelerType(
  id: string | number,
  data: Partial<TravelerType>
): Promise<ApiResponse<TravelerType>> {
  const response = await api.put<ApiResponse<TravelerType>>(`/traveler-types/${id}`, data);
  return response.data;
}

/**
 * LOGIC: Lấy danh sách mã giảm giá / coupon
 */
export async function getCoupons(params?: Record<string, any>): Promise<PaginatedResponse<Coupon>> {
  const response = await api.get<PaginatedResponse<Coupon>>('/coupons', { params });
  return response.data;
}

/**
 * LOGIC: Lấy thông tin chi tiết một coupon theo ID
 */
export async function findCouponById(id: string | number): Promise<ApiResponse<Coupon>> {
  const response = await api.get<ApiResponse<Coupon>>(`/coupons/${id}`);
  return response.data;
}

/**
 * LOGIC: Tạo mã giảm giá / coupon mới
 */
export async function createCoupon(data: Partial<Coupon>): Promise<ApiResponse<Coupon>> {
  const response = await api.post<ApiResponse<Coupon>>('/coupons', data);
  return response.data;
}

/**
 * LOGIC: Cập nhật thông tin mã giảm giá
 */
export async function updateCoupon(id: string | number, data: Partial<Coupon>): Promise<ApiResponse<Coupon>> {
  const response = await api.put<ApiResponse<Coupon>>(`/coupons/${id}`, data);
  return response.data;
}

/**
 * LOGIC: Xóa mã giảm giá khỏi hệ thống (có lưu snapshot audit log)
 */
export async function deleteCoupon(id: string | number): Promise<any> {
  const response = await api.delete(`/coupons/${id}`);
  return response.data;
}

/**
 * LOGIC: Tạm tính giá đơn hàng trước khi đặt vé
 */
export async function quoteBooking(params: QuoteBookingPayload): Promise<ApiResponse<BookingQuoteResult>> {
  const response = await api.post<ApiResponse<BookingQuoteResult>>('/pricing/quote', params);
  return response.data;
}

export default {
  getTravelerTypes,
  createTravelerType,
  updateTravelerType,
  getCoupons,
  findCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  quoteBooking,
};
