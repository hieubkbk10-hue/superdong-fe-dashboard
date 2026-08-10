import React, { useState, useEffect } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { Ticket, ArrowLeft, Save, RefreshCw, Percent, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { findCouponById, updateCoupon, getCoupons } from '@/apis/pricing';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { DateBox } from '@/components/common/DateBox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const Route = createFileRoute('/_admin/coupons/$couponId/edit')({
  component: CouponEditPage,
});

function CouponEditPage() {
  const { couponId } = Route.useParams();
  const navigate = useNavigate();

  const [expectedVersion, setExpectedVersion] = useState<number>(1);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'percentage',
    value: 15,
    min_booking_amount: 0,
    max_discount_amount: 0,
    usage_limit: 0,
    valid_from: '',
    valid_until: '',
    is_active: true,
    reason: '',
  });

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchCoupon = async () => {
      setLoading(true);
      try {
        let c: any = null;
        try {
          const res = await findCouponById(couponId);
          if (res && res.data) {
            c = res.data;
          }
        } catch (e) {
          console.warn('findCouponById error:', e);
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
            valid_from: c.effective_from ? c.effective_from.split('T')[0] : (c.valid_from ? c.valid_from.split('T')[0] : '2026-06-01'),
            valid_until: c.effective_to ? c.effective_to.split('T')[0] : (c.valid_until ? c.valid_until.split('T')[0] : '2026-08-31'),
            is_active: c.status ? c.status === 'active' : Boolean(c.is_active),
            reason: c.reason || '',
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
    if (isSubmitting) return;

    if (!formData.code.trim()) {
      toast.error('Vui lòng nhập Mã khuyến mãi!', { id: 'coupon-edit-toast' });
      return;
    }

    if (/[^A-Z0-9_-]/.test(formData.code)) {
      toast.error('Mã khuyến mãi chỉ được chứa chữ cái, chữ số, dấu gạch ngang (-) và gạch dưới (_), không chứa khoảng trắng!', { id: 'coupon-edit-toast' });
      return;
    }

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
        status: formData.is_active ? 'active' : 'inactive',
      };

      if (formData.valid_from && formData.valid_from.trim() !== '') {
        payload.effective_from = formData.valid_from;
      }
      if (formData.valid_until && formData.valid_until.trim() !== '') {
        payload.effective_to = formData.valid_until;
      }

      if (formData.reason && formData.reason.trim() !== '') {
        payload.reason = formData.reason;
      }

      if (expectedVersion !== undefined && expectedVersion !== null) {
        payload.expected_version = expectedVersion;
      }

      const res: any = await updateCoupon(couponId, payload as any);
      const updatedVersion = res?.data?.version ?? (expectedVersion !== undefined ? expectedVersion + 1 : 1);
      setExpectedVersion(updatedVersion);

      toast.success(`Đã lưu thay đổi mã khuyến mãi ${formData.code} thành công!`, { id: 'coupon-edit-toast' });

      // Refetch fresh coupon data
      if (couponId) {
        try {
          const fresh = await findCouponById(couponId);
          if (fresh && fresh.data) {
            const coupon = fresh.data;
            setFormData({
              name: coupon.name || '',
              code: coupon.code || '',
              type: coupon.discount_type === 'percentage' ? 'percentage' : 'fixed_amount',
              value: coupon.discount_value || 0,
              min_booking_amount: (coupon as any).min_booking_amount_vnd || (coupon as any).min_booking_amount || 0,
              max_discount_amount: (coupon as any).max_discount_amount_vnd || (coupon as any).max_discount_amount || 0,
              usage_limit: coupon.usage_limit || 0,
              valid_from: coupon.effective_from ? coupon.effective_from.split('T')[0] : '',
              valid_until: coupon.effective_to ? coupon.effective_to.split('T')[0] : '',
              is_active: coupon.status ? coupon.status === 'active' : Boolean(coupon.is_active),
              reason: '',
            });
            if ((coupon as any).version !== undefined) {
              setExpectedVersion((coupon as any).version);
            }
          }
        } catch (_) {}
      }
    } catch (err: any) {
      console.error('Failed to update coupon:', err);
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message || err?.message || '';

      if (status === 409 || serverMsg.includes('Xung đột phiên bản') || serverMsg.includes('version')) {
        toast.warning('Dữ liệu đã được cập nhật bởi một phiên thao tác khác. Đang tự động tải lại dữ liệu mới nhất...', { id: 'coupon-edit-toast', duration: 4000 });
        try {
          const fresh = await findCouponById(couponId);
          if (fresh && fresh.data) {
            const ver = (fresh.data as any).version !== undefined ? (fresh.data as any).version : 0;
            setExpectedVersion(ver);
          }
        } catch (_) {}
      } else {
        toast.error(serverMsg || 'Có lỗi xảy ra khi cập nhật mã khuyến mãi', { id: 'coupon-edit-toast' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 w-full font-sans pb-12 text-slate-800 dark:text-slate-200">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between gap-4 bg-white dark:bg-slate-950 p-4 px-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <Button variant="light" size="icon" className="h-8 w-8" asChild>
            <Link to={'/coupons' as any} title="Quay lại danh sách">
              <ArrowLeft size={16} />
            </Link>
          </Button>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Ticket className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Chỉnh sửa mã khuyến mãi: {loading ? '...' : formData.code}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              ID mã hệ thống: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{couponId}</span>
            </p>
          </div>
        </div>

        <div>
          {formData.is_active ? (
            <Badge variant="success" className="px-2.5 py-0.5 text-xs">
              <CheckCircle2 size={12} /> Kích hoạt
            </Badge>
          ) : (
            <Badge variant="danger" className="px-2.5 py-0.5 text-xs">
              Đã khóa
            </Badge>
          )}
        </div>
      </div>

      {/* SINGLE UNIFIED FORM CONTAINER */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6">
        
        {/* SECTION 1: THÔNG TIN CƠ BẢN */}
        <div className="space-y-4 pb-5 border-b border-slate-100 dark:border-slate-800/80">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Ticket className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            1. Thông Tin Cơ Bản
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="coupon-code" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                Mã Khuyến Mãi (Coupon Code) <span className="text-rose-500 font-bold">*</span>
              </Label>
              <Input
                id="coupon-code"
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                className="text-blue-600 dark:text-blue-400 font-mono font-bold text-xs uppercase h-10 rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="coupon-name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tên Chương Trình Ưu Đãi
              </Label>
              <Input
                id="coupon-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Ưu Đãi Mùa Hè 2026"
                className="text-xs h-10 rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: MỨC GIẢM & ĐIỀU KIỆN ÁP DỤNG */}
        <div className="space-y-4 pb-5 border-b border-slate-100 dark:border-slate-800/80">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Percent className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            2. Mức Giảm Giá &amp; Điều Kiện Áp Dụng
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="discount-type" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Loại Giảm Giá
              </Label>
              <select
                id="discount-type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs outline-none cursor-pointer focus:border-blue-500"
              >
                <option value="percentage">Theo Phần Trăm (%)</option>
                <option value="fixed_amount">Số Tiền Cố Định (VND)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="discount-value" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                Giá Trị Giảm Giá {formData.type === 'percentage' ? '(%)' : '(VND)'} <span className="text-rose-500 font-bold">*</span>
              </Label>
              <Input
                id="discount-value"
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                min={1}
                className="text-xs h-10 rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="min-booking" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Đơn Giá Tối Thiểu Được Áp Dụng (VND)
              </Label>
              <Input
                id="min-booking"
                type="number"
                value={formData.min_booking_amount}
                onChange={(e) => setFormData({ ...formData, min_booking_amount: Number(e.target.value) })}
                min={0}
                className="text-xs h-10 rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="max-discount" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Mức Giảm Tối Đa (VND)
              </Label>
              <Input
                id="max-discount"
                type="number"
                value={formData.max_discount_amount}
                onChange={(e) => setFormData({ ...formData, max_discount_amount: Number(e.target.value) })}
                min={0}
                className="text-xs h-10 rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: THỜI HẠN & GIỚI HẠN (USING NEWMOON-ADMIN DATEBOX) */}
        <div className="space-y-4 pb-5 border-b border-slate-100 dark:border-slate-800/80">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            3. Hạn Hiệu Lực &amp; Giới Hạn Sử Dụng
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="usage-limit" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Giới Hạn Lượt Sử Dụng
              </Label>
              <Input
                id="usage-limit"
                type="number"
                value={formData.usage_limit}
                onChange={(e) => setFormData({ ...formData, usage_limit: Number(e.target.value) })}
                min={0}
                className="text-xs h-10 rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="valid-from" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ngày Bắt Đầu Hiệu Lực
              </Label>
              <DateBox
                id="valid-from"
                value={formData.valid_from}
                onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="valid-until" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ngày Kết Thúc / Hết Hạn
              </Label>
              <DateBox
                id="valid-until"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: LÝ DO ĐIỀU CHỈNH & TRẠNG THÁI */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            4. Lịch Sử &amp; Trạng Thái Kích Hoạt
          </h2>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reason" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Lý do điều chỉnh <span className="text-slate-400 font-normal">(tùy chọn)</span>
              </Label>
              <Input
                id="reason"
                type="text"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="VD: Cập nhật tỷ lệ giảm giá theo chính sách bán hàng mới..."
                className="text-xs h-10 rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <input
                id="is-active-toggle"
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <Label htmlFor="is-active-toggle" className="text-xs font-semibold cursor-pointer text-slate-800 dark:text-slate-200">
                Kích hoạt sử dụng mã coupon
              </Label>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex justify-end gap-2.5">
          <Button variant="light" type="button" asChild>
            <Link to={'/coupons' as any}>Hủy Bỏ</Link>
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Đang Lưu...
              </>
            ) : (
              <>
                <Save size={14} />
                Lưu thay đổi
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
