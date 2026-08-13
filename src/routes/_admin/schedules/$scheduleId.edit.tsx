import React, { useState, useEffect } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { Calendar, ArrowLeft, Save, RefreshCw, Clock, Ship, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { findSchedule, updateSchedule } from '@/apis/trips';
import { getRoutes } from '@/apis/journeys';
import { getBoats } from '@/apis/boats';
import { Boat, Route as JourneyRoute, Schedule } from '@/types';

export const Route = createFileRoute('/_admin/schedules/$scheduleId/edit')({
  component: ScheduleEditPage,
});

interface ScheduleFormData {
  name: string;
  route_id: string;
  boat_id: string;
  start_time: string;
  end_time: string;
  days: string[];
  status: 'active' | 'inactive';
}

const emptyForm: ScheduleFormData = {
  name: '',
  route_id: '',
  boat_id: '',
  start_time: '07:30',
  end_time: '09:00',
  days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
  status: 'active',
};

const WEEKDAYS = [
  { label: 'Thứ 2', code: 'mon' },
  { label: 'Thứ 3', code: 'tue' },
  { label: 'Thứ 4', code: 'wed' },
  { label: 'Thứ 5', code: 'thu' },
  { label: 'Thứ 6', code: 'fri' },
  { label: 'Thứ 7', code: 'sat' },
  { label: 'Chủ Nhật', code: 'sun' },
];

function ScheduleEditPage() {
  const { scheduleId } = Route.useParams();
  const navigate = useNavigate();
  const draftKey = `superdong_schedules_draft_edit_${scheduleId}`;
  const cacheKey = `superdong_schedule_cache_${scheduleId}`;

  const [formData, setFormData] = useState<ScheduleFormData>(emptyForm);
  const [routes, setRoutes] = useState<JourneyRoute[]>([]);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hydrateSchedule = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const [scheduleRes, routesRes, boatsRes] = await Promise.all([
        findSchedule(scheduleId),
        getRoutes({ limit: 100 }),
        getBoats({ limit: 100 }),
      ]);

      if (routesRes?.data && Array.isArray(routesRes.data)) {
        setRoutes(routesRes.data);
      }
      if (boatsRes?.data && Array.isArray(boatsRes.data)) {
        setBoats(boatsRes.data);
      }

      if (scheduleRes) {
        const s: any = scheduleRes;

        const daysNormalized = Array.isArray(s.days_of_week)
          ? s.days_of_week.map((d: any) => String(d).toLowerCase())
          : ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

        const startTimeClean = String(s.start_time || s.departure_time || '07:30:00').slice(0, 5);
        const endTimeClean = String(s.end_time || s.arrival_time || '09:00:00').slice(0, 5);

        const serverForm: ScheduleFormData = {
          name: s.name || `SCH-${String(scheduleId).slice(0, 5).toUpperCase()}`,
          route_id: String(s.route_id || s.route?.id || ''),
          boat_id: String(s.boat_id || s.boat?.id || ''),
          start_time: startTimeClean,
          end_time: endTimeClean,
          days: daysNormalized,
          status: s.status === 'active' || s.is_active === true ? 'active' : 'inactive',
        };

        let nextForm = serverForm;
        try {
          const draftStr = localStorage.getItem(draftKey);
          if (draftStr) {
            nextForm = { ...serverForm, ...JSON.parse(draftStr) };
          }
        } catch (_) {}

        setFormData(nextForm);
        localStorage.setItem(cacheKey, JSON.stringify({ id: String(scheduleId), ...serverForm }));
      } else {
        setApiError('Dữ liệu lịch chạy có thể đã bị xóa hoặc không còn tồn tại trên Server');
      }
    } catch (err: any) {
      console.error('Hydrate schedule error:', err);
      const message = err?.response?.data?.message || err?.message || 'Không thể tải lịch chạy tàu';
      setApiError(message);
      toast.error(`Không tải được thông tin lịch chạy. ${message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    hydrateSchedule();
  }, [scheduleId]);

  useEffect(() => {
    if (!loading && !apiError) {
      localStorage.setItem(draftKey, JSON.stringify(formData));
    }
  }, [formData, loading, apiError, draftKey]);

  const updateField = <K extends keyof ScheduleFormData>(field: K, value: ScheduleFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

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

    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập Tên lịch chạy định kỳ');
      return;
    }

    if (!formData.start_time || !formData.end_time) {
      toast.error('Vui lòng chọn đầy đủ Giờ khởi hành và Giờ cập bến');
      return;
    }

    setIsSubmitting(true);

    try {
      const startTimeFormatted = formData.start_time.length === 5 ? `${formData.start_time}:00` : formData.start_time;
      const endTimeFormatted = formData.end_time.length === 5 ? `${formData.end_time}:00` : formData.end_time;

      await updateSchedule(scheduleId, {
        name: formData.name.trim(),
        route_id: formData.route_id || undefined,
        boat_id: formData.boat_id || undefined,
        start_time: startTimeFormatted,
        end_time: endTimeFormatted,
        days_of_week: formData.days.map((d) => d.toLowerCase()),
        status: formData.status,
        is_active: formData.status === 'active',
        reason: `Cập nhật lịch chạy định kỳ ${formData.name} từ dashboard`,
      } as any);

      localStorage.removeItem(draftKey);
      toast.success(`Đã lưu thay đổi cho lịch chạy ${formData.name} thành công!`);
      await hydrateSchedule();
    } catch (err: any) {
      console.error('Update schedule error:', err);
      const serverMsg = err?.response?.data?.message || err?.message || '';
      toast.error(serverMsg || 'Có lỗi xảy ra khi cập nhật lịch chạy trên Backend');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 w-full font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/schedules"
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Quay lại danh sách lịch"
            onClick={() => localStorage.removeItem(draftKey)}
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-6 w-6 text-blue-600" />
              Chỉnh Sửa Lịch Chạy Tàu {formData.name && `: ${formData.name}`}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Cập nhật khung giờ chạy cố định (start_time, end_time), tần suất khai thác và tàu phân công
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={hydrateSchedule}
          disabled={loading}
          className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer disabled:opacity-60"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Đồng bộ
        </button>
      </div>

      {apiError && !loading ? (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium flex items-start gap-2.5">
          <AlertTriangle size={18} className="shrink-0 text-rose-500" />
          <span>Không tải được dữ liệu lịch chạy tàu. {apiError}</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
          <div className="px-5 py-3 bg-[#EBF7FA] border-b border-cyan-100 text-sm font-bold text-slate-800 uppercase">
            I. Thông tin cấu hình lịch chạy
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tên lịch chạy định kỳ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="VD: Hà Tiên - Phú Quốc (Superdong I) T2-T4-T6"
                className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
                required
              />
              <p className="mt-1 text-[11px] text-slate-500">Tên định danh lịch chạy (VD: Hà Tiên - Phú Quốc (Superdong I) T2-T4-T6)</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tuyến hải trình áp dụng
              </label>
              <select
                value={formData.route_id}
                onChange={(e) => updateField('route_id', e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
              >
                <option value="">-- Chọn tuyến hải trình --</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name || r.code} ({r.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tàu phân công mặc định
              </label>
              <div className="relative">
                <Ship size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={formData.boat_id}
                  onChange={(e) => updateField('boat_id', e.target.value)}
                  className="w-full h-10 pl-9 pr-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
                >
                  <option value="">-- Chọn tàu mặc định --</option>
                  {boats.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code}) - {b.capacity} ghế
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Giờ khởi hành (start_time) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => updateField('start_time', e.target.value)}
                  className="w-full h-10 pl-9 pr-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm focus:border-blue-500 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Giờ cập bến dự kiến (end_time) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => updateField('end_time', e.target.value)}
                  className="w-full h-10 pl-9 pr-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm focus:border-blue-500 outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <div className="px-5 py-3 bg-[#EBF7FA] border-y border-cyan-100 text-sm font-bold text-slate-800 uppercase">
            II. Tần suất & Trạng thái
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Các ngày chạy trong tuần (days_of_week)
              </label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => {
                  const isSelected = formData.days.includes(day.code);
                  return (
                    <button
                      key={day.code}
                      type="button"
                      onClick={() => toggleDay(day.code)}
                      className={`h-9 px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Trạng thái áp dụng</label>
                <select
                  value={formData.status}
                  onChange={(e) => updateField('status', e.target.value as 'active' | 'inactive')}
                  className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
                >
                  <option value="active">Đang áp dụng</option>
                  <option value="inactive">Tạm ngưng</option>
                </select>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Link
              to="/schedules"
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
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
