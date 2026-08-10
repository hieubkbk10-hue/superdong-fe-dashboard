import React, { useState } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { Calendar, ArrowLeft, Save, Clock, Ship } from 'lucide-react';
import { toast } from 'sonner';
import { updateSchedule } from '@/apis/trips';

export const Route = createFileRoute('/_admin/schedules/$scheduleId/edit')({
  component: ScheduleEditPage,
});

function ScheduleEditPage() {
  const { scheduleId } = Route.useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    code: 'SCH-RG-01',
    journey: 'Rạch Giá ➔ Phú Quốc',
    departureTime: '07:30',
    boatName: 'Superdong IX (SD-09)',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    status: 'active' as 'active' | 'inactive',
    note: 'Khung giờ sáng cố định quanh năm.',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleDay = (dayCode: string) => {
    setFormData((prev) => ({
      ...prev,
      days: prev.days.includes(dayCode)
        ? prev.days.filter((d) => d !== dayCode)
        : [...prev.days, dayCode],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await updateSchedule(scheduleId, {
        departure_time: formData.departureTime,
        arrival_time: '10:00',
        recurrence: 'daily',
        is_active: formData.status === 'active',
        effective_from: formData.validFrom || undefined,
        effective_to: formData.validTo || undefined,
      });
      toast.success(`Đã lưu thay đổi cho lịch chạy ${formData.code}`, { id: 'schedule-edit-toast' });
      navigate({ to: '/schedules' as any });
    } catch (err: any) {
      console.error('Update schedule error:', err);
      const serverMsg = err?.response?.data?.message || err?.message || '';
      toast.error(serverMsg || 'Có lỗi xảy ra khi cập nhật lịch chạy trên Backend', { id: 'schedule-edit-toast' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const WEEKDAYS = [
    { label: 'Thứ 2', code: 'Mon' },
    { label: 'Thứ 3', code: 'Tue' },
    { label: 'Thứ 4', code: 'Wed' },
    { label: 'Thứ 5', code: 'Thu' },
    { label: 'Thứ 6', code: 'Fri' },
    { label: 'Thứ 7', code: 'Sat' },
    { label: 'Chủ Nhật', code: 'Sun' },
  ];

  return (
    <div className="space-y-6 max-w-4xl font-sans">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={"/schedules" as any}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Quay lại danh sách lịch"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-6 w-6 text-blue-600" />
              Chỉnh Sửa Lịch Chạy: {formData.code}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              ID Lịch chạy trong hệ thống: <span className="font-mono">{scheduleId}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Mã Lịch Chạy (Schedule Code) <span className="text-red-500">*</span>
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
              Tuyến Hải Trình Khai Thác <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.journey}
              onChange={(e) => setFormData({ ...formData, journey: e.target.value })}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
            >
              <option value="Rạch Giá ➔ Phú Quốc">Rạch Giá ➔ Phú Quốc</option>
              <option value="Phú Quốc ➔ Rạch Giá">Phú Quốc ➔ Rạch Giá</option>
              <option value="Hà Tiên ➔ Phú Quốc">Hà Tiên ➔ Phú Quốc</option>
              <option value="Trần Đề ➔ Côn Đảo">Trần Đề ➔ Côn Đảo</option>
              <option value="Phan Thiết ➔ Phú Quý">Phan Thiết ➔ Phú Quý</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Giờ Xuất Bến Mặc Định (Departure Time) <span className="text-red-500">*</span>
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

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tàu Phân Công Mặc Định
            </label>
            <div className="relative">
              <Ship size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={formData.boatName}
                onChange={(e) => setFormData({ ...formData, boatName: e.target.value })}
                className="w-full h-10 pl-9 pr-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
              >
                <option value="Superdong IX (SD-09)">Superdong IX (SD-09 - 306 ghế)</option>
                <option value="Superdong VI (SD-06)">Superdong VI (SD-06 - 306 ghế)</option>
                <option value="Superdong XII (SD-12)">Superdong XII (SD-12 - 275 ghế)</option>
                <option value="Superdong Côn Đảo I (SD-CD01)">Superdong Côn Đảo I (SD-CD01 - 306 ghế)</option>
                <option value="Superdong I (SD-01)">Superdong I (SD-01 - 275 ghế)</option>
              </select>
            </div>
          </div>

          {/* Days of Week */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Các Ngày Chạy Trong Tuần <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => {
                const isSelected = formData.days.includes(day.code);
                return (
                  <button
                    key={day.code}
                    type="button"
                    onClick={() => toggleDay(day.code)}
                    className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Ngày Bắt Đầu Áp Dụng
            </label>
            <input
              type="date"
              value={formData.validFrom}
              onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Ngày Kết Thúc Áp Dụng
            </label>
            <input
              type="date"
              value={formData.validTo}
              onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Trạng Thái Kích Hoạt
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
            >
              <option value="active">Đang áp dụng</option>
              <option value="inactive">Tạm ngưng áp dụng</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Ghi Chú Điều Hành
            </label>
            <textarea
              rows={3}
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <Link
            to={"/schedules" as any}
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
