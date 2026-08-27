import React, { useState, useEffect } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Ticket, Plus, Search, RefreshCw, AlertTriangle, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { getBookings } from '@/apis/bookings';
import { Booking } from '@/types';
import { Button } from '@/components/common/Button';

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
    <div className="space-y-5 font-sans pb-16">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Ticket className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Quản Lý Đơn Đặt Vé
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tra cứu danh sách đơn đặt vé, trạng thái thanh toán và thông tin hành khách
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchBookings}
            disabled={isLoading}
            className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </Button>

          <Button
            size="sm"
            asChild
            className="gap-1.5 h-9 px-3.5 rounded-xl text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
          >
            <Link to={'/bookings/create' as any}>
              <Plus size={15} />
              <span>Đặt Vé Quầy Mới</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* API Error Alert */}
      {apiError && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-2.5">
          <AlertTriangle size={16} className="shrink-0 text-rose-500" />
          <span>{apiError} (Vui lòng kiểm tra lại kết nối Backend API)</span>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo Mã đơn, Tên khách hoặc SĐT..."
            className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-600 font-mono transition-colors"
          />
        </div>

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="w-full sm:w-auto h-9 px-3 text-xs bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 outline-none cursor-pointer focus:border-blue-600 transition-colors"
        >
          <option value="all">Tất cả trạng thái thanh toán</option>
          <option value="paid">Đã thanh toán (Paid)</option>
          <option value="unpaid">Chờ thanh toán (Unpaid)</option>
          <option value="refunded">Đã hoàn tiền (Refunded)</option>
        </select>
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase border-b border-slate-200/80 dark:border-slate-800/80">
              <tr>
                <th className="py-3.5 px-4">Mã Đặt Vé</th>
                <th className="py-3.5 px-4">Tên Khách Hàng</th>
                <th className="py-3.5 px-4">Số Điện Thoại</th>
                <th className="py-3.5 px-4">Số Lượng</th>
                <th className="py-3.5 px-4">Tổng Tiền</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-500">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                    Đang tải danh sách đơn vé từ Backend API...
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-500 dark:text-slate-400">
                    {apiError ? '⚠️ Không thể lấy dữ liệu từ Backend API.' : 'Chưa có đơn đặt vé nào phù hợp.'}
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">{b.code}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">{b.bookerName}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">{b.bookerPhone}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">{b.passengerCount} vé</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(b.totalAmount)}</td>
                    <td className="py-3.5 px-4">
                      {b.paymentStatus === 'paid' ? (
                        <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-0.5 rounded-full font-semibold inline-block">
                          Đã thanh toán
                        </span>
                      ) : b.paymentStatus === 'unpaid' ? (
                        <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs px-2.5 py-0.5 rounded-full font-semibold inline-block">
                          Chờ thanh toán
                        </span>
                      ) : (
                        <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs px-2.5 py-0.5 rounded-full font-semibold inline-block">
                          Đã hoàn tiền
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={'/bookings/$bookingId/edit' as any}
                        params={{ bookingId: b.id } as any}
                        className="p-1.5 inline-flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 cursor-pointer transition-colors"
                        title="Xem chi tiết đơn vé"
                      >
                        <Eye size={15} />
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
