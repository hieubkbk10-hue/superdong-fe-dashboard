import {
  LayoutDashboard,
  Ship,
  MapPin,
  CalendarDays,
  Ticket,
  QrCode,
  CreditCard,
  Tag,
  ArrowLeftRight,
  Users,
  History,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface SidebarSubItem {
  title: string;
  url: string;
  badge?: string;
}

export interface SidebarItem {
  title: string;
  url?: string;
  icon: LucideIcon;
  badge?: string;
  items?: SidebarSubItem[];
}

export interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

export const SIDEBAR_NAV: SidebarGroup[] = [
  {
    title: 'Bảng điều khiển',
    items: [
      {
        title: 'Tổng quan',
        url: '/',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'Quản lý Vận tải',
    items: [
      {
        title: 'Đội tàu & Ghế',
        icon: Ship,
        items: [
          { title: 'Quản lý Đội tàu', url: '/boats' },
          { title: 'Hạng ghế', url: '/seat-classes' },
          { title: 'Sơ đồ ghế', url: '/seat-maps' },
        ],
      },
      {
        title: 'Bến tàu & Tuyến',
        icon: MapPin,
        items: [
          { title: 'Danh sách Bến tàu', url: '/locations' },
          { title: 'Tuyến hải trình', url: '/routes' },
          { title: 'Hành trình vận hành', url: '/journeys' },
        ],
      },
      {
        title: 'Chuyến & Lịch chạy',
        icon: CalendarDays,
        items: [
          { title: 'Lịch chạy tàu', url: '/schedules' },
          { title: 'Danh sách Chuyến', url: '/trips' },
        ],
      },
    ],
  },
  {
    title: 'Nghiệp vụ Vé',
    items: [
      {
        title: 'Đơn đặt vé',
        url: '/bookings',
        icon: Ticket,
        badge: 'Mới',
      },
      {
        title: 'Soát vé & Check-in',
        url: '/check-in',
        icon: QrCode,
      },
      {
        title: 'Đổi / Hủy vé',
        url: '/booking-changes',
        icon: ArrowLeftRight,
      },
    ],
  },
  {
    title: 'Tài chính & Ưu đãi',
    items: [
      {
        title: 'Giao dịch & Thu quầy',
        url: '/payments',
        icon: CreditCard,
      },
      {
        title: 'Khuyến mãi & Loại khách',
        icon: Tag,
        items: [
          { title: 'Mã khuyến mãi', url: '/coupons' },
          { title: 'Loại hành khách', url: '/traveler-types' },
        ],
      },
    ],
  },
  {
    title: 'Hệ thống',
    items: [
      {
        title: 'Nhân viên & Phân quyền',
        icon: Users,
        items: [
          { title: 'Danh sách Nhân viên', url: '/users' },
          { title: 'Vai trò & Phân quyền', url: '/roles' },
        ],
      },
      {
        title: 'Nhật ký thao tác',
        url: '/audit-logs',
        icon: History,
      },
      {
        title: 'Cấu hình hệ thống',
        url: '/settings',
        icon: Settings,
      },
    ],
  },
];
