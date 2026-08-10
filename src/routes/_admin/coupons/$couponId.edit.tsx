import React, { useState, useEffect } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { Ticket, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { findCouponById, getCoupons, updateCoupon } from '@/apis/pricing';

export const Route = createFileRoute('/_admin/coupons/$couponId/edit')({
  component: CouponEditPage,
});

function CouponEditPage() {
  const { couponId } = Route.useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    code: 'SUMMER2026',
    name: 'Ưu đãi hè 2026',
    type: 'percentage',
    value: 15,
    min_booking_amount: 500000,
    max_discount_amount: 100000,
    usage_limit: 500,
    valid_from: '2026-06-01',
    valid_until: '2026-08-31',
    is_active: true,
    reason: 'Cập nhật thông tin mã khuyến mãi',
  });

  const [expectedVersion, setExpectedVersion] = useState<any>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchCoupon = async () => {
      setLoading(true);
      try {
        let c: any = null;

        // Try fetching coupon by direct ID
        try {
          const res = await findCouponById(couponId);
          if (res && res.data) {
            c = res.data;
          }
        } catch (err) {
          console.warn('findCouponById direct call failed, falling back to getCoupons list:', err);
        }

        // If direct fetch failed or didn't return data, search in list
        if (!c) {
          try {
            const listRes = await getCoupons();
            const items = listRes.data || (listRes as any);
            if (Array.isArray(items)) {
              c = items.find((item: any) => String(item.id) === String(couponId) || item.code === couponId);
            }
          } catch (err) {
            console.warn('getCoupons list search failed:', err);
          }
        }

        if (isMounted && c) {
          // LOGIC FIX: Do NOT use `|| 1` because version can be 0 (0 is falsy in JS!)
          const ver = c.version !== undefined ? c.version : (c.expected_version !== undefined ? c.expected_version : 0);
          setExpectedVersion(ver);

          setFormData({
            code: c.code || 'SUMMER2026',
            name: c.name || `Ưu đãi ${c.code}`,
            type: c.discount_type === 'fixed_amount' || c.type === 'fixed_amount' ? 'fixed_amount' : 'percentage',
            value: c.discount_value !== undefined ? c.discount_value : (c.value !== undefined ? c.value : 15),
            min_booking_amount: c.min_booking_amount !== undefined ? c.min_booking_amount : (c.min_booking_amount_vnd || 0),
            max_discount_amount: c.max_discount_amount !== undefined ? c.max_discount_amount : 0,
            usage_limit: c.usage_limit !== undefined ? c.usage_limit : 0,
            valid_from: c.effective_from || c.valid_from || '2026-06-01',
            valid_until: c.effective_to || c.valid_until || '2026-08-31',
            is_active: c.status === 'active' || c.is_active !== false,
            reason: c.reason || 'Cập nhật thông tin mã khuyến mãi',
          });
        }
      } catch (err: any) {
        console.warn('Fetch coupon error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (couponId) {
      fetchCoupon();
    }
    return () => { isMounted = false; };
  }, [couponId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: Record<string, any> = {
        code: formData.code.toUpperCase(),
        name: formData.name || `Ưu đãi ${formData.code.toUpperCase()}`,
        discount_type: formData.type === 'percentage' ? 'percentage' : 'fixed_amount',
        discount_value: Number(formData.value),
        min_booking_amount: Number(formData.min_booking_amount),
        max_discount_amount: Number(formData.max_discount_amount),
        usage_limit: Number(formData.usage_limit),
        effective_from: formData.valid_from,
        effective_to: formData.valid_until,
        status: formData.is_active ? 'active' : 'inactive',
        reason: formData.reason || 'Cập nhật thông tin mã khuyến mãi',
      };

      // LOGIC FIX: Send expected_version accurately without falsy fallback
      if (expectedVersion !== undefined && expectedVersion !== null) {
        payload.expected_version = expectedVersion;
        payload.version = expectedVersion;
      }

      const res: any = await updateCoupon(couponId, payload as any);
      if (res && res.data && res.data.version !== undefined) {
        setExpectedVersion(res.data.version);
      } else {
        setExpectedVersion((prev: number) => Number(prev) + 1);
      }
      toast.success(`Đã cập nhật thay đổi mã khuyến mãi ${formData.code}`);
      navigate({ to: '/coupons' as any });
    } catch (err: any) {
      console.error('Failed to update coupon:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi cập nhật mã khuyến mãi trên Backend Server');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl font-sans pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to={'/coupons' as any}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          title="Quay lại danh sách"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Ticket className="h-6 w-6 text-blue-600" />
            Chỉnh Sửa Mã Khuyến Mãi: {loading ? '...' : formData.code}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ID mã trong hệ thống: <span className="font-mono">{couponId}</span> (Phiên bản: <span className="font-mono">{String(expectedVersion)}</span>)
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Mã Khuyến Mãi (Coupon Code) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-blue-600 font-mono font-bold text-sm outline-none focus:border-blue-500 uppercase"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Loại Giảm Giá
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none cursor-pointer"
            >
              <option value="percentage">Theo Phần Trăm (%)</option>
              <option value="fixed_amount">Số Tiền Cố Định (VND)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Giá Trị Giảm Giá {formData.type === 'percentage' ? '(%)' : '(VND)'} <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Đơn Giá Tối Thiểu Được Áp Dụng (VND)
            </label>
            <input
              type="number"
              value={formData.min_booking_amount}
              onChange={(e) => setFormData({ ...formData, min_booking_amount: Number(e.target.value) })}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500"
            />
          </div>

          {formData.type === 'percentage' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Mức Giảm Tối Đa (VND)
              </label>
              <input
                type="number"
                value={formData.max_discount_amount}
                onChange={(e) => setFormData({ ...formData, max_discount_amount: Number(e.target.value) })}
                className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Giới Hạn Lượt Sử Dụng
            </label>
            <input
              type="number"
              value={formData.usage_limit}
              onChange={(e) => setFormData({ ...formData, usage_limit: Number(e.target.value) })}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Ngày Bắt Đầu Hiệu Lực
            </label>
            <input
              type="date"
              value={formData.valid_from}
              onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Ngày Kết Thúc / Hết Hạn
            </label>
            <input
              type="date"
              value={formData.valid_until}
              onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Lý Do Điều Chỉnh (Reason) <span className="text-slate-400 font-normal">(Tùy chọn)</span>
            </label>
            <input
              type="text"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="VD: Cập nhật tỷ lệ giảm giá theo chính sách bán hàng mới..."
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id="is_active_coupon_edit"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <label htmlFor="is_active_coupon_edit" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            Kích hoạt sử dụng mã coupon
          </label>
        </div>

        {/* Action buttons */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <Link
            to={'/coupons' as any}
            className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Hủy Bỏ
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save size={16} />
            {isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
          </button>
        </div>
      </form>
    </div>
  );
}
