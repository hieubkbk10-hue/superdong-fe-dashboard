import React, { useEffect, useMemo, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Route as RouteIcon, Edit, Trash2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

import { deleteJourney, getJourneys } from '@/apis/journeys';
import { buildRouteDisplayName, unwrapData } from '@/helpers/journeyRoutes';
import { Journey, Location, Route as JourneyRoute } from '@/types';
import { Button } from '@/components/common/Button';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { AdminTablePage, ColumnDef } from '@/components/common/TableUtilities';

export const Route = createFileRoute('/_admin/journeys/')({
  component: JourneysPage,
});

type JourneyStatus = 'active' | 'inactive';
type JourneyRow = {
  id: string;
  routeCode: string;
  routeName: string;
  fromName: string;
  toName: string;
  status: JourneyStatus;
  updated_at?: string;
};

const normalizeJourney = (journey: Journey): JourneyRow => {
  const route = unwrapData<JourneyRoute>(journey.route);
  const fromLocation = unwrapData<Location>(journey.from_location);
  const toLocation = unwrapData<Location>(journey.to_location);

  return {
    id: String(journey.id),
    routeCode: route?.code || '',
    routeName: route ? buildRouteDisplayName({ code: route.code, name: route.name }, fromLocation?.name, toLocation?.name) : '',
    fromName: fromLocation?.name || 'Chưa cập nhật',
    toName: toLocation?.name || 'Chưa cập nhật',
    status: journey.status === 'inactive' || journey.is_active === false ? 'inactive' : 'active',
    updated_at: journey.updated_at,
  };
};

const formatDateTime = (value?: string) => {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';
  return date.toLocaleDateString('vi-VN');
};

function JourneysPage() {
  const [journeys, setJourneys] = useState<JourneyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [deleteTarget, setDeleteTarget] = useState<JourneyRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchJourneys = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await getJourneys({ limit: 100, page: 1 });
      const rows = Array.isArray(res?.data) ? res.data.map(normalizeJourney) : [];
      setJourneys(rows);
      rows.forEach((row) => localStorage.setItem(`superdong_journey_cache_${row.id}`, JSON.stringify(row)));
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không thể tải danh sách hành trình';
      setJourneys([]);
      setApiError(message);
      toast.error(`Không tải được danh sách hành trình. ${message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJourneys();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, pageSize]);

  const filteredJourneys = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return journeys.filter((journey) => {
      const matchesSearch =
        !keyword ||
        journey.routeCode.toLowerCase().includes(keyword) ||
        journey.routeName.toLowerCase().includes(keyword) ||
        journey.fromName.toLowerCase().includes(keyword) ||
        journey.toName.toLowerCase().includes(keyword);
      const matchesStatus = statusFilter === 'all' || journey.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [journeys, searchTerm, statusFilter]);

  const executeDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      const response = await deleteJourney(deleteTarget.id, {
        reason: `Xóa hành trình ${deleteTarget.fromName} → ${deleteTarget.toName} từ dashboard vận hành`,
      });
      toast.success(response?.message || 'Đã xóa hành trình');
      setDeleteTarget(null);
      await fetchJourneys();
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không thể xóa hành trình';
      toast.error(`Xóa hành trình thất bại. ${message}`);
    } finally {
      setDeleting(false);
    }
  };

  const statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'active', label: 'Đang hoạt động' },
    { value: 'inactive', label: 'Tạm ngưng' },
  ];

  const columns: ColumnDef<JourneyRow>[] = [
    {
      key: 'routeName',
      label: 'LUỒNG TUYẾN',
      sortable: true,
      render: (item) => (
        <div className="whitespace-nowrap">
          <div className="font-bold text-slate-900 dark:text-white">{item.routeName || 'Chưa cập nhật'}</div>
          <div className="font-mono text-xs text-blue-600 dark:text-blue-400">{item.routeCode}</div>
        </div>
      ),
    },
    {
      key: 'fromName',
      label: 'BẾN ĐI',
      sortable: true,
      render: (item) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 font-semibold text-xs border border-blue-200 dark:border-blue-800 whitespace-nowrap">
          {item.fromName}
        </span>
      ),
    },
    {
      key: 'toName',
      label: 'BẾN ĐẾN',
      sortable: true,
      render: (item) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-semibold text-xs border border-emerald-200 dark:border-emerald-800 whitespace-nowrap">
          {item.toName}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'TRẠNG THÁI',
      sortable: true,
      render: (item) =>
        item.status === 'active' ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 whitespace-nowrap">
            <CheckCircle2 size={12} /> Đang hoạt động
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800 whitespace-nowrap">
            <XCircle size={12} /> Tạm ngưng
          </span>
        ),
    },
    {
      key: 'updated_at',
      label: 'CẬP NHẬT',
      sortable: true,
      render: (item) => <span className="text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">{formatDateTime(item.updated_at)}</span>,
    },
    {
      key: 'actions',
      label: 'THAO TÁC',
      align: 'right',
      render: (item) => (
        <div className="space-x-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 dark:text-blue-400" asChild>
            <Link to={'/journeys/$journeyId/edit' as any} params={{ journeyId: item.id } as any} title="Chỉnh sửa hành trình">
              <Edit size={15} />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600 hover:text-rose-700 dark:text-rose-400" onClick={() => setDeleteTarget(item)} title="Xóa hành trình">
            <Trash2 size={15} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <AdminTablePage
        title="Quản lý hành trình"
        subtitle="Cấu hình cặp bến đi, bến đến hợp lệ trên từng luồng tuyến đang khai thác của Superdong"
        icon={RouteIcon}
        apiError={apiError}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm theo tuyến, bến đi hoặc bến đến..."
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        filterOptions={statusOptions}
        columns={columns}
        columnStorageKey="superdong_journeys_columns"
        onRefresh={fetchJourneys}
        refreshing={loading}
        createLink="/journeys/create"
        createLabel="Thêm hành trình"
        data={filteredJourneys}
        loading={loading}
        emptyText="Chưa có hành trình nào phù hợp với bộ lọc."
        keyExtractor={(item) => item.id}
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
        title="Xác nhận xóa hành trình"
        description={`Bạn có chắc chắn muốn xóa hành trình "${deleteTarget?.fromName} → ${deleteTarget?.toName}"? Hệ thống sẽ kiểm tra ràng buộc chuyến tàu trước khi thực hiện.`}
        confirmLabel={deleting ? 'Đang xóa...' : 'Xóa hành trình'}
        loading={deleting}
        variant="destructive"
        onConfirm={executeDelete}
      />
    </>
  );
}
