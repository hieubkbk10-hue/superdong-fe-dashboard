import api from '../constants/api';
import { ApiResponse, Ticket, CheckIn, QRResolution } from '../types';

/**
 * LOGIC: Tìm chi tiết vé theo mã vé hoặc ID
 */
export async function findTicket(codeOrId: string | number): Promise<ApiResponse<Ticket>> {
  const response = await api.get<ApiResponse<Ticket>>(`/tickets/${codeOrId}`);
  return response.data;
}

/**
 * LOGIC: Quét và giải mã mã QR vé để kiểm tra tính hợp lệ
 */
export async function resolveQr(qrCode: string): Promise<ApiResponse<QRResolution>> {
  const response = await api.post<ApiResponse<QRResolution>>('/ticketing/resolve-qr', { qr_code: qrCode });
  return response.data;
}

/**
 * LOGIC: Thực hiện check-in cho danh sách các vé
 */
export async function checkInTravelers(ticketCodes: string[]): Promise<ApiResponse<CheckIn[]>> {
  const response = await api.post<ApiResponse<CheckIn[]>>('/ticketing/check-in', { ticket_codes: ticketCodes });
  return response.data;
}

/**
 * LOGIC: Đảo ngược / Hủy lượt check-in đã thực hiện
 */
export async function reverseCheckIn(
  checkInId: string | number,
  reason?: string
): Promise<ApiResponse<CheckIn>> {
  const response = await api.post<ApiResponse<CheckIn>>(`/ticketing/check-in/${checkInId}/reverse`, { reason });
  return response.data;
}

export default {
  findTicket,
  resolveQr,
  checkInTravelers,
  reverseCheckIn,
};
