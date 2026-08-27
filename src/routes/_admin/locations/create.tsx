import React, { useEffect, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { createLocation } from '@/apis/journeys';
import {
  AdminFormHeader,
  AdminFormCard,
  FormSectionBlock,
  FormInputField,
  FormSelectField,
  useFormDirty,
} from '@/components/common/FormUtilities';
import { UnsavedChangesBar } from '@/components/common/UnsavedChangesBar';

export const Route = createFileRoute('/_admin/locations/create')({
  component: LocationCreatePage,
});

type LocationFormData = {
  code: string;
  name: string;
  status: 'active' | 'inactive';
};

const emptyForm: LocationFormData = {
  code: '',
  name: '',
  status: 'active',
};

function LocationCreatePage() {
  const navigate = useNavigate();

  const [initialData] = useState(emptyForm);
  const [formData, setFormData] = useState<LocationFormData>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isDirty } = useFormDirty(initialData, formData);

  const handleReset = () => {
    setFormData(emptyForm);
    toast.info('Đã làm sạch dữ liệu nhập');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.code.trim()) {
      toast.error('Vui lòng nhập mã bến tàu');
      return;
    }
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên bến tàu');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await createLocation({
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        status: formData.status,
      });

      toast.success(`Tạo mới bến tàu '${formData.name}' thành công`);
      navigate({ to: '/locations' as any });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Lỗi khi tạo bến tàu mới');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 w-full font-sans pb-20 text-slate-800 dark:text-slate-200">
      <AdminFormHeader
        icon={MapPin}
        title="Thêm Mới Bến Tàu"
        subtitle="Khai báo điểm cập bến mới đưa vào mạng lưới tuyến tàu cao tốc"
        backTo="/locations"
        onClear={handleReset}
        clearLabel="Làm sạch"
      />

      <AdminFormCard onSubmit={handleSubmit}>
        <FormSectionBlock title="I. Thông tin cơ bản">
          <FormInputField
            id="loc-code"
            label="Mã Bến Tàu"
            required
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 32) })}
            placeholder="VD: RG, PQ, NT"
            className="font-mono font-bold uppercase"
          />
          <FormInputField
            id="loc-name"
            label="Tên Bến Tàu / Cảng"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value.slice(0, 120) })}
            placeholder="VD: Rạch Giá, Phú Quốc, Nam Du"
          />
        </FormSectionBlock>

        <FormSectionBlock title="II. Trạng thái sử dụng" columns={1}>
          <FormSelectField
            id="loc-status"
            label="Trạng Thái Vận Hành"
            required
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            options={[
              { value: 'active', label: 'Đang hoạt động' },
              { value: 'inactive', label: 'Tạm ngưng' },
            ]}
          />
        </FormSectionBlock>
      </AdminFormCard>

      <UnsavedChangesBar
        isDirty={isDirty}
        isSaving={isSubmitting}
        onSave={() => handleSubmit()}
        onReset={handleReset}
        message="Thông tin bến tàu chưa được tạo mới"
      />
    </div>
  );
}
