import React, { useEffect, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Layers, WalletCards, Loader2 } from 'lucide-react';
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
  AdminFormActionBar,
  useFormDirty,
  generateDynamicAuditReason,
} from '@/components/common/FormUtilities';

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

  // HYDRATE REAL DATA + F5 DRAFT PERSISTENCE
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

        // F5 Draft Recovery if draft exists
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

  // Dirty State Detection
  const { isDirty } = useFormDirty(initialData, formData);

  // Auto Save F5 Draft on edit
  useEffect(() => {
    if (!loading && !loadError && formData.code && isDirty) {
      try {
        localStorage.setItem(draftKey, JSON.stringify(formData));
      } catch (_) {}
    }
  }, [formData, loading, loadError, draftKey, isDirty]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isDirty) {
      toast.info('Dữ liệu hiện tại chưa có thay đổi nào cần lưu');
      return;
    }

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
        color: formData.color.trim() || null,
        expected_version: formData.version,
        reason: dynamicReason,
      };

      await updateSeatClass(classId, payload);

      // Clear draft on successful save
      try {
        localStorage.removeItem(draftKey);
      } catch (_) {}

      toast.success(`Đã lưu thay đổi cho hạng ghế ${formData.name.trim()} thành công!`);
      navigate({ to: '/seat-classes' as any });
    } catch (err: any) {
      console.error('Update seat class error:', err);
      const serverMsg = err?.response?.data?.message || err?.message || 'Không thể cập nhật hạng ghế.';
      toast.error(serverMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 w-full flex flex-col items-center justify-center gap-3 font-sans">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <span className="text-sm font-medium text-slate-500">Đang tải thông tin hạng ghế...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-8 text-center space-y-4 font-sans">
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium">
          {loadError}
        </div>
        <Button variant="outline" onClick={() => navigate({ to: '/seat-classes' as any })}>
          Quay lại danh sách Hạng ghế
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full font-sans pb-10 text-slate-800 dark:text-slate-200">
      {/* Top Header Navigation Bar */}
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
        subtitle="Cập nhật giá vé cơ sở và màu nhận diện cho hạng ghế bán vé Superdong"
        backTo="/seat-classes"
        badge={
          formData.status === 'active' ? (
            <Badge variant="success" className="px-3 py-1 text-xs">
              Kích hoạt
            </Badge>
          ) : (
            <Badge variant="danger" className="px-3 py-1 text-xs">
              Tạm ngưng
            </Badge>
          )
        }
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
            label="Trạng Thái Áp Dụng"
            required
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            options={[
              { value: 'active', label: 'Kích hoạt (Đang áp dụng)' },
              { value: 'inactive', label: 'Tạm ngưng (Không áp dụng)' },
            ]}
          />
        </FormSectionBlock>

        {/* Action Buttons with Smart Dirty State */}
        <AdminFormActionBar
          mode="edit"
          isDirty={isDirty}
          isSubmitting={isSubmitting}
          cancelTo="/seat-classes"
          submitLabel="Lưu Thay Đổi"
          savedLabel="Đã lưu"
          onCancel={() => {
            try {
              localStorage.removeItem(draftKey);
            } catch (_) {}
            navigate({ to: '/seat-classes' as any });
          }}
        />
      </AdminFormCard>
    </div>
  );
}
