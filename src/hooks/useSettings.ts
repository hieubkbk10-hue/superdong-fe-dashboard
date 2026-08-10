import { useState, useEffect, useCallback } from 'react';
import { SystemSetting } from '../types';
import settingsApi from '../apis/settings';

export function useSettings() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await settingsApi.getSettings();
      setSettings(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải cài đặt hệ thống.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSetting = useCallback(async (key: string, value: string) => {
    const res = await settingsApi.updateSetting(key, value);
    await fetchSettings();
    return res.data;
  }, [fetchSettings]);

  return {
    settings,
    isLoading,
    error,
    refetch: fetchSettings,
    updateSetting,
  };
}

export default useSettings;
