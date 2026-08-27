import { UnsavedChangesBar } from '@/components/common/UnsavedChangesBar';
import { useFormDirty } from '@/components/common/FormUtilities';
import React, { useState } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { Users, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { updateTravelerType } from '@/apis/pricing';

export const Route = createFileRoute('/_admin/traveler-types/$typeId/edit')({
  component: TravelerTypeEditPage,
});

function TravelerTypeEditPage() {
  const { typeId } = Route.useParams();
  const navigate = useNavigate();

  const [initialData, setInitialData] = useState<any>(null);
  const [formData, setFormData] = useState({
    code: 'CHILD',
    name: 'Trẻ em',
    discount_percentage: 25,
    description: 'Trẻ em từ 6 đến 11 tuổi (Tính theo năm sinh trên CCCD/Giấy khai sinh).',
    is_active: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isDirty } = useFormDirty(initialData, formData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateTravelerType(typeId, {
        code: formData.code,
        name: formData.name,
        discount_percentage: Number(formData.discount_percentage),
        description: formData.description,
        is_active: formData.is_active,
      });
      toast.success(`Đã cập nhật thay đổi cho phân loại ${formData.name} thành công!`, { id: 'traveler-type-edit-toast' });
    } catch (err: any) {
      console.error('Failed to update traveler type:', err);
      const serverMsg = err?.response?.data?.message || err?.message || '';
      toast.error(serverMsg || 'Có lỗi xảy ra khi cập nhật phân loại hành khách trên Backend', { id: 'traveler-type-edit-toast' });
    } finally {
      setIsSubmitting(false);
    }
  };

  

  return (
    <div className="space-y-6 max-w-3xl font-sans pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to={'/traveler-types' as any}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          title="Quay lại danh sách"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Chỉnh Sửa Phân Loại: {formData.name} ({formData.code})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ID trong hệ thống: <span className="font-mono">{typeId}</span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Mã Phân Loại (CODE) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-blue-600 font-mono font-bold text-sm outline-none focus:border-blue-500 uppercase"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Tên Phân Loại <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Mức Giảm Giá Vé (%) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={formData.discount_percentage}
              onChange={(e) => setFormData({ ...formData, discount_percentage: Number(e.target.value) })}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 font-bold"
              required
            />
          </div>

          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id="is_active_type_edit"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="is_active_type_edit" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              Kích hoạt áp dụng phân loại này
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Mô Tả &amp; Điều Kiện Áp Dụng
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500"
          />
        </div>

        {/* Action buttons */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <Link
            to={'/traveler-types' as any}
            className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Hủy Bỏ
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save size={16} />
            {isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
          </button>
        </div>
      </form>

      <UnsavedChangesBar isDirty={isDirty} isSaving={isSubmitting} onSave={() => handleSubmit({ preventDefault: () => {} } as any)} onReset={() => { if (initialData) setFormData(initialData); }} />
    </div>
  );
}
