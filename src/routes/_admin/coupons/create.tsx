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

const DEFAULT_COUPON_FORM = {
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
};

function CouponCreatePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(DEFAULT_COUPON_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClear = () => {
    setFormData({
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
        </FormSectionBlock>

        {/* Section 2: Mức giảm giá & Điều kiện áp dụng */}
        <FormSectionBlock title="II. Mức giảm giá & Điều kiện áp dụng" columns={4}>
          <FormSelectField
            id="discount-type"
            label="Loại Giảm Giá"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
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
          />

          <FormInputField
            id="min-booking"
            label="Đơn Tối Thiểu (VND)"
            type="number"
            value={formData.min_booking_amount}
            onChange={(e) => setFormData({ ...formData, min_booking_amount: Number(e.target.value) })}
            min={0}
          />

          <FormInputField
            id="max-discount"
            label="Mức Giảm Tối Đa (VND)"
            type="number"
            value={formData.max_discount_amount}
            onChange={(e) => setFormData({ ...formData, max_discount_amount: Number(e.target.value) })}
            min={0}
          />
        </FormSectionBlock>

        {/* Section 3: Thời hạn & Giới hạn sử dụng */}
        <FormSectionBlock title="III. Thời hạn & Giới hạn sử dụng" columns={3}>
          <FormInputField
            id="usage-limit"
            label="Giới Hạn Lượt Sử Dụng"
            type="number"
            value={formData.usage_limit}
            onChange={(e) => setFormData({ ...formData, usage_limit: Number(e.target.value) })}
            min={1}
          />

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
