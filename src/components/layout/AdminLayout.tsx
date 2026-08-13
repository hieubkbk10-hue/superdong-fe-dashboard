import React from 'react';
import { Outlet } from '@tanstack/react-router';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SidebarProvider } from '@/contexts/SidebarContext';

function AdminLayoutContent() {
  return (
    <div className="admin-shell min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 flex font-sans">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        {/* Header Bar */}
        <Header />

        {/* Page Content Outlet */}
        <main className="flex-1 px-4 pt-3 pb-4 lg:px-8 lg:pt-4 lg:pb-8 overflow-x-hidden w-full max-w-[1800px] mx-auto space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export const AdminLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <AdminLayoutContent />
    </SidebarProvider>
  );
};
