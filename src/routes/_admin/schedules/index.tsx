import React, { useState, useEffect, useMemo } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Calendar, Edit, Trash2, CheckCircle2, XCircle, Clock, Ship } from 'lucide-react';
import { toast } from 'sonner';

import { getSchedules, deleteSchedule } from '@/apis/trips';
import { Schedule } from '@/types';
import { Button } from '@/components/common/Button';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { AdminTablePage, ColumnDef } from '@/components/common/TableUtilities';

export const Route = createFileRoute('/_admin/schedules/')({
  component: SchedulesPage,
});

export interface ScheduleItem {
  id: string;
  code: string;
  journey: string;
  departureTime: string;
  boatName: string;
  operatingDays: string;
  status: 'active' | 'inactive';
}

function SchedulesPage() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const [deleteTarget, setDeleteTarget] = useState<ScheduleItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSchedules = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await getSchedules();
      if (res && res.data && Array.isArray(res.data)) {
        const mapped: ScheduleItem[] = res.data.map((s: Schedule) => ({
          id: String(s.id),
          code: `SCH-${s.id}`,
          journey: s.journey?.name || (s.route?.origin_location?.name ? `${s.route.origin_location.name} ➔ ${s.route.destination_location?.name}` : 'Tuyến hải trình'),
          departureTime: s.departure_time || s.start_time || '07:30 sáng',
          boatName: s.boat?.name ? `${s.boat.name} (${s.boat.code})` : 'Tàu Superdong',
          operatingDays: s.recurrence === 'daily' || s.days_of_week?.length === 7 ? 'Tất cả các ngày' : 'Thứ 2 - Chủ Nhật',
          status: s.is_active || s.status === 'active' ? 'active' : 'inactive',
        }));
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
        <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 whitespace-nowrap">
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
        <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5 whitespace-nowrap">
          <Ship size={15} className="text-slate-400 shrink-0" />
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
        <div className="space-x-1">
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
        subtitle="Thiết lập khung giờ xuất bến định kỳ, tần suất khai thác và tàu phân công mặc định Superdong"
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
