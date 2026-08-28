import React, { useState, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Calendar, Clock, Ship } from 'lucide-react';
import { toast } from 'sonner';

import { createSchedule } from '@/apis/trips';
import { getRoutes } from '@/apis/journeys';
import { getBoats } from '@/apis/boats';
import { Boat, Route as JourneyRoute } from '@/types';
import {
  AdminFormHeader,
  AdminFormCard,
  FormSectionBlock,
  FormField,
  FormInputField,
  FormSelectField,
  AdminFormActionBar,
  useFormDirty,
} from '@/components/common/FormUtilities';

export const Route = createFileRoute('/_admin/schedules/create')({
  component: ScheduleCreatePage,
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

function ScheduleCreatePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ScheduleFormData>(emptyForm);

  const [routes, setRoutes] = useState<JourneyRoute[]>([]);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialData] = useState(emptyForm);
  const { isDirty } = useFormDirty(initialData, formData);

  useEffect(() => {
    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        const [routesRes, boatsRes] = await Promise.all([
          getRoutes({ limit: 100 }),
          getBoats({ limit: 100 }),
        ]);
        if (routesRes?.data && Array.isArray(routesRes.data)) {
          setRoutes(routesRes.data);
        }
        if (boatsRes?.data && Array.isArray(boatsRes.data)) {
          setBoats(boatsRes.data);
        }
      } catch (err) {
        console.error('Failed to load options for schedule:', err);
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, []);

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

  const clearDraft = () => {
    setFormData(emptyForm);
    toast.success('Đã làm sạch dữ liệu lịch chạy tàu');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

      await createSchedule({
        name: formData.name.trim(),
        route_id: formData.route_id || undefined,
        boat_id: formData.boat_id || undefined,
        start_time: startTimeFormatted,
        end_time: endTimeFormatted,
        days_of_week: formData.days.map((d) => d.toLowerCase()),
        status: formData.status,
        is_active: formData.status === 'active',
        reason: `Tạo lịch chạy định kỳ ${formData.name} từ dashboard`,
      } as any);

      toast.success(`Tạo thành công lịch chạy định kỳ: ${formData.name.trim()}`);
      navigate({ to: '/schedules' as any });
    } catch (err: any) {
      console.error('Create schedule error:', err);
      const serverMsg = err?.response?.data?.message || err?.message || '';
      toast.error(serverMsg || 'Có lỗi xảy ra khi tạo lịch chạy trên Backend Server');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 w-full font-sans pb-20 text-slate-800 dark:text-slate-200">
      {/* Top Header Navigation Bar */}
      <AdminFormHeader
        icon={Calendar}
        title="Tạo Lịch Chạy Định Kỳ Mới"
        subtitle="Cấu hình khung giờ chạy cố định (start_time, end_time) và tần suất các ngày trong tuần"
        backTo="/schedules"
        onClear={clearDraft}
        clearLabel="Làm sạch"
      />

      {/* Main Single Card Form */}
      <AdminFormCard onSubmit={handleSubmit}>
        {/* Section I: Thông tin cấu hình lịch chạy */}
        <FormSectionBlock title="I. Thông tin cấu hình lịch chạy" columns={2}>
          <div className="md:col-span-2">
            <FormInputField
              id="schedule-name"
              label="Tên Lịch Chạy Định Kỳ"
              required
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="VD: Hà Tiên - Phú Quốc (Superdong I) T2-T4-T6"
              helperText="Tên định danh mẫu lịch chạy hiển thị trên hệ thống"
            />
          </div>

          <FormSelectField
            id="schedule-route"
            label="Tuyến Hải Trình Áp Dụng"
            value={formData.route_id}
            onChange={(e) => updateField('route_id', e.target.value)}
            disabled={loadingOptions}
          >
            <option value="">-- Chọn tuyến hải trình --</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name || r.code} ({r.code})
              </option>
            ))}
          </FormSelectField>

          <FormSelectField
            id="schedule-boat"
            label="Tàu Phân Công Mặc Định"
            value={formData.boat_id}
            onChange={(e) => updateField('boat_id', e.target.value)}
            disabled={loadingOptions}
          >
            <option value="">-- Chọn tàu mặc định --</option>
            {boats.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code}) - {b.capacity} ghế
              </option>
            ))}
          </FormSelectField>

          <FormField id="schedule-start-time" label="Giờ khởi hành (start_time)" required>
            <div className="relative">
              <Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => updateField('start_time', e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 focus:border-blue-600 outline-none font-mono"
                required
              />
            </div>
          </FormField>

          <FormField id="schedule-end-time" label="Giờ cập bến dự kiến (end_time)" required>
            <div className="relative">
              <Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => updateField('end_time', e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 focus:border-blue-600 outline-none font-mono"
                required
              />
            </div>
          </FormField>
        </FormSectionBlock>

        {/* Section II: Tần suất & Trạng thái */}
        <FormSectionBlock title="II. Tần suất & Trạng thái" columns={1}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
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
                    className={`h-8 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
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

          <div className="max-w-md pt-2">
            <FormSelectField
              id="schedule-status"
              label="Trạng Thái Áp Dụng"
              required
              value={formData.status}
              onChange={(e) => updateField('status', e.target.value as 'active' | 'inactive')}
              options={[
                { value: 'active', label: 'Đang áp dụng' },
                { value: 'inactive', label: 'Tạm ngưng' },
              ]}
            />
          </div>
        </FormSectionBlock>

        {/* Master Action Bar */}
        <AdminFormActionBar
          mode="create"
          isSubmitting={isSubmitting}
          cancelTo="/schedules"
          submitLabel="Lưu lịch chạy tàu"
          onClear={clearDraft}
          clearLabel="Làm sạch"
        />
      </AdminFormCard>
    </div>
  );
}

