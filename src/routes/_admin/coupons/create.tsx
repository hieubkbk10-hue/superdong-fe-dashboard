import React, { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Ticket } from 'lucide-react';
import { toast } from 'sonner';

import { createCoupon } from '@/apis/pricing';
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
} from '@/components/common/FormUtilities';

export const Route = createFileRoute('/_admin/coupons/create')({
  component: CouponCreatePage,
});

interface CouponCreateFormData {
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
}

const DEFAULT_COUPON_FORM: CouponCreateFormData = {
  code: '',
  name: '',
  description: '',
  type: 'percentage',
  value: 15,
  scope: 'booking',
  stackable: false,
  min_booking_amount: 500000,
  max_discount_amount: 100000,
  usage_limit: 500,
  valid_from: '2026-08-10',
  valid_until: '2026-12-31',
  is_active: true,
};

function CouponCreatePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CouponCreateFormData>(DEFAULT_COUPON_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClear = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      type: 'percentage',
      value: 15,
      scope: 'booking',
      stackable: false,
      min_booking_amount: 0,
      max_discount_amount: 0,
      usage_limit: 0,
      valid_from: '',
      valid_until: '',
      is_active: true,
    });
    toast.success('Đã làm sạch dữ liệu nhập');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

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
        code: formData.code.toUpperCase().trim(),
        name: formData.name.trim() ? formData.name.trim() : `Ưu đãi ${formData.code.toUpperCase()}`,
        description: formData.description.trim() ? formData.description.trim() : undefined,
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
    <div className="space-y-4 w-full font-sans pb-20 text-slate-800 dark:text-slate-200">
      {/* Top Header Navigation Bar */}
      <AdminFormHeader
        icon={Ticket}
        title="Tạo Mã Khuyến Mãi Mới"
        subtitle="Tạo chương trình ưu đãi và voucher giảm giá cho hành khách đặt vé Superdong"
        backTo="/coupons"
        onClear={handleClear}
        clearLabel="Làm sạch dữ liệu"
      />

      {/* Main Single Card Form */}
      <AdminFormCard onSubmit={handleSubmit}>
        {/* Section 1: Thông tin cơ bản */}
        <FormSectionBlock title="I. Thông tin cơ bản" columns={2}>
          <FormInputField
            id="coupon-code"
            label="Mã Khuyến Mãi (Coupon Code)"
            required
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
            placeholder="VD: SUPERDONG2026"
            className="font-mono font-bold text-blue-600 dark:text-blue-400"
          />

          <FormInputField
            id="coupon-name"
            label="Tên Chương Trình (Tùy chọn)"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="VD: Ưu Đãi Mùa Hè 2026"
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

        {/* Section 2: Mức giảm giá & Điều kiện áp dụng */}
        <FormSectionBlock title="II. Mức giảm giá & Điều kiện áp dụng" columns={3}>
          <FormSelectField
            id="discount-type"
            label="Loại Giảm Giá"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            options={[
              { value: 'percentage', label: 'Theo Phần Trăm (%)' },
              { value: 'fixed_amount', label: 'Số Tiền Cố Định (VND)' },
            ]}
          />

          <FormInputField
            id="discount-value"
            label="Giá Trị Giảm"
            type="number"
            required
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
            min={1}
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
            id="min-booking"
            label="Đơn Tối Thiểu (VND)"
            type="number"
            value={formData.min_booking_amount}
            onChange={(e) => setFormData({ ...formData, min_booking_amount: Number(e.target.value) })}
            min={0}
            helperText="0 = Không yêu cầu giá trị tối thiểu"
          />

          <FormInputField
            id="max-discount"
            label="Mức Giảm Tối Đa (VND)"
            type="number"
            value={formData.max_discount_amount}
            onChange={(e) => setFormData({ ...formData, max_discount_amount: Number(e.target.value) })}
            min={0}
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

        {/* Section 3: Thời hạn & Giới hạn sử dụng */}
        <FormSectionBlock title="III. Thời hạn & Giới hạn sử dụng" columns={3}>
          <FormField id="valid-from" label="Ngày Bắt Đầu Hiệu Lực">
            <DateBox
              id="valid-from"
              value={formData.valid_from}
              onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
            />
          </FormField>

          <FormField id="valid-until" label="Ngày Kết Thúc / Hết Hạn">
            <DateBox
              id="valid-until"
              value={formData.valid_until}
              onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
            />
          </FormField>

          <FormInputField
            id="usage-limit"
            label="Giới Hạn Lượt Sử Dụng"
            type="number"
            value={formData.usage_limit}
            onChange={(e) => setFormData({ ...formData, usage_limit: Number(e.target.value) })}
            min={0}
            helperText="0 = không giới hạn lượt dùng"
          />
        </FormSectionBlock>

        {/* Section 4: Trạng thái kích hoạt */}
        <FormSectionBlock title="IV. Trạng thái kích hoạt" columns={1}>
          <div className="flex items-center gap-2.5 pt-1">
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
        </FormSectionBlock>

        {/* Master Action Bar */}
        <AdminFormActionBar
          mode="create"
          isSubmitting={isSubmitting}
          cancelTo="/coupons"
          submitLabel="Tạo mã khuyến mãi"
          onClear={handleClear}
          clearLabel="Làm sạch dữ liệu"
        />
      </AdminFormCard>
    </div>
  );
}
