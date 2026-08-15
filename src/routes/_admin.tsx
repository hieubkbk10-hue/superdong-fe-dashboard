import React, { useEffect, useState } from 'react';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { clearStoredAuth, getStoredToken, isTokenExpired } from '@/helpers/auth';

export const Route = createFileRoute('/_admin')({
  beforeLoad: ({ location }) => {
    const token = getStoredToken();
    if (!token || isTokenExpired(token)) {
      clearStoredAuth();
      const returnTo = location.pathname + (location.searchStr ? `?${location.searchStr}` : '');
      throw redirect({
        to: '/login',
        search: {
          returnTo: returnTo && returnTo !== '/' ? returnTo : undefined,
        },
      });
    }
  },
  component: AdminLayoutWrapper,
});

function AdminLayoutWrapper() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState<boolean>(() => {
    const token = getStoredToken();
    return Boolean(token && !isTokenExpired(token));
  });

  useEffect(() => {
    const token = getStoredToken();
    if (!token || isTokenExpired(token)) {
      clearStoredAuth();
      const currentPath = window.location.pathname + window.location.search;
      navigate({
        to: '/login' as any,
        search: { returnTo: currentPath && currentPath !== '/' ? currentPath : undefined } as any,
      });
    } else {
      setAuthChecked(true);
    }
  }, [navigate]);

  if (!authChecked) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Đang kiểm tra quyền truy cập Backend API...</span>
        </div>
      </div>
    );
  }

  return <AdminLayout />;
}

