import React, { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Ship,
  Clock,
  CalendarPlus,
  ExternalLink,
  Check,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/common/Button';
import { ScheduleItem } from '@/routes/_admin/schedules/index';
import { Trip } from '@/types';
import { generateTripsFromSchedule } from '@/apis/trips';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

function formatCellDate(dateStr?: string) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr.slice(0, 10);
    return d.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function formatCellTime(dateStr?: string) {
  if (!dateStr) return '--:--';
  if (dateStr.includes('T')) {
    const match = dateStr.match(/T(\d{2}:\d{2})/);
    if (match) return match[1];
  }
  if (dateStr.includes(' ')) {
    const parts = dateStr.split(' ');
    if (parts[1]) return parts[1].slice(0, 5);
  }
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr.slice(11, 16) || '--:--';
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--:--';
  }
}

export type MonthInfo = {
  year: number;
  month: number; // 1 - 12
  key: string; // "YYYY-MM"
  label: string; // "Tháng M/YYYY"
  shortLabel: string; // "T.M/YY"
  isCurrent: boolean;
  isPast: boolean;
  totalDays: number;
  startDateStr: string; // "YYYY-MM-01"
  endDateStr: string; // "YYYY-MM-DD"
};

type ScheduleTimelineMatrixProps = {
  schedules: ScheduleItem[];
  rawSchedules: any[];
  allTrips: Trip[];
  onGenerateForMonth: (schedule: ScheduleItem, fromDate: string, toDate: string) => void;
  onRefresh: () => Promise<void>;
};

