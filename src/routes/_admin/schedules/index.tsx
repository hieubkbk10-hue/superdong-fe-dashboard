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
} from 'lucide-react';
import { toast } from 'sonner';

import { getSchedules, deleteSchedule, generateTripsFromSchedule, getTrips, getAllTrips } from '@/apis/trips';
import { getBoats } from '@/apis/boats';
import { Boat, Schedule } from '@/types';
import { Button } from '@/components/common/Button';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { AdminTablePage, ColumnDef } from '@/components/common/TableUtilities';
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
}

export const Route = createFileRoute('/_admin/schedules/')({
  validateSearch: (search: Record<string, unknown>): SchedulesSearch => {
    const result: SchedulesSearch = {};
    if (Number(search?.page) > 1) result.page = Number(search.page);
    if (typeof search?.search === 'string' && search.search.trim()) result.search = search.search.trim();
    if (typeof search?.status === 'string' && search.status !== 'all') result.status = search.status;
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

function getTodayString() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

function getFutureDateString(daysAhead: number) {
  const now = new Date();
  now.setDate(now.getDate() + daysAhead);
  return now.toISOString().split('T')[0];
}

function SchedulesPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const searchParams = Route.useSearch();

  const currentPage = searchParams.page || 1;
  const searchTerm = searchParams.search || '';
  const statusFilter = searchParams.status || 'all';

  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<ScheduleItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Generate Trips Modal State
  const [generateTarget, setGenerateTarget] = useState<ScheduleItem | null>(null);
  const [fromDate, setFromDate] = useState<string>(getTodayString());
  const [toDate, setToDate] = useState<string>(getFutureDateString(30));
  const [publishImmediate, setPublishImmediate] = useState<boolean>(true);
  const [generateReason, setGenerateReason] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const fetchSchedules = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const [schedulesRes, boatsRes, allTrips] = await Promise.all([
        getSchedules({ limit: 100 }),
        getBoats({ limit: 100 }),
        getAllTrips(),
      ]);

      const boatsMap = new Map<string, Boat>((boatsRes?.data || []).map((b: any) => [String(b.id), b]));

      // Calculate upcoming active trips per schedule
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const activeTripsMap = new Map<string, number>();

      allTrips.forEach((t: any) => {
        if (!t.schedule_id) return;
        const schId = String(t.schedule_id);
        const startStr = t.start_at || t.departure_time;

        // Trip counts if not cancelled or completed
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

      if (schedulesRes && schedulesRes.data && Array.isArray(schedulesRes.data)) {
        const mapped: ScheduleItem[] = schedulesRes.data.map((s: any, idx: number) => {
          const daysArr = Array.isArray(s.days_of_week) ? s.days_of_week : [];
          const daysText = formatDaysOfWeek(daysArr);
          const journeyName = s.name || s.journey?.name || (s.route?.name ? s.route.name : 'Tuyến hải trình Superdong');

          // Resolve Boat Name dynamically from boatsMap or relation
          let resolvedBoatName = 'Tàu Superdong';
          if (s.boat?.name) {
            resolvedBoatName = s.boat.code ? `${s.boat.name} (${s.boat.code})` : s.boat.name;
          } else if (s.boat_id && boatsMap.has(String(s.boat_id))) {
            const foundBoat = boatsMap.get(String(s.boat_id))!;
            resolvedBoatName = foundBoat.code ? `${foundBoat.name} (${foundBoat.code})` : foundBoat.name;
          }

          // Clean display code
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
          }));

          return {
            id: String(s.id),
            code: cleanCode,
            name: s.name,
            journey: journeyName,
            departureTime: s.start_time || s.departure_time || '07:30',
            boatName: resolvedBoatName,
            operatingDays: daysText,
            status: s.status === 'active' || s.is_active === true ? 'active' : 'inactive',
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
      setApiError(err?.response?.data?.message || err?.message || 'Không thể kết nối với Backend API');
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
        if (value && value.trim()) {
          next.search = value.trim();
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
      const search = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !search ||
        sch.journey.toLowerCase().includes(search) ||
        sch.code.toLowerCase().includes(search) ||
        sch.boatName.toLowerCase().includes(search) ||
        sch.departureTime.toLowerCase().includes(search);

      const matchesStatus = statusFilter === 'all' || sch.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [schedules, searchTerm, statusFilter]);

  const executeDeleteSchedule = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      if (typeof deleteSchedule === 'function') {
        await deleteSchedule(deleteTarget.id);
      }
      toast.success(`Đã xóa lịch chạy tàu ${deleteTarget.code} thành công!`);
      setDeleteTarget(null);
      await fetchSchedules();
    } catch (err: any) {
      console.error('Failed to delete schedule:', err);
      const serverMsg = err?.response?.data?.message || err?.message || '';
      toast.error(serverMsg || 'Có lỗi xảy ra khi xóa lịch chạy trên Backend');
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenGenerateModal = (sch: ScheduleItem) => {
    setGenerateTarget(sch);
    setFromDate(getTodayString());
    setToDate(getFutureDateString(30));
    setPublishImmediate(true);
    setGenerateReason(`Khởi tạo chuyến tự động từ lịch ${sch.code}`);
  };

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
        <Link
          to={'/schedules/$scheduleId/edit' as any}
          params={{ scheduleId: String(sch.id) } as any}
          className="group inline-flex items-center gap-1.5 cursor-pointer"
          title="Bấm để xem chi tiết các chuyến sắp chạy của lịch này"
        >
          {sch.activeTripsCount > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 group-hover:bg-blue-100 transition-colors whitespace-nowrap font-mono">
              <Layers size={12} />
              {sch.activeTripsCount} chuyến
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 whitespace-nowrap font-mono">
              0 chuyến
            </span>
          )}
        </Link>
      ),
    },
    {
      key: 'status',
      label: 'TRẠNG THÁI',
      sortable: true,
      render: (sch) =>
        sch.status === 'active' ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 whitespace-nowrap">
            <CheckCircle2 size={12} /> Đang áp dụng
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800 whitespace-nowrap">
            <XCircle size={12} /> Tạm ngưng
          </span>
        ),
    },
    {
      key: 'actions',
      label: 'THAO TÁC',
      align: 'right',
      render: (sch) => (
        <div className="flex items-center justify-end gap-1">
          {/* Quick Generate Trips Action (Icon-only) */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
            onClick={() => handleOpenGenerateModal(sch)}
            title="Sinh chuyến tàu thực tế theo lịch chạy này"
          >
            <CalendarPlus size={16} />
          </Button>

          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 dark:text-blue-400" asChild>
            <Link to={'/schedules/$scheduleId/edit' as any} params={{ scheduleId: String(sch.id) } as any} title="Chỉnh sửa lịch & Xem các chuyến">
              <Edit size={15} />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600 hover:text-rose-700 dark:text-rose-400" onClick={() => setDeleteTarget(sch)} title="Xóa lịch chạy tàu">
            <Trash2 size={15} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <AdminTablePage
        title="Quản Lý Lịch Chạy Tàu"
        subtitle="Thiết lập khung giờ xuất bến định kỳ, tần suất khai thác, sinh chuyến thực tế tự động và khởi tạo kho ghế"
        icon={Calendar}
        apiError={apiError}
        searchValue={searchTerm}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Tìm theo tuyến, mã lịch, tên tàu..."
        filterValue={statusFilter}
        onFilterChange={handleStatusFilterChange}
        filterOptions={statusOptions}
        columns={columns}
        columnStorageKey="superdong_schedules_columns"
        onRefresh={fetchSchedules}
        refreshing={loading}
        createLink="/schedules/create"
        createLabel="Thêm Lịch Mới"
        data={filteredSchedules}
        loading={loading}
        emptyText="Chưa có lịch chạy định kỳ nào phù hợp với bộ lọc."
        keyExtractor={(sch) => String(sch.id)}
        entityLabel="lịch chạy"
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />

      {/* Modal: Sinh chuyến hàng loạt từ Schedule (To, thoáng, tối giản, chuyên nghiệp) */}
      <Dialog open={!!generateTarget} onOpenChange={(open) => !open && setGenerateTarget(null)}>
        <DialogContent className="sm:max-w-xl md:max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-2xl shadow-2xl">
          <DialogHeader className="space-y-1.5 pb-2">
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
              Sinh Chuyến Tàu Theo Lịch Định Kỳ
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
              Hệ thống sẽ đối chiếu thứ trong tuần của lịch để sinh chuyến thực tế và tự động khởi tạo sơ đồ ghế trống.
            </DialogDescription>
          </DialogHeader>

          {generateTarget && (
            <div className="space-y-5 py-3 text-sm">
              {/* Summary Card */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-xs text-slate-500 font-medium">Mã & Tuyến chạy:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-bold mr-2">{generateTarget.code}</span>
                    {generateTarget.journey}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-xs text-slate-500 font-medium">Giờ xuất bến & Tàu phụ trách:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                    {generateTarget.departureTime} — {generateTarget.boatName}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-xs text-slate-500 font-medium">Tần suất áp dụng:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">{generateTarget.operatingDays}</span>
                </div>
              </div>

              {/* Date Range Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-slate-800 dark:text-slate-200">Khoảng thời gian sinh chuyến</Label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setToDate(getFutureDateString(7))}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      +7 ngày
                    </button>
                    <button
                      type="button"
                      onClick={() => setToDate(getFutureDateString(14))}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      +14 ngày
                    </button>
                    <button
                      type="button"
                      onClick={() => setToDate(getFutureDateString(30))}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 font-semibold"
                    >
                      +30 ngày
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="from_date" className="text-xs text-slate-500 font-medium mb-1.5 block">
                      Từ ngày
                    </Label>
                    <Input
                      id="from_date"
                      type="date"
                      value={fromDate}
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
                  placeholder="Ví dụ: Khởi tạo chuyến theo lịch định kỳ tháng tới..."
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

              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/70 text-slate-600 dark:text-slate-400 p-3 rounded-xl text-xs leading-relaxed">
                Hệ thống sẽ tự động đối chiếu các ngày trong khoảng thời gian trên với thứ hoạt động của lịch. Các chuyến đã tạo trước đó sẽ được tự động bỏ qua để tránh trùng lặp.
              </div>
            </div>
          )}

          <DialogFooter className="gap-3 sm:gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
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
              onClick={handleExecuteGenerateTrips}
              disabled={isGenerating}
              className="h-10 px-6 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              {isGenerating ? 'Đang khởi tạo...' : 'Xác Nhận Sinh Chuyến'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Xác nhận xóa lịch chạy tàu"
        description={`Bạn có chắc chắn muốn xóa lịch chạy "${deleteTarget?.code}" (${deleteTarget?.journey})? Thao tác này không thể hoàn tác.`}
        confirmLabel={deleting ? 'Đang xóa...' : 'Xóa lịch chạy'}
        loading={deleting}
        variant="destructive"
        onConfirm={executeDeleteSchedule}
      />
    </>
  );
}
