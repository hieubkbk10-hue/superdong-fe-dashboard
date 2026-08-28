import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  Search,
  Ship,
  Route as RouteIcon,
  ShoppingCart,
  Ticket,
  Users,
  Settings,
  LayoutDashboard,
  Layers,
  RefreshCw,
  History,
  MapPin,
  Calendar,
  CreditCard,
  FileCheck,
  ChevronRight,
} from 'lucide-react';

interface SearchOption {
  id: string;
  label: string;
  category: string;
  href: string;
  icon: React.ElementType;
}

const SEARCH_NAV_ITEMS: SearchOption[] = [
  { id: 'dash', label: 'Tổng quan Vận hành', category: 'Tổng quan', href: '/', icon: LayoutDashboard },
  { id: 'boats', label: 'Danh sách Tàu', category: 'Đội tàu & Ghế', href: '/boats', icon: Ship },
  { id: 'seat-classes', label: 'Hạng ghế tàu', category: 'Đội tàu & Ghế', href: '/seat-classes', icon: Layers },
  { id: 'seat-maps', label: 'Sơ đồ ghế 2D', category: 'Đội tàu & Ghế', href: '/seat-maps', icon: Layers },
  { id: 'locations', label: 'Bến tàu & Cảng', category: 'Hải trình & Lịch', href: '/locations', icon: MapPin },
  { id: 'routes', label: 'Luồng tuyến hải trình', category: 'Hải trình & Lịch', href: '/routes', icon: RouteIcon },
  { id: 'journeys', label: 'Hành trình bán vé', category: 'Hải trình & Lịch', href: '/journeys', icon: RouteIcon },
  { id: 'schedules', label: 'Lịch chạy định kỳ', category: 'Hải trình & Lịch', href: '/schedules', icon: Calendar },
  { id: 'trips', label: 'Chuyến tàu thực tế', category: 'Hải trình & Lịch', href: '/trips', icon: RouteIcon },
  { id: 'bookings', label: 'Quản lý Đơn vé', category: 'Bán hàng & Soát vé', href: '/bookings', icon: ShoppingCart },
  { id: 'check-in', label: 'Soát vé & Check-in', category: 'Bán hàng & Soát vé', href: '/check-in', icon: FileCheck },
  { id: 'payments', label: 'Thu quầy & Giao dịch', category: 'Bán hàng & Soát vé', href: '/payments', icon: CreditCard },
  { id: 'coupons', label: 'Mã Khuyến mãi Coupon', category: 'Bảng giá & Đổi vé', href: '/coupons', icon: Ticket },
  { id: 'traveler-types', label: 'Phân loại Hành khách', category: 'Bảng giá & Đổi vé', href: '/traveler-types', icon: Layers },
  { id: 'booking-changes', label: 'Yêu cầu Đổi / Hủy vé', category: 'Bảng giá & Đổi vé', href: '/booking-changes', icon: RefreshCw },
  { id: 'users', label: 'Tài khoản Nhân viên', category: 'Hệ thống', href: '/users', icon: Users },
  { id: 'roles', label: 'Vai trò & Phân quyền', category: 'Hệ thống', href: '/roles', icon: Users },
  { id: 'audit-logs', label: 'Nhật ký thao tác Audit', category: 'Hệ thống', href: '/audit-logs', icon: History },
  { id: 'settings', label: 'Cấu hình hệ thống', category: 'Hệ thống', href: '/settings', icon: Settings },
];

export const AdminHeaderSearchAutocomplete: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const filteredItems = useMemo(() => {
    if (!query.trim()) return SEARCH_NAV_ITEMS.slice(0, 6);
    const q = query.toLowerCase().trim();
    return SEARCH_NAV_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.href.toLowerCase().includes(q)
    );
  }, [query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = (href: string) => {
    setIsOpen(false);
    setQuery('');
    navigate({ to: href as any });
  };

  const handleKeyDownInput = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex].href);
      }
    }
  };

  return (
    <div className="relative w-48 sm:w-64" ref={containerRef}>
      <div className="relative flex items-center">
        <Search size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDownInput}
          placeholder="Tìm nhanh menu, list..."
          className="w-full h-8 pl-9 pr-3 text-xs bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 border border-transparent focus:border-blue-500 rounded-lg outline-none transition-all"
        />
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden custom-scrollbar max-h-[320px]">
          <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
            {query.trim() ? `Kết quả tìm kiếm (${filteredItems.length})` : 'Gợi ý truy cập nhanh'}
          </div>

          {filteredItems.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
              Không tìm thấy trang nào khớp với "{query}"
            </div>
          ) : (
            <div className="py-1">
              {filteredItems.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.href)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors text-xs ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-medium'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        size={16}
                        className={`shrink-0 ${
                          isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="text-[10px] text-slate-400 font-normal px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                        {item.category}
                      </span>
                      <ChevronRight size={13} className="text-slate-400 opacity-60" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
