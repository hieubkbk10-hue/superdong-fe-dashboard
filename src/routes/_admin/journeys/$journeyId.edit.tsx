import React, { useState } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { Route as RouteIcon, ArrowLeft, Save, Clock, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { updateJourney } from '@/apis/journeys';

export const Route = createFileRoute('/_admin/journeys/$journeyId/edit')({
  component: JourneyEditPage,
});

function JourneyEditPage() {
  const { journeyId } = Route.useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    code: 'J-RGPQ',
    name: 'Rạch Giá ↔ Phú Quốc',
    origin: 'Bến tàu Rạch Giá (RG)',
    destination: 'Bến tàu Phú Quốc (PQ)',
    distance: 65,
    duration: '2 tiếng 30 phút',
    status: 'active' as 'active' | 'inactive',
    description: 'Tuyến hải trình trọng điểm phục vụ du khách và người dân Kiên Giang đi đảo Phú Quốc.',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await updateJourney(journeyId, {
        code: formData.code,
        name: formData.name,
        distance_km: Number(formData.distance),
        description: formData.description,
        is_active: formData.status === 'active',
      });
      toast.success(`Đã lưu thay đổi cho tuyến ${formData.name} thành công!`, { id: 'journey-edit-toast' });
    } catch (err: any) {
      console.error('Update journey error:', err);
      const serverMsg = err?.response?.data?.message || err?.message || '';
      toast.error(serverMsg || 'Có lỗi xảy ra khi cập nhật tuyến trên Backend', { id: 'journey-edit-toast' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl font-sans">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={"/journeys" as any}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Quay lại danh sách tuyến"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <RouteIcon className="h-6 w-6 text-blue-600" />
              Chỉnh Sửa Tuyến: {formData.name} ({formData.code})
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              ID Tuyến hải trình trong hệ thống: <span className="font-mono">{journeyId}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Mã Tuyến (Journey Code) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm focus:border-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tên Tuyến Hải Trình <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Bến Xuất Phát (Origin Port) <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.origin}
              onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
            >
              <option value="Bến tàu Rạch Giá (RG)">Bến tàu Rạch Giá (RG)</option>
              <option value="Bến tàu Hà Tiên (HT)">Bến tàu Hà Tiên (HT)</option>
              <option value="Bến tàu Trần Đề (TD)">Bến tàu Trần Đề (TD)</option>
              <option value="Bến tàu Phan Thiết (PT)">Bến tàu Phan Thiết (PT)</option>
              <option value="Bến tàu Phú Quốc (PQ)">Bến tàu Phú Quốc (PQ)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Bến Đích Đến (Destination Port) <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
            >
              <option value="Bến tàu Phú Quốc (PQ)">Bến tàu Phú Quốc (PQ)</option>
              <option value="Bến tàu Côn Đảo (CD)">Bến tàu Côn Đảo (CD)</option>
              <option value="Bến tàu Phú Quý (PQY)">Bến tàu Phú Quý (PQY)</option>
              <option value="Bến tàu Rạch Giá (RG)">Bến tàu Rạch Giá (RG)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Khoảng Cách Hải Lý
            </label>
            <div className="relative">
              <Navigation size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                value={formData.distance}
                onChange={(e) => setFormData({ ...formData, distance: Number(e.target.value) })}
                className="w-full h-10 pl-9 pr-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Thời Gian Di Chuyển Dự Kiến
            </label>
            <div className="relative">
              <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full h-10 pl-9 pr-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Trạng Thái Vận Hành Tuyến
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
            >
              <option value="active">Đang khai thác</option>
              <option value="inactive">Tạm ngưng khai thác</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Mô Tả Tuyến
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <Link
            to={"/journeys" as any}
            className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Hủy bỏ
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
    </div>
  );
}