// Helper to generate a window of months
function getMonthWindow(centerYear: number, centerMonth: number, spanBefore = 1, spanAfter = 4): MonthInfo[] {
  const months: MonthInfo[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  for (let offset = -spanBefore; offset <= spanAfter; offset += 1) {
    const d = new Date(centerYear, centerMonth - 1 + offset, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const lastDay = new Date(y, m, 0).getDate();
    const key = `${y}-${String(m).padStart(2, '0')}`;

    const isCurrent = y === currentYear && m === currentMonth;
    const isPast = y < currentYear || (y === currentYear && m < currentMonth);

    months.push({
      year: y,
      month: m,
      key,
      label: `Tháng ${m}/${y}`,
      shortLabel: `T${m}/${y}`,
      isCurrent,
      isPast,
      totalDays: lastDay,
      startDateStr: `${key}-01`,
      endDateStr: `${key}-${String(lastDay).padStart(2, '0')}`,
    });
  }

  return months;
}

// Clean and normalize journey names
function cleanJourneyName(name: string): string {
  let cleaned = (name || '').trim();
  if (cleaned.toLowerCase().startsWith('lịch ')) {
    cleaned = cleaned.substring(5).trim();
  }
  cleaned = cleaned.replace(/\s+\d{1,2}:\d{2}(\s*(sáng|chiều|tối|am|pm))?/gi, '').trim();
  cleaned = cleaned.replace(/\s*Superdong\s+[IVX0-9]+/gi, '').trim();
  return cleaned || 'Tuyến Superdong';
}

// Extract hub tag for quick filtering
function extractHub(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('phú quốc')) return 'Phú Quốc';
  if (lower.includes('côn đảo')) return 'Côn Đảo';
  if (lower.includes('nam du')) return 'Nam Du';
  if (lower.includes('phú quý')) return 'Phú Quý';
  if (lower.includes('hà tiên')) return 'Hà Tiên';
  if (lower.includes('rạch giá')) return 'Rạch Giá';
  return 'Khác';
}

export function ScheduleTimelineMatrix({
  schedules,
  rawSchedules,
  allTrips,
  onGenerateForMonth,
  onRefresh,
}: ScheduleTimelineMatrixProps) {
  const navigate = useNavigate();
  const now = new Date();
  const [baseDate, setBaseDate] = useState<{ year: number; month: number }>({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });

  const [selectedHub, setSelectedHub] = useState<string>('all');

  // Bulk Month Generator Modal State
  const [bulkMonthTarget, setBulkMonthTarget] = useState<MonthInfo | null>(null);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);
  const [bulkPublish, setBulkPublish] = useState<boolean>(true);
  const [bulkReason, setBulkReason] = useState<string>('');
  const [isBulkRunning, setIsBulkRunning] = useState<boolean>(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

  // Inspection Cell Modal State
  const [inspectCell, setInspectCell] = useState<{
    schedule: ScheduleItem;
    month: MonthInfo;
    actualDays: number;
  } | null>(null);

  const monthWindow = useMemo(() => {
    return getMonthWindow(baseDate.year, baseDate.month, 1, 4);
  }, [baseDate]);

  // Navigate months
  const handlePrevMonth = () => {
    setBaseDate((prev) => {
      const d = new Date(prev.year, prev.month - 2, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });
  };

  const handleNextMonth = () => {
    setBaseDate((prev) => {
      const d = new Date(prev.year, prev.month, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });
  };

  const handleCurrentMonth = () => {
    setBaseDate({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    });
  };

  // Map raw schedule lookup
  const rawScheduleById = useMemo(() => {
    const map = new Map<string, any>();
    rawSchedules.forEach((s) => map.set(String(s.id), s));
    return map;
  }, [rawSchedules]);

  // Pre-index trips by scheduleId and date YYYY-MM-DD
  const tripsByScheduleAndDate = useMemo(() => {
    const map = new Map<string, Set<string>>();

    allTrips.forEach((t: any) => {
      if (!t.schedule_id) return;
      if (t.status === 'cancelled') return;

      const schId = String(t.schedule_id);
      const timeStr = t.start_at || t.departure_time;
      if (!timeStr) return;

      const dateStr = timeStr.split('T')[0]?.split(' ')[0];
      if (!dateStr) return;

      if (!map.has(schId)) {
        map.set(schId, new Set<string>());
      }
      map.get(schId)!.add(dateStr);
    });

    return map;
  }, [allTrips]);

  // Extract available hubs for filtering
  const hubOptions = useMemo(() => {
    const hubsCount = new Map<string, number>();
    schedules.forEach((s) => {
      const h = extractHub(s.journey || s.name || '');
      hubsCount.set(h, (hubsCount.get(h) || 0) + 1);
    });

    const list = Array.from(hubsCount.entries()).map(([hub, count]) => ({ hub, count }));
    list.sort((a, b) => b.count - a.count);
    return list;
  }, [schedules]);

  // Filter schedules by selected hub
  const filteredSchedules = useMemo(() => {
    if (selectedHub === 'all') return schedules;
    return schedules.filter((s) => extractHub(s.journey || s.name || '') === selectedHub);
  }, [schedules, selectedHub]);

  // Group schedules cleanly by normalized route
  const schedulesByJourney = useMemo(() => {
    const map = new Map<string, ScheduleItem[]>();
    filteredSchedules.forEach((sch) => {
      const journey = cleanJourneyName(sch.journey || sch.name || '');
      if (!map.has(journey)) {
        map.set(journey, []);
      }
      map.get(journey)!.push(sch);
    });
    return Array.from(map.entries());
  }, [filteredSchedules]);

  // Calculate monthly overall health stats
  const monthlyStats = useMemo(() => {
    return monthWindow.map((month) => {
      let totalActual = 0;
      let schedulesWithTrips = 0;

      schedules.forEach((sch) => {
        if (sch.status === 'inactive') return;
        const scheduleDates = tripsByScheduleAndDate.get(sch.id);
        let actual = 0;

        if (scheduleDates) {
          for (let day = 1; day <= month.totalDays; day += 1) {
            const dateStr = `${month.key}-${String(day).padStart(2, '0')}`;
            if (scheduleDates.has(dateStr)) {
              actual += 1;
            }
          }
        }

        totalActual += actual;
        if (actual > 0) {
          schedulesWithTrips += 1;
        }
      });

      const activeScheduleCount = schedules.filter((s) => s.status === 'active').length;

      return {
        ...month,
        activeScheduleCount,
        schedulesWithTrips,
        totalActual,
      };
    });
  }, [monthWindow, schedules, tripsByScheduleAndDate]);

  // First upcoming month that has 0 trips
  const firstEmptyUpcomingMonth = useMemo(() => {
    return monthlyStats.find((m) => !m.isPast && m.totalActual === 0);
  }, [monthlyStats]);

  // Trips belonging to the cell currently inspected
  const inspectingTrips = useMemo(() => {
    if (!inspectCell) return [];
    const schId = String(inspectCell.schedule.id);
    const monthKey = inspectCell.month.key; // e.g. "2026-08"

    return allTrips
      .filter((t: any) => {
        const tSchId = t.schedule_id ? String(t.schedule_id) : (t.schedule?.id ? String(t.schedule.id) : '');
        const timeStr = t.start_at || t.departure_time || '';
        return tSchId === schId && timeStr.startsWith(monthKey);
      })
      .sort((a: any, b: any) => {
        const timeA = a.start_at || a.departure_time || '';
        const timeB = b.start_at || b.departure_time || '';
        return timeA.localeCompare(timeB);
      });
  }, [inspectCell, allTrips]);

  // Bulk Generator Handler
  const handleOpenBulkGenerate = (month: MonthInfo) => {
    setBulkMonthTarget(month);
    const activeIds = schedules.filter((s) => s.status === 'active').map((s) => s.id);
    setBulkSelectedIds(activeIds);
    setBulkPublish(true);
    setBulkReason(`Sinh chuyến ${month.label}`);
  };

  const handleExecuteBulkGenerate = async () => {
    if (!bulkMonthTarget || bulkSelectedIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 lịch chạy');
      return;
    }

    setIsBulkRunning(true);
    setBulkProgress({ current: 0, total: bulkSelectedIds.length });

    let successCount = 0;
    let totalTripsCreated = 0;

    for (let i = 0; i < bulkSelectedIds.length; i += 1) {
      const schId = bulkSelectedIds[i];
      setBulkProgress({ current: i + 1, total: bulkSelectedIds.length });

      try {
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const effectiveFromDate = bulkMonthTarget.startDateStr < todayStr ? todayStr : bulkMonthTarget.startDateStr;

        const res = await generateTripsFromSchedule(schId, {
          from_date: effectiveFromDate,
          to_date: bulkMonthTarget.endDateStr,
          publish: bulkPublish,
          reason: bulkReason.trim() || `Sinh chuyến ${bulkMonthTarget.label}`,
        });
        successCount += 1;
        totalTripsCreated += res?.data?.created_count ?? 0;
      } catch (err) {
        console.error(`Error generating for schedule ${schId}:`, err);
      }
    }

    setIsBulkRunning(false);
    setBulkMonthTarget(null);

    toast.success(
      `Đã tạo thành công ${totalTripsCreated} chuyến mới cho ${bulkMonthTarget.label}`,
      {
        duration: 6000,
        action: {
          label: 'Xem các chuyến này',
          onClick: () =>
            navigate({
              to: '/trips' as any,
              search: {
                month: bulkMonthTarget.key,
              } as any,
            }),
        },
      }
    );

    await onRefresh();
  };

  return (
    <div className="space-y-3.5 font-sans">
      {/* 1. TOP HORIZON CONTROLS & MONTH CARDS */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Tiến độ tạo chuyến theo tháng
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="h-7 px-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <ChevronLeft size={13} />
            </button>

            <button
              type="button"
              onClick={handleCurrentMonth}
              className="h-7 px-2.5 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 transition-colors"
            >
              Hiện tại
            </button>

            <button
              type="button"
              onClick={handleNextMonth}
              className="h-7 px-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>

        {/* 2. REFINED MONTH STATUS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {monthlyStats.map((stat) => {
            const hasTrips = stat.totalActual > 0;
            let cardBorder = 'border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30';

            if (stat.isCurrent) {
              cardBorder = 'border-blue-400 dark:border-blue-700 bg-blue-50/30 dark:bg-blue-950/20 ring-1 ring-blue-500/20';
            }

            return (
              <div
                key={stat.key}
                className={`p-3 rounded-xl border transition-all flex flex-col justify-between space-y-2 ${cardBorder}`}
              >
                {/* Month Name */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {stat.label}
                  </span>
                  {stat.isCurrent && (
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/60 px-1 py-0.2 rounded">
                      Hiện tại
                    </span>
                  )}
                </div>

                {/* Metric */}
                <div>
                  {hasTrips ? (
                    <div className="text-base font-bold font-mono text-slate-900 dark:text-white leading-none">
                      {stat.totalActual} <span className="text-[11px] font-normal text-slate-500">chuyến</span>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400">
                      Chưa tạo
                    </div>
                  )}
                </div>

                {/* Status or 1-Click Action */}
                <div>
                  {hasTrips ? (
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {stat.schedulesWithTrips}/{stat.activeScheduleCount} tuyến
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenBulkGenerate(stat)}
                      className="w-full py-1 text-center text-xs font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 hover:bg-blue-50 rounded-lg border border-blue-200 dark:border-blue-800 transition-all cursor-pointer"
                    >
                      + Sinh tháng
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 1-Line Minimalist Recommendation if next month is empty */}
        {firstEmptyUpcomingMonth && (
          <div className="py-2 px-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-lg border border-blue-200/80 dark:border-blue-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              {firstEmptyUpcomingMonth.label} chưa tạo chuyến ({firstEmptyUpcomingMonth.activeScheduleCount} lịch).
            </span>

            <button
              type="button"
              onClick={() => handleOpenBulkGenerate(firstEmptyUpcomingMonth)}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              <CalendarPlus size={13} />
              <span>Sinh toàn bộ {firstEmptyUpcomingMonth.label}</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. QUICK HUB FILTERS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setSelectedHub('all')}
            className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer shrink-0 ${
              selectedHub === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Tất cả ({schedules.length})
          </button>

          {hubOptions.map(({ hub, count }) => {
            const isSelected = selectedHub === hub;
            return (
              <button
                key={hub}
                type="button"
                onClick={() => setSelectedHub(hub)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {hub} ({count})
              </button>
            );
          })}
        </div>

        <span className="text-slate-400 text-[11px] shrink-0 font-medium text-right sm:text-left">
          {filteredSchedules.length} lịch chạy
        </span>
      </div>

      {/* 4. MAIN MATRIX TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3 min-w-[220px] sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 border-r border-slate-200/60 dark:border-slate-700/60">Tuyến & Giờ chạy</th>
                <th className="py-2.5 px-3 min-w-[140px]">Phân công tàu</th>
                {monthWindow.map((month) => (
                  <th
                    key={month.key}
                    className={`py-2.5 px-2 text-center min-w-[110px] ${
                      month.isCurrent ? 'bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400' : ''
                    }`}
                  >
                    <span>{month.label}</span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {schedulesByJourney.map(([journeyName, journeySchedules]) => (
                <React.Fragment key={journeyName}>
                  {/* Journey Group Header Row */}
                  <tr className="bg-slate-50/80 dark:bg-slate-800/40 font-bold text-slate-800 dark:text-slate-200 border-t border-b border-slate-200/50 dark:border-slate-700/50">
                    <td colSpan={2 + monthWindow.length} className="py-1.5 px-3 text-xs sticky left-0 z-10 bg-slate-50 dark:bg-slate-800">
                      {journeyName} <span className="text-slate-400 font-normal">({journeySchedules.length})</span>
                    </td>
                  </tr>

                  {/* Schedule Rows */}
                  {journeySchedules.map((sch) => {
                    const scheduleDates = tripsByScheduleAndDate.get(sch.id);

                    return (
                      <tr
                        key={sch.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
                      >
                        {/* Schedule Info (Sticky Left) */}
                        <td className="py-2.5 px-3 sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 z-10 border-r border-slate-200/60 dark:border-slate-800/60 transition-colors">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                              {sch.code}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1 font-mono">
                              <Clock size={11} className="text-slate-400" />
                              {sch.departureTime}
                            </span>
                            <span className="text-slate-400 truncate text-[11px] hidden sm:inline">
                              {sch.operatingDays}
                            </span>
                          </div>
                        </td>

                        {/* Boat */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium truncate">
                            <Ship size={12} className="text-blue-600 shrink-0" />
                            <span className="truncate">{sch.boatName}</span>
                          </div>
                        </td>

                        {/* Month Matrix Cells */}
                        {monthWindow.map((month) => {
                          let actualDays = 0;
                          if (scheduleDates) {
                            for (let day = 1; day <= month.totalDays; day += 1) {
                              const dateStr = `${month.key}-${String(day).padStart(2, '0')}`;
                              if (scheduleDates.has(dateStr)) {
                                actualDays += 1;
                              }
                            }
                          }

                          const hasTrips = actualDays > 0;

                          return (
                            <td
                              key={month.key}
                              className={`py-2 px-1.5 text-center ${
                                month.isCurrent ? 'bg-blue-50/10 dark:bg-blue-950/10' : ''
                              }`}
                            >
                              {hasTrips ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setInspectCell({
                                      schedule: sch,
                                      month,
                                      actualDays,
                                    })
                                  }
                                  className="w-full h-7 rounded-md border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-bold text-xs transition-all cursor-pointer font-mono"
                                  title={`Đã tạo ${actualDays} chuyến trong ${month.label}. Click để xem.`}
                                >
                                  {actualDays} chuyến
                                </button>
                              ) : month.isPast ? (
                                <div className="h-7 flex items-center justify-center text-slate-300 dark:text-slate-600">
                                  —
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onGenerateForMonth(sch, month.startDateStr, month.endDateStr)
                                  }
                                  className="w-full h-7 rounded-md border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-0.5"
                                  title={`Chưa tạo chuyến trong ${month.label}. Click để tạo.`}
                                >
                                  <Plus size={11} />
                                  <span>Tạo</span>
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MODAL: BULK GENERATE */}
      <Dialog open={!!bulkMonthTarget} onOpenChange={(open) => !open && !isBulkRunning && setBulkMonthTarget(null)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xl font-sans">
          <DialogHeader className="space-y-1 pb-1">
            <DialogTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarPlus className="text-blue-600" size={16} />
              <span>Sinh Chuyến Toàn Tuyến — {bulkMonthTarget?.label}</span>
            </DialogTitle>
          </DialogHeader>

          {bulkMonthTarget && (
            <div className="space-y-3 py-1 text-xs">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-200 dark:border-slate-700 font-medium">
                <span>Chọn lịch ({bulkSelectedIds.length}/{schedules.filter((s) => s.status === 'active').length})</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setBulkSelectedIds(schedules.filter((s) => s.status === 'active').map((s) => s.id))}
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    Tất cả
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setBulkSelectedIds([])}
                    className="text-slate-500 hover:underline"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>

              <div className="max-h-44 overflow-y-auto space-y-1 border border-slate-200 dark:border-slate-800 rounded-lg p-2 bg-slate-50/40">
                {schedules
                  .filter((s) => s.status === 'active')
                  .map((sch) => {
                    const isChecked = bulkSelectedIds.includes(sch.id);
                    return (
                      <label
                        key={sch.id}
                        className={`flex items-center justify-between p-1.5 rounded border cursor-pointer ${
                          isChecked
                            ? 'bg-blue-50/60 border-blue-300 text-blue-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setBulkSelectedIds([...bulkSelectedIds, sch.id]);
                              } else {
                                setBulkSelectedIds(bulkSelectedIds.filter((id) => id !== sch.id));
                              }
                            }}
                            className="h-3.5 w-3.5 rounded text-blue-600 cursor-pointer"
                          />
                          <span className="font-mono text-blue-600 font-bold">{sch.code}</span>
                          <span className="truncate">{sch.journey}</span>
                        </div>
                        <span className="text-slate-400 font-mono text-[10px]">{sch.departureTime}</span>
                      </label>
                    );
                  })}
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <input
                  id="bulk_publish_clean"
                  type="checkbox"
                  checked={bulkPublish}
                  onChange={(e) => setBulkPublish(e.target.checked)}
                  className="h-3.5 w-3.5 rounded text-blue-600 cursor-pointer"
                />
                <Label htmlFor="bulk_publish_clean" className="text-xs text-slate-700 cursor-pointer select-none">
                  Mở bán vé ngay sau khi sinh (<span className="font-semibold text-emerald-600">selling</span>)
                </Label>
              </div>

              {isBulkRunning && (
                <div className="space-y-1 p-2.5 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between font-bold text-blue-700 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Loader2 size={12} className="animate-spin" /> Đang tạo chuyến...
                    </span>
                    <span>{bulkProgress.current}/{bulkProgress.total}</span>
                  </div>
                  <div className="h-1.5 w-full bg-blue-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${(bulkProgress.current / Math.max(1, bulkProgress.total)) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="xs"
              onClick={() => setBulkMonthTarget(null)}
              disabled={isBulkRunning}
              className="h-8 px-3"
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              size="xs"
              onClick={handleExecuteBulkGenerate}
              disabled={isBulkRunning || bulkSelectedIds.length === 0}
              className="h-8 px-4 font-bold bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isBulkRunning ? 'Đang tạo...' : `Khởi tạo ${bulkSelectedIds.length} lịch`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. MODAL: CELL INSPECTOR */}
      {inspectCell && (
        <Dialog open onOpenChange={(open) => !open && setInspectCell(null)}>
          <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xl font-sans">
            <DialogHeader className="space-y-1 pb-1">
              <DialogTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Check size={16} className="text-emerald-600 shrink-0" />
                  <span>{inspectCell.schedule.code} — {inspectCell.month.label}</span>
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
                  {inspectCell.actualDays} chuyến
                </span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-1 text-xs">
              {/* Summary Box */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Tuyến & Giờ:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {inspectCell.schedule.journey} ({inspectCell.schedule.departureTime})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Tàu phân công:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <Ship size={12} className="text-blue-600" />
                    {inspectCell.schedule.boatName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Tần suất lịch:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {inspectCell.schedule.operatingDays}
                  </span>
                </div>
              </div>

              {/* Trips List Preview inside Cell */}
              {inspectingTrips.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Danh sách chuyến thực tế ({inspectingTrips.length} chuyến):</span>
                  </div>
                  <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                    {inspectingTrips.map((t: any, idx: number) => {
                      const timeStr = t.start_at || t.departure_time || '';
                      const dateDisplay = formatCellDate(timeStr);
                      const timeDisplay = formatCellTime(timeStr);
                      const tripCode = `TRIP-${String(t.id).slice(0, 6).toUpperCase()}`;
                      const isSelling = t.status === 'selling' || t.status === 'open';

                      return (
                        <div
                          key={t.id || idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/70 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-[11px]">
                              {tripCode}
                            </span>
                            <span className="text-slate-800 dark:text-slate-200 font-semibold">
                              {dateDisplay}
                            </span>
                            <span className="font-mono text-slate-500 text-[11px]">
                              {timeDisplay}
                            </span>
                          </div>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap shrink-0',
                              isSelling
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            )}
                          >
                            {isSelling ? 'Đang mở bán' : (t.status || 'Bản nháp')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  type="button"
                  variant="light"
                  size="xs"
                  onClick={() => {
                    setInspectCell(null);
                    onGenerateForMonth(
                      inspectCell.schedule,
                      inspectCell.month.startDateStr,
                      inspectCell.month.endDateStr
                    );
                  }}
                  className="w-full font-bold h-9 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 dark:border-blue-800"
                >
                  <Plus size={13} className="mr-0.5" /> Sinh thêm
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="xs"
                  onClick={() => {
                    const schId = String(inspectCell.schedule.id);
                    const monthKey = inspectCell.month.key;
                    setInspectCell(null);
                    navigate({
                      to: '/trips' as any,
                      search: {
                        schedule_id: schId,
                        month: monthKey,
                        search: inspectCell.schedule.code,
                      } as any,
                    });
                  }}
                  className="w-full font-bold h-9 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                >
                  <ExternalLink size={13} /> Xem trên QL Chuyến
                </Button>
              </div>
            </div>

            <DialogFooter className="pt-1.5 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="light" size="xs" onClick={() => setInspectCell(null)} className="w-full">
                Đóng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
