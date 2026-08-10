import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import authApi, { LoginPayload } from '../apis/auth';
import { TOKEN_STORAGE_KEY } from '../constants/api';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await authApi.getProfile();
      setUser(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải thông tin tài khoản.');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const login = useCallback(async (payload: LoginPayload) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await authApi.login(payload);
      setUser(res.data.user);
      return res.data;
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await authApi.logout();
    } catch (err) {
      // Ignore logout errors and clear state
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    refreshProfile: fetchProfile,
  };
}

export default useAuth;
