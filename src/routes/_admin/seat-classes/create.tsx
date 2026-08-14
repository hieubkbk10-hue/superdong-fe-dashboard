import React, { useEffect, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Layers, WalletCards } from 'lucide-react';
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
  generateDynamicAuditReason,
} from '@/components/common/FormUtilities';

export const Route = createFileRoute('/_admin/seat-classes/create')({
  component: SeatClassCreatePage,
});

const draftKey = 'superdong_seat_class_draft_create';
const defaultFormData = {
  code: '',
  name: '',
  price: '',
  color: '',
  status: 'active' as 'active' | 'inactive',
};

function SeatClassCreatePage() {
  const navigate = useNavigate();

  // F5 Form Draft Recovery (Rule 6 SKILL.md)
  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) return { ...defaultFormData, ...JSON.parse(saved) };
    } catch (_) {}
    return defaultFormData;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto Save F5 Draft on edit (Rule 6)
  useEffect(() => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(formData));
    } catch (_) {}
  }, [formData]);

  // Rule 3.1: Clear Data Button for Create Page
  const clearForm = () => {
    setFormData(defaultFormData);
    try {
      localStorage.removeItem(draftKey);
    } catch (_) {}
    toast.success('Đã làm sạch dữ liệu nhập');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      // Clear draft on successful save (Rule 6)
      try {
        localStorage.removeItem(draftKey);
      } catch (_) {}

      toast.success(`Tạo thành công hạng ghế mới: ${formData.name.trim()}`);
      navigate({ to: '/seat-classes' as any });
    } catch (err: any) {
      console.error('Create seat class error:', err);
      const serverMsg = err?.response?.data?.message || err?.message || '';
      toast.error(serverMsg || 'Không thể tạo hạng ghế mới trên Backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 w-full font-sans pb-10 text-slate-800 dark:text-slate-200">
      {/* Top Header Navigation Bar */}
      <AdminFormHeader
        icon={Layers}
        title="Thêm Hạng Ghế Tàu Mới"
        subtitle="Khai báo giá cơ sở và nhận diện màu sắc cho hạng ghế bán vé Superdong"
        backTo="/seat-classes"
        onClear={clearForm}
      />

      {/* Main Single Card Container matching SKILL.md */}
      <AdminFormCard onSubmit={handleSubmit}>
        {/* SECTION 1: THÔNG TIN HẠNG GHẾ */}
        <FormSectionBlock title="I. Thông tin hạng ghế">
          <FormInputField
            id="seat-code"
            label="Mã Hạng Ghế (Code)"
            required
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="VD: STANDARD, VIP, BUSINESS"
            className="font-mono font-bold uppercase"
          />
          <FormInputField
            id="seat-name"
            label="Tên Hạng Ghế"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="VD: Ghế Phổ Thông, Ghế VIP"
          />
        </FormSectionBlock>

        {/* SECTION 2: GIÁ VÉ VÀ NHẬN DIỆN */}
        <FormSectionBlock title="II. Giá vé & Nhận diện">
          <FormInputField
            id="seat-price"
            label="Giá Cơ Sở Hạng Ghế (VNĐ)"
            required
            inputMode="numeric"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value.replace(/[^0-9]/g, '') })}
            placeholder="VD: 320000"
            className="font-mono font-bold"
            leftIcon={<WalletCards size={15} />}
          />
          <FormField id="seat-color" label="Màu Nhận Diện Sơ Đồ Ghế" optional>
            <ColorPickerInput
              value={formData.color}
              onChange={(color) => setFormData({ ...formData, color })}
            />
          </FormField>
        </FormSectionBlock>

        {/* SECTION 3: TRẠNG THÁI VẬN HÀNH */}
        <FormSectionBlock title="III. Trạng thái vận hành">
          <FormSelectField
            id="seat-status"
            label="Trạng Thái Áp Dụng Mặc Định"
            required
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            options={[
              { value: 'active', label: 'Kích hoạt (Đang áp dụng)' },
              { value: 'inactive', label: 'Tạm ngưng (Không áp dụng)' },
            ]}
          />
        </FormSectionBlock>

        {/* Action Buttons */}
        <AdminFormActionBar
          mode="create"
          isSubmitting={isSubmitting}
          cancelTo="/seat-classes"
          submitLabel="Lưu Hạng Ghế"
          onClear={clearForm}
        />
      </AdminFormCard>
    </div>
  );
}
