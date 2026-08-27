import React, { useState, useEffect, useMemo } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  CreditCard,
  Banknote,
  RefreshCw,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Payment } from '@/types';
import { getPayments, confirmOfficePayment, reconcilePaymentAttempt } from '@/apis/payments';
import { Button } from '@/components/common/Button';
import { AdminTablePage, ColumnDef, FilterOption } from '@/components/common/TableUtilities';
import { Badge } from '@/components/common/Badge';

export interface PaymentsSearch {
  page?: number;
  search?: string;
  method?: string;
  status?: string;
}

export const Route = createFileRoute('/_admin/payments/')({
  validateSearch: (search: Record<string, unknown>): PaymentsSearch => {
    const result: PaymentsSearch = {};
    if (Number(search?.page) > 1) result.page = Number(search.page);
    if (typeof search?.search === 'string' && search.search.trim()) result.search = search.search.trim();
    if (typeof search?.method === 'string' && search.method !== 'all') result.method = search.method;
    if (typeof search?.status === 'string' && search.status !== 'all') result.status = search.status;
    return result;
  },
  component: PaymentsPage,
});

const statusOptions: FilterOption[] = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'completed', label: 'Thành công (Completed)' },
  { value: 'pending', label: 'Chờ đối soát (Pending)' },
  { value: 'failed', label: 'Thất bại / Hủy (Failed)' },
];

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
};

function PaymentsPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const searchParams = Route.useSearch();

  const currentPage = searchParams.page || 1;
  const searchTerm = searchParams.search || '';
  const statusFilter = searchParams.status || 'all';

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Cash Collection Modal State
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashBookingCode, setCashBookingCode] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [collecting, setCollecting] = useState(false);

  const fetchPaymentsData = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await getPayments();
      if (res && res.data && Array.isArray(res.data)) {
        setPayments(res.data);
      } else {
        setPayments([]);
      }
    } catch (err: any) {
      console.error('Fetch payments error:', err);
      setPayments([]);
      setApiError(err?.response?.data?.message || err?.message || 'Không thể kết nối với Backend API');
      toast.error('Không thể lấy dữ liệu giao dịch thanh toán từ Backend API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentsData();
  }, []);

  const handleConfirmCash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashBookingCode.trim() || !cashAmount) {
      toast.error('Vui lòng nhập Mã đơn vé và Số tiền thu quầy');
      return;
    }

    setCollecting(true);
    try {
      await confirmOfficePayment({
        booking_code: cashBookingCode.trim(),
        amount: Number(cashAmount),
        counter_location: 'Bến Rạch Giá - Quầy 01',
      });
      toast.success(`Xác nhận thu ${formatCurrency(Number(cashAmount))} cho đơn vé ${cashBookingCode} thành công!`);

      setCashBookingCode('');
      setCashAmount('');
      setShowCashModal(false);
      fetchPaymentsData();
    } catch (err: any) {
      toast.error(`Lỗi ghi nhận thu quầy: ${err?.response?.data?.message || err?.message || 'Không thể thực hiện'}`);
    } finally {
      setCollecting(false);
    }
  };

  const handleReconcile = async (paymentId: string | number) => {
    try {
      await reconcilePaymentAttempt(paymentId);
      toast.success(`Đã thực hiện đối soát tự động thành công cho giao dịch ${paymentId}`);
      fetchPaymentsData();
    } catch (err: any) {
      toast.error(`Lỗi đối soát: ${err?.message || 'Không thể đối soát'}`);
    }
  };

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

  const handleStatusFilterChange = (value: string) => {
    navigate({
      search: (prev: any) => {
        const next: any = { ...prev };
        if (value && value !== 'all') {
          next.status = value;
        } else {
          delete next.status;
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

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        String(p.id).toLowerCase().includes(q) ||
        (p.booking_code || '').toLowerCase().includes(q) ||
        (p.transaction_reference && p.transaction_reference.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [payments, searchTerm, statusFilter]);

  const columns: ColumnDef<Payment>[] = [
    {
      key: 'id',
      label: 'MÃ GIAO DỊCH',
      sortable: true,
      render: (p) => (
        <div className="flex items-center gap-2">
          <CreditCard size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="font-mono font-bold text-slate-900 dark:text-slate-100">TX-{p.id}</span>
        </div>
      ),
    },
    {
      key: 'booking_code',
      label: 'MÃ ĐƠN VÉ',
      sortable: true,
      render: (p) => (
        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{p.booking_code || '--'}</span>
      ),
    },
    {
      key: 'amount',
      label: 'SỐ TIỀN',
      sortable: true,
      render: (p) => (
        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(p.amount || 0)}
        </span>
      ),
    },
    {
      key: 'payment_method',
      label: 'PHƯƠNG THỨC',
      sortable: true,
      render: (p) => {
        if (p.payment_method === 'counter_cash') {
          return (
            <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 text-[11px]">
              <Banknote size={13} className="text-amber-600" /> Tiền mặt quầy
            </span>
          );
        }
        if (p.payment_method === 'vnpay') {
          return (
            <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800 text-[11px]">
              VNPAY QR
            </span>
          );
        }
        return (
          <span className="font-medium text-slate-600 dark:text-slate-400 text-xs">
            {p.payment_method || 'Khác'}
          </span>
        );
      },
    },
    {
      key: 'transaction_reference',
      label: 'MÃ REF THAM CHIẾU',
      render: (p) => (
        <span className="font-mono text-xs text-slate-500">{p.transaction_reference || '--'}</span>
      ),
    },
    {
      key: 'created_at',
      label: 'THỜI GIAN',
      sortable: true,
      render: (p) => (
        <span className="text-xs text-slate-500">
          {p.created_at ? p.created_at.substring(0, 16).replace('T', ' ') : '--'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'TRẠNG THÁI',
      sortable: true,
      render: (p) => {
        if (p.status === 'completed' || p.status === 'success') {
          return (
            <Badge variant="success" className="gap-1 text-[11px] font-semibold">
              <CheckCircle2 size={12} /> Thành công
            </Badge>
          );
        }
        if (p.status === 'pending') {
          return (
            <Badge variant="warning" className="gap-1 text-[11px] font-semibold">
              <Clock size={12} /> Chờ đối soát
            </Badge>
          );
        }
        return (
          <Badge variant="danger" className="gap-1 text-[11px] font-semibold">
            <XCircle size={12} /> Thất bại
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      label: 'ĐỐI SOÁT',
      align: 'right',
      render: (p) => (
        <>
          {p.status === 'pending' && (
            <Button
              size="xs"
              variant="outline"
              onClick={() => handleReconcile(p.id)}
              className="h-7 px-2.5 text-xs font-semibold text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              Đối soát
            </Button>
          )}
        </>
      ),
    },
  ];

  return (
    <>
      <AdminTablePage
        title="Thu Quầy & Giao Dịch Thanh Toán"
        subtitle="Theo dõi nhật ký giao dịch thanh toán trực tuyến, quét mã QR và thu tiền mặt tại quầy vé"
        icon={CreditCard}
        apiError={apiError}
        searchValue={searchTerm}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Tìm theo Mã GD, Mã đơn vé, Ref..."
        filterValue={statusFilter}
        onFilterChange={handleStatusFilterChange}
        filterOptions={statusOptions}
        columns={columns}
        columnStorageKey="superdong_payments_columns"
        onRefresh={fetchPaymentsData}
        refreshing={loading}
        onCreateClick={() => setShowCashModal(true)}
        createLabel="Thu Tiền Mặt Quầy"
        data={filteredPayments}
        loading={loading}
        emptyText={apiError ? '⚠️ Không thể lấy dữ liệu từ Backend API.' : 'Chưa có giao dịch thanh toán nào phù hợp.'}
        keyExtractor={(p) => String(p.id)}
        entityLabel="giao dịch"
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />

      {/* Cash Collection Modal */}
      {showCashModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 font-sans">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-500/10 text-amber-600 rounded-lg">
                  <Banknote size={18} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Ghi Nhận Thu Tiền Mặt Tại Quầy
                </h3>
              </div>
              <button
                onClick={() => setShowCashModal(false)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleConfirmCash} className="p-6 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Mã Đơn Vé Tàu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={cashBookingCode}
                  onChange={(e) => setCashBookingCode(e.target.value)}
                  placeholder="VD: SD20260827..."
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-mono text-xs outline-none focus:border-blue-500"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Số Tiền Thực Thu (VND) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder="VD: 340000"
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-mono text-xs outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCashModal(false)}
                  className="text-xs rounded-lg"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={collecting}
                  className="text-xs rounded-lg gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700"
                >
                  {collecting ? <RefreshCw size={14} className="animate-spin" /> : <DollarSign size={14} />}
                  Xác Nhận Thu Tiền
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

