import React, { useEffect, useMemo, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Layers, Edit, Trash2, CheckCircle2, XCircle, Ban } from 'lucide-react';
import { toast } from 'sonner';

import { deactivateSeatClass, deleteSeatClass, getSeatClasses } from '@/apis/boats';
import { SeatClass } from '@/types';
import { Button } from '@/components/common/Button';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { AdminTablePage, ColumnDef } from '@/components/common/TableUtilities';

export const Route = createFileRoute('/_admin/seat-classes/')({
  component: SeatClassesPage,
});

type SeatClassItem = {
  id: string;
  code: string;
  name: string;
  price: number | null;
  color: string;
  version: number;
  status: 'active' | 'inactive';
};

const formatCurrency = (value: number | null) => {
  if (!value || value <= 0) return 'Chưa cập nhật';
  return `${value.toLocaleString('vi-VN')} VNĐ`;
};

const normalizeSeatClass = (sc: SeatClass): SeatClassItem => ({
  id: String(sc.id),
  code: sc.code || '',
  name: sc.name || '',
  price: typeof sc.price === 'number' ? sc.price : null,
  color: sc.color || '',
  version: sc.version || 1,
  status: sc.status === 'inactive' || (sc as any).is_active === false ? 'inactive' : 'active',
});

function SeatClassesPage() {
  const [seatClasses, setSeatClasses] = useState<SeatClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [deactivateTarget, setDeactivateTarget] = useState<SeatClassItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SeatClassItem | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchSeatClasses = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await getSeatClasses();
      const rows = Array.isArray(res?.data) ? res.data.map(normalizeSeatClass) : [];
      setSeatClasses(rows);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không thể kết nối tới API hạng ghế';
      setSeatClasses([]);
      setApiError(message);
      toast.error(`Không tải được danh sách hạng ghế. ${message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeatClasses();
  }, []);

  const filteredSeatClasses = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return seatClasses.filter((sc) => {
      const matchesSearch = !keyword || sc.name.toLowerCase().includes(keyword) || sc.code.toLowerCase().includes(keyword);
      const matchesStatus = statusFilter === 'all' || sc.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [seatClasses, searchTerm, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, pageSize]);

  const executeDeactivate = async () => {
    if (!deactivateTarget || deactivating) return;
    setDeactivating(true);
    try {
      await deactivateSeatClass(deactivateTarget.id, {
        expected_version: deactivateTarget.version,
        reason: `Tạm ngưng hạng ghế ${deactivateTarget.name} từ dashboard vận hành`,
      });
      toast.success(`Đã tạm ngưng hạng ghế ${deactivateTarget.name}`);
      setDeactivateTarget(null);
      await fetchSeatClasses();
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không thể tạm ngưng hạng ghế';
      toast.error(`Tạm ngưng hạng ghế thất bại. ${message}`);
    } finally {
      setDeactivating(false);
    }
  };

  const executeDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteSeatClass(deleteTarget.id, {
        expected_version: deleteTarget.version,
        reason: `Xóa cứng hạng ghế ${deleteTarget.name} từ dashboard vận hành`,
      });
      toast.success(`Đã xóa hạng ghế ${deleteTarget.name}`);
      setDeleteTarget(null);
      await fetchSeatClasses();
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không thể xóa hạng ghế';
      toast.error(`Xóa hạng ghế thất bại. ${message}`);
    } finally {
      setDeleting(false);
    }
  };

  const statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'active', label: 'Đang áp dụng' },
    { value: 'inactive', label: 'Tạm ngưng' },
  ];

  const columns: ColumnDef<SeatClassItem>[] = [
    {
      key: 'code',
      label: 'Mã Hạng',
      sortable: true,
      render: (sc) => <span className="font-mono font-bold text-blue-600 dark:text-blue-400 uppercase whitespace-nowrap">{sc.code}</span>,
    },
    {
      key: 'name',
      label: 'Tên Hạng',
      sortable: true,
      render: (sc) => <span className="font-bold text-slate-900 dark:text-white whitespace-nowrap">{sc.name}</span>,
    },
    {
      key: 'price',
      label: 'Giá Cơ Sở',
      sortable: true,
      render: (sc) => <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{formatCurrency(sc.price)}</span>,
    },
    {
      key: 'color',
      label: 'Màu Sắc',
      render: (sc) =>
        sc.color ? (
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="h-4 w-4 rounded-full border border-slate-300 dark:border-slate-700 shadow-2xs shrink-0" style={{ backgroundColor: sc.color }} />
            <span className="font-mono text-xs text-slate-600 dark:text-slate-400 uppercase">{sc.color}</span>
          </div>
        ) : (
          <span className="text-slate-400 text-xs whitespace-nowrap">Chưa cài đặt</span>
        ),
    },
    {
      key: 'status',
      label: 'Trạng Thái',
      sortable: true,
      render: (sc) =>
        sc.status === 'active' ? (
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
      label: 'Thao Tác',
      align: 'right',
      render: (sc) => (
        <div className="space-x-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 dark:text-blue-400" asChild>
            <Link to={'/seat-classes/$classId/edit' as any} params={{ classId: sc.id } as any} title="Chỉnh sửa hạng ghế">
              <Edit size={15} />
            </Link>
          </Button>
          {sc.status === 'active' && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:text-amber-700 dark:text-amber-400" onClick={() => setDeactivateTarget(sc)} title="Tạm ngưng áp dụng">
              <Ban size={15} />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600 hover:text-rose-700 dark:text-rose-400" onClick={() => setDeleteTarget(sc)} title="Xóa hạng ghế">
            <Trash2 size={15} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <AdminTablePage
        title="Quản lý hạng ghế"
        subtitle="Thiết lập hạng ghế, giá cơ sở và trạng thái áp dụng cho bán vé Superdong"
        icon={Layers}
        apiError={apiError}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm theo tên hạng hoặc mã hạng ghế..."
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        filterOptions={statusOptions}
        columns={columns}
        columnStorageKey="superdong_seat_classes_columns"
        onRefresh={fetchSeatClasses}
        refreshing={loading}
        createLink="/seat-classes/create"
        createLabel="Thêm hạng ghế"
        data={filteredSeatClasses}
        loading={loading}
        emptyText="Chưa có dữ liệu hạng ghế nào phù hợp với bộ lọc."
        keyExtractor={(sc) => sc.id}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      <ConfirmModal
        open={!!deactivateTarget}
        onOpenChange={(open) => {
          if (!open) setDeactivateTarget(null);
        }}
        title="Tạm ngưng áp dụng hạng ghế"
        description={`Bạn có chắc muốn chuyển hạng ghế "${deactivateTarget?.name}" sang trạng thái tạm ngưng áp dụng?`}
        confirmLabel={deactivating ? 'Đang xử lý...' : 'Tạm ngưng'}
        loading={deactivating}
        variant="destructive"
        onConfirm={executeDeactivate}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Xác nhận xóa hạng ghế"
        description={`Bạn có chắc chắn muốn xóa hạng ghế "${deleteTarget?.name}"? Thao tác này không thể hoàn tác.`}
        confirmLabel={deleting ? 'Đang xóa...' : 'Xóa hạng ghế'}
        loading={deleting}
        variant="destructive"
        onConfirm={executeDelete}
      />
    </>
  );
}
