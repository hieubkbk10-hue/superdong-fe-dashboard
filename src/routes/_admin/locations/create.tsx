import React, { useEffect, useState } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { MapPin, ArrowLeft, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { createLocation } from '@/apis/journeys';

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

const draftKey = 'superdong_locations_draft_create';

function LocationCreatePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LocationFormData>(() => {
    try {
      return { ...emptyForm, ...JSON.parse(localStorage.getItem(draftKey) || '{}') };
    } catch {
      return emptyForm;
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    localStorage.setItem(draftKey, JSON.stringify(formData));
  }, [formData]);

  const updateField = <K extends keyof LocationFormData>(field: K, value: LocationFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const clearDraft = () => {
    setFormData(emptyForm);
    localStorage.removeItem(draftKey);
    toast.success('Đã làm sạch dữ liệu nhập bến tàu');
  };

  const validateForm = () => {
    if (!formData.code.trim()) {
      toast.error('Vui lòng nhập mã bến tàu');
      return false;
    }
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên bến tàu');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !validateForm()) return;

    setIsSubmitting(true);
    try {
      await createLocation({
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        status: formData.status,
      });
      localStorage.removeItem(draftKey);
      toast.success(`Đã tạo bến tàu ${formData.name.trim()}`);
      navigate({ to: '/locations' as any });
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không thể tạo bến tàu';
      toast.error(`Tạo bến tàu thất bại. ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 w-full font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to={'/locations' as any}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Quay lại danh sách bến tàu"
            onClick={() => localStorage.removeItem(draftKey)}
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="h-6 w-6 text-blue-600" />
              Thêm bến tàu
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Khai báo mã bến, tên bến và trạng thái sử dụng trong mạng lưới tuyến tàu.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={clearDraft}
          className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
        >
          <RotateCcw size={14} /> Làm sạch dữ liệu
        </button>
      </div>

      <form onSubmit={handleSubmit} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-3 bg-[#EBF7FA] border-b border-cyan-100 text-sm font-bold text-slate-800 uppercase">
          I. Thông tin cơ bản
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Mã bến tàu <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => updateField('code', e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 32))}
              placeholder="VD: RG, PQ, HT"
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm focus:border-blue-500 outline-none"
              required
            />
            <p className="mt-1 text-[11px] text-slate-500">Dùng chữ hoa, số, gạch ngang hoặc gạch dưới. Tối đa 32 ký tự.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tên bến tàu <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value.slice(0, 120))}
              placeholder="VD: Bến tàu Rạch Giá"
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
              required
            />
          </div>
        </div>

        <div className="px-5 py-3 bg-[#EBF7FA] border-y border-cyan-100 text-sm font-bold text-slate-800 uppercase">
          II. Trạng thái sử dụng
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Trạng thái</label>
            <select
              value={formData.status}
              onChange={(e) => updateField('status', e.target.value as LocationFormData['status'])}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
            >
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Tạm ngưng</option>
            </select>
            <p className="mt-1 text-[11px] text-slate-500">Bến đang hoạt động có thể được dùng trong cấu hình tuyến/chuyến.</p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <Link
            to={'/locations' as any}
            onClick={() => localStorage.removeItem(draftKey)}
            className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Hủy bỏ
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <Save size={16} />
            {isSubmitting ? 'Đang lưu...' : 'Lưu bến tàu'}
          </button>
        </div>
      </form>
    </div>
  );
}
