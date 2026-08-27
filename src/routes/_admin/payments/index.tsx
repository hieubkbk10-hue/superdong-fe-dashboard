import React, { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { CreditCard, Search, Banknote, RefreshCw, DollarSign, AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Payment } from '@/types';
import { getPayments, confirmOfficePayment, reconcilePaymentAttempt } from '@/apis/payments';
import { Button } from '@/components/common/Button';

export const Route = createFileRoute('/_admin/payments/')({
  component: PaymentsPage,
});

function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Office Cash Collection Input State
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
    if (!cashBookingCode || !cashAmount) {
      toast.error('Vui lòng nhập Mã đơn vé và Số tiền thu quầy');
      return;
    }

    setCollecting(true);
    try {
      await confirmOfficePayment({
        booking_code: cashBookingCode,
        amount: Number(cashAmount),
        counter_location: 'Bến Rạch Giá - Quầy 01',
      });
      toast.success(`Xác nhận thu ${formatCurrency(Number(cashAmount))} cho đơn vé ${cashBookingCode} thành công!`);

      setCashBookingCode('');
      setCashAmount('');
      fetchPaymentsData();
    } catch (err: any) {
      toast.error(`Lỗi ghi nhận thu quầy: ${err?.message || 'Không thể thực hiện'}`);
    } finally {
      setCollecting(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      String(p.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.booking_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.transaction_reference && p.transaction_reference.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesMethod = methodFilter === 'all' || p.payment_method === methodFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

    return matchesSearch && matchesMethod && matchesStatus;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
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

  return (
    <div className="space-y-5 font-sans pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Thu Quầy &amp; Giao Dịch Thanh Toán
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Theo dõi nhật ký giao dịch thanh toán trực tuyến, quét mã QR và thu tiền mặt tại quầy vé
          </p>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={fetchPaymentsData}
          disabled={loading}
          className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          title="Làm mới dữ liệu"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* API Error Alert */}
      {apiError && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-2.5">
          <AlertTriangle size={16} className="shrink-0 text-rose-500" />
          <span>{apiError} (Vui lòng kiểm tra lại kết nối Backend API)</span>
        </div>
      )}

      {/* Counter Cash Collection Panel */}
      <div className="bg-slate-900 dark:bg-slate-800 text-white rounded-2xl p-5 shadow-xs border border-slate-800/80">
        <div className="flex items-center gap-3 mb-3.5">
          <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
            <Banknote size={20} />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold">Xác Nhận Thu Tiền Vé Tại Quầy Bến Tàu</h2>
            <p className="text-[11px] text-slate-400">Nhập mã đơn vé và thu tiền mặt trực tiếp từ hành khách tại quầy bán vé</p>
          </div>
        </div>

        <form onSubmit={handleConfirmCash} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-300">Mã Đơn Vé Tàu</label>
            <input
              type="text"
              value={cashBookingCode}
              onChange={(e) => setCashBookingCode(e.target.value)}
              placeholder="VD: SD20260827..."
              className="w-full h-9 px-3 rounded-xl bg-slate-800/90 dark:bg-slate-900/90 border border-slate-700 text-white placeholder:text-slate-500 text-xs font-mono focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-300">Số Tiền Thực Thu (VND)</label>
            <input
              type="number"
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
              placeholder="VD: 340000"
              className="w-full h-9 px-3 rounded-xl bg-slate-800/90 dark:bg-slate-900/90 border border-slate-700 text-white placeholder:text-slate-500 text-xs font-mono focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </div>

          <div className="flex items-end">
            <Button
              type="submit"
              disabled={collecting}
              className="w-full h-9 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              {collecting ? <RefreshCw size={14} className="animate-spin" /> : <DollarSign size={14} />}
              Xác Nhận Thu Tiền Mặt
            </Button>
          </div>
        </form>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-3.5 shadow-xs flex flex-col md:flex-row gap-3 justify-between">
        <div className="relative w-full md:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo Mã GD, Mã đơn, Ref..."
            className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-600 font-mono transition-colors"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="w-full sm:w-auto h-9 px-3 text-xs bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 outline-none cursor-pointer focus:border-blue-600 transition-colors"
          >
            <option value="all">Tất cả phương thức</option>
            <option value="counter_cash">Tiền mặt tại quầy</option>
            <option value="vnpay">Cổng VNPAY</option>
            <option value="vietqr">Quét mã VietQR</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto h-9 px-3 text-xs bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 outline-none cursor-pointer focus:border-blue-600 transition-colors"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="completed">Thành công</option>
            <option value="pending">Chờ đối soát</option>
            <option value="failed">Thất bại / Đã hủy</option>
          </select>
        </div>
      </div>

      {/* Payments Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase border-b border-slate-200/80 dark:border-slate-800/80">
              <tr>
                <th className="py-3.5 px-4">Mã Giao Dịch</th>
                <th className="py-3.5 px-4">Mã Đơn Vé</th>
                <th className="py-3.5 px-4">Số Tiền (VND)</th>
                <th className="py-3.5 px-4">Phương Thức</th>
                <th className="py-3.5 px-4">Mã Tham Chiếu Ref</th>
                <th className="py-3.5 px-4">Thời Gian</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Đối Soát</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-500">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                    Đang tải dữ liệu giao dịch từ Backend API...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-500 dark:text-slate-400">
                    {apiError ? '⚠️ Không thể lấy dữ liệu từ Backend API.' : 'Chưa có giao dịch thanh toán nào phù hợp.'}
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">{p.id}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">{p.booking_code || '-'}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(p.amount)}</td>
                    <td className="py-3.5 px-4">
                      {p.payment_method === 'counter_cash' ? (
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                          <Banknote size={13} className="text-amber-500" /> Tiền mặt
                        </span>
                      ) : p.payment_method === 'vnpay' ? (
                        <span className="font-semibold text-blue-600 dark:text-blue-400">VNPAY</span>
                      ) : (
                        <span className="font-medium text-slate-600 dark:text-slate-400">{p.payment_method || 'Khác'}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{p.transaction_reference || '-'}</td>
                    <td className="py-3.5 px-4 text-slate-500">{p.created_at ? p.created_at.substring(0, 16).replace('T', ' ') : '-'}</td>
                    <td className="py-3.5 px-4">
                      {p.status === 'completed' ? (
                        <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-0.5 rounded-full font-semibold inline-flex items-center gap-1">
                          <CheckCircle2 size={12} /> Thành công
                        </span>
                      ) : p.status === 'pending' ? (
                        <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs px-2.5 py-0.5 rounded-full font-semibold inline-flex items-center gap-1">
                          <Clock size={12} /> Chờ đối soát
                        </span>
                      ) : (
                        <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs px-2.5 py-0.5 rounded-full font-semibold inline-flex items-center gap-1">
                          <XCircle size={12} /> Thất bại
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {p.status === 'pending' && (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleReconcile(p.id)}
                          className="h-7 px-2 text-[11px] font-medium"
                        >
                          Đối soát
                        </Button>
                      )}
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
