import React, { useEffect, useMemo, useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { GitBranch, Edit, Trash2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

import { deleteRoute, getAdminLocations, getRoutes } from '@/apis/journeys';
import { formatRouteOptionLabel, normalizeRouteStops, StopOption } from '@/helpers/journeyRoutes';
import { Location, Route as JourneyRoute } from '@/types';
import { Button } from '@/components/common/Button';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { AdminTablePage, ColumnDef, FilterOption } from '@/components/common/TableUtilities';

export interface RoutesSearch {
  page?: number;
  search?: string;
  status?: string;
}

export const Route = createFileRoute('/_admin/routes/')({
  validateSearch: (search: Record<string, unknown>): RoutesSearch => {
    const result: RoutesSearch = {};
    if (Number(search?.page) > 1) result.page = Number(search.page);
    if (typeof search?.search === 'string' && search.search.trim()) result.search = search.search.trim();
    if (typeof search?.status === 'string' && search.status !== 'all') result.status = search.status;
    return result;
  },
  component: RoutesPage,
});

type RouteStatus = 'active' | 'inactive';
type RouteRow = {
  id: string;
  code: string;
  name: string;
  status: RouteStatus;
  stops: StopOption[];
  label: string;
  updated_at?: string;
};

const normalizeRoute = (route: JourneyRoute, locationsById: Map<string, Location>): RouteRow => {
  const stops = normalizeRouteStops(route, locationsById);
  const normalized = {
    id: String(route.id),
    code: route.code || '',
    name: route.name || '',
    status: (route.status === 'inactive' || route.is_active === false ? 'inactive' : 'active') as RouteStatus,
    stops,
    updated_at: route.updated_at,
  };

  return {
    ...normalized,
    label: formatRouteOptionLabel(normalized),
  };
};

const formatDateTime = (value?: string) => {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';
  return date.toLocaleDateString('vi-VN');
};

const statusOptions: FilterOption[] = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'inactive', label: 'Tạm ngưng' },
];

function RoutesPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const searchParams = Route.useSearch();

  const currentPage = searchParams.page || 1;
  const searchTerm = searchParams.search || '';
  const statusFilter = searchParams.status || 'all';

  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<RouteRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRoutes = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const [routesRes, locationsRes] = await Promise.all([
        getRoutes({ limit: 100, page: 1 }),
        getAdminLocations({ status: 'all', limit: 100, page: 1 }),
      ]);
      const locationsById = new Map((locationsRes.data || []).map((location) => [String(location.id), location]));
      const rows = Array.isArray(routesRes?.data) ? routesRes.data.map((route) => normalizeRoute(route, locationsById)) : [];
      setRoutes(rows);
      rows.forEach((row) => localStorage.setItem(`superdong_route_cache_${row.id}`, JSON.stringify(row)));
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không thể tải danh sách luồng tuyến';
      setRoutes([]);
      setApiError(message);
      toast.error(`Không tải được danh sách luồng tuyến. ${message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
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

  const filteredRoutes = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return routes.filter((route) => {
      const stopText = route.stops.map((stop) => `${stop.name} ${stop.code}`).join(' ').toLowerCase();
      const matchesSearch =
        !keyword ||
        route.name.toLowerCase().includes(keyword) ||
        route.code.toLowerCase().includes(keyword) ||
        stopText.includes(keyword);
      const matchesStatus = statusFilter === 'all' || route.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [routes, searchTerm, statusFilter]);

  const executeDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteRoute(deleteTarget.id, {
        reason: `Xóa luồng tuyến ${deleteTarget.name || deleteTarget.code} từ dashboard vận hành`,
      });
      localStorage.removeItem(`superdong_route_cache_${deleteTarget.id}`);
      toast.success(`Đã xóa luồng tuyến ${deleteTarget.name || deleteTarget.code}`);
      setDeleteTarget(null);
      await fetchRoutes();
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không thể xóa luồng tuyến';
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const columns: ColumnDef<RouteRow>[] = [
    {
      key: 'code',
      label: 'MÃ TUYẾN',
      sortable: true,
      render: (item) => (
        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 uppercase bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800 whitespace-nowrap">
          {item.code}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'TÊN TUYẾN',
      sortable: true,
      render: (item) => <span className="font-bold text-slate-900 dark:text-white whitespace-nowrap">{item.name || item.label || 'Chưa cập nhật'}</span>,
    },
    {
      key: 'stops',
      label: 'BẾN DỪNG',
      render: (item) => (
        <div className="flex items-center gap-1.5 flex-wrap whitespace-nowrap">
          {item.stops && item.stops.length > 0 ? (
            item.stops.map((stop, idx) => (
              <React.Fragment key={stop.location_id || idx}>
                {idx > 0 && <ArrowRight size={12} className="text-slate-400 shrink-0" />}
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs border border-slate-200 dark:border-slate-700">
                  {stop.name} ({stop.code})
                </span>
              </React.Fragment>
            ))
          ) : (
            <span className="text-slate-400 text-xs italic">Chưa thiết lập bến dừng</span>
          )}
        </div>
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
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 dark:text-blue-400" asChild>
            <Link to={'/routes/$routeId/edit' as any} params={{ routeId: item.id } as any} title="Chỉnh sửa luồng tuyến">
              <Edit size={15} />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600 hover:text-rose-700 dark:text-rose-400" onClick={() => setDeleteTarget(item)} title="Xóa luồng tuyến">
            <Trash2 size={15} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <AdminTablePage
        title="Quản Lý Luồng Tuyến Tàu"
        subtitle="Quản lý mã luồng tuyến và thứ tự bến dừng. Hành trình bán vé Superdong chọn cặp bến từ dữ liệu này"
        icon={GitBranch}
        apiError={apiError}
        searchValue={searchTerm}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Tìm theo tên, mã hoặc bến dừng..."
        filterValue={statusFilter}
        onFilterChange={handleStatusFilterChange}
        filterOptions={statusOptions}
        columns={columns}
        columnStorageKey="superdong_routes_columns"
        onRefresh={fetchRoutes}
        refreshing={loading}
        createLink="/routes/create"
        createLabel="Thêm Luồng Tuyến"
        data={filteredRoutes}
        loading={loading}
        emptyText="Chưa có luồng tuyến nào phù hợp với bộ lọc."
        keyExtractor={(item) => item.id}
        entityLabel="tuyến tàu"
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Xác nhận xóa luồng tuyến"
        description={`Bạn có chắc chắn muốn xóa luồng tuyến "${deleteTarget?.name || deleteTarget?.code}"? Hệ thống sẽ kiểm tra ràng buộc chuyến tàu trước khi thực hiện.`}
        confirmLabel={deleting ? 'Đang xóa...' : 'Xóa luồng tuyến'}
        loading={deleting}
        variant="destructive"
        onConfirm={executeDelete}
      />
    </>
  );
}

