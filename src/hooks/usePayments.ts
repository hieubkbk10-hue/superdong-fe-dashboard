import { useState, useCallback } from 'react';
import { Payment, OfficePaymentConfirm } from '../types';
import paymentsApi from '../apis/payments';

export function usePayments() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const confirmOfficePayment = useCallback(async (data: OfficePaymentConfirm): Promise<Payment | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await paymentsApi.confirmOfficePayment(data);
      return res.data;
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Xác nhận thanh toán tại văn phòng thất bại.';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPaymentStatus = useCallback(async (paymentId: string | number): Promise<Payment | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await paymentsApi.getPaymentStatus(paymentId);
      return res.data;
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể lấy trạng thái thanh toán.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reconcilePayment = useCallback(async (paymentId: string | number): Promise<Payment | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await paymentsApi.reconcilePaymentAttempt(paymentId);
      return res.data;
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Đối soát giao dịch thất bại.';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    confirmOfficePayment,
    getPaymentStatus,
    reconcilePayment,
  };
}

export default usePayments;
