import React, { useState, useEffect, useMemo } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import {
  Calendar,
  CalendarPlus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Ship,
  Info,
  Loader2,
  CalendarDays,
  Layers,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Check,
  AlertCircle,
  CalendarRange,
  ListFilter,
  CheckCheck,
} from 'lucide-react';
import { toast } from 'sonner';

import { getSchedules, deleteSchedule, generateTripsFromSchedule, getTrips, getAllTrips } from '@/apis/trips';
import { getBoats } from '@/apis/boats';
import { Boat, Schedule, Trip } from '@/types';
import { Button } from '@/components/common/Button';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { AdminTablePage, ColumnDef, PageHeader } from '@/components/common/TableUtilities';
import { ScheduleTimelineMatrix } from '@/components/schedules/ScheduleTimelineMatrix';
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

export interface SchedulesSearch {
  page?: number;
  search?: string;
  status?: string;
  view?: 'matrix' | 'table';
}

export const Route = createFileRoute('/_admin/schedules/')({
  validateSearch: (search: Record<string, unknown>): SchedulesSearch => {
    const result: SchedulesSearch = {};
    if (Number(search?.page) > 1) result.page = Number(search.page);
    // LOGIC: Giữ nguyên chuỗi tìm kiếm (kể cả dấu cách)
    if (typeof search?.search === 'string') result.search = search.search;
    if (typeof search?.status === 'string' && search.status !== 'all') result.status = search.status;
    if (search?.view === 'table' || search?.view === 'matrix') result.view = search.view;
    return result;
  },
  component: SchedulesPage,
});

export interface ScheduleItem {
  id: string;
  code: string;
  name?: string;
  journey: string;
  departureTime: string;
  boatName: string;
  operatingDays: string;
  status: 'active' | 'inactive';
  activeTripsCount: number;
}

export interface TripPreviewItem {
  dateYMD: string;
  formattedDate: string;
  dayOfWeekText: string;
  isDuplicate: boolean;
  timeRange: string;
  boatName: string;
  routeName: string;
}

const formatDaysOfWeek = (days: any[]): string => {
  if (!Array.isArray(days) || days.length === 0 || days.length === 7) {
    return 'Hàng ngày';
  }
  const dayMap: Record<string, string> = {
    mon: '2',
    tue: '3',
    wed: '4',
    thu: '5',
    fri: '6',
    sat: '7',
    sun: 'CN',
  };
  const mapped = days.map((d) => dayMap[String(d).toLowerCase()] || String(d).toUpperCase());
  const hasCN = mapped.includes('CN');
  const numberDays = mapped.filter((m) => m !== 'CN');

  if (hasCN && numberDays.length > 0) {
    return `Thứ ${numberDays.join(', ')}, CN`;
  }
  if (hasCN && numberDays.length === 0) {
    return 'Chủ Nhật';
  }
  return `Thứ ${mapped.join(', ')}`;
};

function parseTargetDaysOfWeek(days: any[]): number[] {
  if (!Array.isArray(days) || days.length === 0) return [0, 1, 2, 3, 4, 5, 6];
  const map: Record<string, number> = {
    sun: 0, sunday: 0, cn: 0, '0': 0, '7': 0,
    mon: 1, monday: 1, t2: 1, '1': 1,
    tue: 2, tuesday: 2, t3: 2, '2': 2,
    wed: 3, wednesday: 3, t4: 3, '3': 3,
    thu: 4, thursday: 4, t5: 4, '4': 4,
    fri: 5, friday: 5, t6: 5, '5': 5,
    sat: 6, saturday: 6, t7: 6, '6': 6,
  };
  return days
    .map((d) => map[String(d).toLowerCase()] ?? -1)
    .filter((n) => n >= 0 && n <= 6);
}

function getDayOfWeekLabel(dayIdx: number): string {
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  return days[dayIdx] || '';
}

function getTodayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getFutureDateString(daysAhead: number) {
  const now = new Date();
  now.setDate(now.getDate() + daysAhead);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getEndOfMonthString(date = new Date()): string {
  const y = date.getFullYear();
  const m = date.getMonth();
  const lastDay = new Date(y, m + 1, 0).getDate();
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

function getFirstOfNextMonthString(date = new Date()): string {
  const y = date.getMonth() === 11 ? date.getFullYear() + 1 : date.getFullYear();
  const m = date.getMonth() === 11 ? 1 : date.getMonth() + 2;
  return `${y}-${String(m).padStart(2, '0')}-01`;
}

function getEndOfNextMonthString(date = new Date()): string {
  const nextMonthDate = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return getEndOfMonthString(nextMonthDate);
}

function SchedulesPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const searchParams = Route.useSearch();

  const currentPage = searchParams.page || 1;
  const searchTerm = searchParams.search || '';
  const statusFilter = searchParams.status || 'all';
  const viewMode = searchParams.view || 'matrix';

  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [rawSchedules, setRawSchedules] = useState<any[]>([]);
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<ScheduleItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Generate Trips Modal State
  const [generateTarget, setGenerateTarget] = useState<ScheduleItem | null>(null);
  const [generateStep, setGenerateStep] = useState<1 | 2>(1);
  const [fromDate, setFromDate] = useState<string>(getTodayString());
  const [toDate, setToDate] = useState<string>(getFutureDateString(30));
  const [publishImmediate, setPublishImmediate] = useState<boolean>(true);
  const [generateReason, setGenerateReason] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const fetchSchedules = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const [schedulesRes, boatsRes, tripsList] = await Promise.all([
        getSchedules({ limit: 100 }),
        getBoats({ limit: 100 }),
        getAllTrips(),
      ]);

      const raw = Array.isArray(schedulesRes?.data) ? schedulesRes.data : [];
      setRawSchedules(raw);
      setAllTrips(tripsList || []);

      const boatsMap = new Map<string, Boat>((boatsRes?.data || []).map((b: any) => [String(b.id), b]));

      // Calculate upcoming active trips per schedule
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const activeTripsMap = new Map<string, number>();

      (tripsList || []).forEach((t: any) => {
        if (!t.schedule_id) return;
        const schId = String(t.schedule_id);
        const startStr = t.start_at || t.departure_time;

        const isNotClosedOrCancelled = t.status !== 'cancelled' && t.status !== 'completed';
        if (!isNotClosedOrCancelled) return;

        if (startStr) {
          const tripTime = new Date(startStr).getTime();
          const isUpcoming = Number.isNaN(tripTime) || tripTime >= todayStart;
          if (isUpcoming) {
            activeTripsMap.set(schId, (activeTripsMap.get(schId) || 0) + 1);
          }
        } else {
          activeTripsMap.set(schId, (activeTripsMap.get(schId) || 0) + 1);
        }
      });

      if (raw.length > 0) {
        const mapped: ScheduleItem[] = raw.map((s: any, idx: number) => {
          const daysArr = Array.isArray(s.days_of_week) ? s.days_of_week : [];
          const daysText = formatDaysOfWeek(daysArr);
          const journeyName = s.name || s.journey?.name || (s.route?.name ? s.route.name : 'Tuyến hải trình Superdong');

          let resolvedBoatName = 'Tàu Superdong';
          if (s.boat?.name) {
            resolvedBoatName = s.boat.code ? `${s.boat.name} (${s.boat.code})` : s.boat.name;
          } else if (s.boat_id && boatsMap.has(String(s.boat_id))) {
            const foundBoat = boatsMap.get(String(s.boat_id))!;
            resolvedBoatName = foundBoat.code ? `${foundBoat.name} (${foundBoat.code})` : foundBoat.name;
          }

          let cleanCode = `SCH-0${idx + 1}`;
          if (s.code && !s.code.includes('5YRO') && !s.code.includes('dzrT') && !s.code.includes('yaEM') && !s.code.includes('OgYP') && s.code.length <= 15) {
            cleanCode = s.code;
          }

          const activeCount = activeTripsMap.get(String(s.id)) || 0;

          // Cache for Edit page hydration
          localStorage.setItem(`superdong_schedule_cache_${s.id}`, JSON.stringify({
            ...s,
            cleanCode,
            activeCount,
            journeyName,
            boatName: resolvedBoatName,
          }));

          return {
            id: String(s.id),
            code: cleanCode,
            name: s.name,
            journey: journeyName,
            departureTime: s.start_time ? s.start_time.slice(0, 5) : '07:30',
            boatName: resolvedBoatName,
            operatingDays: daysText,
            status: s.status === 'inactive' ? 'inactive' : 'active',
            activeTripsCount: activeCount,
          };
        });
        setSchedules(mapped);
      } else {
        setSchedules([]);
      }
    } catch (err: any) {
      console.error('Fetch schedules error:', err);
      setSchedules([]);
      setApiError(err?.response?.data?.message || err?.message || 'Không thể tải danh sách lịch chạy từ Backend');
      toast.error('Không thể lấy dữ liệu lịch chạy từ Backend API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleSearchChange = (value: string) => {
    navigate({
      search: (prev: any) => {
        const next: any = { ...prev };
        if (value) {
          next.search = value;
        } else {
          delete next.search;
        }
        delete next.page;
        return next;
      },
    });
  };

  const handleStatusFilterChange = (value: string) => {
    navigate({
      search: (prev: any) => {
        const next: any = { ...prev };
        if (value && value !== 'all') {
          next.status = value;
        } else {
          delete next.status;
        }
        delete next.page;
        return next;
      },
    });
  };

  const handleViewModeChange = (mode: 'matrix' | 'table') => {
    navigate({
      search: (prev: any) => {
        const next: any = { ...prev };
        next.view = mode;
        return next;
      },
    });
  };

  const handlePageChange = (page: number) => {
    navigate({
      search: (prev: any) => {
        const next: any = { ...prev };
        if (page > 1) {
          next.page = page;
        } else {
          delete next.page;
        }
        return next;
      },
    });
  };

  const filteredSchedules = useMemo(() => {
    return schedules.filter((sch) => {
      const keyword = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !keyword ||
        sch.code.toLowerCase().includes(keyword) ||
        sch.journey.toLowerCase().includes(keyword) ||
        sch.boatName.toLowerCase().includes(keyword);

      const matchesStatus = statusFilter === 'all' || sch.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [schedules, searchTerm, statusFilter]);

  const handleDeleteSchedule = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await deleteSchedule(deleteTarget.id, {
        reason: `Xóa lịch chạy ${deleteTarget.code} (${deleteTarget.journey}) từ trang quản trị`,
      });

      toast.success(`Đã xóa lịch chạy ${deleteTarget.code} thành công!`);
      setDeleteTarget(null);
      await fetchSchedules();
    } catch (err: any) {
      console.error('Delete schedule error:', err);
      const serverMsg = err?.response?.data?.message || err?.message;
      toast.error(serverMsg || 'Có lỗi xảy ra khi xóa lịch chạy trên Backend');
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenGenerateModal = (sch: ScheduleItem) => {
    setGenerateTarget(sch);
    setGenerateStep(1);
    setFromDate(getTodayString());
    setToDate(getFutureDateString(30));
    setPublishImmediate(true);
    setGenerateReason(`Khởi tạo chuyến tự động từ lịch ${sch.code}`);
  };

  const handleOpenGenerateForMonth = (sch: ScheduleItem, fromDateStr: string, toDateStr: string) => {
    const todayStr = getTodayString();
    const effectiveFromDate = fromDateStr < todayStr ? todayStr : fromDateStr;
    setGenerateTarget(sch);
    setGenerateStep(1);
    setFromDate(effectiveFromDate);
    setToDate(toDateStr);
    setPublishImmediate(true);
    setGenerateReason(`Khởi tạo chuyến định kỳ tháng từ ${effectiveFromDate} đến ${toDateStr} cho lịch ${sch.code}`);
  };

  // Preview List Calculation for Step 2
  const previewTrips = useMemo<TripPreviewItem[]>(() => {
    if (!generateTarget || !fromDate || !toDate) return [];
    const rawSch = rawSchedules.find((s) => String(s.id) === String(generateTarget.id));
    const targetDays = parseTargetDaysOfWeek(rawSch?.days_of_week || []);

    const todayStr = getTodayString();
    const start = fromDate < todayStr ? todayStr : fromDate;
    const end = toDate;
    if (start > end) return [];

    // Map of existing trips for this schedule
    const existingDates = new Set<string>();
    allTrips.forEach((t: any) => {
      if (String(t.schedule_id) === String(generateTarget.id)) {
        const tripDate = typeof t.start_at === 'string' ? t.start_at.slice(0, 10) : '';
        if (tripDate) existingDates.add(tripDate);
      }
    });

    const list: TripPreviewItem[] = [];
    const curr = new Date(start + 'T00:00:00');
    const endD = new Date(end + 'T00:00:00');

    while (curr <= endD) {
      const dayOfWeek = curr.getDay(); // 0 = Sun, 1 = Mon ...
      if (targetDays.includes(dayOfWeek)) {
        const dateYMD = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}-${String(curr.getDate()).padStart(2, '0')}`;
        const isDuplicate = existingDates.has(dateYMD);
        list.push({
          dateYMD,
          formattedDate: `${String(curr.getDate()).padStart(2, '0')}/${String(curr.getMonth() + 1).padStart(2, '0')}/${curr.getFullYear()}`,
          dayOfWeekText: getDayOfWeekLabel(dayOfWeek),
          isDuplicate,
          timeRange: generateTarget.departureTime,
          boatName: generateTarget.boatName,
          routeName: generateTarget.journey,
        });
      }
      curr.setDate(curr.getDate() + 1);
    }

    return list;
  }, [generateTarget, fromDate, toDate, rawSchedules, allTrips]);

  const previewNewCount = useMemo(() => previewTrips.filter((t) => !t.isDuplicate).length, [previewTrips]);
  const previewSkippedCount = useMemo(() => previewTrips.filter((t) => t.isDuplicate).length, [previewTrips]);

  const handleExecuteGenerateTrips = async () => {
    if (!generateTarget) return;
    if (!fromDate || !toDate) {
      toast.error('Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc');
      return;
    }
    if (new Date(fromDate) > new Date(toDate)) {
      toast.error('Ngày bắt đầu không được lớn hơn ngày kết thúc');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await generateTripsFromSchedule(generateTarget.id, {
        from_date: fromDate,
        to_date: toDate,
        publish: publishImmediate,
        reason: generateReason.trim() || `Sinh chuyến định kỳ ${generateTarget.code}`,
      });

      const summary = res?.data;
      const created = summary?.created_count ?? 0;
      const skipped = summary?.skipped_count ?? 0;

      toast.success(
        `Đã tạo thành công ${created} chuyến tàu thực tế (${skipped} chuyến đã tồn tại trước đó).`,
        {
          duration: 5000,
          action: {
            label: 'Xem chuyến tàu',
            onClick: () => navigate({ to: '/trips' as any }),
          },
        }
      );

      setGenerateTarget(null);
      await fetchSchedules();
    } catch (err: any) {
      console.error('Generate trips error:', err);
      const msg = err?.response?.data?.message || err?.message || 'Không thể sinh chuyến từ lịch chạy';
      toast.error(`Sinh chuyến thất bại: ${msg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'active', label: 'Đang áp dụng' },
    { value: 'inactive', label: 'Tạm ngưng' },
  ];

  const columns: ColumnDef<ScheduleItem>[] = [
    {
      key: 'code',
      label: 'MÃ LỊCH',
      sortable: true,
      render: (sch) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 whitespace-nowrap">
          {sch.code}
        </span>
      ),
    },
    {
      key: 'journey',
      label: 'TUYẾN TÀU',
      sortable: true,
      render: (sch) => <span className="font-bold text-slate-900 dark:text-white whitespace-nowrap">{sch.journey}</span>,
    },
    {
      key: 'departureTime',
      label: 'GIỜ CHẠY',
      sortable: true,
      render: (sch) => (
        <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 whitespace-nowrap font-mono">
          <Clock size={15} className="shrink-0" />
          {sch.departureTime}
        </span>
      ),
    },
    {
      key: 'boatName',
      label: 'PHÂN CÔNG',
      sortable: true,
      render: (sch) => (
        <span className="text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5 whitespace-nowrap">
          <Ship size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
          {sch.boatName}
        </span>
      ),
    },
    {
      key: 'operatingDays',
      label: 'TẦN SUẤT',
      sortable: true,
      render: (sch) => (
        <span className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap">
          {sch.operatingDays}
        </span>
      ),
    },
    {
      key: 'activeTripsCount',
      label: 'CHUYẾN HOẠT ĐỘNG',
      sortable: true,
      render: (sch) => (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <CalendarDays size={14} className="text-blue-500 shrink-0" />
          <span className="font-semibold text-xs text-slate-700 dark:text-slate-200">
            {sch.activeTripsCount} chuyến sắp tới
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'TRẠNG THÁI',
      sortable: true,
      render: (sch) => (
        <span
          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
            sch.status === 'active'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800'
          }`}
        >
          {sch.status === 'active' ? (
            <>
              <CheckCircle2 size={12} /> Đang áp dụng
            </>
          ) : (
            <>
              <XCircle size={12} /> Tạm ngưng
            </>
          )}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'THAO TÁC',
      align: 'right',
      render: (sch) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 gap-1.5 shadow-2xs"
            onClick={() => handleOpenGenerateModal(sch)}
            title="Khởi tạo danh sách chuyến tàu thực tế"
          >
            <CalendarPlus size={14} />
            <span>Sinh chuyến</span>
          </Button>

          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 dark:text-blue-400" asChild>
            <Link to={'/schedules/$scheduleId/edit' as any} params={{ scheduleId: sch.id } as any} title="Chỉnh sửa lịch chạy">
              <Edit size={15} />
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-rose-600 hover:text-rose-700 dark:text-rose-400"
            onClick={() => setDeleteTarget(sch)}
            title="Xóa lịch chạy"
          >
            <Trash2 size={15} />
          </Button>
        </div>
      ),
    },
  ];

  const renderViewSwitcher = () => (
    <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl w-fit border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold shadow-2xs">
      <button
        type="button"
        onClick={() => handleViewModeChange('matrix')}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
          viewMode === 'matrix'
            ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
      >
        <CalendarDays size={14} />
        <span>Tiến độ tạo lịch theo tháng</span>
      </button>
      <button
        type="button"
        onClick={() => handleViewModeChange('table')}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
          viewMode === 'table'
            ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
      >
        <Layers size={14} />
        <span>Danh sách mẫu lịch</span>
      </button>
    </div>
  );

  return (
    <>
      {viewMode === 'matrix' ? (
        <div className="space-y-4">
          <PageHeader
            title="Quản Lý Lịch Chạy Định Kỳ"
            subtitle="Kế hoạch biểu đồ vận hành khung của Superdong, điều phối phân công đội tàu và sinh chuyến tàu tự động"
            icon={Calendar}
            createLink="/schedules/create"
            createLabel="Tạo Lịch Chạy Mới"
            onRefresh={fetchSchedules}
            refreshing={loading}
          />

          {renderViewSwitcher()}

          <ScheduleTimelineMatrix
            schedules={schedules}
            rawSchedules={rawSchedules}
            allTrips={allTrips}
            onGenerateForMonth={handleOpenGenerateForMonth}
            onRefresh={fetchSchedules}
          />
        </div>
      ) : (
        <AdminTablePage
          title="Quản Lý Lịch Chạy Định Kỳ"
          subtitle="Kế hoạch biểu đồ vận hành khung của Superdong, điều phối phân công đội tàu và sinh chuyến tàu tự động"
          icon={Calendar}
          apiError={apiError}
          banner={renderViewSwitcher()}
          searchValue={searchTerm}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Tìm theo mã lịch (SCH-...), tuyến hoặc tàu..."
          filterValue={statusFilter}
          onFilterChange={handleStatusFilterChange}
          filterOptions={statusOptions}
          columns={columns}
          columnStorageKey="superdong_schedules_columns"
          onRefresh={fetchSchedules}
          refreshing={loading}
          createLink="/schedules/create"
          createLabel="Tạo Lịch Chạy Mới"
          data={filteredSchedules}
          loading={loading}
          emptyText="Chưa có lịch chạy nào phù hợp với bộ lọc."
          keyExtractor={(sch) => String(sch.id)}
          entityLabel="lịch chạy"
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      )}

      {/* Modal: Sinh chuyến hàng loạt với 2-Step Interactive Preview Wizard */}
      <Dialog open={!!generateTarget} onOpenChange={(open) => !open && setGenerateTarget(null)}>
        <DialogContent className="sm:max-w-xl md:max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-2xl shadow-2xl">
          <DialogHeader className="space-y-1.5 pb-2">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarPlus className="text-blue-600 dark:text-blue-400" size={20} />
                Sinh Chuyến Tàu Theo Lịch Định Kỳ
              </DialogTitle>
              {/* Step indicator pill */}
              <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <span>Bước {generateStep}/2:</span>
                <span>{generateStep === 1 ? 'Cấu hình thời gian' : 'Xem trước chuyến sinh'}</span>
              </div>
            </div>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
              {generateStep === 1
                ? 'Thiết lập khoảng ngày để tự động sinh danh sách các chuyến tàu thực tế theo biểu đồ tuần.'
                : 'Xem trước danh sách chính xác các chuyến tàu sẽ được tạo trên hệ thống trước khi xác nhận.'}
            </DialogDescription>
          </DialogHeader>

          {generateTarget && (
            <div className="space-y-4 py-2 text-sm">
              {/* Summary Schedule Header Info */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-xs text-slate-500 font-medium">Lịch & Tuyến chạy:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-bold mr-2">{generateTarget.code}</span>
                    {generateTarget.journey}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-xs text-slate-500 font-medium">Giờ xuất bến & Tàu:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                    <strong className="text-blue-600 font-mono mr-1">{generateTarget.departureTime}</strong> — {generateTarget.boatName}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-xs text-slate-500 font-medium">Tần suất hoạt động:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-xs px-2 py-0.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                    {generateTarget.operatingDays}
                  </span>
                </div>
              </div>

              {/* STEP 1: CẤU HÌNH THỜI GIAN */}
              {generateStep === 1 && (
                <div className="space-y-4 animate-in fade-in-50 duration-150">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Khoảng thời gian sinh chuyến
                      </Label>
                      {/* Smart Presets */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setFromDate(getTodayString());
                            setToDate(getFutureDateString(7));
                          }}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          +7 ngày
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFromDate(getTodayString());
                            setToDate(getFutureDateString(14));
                          }}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          +14 ngày
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFromDate(getTodayString());
                            setToDate(getFutureDateString(30));
                          }}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          +30 ngày
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFromDate(getTodayString());
                            setToDate(getEndOfMonthString());
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 transition-colors cursor-pointer"
                        >
                          Hết tháng này
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFromDate(getFirstOfNextMonthString());
                            setToDate(getEndOfNextMonthString());
                          }}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          Trọn tháng tới
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="from_date" className="text-xs text-slate-500 font-medium mb-1.5 block">
                          Từ ngày (Chỉ chọn từ hôm nay)
                        </Label>
                        <Input
                          id="from_date"
                          type="date"
                          value={fromDate}
                          min={getTodayString()}
                          onChange={(e) => setFromDate(e.target.value)}
                          className="h-10 text-sm rounded-lg"
                        />
                      </div>
                      <div>
                        <Label htmlFor="to_date" className="text-xs text-slate-500 font-medium mb-1.5 block">
                          Đến ngày
                        </Label>
                        <Input
                          id="to_date"
                          type="date"
                          value={toDate}
                          min={fromDate || getTodayString()}
                          onChange={(e) => setToDate(e.target.value)}
                          className="h-10 text-sm rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <Label htmlFor="generate_reason" className="text-sm font-semibold text-slate-800 dark:text-slate-200 block mb-1.5">
                      Ghi chú / Lý do khởi tạo
                    </Label>
                    <Input
                      id="generate_reason"
                      type="text"
                      value={generateReason}
                      onChange={(e) => setGenerateReason(e.target.value)}
                      placeholder="Ví dụ: Khởi tạo chuyến định kỳ tháng tới..."
                      className="h-10 text-sm rounded-lg"
                    />
                  </div>

                  {/* Publish option */}
                  <div className="flex items-center gap-2.5 pt-1">
                    <input
                      id="publish_immediate"
                      type="checkbox"
                      checked={publishImmediate}
                      onChange={(e) => setPublishImmediate(e.target.checked)}
                      className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer border-slate-300"
                    />
                    <Label htmlFor="publish_immediate" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                      Mở bán vé ngay sau khi sinh (Trạng thái <span className="font-semibold text-emerald-600 dark:text-emerald-400">selling</span>)
                    </Label>
                  </div>
                </div>
              )}

              {/* STEP 2: PREVIEW TRỰC QUAN DANH SÁCH CHUYẾN */}
              {generateStep === 2 && (
                <div className="space-y-3 animate-in fade-in-50 duration-150">
                  {/* Summary Metric Banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/60 text-xs">
                    <div>
                      <span className="text-slate-500 block">Sẽ sinh mới:</span>
                      <strong className="text-sm text-emerald-600 dark:text-emerald-400 font-bold">
                        +{previewNewCount} chuyến
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Đã có (Bỏ qua):</span>
                      <strong className="text-sm text-slate-600 dark:text-slate-400 font-semibold">
                        {previewSkippedCount} chuyến
                      </strong>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-slate-500 block">Trạng thái:</span>
                      <strong className={publishImmediate ? 'text-emerald-600 font-bold' : 'text-slate-700 font-bold'}>
                        {publishImmediate ? 'Mở bán ngay' : 'Lưu nháp'}
                      </strong>
                    </div>
                  </div>

                  {/* Scrollable Preview List */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <div className="bg-slate-100/80 dark:bg-slate-800/80 px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                      <span>Danh sách chuyến dự kiến ({previewTrips.length} ngày khớp lịch)</span>
                      <span className="text-[11px] text-slate-500">Từ {fromDate} ➔ {toDate}</span>
                    </div>

                    <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {previewTrips.length === 0 ? (
                        <div className="p-6 text-center text-slate-400">
                          Không tìm thấy ngày nào phù hợp trong khoảng thời gian đã chọn.
                        </div>
                      ) : (
                        previewTrips.map((pt, idx) => (
                          <div
                            key={idx}
                            className={`p-2.5 px-3.5 flex items-center justify-between gap-3 transition-colors ${
                              pt.isDuplicate
                                ? 'bg-slate-50/50 dark:bg-slate-900/40 opacity-60'
                                : 'hover:bg-blue-50/30 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                                {idx + 1}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                  <span>{pt.dayOfWeekText}, {pt.formattedDate}</span>
                                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">({pt.timeRange})</span>
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {pt.boatName}
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0">
                              {pt.isDuplicate ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                  ↷ Đã có (Bỏ qua)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                  <Check size={11} className="stroke-[3]" /> + Sinh mới
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-3 sm:gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row justify-between">
            {generateStep === 1 ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setGenerateTarget(null)}
                  disabled={isGenerating}
                  className="h-10 px-5 text-sm font-medium"
                >
                  Hủy bỏ
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setGenerateStep(2)}
                  disabled={!fromDate || !toDate || new Date(fromDate) > new Date(toDate)}
                  className="h-10 px-5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-1.5"
                >
                  <span>Tiếp tục: Xem trước chuyến sinh (Preview)</span>
                  <ArrowRight size={15} />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setGenerateStep(1)}
                  disabled={isGenerating}
                  className="h-10 px-5 text-sm font-medium gap-1.5"
                >
                  <ArrowLeft size={15} />
                  <span>Quay lại cấu hình</span>
                </Button>
                <Button
                  variant="primary"
                  onClick={handleExecuteGenerateTrips}
                  disabled={isGenerating || previewNewCount === 0}
                  className="h-10 px-6 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm gap-1.5"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Đang khởi tạo...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      <span>Xác Nhận Sinh {previewNewCount} Chuyến Tàu</span>
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xác nhận xóa Lịch chạy định kỳ"
        description={`Bạn có chắc chắn muốn xóa lịch chạy "${deleteTarget?.code} - ${deleteTarget?.journey}"? Thao tác này sẽ xóa vĩnh viễn cấu hình lịch định kỳ.`}
        confirmLabel={deleting ? 'Đang xóa...' : 'Xóa lịch chạy'}
        variant="destructive"
        loading={deleting}
        onConfirm={handleDeleteSchedule}
      />
    </>
  );
}
