import { useState, useEffect, useCallback } from 'react';
import { Boat, SeatClass, SeatMap } from '../types';
import boatsApi from '../apis/boats';

export function useBoats(params?: Record<string, any>) {
  const [boats, setBoats] = useState<Boat[]>([]);
  const [seatClasses, setSeatClasses] = useState<SeatClass[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBoats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await boatsApi.getBoats(params);
      setBoats(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải danh sách tàu.');
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  const fetchSeatClasses = useCallback(async () => {
    try {
      const res = await boatsApi.getSeatClasses();
      setSeatClasses(res.data);
    } catch (err) {
      // Quiet fail for secondary metadata
    }
  }, []);

  useEffect(() => {
    fetchBoats();
    fetchSeatClasses();
  }, [fetchBoats, fetchSeatClasses]);

  const createBoat = useCallback(async (data: Partial<Boat>) => {
    const res = await boatsApi.createBoat(data);
    await fetchBoats();
    return res.data;
  }, [fetchBoats]);

  const updateBoat = useCallback(async (id: string | number, data: Partial<Boat>) => {
    const res = await boatsApi.updateBoat(id, data);
    await fetchBoats();
    return res.data;
  }, [fetchBoats]);

  const deactivateBoat = useCallback(async (id: string | number) => {
    const res = await boatsApi.deactivateBoat(id);
    await fetchBoats();
    return res.data;
  }, [fetchBoats]);

  return {
    boats,
    seatClasses,
    isLoading,
    error,
    refetch: fetchBoats,
    createBoat,
    updateBoat,
    deactivateBoat,
  };
}

export function useSeatMap(boatId: string | number | null) {
  const [seatMap, setSeatMap] = useState<SeatMap | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSeatMap = useCallback(async () => {
    if (!boatId) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await boatsApi.getSeatMap(boatId);
      setSeatMap(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải sơ đồ ghế.');
      setSeatMap(null);
    } finally {
      setIsLoading(false);
    }
  }, [boatId]);

  useEffect(() => {
    fetchSeatMap();
  }, [fetchSeatMap]);

  return {
    seatMap,
    isLoading,
    error,
    refetch: fetchSeatMap,
  };
}

export default useBoats;
