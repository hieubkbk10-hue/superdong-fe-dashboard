import React, { useEffect, useMemo, useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Layers, Edit, Trash2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { deleteSeatMap, getSeatMaps } from '@/apis/boats';
import { SeatMap } from '@/types';
import { Button } from '@/components/common/Button';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { AdminTablePage, ColumnDef, FilterOption } from '@/components/common/TableUtilities';

export interface SeatMapsSearch {
  page?: number;
  search?: string;
  status?: string;
}

export const Route = createFileRoute('/_admin/seat-maps/')({
  validateSearch: (search: Record<string, unknown>): SeatMapsSearch => {
    const result: SeatMapsSearch = {};
    if (Number(search?.page) > 1) result.page = Number(search.page);
    if (typeof search?.search === 'string' && search.search.trim()) result.search = search.search.trim();
    if (typeof search?.status === 'string' && search.status !== 'all') result.status = search.status;
    return result;
  },
  component: SeatMapsPage,
});

type SeatMapRow = {
  id: string;
  name: string;
  boat: string;
  boatName: string;
  boatCode: string;
  version: number;
  status: 'active' | 'inactive';
  decks: number;
  seats: number;
  updatedAt?: string;
};

const normalizeSeatMap = (item: SeatMap): SeatMapRow => {
  const decks = item.decks || [];
  const seats = decks.reduce(
    (total: number, deck: any) =>
      total + (deck.zones || []).reduce((zoneTotal: number, zone: any) => zoneTotal + (zone.seats || []).length, 0),
    0
  );
  const boat = (item as any).boat;
  const boatName = boat?.name || item.boat_name || '';
  return {
    id: String(item.id),
    name: item.name || '',
    boat: boatName,
    boatName,
    boatCode: boat?.code || '',
    version: Number(item.version || 1),
    status: (item as any).status === 'inactive' || item.is_active === false ? 'inactive' : 'active',
    decks: decks.length,
    seats,
    updatedAt: item.updated_at,
  };
};

const statusOptions: FilterOption[] = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Đang áp dụng' },
  { value: 'inactive', label: 'Tạm ngưng' },
];

function SeatMapsPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const searchParams = Route.useSearch();

  const currentPage = searchParams.page || 1;
  const searchTerm = searchParams.search || '';
  const statusFilter = searchParams.status || 'all';

  const [seatMaps, setSeatMaps] = useState<SeatMapRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<SeatMapRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSeatMaps = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await getSeatMaps({ limit: 100 });
      setSeatMaps(Array.isArray(res.data) ? res.data.map(normalizeSeatMap) : []);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không thể tải danh sách sơ đồ ghế';
      setSeatMaps([]);
      setApiError(message);
      toast.error(`Không tải được sơ đồ ghế. ${message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeatMaps();
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

  const filtered = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return seatMaps.filter((item) => {
      const matchesSearch =
        !keyword ||
        item.name.toLowerCase().includes(keyword) ||
        item.boatName.toLowerCase().includes(keyword) ||
        item.boatCode.toLowerCase().includes(keyword);
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [seatMaps, searchTerm, statusFilter]);

  const boatsWithMultipleActiveSeatMaps = useMemo(() => {
    const activeByBoat = new Map<string, SeatMapRow[]>();
    seatMaps.forEach((item) => {
      if (item.status !== 'active') return;
      const key = item.boatCode || item.boatName || 'unknown';
      activeByBoat.set(key, [...(activeByBoat.get(key) || []), item]);
    });

    return Array.from(activeByBoat.entries())
      .filter(([, maps]) => maps.length > 1)
      .map(([boat, maps]) => `${boat}: ${maps.map((map) => `${map.name} v${map.version}`).join(', ')}`);
  }, [seatMaps]);

  const executeDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteSeatMap(deleteTarget.id, {
        expected_version: deleteTarget.version,
        reason: `Xóa sơ đồ ghế ${deleteTarget.name} từ dashboard vận hành`,
      });
      toast.success(`Đã xóa sơ đồ ghế ${deleteTarget.name}`);
      setDeleteTarget(null);
      await fetchSeatMaps();
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không thể xóa sơ đồ ghế';
      toast.error(`Xóa sơ đồ ghế thất bại. ${message}`);
    } finally {
      setDeleting(false);
    }
  };

  const columns: ColumnDef<SeatMapRow>[] = [
    {
      key: 'name',
      label: 'TÊN SƠ ĐỒ',
      sortable: true,
      render: (item) => <span className="font-bold text-slate-900 dark:text-white whitespace-nowrap">{item.name || 'Chưa cập nhật'}</span>,
    },
    {
      key: 'boat',
      label: 'TÀU ĐẢM NHẬN',
      sortable: true,
      render: (item) => (
        <div className="whitespace-nowrap">
          <div className="font-semibold text-slate-800 dark:text-slate-200">{item.boatName || 'Chưa cập nhật'}</div>
          <div className="text-xs font-mono text-blue-600 dark:text-blue-400">{item.boatCode}</div>
        </div>
      ),
    },
    {
      key: 'version',
      label: 'PHIÊN BẢN',
      sortable: true,
      render: (item) => <span className="font-mono text-xs text-slate-500 whitespace-nowrap">v{item.version}</span>,
    },
    {
      key: 'decks',
      label: 'SỐ TẦNG',
      sortable: true,
      render: (item) => <span className="font-medium whitespace-nowrap">{item.decks}</span>,
    },
    {
      key: 'seats',
      label: 'SỐ GHẾ',
      sortable: true,
      render: (item) => <span className="font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{item.seats}</span>,
    },
    {
      key: 'status',
      label: 'TRẠNG THÁI',
      sortable: true,
      render: (item) =>
        item.status === 'active' ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 whitespace-nowrap">
            <CheckCircle2 size={12} /> Đang áp dụng
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800 whitespace-nowrap">
            <XCircle size={12} /> Tạm ngưng
          </span>
        ),
    },
    {
      key: 'actions',
      label: 'THAO TÁC',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 dark:text-blue-400" asChild>
            <Link to={'/seat-maps/$seatMapId/edit' as any} params={{ seatMapId: item.id } as any} title="Chỉnh sửa sơ đồ ghế">
              <Edit size={15} />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600 hover:text-rose-700 dark:text-rose-400" onClick={() => setDeleteTarget(item)} title="Xóa sơ đồ ghế">
            <Trash2 size={15} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <AdminTablePage
        title="Quản Lý Sơ Đồ Ghế Tàu"
        subtitle="Tạo, chỉnh sửa và quản lý layout tầng, khu vực, ghế và tiện ích của từng tàu"
        icon={Layers}
        apiError={apiError}
        banner={
          boatsWithMultipleActiveSeatMaps.length > 0 ? (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium flex items-start gap-2.5">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Có tàu đang có nhiều hơn 1 sơ đồ ghế “Đang áp dụng”.</p>
                <p className="mt-0.5">
                  Nghiệp vụ hiện tại chỉ cho phép tối đa 1 sơ đồ ghế active trên mỗi tàu. Khi tạo/cập nhật một sơ đồ sang “Đang áp dụng”, backend sẽ tự tạm ngưng các sơ đồ active cũ của cùng tàu.
                </p>
                <ul className="mt-1.5 list-disc pl-4 space-y-0.5">
                  {boatsWithMultipleActiveSeatMaps.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null
        }
        searchValue={searchTerm}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Tìm theo tên sơ đồ, mã tàu hoặc tên tàu..."
        filterValue={statusFilter}
        onFilterChange={handleStatusFilterChange}
        filterOptions={statusOptions}
        columns={columns}
        columnStorageKey="superdong_seat_maps_columns"
        onRefresh={fetchSeatMaps}
        refreshing={loading}
        createLink="/seat-maps/create"
        createLabel="Thêm Sơ Đồ Ghế"
        data={filtered}
        loading={loading}
        emptyText="Chưa có sơ đồ ghế nào phù hợp với bộ lọc."
        keyExtractor={(item) => item.id}
        entityLabel="sơ đồ ghế"
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Xác nhận xóa sơ đồ ghế"
        description={`Bạn có chắc chắn muốn xóa sơ đồ ghế "${deleteTarget?.name}"? Thao tác này không thể hoàn tác.`}
        confirmLabel={deleting ? 'Đang xóa...' : 'Xóa sơ đồ'}
        loading={deleting}
        variant="destructive"
        onConfirm={executeDelete}
      />
    </>
  );
}

