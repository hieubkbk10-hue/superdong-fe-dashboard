import React, { useState } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { Ticket, ArrowLeft, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { createCoupon } from '@/apis/pricing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

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
    <div className="space-y-6 max-w-4xl font-sans pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="h-9 w-9" asChild>
          <Link to={'/coupons' as any} title="Quay lại danh sách">
            <ArrowLeft size={18} />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Ticket className="h-6 w-6 text-primary" />
            Tạo Mã Khuyến Mãi Mới
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Tạo chương trình ưu đãi và voucher cho khách đặt vé Superdong</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border shadow-xs">
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="coupon-code" className="text-xs font-bold text-foreground">
                  Mã Khuyến Mãi (Coupon Code) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="coupon-code"
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                  placeholder="VD: SUPERDONG2026"
                  className="text-primary font-mono font-bold text-sm uppercase"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coupon-name" className="text-xs font-bold text-foreground">
                  Tên Chương Trình (Tùy chọn)
                </Label>
                <Input
                  id="coupon-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Ưu Đãi Mùa Hè 2026"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount-type" className="text-xs font-bold text-foreground">
                  Loại Giảm Giá
                </Label>
                <select
                  id="discount-type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full h-9 px-3 border border-input rounded-md bg-background text-foreground text-sm outline-none cursor-pointer focus:ring-1 focus:ring-ring"
                >
                  <option value="percentage">Theo Phần Trăm (%)</option>
                  <option value="fixed_amount">Số Tiền Cố Định (VND)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount-value" className="text-xs font-bold text-foreground">
                  Giá Trị Giảm Giá {formData.type === 'percentage' ? '(%)' : '(VND)'} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="discount-value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                  min={1}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min-booking" className="text-xs font-bold text-foreground">
                  Đơn Giá Tối Thiểu Được Áp Dụng (VND)
                </Label>
                <Input
                  id="min-booking"
                  type="number"
                  value={formData.min_booking_amount}
                  onChange={(e) => setFormData({ ...formData, min_booking_amount: Number(e.target.value) })}
                  min={0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-discount" className="text-xs font-bold text-foreground">
                  Mức Giảm Tối Đa (VND)
                </Label>
                <Input
                  id="max-discount"
                  type="number"
                  value={formData.max_discount_amount}
                  onChange={(e) => setFormData({ ...formData, max_discount_amount: Number(e.target.value) })}
                  min={0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="usage-limit" className="text-xs font-bold text-foreground">
                  Giới Hạn Lượt Sử Dụng
                </Label>
                <Input
                  id="usage-limit"
                  type="number"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({ ...formData, usage_limit: Number(e.target.value) })}
                  min={1}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valid-from" className="text-xs font-bold text-foreground">
                  Ngày Bắt Đầu Hiệu Lực
                </Label>
                <Input
                  id="valid-from"
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="valid-until" className="text-xs font-bold text-foreground">
                  Ngày Kết Thúc / Hết Hạn
                </Label>
                <Input
                  id="valid-until"
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                id="is-active-toggle"
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-input text-primary focus:ring-ring cursor-pointer"
              />
              <Label htmlFor="is-active-toggle" className="text-sm font-semibold cursor-pointer">
                Kích hoạt sử dụng mã coupon ngay lập tức
              </Label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="outline" type="button" asChild>
                <Link to={'/coupons' as any}>Hủy Bỏ</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                {isSubmitting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Đang Lưu...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Tạo Mã Khuyến Mãi
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
