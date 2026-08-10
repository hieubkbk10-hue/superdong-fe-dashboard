import React, { useState, useEffect } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  Ticket,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Tag,
  Percent,
  DollarSign,
  Calendar,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';
import { Coupon } from '@/types';
import { getCoupons, createCoupon, updateCoupon } from '@/apis/pricing';

export const Route = createFileRoute('/_admin/coupons/')({
  component: CouponsPage,
});

const INITIAL_COUPONS: Coupon[] = [
  {
    id: '1',
    code: 'SUMMER2026',
    type: 'percentage',
    value: 15,
    min_booking_amount: 500000,
    max_discount_amount: 100000,
    usage_limit: 500,
    usage_count: 142,
    valid_from: '2026-06-01',
    valid_until: '2026-08-31',
    is_active: true,
  },
  {
    id: '2',
    code: 'HELLOSUPERDONG',
    type: 'fixed_amount',
    value: 50000,
    min_booking_amount: 300000,
    max_discount_amount: 50000,
    usage_limit: 1000,
    usage_count: 489,
    valid_from: '2026-01-01',
    valid_until: '2026-12-31',
    is_active: true,
  },
  {
    id: '3',
    code: 'CONDAOVIP',
    type: 'percentage',
    value: 20,
    min_booking_amount: 1000000,
    max_discount_amount: 250000,
    usage_limit: 200,
    usage_count: 85,
    valid_from: '2026-05-01',
    valid_until: '2026-09-30',
    is_active: true,
  },
  {
    id: '4',
    code: 'TRIAN2026',
    type: 'percentage',
    value: 10,
    min_booking_amount: 0,
    max_discount_amount: 50000,
    usage_limit: 300,
    usage_count: 300,
    valid_from: '2026-03-01',
    valid_until: '2026-04-30',
    is_active: false,
  },
];

function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const res = await getCoupons();
        if (isMounted && res && res.data && res.data.length > 0) {
          setCoupons(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch coupons:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCoupons = coupons.filter((c) => {
    const matchesSearch = c.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && c.is_active) ||
      (statusFilter === 'inactive' && !c.is_active);
    return matchesSearch && matchesStatus;
  });

  const handleDelete = (id: string, code: string) => {
    if (confirm(`Bạn có chắc muốn xóa mã khuyến mãi ${code}?`)) {
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      toast.success(`Đã xóa mã khuyến mãi ${code}`);
    }
  };

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
              Mã Khuyến Mãi &amp; Voucher
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live API Backend
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý mã giảm giá, voucher khuyến mãi đặt vé tàu cao tốc Superdong
          </p>
        </div>
        <Link
          to={'/coupons/create' as any}
          className="h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <Plus size={16} /> Tạo Mã Mới
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex flex-col md:flex-row gap-3 justify-between">
        <div className="relative max-w-md w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo Mã voucher (VD: SUMMER2026)..."
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
                <th className="p-4">Loại &amp; Mức Giảm</th>
                <th className="p-4">Điều Kiện Đơn</th>
                <th className="p-4">Lượt Sử Dụng</th>
                <th className="p-4">Hạn Hiệu Lực</th>
                <th className="p-4">Trạng Thái</th>
                <th className="p-4 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Không tìm thấy mã khuyến mãi phù hợp.
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-blue-600 text-base">
                      <span className="bg-blue-50 dark:bg-blue-900/40 px-2.5 py-1 rounded-md border border-blue-200/60 dark:border-blue-800">
                        {c.code}
                      </span>
                    </td>
                    <td className="p-4">
                      {c.type === 'percentage' ? (
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                          <Percent size={15} className="text-amber-500" /> Giảm {c.value}%
                          {c.max_discount_amount ? (
                            <span className="text-xs font-normal text-slate-500">
                              (Tối đa {formatCurrency(c.max_discount_amount)})
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                          <DollarSign size={15} /> Giảm {formatCurrency(c.value)}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      {c.min_booking_amount && c.min_booking_amount > 0 ? (
                        <span>Đơn từ {formatCurrency(c.min_booking_amount)}</span>
                      ) : (
                        <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">
                          Mọi đơn hàng
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {c.usage_count} / {c.usage_limit || '∞'} lượt
                      </div>
                      {c.usage_limit ? (
                        <div className="w-24 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full"
                            style={{
                              width: `${Math.min(100, ((c.usage_count || 0) / c.usage_limit) * 100)}%`,
                            }}
                          />
                        </div>
                      ) : null}
                    </td>
                    <td className="p-4 text-xs text-slate-500 font-medium">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} /> {c.valid_from} ➔ {c.valid_until}
                      </div>
                    </td>
                    <td className="p-4">
                      {c.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 size={12} /> Đang kích hoạt
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          <XCircle size={12} /> Tạm dừng / Hết hạn
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-1">
                      <Link
                        to={'/coupons/$couponId/edit' as any}
                        params={{ couponId: c.id } as any}
                        className="p-1.5 inline-flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 cursor-pointer"
                        title="Chỉnh sửa mã coupon"
                      >
                        <Edit size={16} />
                      </Link>
                      <button
                        onClick={() => handleDelete(String(c.id), c.code)}
                        className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-500 hover:text-rose-600 cursor-pointer"
                        title="Xóa mã coupon"
                      >
                        <Trash2 size={16} />
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
