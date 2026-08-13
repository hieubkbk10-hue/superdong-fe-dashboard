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
  code: string;
  route_id: string;
  boat_id: string;
  departureTime: string;
  days: string[];
  validFrom: string;
  validTo: string;
  status: 'active' | 'inactive';
  note: string;
}

const emptyForm: ScheduleFormData = {
  code: '',
  route_id: '',
  boat_id: '',
  departureTime: '07:30',
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  validFrom: '',
  validTo: '',
  status: 'active',
  note: '',
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
        const s: Schedule = scheduleRes;
        const serverForm: ScheduleFormData = {
          code: `SCH-${s.id}`,
          route_id: String(s.route_id || s.route?.id || ''),
          boat_id: String(s.boat_id || s.boat?.id || ''),
          departureTime: s.departure_time || s.start_time || '07:30',
          days: Array.isArray(s.days_of_week) ? s.days_of_week.map(String) : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          validFrom: s.effective_from || '',
          validTo: s.effective_to || '',
          status: s.is_active || s.status === 'active' ? 'active' : 'inactive',
          note: '',
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
    setIsSubmitting(true);

    try {
      await updateSchedule(scheduleId, {
        code: formData.code.trim().toUpperCase(),
        route_id: formData.route_id || undefined,
        boat_id: formData.boat_id || undefined,
        departure_time: formData.departureTime,
        arrival_time: '10:00',
        recurrence: formData.days.length === 7 ? 'daily' : 'weekly',
        is_active: formData.status === 'active',
        effective_from: formData.validFrom || undefined,
        effective_to: formData.validTo || undefined,
      });

      localStorage.removeItem(draftKey);
      toast.success(`Đã lưu thay đổi cho lịch chạy ${formData.code} thành công!`);
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
              Chỉnh Sửa Lịch Chạy Tàu {formData.code && `: ${formData.code}`}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Cập nhật khung giờ chạy cố định, tần suất khai thác và tàu phân công
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
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Mã lịch chạy định kỳ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => updateField('code', e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 32))}
                placeholder="VD: SCH-RG-01"
                className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm focus:border-blue-500 outline-none"
                required
              />
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
                Giờ xuất bến cố định <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="time"
                  value={formData.departureTime}
                  onChange={(e) => updateField('departureTime', e.target.value)}
                  className="w-full h-10 pl-9 pr-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm focus:border-blue-500 outline-none"
                  required
                />
              </div>
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
          </div>

          <div className="px-5 py-3 bg-[#EBF7FA] border-y border-cyan-100 text-sm font-bold text-slate-800 uppercase">
            II. Tần suất & Thời gian áp dụng
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Các ngày chạy trong tuần
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
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Hiệu lực từ ngày</label>
                <input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => updateField('validFrom', e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Đến hết ngày</label>
                <input
                  type="date"
                  value={formData.validTo}
                  onChange={(e) => updateField('validTo', e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="px-5 py-3 bg-[#EBF7FA] border-y border-cyan-100 text-sm font-bold text-slate-800 uppercase">
            III. Trạng thái & Ghi chú
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Ghi chú vận hành (Không bắt buộc)</label>
              <input
                type="text"
                value={formData.note}
                onChange={(e) => updateField('note', e.target.value)}
                placeholder="VD: Lịch chạy sáng cố định quanh năm"
                className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
              />
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
