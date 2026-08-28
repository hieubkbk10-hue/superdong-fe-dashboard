import React, { useEffect, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Layers } from 'lucide-react';
import { toast } from 'sonner';
import { createSeatClass } from '@/apis/boats';
import { ColorPickerInput } from '@/components/common/ColorPickerInput';
import {
  AdminFormHeader,
  AdminFormCard,
  FormSectionBlock,
  FormField,
  FormInputField,
  FormSelectField,
  AdminFormActionBar,
  useFormDirty,
  generateDynamicAuditReason,
} from '@/components/common/FormUtilities';

export const Route = createFileRoute('/_admin/seat-classes/create')({
  component: SeatClassCreatePage,
});

const defaultFormData = {
  code: '',
  name: '',
  price: '',
  color: '',
  status: 'active' as 'active' | 'inactive',
};

function SeatClassCreatePage() {
  const navigate = useNavigate();
  const [initialData] = useState(defaultFormData);
  const [formData, setFormData] = useState(defaultFormData);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isDirty } = useFormDirty(initialData, formData);

  const handleReset = () => {
    setFormData(defaultFormData);
    toast.info('Đã làm sạch dữ liệu nhập');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      toast.error('Vui lòng nhập đầy đủ Mã hạng ghế và Tên hạng ghế!');
      return;
    }

    const cleanPrice = formData.price.replace(/[^0-9]/g, '');
    if (!cleanPrice || Number(cleanPrice) <= 0) {
      toast.error('Vui lòng nhập giá cơ sở hợp lệ (> 0 VNĐ) cho hạng ghế!');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const dynamicReason = generateDynamicAuditReason({
        entityName: 'Hạng ghế',
        mode: 'create',
        currentData: formData,
      });

      const payload: Record<string, any> = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        price: Number(cleanPrice),
        status: formData.status,
        reason: dynamicReason,
      };
      if (formData.color.trim()) payload.color = formData.color.trim();

      await createSeatClass(payload);

      toast.success(`Tạo thành công hạng ghế mới: ${formData.name.trim()}`);
      navigate({ to: '/seat-classes' as any });
    } catch (err: any) {
      console.error('Create seat class error:', err);
      const serverMsg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi tạo Hạng ghế mới.';
      toast.error(serverMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 w-full font-sans pb-20 text-slate-800 dark:text-slate-200">
      <AdminFormHeader
        icon={Layers}
        title="Thêm Mới Hạng Ghế Tàu"
        subtitle="Khai báo mã định danh, bảng giá vé cơ sở và màu sắc nhận diện ghế"
        backTo="/seat-classes"
        onClear={handleReset}
        clearLabel="Làm sạch"
      />

      <AdminFormCard onSubmit={handleSubmit}>
        <FormSectionBlock title="I. Thông tin định danh hạng ghế">
          <FormInputField
            id="sc-code"
            label="Mã Hạng Ghế (Seat Class Code)"
            required
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="VD: ECO, VIP, ROOM"
            className="font-mono font-bold uppercase"
          />
          <FormInputField
            id="sc-name"
            label="Tên Hạng Ghế Hiển Thị"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="VD: Ghế Tiêu Chuẩn (Economy)"
          />
        </FormSectionBlock>

        <FormSectionBlock title="II. Chính sách giá vé & Màu sắc sơ đồ">
          <FormInputField
            id="sc-price"
            label="Giá Vé Cơ Sở (VNĐ)"
            required
            inputMode="numeric"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value.replace(/[^0-9]/g, '') })}
            placeholder="VD: 340000"
            className="font-mono font-bold"
          />
          <FormField id="sc-color" label="Màu Sắc Nhận Diện Trên Sơ Đồ" optional>
            <ColorPickerInput
              value={formData.color}
              onChange={(newColor) => setFormData({ ...formData, color: newColor })}
              placeholder="VD: #3B82F6"
            />
          </FormField>
        </FormSectionBlock>

        <FormSectionBlock title="III. Trạng thái áp dụng" columns={1}>
          <FormSelectField
            id="sc-status"
            label="Trạng Thái Vận Hành & Đặt Vé"
            required
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            options={[
              { value: 'active', label: 'Áp dụng mở bán vé' },
              { value: 'inactive', label: 'Tạm dừng áp dụng' },
            ]}
          />
        </FormSectionBlock>

        <AdminFormActionBar
          mode="create"
          isSubmitting={isSubmitting}
          cancelTo="/seat-classes"
          submitLabel="Tạo mới hạng ghế"
          onClear={handleReset}
          clearLabel="Làm sạch"
        />
      </AdminFormCard>
    </div>
  );
}
