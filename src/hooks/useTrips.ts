import { useState, useEffect, useCallback } from 'react';
import { Trip } from '../types';
import tripsApi from '../apis/trips';

export function useTrips(params?: Record<string, any>) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrips = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await tripsApi.getTrips(params);
      setTrips(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải danh sách chuyến tàu.');
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const openTrip = useCallback(async (id: string | number) => {
    const res = await tripsApi.openTripForSale(id);
    await fetchTrips();
    return res.data;
  }, [fetchTrips]);

  const closeTrip = useCallback(async (id: string | number) => {
    const res = await tripsApi.closeTripForSale(id);
    await fetchTrips();
    return res.data;
  }, [fetchTrips]);

  const markDeparted = useCallback(async (id: string | number) => {
    const res = await tripsApi.markTripDeparted(id);
    await fetchTrips();
    return res.data;
  }, [fetchTrips]);

  const completeTrip = useCallback(async (id: string | number) => {
    const res = await tripsApi.completeTrip(id);
    await fetchTrips();
    return res.data;
  }, [fetchTrips]);

  const cancelTrip = useCallback(async (id: string | number, reason?: string) => {
    const res = await tripsApi.cancelTrip(id, reason);
    await fetchTrips();
    return res.data;
  }, [fetchTrips]);

  return {
    trips,
    isLoading,
    error,
    refetch: fetchTrips,
    openTrip,
    closeTrip,
    markDeparted,
    completeTrip,
    cancelTrip,
  };
}

export default useTrips;
