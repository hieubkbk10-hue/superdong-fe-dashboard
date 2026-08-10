import React, { useState } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { Ship, ArrowLeft, Save, Calendar, Clock, Route as RouteIcon } from 'lucide-react';
import { toast } from 'sonner';
import { createTrip } from '@/apis/trips';

export const Route = createFileRoute('/_admin/trips/create')({
  component: TripCreatePage,
});

function TripCreatePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    code: '',
    journey: 'Rạch Giá ➔ Phú Quốc',
    boatName: 'Superdong IX (SD-09)',
    departureDate: '2026-08-10',
    departureTime: '07:30',
    status: 'open' as 'open' | 'departed' | 'completed' | 'cancelled',
    note: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.journey || !formData.departureDate || !formData.departureTime) {
      toast.error('Vui lòng chọn đầy đủ tuyến, ngày và giờ xuất bến');
      return;
    }

    setIsSubmitting(true);
    try {
      await createTrip({
        route_id: 1,
        boat_id: 1,
        departure_time: `${formData.departureDate} ${formData.departureTime}:00`,
        arrival_time: `${formData.departureDate} 10:00:00`,
        status: formData.status as any,
        total_seats: 306,
        available_seats: 306,
        remarks: formData.note,
      });
      toast.success('Đã mở chuyến tàu mới thành công!');
      navigate({ to: '/trips' as any });
    } catch (err: any) {
      console.error('Create trip error:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Lỗi: Không thể tạo chuyến tàu mới trên Backend Server');
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
            to={"/trips" as any}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Quay lại danh sách chuyến"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Ship className="h-6 w-6 text-blue-600" />
              Mở Chuyến Tàu Thực Tế Mới
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Khởi tạo chuyến tàu vận tải hành khách thực tế để bắt đầu mở bán vé trên hệ thống
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Mã Chuyến Tàu (Tự động hoặc tùy chỉnh)
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="VD: TRIP-8827 (Để trống hệ thống sẽ tự sinh)"
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tuyến Hải Trình <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <RouteIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={formData.journey}
                onChange={(e) => setFormData({ ...formData, journey: e.target.value })}
                className="w-full h-10 pl-9 pr-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
              >
                <option value="Rạch Giá ➔ Phú Quốc">Rạch Giá ➔ Phú Quốc</option>
                <option value="Phú Quốc ➔ Rạch Giá">Phú Quốc ➔ Rạch Giá</option>
                <option value="Hà Tiên ➔ Phú Quốc">Hà Tiên ➔ Phú Quốc</option>
                <option value="Phú Quốc ➔ Hà Tiên">Phú Quốc ➔ Hà Tiên</option>
                <option value="Trần Đề ➔ Côn Đảo">Trần Đề ➔ Côn Đảo</option>
                <option value="Phan Thiết ➔ Phú Quý">Phan Thiết ➔ Phú Quý</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tàu Phân Công Khai Thác <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Ship size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={formData.boatName}
                onChange={(e) => setFormData({ ...formData, boatName: e.target.value })}
                className="w-full h-10 pl-9 pr-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
              >
                <option value="Superdong IX (SD-09)">Superdong IX (SD-09 - 306 ghế)</option>
                <option value="Superdong XII (SD-12)">Superdong XII (SD-12 - 275 ghế)</option>
                <option value="Superdong VI (SD-06)">Superdong VI (SD-06 - 306 ghế)</option>
                <option value="Superdong Côn Đảo I (SD-CD01)">Superdong Côn Đảo I (SD-CD01 - 306 ghế)</option>
                <option value="Superdong I (SD-01)">Superdong I (SD-01 - 275 ghế)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Trạng Thái Mở Bán
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
            >
              <option value="open">Đang mở bán vé</option>
              <option value="departed">Đã xuất bến</option>
              <option value="completed">Đã hoàn tất</option>
              <option value="cancelled">Tạm hủy chuyến</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Ngày Khởi Hành <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={formData.departureDate}
                onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                className="w-full h-10 pl-9 pr-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Giờ Xuất Bến <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="time"
                value={formData.departureTime}
                onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                className="w-full h-10 pl-9 pr-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
                required
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Ghi Chú Vận Hành / Thông Báo Cho Khách
            </label>
            <textarea
              rows={3}
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="VD: Chuyến tăng cường dịp lễ 2/9, khởi hành đúng giờ không đợi khách trễ..."
              className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <Link
            to={"/trips" as any}
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
            {isSubmitting ? 'Đang lưu...' : 'Lưu Chuyến Mới'}
          </button>
        </div>
      </form>
    </div>
  );
}
