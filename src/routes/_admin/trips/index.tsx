import React, { useState, useEffect, useMemo } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import {
  Ship,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Lock,
  Unlock,
  CheckCheck,
  Ban,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Calendar,
  MapPin,
  RotateCcw,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  getTrips,
  getSchedules,
  deleteTrip,
  openTripForSale,
  closeTripForSale,
  markTripDeparted,
  completeTrip,
  cancelTrip,
} from '@/apis/trips';
import { getRoutes } from '@/apis/journeys';
import { getBoats } from '@/apis/boats';
import { Trip, TripStatus, Boat, Route as JourneyRoute } from '@/types';
import { Button } from '@/components/common/Button';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { AdminTablePage, ColumnDef, FilterOption, FilterSelect } from '@/components/common/TableUtilities';

export interface TripsSearch {
  page?: number;
  search?: string;
  status?: string;
  route_id?: string;
  boat_id?: string;
  time?: string;
  hub?: string;
  schedule_id?: string;
  month?: string;
}

export const Route = createFileRoute('/_admin/trips/')({
  validateSearch: (search: Record<string, unknown>): TripsSearch => {
    const result: TripsSearch = {};
    if (Number(search?.page) > 1) result.page = Number(search.page);
    // LOGIC: Giữ nguyên chuỗi tìm kiếm (kể cả dấu cách khi đang gõ "Côn Đảo")
    if (typeof search?.search === 'string') result.search = search.search;
    if (typeof search?.status === 'string' && search.status !== 'all') result.status = search.status;
    if (typeof search?.route_id === 'string' && search.route_id !== 'all') result.route_id = search.route_id;
    if (typeof search?.boat_id === 'string' && search.boat_id !== 'all') result.boat_id = search.boat_id;
    if (typeof search?.time === 'string' && search.time !== 'all') result.time = search.time;
    if (typeof search?.hub === 'string' && search.hub !== 'all') result.hub = search.hub;
    if (typeof search?.schedule_id === 'string' && search.schedule_id !== 'all') result.schedule_id = search.schedule_id;
    if (typeof search?.month === 'string' && search.month !== 'all') result.month = search.month;
    return result;
  },
  component: TripsPage,
});

export interface TripRowItem {
  id: string;
  code: string;
  schedule_id?: string | null;
  schedule_code?: string;
  schedule_name?: string;
  route_id: string;
  routeName: string;
  boat_id: string;
  boatName: string;
  start_at: string;
  end_at: string;
  departureTimeText: string;
  departureDateText: string;
  dateYMD: string;
  status: TripStatus;
  version: number;
  shuttle_phone?: string | null;
  raw: Trip;
}

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
    label: 'Đã hủy chuyến',
    colorClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    icon: XCircle,
  },
};

const statusOptions: FilterOption[] = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'selling', label: 'Đang mở bán' },
  { value: 'draft', label: 'Bản nháp' },
  { value: 'closed', label: 'Đã khóa sổ' },
  { value: 'started', label: 'Đã xuất bến' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy chuyến' },
];

const timeOptions: FilterOption[] = [
  { value: 'all', label: 'Tất cả thời gian' },
  { value: 'today', label: 'Khởi hành hôm nay' },
  { value: 'upcoming', label: 'Chuyến sắp tới (từ hôm nay)' },
  { value: 'past', label: 'Chuyến trong quá khứ' },
];

const HUBS = [
  { key: 'all', label: 'Tất cả vùng' },
  { key: 'phu-quoc', label: 'Phú Quốc', keywords: ['phú quốc', 'hà tiên', 'rạch giá'] },
  { key: 'con-dao', label: 'Côn Đảo', keywords: ['côn đảo', 'sóc trăng', 'trần đề', 'vũng tàu'] },
  { key: 'nam-du', label: 'Nam Du', keywords: ['nam du'] },
  { key: 'phu-quy', label: 'Phú Quý', keywords: ['phú quý', 'phan thiết'] },
];

