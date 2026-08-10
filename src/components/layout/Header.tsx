import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { Bell, ChevronRight, Home, Menu as MenuIcon, Moon, Sun, Search } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { UserNav } from './UserNav';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

const ROUTE_LABELS: Record<string, string> = {
  '': 'Dashboard',
  posts: 'Quản lý bài viết',
  'post-categories': 'Danh mục bài viết',
  boats: 'Quản lý Đội tàu',
  'seat-classes': 'Hạng ghế',
  'seat-maps': 'Sơ đồ ghế',
  locations: 'Bến tàu & Cảng',
  journeys: 'Hành trình',
  schedules: 'Lịch chạy tàu',
  trips: 'Danh sách Chuyến',
  bookings: 'Đơn đặt vé',
  'check-in': 'Soát vé & Check-in',
  payments: 'Giao dịch & Thu quầy',
  coupons: 'Mã khuyến mãi',
  'traveler-types': 'Phân loại Hành khách',
  'booking-changes': 'Đổi / Hủy vé',
  users: 'Tài khoản Nhân viên',
  roles: 'Phân quyền',
  'audit-logs': 'Nhật ký thao tác',
  settings: 'Cấu hình hệ thống',
};

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const [searchTerm, setSearchTerm] = useState('');

  const segments = pathname.split('/').filter(Boolean);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate({ to: '/posts' as any });
    }
  };

  return (
    <header className="h-[54px] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8 transition-colors font-sans">
      {/* Left: Mobile Menu & Breadcrumbs matching photo 3 */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="lg:hidden p-1.5 -ml-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-md cursor-pointer"
          onClick={onToggleSidebar}
        >
          <MenuIcon size={24} />
        </button>
        <nav className="hidden md:flex items-center text-sm text-slate-500 dark:text-slate-400">
          <Link to={"/" as any} className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          {segments.length === 0 ? (
            <>
              <ChevronRight size={14} className="mx-2 text-slate-300 dark:text-slate-600" />
              <span className="font-medium text-slate-900 dark:text-slate-100">Posts</span>
            </>
          ) : (
            segments.map((segment, index) => {
              const url = `/${segments.slice(0, index + 1).join('/')}`;
              const label = ROUTE_LABELS[segment] || segment.replace(/-/g, ' ');
              const isLast = index === segments.length - 1;

              return (
                <React.Fragment key={url}>
                  <ChevronRight size={14} className="mx-2 text-slate-300 dark:text-slate-600" />
                  <Link
                    to={url as any}
                    className={`capitalize hover:text-blue-600 transition-colors ${
                      isLast ? 'font-medium text-slate-900 dark:text-slate-100' : ''
                    }`}
                  >
                    {label}
                  </Link>
                </React.Fragment>
              );
            })
          )}
        </nav>
      </div>

      {/* Right: Search & Action Controls matching photo 3 */}
      <div className="flex items-center gap-2">
        <form onSubmit={handleSearchSubmit} className="hidden md:block relative w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm nhanh menu, list, edit..."
            className="w-full h-8 pl-9 pr-3 text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-400 border border-transparent focus:border-blue-500 rounded-lg outline-none transition-all"
          />
        </form>

        <Link
          to={"/" as any}
          className="p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-full transition-colors"
          title="Mở trang chủ"
        >
          <Home size={18} />
        </Link>

        <button
          type="button"
          className="relative p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          title="Thông báo"
        >
          <Bell size={18} />
        </button>

        <ThemeToggle />

        <UserNav />
      </div>
    </header>
  );
};
