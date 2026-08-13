import React, { useEffect, useMemo, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { MapPin, Edit, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { deleteLocation, getAdminLocations } from '@/apis/journeys';
import { Location } from '@/types';
import { Button } from '@/components/common/Button';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { AdminTablePage, ColumnDef } from '@/components/common/TableUtilities';

export const Route = createFileRoute('/_admin/locations/')({
  component: LocationsPage,
});

type LocationStatus = 'active' | 'inactive';
type LocationRow = {
  id: string;
  code: string;
  name: string;
  status: LocationStatus;
  updated_at?: string;
};

const normalizeStatus = (location: Location): LocationStatus => {
  if (location.status === 'inactive' || location.is_active === false) return 'inactive';
  return 'active';
};

const normalizeLocation = (location: Location): LocationRow => ({
  id: String(location.id),
  code: location.code || '',
  name: location.name || '',
  status: normalizeStatus(location),
  updated_at: location.updated_at,
});

const formatDateTime = (value?: string) => {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';
  return date.toLocaleDateString('vi-VN');
};

function LocationsPage() {
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [deleteTarget, setDeleteTarget] = useState<LocationRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchLocations = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await getAdminLocations({ status: 'all', limit: 100, page: 1 });
      const rows = Array.isArray(res?.data) ? res.data.map(normalizeLocation) : [];
      setLocations(rows);
      rows.forEach((row) => localStorage.setItem(`superdong_location_cache_${row.id}`, JSON.stringify(row)));
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không thể tải danh sách bến tàu';
      setLocations([]);
      setApiError(message);
      toast.error(`Không tải được danh sách bến tàu. ${message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, pageSize]);

  const filteredLocations = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return locations.filter((location) => {
      const matchesSearch =
        !keyword ||
        location.name.toLowerCase().includes(keyword) ||
        location.code.toLowerCase().includes(keyword);
      const matchesStatus = statusFilter === 'all' || location.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [locations, searchTerm, statusFilter]);

  const executeDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteLocation(deleteTarget.id, {
        reason: `Xóa bến tàu ${deleteTarget.name || deleteTarget.code} từ dashboard vận hành`,
      });
      localStorage.removeItem(`superdong_location_cache_${deleteTarget.id}`);
      toast.success(`Đã xóa bến tàu ${deleteTarget.name || deleteTarget.code}`);
      setDeleteTarget(null);
      await fetchLocations();
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không thể xóa bến tàu';
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'active', label: 'Đang hoạt động' },
    { value: 'inactive', label: 'Tạm ngưng' },
  ];

  const columns: ColumnDef<LocationRow>[] = [
    {
      key: 'code',
      label: 'Mã Bến',
      sortable: true,
      render: (item) => <span className="font-mono font-bold text-blue-600 dark:text-blue-400 uppercase whitespace-nowrap">{item.code}</span>,
    },
    {
      key: 'name',
      label: 'Tên Bến',
      sortable: true,
      render: (item) => <span className="font-bold text-slate-900 dark:text-white whitespace-nowrap">{item.name || 'Chưa cập nhật'}</span>,
    },
    {
      key: 'status',
      label: 'Trạng Thái',
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
      label: 'Cập Nhật',
      sortable: true,
      render: (item) => <span className="text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">{formatDateTime(item.updated_at)}</span>,
    },
    {
      key: 'actions',
      label: 'Thao Tác',
      align: 'right',
      render: (item) => (
        <div className="space-x-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 dark:text-blue-400" asChild>
            <Link to={'/locations/$locationId/edit' as any} params={{ locationId: item.id } as any} title="Chỉnh sửa bến tàu">
              <Edit size={15} />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600 hover:text-rose-700 dark:text-rose-400" onClick={() => setDeleteTarget(item)} title="Xóa bến tàu">
            <Trash2 size={15} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <AdminTablePage
        title="Quản lý bến tàu"
        subtitle="Quản lý mã bến, tên bến và trạng thái sử dụng trong mạng lưới tuyến tàu Superdong"
        icon={MapPin}
        apiError={apiError}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm theo tên bến hoặc mã bến..."
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        filterOptions={statusOptions}
        columns={columns}
        columnStorageKey="superdong_locations_columns"
        onRefresh={fetchLocations}
        refreshing={loading}
        createLink="/locations/create"
        createLabel="Thêm bến tàu"
        data={filteredLocations}
        loading={loading}
        emptyText="Chưa có bến tàu nào phù hợp với bộ lọc."
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
        title="Xác nhận xóa bến tàu"
        description={`Bạn có chắc chắn muốn xóa bến tàu "${deleteTarget?.name || deleteTarget?.code}"? Hệ thống sẽ kiểm tra ràng buộc tuyến tàu trước khi thực hiện.`}
        confirmLabel={deleting ? 'Đang xóa...' : 'Xóa bến tàu'}
        loading={deleting}
        variant="destructive"
        onConfirm={executeDelete}
      />
    </>
  );
}
