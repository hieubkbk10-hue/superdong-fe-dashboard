import React, { useState, useEffect, useMemo } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import {
  Calendar,
  ArrowLeft,
  Save,
  RefreshCw,
  Clock,
  Ship,
  AlertTriangle,
  Sparkles,
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
  getTrips,
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
  try {
    const d = new Date(isoStr);
    if (Number.isNaN(d.getTime())) return isoStr.slice(11, 16) || '--:--';
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--:--';
  }
}

function formatDate(isoStr?: string) {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (Number.isNaN(d.getTime())) return isoStr.slice(0, 10);
    return d.toLocaleDateString('vi-VN');
  } catch {
    return '';
  }
}

function getTodayString() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

function getFutureDateString(daysAhead: number) {
  const now = new Date();
  now.setDate(now.getDate() + daysAhead);
  return now.toISOString().split('T')[0];
}

function ScheduleEditPage() {
  const { scheduleId } = Route.useParams();
  const navigate = useNavigate();
  const draftKey = `superdong_schedules_draft_edit_${scheduleId}`;
  const cacheKey = `superdong_schedule_cache_${scheduleId}`;

  const [formData, setFormData] = useState<ScheduleFormData>(emptyForm);
  const [scheduleCode, setScheduleCode] = useState<string>(`SCH-${String(scheduleId).slice(0, 5).toUpperCase()}`);
  const [routes, setRoutes] = useState<JourneyRoute[]>([]);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate Trips Modal State
  const [openGenerateModal, setOpenGenerateModal] = useState(false);
  const [fromDate, setFromDate] = useState<string>(getTodayString());
  const [toDate, setToDate] = useState<string>(getFutureDateString(30));
  const [publishImmediate, setPublishImmediate] = useState<boolean>(true);
  const [generateReason, setGenerateReason] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const hydrateSchedule = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const [scheduleRes, routesRes, boatsRes, tripsRes] = await Promise.all([
        findSchedule(scheduleId),
        getRoutes({ limit: 100 }),
        getBoats({ limit: 100 }),
        getTrips({ limit: 500 }).catch(() => ({ data: [] })),
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

        let cleanCode = `SCH-${String(scheduleId).slice(0, 5).toUpperCase()}`;
        if (s.cleanCode) cleanCode = s.cleanCode;
        else if (s.code && s.code.length <= 15) cleanCode = s.code;
        setScheduleCode(cleanCode);

        const serverForm: ScheduleFormData = {
          name: s.name || cleanCode,
          route_id: String(s.route_id || s.route?.id || ''),
          boat_id: String(s.boat_id || s.boat?.id || ''),
          start_time: startTimeClean,
          end_time: endTimeClean,
          days: daysNormalized,
          status: s.status === 'active' || s.is_active === true ? 'active' : 'inactive',
          version: typeof s.version === 'number' ? s.version : 1,
        };

        let nextForm = serverForm;
        try {
          const draftStr = localStorage.getItem(draftKey);
          if (draftStr) {
            nextForm = { ...serverForm, ...JSON.parse(draftStr) };
          }
        } catch (_) {}

        setFormData(nextForm);
        localStorage.setItem(cacheKey, JSON.stringify({ id: String(scheduleId), cleanCode, ...serverForm }));
      } else {
        setApiError('Dữ liệu lịch chạy có thể đã bị xóa hoặc không còn tồn tại trên Server');
      }

      // Filter upcoming trips related to this schedule
      const todayStart = new Date().setHours(0, 0, 0, 0);
      const allTrips = Array.isArray(tripsRes?.data) ? tripsRes.data : [];

      const activeFiltered = allTrips
        .filter((t: any) => {
          const matchesSchedule = String(t.schedule_id || '') === String(scheduleId);
          if (!matchesSchedule) return false;
          const startStr = t.start_at || t.departure_time;
          if (!startStr) return false;

          const tripTime = new Date(startStr).getTime();
          const isNotExpired = tripTime >= todayStart;
          const isNotCancelled = t.status !== 'cancelled';
          return isNotExpired && isNotCancelled;
        })
        .sort((a: any, b: any) => {
          const timeA = new Date(a.start_at || a.departure_time).getTime();
          const timeB = new Date(b.start_at || b.departure_time).getTime();
          return timeA - timeB;
        });

      setUpcomingTrips(activeFiltered);
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
    <div className="space-y-6 w-full font-sans max-w-5xl">
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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-6 w-6 text-blue-600" />
              Chi Tiết & Chỉnh Sửa Lịch Chạy: <span className="font-mono text-blue-600">{scheduleCode}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              ID Lịch chạy: <span className="font-mono">{scheduleId}</span> | Quản lý khung giờ và các chuyến tàu thực tế liên kết
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
            <Sparkles size={14} className="text-blue-600 dark:text-blue-400" />
            <span>Sinh Chuyến Theo Lịch</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={hydrateSchedule}
            disabled={loading}
            className="h-9 w-9 text-slate-600 hover:bg-slate-100 dark:text-slate-300"
            title="Tải lại dữ liệu"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {apiError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>{apiError}</span>
        </div>
      )}

      {/* SECTION 1: Form Chỉnh Sửa Lịch Chạy */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6"
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock size={16} className="text-blue-600" />
            Cấu Hình Khung Giờ & Tần Suất Khai Thác
          </h2>
          <span className="text-xs text-slate-400 font-mono">Phiên bản: v{formData.version}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Tên Lịch Chạy Định Kỳ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="VD: Rạch Giá - Phú Quốc (Chuyến sáng)"
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Trạng Thái Áp Dụng
            </label>
            <select
              value={formData.status}
              onChange={(e) => updateField('status', e.target.value as any)}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
            >
              <option value="active">Đang áp dụng (Active)</option>
              <option value="inactive">Tạm ngưng (Inactive)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Tuyến Hải Trình <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.route_id}
              onChange={(e) => updateField('route_id', e.target.value)}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
            >
              <option value="">-- Chọn tuyến hải trình --</option>
              {routes.map((r) => (
                <option key={r.id} value={String(r.id)}>
                  {r.name || r.code}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Tàu Phân Công Mặc Định
            </label>
            <select
              value={formData.boat_id}
              onChange={(e) => updateField('boat_id', e.target.value)}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
            >
              <option value="">-- Chọn tàu mặc định --</option>
              {boats.map((b) => (
                <option key={b.id} value={String(b.id)}>
                  {b.name} {b.code ? `(${b.code})` : ''} - {b.capacity || 300} chỗ
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Giờ Khởi Hành <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              value={formData.start_time}
              onChange={(e) => updateField('start_time', e.target.value)}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:border-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Giờ Cập Bến Dự Kiến <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              value={formData.end_time}
              onChange={(e) => updateField('end_time', e.target.value)}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:border-blue-500 outline-none"
              required
            />
          </div>
        </div>

        {/* Days of week selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            Tần Suất Khai Thác Trong Tuần
          </label>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((w) => {
              const active = formData.days.includes(w.code);
              return (
                <button
                  key={w.code}
                  type="button"
                  onClick={() => toggleDay(w.code)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    active
                      ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-300'
                      : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  {w.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Action */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Save size={16} />
            {isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi Cấu Hình'}
          </Button>
        </div>
      </form>

      {/* SECTION 2: Danh Sách Các Chuyến Tàu Sắp Tới Đang Hoạt Động (Upcoming Active Trips) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers size={18} className="text-blue-600" />
              Các Chuyến Tàu Đang Hoạt Động & Sắp Chạy
              <span className="ml-1 text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {upcomingTrips.length} chuyến
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Danh sách các chuyến tàu thực tế liên kết với lịch này có lịch khởi hành từ hôm nay trở đi (đã lọc bỏ chuyến quá hạn hoặc đã hủy).
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpenGenerateModal(true)}
            className="text-xs font-semibold gap-1.5 self-start sm:self-auto"
          >
            <Sparkles size={13} className="text-blue-600" />
            Sinh thêm chuyến
          </Button>
        </div>

        {upcomingTrips.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700/80">
            <Calendar className="h-8 w-8 mx-auto text-slate-400 mb-2 opacity-60" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Hiện chưa có chuyến tàu nào sắp tới được tạo từ lịch chạy này.
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Bạn có thể bấm "Sinh Chuyến Theo Lịch" để tự động sinh các chuyến theo khoảng ngày mong muốn.
            </p>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setOpenGenerateModal(true)}
              className="mt-3 text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Sparkles size={13} className="mr-1.5" />
              Sinh Chuyến Ngay
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Mã Chuyến</th>
                  <th className="p-3">Ngày & Giờ Xuất Bến</th>
                  <th className="p-3">Tàu Đảm Nhận</th>
                  <th className="p-3">Trạng Thái</th>
                  <th className="p-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {upcomingTrips.map((t: any) => {
                  const meta = STATUS_LABELS[t.status] || STATUS_LABELS.draft;
                  const IconComp = meta.icon;
                  const boat = t.boat || (t.boat_id ? boatsMap.get(String(t.boat_id)) : null);
                  const boatName = boat?.name ? (boat.code ? `${boat.name} (${boat.code})` : boat.name) : 'Tàu Superdong';
                  const startStr = t.start_at || t.departure_time;
                  const endStr = t.end_at || t.arrival_time;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        TRIP-{String(t.id).slice(0, 6).toUpperCase()}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1 font-mono">
                          <Clock size={13} className="text-blue-500 shrink-0" />
                          {formatTime(startStr)} - {formatTime(endStr)}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">{formatDate(startStr)}</div>
                      </td>
                      <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                        <span className="flex items-center gap-1.5">
                          <Ship size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
                          {boatName}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${meta.colorClass}`}>
                          <IconComp size={11} /> {meta.label}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {t.status === 'selling' ? (
                            <button
                              type="button"
                              onClick={() => handleQuickToggleTripSale(t)}
                              className="px-2 py-1 rounded text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 flex items-center gap-1 cursor-pointer"
                              title="Khóa bán vé chuyến này"
                            >
                              <Lock size={11} /> Khóa bán
                            </button>
                          ) : t.status === 'closed' || t.status === 'draft' ? (
                            <button
                              type="button"
                              onClick={() => handleQuickToggleTripSale(t)}
                              className="px-2 py-1 rounded text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 flex items-center gap-1 cursor-pointer"
                              title="Mở bán vé chuyến này"
                            >
                              <Unlock size={11} /> Mở bán
                            </button>
                          ) : null}

                          <Link
                            to={'/trips/$tripId/edit' as any}
                            params={{ tripId: String(t.id) } as any}
                            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 transition-colors"
                            title="Chỉnh sửa chi tiết / Đổi tàu cho chuyến này"
                          >
                            <ExternalLink size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Sinh Chuyến Tàu (Clean & Minimalist) */}
      <Dialog open={openGenerateModal} onOpenChange={setOpenGenerateModal}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-800/60">
                <Sparkles size={15} />
              </div>
              Sinh Chuyến Tàu Theo Lịch Này
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Sinh tự động các chuyến xuất bến theo khung giờ và tần suất của lịch <span className="font-semibold text-slate-700 dark:text-slate-300">{formData.name}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Quick Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Khoảng thời gian sinh chuyến</Label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setToDate(getFutureDateString(7))}
                    className="px-1.5 py-0.5 text-[10px] rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    +7 ngày
                  </button>
                  <button
                    type="button"
                    onClick={() => setToDate(getFutureDateString(14))}
                    className="px-1.5 py-0.5 text-[10px] rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    +14 ngày
                  </button>
                  <button
                    type="button"
                    onClick={() => setToDate(getFutureDateString(30))}
                    className="px-1.5 py-0.5 text-[10px] rounded border border-blue-200 bg-blue-50/50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300"
                  >
                    +30 ngày
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="modal_from_date" className="text-[11px] text-slate-500 mb-1 block">
                    Từ ngày
                  </Label>
                  <Input
                    id="modal_from_date"
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="modal_to_date" className="text-[11px] text-slate-500 mb-1 block">
                    Đến ngày
                  </Label>
                  <Input
                    id="modal_to_date"
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="modal_reason" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ghi chú / Lý do khởi tạo
              </Label>
              <Input
                id="modal_reason"
                type="text"
                value={generateReason}
                onChange={(e) => setGenerateReason(e.target.value)}
                placeholder="Nhập lý do sinh chuyến..."
                className="mt-1.5 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="modal_publish"
                type="checkbox"
                checked={publishImmediate}
                onChange={(e) => setPublishImmediate(e.target.checked)}
                className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer border-slate-300"
              />
              <Label htmlFor="modal_publish" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                Mở bán vé ngay sau khi sinh (Trạng thái <span className="font-semibold text-emerald-600">selling</span>)
              </Label>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 p-2.5 rounded-lg flex items-start gap-2 text-[11px]">
              <Info size={14} className="shrink-0 mt-0.5 text-blue-500" />
              <span>Hệ thống sẽ tự động khởi tạo đầy đủ sơ đồ ghế trống (Seat Inventory) cho từng chuyến.</span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenGenerateModal(false)}
              disabled={isGenerating}
              className="text-xs"
            >
              Hủy bỏ
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExecuteGenerateTrips}
              disabled={isGenerating}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
            >
              {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              {isGenerating ? 'Đang khởi tạo...' : 'Xác Nhận Sinh Chuyến'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
