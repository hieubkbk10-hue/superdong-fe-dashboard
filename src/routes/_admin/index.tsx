import React, { useEffect, useState, useMemo } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  DollarSign,
  Ticket,
  Ship,
  Users,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  CalendarDays,
  Clock,
  LayoutGrid,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Lock,
  Play,
  CheckCheck,
  XCircle,
  Edit,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

import { getAllTrips } from '@/apis/trips';
import { getBookings } from '@/apis/bookings';
import { getBoats } from '@/apis/boats';
import { getRoutes } from '@/apis/journeys';
import { getSchedules } from '@/apis/trips';
import { Boat, Route as JourneyRoute, Schedule, Trip, TripStatus } from '@/types';
import { Button } from '@/components/common/Button';
import { SearchInput, FilterSelect, FilterOption, useTablePagination } from '@/components/common/TableUtilities';
import { PaginationBar } from '@/components/common/PaginationBar';

export const Route = createFileRoute('/_admin/')({
  component: DashboardOverview,
});

/* ==========================================================================
   Helper Functions for Dates & Time
   ========================================================================== */

function formatYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatTimeOnly(isoStr?: string): string {
  if (!isoStr) return '--:--';
  try {
    const d = new Date(isoStr);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }
    return isoStr.slice(11, 16) || isoStr.slice(0, 5) || '--:--';
  } catch {
    return '--:--';
  }
}

function formatDateDisplay(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    const days = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const dayName = days[d.getDay()];
    const dayOfMonth = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${dayName}, ${dayOfMonth}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

function getWeekDays(baseDate: Date) {
  const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  const day = d.getDay(); // 0 is Sunday, 1 is Monday
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMon);

  const days: { dateStr: string; displayDate: string; dayLabel: string; isToday: boolean }[] = [];
  const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
  const todayStr = formatYMD(new Date());

  for (let i = 0; i < 7; i++) {
    const cur = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const dateStr = formatYMD(cur);
    const dayNum = String(cur.getDate()).padStart(2, '0');
    const monthNum = String(cur.getMonth() + 1).padStart(2, '0');
    days.push({
      dateStr,
      displayDate: `${dayNum}/${monthNum}`,
      dayLabel: dayNames[i],
      isToday: dateStr === todayStr,
    });
  }

  return { monday, days };
}

/* ==========================================================================
   Trip Status Map Configuration
   ========================================================================== */

const statusConfig: Record<TripStatus, { label: string; badgeClass: string; icon: any }> = {
  draft: {
    label: 'Bản nháp',
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    icon: Clock,
  },
  open: {
    label: 'Đang mở bán',
    badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    icon: CheckCircle2,
  },
  selling: {
    label: 'Đang mở bán',
    badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    icon: CheckCircle2,
  },
  closed: {
    label: 'Đã khóa sổ',
    badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    icon: Lock,
  },
  started: {
    label: 'Đã xuất bến',
    badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    icon: Play,
  },
  departed: {
    label: 'Đã xuất bến',
    badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    icon: Play,
  },
  completed: {
    label: 'Hoàn thành',
    badgeClass: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
    icon: CheckCheck,
  },
  cancelled: {
    label: 'Đã hủy',
    badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    icon: XCircle,
  },
};

import { useDashboardStore, PeriodPreset, ViewMode } from '@/store/useDashboardStore';