function formatTime(isoStr?: string) {
  if (!isoStr) return '--:--';
  if (typeof isoStr === 'string') {
    const match = isoStr.match(/T(\d{2}:\d{2})/);
    if (match) return match[1];
    if (isoStr.includes(' ')) {
      const parts = isoStr.split(' ');
      if (parts[1]) return parts[1].slice(0, 5);
    }
  }
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
  if (typeof isoStr === 'string') {
    const dateMatch = isoStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      return `${dateMatch[3]}/${dateMatch[2]}/${dateMatch[1]}`;
    }
  }
  try {
    const d = new Date(isoStr);
    if (Number.isNaN(d.getTime())) return isoStr.slice(0, 10);
    return d.toLocaleDateString('vi-VN');
  } catch {
    return '';
  }
}

function getTodayYMD(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function TripsPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const searchParams = Route.useSearch();

  const currentPage = searchParams.page || 1;
  const searchTerm = searchParams.search || '';
  const statusFilter = searchParams.status || 'all';
  const routeFilter = searchParams.route_id || 'all';
  const boatFilter = searchParams.boat_id || 'all';
  const timeFilter = searchParams.time || 'all';
  const hubFilter = searchParams.hub || 'all';
  const scheduleFilter = searchParams.schedule_id || '';
  const monthFilter = searchParams.month || '';

  const [trips, setTrips] = useState<TripRowItem[]>([]);
  const [routes, setRoutes] = useState<JourneyRoute[]>([]);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Status Action Modal State
  const [actionTarget, setActionTarget] = useState<{
    trip: TripRowItem;
    actionType: 'open-sale' | 'close-sale' | 'depart' | 'complete' | 'cancel' | 'delete';
    title: string;
    description: string;
  } | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const fetchTripsData = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const [tripsRes, routesRes, boatsRes, schedulesRes] = await Promise.all([
        getTrips({ limit: 100 }),
        getRoutes({ limit: 100 }),
        getBoats({ limit: 100 }),
        getSchedules({ limit: 100 }).catch(() => null),
      ]);

      const rawRoutes = routesRes?.data || [];
      const rawBoats = boatsRes?.data || [];
      const rawSchedules = schedulesRes?.data || [];
      setRoutes(rawRoutes);
      setBoats(rawBoats);
      setSchedules(rawSchedules);

      const routesMap = new Map<string, JourneyRoute>(
        rawRoutes.map((r: any) => [String(r.id), r])
      );
      const boatsMap = new Map<string, Boat>(
        rawBoats.map((b: any) => [String(b.id), b])
      );
      const schedulesMap = new Map<string, any>(
        rawSchedules.map((s: any, idx: number) => {
          let cleanCode = `SCH-0${idx + 1}`;
          if (
            s.code &&
            !s.code.includes('5YRO') &&
            !s.code.includes('dzrT') &&
            !s.code.includes('yaEM') &&
            !s.code.includes('OgYP') &&
            s.code.length <= 15
          ) {
            cleanCode = s.code;
          }
          return [String(s.id), { ...s, cleanCode }];
        })
      );

      if (tripsRes && tripsRes.data && Array.isArray(tripsRes.data)) {
        const mapped: TripRowItem[] = tripsRes.data.map((t: any) => {
          const route = t.route || (t.route_id ? routesMap.get(String(t.route_id)) : null);
          const boat = t.boat || (t.boat_id ? boatsMap.get(String(t.boat_id)) : null);

          const routeName = route?.name || (route?.code ? `Tuyến ${route.code}` : 'Tuyến hải trình');
          const boatName = boat?.name ? (boat.code ? `${boat.name} (${boat.code})` : boat.name) : 'Tàu Superdong';

          const startAt = t.start_at || t.departure_time || '';
          const endAt = t.end_at || t.arrival_time || '';
          const dateYMD = typeof startAt === 'string' && startAt.length >= 10 ? startAt.slice(0, 10) : '';

          const scheduleId = t.schedule_id ? String(t.schedule_id) : (t.schedule?.id ? String(t.schedule.id) : null);
          const sch = scheduleId ? schedulesMap.get(scheduleId) : null;
          const scheduleCode = sch?.cleanCode || sch?.code || t.schedule?.code || (scheduleId ? `SCH-${scheduleId.slice(-4).toUpperCase()}` : '');
          const scheduleName = sch?.name || t.schedule?.name || '';

          // Cache for Edit page
          localStorage.setItem(`superdong_trip_cache_${t.id}`, JSON.stringify({
            ...t,
            routeName,
            boatName,
          }));

          return {
            id: String(t.id),
            code: `TRIP-${String(t.id).slice(0, 6).toUpperCase()}`,
            schedule_id: scheduleId,
            schedule_code: scheduleCode,
            schedule_name: scheduleName,
            route_id: String(t.route_id || route?.id || ''),
            routeName,
            boat_id: String(t.boat_id || boat?.id || ''),
            boatName,
            start_at: startAt,
            end_at: endAt,
            departureTimeText: `${formatTime(startAt)} - ${formatTime(endAt)}`,
            departureDateText: formatDate(startAt),
            dateYMD,
            status: (t.status || 'draft') as TripStatus,
            version: typeof t.version === 'number' ? t.version : 1,
            shuttle_phone: t.shuttle_phone,
            raw: t,
          };
        });
        setTrips(mapped);
      } else {
        setTrips([]);
      }
    } catch (err: any) {
      console.error('Fetch trips error:', err);
      setTrips([]);
      setApiError(err?.response?.data?.message || err?.message || 'Không thể tải danh sách chuyến tàu từ Backend');
      toast.error('Không thể lấy dữ liệu chuyến tàu từ Backend API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripsData();
  }, []);

  // Dropdown Options
  const routeOptions: FilterOption[] = useMemo(() => [
    { value: 'all', label: 'Tất cả tuyến hải trình' },
    ...routes.map((r) => ({
      value: String(r.id),
      label: r.name ? (r.code ? `${r.name} (${r.code})` : r.name) : `Tuyến ${r.code || r.id}`,
    })),
  ], [routes]);

  const boatOptions: FilterOption[] = useMemo(() => [
    { value: 'all', label: 'Tất cả tàu vận hành' },
    ...boats.map((b) => ({
      value: String(b.id),
      label: b.name ? (b.code ? `${b.name} (${b.code})` : b.name) : 'Tàu Superdong',
    })),
  ], [boats]);

  // Handlers with URL State Sync (NO trim to allow typing spaces freely)
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

  const handleRouteFilterChange = (value: string) => {
    navigate({
      search: (prev: any) => {
        const next: any = { ...prev };
        if (value && value !== 'all') {
          next.route_id = value;
        } else {
          delete next.route_id;
        }
        delete next.page;
        return next;
      },
    });
  };

  const handleBoatFilterChange = (value: string) => {
    navigate({
      search: (prev: any) => {
        const next: any = { ...prev };
        if (value && value !== 'all') {
          next.boat_id = value;
        } else {
          delete next.boat_id;
        }
        delete next.page;
        return next;
      },
    });
  };

  const handleTimeFilterChange = (value: string) => {
    navigate({
      search: (prev: any) => {
        const next: any = { ...prev };
        if (value && value !== 'all') {
          next.time = value;
        } else {
          delete next.time;
        }
        delete next.page;
        return next;
      },
    });
  };

  const handleHubFilterChange = (hubKey: string) => {
    navigate({
      search: (prev: any) => {
        const next: any = { ...prev };
        if (hubKey && hubKey !== 'all') {
          next.hub = hubKey;
        } else {
          delete next.hub;
        }
        delete next.page;
        return next;
      },
    });
  };

  const handleResetFilters = () => {
    navigate({
      search: (prev: any) => {
        const next: any = { ...prev };
        delete next.search;
        delete next.status;
        delete next.route_id;
        delete next.boat_id;
        delete next.time;
        delete next.hub;
        delete next.schedule_id;
        delete next.month;
        delete next.page;
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

  const activeSchedule = useMemo(() => {
    if (!scheduleFilter) return null;
    return schedules.find((s: any) => String(s.id) === scheduleFilter);
  }, [schedules, scheduleFilter]);

  const scheduleDisplayName = useMemo(() => {
    if (!activeSchedule) return scheduleFilter ? `Lịch chạy #${scheduleFilter}` : '';
    const code = activeSchedule.cleanCode || activeSchedule.code || `Lịch #${scheduleFilter}`;
    const name = activeSchedule.name || activeSchedule.journey?.name || '';
    return name ? `${code} – ${name}` : code;
  }, [activeSchedule, scheduleFilter]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm.trim()) count += 1;
    if (statusFilter !== 'all') count += 1;
    if (routeFilter !== 'all') count += 1;
    if (boatFilter !== 'all') count += 1;
    if (timeFilter !== 'all') count += 1;
    if (hubFilter !== 'all') count += 1;
    if (scheduleFilter) count += 1;
    if (monthFilter) count += 1;
    return count;
  }, [searchTerm, statusFilter, routeFilter, boatFilter, timeFilter, hubFilter, scheduleFilter, monthFilter]);

  const todayYMD = useMemo(() => getTodayYMD(), []);

  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      // 1. Keyword search (matches code, route, boat, departure date text, schedule code/name)
      const keyword = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !keyword ||
        t.code.toLowerCase().includes(keyword) ||
        t.routeName.toLowerCase().includes(keyword) ||
        t.boatName.toLowerCase().includes(keyword) ||
        t.departureDateText.toLowerCase().includes(keyword) ||
        (t.schedule_code && t.schedule_code.toLowerCase().includes(keyword)) ||
        (t.schedule_name && t.schedule_name.toLowerCase().includes(keyword));

      // 2. Status filter
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;

      // 3. Route filter
      const matchesRoute = routeFilter === 'all' || t.route_id === routeFilter;

      // 4. Boat filter
      const matchesBoat = boatFilter === 'all' || t.boat_id === boatFilter;

      // 5. Time filter
      let matchesTime = true;
      if (timeFilter === 'today') {
        matchesTime = t.dateYMD === todayYMD;
      } else if (timeFilter === 'upcoming') {
        matchesTime = t.dateYMD >= todayYMD;
      } else if (timeFilter === 'past') {
        matchesTime = t.dateYMD < todayYMD;
      }

      // 6. Hub Region filter
      let matchesHub = true;
      if (hubFilter !== 'all') {
        const hubConfig = HUBS.find((h) => h.key === hubFilter);
        if (hubConfig && hubConfig.keywords) {
          const routeLower = t.routeName.toLowerCase();
          matchesHub = hubConfig.keywords.some((kw) => routeLower.includes(kw));
        }
      }

      // 7. Schedule ID filter (Từ Timeline Matrix hoặc Notification)
      const matchesSchedule = !scheduleFilter || t.schedule_id === scheduleFilter || t.raw?.schedule_id?.toString() === scheduleFilter;

      // 8. Month filter (Từ Timeline Matrix "2026-08")
      const matchesMonth = !monthFilter || t.dateYMD.startsWith(monthFilter);

      return matchesSearch && matchesStatus && matchesRoute && matchesBoat && matchesTime && matchesHub && matchesSchedule && matchesMonth;
    });
  }, [trips, searchTerm, statusFilter, routeFilter, boatFilter, timeFilter, hubFilter, scheduleFilter, monthFilter, todayYMD]);

  const handleExecuteStatusAction = async () => {
    if (!actionTarget) return;

    setIsProcessingAction(true);
    const { trip, actionType } = actionTarget;

    try {
      if (actionType === 'open-sale') {
        await openTripForSale(trip.id, {
          expected_version: trip.version,
          reason: `Mở bán vé chuyến ${trip.code} từ dashboard`,
        });
        toast.success(`Đã mở bán vé cho chuyến ${trip.code} thành công!`);
      } else if (actionType === 'close-sale') {
        await closeTripForSale(trip.id, {
          expected_version: trip.version,
          reason: `Khóa sổ bán vé chuyến ${trip.code} từ dashboard`,
        });
        toast.success(`Đã khóa bán vé cho chuyến ${trip.code}!`);
      } else if (actionType === 'depart') {
        await markTripDeparted(trip.id, {
          expected_version: trip.version,
          reason: `Xác nhận chuyến ${trip.code} đã xuất bến`,
        });
        toast.success(`Chuyến ${trip.code} đã xuất bến!`);
      } else if (actionType === 'complete') {
        await completeTrip(trip.id, {
          expected_version: trip.version,
          reason: `Xác nhận chuyến ${trip.code} đã cập bến hoàn tất`,
        });
        toast.success(`Chuyến ${trip.code} đã hoàn thành hành trình!`);
      } else if (actionType === 'cancel') {
        await cancelTrip(trip.id, {
          expected_version: trip.version,
          reason: `Hủy chuyến ${trip.code} do yêu cầu điều hành`,
        });
        toast.success(`Đã hủy chuyến ${trip.code}!`);
      } else if (actionType === 'delete') {
        await deleteTrip(trip.id, {
          reason: `Xóa chuyến nháp ${trip.code}`,
        });
        toast.success(`Đã xóa chuyến ${trip.code} thành công!`);
      }

      setActionTarget(null);
      await fetchTripsData();
    } catch (err: any) {
      console.error('Trip status action error:', err);
      const msg = err?.response?.data?.message || err?.message || 'Thao tác không thành công';
      toast.error(`Lỗi: ${msg}`);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const columns: ColumnDef<TripRowItem>[] = [
    {
      key: 'code',
      label: 'MÃ CHUYẾN',
      sortable: true,
      render: (t) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
            <Ship size={15} />
          </div>
          <div>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
              {t.code}
            </span>
            <div className="text-[11px] text-slate-400 font-mono">ID: {t.id}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'routeName',
      label: 'TUYẾN HẢI TRÌNH',
      sortable: true,
      render: (t) => (
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
            {t.routeName}
          </span>
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
            <Ship size={12} className="text-slate-400" />
            <span className="font-medium text-slate-700 dark:text-slate-300">{t.boatName}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'departureDateText',
      label: 'NGÀY KHỞI HÀNH',
      sortable: true,
      render: (t) => {
        const isToday = t.dateYMD === todayYMD;
        const isUpcoming = t.dateYMD > todayYMD;
        return (
          <div>
            <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
              <Calendar size={13} className="text-blue-500" />
              <span>{t.departureDateText}</span>
              {isToday && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                  Hôm nay
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
              <Clock size={12} className="text-slate-400" />
              <span className="font-semibold text-blue-600 dark:text-blue-400">{t.departureTimeText}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'TRẠNG THÁI',
      sortable: true,
      render: (t) => {
        const meta = STATUS_LABELS[t.status] || STATUS_LABELS.draft;
        const IconComponent = meta.icon;
        return (
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${meta.colorClass}`}>
            <IconComponent size={12} /> {meta.label}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'THAO TÁC',
      align: 'right',
      render: (t) => (
        <div className="flex items-center justify-end gap-1">
          {/* Status Quick Operations */}
          {t.status === 'draft' && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-[11px] font-semibold border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 gap-1"
              onClick={() =>
                setActionTarget({
                  trip: t,
                  actionType: 'open-sale',
                  title: 'Xác nhận mở bán vé chuyến tàu',
                  description: `Bạn có chắc chắn muốn mở bán vé cho chuyến ${t.code} (${t.routeName})?`,
                })
              }
              title="Mở bán vé cho chuyến này"
            >
              <Unlock size={12} /> Mở bán
            </Button>
          )}

          {t.status === 'selling' && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-[11px] font-semibold border-amber-500/30 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 gap-1"
              onClick={() =>
                setActionTarget({
                  trip: t,
                  actionType: 'close-sale',
                  title: 'Xác nhận đóng bán vé chuyến tàu',
                  description: `Bạn có muốn khóa sổ bán vé cho chuyến ${t.code}?`,
                })
              }
              title="Đóng / Khóa bán vé"
            >
              <Lock size={12} /> Khóa bán
            </Button>
          )}

          {t.status === 'closed' && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-[11px] font-semibold border-blue-500/30 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 gap-1"
              onClick={() =>
                setActionTarget({
                  trip: t,
                  actionType: 'depart',
                  title: 'Xác nhận tàu xuất bến',
                  description: `Xác nhận chuyến ${t.code} đã rời cảng để bắt đầu hải trình?`,
                })
              }
              title="Xác nhận xuất bến"
            >
              <Play size={12} /> Xuất bến
            </Button>
          )}

          {t.status === 'started' && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-[11px] font-semibold border-purple-500/30 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 gap-1"
              onClick={() =>
                setActionTarget({
                  trip: t,
                  actionType: 'complete',
                  title: 'Xác nhận chuyến tàu hoàn thành',
                  description: `Xác nhận chuyến ${t.code} đã cập bến an toàn và hoàn tất chuyến đi?`,
                })
              }
              title="Hoàn tất chuyến"
            >
              <CheckCheck size={12} /> Hoàn tất
            </Button>
          )}

          {/* Edit / Detail */}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 dark:text-blue-400" asChild>
            <Link to={'/trips/$tripId/edit' as any} params={{ tripId: t.id } as any} title="Chỉnh sửa / Đổi tàu / Đổi giờ">
              <Edit size={15} />
            </Link>
          </Button>

          {/* Cancel or Delete */}
          {t.status !== 'completed' && t.status !== 'cancelled' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-rose-600 hover:text-rose-700 dark:text-rose-400"
              onClick={() => {
                if (t.status === 'draft') {
                  setActionTarget({
                    trip: t,
                    actionType: 'delete',
                    title: 'Xóa chuyến tàu nháp',
                    description: `Bạn có chắc muốn xóa chuyến nháp ${t.code}?`,
                  });
                } else {
                  setActionTarget({
                    trip: t,
                    actionType: 'cancel',
                    title: 'Hủy chuyến tàu',
                    description: `Cảnh báo: Hủy chuyến ${t.code} sẽ cấp quyền đổi vé cho các khách hàng đã đặt! Bạn có chắc chắn muốn hủy?`,
                  });
                }
              }}
              title={t.status === 'draft' ? 'Xóa chuyến' : 'Hủy chuyến'}
            >
              {t.status === 'draft' ? <Trash2 size={15} /> : <Ban size={15} />}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <AdminTablePage
        title="Quản Lý Chuyến Tàu Khởi Hành"
        subtitle="Danh sách các chuyến tàu thực tế khởi hành trong ngày, kiểm soát trạng thái bán vé và điều hành chuyến Superdong"
        icon={Ship}
        apiError={apiError}
        searchValue={searchTerm}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Tìm theo mã (TRIP-...), tuyến (Côn Đảo...), tàu, ngày..."
        filterValue={statusFilter}
        onFilterChange={handleStatusFilterChange}
        filterOptions={statusOptions}
        extraFilters={
          <div className="flex flex-wrap items-center gap-2">
            {/* Route Filter */}
            <FilterSelect
              value={routeFilter}
              onChange={handleRouteFilterChange}
              options={routeOptions}
              placeholder="Tất cả tuyến hải trình"
              itemTypeLabel="tuyến"
            />

            {/* Boat Filter */}
            <FilterSelect
              value={boatFilter}
              onChange={handleBoatFilterChange}
              options={boatOptions}
              placeholder="Tất cả tàu vận hành"
              itemTypeLabel="tàu"
            />

            {/* Time Filter */}
            <FilterSelect
              value={timeFilter}
              onChange={handleTimeFilterChange}
              options={timeOptions}
              placeholder="Tất cả thời gian"
            />

            {/* Clear Filters Button */}
            {activeFilterCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 px-2.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-800 gap-1"
                title="Xóa toàn bộ bộ lọc"
              >
                <RotateCcw size={13} />
                <span>Xóa lọc ({activeFilterCount})</span>
              </Button>
            )}
          </div>
        }
        banner={
          <div className="space-y-2.5">
            {(scheduleFilter || monthFilter) && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 px-3.5 bg-blue-50/90 dark:bg-blue-950/50 rounded-xl border border-blue-200/80 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 shadow-2xs">
                <div className="flex items-center gap-2 font-medium">
                  <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
                  <span>
                    Đang xem danh sách chuyến của{' '}
                    {scheduleFilter && <strong className="font-bold underline">{scheduleDisplayName}</strong>}
                    {scheduleFilter && monthFilter && ' trong '}
                    {monthFilter && <strong className="font-bold">Tháng {monthFilter}</strong>}
                    {' '}(Tìm thấy <strong className="font-extrabold text-blue-700 dark:text-blue-300">{filteredTrips.length}</strong> chuyến khớp)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigate({
                      search: (prev: any) => {
                        const next = { ...prev };
                        delete next.schedule_id;
                        delete next.month;
                        return next;
                      },
                    });
                  }}
                  className="text-blue-700 hover:text-blue-900 dark:text-blue-300 font-bold hover:underline cursor-pointer flex items-center gap-1 text-[11px]"
                >
                  <X size={13} /> Xem tất cả chuyến tàu
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800/80 text-xs">
              {/* Hub Quick Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
                <MapPin size={13} className="text-blue-500" />
                Vùng cảng:
              </span>
              {HUBS.map((h) => {
                const isActive = hubFilter === h.key;
                return (
                  <button
                    key={h.key}
                    type="button"
                    onClick={() => handleHubFilterChange(h.key)}
                    className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {h.label}
                  </button>
                );
              })}
            </div>

              {/* Quick Stats Summary */}
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                <span>
                  Hiển thị: <strong className="text-slate-900 dark:text-slate-100">{filteredTrips.length}</strong> / {trips.length} chuyến
                </span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 size={13} />
                  {filteredTrips.filter((t) => t.status === 'selling').length} Đang mở bán
                </span>
              </div>
            </div>
          </div>
        }
        columns={columns}
        columnStorageKey="superdong_trips_columns"
        onRefresh={fetchTripsData}
        refreshing={loading}
        createLink="/trips/create"
        createLabel="Mở Chuyến Mới"
        data={filteredTrips}
        loading={loading}
        emptyText="Chưa có chuyến tàu nào phù hợp với bộ lọc."
        keyExtractor={(t) => String(t.id)}
        entityLabel="chuyến tàu"
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />

      {/* Confirmation Modal for Status Actions */}
      <ConfirmModal
        open={!!actionTarget}
        onOpenChange={(open) => {
          if (!open) setActionTarget(null);
        }}
        title={actionTarget?.title || 'Xác nhận thao tác'}
        description={actionTarget?.description || ''}
        confirmLabel={
          isProcessingAction
            ? 'Đang xử lý...'
            : actionTarget?.actionType === 'cancel' || actionTarget?.actionType === 'delete'
              ? 'Xác nhận hủy/xóa'
              : 'Xác nhận thực hiện'
        }
        loading={isProcessingAction}
        variant={actionTarget?.actionType === 'cancel' || actionTarget?.actionType === 'delete' ? 'destructive' : 'default'}
        onConfirm={handleExecuteStatusAction}
      />
    </>
  );
}
