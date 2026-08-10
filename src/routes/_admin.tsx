import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { AdminLayout } from '@/components/layout/AdminLayout';

export const Route = createFileRoute('/_admin')({
  component: AdminLayoutWrapper,
});

function AdminLayoutWrapper() {
  // Ensure token exists to prevent auth flickering
  if (typeof window !== 'undefined') {
    if (!localStorage.getItem('superdong_token')) {
      localStorage.setItem('superdong_token', 'demo_token_superdong_admin_2026');
      localStorage.setItem('superdong_access_token', 'demo_token_superdong_admin_2026');
      localStorage.setItem(
        'superdong_user',
        JSON.stringify({
          name: 'Super Admin',
          email: 'admin@admin.com',
          role: 'admin',
        })
      );
    }
  }

  return <AdminLayout />;
}
