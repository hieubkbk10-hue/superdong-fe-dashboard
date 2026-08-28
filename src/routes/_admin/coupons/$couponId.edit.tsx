import React, { useState, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Ticket, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { findCouponById, updateCoupon, getCoupons } from '@/apis/pricing';
import { Badge } from '@/components/common/Badge';
import { DateBox } from '@/components/common/DateBox';
import { Label } from '@/components/ui/label';
import {
  AdminFormHeader,
  AdminFormCard,
  FormSectionBlock,
  FormField,
  FormInputField,
  FormSelectField,
  AdminFormActionBar,
  UnsavedChangesBar,
  useFormDirty,
} from '@/components/common/FormUtilities';

export const Route = createFileRoute('/_admin/coupons/$couponId/edit')({
  component: CouponEditPage,
});

interface CouponFormData {
  code: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  scope: 'booking' | 'traveler' | 'global';
  stackable: boolean;
  min_booking_amount: number;
  max_discount_amount: number;
  usage_limit: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  reason: string;
}

const DEFAULT_COUPON_FORM: CouponFormData = {
  code: '',
  name: '',
  description: '',
  type: 'percentage',
  value: 0,
  scope: 'booking',
  stackable: false,
  min_booking_amount: 0,
  max_discount_amount: 0,
  usage_limit: 0,
  valid_from: '',
  valid_until: '',
  is_active: true,
  reason: '',
};

function CouponEditPage() {
  const { couponId } = Route.useParams();
  const navigate = useNavigate();

  const [expectedVersion, setExpectedVersion] = useState<number | undefined>(undefined);

  // Instant localStorage cache hydration
  const [initialData, setInitialData] = useState<CouponFormData | null>(() => {
    try {
      const cached = localStorage.getItem(`superdong_coupon_cache_${couponId}`);
      if (cached) {
        const c = JSON.parse(cached);
        return {
          code: c.code || '',
          name: c.name || '',
          description: c.description || '',
          type: c.discount_type === 'fixed_amount' || c.type === 'fixed_amount' ? 'fixed_amount' : 'percentage',
          value: Number(c.discount_value !== undefined ? c.discount_value : (c.value !== undefined ? c.value : 0)),
          scope: (c.scope as any) || 'booking',
          stackable: Boolean(c.stackable),
          min_booking_amount: Number(c.min_booking_amount_vnd !== undefined ? c.min_booking_amount_vnd : (c.min_booking_amount || 0)),
          max_discount_amount: Number(c.max_discount_amount_vnd !== undefined ? c.max_discount_amount_vnd : (c.max_discount_amount || 0)),
          usage_limit: Number(c.usage_limit || 0),
          valid_from: c.effective_from ? c.effective_from.split('T')[0] : (c.valid_from ? c.valid_from.split('T')[0] : ''),
          valid_until: c.effective_to ? c.effective_to.split('T')[0] : (c.valid_until ? c.valid_until.split('T')[0] : ''),
          is_active: c.status ? c.status === 'active' : c.is_active !== false,
          reason: '',
        };
      }
    } catch {}
    return null;
  });

  const [formData, setFormData] = useState<CouponFormData>(initialData || DEFAULT_COUPON_FORM);
  const [loading, setLoading] = useState(!initialData);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isDirty } = useFormDirty(initialData, formData, ['reason', 'notes', 'expected_version']);

  // HYDRATE REAL COUPON DETAILS
  useEffect(() => {
    let isMounted = true;
    const fetchCoupon = async () => {
      if (!initialData) setLoading(true);
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
            const listRes = await getCoupons({ limit: 100 });
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

            const serverData: CouponFormData = {
              code: c.code || '',
              name: c.name || '',
              description: c.description || '',
              type: c.discount_type === 'fixed_amount' || c.type === 'fixed_amount' ? 'fixed_amount' : 'percentage',
              value: Number(c.discount_value !== undefined ? c.discount_value : (c.value !== undefined ? c.value : 0)),
              scope: (c.scope as any) || 'booking',
              stackable: Boolean(c.stackable),
              min_booking_amount: Number(c.min_booking_amount_vnd !== undefined ? c.min_booking_amount_vnd : (c.min_booking_amount || 0)),
              max_discount_amount: Number(c.max_discount_amount_vnd !== undefined ? c.max_discount_amount_vnd : (c.max_discount_amount || 0)),
              usage_limit: Number(c.usage_limit || 0),
              valid_from: c.effective_from ? c.effective_from.split('T')[0] : (c.valid_from ? c.valid_from.split('T')[0] : ''),
              valid_until: c.effective_to ? c.effective_to.split('T')[0] : (c.valid_until ? c.valid_until.split('T')[0] : ''),
              is_active: c.status ? c.status === 'active' : c.is_active !== false,
              reason: '',
            };

            setInitialData(serverData);
            setFormData(serverData);
            localStorage.setItem(`superdong_coupon_cache_${couponId}`, JSON.stringify(c));
          } else if (!initialData) {
            setFetchError('Không tìm thấy dữ liệu Mã khuyến mãi từ Backend API.');
          }
        }
      } catch (err: any) {
        console.warn('Fetch coupon error:', err);
        if (isMounted && !initialData) {
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
  }, [couponId]);

  const handleReset = () => {
    if (initialData) {
      setFormData(initialData);
      toast.info('Đã khôi phục dữ liệu ban đầu');
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
        description: formData.description,
        discount_type: formData.type === 'percentage' ? 'percentage' : 'fixed_amount',
        discount_value: Number(formData.value),
        scope: formData.scope || 'booking',
        stackable: formData.stackable,
        min_booking_amount: Number(formData.min_booking_amount),
        min_booking_amount_vnd: Number(formData.min_booking_amount),
        max_discount_amount: Number(formData.max_discount_amount) > 0 ? Number(formData.max_discount_amount) : null,
        max_discount_amount_vnd: Number(formData.max_discount_amount) > 0 ? Number(formData.max_discount_amount) : null,
        usage_limit: Number(formData.usage_limit) > 0 ? Number(formData.usage_limit) : null,
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
      <div className="h-96 w-full flex flex-col items-center justify-center gap-3 font-sans">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <span className="text-xs font-medium text-slate-500">Đang tải thông tin mã khuyến mãi...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full font-sans pb-20 text-slate-800 dark:text-slate-200">
      {/* Top Header Navigation Bar */}
      <AdminFormHeader
        icon={Ticket}
        title={
          <>
            Chỉnh Sửa Mã Khuyến Mãi:{' '}
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
              {formData.code || couponId}
            </span>
          </>
        }
        subtitle="Cập nhật chương trình ưu đãi, mức giảm giá và điều kiện áp dụng voucher"
        backTo="/coupons"
        badge={
          formData.is_active ? (
            <Badge variant="success" className="px-3 py-1 text-xs">
              Kích hoạt
            </Badge>
          ) : (
            <Badge variant="danger" className="px-3 py-1 text-xs">
              Đã khóa
            </Badge>
          )
        }
        onClear={handleReset}
        clearLabel="Khôi phục"
      />

      {/* Main Single Card Form */}
      <AdminFormCard onSubmit={handleSubmit}>
        {/* SECTION 1: THÔNG TIN CƠ BẢN */}
        <FormSectionBlock title="I. Thông tin cơ bản" columns={2}>
          <FormInputField
            id="coupon-code"
            label="Mã Khuyến Mãi (Code)"
            required
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="VD: SUMMER2026"
            className="font-mono font-bold uppercase text-blue-600 dark:text-blue-400"
          />

          <FormInputField
            id="coupon-name"
            label="Tên Chương Trình / Ưu Đãi"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="VD: Giảm 15% Mùa Hè 2026"
          />

          <div className="md:col-span-2">
            <FormField id="coupon-description" label="Mô Tả Chương Trình Khuyến Mãi">
              <textarea
                id="coupon-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="VD: Chương trình ưu đãi dành riêng cho người cao tuổi đi các tuyến tàu Phú Quốc, Nam Du trong mùa hè 2026..."
                className="w-full p-3 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 outline-none focus:border-blue-500 placeholder:text-slate-400"
              />
            </FormField>
          </div>
        </FormSectionBlock>

        {/* SECTION 2: MỨC GIẢM GIÁ & ĐIỀU KIỆN ÁP DỤNG */}
        <FormSectionBlock title="II. Mức giảm giá & Điều kiện áp dụng" columns={3}>
          <FormSelectField
            id="coupon-type"
            label="Loại Giảm Giá"
            required
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            options={[
              { value: 'percentage', label: 'Theo Phần Trăm (%)' },
              { value: 'fixed_amount', label: 'Theo Số Tiền Cố Định (VNĐ)' },
            ]}
          />

          <FormInputField
            id="coupon-value"
            label="Giá Trị Giảm"
            type="number"
            min={0}
            required
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: Math.max(0, Number(e.target.value)) })}
            placeholder={formData.type === 'percentage' ? 'VD: 15' : 'VD: 50000'}
            className="font-mono"
            helperText={formData.type === 'percentage' ? 'Nhập từ 1 đến 100%' : 'Số tiền VNĐ được trừ trực tiếp'}
          />

          <FormSelectField
            id="coupon-scope"
            label="Phạm Vi Áp Dụng"
            value={formData.scope}
            onChange={(e) => setFormData({ ...formData, scope: e.target.value as any })}
            options={[
              { value: 'booking', label: 'Toàn bộ Đơn hàng (Booking)' },
              { value: 'traveler', label: 'Từng Hành khách (Traveler)' },
              { value: 'global', label: 'Toàn hệ thống (Global)' },
            ]}
          />

          <FormInputField
            id="coupon-min-amount"
            label="Đơn Hàng Tối Thiểu (VNĐ)"
            type="number"
            min={0}
            value={formData.min_booking_amount}
            onChange={(e) => setFormData({ ...formData, min_booking_amount: Math.max(0, Number(e.target.value)) })}
            placeholder="VD: 500000"
            className="font-mono"
            helperText="0 = Không yêu cầu giá trị tối thiểu"
          />

          <FormInputField
            id="coupon-max-discount"
            label="Mức Giảm Tối Đa (VNĐ)"
            type="number"
            min={0}
            value={formData.max_discount_amount}
            onChange={(e) => setFormData({ ...formData, max_discount_amount: Math.max(0, Number(e.target.value)) })}
            placeholder="VD: 100000"
            className="font-mono"
            helperText="Giới hạn số tiền giảm khi giảm theo % (0 = không giới hạn)"
          />

          <div className="flex flex-col justify-center pt-2">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
              <input
                id="coupon-stackable"
                type="checkbox"
                checked={formData.stackable}
                onChange={(e) => setFormData({ ...formData, stackable: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <Label htmlFor="coupon-stackable" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                Cho phép áp dụng cộng dồn (Stackable)
              </Label>
            </div>
          </div>
        </FormSectionBlock>

        {/* SECTION 3: THỜI HẠN & GIỚI HẠN SỬ DỤNG */}
        <FormSectionBlock title="III. Thời hạn & Giới hạn sử dụng" columns={3}>
          <FormField id="coupon-valid-from" label="Ngày Bắt Đầu Áp Dụng">
            <DateBox
              id="coupon-valid-from"
              value={formData.valid_from}
              onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
            />
          </FormField>

          <FormField id="coupon-valid-until" label="Ngày Kết Thúc Hạn">
            <DateBox
              id="coupon-valid-until"
              value={formData.valid_until}
              onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
            />
          </FormField>

          <FormInputField
            id="coupon-usage-limit"
            label="Giới Hạn Số Lượt Sử Dụng"
            type="number"
            min={0}
            value={formData.usage_limit}
            onChange={(e) => setFormData({ ...formData, usage_limit: Math.max(0, Number(e.target.value)) })}
            placeholder="0"
            className="font-mono"
            helperText="0 = không giới hạn lượt dùng"
          />
        </FormSectionBlock>

        {/* SECTION 4: TRẠNG THÁI & GHI CHÚ */}
        <FormSectionBlock title="IV. Trạng thái & Ghi chú" columns={2}>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
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
          </div>

          <FormInputField
            id="coupon-reason"
            label="Lý Do / Ghi Chú Thay Đổi"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder="Nhập lý do điều chỉnh chương trình khuyến mãi..."
            helperText="Ghi nhận vào nhật ký Audit Log"
          />
        </FormSectionBlock>

        {/* Master Action Bar */}
        <AdminFormActionBar
          mode="edit"
          isDirty={isDirty}
          isSubmitting={isSubmitting}
          cancelTo="/coupons"
          submitLabel="Lưu thay đổi"
          onClear={handleReset}
          clearLabel="Khôi phục dữ liệu"
        />
      </AdminFormCard>

      {/* Floating Action Bar for Unsaved Changes */}
      <UnsavedChangesBar
        isDirty={isDirty}
        isSaving={isSubmitting}
        onSave={() => handleSubmit()}
        onReset={handleReset}
      />
    </div>
  );
}
