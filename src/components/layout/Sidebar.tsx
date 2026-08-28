import React, { useState, useMemo } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import {
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  ShoppingCart,
  Ticket,
  Users,
  Settings,
  Layers,
  RefreshCw,
  History,
  Ship,
  Route as RouteIcon,
  X,
  Anchor,
} from 'lucide-react';
import { useSidebarState } from '@/contexts/SidebarContext';

interface SidebarSubItem {
  label: string;
  href: string;
}

interface SidebarMenuItem {
  icon: React.ElementType;
  label: string;
  href?: string;
  subItems?: SidebarSubItem[];
}

const SUPERDONG_NAV_ITEMS: SidebarMenuItem[] = [
  { label: 'Tổng quan Vận hành', href: '/', icon: LayoutDashboard },
  {
    label: 'Quản lý Đội tàu',
    icon: Ship,
    subItems: [
      { label: 'Danh sách Tàu', href: '/boats' },
      { label: 'Hạng ghế tàu', href: '/seat-classes' },
      { label: 'Sơ đồ ghế 2D', href: '/seat-maps' },
    ],
  },
  {
    label: 'Vận hành Hải trình',
    icon: RouteIcon,
    subItems: [
      { label: 'Bến tàu & Cảng', href: '/locations' },
      { label: 'Luồng tuyến', href: '/routes' },
      { label: 'Hành trình bán vé', href: '/journeys' },
      { label: 'Lịch chạy định kỳ', href: '/schedules' },
      { label: 'Chuyến tàu thực tế', href: '/trips' },
    ],
  },
  {
    label: 'Đơn hàng & Vé',
    icon: ShoppingCart,
    subItems: [
      { label: 'Quản lý Đơn vé', href: '/bookings' },
      { label: 'Soát vé & Check-in', href: '/check-in' },
      { label: 'Thu quầy & Giao dịch', href: '/payments' },
    ],
  },
  { label: 'Mã Khuyến mãi Coupon', href: '/coupons', icon: Ticket },
  { label: 'Phân loại Hành khách', href: '/traveler-types', icon: Layers },
  { label: 'Yêu cầu Đổi / Hủy vé', href: '/booking-changes', icon: RefreshCw },
  {
    label: 'Tài khoản & Quyền',
    icon: Users,
    subItems: [
      { label: 'Tài khoản Nhân viên', href: '/users' },
      { label: 'Vai trò & Phân quyền', href: '/roles' },
    ],
  },
  { label: 'Nhật ký thao tác Audit', href: '/audit-logs', icon: History },
  { label: 'Cấu hình hệ thống', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { isSidebarCollapsed, setIsSidebarCollapsed, mobileMenuOpen, setMobileMenuOpen } = useSidebarState();
  const location = useLocation();
  const pathname = location.pathname;

  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const activeMenuFromUrl = useMemo(() => {
    if (pathname.startsWith('/boats') || pathname.startsWith('/seat-classes') || pathname.startsWith('/seat-maps')) {
      return 'Quản lý Đội tàu';
    }
    if (
      pathname.startsWith('/locations') ||
      pathname.startsWith('/routes') ||
      pathname.startsWith('/journeys') ||
      pathname.startsWith('/schedules') ||
      pathname.startsWith('/trips')
    ) {
      return 'Vận hành Hải trình';
    }
    if (pathname.startsWith('/bookings') || pathname.startsWith('/check-in') || pathname.startsWith('/payments')) {
      return 'Đơn hàng & Vé';
    }
    if (pathname.startsWith('/users') || pathname.startsWith('/roles')) {
      return 'Tài khoản & Quyền';
    }
    return null;
  }, [pathname]);

  const currentExpandedMenu = expandedMenu ?? activeMenuFromUrl;

  const handleMenuToggle = (label: string) => {
    if (isSidebarCollapsed) {
      setIsSidebarCollapsed(false);
      setExpandedMenu(label);
    } else {
      setExpandedMenu((prev) => (prev === label ? null : label));
    }
  };

  const isUrlActive = (url: string) => {
    if (url === '/') return pathname === '/';
    return pathname === url || pathname.startsWith(`${url}/`);
  };

  const isItemActive = (item: SidebarMenuItem) => {
    if (item.href) return isUrlActive(item.href);
    if (item.subItems) return item.subItems.some((sub) => isUrlActive(sub.href));
    return false;
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-800 dark:text-slate-100 border-r border-slate-200/80 dark:border-slate-800/80 z-50 transition-all duration-300 ease-in-out flex flex-col shadow-xs lg:shadow-none ${
          isSidebarCollapsed ? 'lg:w-[76px]' : 'lg:w-[260px]'
        } ${mobileMenuOpen ? 'translate-x-0 w-[260px]' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header Bar (Mobile + Desktop) */}
        <div className="flex items-center justify-between h-[58px] px-4 border-b border-slate-200/80 dark:border-slate-800/80 shrink-0">
          <Link to={"/" as any} className="flex items-center gap-2.5 group outline-none">
            <img
              src="/logo-1.svg"
              alt="Superdong Logo"
              className="h-8 w-auto object-contain shrink-0 group-hover:scale-105 transition-transform"
            />
            <div
              className={`flex flex-col transition-all duration-300 ${
                isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'
              }`}
            >
              <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-slate-50 leading-tight">
                SUPERDONG
              </span>
              <span className="text-[10px] font-semibold text-blue-600 dark:text-cyan-400 tracking-wider">
                MANAGEMENT HUB
              </span>
            </div>
          </Link>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 py-3 px-2.5 space-y-1 overflow-y-auto custom-scrollbar">
          {SUPERDONG_NAV_ITEMS.map((item, iIdx) => {
            const Icon = item.icon;
            const hasSub = !!item.subItems && item.subItems.length > 0;
            const active = isItemActive(item);
            const isExpanded = currentExpandedMenu === item.label;

            if (hasSub) {
              return (
                <div key={iIdx} className="mb-0.5 group relative">
                  <button
                    type="button"
                    onClick={() => handleMenuToggle(item.label)}
                    className={`w-full flex items-center transition-all duration-200 rounded-xl outline-none cursor-pointer ${
                      isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'
                    } ${
                      active
                        ? 'bg-blue-50/90 text-blue-600 font-semibold dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                    title={isSidebarCollapsed ? item.label : undefined}
                  >
                    <div className={`flex items-center ${isSidebarCollapsed ? 'gap-0' : 'gap-3'}`}>
                      <Icon
                        size={18}
                        className={`shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                          active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                        }`}
                      />
                      <span
                        className={`text-xs sm:text-sm tracking-tight whitespace-nowrap transition-all duration-300 ${
                          isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                    {!isSidebarCollapsed && (
                      <ChevronRight
                        size={14}
                        className={`transition-transform duration-200 opacity-70 ${
                          active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                        } ${isExpanded ? 'rotate-90' : ''}`}
                      />
                    )}
                  </button>

                  {/* Submenu Drawer */}
                  {hasSub && (
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isExpanded && !isSidebarCollapsed ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="ml-4 border-l border-slate-200/80 dark:border-slate-800 pl-2.5 space-y-1 my-1">
                        {item.subItems?.map((sub, sIdx) => {
                          const subActive = isUrlActive(sub.href);
                          return (
                            <Link
                              key={sIdx}
                              to={sub.href as any}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`block px-3 py-1.5 rounded-lg text-xs transition-all truncate ${
                                subActive
                                  ? 'text-blue-600 bg-blue-50/90 font-bold dark:text-blue-400 dark:bg-blue-950/40 shadow-xs'
                                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 font-medium'
                              }`}
                            >
                              {sub.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div key={iIdx} className="mb-0.5 group relative">
                <Link
                  to={(item.href || '#') as any}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center transition-all duration-200 rounded-xl outline-none ${
                    isSidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
                  } ${
                    active
                      ? 'bg-blue-600 text-white font-semibold shadow-xs shadow-blue-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <Icon
                    size={18}
                    className={`shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                      active ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                    }`}
                  />
                  <span
                    className={`text-xs sm:text-sm tracking-tight whitespace-nowrap transition-all duration-300 ${
                      isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Bottom Toggle Collapse Bar */}
        <div className="p-2.5 border-t border-slate-200/80 dark:border-slate-800/80 shrink-0">
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden lg:flex items-center justify-center w-full h-8 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title={isSidebarCollapsed ? 'Mở rộng Sidebar' : 'Thu gọn Sidebar'}
          >
            {isSidebarCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          </button>
        </div>
      </aside>
    </>
  );
};
