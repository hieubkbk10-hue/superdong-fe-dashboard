import api from '../constants/api';
import { PaginatedResponse, AuditRecord } from '../types';

/**
 * LOGIC: Lấy nhật ký thao tác / audit logs hệ thống từ Backend Apiato Porto
 */
export async function getAuditRecords(params?: Record<string, any>): Promise<PaginatedResponse<AuditRecord>> {
  const response = await api.get<PaginatedResponse<AuditRecord>>('/audit-records', { params });
  return response.data;
}

export default {
  getAuditRecords,
};
