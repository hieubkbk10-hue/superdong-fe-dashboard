import React, { useEffect, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { findAdminLocation, updateLocation } from '@/apis/journeys';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import {
  AdminFormHeader,
  AdminFormCard,
  FormSectionBlock,
  FormInputField,
  FormSelectField,
  useFormDirty,
} from '@/components/common/FormUtilities';
import { UnsavedChangesBar } from '@/components/common/UnsavedChangesBar';

export const Route = createFileRoute('/_admin/locations/$locationId/edit')({
  component: LocationEditPage,
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

function normalizeForm(data: any): LocationFormData {
  return {
    code: data?.code || '',
    name: data?.name || '',
    status: data?.status === 'inactive' || data?.is_active === false ? 'inactive' : 'active',
  };
}

function LocationEditPage() {
  const { locationId } = Route.useParams();
  const navigate = useNavigate();

  const [initialData, setInitialData] = useState<LocationFormData | null>(null);
  const [formData, setFormData] = useState<LocationFormData>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hydrateLocation = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await findAdminLocation(locationId);
      const serverForm = normalizeForm(res?.data);
      setInitialData(serverForm);
      setFormData(serverForm);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không thể tải dữ liệu bến tàu';
      setApiError(message);
      toast.error(`Không tải được bến tàu. ${message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    hydrateLocation();
  }, [locationId]);

  const { isDirty } = useFormDirty(initialData, formData);

  const handleReset = () => {
    if (initialData) {
      setFormData(initialData);
      toast.info('Đã khôi phục dữ liệu ban đầu');
    }
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
      await updateLocation(locationId, {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        status: formData.status,
      });

      toast.success(`Cập nhật bến tàu '${formData.name}' thành công`);
      navigate({ to: '/locations' as any });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Lỗi khi cập nhật bến tàu');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 w-full flex flex-col items-center justify-center gap-3 font-sans">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <span className="text-xs font-medium text-slate-500">Đang tải thông tin bến tàu...</span>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="p-8 text-center space-y-4 font-sans">
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 rounded-2xl text-xs font-medium">
          {apiError}
        </div>
        <Button variant="outline" onClick={() => navigate({ to: '/locations' as any })}>
          Quay lại danh sách bến tàu
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full font-sans pb-20 text-slate-800 dark:text-slate-200">
      <AdminFormHeader
        icon={MapPin}
        title={
          <>
            Chỉnh Sửa Bến Tàu:{' '}
            <span className="text-blue-600 dark:text-blue-400 font-bold">
              {formData.name || formData.code}
            </span>
          </>
        }
        subtitle="Cập nhật thông tin điểm cập bến, mã định danh và trạng thái vận hành"
        backTo="/locations"
        badge={
          formData.status === 'active' ? (
            <Badge variant="success">Hoạt động</Badge>
          ) : (
            <Badge variant="danger">Tạm ngưng</Badge>
          )
        }
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
      />
    </div>
  );
}
