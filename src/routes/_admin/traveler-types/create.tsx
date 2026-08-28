import React, { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Users } from 'lucide-react';
import { toast } from 'sonner';
import { createTravelerType } from '@/apis/pricing';
import { Label } from '@/components/ui/label';
import {
  AdminFormHeader,
  AdminFormCard,
  FormSectionBlock,
  FormField,
  FormInputField,
  AdminFormActionBar,
} from '@/components/common/FormUtilities';

export const Route = createFileRoute('/_admin/traveler-types/create')({
  component: TravelerTypeCreatePage,
});

const DEFAULT_TRAVELER_TYPE = {
  code: '',
  name: '',
  discount_percentage: 0,
  description: '',
  is_active: true,
};

function TravelerTypeCreatePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(DEFAULT_TRAVELER_TYPE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClear = () => {
    setFormData(DEFAULT_TRAVELER_TYPE);
    toast.success('Đã làm sạch dữ liệu');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Vui lòng điền Tên và Mã phân loại!');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await createTravelerType({
        code: formData.code.toUpperCase(),
        name: formData.name,
        discount_percentage: Number(formData.discount_percentage),
        description: formData.description,
        is_active: formData.is_active,
      });
      toast.success(`Đã tạo phân loại hành khách ${formData.name}`, { id: 'traveler-type-create-toast' });
      navigate({ to: '/traveler-types' as any });
    } catch (err: any) {
      console.error('Failed to create traveler type:', err);
      const serverMsg = err?.response?.data?.message || err?.message || '';
      toast.error(serverMsg || 'Không thể tạo phân loại hành khách trên Backend Server', { id: 'traveler-type-create-toast' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 w-full font-sans pb-20 text-slate-800 dark:text-slate-200">
      {/* Top Header Navigation Bar */}
      <AdminFormHeader
        icon={Users}
        title="Tạo Phân Loại Hành Khách Mới"
        subtitle="Cấu hình đối tượng áp dụng mức miễn giảm giá vé hành khách"
        backTo="/traveler-types"
        onClear={handleClear}
        clearLabel="Làm sạch dữ liệu"
      />

      {/* Main Single Card Form */}
      <AdminFormCard onSubmit={handleSubmit}>
        {/* SECTION 1: THÔNG TIN PHÂN LOẠI */}
        <FormSectionBlock title="I. Thông tin phân loại hành khách" columns={2}>
          <FormInputField
            id="traveler-code"
            label="Mã Phân Loại (CODE)"
            required
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="VD: STUDENT"
            className="font-mono font-bold uppercase text-blue-600 dark:text-blue-400"
          />

          <FormInputField
            id="traveler-name"
            label="Tên Đối Tượng / Phân Loại"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="VD: Học sinh - Sinh viên"
          />

          <FormInputField
            id="traveler-discount"
            label="Mức Giảm Giá Vé (%)"
            type="number"
            min={0}
            max={100}
            required
            value={formData.discount_percentage}
            onChange={(e) => setFormData({ ...formData, discount_percentage: Number(e.target.value) })}
            helperText="Nhập 0 cho giá chuẩn, 100 cho miễn phí hoàn toàn"
          />

          <div className="flex items-center gap-2.5 pt-6">
            <input
              type="checkbox"
              id="is_active_type"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <Label htmlFor="is_active_type" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              Kích hoạt áp dụng phân loại này
            </Label>
          </div>

          <div className="md:col-span-2">
            <FormField id="traveler-desc" label="Mô Tả & Quy Định Giấy Tờ Cần Xuất Trình">
              <textarea
                id="traveler-desc"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="VD: Áp dụng cho học sinh, sinh viên các trường ĐH, CĐ chính quy có thẻ sinh viên còn hiệu lực..."
                className="w-full p-3 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 outline-none focus:border-blue-500"
              />
            </FormField>
          </div>
        </FormSectionBlock>

        {/* Master Action Bar */}
        <AdminFormActionBar
          mode="create"
          isSubmitting={isSubmitting}
          cancelTo="/traveler-types"
          submitLabel="Tạo phân loại"
          onClear={handleClear}
          clearLabel="Làm sạch dữ liệu"
        />
      </AdminFormCard>
    </div>
  );
}
