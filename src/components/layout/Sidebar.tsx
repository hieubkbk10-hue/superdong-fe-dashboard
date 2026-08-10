import React, { useState, useRef } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import {
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Anchor,
  LayoutDashboard,
  ShoppingCart,
  Ticket,
  Users,
  Globe,
  Settings,
  LogOut,
  Calendar,
  Layers,
  FileCheck,
  CreditCard,
  RefreshCw,
  ShieldCheck,
  History,
  FileText,
  Ship,
  MapPin,
  Route as RouteIcon,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

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

interface SidebarGroup {
  title: string;
  items: SidebarMenuItem[];
}

const SUPERDONG_BACKEND_NAV: SidebarGroup[] = [
  {
    title: 'TỔNG QUAN',
    items: [
      { label: 'Tổng quan Vận hành', href: '/', icon: LayoutDashboard },
    ],
  },
  {
    title: 'ĐỘI TÀU & GHẾ',
    items: [
      {
        label: 'Quản lý Đội tàu',
        icon: Ship,
        subItems: [
          { label: 'Danh sách Tàu', href: '/boats' },
          { label: 'Hạng ghế tàu', href: '/seat-classes' },
          { label: 'Sơ đồ ghế 2D', href: '/seat-maps' },
        ],
      },
    ],
  },
  {
    title: 'HẢI TRÌNH & LỊCH',
    items: [
      {
        label: 'Vận hành Hải trình',
        icon: RouteIcon,
        subItems: [
          { label: 'Bến tàu & Cảng', href: '/locations' },
          { label: 'Tuyến hải trình', href: '/journeys' },
          { label: 'Lịch chạy định kỳ', href: '/schedules' },
          { label: 'Chuyến tàu thực tế', href: '/trips' },
        ],
      },
    ],
  },
  {
    title: 'BÁN HÀNG & SOÁT VÉ',
    items: [
      {
        label: 'Đơn hàng & Vé',
        icon: ShoppingCart,
        subItems: [
          { label: 'Quản lý Đơn vé', href: '/bookings' },
          { label: 'Soát vé & Check-in', href: '/check-in' },
          { label: 'Thu quầy & Giao dịch', href: '/payments' },
          { label: 'Hóa đơn VAT', href: '/invoices' },
        ],
      },
    ],
  },
  {
    title: 'BẢNG GIÁ & ĐỔI VÉ',
    items: [
      { label: 'Mã Khuyến mãi Coupon', href: '/coupons', icon: Ticket },
      { label: 'Phân loại Hành khách', href: '/traveler-types', icon: Layers },
      { label: 'Yêu cầu Đổi / Hủy vé', href: '/booking-changes', icon: RefreshCw },
    ],
  },
  {
    title: 'HỆ THỐNG',
    items: [
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
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse }) => {
  const location = useLocation();
  const pathname = location.pathname;
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    'Quản lý Đội tàu': true,
    'Vận hành Hải trình': true,
    'Đơn hàng & Vé': true,
  });
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const toggleSubMenu = (label: string) => {
    if (collapsed) {
      onToggleCollapse();
    }
    setOpenMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
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

  const handleLogout = () => {
    localStorage.removeItem('superdong_token');
    localStorage.removeItem('superdong_user');
    window.location.replace('/login');
  };

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 transition-all duration-200 ease-in-out flex flex-col ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Header Logo matching Superdong Fast Ferry */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <Link to={"/" as any} className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs">
            SD
          </div>
          {!collapsed && (
            <div className="flex flex-col whitespace-nowrap overflow-hidden">
              <span className="font-bold text-sm text-slate-900 dark:text-white leading-snug tracking-wide">
                SUPERDONG
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Hệ thống Quản trị Tàu</span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation Menu matching Superdong Backend Entities */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 space-y-4 custom-scrollbar">
        {SUPERDONG_BACKEND_NAV.map((group, gIndex) => (
          <div key={gIndex} className="space-y-1">
            {!collapsed && (
              <h3 className="px-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                {group.title}
              </h3>
            )}

            {group.items.map((item, iIndex) => {
              const Icon = item.icon;
              const hasSub = item.subItems && item.subItems.length > 0;
              const isOpen = !!openMenus[item.label];
              const active = isItemActive(item);

              if (hasSub) {
                return (
                  <div key={iIndex} className="mb-1 group relative">
                    <button
                      type="button"
                      onClick={() => toggleSubMenu(item.label)}
                      className={`w-full flex items-center transition-all duration-200 rounded-md outline-none cursor-pointer ${
                        collapsed ? 'justify-center p-2' : 'justify-between px-3 py-2'
                      } ${
                        active
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      <div className={`flex items-center ${collapsed ? 'gap-0' : 'gap-3'}`}>
                        <Icon className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-105" />
                        {!collapsed && (
                          <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                        )}
                      </div>
                      {!collapsed && (
                        <ChevronRight
                          className={`h-4 w-4 transition-transform duration-200 opacity-70 ${
                            isOpen ? 'rotate-90' : ''
                          }`}
                        />
                      )}
                    </button>

                    {/* Submenu links with left border matching photo 3 */}
                    {!collapsed && isOpen && (
                      <div className="ml-4 border-l-2 border-slate-100 dark:border-slate-800 pl-3 space-y-1 my-1">
                        {item.subItems?.map((sub, sIndex) => {
                          const subActive = isUrlActive(sub.href);
                          return (
                            <Link
                              key={sIndex}
                              to={sub.href as any}
                              className={`block px-3 py-1.5 rounded-md text-sm transition-colors truncate ${
                                subActive
                                  ? 'text-blue-600 bg-blue-500/10 font-semibold dark:text-blue-400'
                                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                              }`}
                            >
                              {sub.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div key={iIndex} className="mb-1 group relative">
                  <Link
                    to={(item.href || '#') as any}
                    className={`flex items-center transition-all duration-200 rounded-md outline-none ${
                      collapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2'
                    } ${
                      active
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-105" />
                    {!collapsed && (
                      <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                    )}
                  </Link>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Collapse Button & User Card matching photo 3 */}
      <div className="px-3 py-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center justify-center w-full h-8 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          title={collapsed ? 'Mở rộng' : 'Thu gọn'}
        >
          {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
        </button>

        {/* User Card matching photo 3 */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-700">
                S
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-800" />
            </div>

            {!collapsed && (
              <div className="flex-1 overflow-hidden text-left">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  Super Admin
                </div>
                <div className="text-xs text-slate-400 truncate">
                  admin@superdong.com.vn
                </div>
              </div>
            )}
          </button>

          {/* User Popover Menu */}
          {showUserMenu && (
            <div
              className={`absolute z-50 rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900 ${
                collapsed ? 'left-full bottom-0 ml-2 w-56' : 'left-0 bottom-full mb-2 w-full'
              }`}
            >
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 transition-colors cursor-pointer rounded-md"
              >
                <LogOut size={16} />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
