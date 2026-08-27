import { UnsavedChangesBar } from '@/components/common/UnsavedChangesBar';
import { useFormDirty } from '@/components/common/FormUtilities';
import React, { useState, useEffect } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { Ticket, ArrowLeft, Save, RefreshCw, Loader2 } from 'lucide-react';
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

  const draftKey = `superdong_coupon_draft_edit_${couponId}`;

  const [expectedVersion, setExpectedVersion] = useState<number>(1);

  // NO FAKE FALLBACK DATA IN INITIAL STATE (Rule 10 SKILL.md)
  const [initialData, setInitialData] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'percentage',
    value: 0,
    min_booking_amount: 0,
    max_discount_amount: 0,
    usage_limit: 0,
    valid_from: '',
    valid_until: '',
    is_active: true,
    reason: '',
  });

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isDirty } = useFormDirty(initialData, formData, ['reason', 'notes', 'expected_version']);

  // HYDRATE REAL COUPON DETAILS + F5 DRAFT PERSISTENCE (Rule 6 & 10)
  useEffect(() => {
    let isMounted = true;
    const fetchCoupon = async () => {
      setLoading(true);
      setFetchError(null);
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

        // If direct fetch failed, search in list fallback
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

        if (isMounted) {
          if (c) {
            const ver = c.version !== undefined ? c.version : (c.expected_version !== undefined ? c.expected_version : 0);
            setExpectedVersion(ver);

            const serverData = {
              code: c.code || '',
              name: c.name || '',
              type: c.discount_type === 'fixed_amount' || c.type === 'fixed_amount' ? 'fixed_amount' : 'percentage',
              value: c.discount_value !== undefined ? c.discount_value : (c.value !== undefined ? c.value : 0),
              min_booking_amount: c.min_booking_amount !== undefined ? c.min_booking_amount : (c.min_booking_amount_vnd || 0),
              max_discount_amount: c.max_discount_amount !== undefined ? c.max_discount_amount : 0,
              usage_limit: c.usage_limit !== undefined ? c.usage_limit : 0,
              valid_from: c.effective_from ? c.effective_from.split('T')[0] : (c.valid_from ? c.valid_from.split('T')[0] : ''),
              valid_until: c.effective_to ? c.effective_to.split('T')[0] : (c.valid_until ? c.valid_until.split('T')[0] : ''),
              is_active: c.status ? c.status === 'active' : Boolean(c.is_active),
              reason: c.reason || '',
            };

            // Recover F5 draft if user was editing
            let finalData = serverData;
            try {
              const draftStr = localStorage.getItem(draftKey);
              if (draftStr) {
                finalData = { ...serverData, ...JSON.parse(draftStr) };
              }
            } catch (_) {}

            setInitialData(serverData);
            setFormData(finalData);
          } else {
            setFetchError('Không tìm thấy dữ liệu Mã khuyến mãi từ Backend API.');
          }
        }
      } catch (err: any) {
        console.warn('Fetch coupon error:', err);
        if (isMounted) {
          setFetchError('Không thể nạp thông tin Mã khuyến mãi. Dữ liệu có thể đã bị xóa.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (couponId) {
      fetchCoupon();
    }
    

  return () => { isMounted = false; };
  }, [couponId, draftKey]);

  // Auto save draft when user edits form (Rule 6)
  useEffect(() => {
    if (!loading && !fetchError && formData.code) {
      try {
        localStorage.setItem(draftKey, JSON.stringify(formData));
      } catch (_) {}
    }
  }, [formData, loading, fetchError, draftKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.code.trim()) {
      toast.error('Vui lòng nhập Mã khuyến mãi!');
      return;
    }

    if (/[^A-Z0-9_-]/.test(formData.code)) {
      toast.error('Mã khuyến mãi chỉ được chứa chữ cái, chữ số, dấu gạch ngang (-) và gạch dưới (_), không chứa khoảng trắng!');
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

      await updateCoupon(couponId, payload as any);

      // Clear F5 draft on successful save (Rule 6)
      try {
        localStorage.removeItem(draftKey);
      } catch (_) {}

      toast.success(`Đã lưu thay đổi mã khuyến mãi ${formData.code} thành công!`);
      navigate({ to: '/coupons' as any });
    } catch (err: any) {
      console.error('Failed to update coupon:', err);
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message || err?.message || '';

      if (status === 409 || serverMsg.includes('Xung đột phiên bản') || serverMsg.includes('version')) {
        toast.warning('Dữ liệu đã được cập nhật bởi một phiên thao tác khác. Đang tự động tải lại dữ liệu mới nhất...', { duration: 4000 });
        try {
          const fresh = await findCouponById(couponId);
          if (fresh && fresh.data) {
            const ver = (fresh.data as any).version !== undefined ? (fresh.data as any).version : 0;
            setExpectedVersion(ver);
          }
        } catch (_) {}
      } else {
        toast.error(serverMsg || 'Có lỗi xảy ra khi cập nhật mã khuyến mãi');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 w-full flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <span className="text-sm font-medium text-slate-500">Đang tải thông tin mã khuyến mãi...</span>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium">
          {fetchError}
        </div>
        <Button variant="outline" asChild>
          <Link to={'/coupons' as any}>Quay lại danh sách Mã khuyến mãi</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full font-sans pb-10 text-slate-800 dark:text-slate-200">
      {/* Top Header Navigation Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Button variant="light" size="icon" className="h-8 w-8" asChild>
            <Link to={'/coupons' as any} title="Quay lại danh sách">
              <ArrowLeft size={16} />
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Ticket className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Chỉnh sửa mã khuyến mãi: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{formData.code || couponId}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Mã quản lý hệ thống: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">#{couponId}</span>
            </p>
          </div>
        </div>

        <div>
          {formData.is_active ? (
            <Badge variant="success" className="px-3 py-1 text-xs">
              Kích hoạt
            </Badge>
          ) : (
            <Badge variant="danger" className="px-3 py-1 text-xs">
              Đã khóa
            </Badge>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-5">
        
        {/* SECTION 1: THÔNG TIN CƠ BẢN */}
        <div className="space-y-3">
          <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-3.5 py-2 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wide border border-blue-100 dark:border-slate-800">
            I. Thông tin cơ bản
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <Label htmlFor="coupon-code" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Mã Khuyến Mãi (Code) <span className="text-rose-500 font-bold">*</span>
              </Label>
              <Input
                id="coupon-code"
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="VD: SUMMER2026"
                className="text-sm font-mono font-bold uppercase h-9 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="coupon-name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tên Chương Trình / Ưu Đãi
              </Label>
              <Input
                id="coupon-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Giảm 15% Mùa Hè 2026"
                className="text-sm h-9 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: MỨC GIẢM GIÁ & ĐIỀU KIỆN ÁP DỤNG */}
        <div className="space-y-3">
          <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-3.5 py-2 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wide border border-blue-100 dark:border-slate-800">
            II. Mức giảm giá &amp; Điều kiện áp dụng
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="space-y-1">
              <Label htmlFor="coupon-type" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Loại Giảm Giá <span className="text-rose-500 font-bold">*</span>
              </Label>
              <select
                id="coupon-type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full text-sm h-9 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
              >
                <option value="percentage">Theo Phần Trăm (%)</option>
                <option value="fixed_amount">Theo Số Tiền Cố Định (VNĐ)</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="coupon-value" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Giá Trị Giảm <span className="text-rose-500 font-bold">*</span>
              </Label>
              <Input
                id="coupon-value"
                type="number"
                min={0}
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: Math.max(0, Number(e.target.value)) })}
                placeholder={formData.type === 'percentage' ? 'VD: 15' : 'VD: 50000'}
                className="text-sm h-9 font-mono rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="coupon-min-amount" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Đơn Hàng Tối Thiểu (VNĐ)
              </Label>
              <Input
                id="coupon-min-amount"
                type="number"
                min={0}
                value={formData.min_booking_amount}
                onChange={(e) => setFormData({ ...formData, min_booking_amount: Math.max(0, Number(e.target.value)) })}
                placeholder="VD: 500000"
                className="text-sm h-9 font-mono rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: THỜI HẠN & GIỚI HẠN SỬ DỤNG */}
        <div className="space-y-3">
          <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-3.5 py-2 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wide border border-blue-100 dark:border-slate-800">
            III. Thời hạn &amp; Giới hạn sử dụng
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="space-y-1">
              <Label htmlFor="coupon-valid-from" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ngày Bắt Đầu Áp Dụng
              </Label>
              <DateBox
                id="coupon-valid-from"
                value={formData.valid_from}
                onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="coupon-valid-until" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ngày Kết Thúc Hạn
              </Label>
              <DateBox
                id="coupon-valid-until"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="coupon-usage-limit" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Giới Hạn Số Lượt Sử Dụng <span className="text-slate-400 font-normal">(0 = không giới hạn)</span>
              </Label>
              <Input
                id="coupon-usage-limit"
                type="number"
                min={0}
                value={formData.usage_limit}
                onChange={(e) => setFormData({ ...formData, usage_limit: Math.max(0, Number(e.target.value)) })}
                placeholder="0"
                className="text-sm h-9 font-mono rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: TRẠNG THÁI & GHI CHÚ */}
        <div className="space-y-3">
          <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-3.5 py-2 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wide border border-blue-100 dark:border-slate-800">
            IV. Trạng thái &amp; Ghi chú
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                id="coupon-status"
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <Label htmlFor="coupon-status" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                Kích hoạt mã khuyến mãi hoạt động
              </Label>
            </div>

            <div className="space-y-1">
              <Label htmlFor="coupon-reason" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Lý Do / Ghi Chú Thay Đổi <span className="text-slate-400 font-normal">(Không bắt buộc)</span>
              </Label>
              <textarea
                id="coupon-reason"
                rows={2}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Nhập lý do điều chỉnh chương trình khuyến mãi..."
                className="w-full text-sm p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              try {
                localStorage.removeItem(draftKey);
              } catch (_) {}
              navigate({ to: '/coupons' as any });
            }}
          >
            Hủy Bỏ
          </Button>

          <Button type="submit" disabled={isSubmitting} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold">
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Đang lưu...
              </>
            ) : (
              <>
                <Save size={16} /> Lưu Thay Đổi
              </>
            )}
          </Button>
        </div>
      </form>

      <UnsavedChangesBar isDirty={isDirty} isSaving={isSubmitting} onSave={() => handleSubmit({ preventDefault: () => {} } as any)} onReset={() => { if (initialData) setFormData(initialData); }} />
    </div>
  );
}
