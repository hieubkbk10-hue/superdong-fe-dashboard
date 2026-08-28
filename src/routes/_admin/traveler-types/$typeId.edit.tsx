import React, { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getTravelerTypes, updateTravelerType } from '@/apis/pricing';
import { Badge } from '@/components/common/Badge';
import { Label } from '@/components/ui/label';
import {
  AdminFormHeader,
  AdminFormCard,
  FormSectionBlock,
  FormField,
  FormInputField,
  UnsavedChangesBar,
  useFormDirty,
} from '@/components/common/FormUtilities';

export const Route = createFileRoute('/_admin/traveler-types/$typeId/edit')({
  component: TravelerTypeEditPage,
});

interface TravelerTypeFormData {
  code: string;
  name: string;
  discount_percentage: number;
  description: string;
  is_active: boolean;
}

const DEFAULT_FORM: TravelerTypeFormData = {
  code: '',
  name: '',
  discount_percentage: 0,
  description: '',
  is_active: true,
};

function TravelerTypeEditPage() {
  const { typeId } = Route.useParams();

  const [initialData, setInitialData] = useState<TravelerTypeFormData | null>(null);
  const [formData, setFormData] = useState<TravelerTypeFormData>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isDirty } = useFormDirty(initialData, formData);

  const hydrateTravelerType = async () => {
    setLoading(true);
    try {
      const res = await getTravelerTypes();
      const items = (res as any)?.data || res || [];
      const found = Array.isArray(items)
        ? items.find((item: any) => String(item.id) === String(typeId) || item.code === typeId)
        : null;

      if (found) {
        const serverData: TravelerTypeFormData = {
          code: found.code || '',
          name: found.name || '',
          discount_percentage: Number(found.discount_percentage || 0),
          description: found.description || '',
          is_active: found.is_active !== undefined ? Boolean(found.is_active) : true,
        };
        setInitialData(serverData);
        setFormData(serverData);
      } else {
        // Fallback default
        const serverData: TravelerTypeFormData = {
          code: String(typeId).toUpperCase(),
          name: String(typeId),
          discount_percentage: 0,
          description: '',
          is_active: true,
        };
        setInitialData(serverData);
        setFormData(serverData);
      }
    } catch (err: any) {
      console.error('Failed to fetch traveler type:', err);
      toast.error('Không thể nạp thông tin phân loại hành khách từ server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    hydrateTravelerType();
  }, [typeId]);

  const handleReset = () => {
    if (initialData) {
      setFormData(initialData);
      toast.info('Đã khôi phục dữ liệu ban đầu');
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Vui lòng điền Tên và Mã phân loại!');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTravelerType(typeId, {
        code: formData.code.toUpperCase(),
        name: formData.name,
        discount_percentage: Number(formData.discount_percentage),
        description: formData.description,
        is_active: formData.is_active,
      });
      toast.success(`Đã cập nhật thay đổi cho phân loại ${formData.name} thành công!`, { id: 'traveler-type-edit-toast' });
      await hydrateTravelerType();
    } catch (err: any) {
      console.error('Failed to update traveler type:', err);
      const serverMsg = err?.response?.data?.message || err?.message || '';
      toast.error(serverMsg || 'Có lỗi xảy ra khi cập nhật phân loại hành khách trên Backend', { id: 'traveler-type-edit-toast' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 w-full flex flex-col items-center justify-center gap-3 font-sans">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <span className="text-xs font-medium text-slate-500">Đang tải thông tin phân loại...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full font-sans pb-20 text-slate-800 dark:text-slate-200">
      {/* Top Header Navigation Bar */}
      <AdminFormHeader
        icon={Users}
        title={
          <>
            Chỉnh Sửa Phân Loại:{' '}
            <span className="text-blue-600 dark:text-blue-400 font-bold">
              {formData.name} ({formData.code})
            </span>
          </>
        }
        subtitle={
          <>
            Mã định danh hệ thống: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">#{typeId}</span>
          </>
        }
        backTo="/traveler-types"
        badge={
          formData.is_active ? (
            <Badge variant="success" className="px-3 py-1 text-xs">
              Kích hoạt
            </Badge>
          ) : (
            <Badge variant="danger" className="px-3 py-1 text-xs">
              Đã ẩn
            </Badge>
          )
        }
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
            className="font-mono font-bold uppercase text-blue-600 dark:text-blue-400"
          />

          <FormInputField
            id="traveler-name"
            label="Tên Phân Loại"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              id="is_active_type_edit"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <Label htmlFor="is_active_type_edit" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              Kích hoạt áp dụng phân loại này
            </Label>
          </div>

          <div className="md:col-span-2">
            <FormField id="traveler-desc" label="Mô Tả & Điều Kiện Áp Dụng">
              <textarea
                id="traveler-desc"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full p-3 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 outline-none focus:border-blue-500"
              />
            </FormField>
          </div>
        </FormSectionBlock>
      </AdminFormCard>

      {/* Floating Action Bar for Unsaved Changes */}
      <UnsavedChangesBar
        isDirty={isDirty}
        isSaving={isSubmitting}
        onSave={() => handleSubmit()}
        onReset={handleReset}
      />
    </div>
  );
}
