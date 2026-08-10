import React, { useState } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { Ticket, ArrowLeft, Save, RefreshCw, Percent, Calendar, FileText } from 'lucide-react';
import { toast } from 'sonner';

import { createCoupon } from '@/apis/pricing';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { DateBox } from '@/components/common/DateBox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const Route = createFileRoute('/_admin/coupons/create')({
  component: CouponCreatePage,
});

function CouponCreatePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'percentage',
    value: 15,
    min_booking_amount: 500000,
    max_discount_amount: 100000,
    usage_limit: 500,
    valid_from: '2026-08-10',
    valid_until: '2026-12-31',
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!formData.code.trim()) {
      toast.error('Vui lòng nhập Mã khuyến mãi!', { id: 'coupon-create-toast' });
      return;
    }

    if (/[^A-Z0-9_-]/.test(formData.code)) {
      toast.error('Mã khuyến mãi chỉ được chứa chữ cái, chữ số, dấu gạch ngang (-) và gạch dưới (_), không chứa khoảng trắng!', { id: 'coupon-create-toast' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, any> = {
        code: formData.code.toUpperCase(),
        name: formData.name.trim() ? formData.name.trim() : `Ưu đãi ${formData.code.toUpperCase()}`,
        discount_type: formData.type === 'percentage' ? 'percentage' : 'fixed_amount',
        discount_value: Number(formData.value),
        scope: 'booking',
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

      await createCoupon(payload as any);
      toast.success(`Đã tạo thành công mã khuyến mãi ${formData.code.toUpperCase()}`, { id: 'coupon-create-toast' });
      navigate({ to: '/coupons' as any });
    } catch (err: any) {
      console.error('Failed to create coupon:', err);
      const serverMsg = err?.response?.data?.message || err?.message || '';
      toast.error(serverMsg || 'Không thể tạo mã khuyến mãi trên Backend API', { id: 'coupon-create-toast' });
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
              Tạo mã khuyến mãi mới
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Tạo chương trình ưu đãi và voucher cho khách đặt vé Superdong
            </p>
          </div>
        </div>

        <div>
          <Badge variant="blue" className="px-2.5 py-0.5 text-xs">
            Mã mới
          </Badge>
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
                placeholder="VD: SUPERDONG2026"
                className="text-blue-600 dark:text-blue-400 font-mono font-bold text-xs uppercase h-10 rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="coupon-name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tên Chương Trình Ưu Đãi (Tùy chọn)
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
                min={1}
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

        {/* SECTION 4: TRẠNG THÁI KÍCH HOẠT */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            4. Trạng Thái Kích Hoạt
          </h2>

          <div className="flex items-center gap-3 pt-1">
            <input
              id="is-active-toggle"
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <Label htmlFor="is-active-toggle" className="text-xs font-semibold cursor-pointer text-slate-800 dark:text-slate-200">
              Kích hoạt sử dụng mã coupon ngay lập tức
            </Label>
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
                Tạo mã khuyến mãi
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
