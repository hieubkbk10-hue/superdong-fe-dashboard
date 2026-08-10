import React, { useState, useEffect } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  ShoppingCart,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Filter,
  User,
  Phone,
  Calendar,
  Ship,
  X,
  Printer,
  FileText,
  CreditCard,
  Wifi
} from 'lucide-react';
import { toast } from 'sonner';
import { Booking } from '@/types';
import { getBookings, createBooking, updateBooking } from '@/apis/bookings';

export const Route = createFileRoute('/_admin/bookings/')({
  component: BookingsPage,
});

const INITIAL_BOOKINGS: Booking[] = [
  {
    id: '1',
    booking_code: 'BK-99201',
    status: 'confirmed',
    payment_status: 'paid',
    coupon_code: 'SUMMER2026',
    total_amount: 680000,
    discount_amount: 50000,
    final_amount: 630000,
    booker: {
      name: 'Nguyễn Văn Hùng',
      phone: '0903.123.456',
      email: 'hung.nguyen@gmail.com',
      id_card: '079088123456',
      address: 'Quận 1, TP. Hồ Chí Minh'
    },
    travelers: [
      { full_name: 'Nguyễn Văn Hùng', traveler_type_id: '1', seat_code: 'A04', price: 340000, id_number: '079088123456' },
      { full_name: 'Lê Thị Minh', traveler_type_id: '1', seat_code: 'A05', price: 340000, id_number: '079088654321' }
    ],
    booking_trips: [
      {
        id: 'bt1',
        booking_id: '1',
        trip_id: 't1',
        departure_time: '2026-08-15 07:30',
        origin_location: { id: 'loc1', name: 'Bến Rạch Giá', code: 'RG', city: 'Kiên Giang', is_active: true },
        destination_location: { id: 'loc2', name: 'Bến Phú Quốc (Bãi Vòng)', code: 'PQ', city: 'Phú Quốc', is_active: true }
      }
    ],
    created_at: '2026-08-10 08:30'
  },
  {
    id: '2',
    booking_code: 'BK-99202',
    status: 'pending',
    payment_status: 'unpaid',
    total_amount: 340000,
    discount_amount: 0,
    final_amount: 340000,
    booker: {
      name: 'Trần Thị Thảo',
      phone: '0918.987.654',
      email: 'thao.tran@yahoo.com',
      id_card: '068092001122'
    },
    travelers: [
      { full_name: 'Trần Thị Thảo', traveler_type_id: '1', seat_code: 'B12', price: 340000, id_number: '068092001122' }
    ],
    booking_trips: [
      {
        id: 'bt2',
        booking_id: '2',
        trip_id: 't2',
        departure_time: '2026-08-15 08:00',
        origin_location: { id: 'loc3', name: 'Bến Hà Tiên', code: 'HT', city: 'Hà Tiên', is_active: true },
        destination_location: { id: 'loc2', name: 'Bến Phú Quốc (Bãi Vòng)', code: 'PQ', city: 'Phú Quốc', is_active: true }
      }
    ],
    created_at: '2026-08-10 09:15'
  },
  {
    id: '3',
    booking_code: 'BK-99203',
    status: 'confirmed',
    payment_status: 'paid',
    total_amount: 1240000,
    discount_amount: 100000,
    final_amount: 1140000,
    booker: {
      name: 'Phạm Hoàng Nam',
      phone: '0988.555.444',
      email: 'nam.pham@tech.vn',
      id_card: '001095003344'
    },
    travelers: [
      { full_name: 'Phạm Hoàng Nam', traveler_type_id: '1', seat_code: 'VIP-01', price: 620000 },
      { full_name: 'Vũ Ngọc Anh', traveler_type_id: '1', seat_code: 'VIP-02', price: 620000 }
    ],
    booking_trips: [
      {
        id: 'bt3',
        booking_id: '3',
        trip_id: 't3',
        departure_time: '2026-08-16 09:00',
        origin_location: { id: 'loc4', name: 'Bến Trần Đề (Sóc Trăng)', code: 'TD', city: 'Sóc Trăng', is_active: true },
        destination_location: { id: 'loc5', name: 'Bến Côn Đảo (Bến Đầm)', code: 'CD', city: 'Bà Rịa - Vũng Tàu', is_active: true }
      }
    ],
    created_at: '2026-08-09 14:20'
  },
  {
    id: '4',
    booking_code: 'BK-99204',
    status: 'cancelled',
    payment_status: 'refunded',
    total_amount: 500000,
    discount_amount: 0,
    final_amount: 500000,
    booker: {
      name: 'Đặng Minh Đức',
      phone: '0933.444.111',
      email: 'duc.dang@gmail.com'
    },
    travelers: [
      { full_name: 'Đặng Minh Đức', traveler_type_id: '1', seat_code: 'C08', price: 250000 },
      { full_name: 'Đặng Bảo Lâm', traveler_type_id: '2', seat_code: 'C09', price: 250000 }
    ],
    booking_trips: [
      {
        id: 'bt4',
        booking_id: '4',
        trip_id: 't1',
        departure_time: '2026-08-14 13:00',
        origin_location: { id: 'loc1', name: 'Bến Rạch Giá', code: 'RG', city: 'Kiên Giang', is_active: true },
        destination_location: { id: 'loc6', name: 'Bến Nam Du', code: 'ND', city: 'Kiên Giang', is_active: true }
      }
    ],
    created_at: '2026-08-08 11:05'
  }
];

