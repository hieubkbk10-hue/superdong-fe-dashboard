import React, { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { CreditCard, Search, CheckCircle2, Clock, XCircle, Banknote, QrCode, RefreshCw, DollarSign, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Payment } from '@/types';
import { getPayments, confirmOfficePayment, reconcilePaymentAttempt } from '@/apis/payments';

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
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-blue-600" />
              Thu Quầy &amp; Giao Dịch Thanh Toán Live
            </h1>
            {!apiError && (
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                <CheckCircle2 size={12} /> Live API Backend
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Nối trực tiếp API endpoint `/v1/payments` từ Server Backend Superdong
          </p>
        </div>
        <button
          onClick={fetchPaymentsData}
          disabled={loading}
          className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer shadow-xs"
          title="Làm mới dữ liệu"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* API Error Alert */}
      {apiError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-2.5">
          <AlertTriangle size={18} className="shrink-0 text-rose-500" />
          <span>⚠️ Không thể lấy dữ liệu từ Backend API: {apiError}. Vui lòng kiểm tra lại Server Backend!</span>
        </div>
      )}

      {/* Counter Cash Collection Panel */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-6 shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-white/10 rounded-xl">
            <Banknote size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold">Xác Nhận Thu Tiền Vé Tại Quầy Bến Tàu</h2>
            <p className="text-xs text-blue-100">Nhập mã đơn vé và thu tiền mặt trực tiếp từ hành khách tại quầy bán vé</p>
          </div>
        </div>

        <form onSubmit={handleConfirmCash} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-blue-100 mb-1">Mã Đơn Vé Tàu</label>
            <input
              type="text"
              value={cashBookingCode}
              onChange={(e) => setCashBookingCode(e.target.value)}
              placeholder="VD: BK-99201"
              className="w-full h-10 px-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-blue-200 text-sm font-mono focus:outline-none focus:bg-white/20"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-blue-100 mb-1">Số Tiền Thực Thu (VNĐ)</label>
            <input
              type="number"
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
              placeholder="VD: 340000"
              className="w-full h-10 px-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-blue-200 text-sm font-mono focus:outline-none focus:bg-white/20"
              required
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={collecting}
              className="w-full h-10 bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              {collecting ? <RefreshCw size={16} className="animate-spin" /> : <DollarSign size={16} />}
              Xác Nhận Đã Thu Tiền Mặt
            </button>
          </div>
        </form>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex flex-col md:flex-row gap-3 justify-between">
        <div className="relative max-w-md w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo Mã giao dịch, Mã đơn vé, Ref code..."
            className="w-full h-10 pl-9 pr-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 outline-none cursor-pointer"
          >
            <option value="all">Tất cả phương thức</option>
            <option value="counter_cash">Tiền mặt tại quầy</option>
            <option value="vnpay">Cổng VNPAY</option>
            <option value="vietqr">Quét mã VietQR</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 outline-none cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="completed">Thành công</option>
            <option value="pending">Chờ đối soát</option>
            <option value="failed">Thất bại / Đã hủy</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">Mã Giao Dịch</th>
                <th className="p-4">Mã Đơn Vé</th>
                <th className="p-4">Số Tiền Thanh Toán</th>
                <th className="p-4">Phương Thức &amp; Cổng</th>
                <th className="p-4">Mã Tham Chiếu Ref</th>
                <th className="p-4">Thời Gian</th>
                <th className="p-4">Trạng Thái</th>
                <th className="p-4 text-right">Đối Soát</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" />
                    Đang tải dữ liệu giao dịch từ Backend API...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    {apiError ? '⚠️ Không thể lấy dữ liệu từ Backend API.' : 'Không có giao dịch thanh toán nào.'}
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-blue-600">{p.id}</td>
                    <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">{p.booking_code}</td>
                    <td className="p-4 font-extrabold text-slate-900 dark:text-white font-mono text-base">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="p-4">
                      {p.payment_method === 'counter_cash' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 dark:bg-amber-900/30 text-amber-600 border border-amber-200">
                          <Banknote size={14} /> Tiền mặt quầy
                        </span>
                      )}
                      {p.payment_method === 'vnpay' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 border border-blue-200">
                          <CreditCard size={14} /> Cổng VNPAY
                        </span>
                      )}
                      {p.payment_method === 'vietqr' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 border border-emerald-200">
                          <QrCode size={14} /> Quét VietQR
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-500">{p.transaction_reference || 'N/A'}</td>
                    <td className="p-4 text-xs font-mono text-slate-500">{p.created_at}</td>
                    <td className="p-4">
                      {p.status === 'completed' || p.status === 'success' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 size={12} /> Thành công
                        </span>
                      ) : p.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          <Clock size={12} /> Chờ đối soát
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                          <XCircle size={12} /> Thất bại / Hủy
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleReconcile(p.id)}
                        className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                        title="Đối soát với cổng thanh toán"
                      >
                        <RefreshCw size={12} /> Đối Soát
                      </button>
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
