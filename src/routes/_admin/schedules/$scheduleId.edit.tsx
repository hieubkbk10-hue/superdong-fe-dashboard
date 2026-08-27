import { useFormDirty } from '@/components/common/FormUtilities';
import { UnsavedChangesBar } from '@/components/common/UnsavedChangesBar';
import React, { useState, useEffect, useMemo } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import {
  Calendar,
  CalendarPlus,
  ArrowLeft,
  Save,
  RefreshCw,
  Clock,
  Ship,
  AlertTriangle,
  Layers,
  CheckCircle2,
  Lock,
  Unlock,
  Play,
  CheckCheck,
  XCircle,
  ExternalLink,
  Edit,
  Info,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  findSchedule,
  updateSchedule,
  getAllTrips,
  generateTripsFromSchedule,
  openTripForSale,
  closeTripForSale,
} from '@/apis/trips';
import { getRoutes } from '@/apis/journeys';
import { getBoats } from '@/apis/boats';
import { Boat, Route as JourneyRoute, Schedule, Trip, TripStatus } from '@/types';
import { Button } from '@/components/common/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  version: number;
}

const emptyForm: ScheduleFormData = {
  name: '',
  route_id: '',
  boat_id: '',
  start_time: '07:30',
  end_time: '09:00',
  days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
  status: 'active',
  version: 1,
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

const STATUS_LABELS: Record<string, { label: string; colorClass: string; icon: any }> = {
  draft: {
    label: 'Bản nháp',
    colorClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    icon: Clock,
  },
  selling: {
    label: 'Đang mở bán',
    colorClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    icon: CheckCircle2,
  },
  closed: {
    label: 'Đã khóa sổ',
    colorClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    icon: Lock,
  },
  started: {
    label: 'Đã xuất bến',
    colorClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    icon: Play,
  },
  completed: {
    label: 'Hoàn thành',
    colorClass: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    icon: CheckCheck,
  },
  cancelled: {
    label: 'Đã hủy',
    colorClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    icon: XCircle,
  },
};

function formatTime(isoStr?: string) {
  if (!isoStr) return '--:--';
  const parts = isoStr.includes('T') ? isoStr.split('T')[1] : isoStr.split(' ')[1];
  return parts ? parts.slice(0, 5) : isoStr.slice(0, 5);
}

function formatDate(isoStr?: string) {
  if (!isoStr) return '--/--/----';
  const datePart = isoStr.includes('T') ? isoStr.split('T')[0] : isoStr.split(' ')[0];
  const [y, m, d] = datePart.split('-');
  return `${d}/${m}/${y}`;
}

function getTodayString() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function getFutureDateString(daysAhead: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

function ScheduleEditPage() {
  const { scheduleId } = Route.useParams();
  const draftKey = `superdong_schedule_draft_edit_${scheduleId}`;
  const cacheKey = `superdong_schedule_cache_${scheduleId}`;

  const [initialData, setInitialData] = useState<ScheduleFormData | null>(null);
  const [formData, setFormData] = useState<ScheduleFormData>(emptyForm);
  const [scheduleCode, setScheduleCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { isDirty } = useFormDirty(initialData, formData, ['version']);

  // Metadata
  const [routes, setRoutes] = useState<JourneyRoute[]>([]);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [linkedTrips, setLinkedTrips] = useState<Trip[]>([]);

  // Generation Modal State
  const [openGenerateModal, setOpenGenerateModal] = useState(false);
  const [fromDate, setFromDate] = useState(getTodayString());
  const [toDate, setToDate] = useState(getFutureDateString(30));
  const [publishImmediate, setPublishImmediate] = useState(true);
  const [generateReason, setGenerateReason] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const hydrateSchedule = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const [scheduleRes, routesRes, boatsRes, allTripsRes] = await Promise.all([
        findSchedule(scheduleId),
        getRoutes({ limit: 100 }).catch(() => null),
        getBoats({ limit: 100 }).catch(() => null),
        getAllTrips().catch(() => []),
      ]);

      const sch: any = scheduleRes;
      if (!sch) {
        throw new Error('Không tìm thấy dữ liệu lịch chạy từ hệ thống');
      }

      setScheduleCode(sch.code || `SCH-${String(scheduleId).slice(0, 6).toUpperCase()}`);

      if (routesRes?.data && Array.isArray(routesRes.data)) {
        setRoutes(routesRes.data);
      }
      if (boatsRes?.data && Array.isArray(boatsRes.data)) {
        setBoats(boatsRes.data);
      }

      let parsedDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
      if (Array.isArray(sch.days_of_week)) {
        parsedDays = sch.days_of_week.map((d: any) => String(d).toLowerCase());
      } else if (typeof sch.days_of_week === 'string') {
        try {
          const arr = JSON.parse(sch.days_of_week);
          if (Array.isArray(arr)) parsedDays = arr.map((d: any) => String(d).toLowerCase());
        } catch {
          parsedDays = sch.days_of_week.split(',').map((d: string) => d.trim().toLowerCase());
        }
      }

      const serverForm: ScheduleFormData = {
        name: sch.name || '',
        route_id: String(sch.route_id || sch.route?.id || ''),
        boat_id: String(sch.boat_id || sch.boat?.id || ''),
        start_time: sch.start_time ? sch.start_time.slice(0, 5) : '07:30',
        end_time: sch.end_time ? sch.end_time.slice(0, 5) : '09:00',
        days: parsedDays,
        status: sch.status === 'inactive' || sch.is_active === false ? 'inactive' : 'active',
        version: typeof sch.version === 'number' ? sch.version : 1,
      };

      let nextForm = serverForm;
      try {
        const draft = JSON.parse(localStorage.getItem(draftKey) || 'null');
        if (draft) nextForm = { ...serverForm, ...draft };
      } catch {}

      setInitialData(serverForm);
      setFormData(nextForm);
      localStorage.setItem(cacheKey, JSON.stringify({ id: String(scheduleId), ...serverForm }));

      // Filter linked trips
      const allTrips = Array.isArray(allTripsRes) ? allTripsRes : [];
      const matched = allTrips.filter(
        (t: any) => String(t.schedule_id) === String(scheduleId) || (t.schedule && String(t.schedule.id) === String(scheduleId))
      );
      setLinkedTrips(matched);
    } catch (err: any) {
      console.error('Fetch schedule error:', err);
      const serverMsg = err?.response?.data?.message || err?.message || '';
      setApiError(serverMsg || 'Không thể tải chi tiết lịch chạy từ Backend');
      toast.error(`Không thể tải dữ liệu lịch chạy. ${serverMsg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    hydrateSchedule();
  }, [scheduleId]);

  // Draft persistence
  useEffect(() => {
    if (!loading && !apiError) {
      try {
        localStorage.setItem(draftKey, JSON.stringify(formData));
      } catch {}
    }
  }, [formData, loading, apiError, draftKey]);

  const updateField = <K extends keyof ScheduleFormData>(field: K, value: ScheduleFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleDay = (dayCode: string) => {
    setFormData((prev) => {
      const exists = prev.days.includes(dayCode);
      const nextDays = exists ? prev.days.filter((d) => d !== dayCode) : [...prev.days, dayCode];
      return { ...prev, days: nextDays };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập Tên lịch chạy');
      return;
    }

    if (formData.days.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 ngày chạy trong tuần');
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
        expected_version: formData.version,
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

  const handleQuickToggleTripSale = async (trip: Trip) => {
    try {
      if (trip.status === 'selling') {
        await closeTripForSale(trip.id, { expected_version: trip.version, reason: 'Khóa sổ chuyến từ trang Lịch chạy' });
        toast.success(`Đã khóa bán vé cho chuyến TRIP-${String(trip.id).slice(0, 6).toUpperCase()}`);
      } else {
        await openTripForSale(trip.id, { expected_version: trip.version, reason: 'Mở bán vé chuyến từ trang Lịch chạy' });
        toast.success(`Đã mở bán vé cho chuyến TRIP-${String(trip.id).slice(0, 6).toUpperCase()}`);
      }
      await hydrateSchedule();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể thay đổi trạng thái bán vé');
    }
  };

  const handleExecuteGenerateTrips = async () => {
    if (!fromDate || !toDate) {
      toast.error('Vui lòng chọn khoảng ngày');
      return;
    }
    if (new Date(fromDate) > new Date(toDate)) {
      toast.error('Ngày bắt đầu không được lớn hơn ngày kết thúc');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await generateTripsFromSchedule(scheduleId, {
        from_date: fromDate,
        to_date: toDate,
        publish: publishImmediate,
        reason: generateReason.trim() || `Sinh chuyến định kỳ ${formData.name || scheduleCode}`,
      });

      const summary = res?.data;
      const created = summary?.created_count ?? 0;
      const skipped = summary?.skipped_count ?? 0;

      toast.success(`Đã tạo thành công ${created} chuyến thực tế mới (Bỏ qua ${skipped} chuyến đã tồn tại).`);
      setOpenGenerateModal(false);
      await hydrateSchedule();
    } catch (err: any) {
      console.error('Generate trips error:', err);
      toast.error(`Sinh chuyến thất bại: ${err?.response?.data?.message || err?.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const boatsMap = useMemo(() => new Map(boats.map((b) => [String(b.id), b])), [boats]);
  const routesMap = useMemo(() => new Map(routes.map((r) => [String(r.id), r])), [routes]);

  

  return (
    <div className="space-y-6 w-full font-sans">
      {/* Header */}
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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="h-6 w-6 text-blue-600" />
                Chỉnh Sửa Lịch Chạy Định Kỳ
              </h1>
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${formData.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                {formData.status === 'active' ? 'Đang áp dụng' : 'Tạm ngưng'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Quản lý khung giờ xuất bến, ngày áp dụng trong tuần và phân công đội tàu.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setFromDate(getTodayString());
              setToDate(getFutureDateString(30));
              setPublishImmediate(true);
              setGenerateReason(`Khởi tạo chuyến từ lịch ${formData.name || scheduleCode}`);
              setOpenGenerateModal(true);
            }}
            className="h-9 px-3 text-xs font-semibold border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300 gap-1.5"
          >
            <CalendarPlus size={14} className="text-blue-600 dark:text-blue-400" />
            <span>Sinh Chuyến Theo Lịch</span>
          </Button>

          <button
            type="button"
            onClick={hydrateSchedule}
            disabled={loading}
            className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer disabled:opacity-60"
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {apiError && !loading ? (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium flex items-start gap-2.5">
          <AlertTriangle size={18} className="shrink-0 text-rose-500" />
          <span>Không tải được dữ liệu lịch chạy. {apiError}</span>
        </div>
      ) : (
        <>
          {/* Main Single Card Form */}
          <form onSubmit={handleSubmit} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
            {/* Section I */}
            <div className="px-5 py-3 bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200/60 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center justify-between">
              <span>I. Thông tin lịch mẫu & Tuyến chạy</span>
              <span className="text-xs font-mono font-normal text-slate-500 lowercase">
                Mã: {scheduleCode}
              </span>
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
                  placeholder="VD: Rạch Giá - Phú Quốc (Sáng T2-T6)"
                  className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
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
                  disabled={loading}
                  className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none disabled:opacity-60"
                >
                  <option value="">-- Chọn tuyến hải trình --</option>
                  {routes.map((r) => (
                    <option key={r.id} value={String(r.id)}>
                      {r.name || r.code} {r.code ? `(${r.code})` : ''}
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
                    disabled={loading}
                    className="w-full h-10 pl-9 pr-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none disabled:opacity-60"
                  >
                    <option value="">-- Chọn tàu mặc định --</option>
                    {boats.map((b) => (
                      <option key={b.id} value={String(b.id)}>
                        {b.name} {b.code ? `(${b.code})` : ''} — {b.total_capacity || 300} chỗ
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section II */}
            <div className="px-5 py-3 bg-slate-100/70 dark:bg-slate-800/60 border-y border-slate-200/60 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
              II. Khung giờ & Các ngày trong tuần
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Giờ khởi hành xuất bến <span className="text-red-500">*</span>
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
                    Giờ cập bến dự kiến <span className="text-red-500">*</span>
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

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Các ngày chạy trong tuần <span className="text-red-500">*</span>
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
            </div>

            {/* Section III */}
            <div className="px-5 py-3 bg-slate-100/70 dark:bg-slate-800/60 border-y border-slate-200/60 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
              III. Trạng thái khai thác
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
            </div>

            {/* Form Action Bar */}
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

      <UnsavedChangesBar isDirty={isDirty} isSaving={isSubmitting} onSave={() => handleSubmit({ preventDefault: () => {} } as any)} onReset={() => { if (initialData) setFormData(initialData); }} />

          {/* Section IV: Linked Trips Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
            <div className="px-5 py-3 bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200/60 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ship size={16} className="text-blue-600" />
                <span>IV. Danh Sách Chuyến Tàu Đã Sinh ({linkedTrips.length} chuyến)</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setFromDate(getTodayString());
                  setToDate(getFutureDateString(30));
                  setPublishImmediate(true);
                  setGenerateReason(`Khởi tạo chuyến từ lịch ${formData.name || scheduleCode}`);
                  setOpenGenerateModal(true);
                }}
                className="h-7 text-xs px-2.5 bg-white dark:bg-slate-900 font-semibold border-blue-300 text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 gap-1"
              >
                <CalendarPlus size={13} />
                <span>+ Sinh Thêm Chuyến</span>
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Mã Chuyến</th>
                    <th className="py-3 px-4">Khởi Hành</th>
                    <th className="py-3 px-4">Cập Bến</th>
                    <th className="py-3 px-4">Tàu Phục Vụ</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {linkedTrips.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        Chưa có chuyến tàu nào được sinh từ lịch chạy này. Hãy bấm <b>"Sinh Chuyến Theo Lịch"</b> để khởi tạo chuyến thực tế.
                      </td>
                    </tr>
                  ) : (
                    linkedTrips.map((trip) => {
                      const statusDef = STATUS_LABELS[trip.status] || STATUS_LABELS.draft;
                      const StatusIcon = statusDef.icon;
                      const boatObj = trip.boat || boatsMap.get(String(trip.boat_id));

                      return (
                        <tr key={trip.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-blue-600">
                            TRIP-{String(trip.id).slice(0, 6).toUpperCase()}
                          </td>
                          <td className="py-3 px-4 font-mono">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {formatDate(trip.start_at || trip.departure_time)}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Clock size={10} />
                              {formatTime(trip.start_at || trip.departure_time)}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                            <div>{formatDate(trip.end_at || trip.arrival_time)}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Clock size={10} />
                              {formatTime(trip.end_at || trip.arrival_time)}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                            {boatObj?.name || 'Chưa gán'} {boatObj?.code ? `(${boatObj.code})` : ''}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusDef.colorClass}`}>
                              <StatusIcon size={11} />
                              {statusDef.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {trip.status === 'selling' && (
                                <button
                                  type="button"
                                  onClick={() => handleQuickToggleTripSale(trip)}
                                  className="h-7 w-7 rounded-md border border-amber-200 text-amber-600 hover:bg-amber-50 flex items-center justify-center cursor-pointer"
                                  title="Khóa bán vé"
                                >
                                  <Lock size={12} />
                                </button>
                              )}
                              {(trip.status === 'draft' || trip.status === 'closed') && (
                                <button
                                  type="button"
                                  onClick={() => handleQuickToggleTripSale(trip)}
                                  className="h-7 w-7 rounded-md border border-emerald-200 text-emerald-600 hover:bg-emerald-50 flex items-center justify-center cursor-pointer"
                                  title="Mở bán vé"
                                >
                                  <Unlock size={12} />
                                </button>
                              )}
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600 hover:bg-blue-50" title="Điều hành chuyến tàu" asChild>
                                <Link to={'/trips/$tripId/edit' as any} params={{ tripId: String(trip.id) } as any}>
                                  <Edit size={13} />
                                </Link>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal: Generate Trips from Schedule */}
      <Dialog open={openGenerateModal} onOpenChange={setOpenGenerateModal}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
              <CalendarPlus className="h-5 w-5 text-blue-600" />
              Khởi Tạo Chuyến Tàu Tự Động
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Sinh các chuyến tàu thực tế theo khung giờ và các ngày trong tuần của lịch <b>{formData.name || scheduleCode}</b>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="fromDate" className="text-xs font-semibold">Từ ngày (from_date)</Label>
                <Input
                  id="fromDate"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-9 mt-1 text-xs"
                />
              </div>
              <div>
                <Label htmlFor="toDate" className="text-xs font-semibold">Đến ngày (to_date)</Label>
                <Input
                  id="toDate"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-9 mt-1 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="publishImmediate"
                checked={publishImmediate}
                onChange={(e) => setPublishImmediate(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <Label htmlFor="publishImmediate" className="text-xs font-semibold cursor-pointer">
                Mở bán vé ngay lập tức sau khi sinh chuyến
              </Label>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpenGenerateModal(false)}
              disabled={isGenerating}
              className="text-xs h-9"
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleExecuteGenerateTrips}
              disabled={isGenerating}
              className="text-xs h-9 bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <CalendarPlus size={13} />
                  <span>Bắt Đầu Sinh Chuyến</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
