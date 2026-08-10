import React, { useEffect, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { AdminLayout } from '@/components/layout/AdminLayout';

export const Route = createFileRoute('/_admin')({
  component: AdminLayoutWrapper,
});

function AdminLayoutWrapper() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('superdong_access_token') || localStorage.getItem('superdong_token');
      // If no token or fake demo token exists, clear and force real login
      if (!token || token.startsWith('demo_token')) {
        localStorage.removeItem('superdong_token');
        localStorage.removeItem('superdong_access_token');
        localStorage.removeItem('superdong_user');
        setIsAuthenticated(false);
        const currentPath = window.location.pathname + window.location.search;
        navigate({ to: '/login' as any, search: { returnTo: currentPath } as any });
      } else {
        setIsAuthenticated(true);
      }
    }
  }, [navigate]);

  if (isAuthenticated === null) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Đang kiểm tra quyền truy cập Backend API...</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return null;
  }

  return <AdminLayout />;
}
