import React, { useState, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Ship } from 'lucide-react';
import { toast } from 'sonner';

import { createBoat } from '@/apis/boats';
import { Label } from '@/components/ui/label';
import {
  AdminFormHeader,
  AdminFormCard,
  FormSectionBlock,
  FormInputField,
  FormSelectField,
  AdminFormActionBar,
} from '@/components/common/FormUtilities';

export const Route = createFileRoute('/_admin/boats/create')({
  component: BoatCreatePage,
});

export function BoatCreatePage() {
  const navigate = useNavigate();
  const draftKey = 'superdong_boat_draft_create';

  const defaultFormData = {
    code: '',
    name: '',
    capacity: '',
    speed: '',
    is_express: true,
    status: 'active' as 'active' | 'maintenance' | 'inactive',
  };

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
  }, [formData, draftKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Vui lòng nhập đầy đủ Mã định danh và Tên tàu!');
      return;
    }

    const cleanCapacity = formData.capacity.replace(/[^0-9]/g, '');
    if (!cleanCapacity || Number(cleanCapacity) <= 0) {
      toast.error('Vui lòng nhập sức chứa thực tế hợp lệ của tàu (số ghế > 0)!');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const payload: Record<string, any> = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        capacity: Number(cleanCapacity),
        is_express: formData.is_express,
        status: formData.status,
      };

      if (formData.speed.trim()) {
        payload.speed = formData.speed.trim();
      }

      await createBoat(payload);

      // Clear draft on successful create (Rule 6)
      try {
        localStorage.removeItem(draftKey);
      } catch (_) {}

      toast.success(`Tạo thành công tàu mới: ${formData.name}`);
      navigate({ to: '/boats' as any });
    } catch (err: any) {
      console.error('Create boat error:', err);
      const serverMsg = err?.response?.data?.message || err?.message || '';
      toast.error(serverMsg || 'Không thể tạo tàu mới trên Backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rule 3.1: Clear Data Button for Create Page
  const clearForm = () => {
    setFormData(defaultFormData);
    try {
      localStorage.removeItem(draftKey);
    } catch (_) {}
    toast.success('Đã làm sạch dữ liệu nhập');
  };

  return (
    <div className="space-y-4 w-full font-sans pb-10 text-slate-800 dark:text-slate-200">
      {/* Top Header Navigation Bar */}
      <AdminFormHeader
        icon={Ship}
        title="Thêm Tàu Cao Tốc Mới"
        subtitle="Khai báo thông số kỹ thuật và sức chứa ghế cho tàu mới trong đội tàu Superdong"
        backTo="/boats"
        onClear={clearForm}
      />

      {/* Main Single Card Container matching SKILL.md */}
      <AdminFormCard onSubmit={handleSubmit}>
        {/* SECTION 1: THÔNG TIN CƠ BẢN */}
        <FormSectionBlock title="I. Thông tin cơ bản">
          <FormInputField
            id="boat-code"
            label="Mã Định Danh Tàu (Boat Code)"
            required
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="VD: SD-09, SD-12"
            className="font-mono font-bold uppercase"
          />
          <FormInputField
            id="boat-name"
            label="Tên Tàu Cao Tốc"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="VD: Superdong IX"
          />
        </FormSectionBlock>

        {/* SECTION 2: THÔNG SỐ THIẾT KẾ & SỨC CHỨA */}
        <FormSectionBlock title="II. Thông số thiết kế & Sức chứa">
          <FormInputField
            id="boat-capacity"
            label="Sức Chứa (Tổng số ghế thực tế)"
            required
            inputMode="numeric"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: e.target.value.replace(/[^0-9]/g, '') })}
            placeholder="VD: 306"
            className="font-mono font-bold"
          />
          <FormInputField
            id="boat-speed"
            label="Tốc Độ Vận Hành Dự Kiến"
            optional
            value={formData.speed}
            onChange={(e) => setFormData({ ...formData, speed: e.target.value })}
            placeholder="VD: 30 hải lý/giờ"
          />
        </FormSectionBlock>

        {/* SECTION 3: TRẠNG THÁI & VẬN HÀNH */}
        <FormSectionBlock title="III. Trạng thái & Vận hành">
          <FormSelectField
            id="boat-status"
            label="Trạng Thái Vận Hành Mặc Định"
            required
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            options={[
              { value: 'active', label: 'Hoạt động tốt' },
              { value: 'maintenance', label: 'Bảo trì định kỳ' },
              { value: 'inactive', label: 'Tạm dừng vận hành' },
            ]}
          />

          <div className="flex items-center gap-2 pt-6">
            <input
              id="boat-is-express"
              type="checkbox"
              checked={formData.is_express}
              onChange={(e) => setFormData({ ...formData, is_express: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <Label htmlFor="boat-is-express" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              Tàu Cao Tốc Express (Ưu tiên lịch chạy nhanh)
            </Label>
          </div>
        </FormSectionBlock>

        {/* Action Buttons */}
        <AdminFormActionBar
          mode="create"
          isSubmitting={isSubmitting}
          cancelTo="/boats"
          submitLabel="Lưu Tàu Mới"
          onClear={clearForm}
        />
      </AdminFormCard>
    </div>
  );
}
