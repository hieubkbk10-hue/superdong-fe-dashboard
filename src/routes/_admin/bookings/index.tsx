import React, { useState, useEffect } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Ticket, Plus, Edit, Search, CheckCircle2, RefreshCw, AlertTriangle, Eye, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { getBookings } from '@/apis/bookings';
import { Booking } from '@/types';

export const Route = createFileRoute('/_admin/bookings/')({
  component: BookingsPage,
});

export interface BookingListItem {
  id: string;
  code: string;
  bookerName: string;
  bookerPhone: string;
  journey: string;
  passengerCount: number;
  totalAmount: number;
  paymentStatus: 'paid' | 'unpaid' | 'refunded' | 'partially_paid';
  createdAt: string;
}

function BookingsPage() {
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      setApiError(null);
      const res = await getBookings();
      if (res && res.data && Array.isArray(res.data)) {
        const mapped: BookingListItem[] = res.data.map((b: Booking) => ({
          id: String(b.id),
          code: b.booking_code || `BK-${b.id}`,
          bookerName: b.booker?.name || 'Khách hàng',
          bookerPhone: b.booker?.phone || 'N/A',
          journey: 'Hải trình Superdong',
          passengerCount: b.travelers?.length || 1,
          totalAmount: b.final_amount || b.total_amount || 0,
          paymentStatus: (b.payment_status as any) || (b.status === 'paid' ? 'paid' : 'unpaid'),
          createdAt: b.created_at ? b.created_at.substring(0, 10) : '',
        }));
        setBookings(mapped);
      } else {
        setBookings([]);
      }
    } catch (err: any) {
      console.error('Fetch bookings error:', err);
      setBookings([]);
      setApiError(err?.response?.data?.message || err?.message || 'Không thể kết nối với Backend API');
      toast.error('Không thể lấy dữ liệu đơn vé từ Backend API');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.bookerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.bookerPhone.includes(searchTerm);

    const matchesPayment = paymentFilter === 'all' || b.paymentStatus === paymentFilter;
    return matchesSearch && matchesPayment;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Title Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Ticket className="h-6 w-6 text-blue-600" />
              Quản lý Đơn Đặt Vé (Bookings)
            </h1>
            {!apiError && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 size={13} /> Live API Backend
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">Tra cứu danh sách đơn đặt vé, trạng thái thanh toán và hành khách</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchBookings}
            disabled={isLoading}
            className="h-10 w-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <Link
            to={'/bookings/create' as any}
            className="h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Plus size={16} /> Đặt Vé Quầy Mới
          </Link>
        </div>
      </div>

      {/* API Error Warning Alert */}
      {apiError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-2.5">
          <AlertTriangle size={18} className="shrink-0 text-rose-500" />
          <span>⚠️ Không thể lấy dữ liệu từ Backend API: {apiError}. Vui lòng kiểm tra lại Server Backend!</span>
        </div>
      )}

      {/* Search & Filters */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex flex-col md:flex-row gap-3 justify-between">
        <div className="relative max-w-md w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo Mã đặt vé, Tên khách hoặc Số điện thoại..."
            className="w-full h-10 pl-9 pr-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500 font-mono"
          />
        </div>

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 outline-none cursor-pointer"
        >
          <option value="all">Tất cả trạng thái thanh toán</option>
          <option value="paid">Đã thanh toán (Paid)</option>
          <option value="unpaid">Chưa thanh toán (Unpaid)</option>
          <option value="refunded">Đã hoàn tiền (Refunded)</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">Mã Đặt Vé</th>
                <th className="p-4">Tên Khách Hàng</th>
                <th className="p-4">Số Điện Thoại</th>
                <th className="p-4">Số Hành Khách</th>
                <th className="p-4">Tổng Tiền (VND)</th>
                <th className="p-4">Trạng Thái Thanh Toán</th>
                <th className="p-4 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" />
                    Đang tải danh sách đơn vé từ Backend API...
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    {apiError ? '⚠️ Không thể lấy dữ liệu từ Backend API.' : 'Chưa có đơn đặt vé nào.'}
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-blue-600">{b.code}</td>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">{b.bookerName}</td>
                    <td className="p-4 font-mono text-slate-600 dark:text-slate-400">{b.bookerPhone}</td>
                    <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">{b.passengerCount} vé</td>
                    <td className="p-4 font-mono font-bold text-emerald-600">{formatCurrency(b.totalAmount)}</td>
                    <td className="p-4">
                      {b.paymentStatus === 'paid' ? (
                        <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                          Đã thanh toán
                        </span>
                      ) : b.paymentStatus === 'unpaid' ? (
                        <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                          Chờ thanh toán
                        </span>
                      ) : (
                        <span className="bg-rose-500/10 text-rose-600 border border-rose-500/20 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                          Đã hoàn tiền
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-1">
                      <Link
                        to={'/bookings/$bookingId/edit' as any}
                        params={{ bookingId: b.id } as any}
                        className="p-1.5 inline-flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 cursor-pointer"
                        title="Xem chi tiết đơn vé"
                      >
                        <Eye size={16} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
