import React, { useState, useEffect, useMemo } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Ticket, Plus, Eye, CheckCircle2, Clock, RotateCcw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { getBookings } from '@/apis/bookings';
import { Booking } from '@/types';
import { Button } from '@/components/common/Button';
import { AdminTablePage, ColumnDef, FilterOption } from '@/components/common/TableUtilities';
import { Badge } from '@/components/common/Badge';

export interface BookingsSearch {
  page?: number;
  search?: string;
  paymentStatus?: string;
}

export const Route = createFileRoute('/_admin/bookings/')({
  validateSearch: (search: Record<string, unknown>): BookingsSearch => {
    const result: BookingsSearch = {};
    if (Number(search?.page) > 1) result.page = Number(search.page);
    if (typeof search?.search === 'string' && search.search.trim()) result.search = search.search.trim();
    if (typeof search?.paymentStatus === 'string' && search.paymentStatus !== 'all') result.paymentStatus = search.paymentStatus;
    return result;
  },
  component: BookingsPage,
});

export interface BookingListItem {
  id: string;
  code: string;
  bookerName: string;
  bookerPhone: string;
  passengerCount: number;
  totalAmount: number;
  paymentStatus: 'paid' | 'unpaid' | 'refunded' | 'partially_paid' | 'cancelled' | 'expired';
  createdAt: string;
}

const paymentOptions: FilterOption[] = [
  { value: 'all', label: 'Tất cả thanh toán' },
  { value: 'paid', label: 'Đã thanh toán (Paid)' },
  { value: 'unpaid', label: 'Chờ thanh toán (Unpaid)' },
  { value: 'cancelled', label: 'Đã hủy / Hết hạn' },
  { value: 'refunded', label: 'Đã hoàn tiền (Refunded)' },
  { value: 'partially_paid', label: 'Thanh toán một phần' },
];

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
};

function BookingsPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const searchParams = Route.useSearch();

  const currentPage = searchParams.page || 1;
  const searchTerm = searchParams.search || '';
  const paymentFilter = searchParams.paymentStatus || 'all';

  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      setApiError(null);
      const res = await getBookings();
      if (res && res.data && Array.isArray(res.data)) {
        const mapped: BookingListItem[] = res.data.map((b: any) => ({
          id: String(b.id),
          code: b.booking_code || `BK-${b.id}`,
          bookerName: b.booker?.name || 'Khách hàng',
          bookerPhone: b.booker?.phone || 'Chưa cập nhật',
          passengerCount: Array.isArray(b.travelers) ? b.travelers.length : 1,
          totalAmount: b.total_amount_vnd || b.final_amount || b.total_amount || 0,
          paymentStatus: (b.state === 'confirmed' || b.state === 'completed' || b.payment_status === 'paid' || b.status === 'paid') ? 'paid' : (b.state === 'cancelled' || b.state === 'expired' ? 'cancelled' : 'unpaid'),
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

  const handleSearchChange = (value: string) => {
    navigate({
      search: (prev: any) => {
        const next: any = { ...prev };
        if (value && value.trim()) {
          next.search = value.trim();
        } else {
          delete next.search;
        }
        delete next.page;
        return next;
      },
    });
  };

  const handlePaymentFilterChange = (value: string) => {
    navigate({
      search: (prev: any) => {
        const next: any = { ...prev };
        if (value && value !== 'all') {
          next.paymentStatus = value;
        } else {
          delete next.paymentStatus;
        }
        delete next.page;
        return next;
      },
    });
  };

  const handlePageChange = (page: number) => {
    navigate({
      search: (prev: any) => {
        const next: any = { ...prev };
        if (page > 1) {
          next.page = page;
        } else {
          delete next.page;
        }
        return next;
      },
    });
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        b.code.toLowerCase().includes(q) ||
        b.bookerName.toLowerCase().includes(q) ||
        b.bookerPhone.includes(q);

      const matchesPayment = paymentFilter === 'all' || b.paymentStatus === paymentFilter;
      return matchesSearch && matchesPayment;
    });
  }, [bookings, searchTerm, paymentFilter]);

  const columns: ColumnDef<BookingListItem>[] = [
    {
      key: 'code',
      label: 'MÃ ĐẶT VÉ',
      sortable: true,
      render: (b) => (
        <div className="flex items-center gap-2">
          <Ticket size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{b.code}</span>
        </div>
      ),
    },
    {
      key: 'bookerName',
      label: 'KHÁCH HÀNG',
      sortable: true,
      render: (b) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-slate-100">{b.bookerName}</div>
          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{b.bookerPhone}</div>
        </div>
      ),
    },
    {
      key: 'passengerCount',
      label: 'SỐ VÉ',
      sortable: true,
      render: (b) => (
        <span className="font-semibold text-slate-700 dark:text-slate-300">{b.passengerCount} vé</span>
      ),
    },
    {
      key: 'totalAmount',
      label: 'TỔNG TIỀN',
      sortable: true,
      render: (b) => (
        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(b.totalAmount)}
        </span>
      ),
    },
    {
      key: 'paymentStatus',
      label: 'THANH TOÁN',
      sortable: true,
      render: (b) => {
        if (b.paymentStatus === 'paid') {
          return (
            <Badge variant="success" className="gap-1 text-[11px] font-semibold">
              <CheckCircle2 size={12} /> Đã thanh toán
            </Badge>
          );
        }
        if (b.paymentStatus === 'unpaid') {
          return (
            <Badge variant="warning" className="gap-1 text-[11px] font-semibold">
              <Clock size={12} /> Chờ thanh toán
            </Badge>
          );
        }
        if (b.paymentStatus === 'refunded') {
          return (
            <Badge variant="danger" className="gap-1 text-[11px] font-semibold">
              <RotateCcw size={12} /> Đã hoàn tiền
            </Badge>
          );
        }
        if (b.paymentStatus === 'cancelled' || b.paymentStatus === 'expired') {
          return (
            <Badge variant="danger" className="gap-1 text-[11px] font-semibold">
              <AlertTriangle size={12} /> Đã hủy / Hết hạn
            </Badge>
          );
        }
        return (
          <Badge variant="secondary" className="gap-1 text-[11px] font-semibold">
            {b.paymentStatus}
          </Badge>
        );
      },
    },
    {
      key: 'createdAt',
      label: 'NGÀY ĐẶT',
      sortable: true,
      render: (b) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">{b.createdAt || '--'}</span>
      ),
    },
    {
      key: 'actions',
      label: 'THAO TÁC',
      align: 'right',
      render: (b) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-blue-600 hover:text-blue-700 dark:text-blue-400"
          asChild
        >
          <Link
            to={'/bookings/$bookingId/edit' as any}
            params={{ bookingId: b.id } as any}
            title="Xem chi tiết và chỉnh sửa đơn vé"
          >
            <Eye size={15} />
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <AdminTablePage
      title="Quản Lý Đơn Đặt Vé"
      subtitle="Tra cứu danh sách đơn đặt vé, trạng thái thanh toán và thông tin hành khách"
      icon={Ticket}
      apiError={apiError}
      searchValue={searchTerm}
      onSearchChange={handleSearchChange}
      searchPlaceholder="Tìm theo Mã đơn, Tên khách hoặc SĐT..."
      filterValue={paymentFilter}
      onFilterChange={handlePaymentFilterChange}
      filterOptions={paymentOptions}
      columns={columns}
      columnStorageKey="superdong_bookings_columns"
      onRefresh={fetchBookings}
      refreshing={isLoading}
      createLink="/bookings/create"
      createLabel="Đặt Vé Quầy Mới"
      data={filteredBookings}
      loading={isLoading}
      emptyText={apiError ? '⚠️ Không thể lấy dữ liệu từ Backend API.' : 'Chưa có đơn đặt vé nào phù hợp.'}
      keyExtractor={(b) => b.id}
      entityLabel="đơn vé"
      currentPage={currentPage}
      onPageChange={handlePageChange}
    />
  );
}