function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const res = await getBookings();
        if (isMounted && res && res.data && res.data.length > 0) {
          setBookings(res.data);
        }
      } catch (err: any) {
        console.error('Failed to fetch bookings:', err);
        toast.error('Không thể kết nối API đơn đặt vé. Đang hiển thị dữ liệu dự phòng.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      (b.booking_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.booker?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.booker?.phone || '').includes(searchTerm);

    const matchesPayment = paymentFilter === 'all' || b.payment_status === paymentFilter;
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;

    return matchesSearch && matchesPayment && matchesStatus;
  });

  const handleDelete = (id: string, code: string) => {
    if (confirm(`Bạn có chắc muốn hủy/xóa đơn đặt vé ${code}?`)) {
      setBookings((prev) => prev.filter((item) => item.id !== id));
      toast.success(`Đã hủy thành công đơn vé ${code}`);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  // Stats calculation
  const totalBookings = bookings.length;
  const paidCount = bookings.filter((b) => b.payment_status === 'paid').length;
  const totalRevenue = bookings
    .filter((b) => b.payment_status === 'paid')
    .reduce((sum, b) => sum + (b.final_amount || 0), 0);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
              Quản Lý Đơn Đặt Vé Tàu
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live API Backend
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Tra cứu, đặt vé trực tiếp, kiểm tra thanh toán và thông tin hành khách Superdong</p>
        </div>
        <Link
          to={'/bookings/create' as any}
          className="h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <Plus size={16} /> Tạo Đơn Vé Mới
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600">
            <ShoppingCart size={22} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Tổng Đơn Đặt Vé</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{totalBookings} đơn</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Đã Thanh Toán</div>
            <div className="text-xl font-bold text-emerald-600">{paidCount} đơn vé</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600">
            <CreditCard size={22} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Doanh Thu Thu Được</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalRevenue)}</div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo Mã đơn (BK-...), tên khách, hoặc số điện thoại..."
              className="w-full h-10 pl-9 pr-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-400" />
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 outline-none cursor-pointer"
              >
                <option value="all">Tất cả thanh toán</option>
                <option value="paid">Đã thanh toán</option>
                <option value="unpaid">Chưa thanh toán</option>
                <option value="refunded">Đã hoàn tiền</option>
              </select>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 outline-none cursor-pointer"
            >
              <option value="all">Tất cả trạng thái đơn</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="pending">Chờ xử lý</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Data Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">Mã Đơn Vé</th>
                <th className="p-4">Người Đặt Vé</th>
                <th className="p-4">Chuyến &amp; Hành Trình</th>
                <th className="p-4">Số Ghế / Vé</th>
                <th className="p-4">Thành Tiền</th>
                <th className="p-4">Thanh Toán</th>
                <th className="p-4">Trạng Thái</th>
                <th className="p-4 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Không tìm thấy đơn đặt vé phù hợp điều kiện lọc.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const tripInfo = b.booking_trips?.[0];
                  return (
                    <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-bold text-blue-600 dark:text-blue-400 font-mono">
                        {b.booking_code}
                        {b.coupon_code && (
                          <span className="block text-[11px] text-amber-600 dark:text-amber-400 font-sans font-medium mt-0.5">
                            Mã: {b.coupon_code}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{b.booker.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone size={12} /> {b.booker.phone}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {tripInfo?.origin_location?.name || 'Bến đi'} ➔ {tripInfo?.destination_location?.name || 'Bến đến'}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar size={12} /> {tripInfo?.departure_time}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {b.travelers.length} vé
                        </span>
                        <div className="text-xs text-slate-500 font-mono">
                          Ghế: {b.travelers.map((t) => t.seat_code).join(', ')}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-extrabold text-slate-900 dark:text-white">
                          {formatCurrency(b.final_amount)}
                        </div>
                        {b.discount_amount && b.discount_amount > 0 ? (
                          <div className="text-[11px] text-emerald-600 line-through">
                            {formatCurrency(b.total_amount)}
                          </div>
                        ) : null}
                      </td>
                      <td className="p-4">
                        {b.payment_status === 'paid' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 size={12} /> Đã thanh toán
                          </span>
                        )}
                        {b.payment_status === 'unpaid' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <Clock size={12} /> Chưa thanh toán
                          </span>
                        )}
                        {b.payment_status === 'refunded' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            <RefreshCw size={12} /> Đã hoàn tiền
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {b.status === 'confirmed' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500 text-white">
                            Xác nhận
                          </span>
                        )}
                        {b.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500 text-white">
                            Chờ xử lý
                          </span>
                        )}
                        {b.status === 'cancelled' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500 text-white">
                            Đã hủy
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-1">
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="p-1.5 inline-flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                          title="Xem chi tiết đơn vé"
                        >
                          <Eye size={16} />
                        </button>
                        <Link
                          to={'/bookings/$bookingId/edit' as any}
                          params={{ bookingId: b.id } as any}
                          className="p-1.5 inline-flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 cursor-pointer"
                          title="Chỉnh sửa đơn vé"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(String(b.id), b.booking_code)}
                          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-500 hover:text-rose-600 cursor-pointer"
                          title="Hủy đơn vé"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <FileText className="text-blue-600" size={20} />
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                  Chi Tiết Đơn Vé: <span className="font-mono text-blue-600">{selectedBooking.booking_code}</span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto font-sans">
              {/* Booker Info */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700/60">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <User size={14} /> Thông tin người đại diện đặt vé
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500 block text-xs">Họ và tên:</span>
                    <strong className="text-slate-900 dark:text-white">{selectedBooking.booker.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Số điện thoại:</span>
                    <strong className="text-slate-900 dark:text-white">{selectedBooking.booker.phone}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Email:</span>
                    <span className="text-slate-800 dark:text-slate-200">{selectedBooking.booker.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Số CMND/CCCD:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">{selectedBooking.booker.id_card || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Trip details */}
              <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-900/30">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-1.5">
                  <Ship size={14} /> Thông tin Hải trình & Chuyến đi
                </h4>
                {selectedBooking.booking_trips?.[0] && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 dark:text-white text-base">
                        {selectedBooking.booking_trips[0].origin_location?.name} ➔ {selectedBooking.booking_trips[0].destination_location?.name}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                      <Calendar size={14} /> Khởi hành: <strong>{selectedBooking.booking_trips[0].departure_time}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Traveler List */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Danh sách hành khách &amp; Ghế ({selectedBooking.travelers.length})
                </h4>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-400">
                      <tr>
                        <th className="p-3">STT</th>
                        <th className="p-3">Họ và tên</th>
                        <th className="p-3">Số CCCD</th>
                        <th className="p-3">Mã ghế</th>
                        <th className="p-3 text-right">Giá vé</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedBooking.travelers.map((t, idx) => (
                        <tr key={idx}>
                          <td className="p-3 text-slate-400">{idx + 1}</td>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">{t.full_name}</td>
                          <td className="p-3 font-mono text-slate-500">{t.id_number || 'N/A'}</td>
                          <td className="p-3 font-mono font-bold text-blue-600">{t.seat_code}</td>
                          <td className="p-3 text-right font-bold">{formatCurrency(t.price || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <div className="text-xs text-slate-500">Trạng thái thanh toán:</div>
                  <span className="font-bold text-emerald-600 capitalize">{selectedBooking.payment_status}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Tổng cộng thanh toán:</div>
                  <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                    {formatCurrency(selectedBooking.final_amount)}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => {
                  toast.success(`Đã in vé cho đơn ${selectedBooking.booking_code}`);
                }}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold text-xs flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Printer size={14} /> In Vé
              </button>
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-5 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
