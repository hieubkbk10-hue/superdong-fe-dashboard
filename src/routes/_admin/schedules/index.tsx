import React, { useState, useEffect, useMemo } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Calendar, Edit, Trash2, CheckCircle2, XCircle, Clock, Ship, Zap, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { getSchedules, deleteSchedule, generateTripsFromSchedule } from '@/apis/trips';
import { getBoats } from '@/apis/boats';
import { Button } from '@/components/common/Button';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { AdminTablePage, ColumnDef } from '@/components/common/TableUtilities';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const Route = createFileRoute('/_admin/schedules/')({
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

function getNextMonthString() {
  const now = new Date();
  now.setDate(now.getDate() + 30);
  return now.toISOString().split('T')[0];
}

function SchedulesPage() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const [deleteTarget, setDeleteTarget] = useState<ScheduleItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Generate Trips Modal State
  const [generateTarget, setGenerateTarget] = useState<ScheduleItem | null>(null);
  const [fromDate, setFromDate] = useState<string>(getTodayString());
  const [toDate, setToDate] = useState<string>(getNextMonthString());
  const [publishImmediate, setPublishImmediate] = useState<boolean>(true);
  const [generateReason, setGenerateReason] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const fetchSchedules = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const [res, boatsRes] = await Promise.all([
        getSchedules({ limit: 100 }),
        getBoats({ limit: 100 }),
      ]);

      const boatsMap = new Map((boatsRes?.data || []).map((b: any) => [String(b.id), b]));

      if (res && res.data && Array.isArray(res.data)) {
        const mapped: ScheduleItem[] = res.data.map((s: any, idx: number) => {
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

          // Cache for Edit page hydration
          localStorage.setItem(`superdong_schedule_cache_${s.id}`, JSON.stringify({
            ...s,
            cleanCode,
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, pageSize]);

  const filteredSchedules = useMemo(() => {
    return schedules.filter((sch) => {
      const matchesSearch =
        sch.journey.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sch.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sch.boatName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sch.departureTime.toLowerCase().includes(searchTerm.toLowerCase());

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
    setToDate(getNextMonthString());
    setPublishImmediate(true);
    setGenerateReason(`Sinh các chuyến chạy thật từ lịch ${sch.code} (${sch.journey})`);
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
        `⚡ Sinh chuyến hoàn tất! Đã tạo ${created} chuyến thực tế (Bỏ qua ${skipped} chuyến đã tồn tại). Tồn kho ghế đã được tự động khởi tạo!`,
        {
          duration: 6000,
          action: {
            label: 'Xem Chuyến Tàu',
            onClick: () => navigate({ to: '/trips' as any }),
          },
        }
      );

      setGenerateTarget(null);
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
        <span className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap">
          {sch.operatingDays}
        </span>
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
          {/* Quick Generate Trips Action */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs font-semibold border-amber-500/30 bg-amber-50/50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 gap-1.5"
            onClick={() => handleOpenGenerateModal(sch)}
            title="Sinh nhanh các chuyến tàu thực tế theo lịch chạy này"
          >
            <Zap size={14} className="fill-amber-500 text-amber-500" />
            <span>Sinh chuyến</span>
          </Button>

          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 dark:text-blue-400" asChild>
            <Link to={'/schedules/$scheduleId/edit' as any} params={{ scheduleId: String(sch.id) } as any} title="Chỉnh sửa lịch chạy tàu">
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
        title="Quản lý lịch chạy tàu"
        subtitle="Thiết lập khung giờ xuất bến định kỳ, tần suất khai thác, sinh chuyến thực tế tự động và khởi tạo kho ghế"
        icon={Calendar}
        apiError={apiError}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm theo tuyến, mã lịch, tên tàu..."
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        filterOptions={statusOptions}
        columns={columns}
        columnStorageKey="superdong_schedules_visible_columns"
        onRefresh={fetchSchedules}
        refreshing={loading}
        createLink="/schedules/create"
        createLabel="Thêm Lịch Mới"
        data={filteredSchedules}
        loading={loading}
        emptyText="Chưa có lịch chạy định kỳ nào phù hợp với bộ lọc."
        keyExtractor={(sch) => String(sch.id)}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      {/* Modal: Sinh chuyến hàng loạt từ Schedule */}
      <Dialog open={!!generateTarget} onOpenChange={(open) => !open && setGenerateTarget(null)}>
        <DialogContent className="max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
                <Zap size={18} />
              </div>
              Sinh Chuyến Tàu Nhanh Từ Lịch Chạy
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Hệ thống sẽ tự động đối chiếu các thứ trong tuần của lịch để sinh hàng loạt chuyến tàu thực tế và khởi tạo kho ghế (trip seat inventory) tương ứng.
            </DialogDescription>
          </DialogHeader>

          {generateTarget && (
            <div className="space-y-4 py-2 text-xs">
              {/* Target info card */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Lịch chạy:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{generateTarget.code}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Tuyến & Giờ chạy:</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{generateTarget.journey} ({generateTarget.departureTime})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Tàu phân công & Ngày:</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{generateTarget.boatName} | {generateTarget.operatingDays}</span>
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="from_date" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Từ ngày <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="from_date"
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="mt-1.5 h-9 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="to_date" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Đến ngày <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="to_date"
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="mt-1.5 h-9 text-xs"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <Label htmlFor="generate_reason" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Lý do sinh chuyến (Audit Log)
                </Label>
                <Input
                  id="generate_reason"
                  type="text"
                  value={generateReason}
                  onChange={(e) => setGenerateReason(e.target.value)}
                  placeholder="Nhập lý do tạo chuyến..."
                  className="mt-1.5 h-9 text-xs"
                />
              </div>

              {/* Publish option */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="publish_immediate"
                  type="checkbox"
                  checked={publishImmediate}
                  onChange={(e) => setPublishImmediate(e.target.checked)}
                  className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <Label htmlFor="publish_immediate" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  Mở bán vé ngay sau khi sinh (Trạng thái <span className="font-semibold text-emerald-600">selling</span>)
                </Label>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 p-2.5 rounded-lg flex items-start gap-2 text-[11px]">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-600" />
                <span>Backend sẽ tự động bỏ qua nếu chuyến cùng tuyến, cùng tàu và cùng giờ chạy trong ngày đã tồn tại. Toàn bộ ghế sẽ được tự động đồng bộ từ sơ đồ ghế active của tàu!</span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGenerateTarget(null)}
              disabled={isGenerating}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExecuteGenerateTrips}
              disabled={isGenerating}
              className="text-xs bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
            >
              {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {isGenerating ? 'Đang sinh chuyến...' : 'Xác Nhận Sinh Chuyến'}
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
