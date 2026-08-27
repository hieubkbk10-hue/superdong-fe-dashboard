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
  useFormDirty,
} from '@/components/common/FormUtilities';
import { UnsavedChangesBar } from '@/components/common/UnsavedChangesBar';

export const Route = createFileRoute('/_admin/boats/create')({
  component: BoatCreatePage,
});

type BoatFormData = {
  code: string;
  name: string;
  capacity: string;
  speed: string;
  is_express: boolean;
  status: 'active' | 'maintenance' | 'inactive';
};

const emptyFormData: BoatFormData = {
  code: '',
  name: '',
  capacity: '',
  speed: '28 hải lý/giờ',
  is_express: true,
  status: 'active',
};

function BoatCreatePage() {
  const navigate = useNavigate();
  const draftKey = 'superdong_boat_draft_create';

  const [initialData] = useState<BoatFormData>(emptyFormData);
  const [formData, setFormData] = useState<BoatFormData>(() => {
    try {
      const draft = localStorage.getItem(draftKey);
      if (draft) return { ...emptyFormData, ...JSON.parse(draft) };
    } catch (_) {}
    return emptyFormData;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isDirty } = useFormDirty(initialData, formData);

  useEffect(() => {
    if (isDirty) {
      try {
        localStorage.setItem(draftKey, JSON.stringify(formData));
      } catch (_) {}
    }
  }, [formData, isDirty]);

  const handleReset = () => {
    setFormData(emptyFormData);
    try {
      localStorage.removeItem(draftKey);
    } catch (_) {}
    toast.info('Đã làm sạch dữ liệu biểu mẫu');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!formData.code.trim() || !formData.name.trim()) {
      toast.error('Vui lòng điền đầy đủ Mã tàu và Tên tàu!');
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
      await createBoat({
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        capacity: Number(cleanCapacity),
        speed: formData.speed.trim(),
        is_express: formData.is_express,
        status: formData.status,
      });

      try {
        localStorage.removeItem(draftKey);
      } catch (_) {}

      toast.success(`Tạo mới tàu ${formData.name} thành công!`);
      navigate({ to: '/boats' as any });
    } catch (err: any) {
      console.error('Create boat error:', err);
      const serverMsg = err?.response?.data?.message || 'Có lỗi xảy ra khi tạo tàu mới.';
      toast.error(serverMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 w-full font-sans pb-20 text-slate-800 dark:text-slate-200">
      <AdminFormHeader
        icon={Ship}
        title="Thêm Mới Tàu Cao Tốc"
        subtitle="Khai báo thông số kỹ thuật, sức chứa và đưa tàu vào danh mục vận hành"
        backTo="/boats"
        onClear={handleReset}
        clearLabel="Làm sạch"
      />

      <AdminFormCard onSubmit={handleSubmit}>
        <FormSectionBlock title="I. Thông tin cơ bản">
          <FormInputField
            id="boat-code"
            label="Mã Định Danh Tàu (Boat Code)"
            required
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="VD: SD-01, SD-09"
            className="font-mono font-bold uppercase"
          />
          <FormInputField
            id="boat-name"
            label="Tên Tàu Cao Tốc"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="VD: Superdong I"
          />
        </FormSectionBlock>

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
            label="Tốc Độ Vận Hành"
            optional
            value={formData.speed}
            onChange={(e) => setFormData({ ...formData, speed: e.target.value })}
            placeholder="VD: 28 hải lý/giờ"
          />
        </FormSectionBlock>

        <FormSectionBlock title="III. Trạng thái & Vận hành">
          <FormSelectField
            id="boat-status"
            label="Trạng Thái Vận Hành Tàu"
            required
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            options={[
              { value: 'active', label: 'Hoạt động tốt' },
              { value: 'maintenance', label: 'Bảo trì định kỳ' },
              { value: 'inactive', label: 'Tạm dừng vận hành' },
            ]}
          />

          <div className="flex items-center gap-2 pt-5">
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
      </AdminFormCard>

      <UnsavedChangesBar
        isDirty={isDirty}
        isSaving={isSubmitting}
        onSave={() => handleSubmit()}
        onReset={handleReset}
        message="Thông tin tàu chưa được tạo mới"
      />
    </div>
  );
}
