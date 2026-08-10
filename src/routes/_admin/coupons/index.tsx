import React, { useState, useEffect } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Ticket, Plus, Search, Edit, Trash2, CheckCircle2, XCircle, Percent, DollarSign, Calendar, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Coupon } from '@/types';
import { getCoupons, deleteCoupon } from '@/apis/pricing';

export const Route = createFileRoute('/_admin/coupons/')({
  component: CouponsPage,
});

function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  const fetchCoupons = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await getCoupons();
      if (res && res.data && Array.isArray(res.data)) {
        setCoupons(res.data);
      } else {
        setCoupons([]);
      }
    } catch (err: any) {
      console.error('Fetch coupons error:', err);
      setCoupons([]);
      setApiError(err?.response?.data?.message || err?.message || 'Không thể kết nối với Backend API');
      toast.error('Không thể lấy dữ liệu mã khuyến mãi từ Backend API');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCoupon = async (id: string | number, code: string) => {
    if (!window.confirm(`XÁC NHẬN XÓA CỨNG MÃ KHUYẾN MÃI: ${code}?\n\nHệ thống sẽ tự động lưu bản chụp Snapshot vào Nhật ký Kiểm toán (Audit Trail) trước khi xóa vĩnh viễn khỏi cơ sở dữ liệu.`)) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteCoupon(id);
      toast.success(`Đã xóa vĩnh viễn mã khuyến mãi ${code} thành công (Đã lưu Audit Snapshot)!`, { id: 'coupon-delete-toast' });
      await fetchCoupons();
    } catch (err: any) {
      console.error('Failed to delete coupon:', err);
      const serverMsg = err?.response?.data?.message || err?.message || '';
      toast.error(serverMsg || 'Có lỗi xảy ra khi xóa mã khuyến mãi trên Backend', { id: 'coupon-delete-toast' });
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const filteredCoupons = coupons.filter((c) => {
    const code = c.code || '';
    const matchesSearch = code.toLowerCase().includes(searchTerm.toLowerCase());
    const isActive = c.status ? c.status === 'active' : c.is_active;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && isActive) ||
      (statusFilter === 'inactive' && !isActive);
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Ticket className="h-6 w-6 text-blue-600" />
              Mã Khuyến Mãi &amp; Voucher Live
            </h1>
            {!apiError && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 size={13} /> Live API Backend
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Nối trực tiếp API endpoint `/v1/coupons` từ Server Backend Superdong
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCoupons}
            disabled={loading}
            className="h-10 px-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>
          <Link
            to={'/coupons/create' as any}
            className="h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Plus size={16} /> Tạo Mã Mới
          </Link>
        </div>
      </div>

      {/* API Error Alert */}
      {apiError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-2.5">
          <AlertTriangle size={18} className="shrink-0 text-rose-500" />
          <span>⚠️ Không thể lấy dữ liệu từ Backend API: {apiError}. Vui lòng kiểm tra lại Server Backend!</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex flex-col md:flex-row gap-3 justify-between">
        <div className="relative max-w-md w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo Mã voucher (VD: SUPERDONG2026)..."
            className="w-full h-10 pl-9 pr-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500 font-mono"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 outline-none cursor-pointer"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang kích hoạt</option>
          <option value="inactive">Đã ngừng / Hết hạn</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">Mã Coupon</th>
                <th className="p-4">Tên Chương Trình</th>
                <th className="p-4">Loại &amp; Mức Giảm</th>
                <th className="p-4">Điều Kiện Đơn</th>
                <th className="p-4">Lượt Sử Dụng</th>
                <th className="p-4">Hạn Hiệu Lực</th>
                <th className="p-4">Trạng Thái</th>
                <th className="p-4 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" />
                    Đang tải dữ liệu từ Backend API...
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    {apiError ? '⚠️ Không thể lấy dữ liệu từ Backend API.' : 'Không có mã khuyến mãi nào.'}
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((c: any) => {
                  const isActive = c.status ? c.status === 'active' : c.is_active;
                  const discountVal = c.discount_value || c.value || 0;
                  const isPercent = c.discount_type === 'percentage' || c.type === 'percentage';
                  const minBooking = c.min_booking_amount_vnd || c.min_booking_amount || 0;
                  const validFrom = c.effective_from ? c.effective_from.substring(0, 10) : (c.valid_from || '');
                  const validTo = c.effective_to ? c.effective_to.substring(0, 10) : (c.valid_until || '');

                  return (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-mono font-bold text-blue-600 text-base">
                        <span className="bg-blue-50 dark:bg-blue-900/40 px-2.5 py-1 rounded-md border border-blue-200/60 dark:border-blue-800">
                          {c.code}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-slate-900 dark:text-white">
                        {c.name || 'Mã ưu đãi'}
                      </td>
                      <td className="p-4">
                        {isPercent ? (
                          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                            <Percent size={15} className="text-amber-500" /> Giảm {discountVal}%
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                            <DollarSign size={15} /> Giảm {formatCurrency(discountVal)}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-300">
                        {minBooking > 0 ? (
                          <span>Đơn từ {formatCurrency(minBooking)}</span>
                        ) : (
                          <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">
                            Mọi đơn hàng
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {c.usage_count || 0} / {c.usage_limit || '∞'} lượt
                        </div>
                      </td>
                      <td className="p-4 text-xs text-slate-500 font-medium font-mono">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} /> {validFrom} ➔ {validTo}
                        </div>
                      </td>
                      <td className="p-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 size={12} /> Đang kích hoạt
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            <XCircle size={12} /> Hết hạn / Khóa
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-1">
                        <Link
                          to={'/coupons/$couponId/edit' as any}
                          params={{ couponId: c.id } as any}
                          className="p-1.5 inline-flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 cursor-pointer"
                          title="Chỉnh sửa mã"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() => handleDeleteCoupon(c.id, c.code || '')}
                          disabled={deletingId === c.id}
                          className="p-1.5 inline-flex items-center justify-center rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 cursor-pointer disabled:opacity-50"
                          title="Xóa vĩnh viễn (Lưu Snapshot Audit Log)"
                        >
                          {deletingId === c.id ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
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
    </div>
  );
}
