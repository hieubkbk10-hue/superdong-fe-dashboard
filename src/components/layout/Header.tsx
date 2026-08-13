import React from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { Bell, ChevronRight, Home, Menu as MenuIcon } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { UserNav } from './UserNav';
import { AdminHeaderSearchAutocomplete } from './AdminHeaderSearchAutocomplete';
import { useSidebarState } from '@/contexts/SidebarContext';

const ROUTE_LABELS: Record<string, string> = {
  '': 'Dashboard',
  boats: 'Quản lý Đội tàu',
  'seat-classes': 'Hạng ghế tàu',
  'seat-maps': 'Sơ đồ ghế 2D',
  locations: 'Bến tàu & Cảng',
  routes: 'Luồng tuyến hải trình',
  journeys: 'Hành trình bán vé',
  schedules: 'Lịch chạy định kỳ',
  trips: 'Chuyến tàu thực tế',
  bookings: 'Quản lý Đơn vé',
  'check-in': 'Soát vé & Check-in',
  payments: 'Thu quầy & Giao dịch',
  coupons: 'Mã khuyến mãi Coupon',
  'traveler-types': 'Phân loại Hành khách',
  'booking-changes': 'Đổi / Hủy vé',
  users: 'Tài khoản Nhân viên',
  roles: 'Vai trò & Phân quyền',
  'audit-logs': 'Nhật ký thao tác Audit',
  settings: 'Cấu hình hệ thống',
};

export const Header: React.FC = () => {
  const { setMobileMenuOpen } = useSidebarState();
  const location = useLocation();
  const pathname = location.pathname;

  const segments = pathname.split('/').filter(Boolean);

  return (
    <header className="h-[54px] bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8 transition-colors font-sans">
      {/* Left: Mobile Menu Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          className="lg:hidden p-1.5 -ml-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer"
          onClick={() => setMobileMenuOpen(true)}
          title="Mở Menu"
        >
          <MenuIcon size={20} />
        </button>

        <nav className="hidden sm:flex items-center text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">
          <Link to={"/" as any} className="hover:text-blue-600 transition-colors font-medium">
            Trang chủ
          </Link>
          {segments.length === 0 ? (
            <>
              <ChevronRight size={14} className="mx-2 text-slate-300 dark:text-slate-600 shrink-0" />
              <span className="font-semibold text-slate-900 dark:text-slate-100">Tổng quan Vận hành</span>
            </>
          ) : (
            segments.map((segment, index) => {
              const url = `/${segments.slice(0, index + 1).join('/')}`;
              const label = ROUTE_LABELS[segment] || segment.replace(/-/g, ' ');
              const isLast = index === segments.length - 1;

              return (
                <React.Fragment key={url}>
                  <ChevronRight size={14} className="mx-2 text-slate-300 dark:text-slate-600 shrink-0" />
                  {isLast ? (
                    <span className="font-semibold text-slate-900 dark:text-slate-100 capitalize truncate">
                      {label}
                    </span>
                  ) : (
                    <Link
                      to={url as any}
                      className="capitalize hover:text-blue-600 transition-colors truncate"
                    >
                      {label}
                    </Link>
                  )}
                </React.Fragment>
              );
            })
          )}
        </nav>
      </div>

      {/* Right: Search Autocomplete & Action Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <AdminHeaderSearchAutocomplete />

        <Link
          to={"/" as any}
          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-full transition-colors hidden sm:flex"
          title="Về Trang chủ"
        >
          <Home size={17} />
        </Link>

        <button
          type="button"
          className="relative p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer hidden sm:flex"
          title="Thông báo hệ thống"
        >
          <Bell size={17} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full" />
        </button>

        <ThemeToggle />

        <UserNav />
      </div>
    </header>
  );
};
