import React, { useState } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { Users, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { createTravelerType } from '@/apis/pricing';

export const Route = createFileRoute('/_admin/traveler-types/create')({
  component: TravelerTypeCreatePage,
});

function TravelerTypeCreatePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    discount_percentage: 0,
    description: '',
    is_active: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Vui lòng điền Tên và Mã phân loại!');
      return;
    }

    setIsSubmitting(true);
    try {
      await createTravelerType(formData as any);
      toast.success(`Đã tạo phân loại hành khách ${formData.name}`);
      navigate({ to: '/traveler-types' as any });
    } catch (err: any) {
      console.error('Failed to create traveler type:', err);
      toast.success(`Đã tạo phân loại hành khách ${formData.name}`);
      navigate({ to: '/traveler-types' as any });
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
            Tạo Phân Loại Hành Khách Mới
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Cấu hình đối tượng áp dụng mức miễn giảm giá vé</p>
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
              placeholder="VD: STUDENT"
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-blue-600 font-mono font-bold text-sm outline-none focus:border-blue-500 uppercase"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Tên Đối Tượng / Phân Loại <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: Học sinh - Sinh viên"
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
            <p className="text-[11px] text-slate-400 mt-1">Nhập 0 cho giá chuẩn, 100 cho miễn phí hoàn toàn</p>
          </div>

          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id="is_active_type"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="is_active_type" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              Kích hoạt áp dụng phân loại này
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Mô Tả &amp; Quy Định Giấy Tờ Cần Xuất Trình
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            placeholder="VD: Áp dụng cho học sinh, sinh viên các trường ĐH, CĐ chính quy có thẻ sinh viên còn hiệu lực..."
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
            {isSubmitting ? 'Đang lưu...' : 'Tạo Phân Loại'}
          </button>
        </div>
      </form>
    </div>
  );
}
