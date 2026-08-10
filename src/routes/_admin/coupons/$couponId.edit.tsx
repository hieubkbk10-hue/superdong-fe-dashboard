import React, { useState, useEffect } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { Ticket, ArrowLeft, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { findCouponById, updateCoupon, getCoupons } from '@/apis/pricing';
import { Button } from '@/components/common/Button';
import { DateBox } from '@/components/common/DateBox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

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
    <div className="space-y-6 w-full font-sans pb-12 text-slate-800 dark:text-slate-200">
      {/* Top Header Navigation Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Button variant="light" size="icon" className="h-8 w-8" asChild>
            <Link to={'/coupons' as any} title="Quay lại danh sách">
              <ArrowLeft size={16} />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Ticket className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Chỉnh sửa mã khuyến mãi: {loading ? '...' : formData.code}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ID mã hệ thống: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{couponId}</span>
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 2-COLUMN MASTER LAYOUT MATCHING NEWMOON-ADMIN UPDATE EMPLOYEE POPUP */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT 2/3 COLUMN: Main Information Sections */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Section 1: Information */}
            <div className="space-y-4">
              <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-4 py-2.5 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs flex items-center gap-2 border border-blue-100 dark:border-slate-800">
                <span className="text-blue-500 font-bold">|||</span> Thông tin cơ bản
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="coupon-code" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Mã Khuyến Mãi <span className="text-rose-500 font-bold">*</span>
                  </Label>
                  <Input
                    id="coupon-code"
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                    className="text-blue-600 dark:text-blue-400 font-mono font-bold text-xs uppercase h-10 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="coupon-name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tên Chương Trình
                  </Label>
                  <Input
                    id="coupon-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="VD: Ưu Đãi Mùa Hè 2026"
                    className="text-xs h-10 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Mức giảm & Điều kiện áp dụng */}
            <div className="space-y-4">
              <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-4 py-2.5 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs flex items-center gap-2 border border-blue-100 dark:border-slate-800">
                <span className="text-blue-500 font-bold">|||</span> Mức giảm giá &amp; Điều kiện áp dụng
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="discount-type" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Loại Giảm Giá
                  </Label>
                  <select
                    id="discount-type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs outline-none cursor-pointer focus:border-blue-500"
                  >
                    <option value="percentage">Theo Phần Trăm (%)</option>
                    <option value="fixed_amount">Số Tiền Cố Định (VND)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="discount-value" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Giá Trị Giảm <span className="text-rose-500 font-bold">*</span>
                  </Label>
                  <Input
                    id="discount-value"
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                    min={1}
                    className="text-xs h-10 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="min-booking" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Đơn Tối Thiểu (VND)
                  </Label>
                  <Input
                    id="min-booking"
                    type="number"
                    value={formData.min_booking_amount}
                    onChange={(e) => setFormData({ ...formData, min_booking_amount: Number(e.target.value) })}
                    min={0}
                    className="text-xs h-10 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    className="text-xs h-10 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="valid-from" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Ngày Bắt Đầu
                  </Label>
                  <DateBox
                    id="valid-from"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="valid-until" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Ngày Kết Thúc
                  </Label>
                  <DateBox
                    id="valid-until"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Lý do điều chỉnh */}
            <div className="space-y-4">
              <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-4 py-2.5 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs flex items-center gap-2 border border-blue-100 dark:border-slate-800">
                <span className="text-blue-500 font-bold">|||</span> Lý do điều chỉnh
              </div>
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
                  className="text-xs h-10 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>

          </div>

          {/* RIGHT 1/3 COLUMN: Status Card & Limits (Matches Newmoon-Admin Employee Right Card) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6">
              
              {/* Large Avatar / Badge Circle */}
              <div className="border-2 border-dashed border-blue-200 dark:border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center bg-blue-50/50 dark:bg-slate-900/50 gap-2">
                <div className="h-20 w-20 rounded-full bg-blue-600 text-white font-bold text-2xl flex items-center justify-center shadow-lg font-mono tracking-wider">
                  {formData.code ? formData.code.substring(0, 2).toUpperCase() : 'CP'}
                </div>
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {formData.code || 'COUPON'}
                </span>
              </div>

              {/* Status Toggle Row (Matches Status: Active toggle in Newmoon-Admin) */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Status</span>
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs font-semibold", formData.is_active ? "text-emerald-600" : "text-slate-400")}>
                    {formData.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Organizational / Rules Metadata */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                  Thông tin quản trị
                </h3>
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
                    className="text-xs h-10 rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* BOTTOM RIGHT FLOATING ACTION BAR (Exact Newmoon-Admin Button Group) */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" type="button" asChild className="px-5">
            <Link to={'/coupons' as any}>Hủy Bỏ</Link>
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="px-6 gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
          >
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
