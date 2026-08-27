import React, { useEffect, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Layers, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { findSeatClassById, updateSeatClass } from '@/apis/boats';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { ColorPickerInput } from '@/components/common/ColorPickerInput';
import {
  AdminFormHeader,
  AdminFormCard,
  FormSectionBlock,
  FormField,
  FormInputField,
  FormSelectField,
  useFormDirty,
  generateDynamicAuditReason,
} from '@/components/common/FormUtilities';
import { UnsavedChangesBar } from '@/components/common/UnsavedChangesBar';

export const Route = createFileRoute('/_admin/seat-classes/$classId/edit')({
  component: SeatClassEditPage,
});

type FormData = {
  code: string;
  name: string;
  price: string;
  color: string;
  status: 'active' | 'inactive';
  version: number;
};

const emptyFormData: FormData = {
  code: '',
  name: '',
  price: '',
  color: '',
  status: 'active',
  version: 1,
};

const SEAT_CLASS_LABELS: Record<string, string> = {
  code: 'Mã hạng ghế',
  name: 'Tên hạng ghế',
  price: 'Giá cơ sở',
  color: 'Màu nhận diện',
  status: 'Trạng thái áp dụng',
};

function SeatClassEditPage() {
  const { classId } = Route.useParams();
  const navigate = useNavigate();
  const draftKey = `superdong_seat_class_draft_edit_${classId}`;

  const [initialData, setInitialData] = useState<FormData | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyFormData);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadSeatClass = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await findSeatClassById(classId);
      if (response && response.data) {
        const sc = response.data;
        const serverForm: FormData = {
          code: sc.code || '',
          name: sc.name || '',
          price: typeof sc.price === 'number' && sc.price > 0 ? String(sc.price) : '',
          color: sc.color || '',
          status: sc.status === 'inactive' || (sc as any).is_active === false ? 'inactive' : 'active',
          version: sc.version || 1,
        };

        setInitialData(serverForm);

        let finalData = serverForm;
        try {
          const draftStr = localStorage.getItem(draftKey);
          if (draftStr) {
            finalData = { ...serverForm, ...JSON.parse(draftStr) };
          }
        } catch (_) {}

        setFormData(finalData);
      } else {
        setLoadError('Không tìm thấy dữ liệu Hạng ghế từ hệ thống.');
      }
    } catch (err: any) {
      console.warn('Fetch seat class details error:', err);
      const message = err?.response?.data?.message || err?.message || 'Không thể nạp thông tin Hạng ghế từ Backend API.';
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (classId) loadSeatClass();
  }, [classId]);

  const { isDirty } = useFormDirty(initialData, formData, ['version']);

  useEffect(() => {
    if (!loading && !loadError && formData.code && isDirty) {
      try {
        localStorage.setItem(draftKey, JSON.stringify(formData));
      } catch (_) {}
    }
  }, [formData, loading, loadError, draftKey, isDirty]);

  const handleReset = () => {
    if (initialData) {
      setFormData(initialData);
      try {
        localStorage.removeItem(draftKey);
      } catch (_) {}
      toast.info('Đã khôi phục dữ liệu ban đầu');
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!isDirty) {
      toast.info('Dữ liệu hiện tại chưa có thay đổi nào cần lưu');
      return;
    }

    if (!formData.code.trim() || !formData.name.trim()) {
      toast.error('Vui lòng điền đầy đủ Mã hạng ghế và Tên hạng ghế!');
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
        mode: 'edit',
        initialData,
        currentData: formData,
        fieldLabels: SEAT_CLASS_LABELS,
      });

      const payload: Record<string, any> = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        price: Number(cleanPrice),
        status: formData.status,
        expected_version: formData.version,
        reason: dynamicReason,
      };
      if (formData.color.trim()) payload.color = formData.color.trim();

      await updateSeatClass(classId, payload);

      try {
        localStorage.removeItem(draftKey);
      } catch (_) {}

      toast.success(`Cập nhật hạng ghế '${formData.name}' thành công!`);
      navigate({ to: '/seat-classes' as any });
    } catch (err: any) {
      console.error('Update seat class error:', err);
      const serverMsg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi cập nhật Hạng ghế.';
      toast.error(serverMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 w-full flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <span className="text-xs font-medium text-slate-500">Đang nạp dữ liệu Hạng ghế...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 rounded-2xl text-xs font-medium">
          {loadError}
        </div>
        <Button variant="outline" onClick={() => navigate({ to: '/seat-classes' as any })}>
          Quay lại danh mục Hạng ghế
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full font-sans pb-20 text-slate-800 dark:text-slate-200">
      <AdminFormHeader
        icon={Layers}
        title={
          <>
            Chỉnh Sửa Hạng Ghế:{' '}
            <span className="text-blue-600 dark:text-blue-400 font-bold">
              {formData.name || formData.code}
            </span>
          </>
        }
        subtitle="Quản lý mã định danh, định mức giá vé cơ sở và màu sắc nhận diện ghế"
        backTo="/seat-classes"
        badge={
          formData.status === 'active' ? (
            <Badge variant="success">Áp dụng</Badge>
          ) : (
            <Badge variant="danger">Tạm ngưng</Badge>
          )
        }
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
