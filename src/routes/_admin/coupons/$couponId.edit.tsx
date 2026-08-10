import React, { useState, useEffect } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { Ticket, ArrowLeft, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { findCouponById, updateCoupon, getCoupons } from '@/apis/pricing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

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
            valid_from: c.effective_from ? c.effective_from.split('T')[0] : (c.valid_from ? c.valid_from.split('T')[0] : '2026-06-01'),
            valid_until: c.effective_to ? c.effective_to.split('T')[0] : (c.valid_until ? c.valid_until.split('T')[0] : '2026-08-31'),
            // LOGIC FIX: Sửa lỗi c.status !== active bị biến thành true khi c.is_active is undefined
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

      // Refetch fresh coupon data to keep form state in sync without leaving the edit page
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
            Chỉnh Sửa Mã Khuyến Mãi: {loading ? '...' : formData.code}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            ID mã trong hệ thống: <span className="font-mono">{couponId}</span>
          </p>
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
                  className="text-primary font-mono font-bold text-sm uppercase"
                  required
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
                <Label htmlFor="coupon-name" className="text-xs font-bold text-foreground">
                  Tên Chương Trình
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
                  min={0}
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

              <div className="space-y-2">
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

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="reason" className="text-xs font-bold text-foreground">
                  Lý do điều chỉnh <span className="text-muted-foreground font-normal">(nếu có)</span>
                </Label>
                <Input
                  id="reason"
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="VD: Cập nhật tỷ lệ giảm giá theo chính sách bán hàng mới..."
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
                Kích hoạt sử dụng mã coupon
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
                    Lưu Thay Đổi
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
