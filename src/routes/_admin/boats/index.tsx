import React, { useState, useEffect, useMemo } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Ship, Edit, Trash2, CheckCircle2, XCircle, Anchor } from 'lucide-react';
import { toast } from 'sonner';

import { getBoats, deleteBoat } from '@/apis/boats';
import { Boat } from '@/types';
import { Button } from '@/components/common/Button';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { AdminTablePage, ColumnDef } from '@/components/common/TableUtilities';

export const Route = createFileRoute('/_admin/boats/')({
  component: BoatsPage,
});

export interface BoatItem {
  id: string;
  code: string;
  name: string;
  capacity: number;
  speed: string;
  is_express: boolean;
  status: 'active' | 'maintenance' | 'inactive';
}

function BoatsPage() {
  const [boats, setBoats] = useState<BoatItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState<BoatItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBoats = async () => {
    try {
      setIsLoading(true);
      setApiError(null);
      const res = await getBoats();
      if (res && res.data && Array.isArray(res.data)) {
        const mapped: BoatItem[] = res.data.map((b: Boat) => ({
          id: String(b.id),
          code: b.code || '',
          name: b.name || '',
          capacity: b.capacity || 0,
          speed: typeof b.speed === 'number' ? `${b.speed} hải lý/giờ` : b.speed || '',
          is_express: b.is_express ?? true,
          status: (b.status as any) || 'active',
        }));
        setBoats(mapped);
      } else {
        setBoats([]);
      }
    } catch (err: any) {
      console.error('Fetch boats error:', err);
      setBoats([]);
      setApiError(err?.response?.data?.message || err?.message || 'Không thể kết nối với Backend API');
      toast.error('Không thể lấy dữ liệu đội tàu từ Backend API');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBoats();
  }, []);

  const filteredBoats = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return boats.filter((b) => {
      const matchesSearch = !keyword || b.name.toLowerCase().includes(keyword) || b.code.toLowerCase().includes(keyword);
      const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [boats, searchTerm, statusFilter]);

  const executeDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteBoat(deleteTarget.id);
      toast.success(`Đã xóa tàu ${deleteTarget.name} thành công`);
      setDeleteTarget(null);
      fetchBoats();
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message || err?.message || 'Không thể thực hiện';
      toast.error(`Lỗi xóa tàu: ${serverMsg}`);
    } finally {
      setDeleting(false);
    }
  };

  const statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'active', label: 'Đang hoạt động' },
    { value: 'maintenance', label: 'Đang bảo trì' },
    { value: 'inactive', label: 'Tạm ngưng' },
  ];

  const columns: ColumnDef<BoatItem>[] = [
    {
      key: 'code',
      label: 'Mã Tàu',
      sortable: true,
      render: (b) => <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{b.code}</span>,
    },
    {
      key: 'name',
      label: 'Tên Tàu',
      sortable: true,
      render: (b) => (
        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 whitespace-nowrap">
          <Anchor size={15} className="text-slate-400 shrink-0" /> {b.name}
        </div>
      ),
    },
    {
      key: 'capacity',
      label: 'Sức Chứa',
      sortable: true,
      render: (b) => (
        <span className="font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
          {b.capacity > 0 ? `${b.capacity} ghế` : <span className="text-slate-400">Chưa cập nhật</span>}
        </span>
      ),
    },
    {
      key: 'speed',
      label: 'Tốc Độ',
      sortable: true,
      render: (b) => (
        <span className="text-slate-600 dark:text-slate-400 font-mono text-xs whitespace-nowrap">
          {b.speed || <span className="font-sans text-slate-400">Chưa cập nhật</span>}
        </span>
      ),
    },
    {
      key: 'is_express',
      label: 'Loại Tàu',
      render: (b) =>
        b.is_express ? (
          <span className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap">
            Tàu Cao Tốc
          </span>
        ) : (
          <span className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-xs px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap">
            Tàu Phà Thường
          </span>
        ),
    },
    {
      key: 'status',
      label: 'Trạng Thái',
      sortable: true,
      render: (b) => {
        if (b.status === 'active') {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 whitespace-nowrap">
              <CheckCircle2 size={12} /> Đang hoạt động
            </span>
          );
        }
        if (b.status === 'maintenance') {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 whitespace-nowrap">
              <XCircle size={12} /> Đang bảo trì
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800 whitespace-nowrap">
            <XCircle size={12} /> Tạm ngưng
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Thao Tác',
      align: 'right',
      render: (b) => (
        <div className="space-x-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 dark:text-blue-400" asChild>
            <Link to={'/boats/$boatId/edit' as any} params={{ boatId: b.id } as any} title="Chỉnh sửa thông tin tàu">
              <Edit size={15} />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600 hover:text-rose-700 dark:text-rose-400" onClick={() => setDeleteTarget(b)} title="Xóa tàu">
            <Trash2 size={15} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <AdminTablePage
        title="Quản lý Đội tàu Superdong"
        subtitle="Danh sách tàu cao tốc vận tải hành khách trên các tuyến biển"
        icon={Ship}
        apiError={apiError}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm theo Mã tàu hoặc Tên tàu..."
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        filterOptions={statusOptions}
        columns={columns}
        columnStorageKey="superdong_boats_columns"
        onRefresh={fetchBoats}
        refreshing={isLoading}
        createLink="/boats/create"
        createLabel="Thêm Tàu Mới"
        data={filteredBoats}
        loading={isLoading}
        emptyText={apiError ? '⚠️ Không thể lấy dữ liệu từ Backend API.' : 'Chưa có thông tin tàu phù hợp.'}
        keyExtractor={(b) => b.id}
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
        title="Xác nhận xóa tàu"
        description={`Bạn có chắc chắn muốn xóa/ngừng hoạt động tàu "${deleteTarget?.name}"? Thao tác này không thể hoàn tác.`}
        confirmLabel={deleting ? 'Đang xóa...' : 'Xóa tàu'}
        loading={deleting}
        variant="destructive"
        onConfirm={executeDelete}
      />
    </>
  );
}
