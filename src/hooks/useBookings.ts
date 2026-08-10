import { useState, useEffect, useCallback } from 'react';
import { Booking } from '../types';
import bookingsApi, { SeatReassignment } from '../apis/bookings';

export function useBookings(params?: Record<string, any>) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await bookingsApi.getBookings(params);
      setBookings(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải danh sách đơn vé.');
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const reassignSeats = useCallback(async (bookingId: string | number, reassignments: SeatReassignment[]) => {
    const res = await bookingsApi.reassignSeats(bookingId, reassignments);
    await fetchBookings();
    return res.data;
  }, [fetchBookings]);

  return {
    bookings,
    isLoading,
    error,
    refetch: fetchBookings,
    reassignSeats,
  };
}

export function useBookingDetail(codeOrId: string | number | null) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!codeOrId) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await bookingsApi.findBooking(codeOrId);
      setBooking(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không tìm thấy thông tin đơn đặt vé.');
      setBooking(null);
    } finally {
      setIsLoading(false);
    }
  }, [codeOrId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return {
    booking,
    isLoading,
    error,
    refetch: fetchDetail,
  };
}

export default useBookings;
