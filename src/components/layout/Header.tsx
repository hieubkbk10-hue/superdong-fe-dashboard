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

interface BreadcrumbItem {
  label: string;
  url?: string;
  isLast?: boolean;
}

function parseBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) {
    return [{ label: 'Tổng quan Vận hành', isLast: true }];
  }

  const items: BreadcrumbItem[] = [];
  const rootSegment = segments[0];
  const rootLabel = ROUTE_LABELS[rootSegment] || rootSegment.replace(/-/g, ' ');

  if (segments.length === 1) {
    items.push({ label: rootLabel, isLast: true });
    return items;
  }

  // Root section link
  items.push({ label: rootLabel, url: `/${rootSegment}` });

  // Handle Create and Edit actions cleanly
  if (segments.includes('create')) {
    items.push({ label: 'Thêm mới', isLast: true });
    return items;
  }

  if (segments.includes('edit')) {
    items.push({ label: 'Chỉnh sửa', isLast: true });
    return items;
  }

  // Other sub-paths
  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i];
    const isId = /^[a-zA-Z0-9_-]{8,}$/.test(seg) || /^\d+$/.test(seg);
    if (isId) {
      if (i === segments.length - 1) {
        items.push({ label: 'Chi tiết', isLast: true });
      }
      continue;
    }

    const label = ROUTE_LABELS[seg] || seg.replace(/-/g, ' ');
    const isLast = i === segments.length - 1;
    const url = `/${segments.slice(0, i + 1).join('/')}`;

    items.push({ label, url: isLast ? undefined : url, isLast });
  }

  return items;
}

export const Header: React.FC = () => {
  const { setMobileMenuOpen } = useSidebarState();
  const location = useLocation();
  const pathname = location.pathname;

  const breadcrumbItems = parseBreadcrumbs(pathname);

  return (
    <header className="h-[58px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8 transition-colors font-sans">
      {/* Left: Mobile Menu Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          className="xl:hidden p-1.5 -ml-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
          onClick={() => setMobileMenuOpen(true)}
          title="Mở Menu"
        >
          <MenuIcon size={20} />
        </button>

        <nav className="hidden sm:flex items-center text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">
          <Link to={"/" as any} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium flex items-center gap-1.5">
            <Home size={14} className="text-slate-400" />
            <span>Trang chủ</span>
          </Link>
          {breadcrumbItems.map((item, index) => (
            <React.Fragment key={index}>
              <ChevronRight size={13} className="mx-2 text-slate-300 dark:text-slate-600 shrink-0" />
              {item.isLast || !item.url ? (
                <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.url as any}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate font-medium"
                >
                  {item.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right: Search Autocomplete & Action Controls */}
      <div className="flex items-center gap-2.5 shrink-0">
        <AdminHeaderSearchAutocomplete />

        <button
          type="button"
          className="relative p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer hidden sm:flex"
          title="Thông báo hệ thống"
        >
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white dark:ring-slate-900" />
        </button>

        <ThemeToggle />

        <UserNav />
      </div>
    </header>
  );
};
