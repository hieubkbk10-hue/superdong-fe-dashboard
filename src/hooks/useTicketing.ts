import { useState, useCallback } from 'react';
import { Ticket, CheckIn, QRResolution } from '../types';
import ticketingApi from '../apis/ticketing';

export function useTicketing() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const resolveQr = useCallback(async (qrCode: string): Promise<QRResolution | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await ticketingApi.resolveQr(qrCode);
      return res.data;
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Không thể quét mã QR vé.';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkIn = useCallback(async (ticketCodes: string[]): Promise<CheckIn[] | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await ticketingApi.checkInTravelers(ticketCodes);
      return res.data;
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Thao tác check-in thất bại.';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reverseCheckIn = useCallback(async (checkInId: string | number, reason?: string): Promise<CheckIn | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await ticketingApi.reverseCheckIn(checkInId, reason);
      return res.data;
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Không thể hủy lượt check-in.';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const findTicket = useCallback(async (codeOrId: string | number): Promise<Ticket | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await ticketingApi.findTicket(codeOrId);
      return res.data;
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không tìm thấy thông tin vé.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    resolveQr,
    checkIn,
    reverseCheckIn,
    findTicket,
  };
}

export default useTicketing;
