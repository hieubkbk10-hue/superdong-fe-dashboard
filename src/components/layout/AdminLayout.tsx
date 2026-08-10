import React, { useState } from 'react';
import { Outlet, useLocation, Link } from '@tanstack/react-router';
import { ChevronRight, Home } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const ROUTE_LABELS: Record<string, string> = {
  '': 'Tổng quan',
  boats: 'Quản lý Đội tàu',
  'seat-classes': 'Hạng ghế',
  'seat-maps': 'Sơ đồ ghế',
  locations: 'Bến tàu & Cảng',
  routes: 'Tuyến hải trình',
  journeys: 'Hành trình',
  schedules: 'Lịch chạy tàu',
  trips: 'Danh sách Chuyến',
  bookings: 'Đơn đặt vé',
  'check-in': 'Soát vé & Check-in',
  payments: 'Giao dịch & Thu quầy',
  coupons: 'Mã khuyến mãi',
  'traveler-types': 'Loại hành khách',
  'booking-changes': 'Đổi / Hủy vé',
  users: 'Quản lý Nhân viên',
  roles: 'Phân quyền',
  'audit-logs': 'Nhật ký thao tác',
  settings: 'Cấu hình hệ thống',
};

export const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 flex font-sans">
      {/* Sidebar Navigation */}
      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />

      {/* Main Wrapper */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${
          collapsed ? 'pl-16' : 'pl-60'
        }`}
      >
        {/* Header Bar */}
        <Header onToggleSidebar={() => setCollapsed(!collapsed)} />

        {/* Page Content Outlet */}
        <main className="flex-1 p-4 lg:p-8 space-y-6 overflow-x-hidden w-full max-w-[1600px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