function DashboardOverview() {
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Raw Server Data
  const [trips, setTrips] = useState<Trip[]>([]);
  const [routes, setRoutes] = useState<JourneyRoute[]>([]);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  // Key KPI Metrics
  const [revenue, setRevenue] = useState<number>(0);
  const [totalBookings, setTotalBookings] = useState<number>(0);
  const [activeTripsCount, setActiveTripsCount] = useState<number>(0);
  const [totalPassengers, setTotalPassengers] = useState<number>(0);

  // Zustand Persisted Dashboard Preferences
  const { period, viewMode, setPeriod, setViewMode } = useDashboardStore();

  // Local Filter & Display States
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState<number>(0); // 0 = current week, 1 = next week, -1 = prev week
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRouteFilter, setSelectedRouteFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Table Pagination with Zustand Persist (Nhớ pageSize khi F5)
  const {
    currentPage,
    pageSize,
    setCurrentPage,
    onPageChange,
    onPageSizeChange,
  } = useTablePagination('dashboard_trips', 10);

  const fetchDashboardData = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const [tripsData, bookingsRes, boatsRes, routesRes, schedulesRes] = await Promise.all([
        getAllTrips(),
        getBookings({ limit: 100 }).catch(() => null),
        getBoats({ limit: 100 }).catch(() => null),
        getRoutes({ limit: 100 }).catch(() => null),
        getSchedules({ limit: 100 }).catch(() => null),
      ]);

      const allTripsList = Array.isArray(tripsData) ? tripsData : [];
      setTrips(allTripsList);

      if (routesRes?.data && Array.isArray(routesRes.data)) {
        setRoutes(routesRes.data);
      }
      if (boatsRes?.data && Array.isArray(boatsRes.data)) {
        setBoats(boatsRes.data);
      }
      if (schedulesRes?.data && Array.isArray(schedulesRes.data)) {
        setSchedules(schedulesRes.data);
      }

      // Calculate upcoming active trips count
      const todayStart = new Date().setHours(0, 0, 0, 0);
      const activeCount = allTripsList.filter((t) => {
        const startStr = t.start_at || t.departure_time;
        if (!startStr) return false;
        const time = new Date(startStr).getTime();
        const isUpcoming = Number.isNaN(time) || time >= todayStart;
        return isUpcoming && t.status !== 'cancelled' && t.status !== 'completed';
      }).length;
      setActiveTripsCount(activeCount);

      // Bookings & Revenue calculation
      if (bookingsRes && bookingsRes.data && Array.isArray(bookingsRes.data)) {
        setTotalBookings(bookingsRes.data.length);
        let calculatedRev = 0;
        let paxCount = 0;
        bookingsRes.data.forEach((b: any) => {
          calculatedRev += Number(b.final_amount || b.total_amount || 0);
          paxCount += b.travelers ? b.travelers.length : 1;
        });
        setRevenue(calculatedRev);
        setTotalPassengers(paxCount);
      } else {
        setTotalBookings(0);
        setRevenue(0);
        setTotalPassengers(0);
      }
    } catch (err: any) {
      console.error('Fetch dashboard error:', err);
      setApiError(err?.message || 'Không thể kết nối API');
      toast.error('Không thể lấy dữ liệu từ Backend API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Lookup Maps
  const routesMap = useMemo(() => new Map(routes.map((r) => [String(r.id), r])), [routes]);
  const boatsMap = useMemo(() => new Map(boats.map((b) => [String(b.id), b])), [boats]);
  const schedulesMap = useMemo(() => new Map(schedules.map((s) => [String(s.id), s])), [schedules]);

  // Week Days calculation with weekOffset
  const weekInfo = useMemo(() => {
    const today = new Date();
    const targetDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + weekOffset * 7);
    return getWeekDays(targetDate);
  }, [weekOffset]);

  // Handle Period Presets change
  const handlePeriodChange = (newPeriod: PeriodPreset) => {
    setPeriod(newPeriod);
    setSelectedDayDate(null);
    setCurrentPage(1);

    if (newPeriod === 'this_week') setWeekOffset(0);
    else if (newPeriod === 'next_week') setWeekOffset(1);
  };

  // Enriched Trips with Date & Search String
  const enrichedTrips = useMemo(() => {
    return trips.map((t: any) => {
      const startStr = t.start_at || t.departure_time || '';
      let datePart = '';
      let timePart = '--:--';
      let tripTimestamp = 0;

      if (startStr) {
        const d = new Date(startStr);
        if (!Number.isNaN(d.getTime())) {
          datePart = formatYMD(d);
          timePart = formatTimeOnly(startStr);
          tripTimestamp = d.getTime();
        } else {
          datePart = startStr.slice(0, 10);
          timePart = startStr.slice(11, 16) || '--:--';
        }
      }

      const endStr = t.end_at || t.arrival_time;
      const endTimePart = endStr ? formatTimeOnly(endStr) : undefined;

      const routeObj = t.route_id ? routesMap.get(String(t.route_id)) : t.route;
      const boatObj = t.boat_id ? boatsMap.get(String(t.boat_id)) : t.boat;
      const scheduleObj = t.schedule_id ? schedulesMap.get(String(t.schedule_id)) : t.schedule;

      const routeName = routeObj?.name || 'Tuyến hải trình';
      const boatName = boatObj?.name ? (boatObj.code ? `${boatObj.name} (${boatObj.code})` : boatObj.name) : 'Tàu Superdong';
      const scheduleName = scheduleObj?.name || (t.schedule_id ? `Lịch SCH-${String(t.schedule_id).slice(0, 4)}` : undefined);
      const displayCode = t.code || `TRIP-${String(t.id).slice(0, 6)}`;

      const searchContent = `${t.id} ${displayCode} ${routeName} ${boatName} ${scheduleName || ''} ${datePart}`.toLowerCase();

      return {
        ...t,
        displayCode,
        datePart,
        timePart,
        endTimePart,
        tripTimestamp,
        routeName,
        boatName,
        scheduleName,
        searchContent,
      };
    });
  }, [trips, routesMap, boatsMap, schedulesMap]);

  // Count trips per day for the active week strip
  const tripsCountByDate = useMemo(() => {
    const counts = new Map<string, number>();
    enrichedTrips.forEach((t) => {
      if (t.datePart) {
        counts.set(t.datePart, (counts.get(t.datePart) || 0) + 1);
      }
    });
    return counts;
  }, [enrichedTrips]);

  // Filtered Trips based on Period, Day, Search & Dropdowns
  const filteredTrips = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    // 1. Period Boundaries
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();

    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
    const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59).getTime();

    const weekMon = weekInfo.monday.getTime();
    const weekSun = new Date(weekInfo.monday.getFullYear(), weekInfo.monday.getMonth(), weekInfo.monday.getDate() + 6, 23, 59, 59).getTime();

    return enrichedTrips.filter((t) => {
      const time = t.tripTimestamp || 0;

      // Period filter
      if (period === 'this_week' || period === 'next_week') {
        if (selectedDayDate) {
          if (t.datePart !== selectedDayDate) return false;
        } else {
          if (time < weekMon || time > weekSun) return false;
        }
      } else if (period === 'this_month') {
        if (time < thisMonthStart || time > thisMonthEnd) return false;
      } else if (period === 'next_month') {
        if (time < nextMonthStart || time > nextMonthEnd) return false;
      } else if (period === 'all_upcoming') {
        if (time < todayStart && t.status !== 'selling') return false;
      } else if (period === 'past') {
        if (time >= todayStart && t.status !== 'completed' && t.status !== 'cancelled') return false;
      }

      // Keyword search
      if (searchTerm.trim()) {
        const query = searchTerm.trim().toLowerCase();
        if (!t.searchContent.includes(query)) return false;
      }

      // Route filter
      if (selectedRouteFilter !== 'all') {
        if (String(t.route_id) !== selectedRouteFilter) return false;
      }

      // Status filter
      if (selectedStatusFilter !== 'all') {
        if (t.status !== selectedStatusFilter) return false;
      }

      return true;
    }).sort((a, b) => (a.tripTimestamp || 0) - (b.tripTimestamp || 0));
  }, [enrichedTrips, period, selectedDayDate, weekInfo, searchTerm, selectedRouteFilter, selectedStatusFilter]);

  // Grouped trips by day for Calendar / Card View
  const groupedTripsByDay = useMemo(() => {
    const groups: { dateStr: string; formattedHeader: string; trips: typeof filteredTrips }[] = [];
    const dateMap = new Map<string, typeof filteredTrips>();

    filteredTrips.forEach((t) => {
      const key = t.datePart || 'Chưa xác định';
      if (!dateMap.has(key)) dateMap.set(key, []);
      dateMap.get(key)!.push(t);
    });

    // Sort days chronologically
    const sortedDates = Array.from(dateMap.keys()).sort();
    sortedDates.forEach((dateStr) => {
      groups.push({
        dateStr,
        formattedHeader: formatDateDisplay(dateStr),
        trips: dateMap.get(dateStr)!,
      });
    });

    return groups;
  }, [filteredTrips]);

  // Paginated Trips for Table View
  const paginatedTrips = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTrips.slice(start, start + pageSize);
  }, [filteredTrips, currentPage, pageSize]);

  // Filter options for Dropdowns
  const routeOptions: FilterOption[] = useMemo(() => {
    const list: FilterOption[] = [{ value: 'all', label: 'Tất cả tuyến tàu' }];
    routes.forEach((r) => {
      list.push({ value: String(r.id), label: r.name || (r.code ? String(r.code) : 'Tuyến hải trình') });
    });
    return list;
  }, [routes]);

  const statusOptions: FilterOption[] = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'selling', label: 'Đang mở bán' },
    { value: 'closed', label: 'Đã khóa sổ' },
    { value: 'started', label: 'Đã xuất bến' },
    { value: 'completed', label: 'Hoàn thành' },
    { value: 'draft', label: 'Bản nháp' },
    { value: 'cancelled', label: 'Đã hủy' },
  ];

  const formatVND = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="space-y-3.5 font-sans pb-8">
      {/* Title & Refresh */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Tổng quan
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchDashboardData}
            disabled={loading}
            className="h-8 w-8 text-slate-700 dark:text-slate-200"
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </Button>
          <Button variant="primary" className="h-8 px-3 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white" asChild>
            <Link to="/trips/create">
              + Tạo Chuyến Mới
            </Link>
          </Button>
        </div>
      </div>

      {/* API Error Alert */}
      {apiError && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0 text-rose-500" />
          <span>Không thể đồng bộ dữ liệu từ Backend API: {apiError}.</span>
        </div>
      )}

      {/* Top Stats Cards - Super Slim, Square & Compact (Cao = 1/2) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Tổng Doanh Thu</span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white font-mono mt-0.5 block">
              {loading ? '...' : formatVND(revenue)}
            </span>
          </div>
          <div className="h-7 w-7 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign size={14} />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Tổng Đơn Đặt Vé</span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white font-mono mt-0.5 block">
              {loading ? '...' : `${totalBookings} đơn`}
            </span>
          </div>
          <div className="h-7 w-7 rounded-md bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <Ticket size={14} />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Chuyến Sắp & Đang Chạy</span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white font-mono mt-0.5 block">
              {loading ? '...' : `${activeTripsCount} chuyến`}
            </span>
          </div>
          <div className="h-7 w-7 rounded-md bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
            <Ship size={14} />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Hành Khách Phục Vụ</span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white font-mono mt-0.5 block">
              {loading ? '...' : `${totalPassengers} khách`}
            </span>
          </div>
          <div className="h-7 w-7 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Users size={14} />
          </div>
        </div>
      </div>

      {/* ==========================================================================
          MAIN SECTION: LỊCH CHUYẾN TÀU VẬN HÀNH & TƯƠNG LAI
          ========================================================================== */}
      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3.5">
        {/* Section Header with Period Selector & View Mode Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="text-blue-600 h-4.5 w-4.5" />
              Lịch tàu chạy
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Tổng cộng <span className="font-bold text-blue-600 dark:text-blue-400">{filteredTrips.length}</span> chuyến
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Period Filter Chips */}
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handlePeriodChange('this_week')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  period === 'this_week'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Tuần này
              </button>
              <button
                type="button"
                onClick={() => handlePeriodChange('next_week')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  period === 'next_week'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Tuần sau
              </button>
              <button
                type="button"
                onClick={() => handlePeriodChange('this_month')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  period === 'this_month'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Tháng này
              </button>
              <button
                type="button"
                onClick={() => handlePeriodChange('next_month')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  period === 'next_month'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Tháng sau
              </button>
              <button
                type="button"
                onClick={() => handlePeriodChange('all_upcoming')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  period === 'all_upcoming'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Tất cả sắp chạy
              </button>
              <button
                type="button"
                onClick={() => handlePeriodChange('past')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  period === 'past'
                    ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Lịch sử cũ
              </button>
            </div>

            {/* View Mode Toggle - Icon only (Bảng chi tiết vs Thẻ lịch) */}
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Bảng Chi Tiết"
              >
                <TableIcon size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                  viewMode === 'calendar'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Thẻ Lịch theo ngày"
              >
                <LayoutGrid size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Weekly Day Strip (Thứ 2 -> Chủ Nhật) - Super Compact */}
        {(period === 'this_week' || period === 'next_week') && (
          <div className="space-y-2 bg-slate-50/70 dark:bg-slate-800/30 p-2.5 sm:p-3 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {period === 'this_week' ? 'Lịch Tuần Này' : 'Lịch Tuần Sau'}
                </span>
                <span className="text-[11px] text-slate-400">
                  ({weekInfo.days[0].displayDate} — {weekInfo.days[6].displayDate})
                </span>
              </div>

              <div className="flex items-center gap-2">
                {selectedDayDate && (
                  <button
                    type="button"
                    onClick={() => setSelectedDayDate(null)}
                    className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                  >
                    Xem cả tuần
                  </button>
                )}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setWeekOffset((prev) => prev - 1);
                      setSelectedDayDate(null);
                    }}
                    className="h-6 w-6 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-white dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 cursor-pointer"
                    title="Tuần trước"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWeekOffset((prev) => prev + 1);
                      setSelectedDayDate(null);
                    }}
                    className="h-6 w-6 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-white dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 cursor-pointer"
                    title="Tuần tiếp theo"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* 7 Days Interactive Buttons - Slim & Inline */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 sm:gap-2">
              {weekInfo.days.map((d) => {
                const count = tripsCountByDate.get(d.dateStr) || 0;
                const isSelected = selectedDayDate === d.dateStr;

                return (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => setSelectedDayDate(isSelected ? null : d.dateStr)}
                    className={`py-1.5 px-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : d.isToday
                          ? 'bg-blue-50/70 border-blue-200/90 dark:bg-blue-950/30 dark:border-blue-800 text-slate-900 dark:text-slate-100'
                          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-bold ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                        {d.dayLabel}
                      </span>
                      {d.isToday && !isSelected && (
                        <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-bold">
                          Hôm nay
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-xs font-extrabold font-mono">
                        {d.displayDate}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          isSelected
                            ? 'bg-blue-700 text-white'
                            : count > 0
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                        }`}
                      >
                        {count > 0 ? `${count} chuyến` : 'Nghỉ'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Tìm theo mã chuyến, tên tàu, tuyến..."
              wrapperClassName="w-full sm:w-72"
            />
            <FilterSelect
              value={selectedRouteFilter}
              onChange={setSelectedRouteFilter}
              options={routeOptions}
              placeholder="Tất cả tuyến tàu"
              itemTypeLabel="tuyến tàu"
              className="w-full sm:w-auto min-w-[140px]"
            />
            <FilterSelect
              value={selectedStatusFilter}
              onChange={setSelectedStatusFilter}
              options={statusOptions}
              placeholder="Tất cả trạng thái"
              itemTypeLabel="trạng thái"
              className="w-full sm:w-auto min-w-[140px]"
            />
          </div>

          <div className="text-xs font-medium text-slate-500 self-end sm:self-auto">
            Hiển thị <span className="font-bold text-slate-900 dark:text-slate-100">{filteredTrips.length}</span> chuyến
          </div>
        </div>

        {/* ==========================================================================
            VIEW MODE 1: CALENDAR DAY CARDS (Trực quan, gom nhóm theo ngày)
            ========================================================================== */}
        {viewMode === 'calendar' && (
          <div className="space-y-6">
            {loading ? (
              <div className="py-12 text-center text-slate-500 flex items-center justify-center gap-2">
                <RefreshCw size={16} className="animate-spin text-blue-600" />
                <span>Đang tải danh sách lịch chuyến tàu...</span>
              </div>
            ) : groupedTripsByDay.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <CalendarDays className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Không tìm thấy chuyến tàu nào trong khoảng thời gian này.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Hãy thử chọn khoảng thời gian khác hoặc kiểm tra lại bộ lọc.
                </p>
              </div>
            ) : (
              groupedTripsByDay.map((group) => (
                <div key={group.dateStr} className="space-y-3">
                  {/* Day Group Header */}
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {group.formattedHeader}
                    </h3>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      {group.trips.length} chuyến
                    </span>
                  </div>

                  {/* Trip Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {group.trips.map((t) => {
                      const statusInfo = statusConfig[t.status as TripStatus] || statusConfig.selling;
                      const StatusIcon = statusInfo.icon;

                      return (
                        <div
                          key={t.id}
                          className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs hover:shadow-md transition-all space-y-3 group"
                        >
                          {/* Card Top: Code & Status */}
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md border border-blue-200/60 dark:border-blue-800/60">
                              {t.displayCode}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusInfo.badgeClass}`}
                            >
                              <StatusIcon size={11} />
                              {statusInfo.label}
                            </span>
                          </div>

                          {/* Card Middle: Time & Route */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-base font-extrabold text-slate-900 dark:text-white font-mono">
                              <Clock size={16} className="text-slate-400" />
                              <span>{t.timePart}</span>
                              {t.endTimePart && (
                                <>
                                  <ArrowRight size={13} className="text-slate-400" />
                                  <span className="text-slate-600 dark:text-slate-300">{t.endTimePart}</span>
                                </>
                              )}
                            </div>
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                              {t.routeName}
                            </div>
                          </div>

                          {/* Card Details: Boat & Schedule */}
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <Ship size={12} className="text-slate-400" /> Tàu:
                              </span>
                              <span className="font-medium text-slate-700 dark:text-slate-300">{t.boatName}</span>
                            </div>
                            {t.scheduleName && (
                              <div className="flex items-center justify-between">
                                <span>Lịch mẫu:</span>
                                <span className="font-mono text-slate-600 dark:text-slate-400 text-[11px]">{t.scheduleName}</span>
                              </div>
                            )}
                          </div>

                          {/* Card Action Link */}
                          <div className="pt-2 flex items-center justify-end">
                            <Link
                              to={'/trips/$tripId/edit' as any}
                              params={{ tripId: String(t.id) } as any}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group-hover:underline"
                            >
                              <span>Điều hành chuyến</span>
                              <ExternalLink size={12} />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ==========================================================================
            VIEW MODE 2: FULL DATA TABLE (Bảng dữ liệu chi tiết kèm phân trang)
            ========================================================================== */}
        {viewMode === 'table' && (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">MÃ CHUYẾN</th>
                    <th className="p-3.5">NGÀY & GIỜ CHẠY</th>
                    <th className="p-3.5">TUYẾN HẢI TRÌNH</th>
                    <th className="p-3.5">TÀU PHỤ TRÁCH</th>
                    <th className="p-3.5">LỊCH MẪU</th>
                    <th className="p-3.5">TRẠNG THÁI</th>
                    <th className="p-3.5 text-right">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        <RefreshCw size={16} className="animate-spin text-blue-600 inline mr-2" />
                        Đang tải dữ liệu chuyến tàu...
                      </td>
                    </tr>
                  ) : paginatedTrips.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        Không có chuyến tàu nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    paginatedTrips.map((t) => {
                      const statusInfo = statusConfig[t.status as TripStatus] || statusConfig.selling;
                      const StatusIcon = statusInfo.icon;

                      return (
                        <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                            {t.displayCode}
                          </td>
                          <td className="p-3.5">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {t.datePart ? formatDateDisplay(t.datePart) : 'Chưa có ngày'}
                            </div>
                            <div className="font-mono text-slate-500 mt-0.5 flex items-center gap-1">
                              <Clock size={11} />
                              <span>{t.timePart}</span>
                              {t.endTimePart && (
                                <>
                                  <span>➔</span>
                                  <span>{t.endTimePart}</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5 font-medium text-slate-800 dark:text-slate-200">
                            {t.routeName}
                          </td>
                          <td className="p-3.5 text-slate-700 dark:text-slate-300">
                            {t.boatName}
                          </td>
                          <td className="p-3.5 font-mono text-slate-500 text-[11px]">
                            {t.scheduleName || '—'}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusInfo.badgeClass}`}
                            >
                              <StatusIcon size={11} />
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
                              title="Điều hành chuyến tàu"
                              asChild
                            >
                              <Link to={'/trips/$tripId/edit' as any} params={{ tripId: String(t.id) } as any}>
                                <Edit size={15} />
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination for Table View */}
            {filteredTrips.length > 0 && (
              <PaginationBar
                currentPage={currentPage}
                totalItems={filteredTrips.length}
                pageSize={pageSize}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
