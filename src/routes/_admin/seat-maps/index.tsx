import React, { useEffect, useMemo, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Layers, Plus, Edit, Trash2, Search, RefreshCw, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { deleteSeatMap, getSeatMaps } from '@/apis/boats';
import { SeatMap } from '@/types';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { PaginationBar } from '@/components/common/PaginationBar';

export const Route = createFileRoute('/_admin/seat-maps/')({
  component: SeatMapsPage,
});

type SeatMapRow = {
  id: string;
  name: string;
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
  const seats = decks.reduce((total: number, deck: any) => total + (deck.zones || []).reduce((zoneTotal: number, zone: any) => zoneTotal + (zone.seats || []).length, 0), 0);
  const boat = (item as any).boat;
  return {
    id: String(item.id),
    name: item.name || '',
    boatName: boat?.name || item.boat_name || '',
    boatCode: boat?.code || '',
    version: Number(item.version || 1),
    status: (item as any).status === 'inactive' || item.is_active === false ? 'inactive' : 'active',
    decks: decks.length,
    seats,
    updatedAt: item.updated_at,
  };
};

function SeatMapsPage() {
  const [seatMaps, setSeatMaps] = useState<SeatMapRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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

  const filtered = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return seatMaps.filter((item) => {
      const matchesSearch = !keyword || item.name.toLowerCase().includes(keyword) || item.boatName.toLowerCase().includes(keyword) || item.boatCode.toLowerCase().includes(keyword);
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [seatMaps, searchTerm, statusFilter]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

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

  return (
    <div className="space-y-4 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="h-6 w-6 text-blue-600" />
            Quản lý sơ đồ ghế
          </h1>
          <p className="text-xs text-slate-500 mt-1">Tạo, chỉnh sửa và quản lý layout tầng, khu vực, ghế và tiện ích của từng tàu.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchSeatMaps} disabled={loading} className="h-10 px-3.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Làm mới
          </button>
          <Link to={'/seat-maps/create' as any} className="h-10 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center gap-2 shadow-xs">
            <Plus size={16} /> Thêm sơ đồ ghế
          </Link>
        </div>
      </div>

      {apiError && <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2.5"><AlertTriangle size={18} />Không tải được dữ liệu sơ đồ ghế. {apiError}</div>}
      {boatsWithMultipleActiveSeatMaps.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium flex items-start gap-2.5">
          <AlertTriangle size={18} className="shrink-0" />
          <div>
            <p className="font-bold">Có tàu đang có nhiều hơn 1 sơ đồ ghế “Đang áp dụng”.</p>
            <p className="mt-1">Nghiệp vụ hiện tại chỉ cho phép tối đa 1 sơ đồ ghế active trên mỗi tàu. Khi tạo/cập nhật một sơ đồ sang “Đang áp dụng”, backend sẽ tự tạm ngưng các sơ đồ active cũ của cùng tàu.</p>
            <ul className="mt-2 list-disc pl-4 space-y-0.5">
              {boatsWithMultipleActiveSeatMaps.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm theo tên sơ đồ, mã tàu hoặc tên tàu..." className="w-full h-10 pl-9 pr-3 text-sm bg-slate-50 border border-slate-200 rounded-md outline-none focus:border-blue-500" />
        </div>
        <div className="flex items-center gap-3">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 px-3 text-sm bg-slate-50 border border-slate-200 rounded-md outline-none focus:border-blue-500">
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang áp dụng</option>
            <option value="inactive">Tạm ngưng</option>
          </select>
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="h-10 px-3 text-sm bg-slate-50 border border-slate-200 rounded-md outline-none focus:border-blue-500">
            {[5, 10, 20, 50].map((size) => <option key={size} value={size}>{size} dòng/trang</option>)}
          </select>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F9FAFB] text-slate-600 font-bold uppercase text-xs border-b border-slate-200">
            <tr><th className="p-4">Tên sơ đồ</th><th className="p-4">Tàu</th><th className="p-4">Phiên bản</th><th className="p-4">Số tầng</th><th className="p-4">Số ghế</th><th className="p-4">Trạng thái</th><th className="p-4 text-right">Thao tác</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-slate-500"><RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" />Đang tải sơ đồ ghế...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-slate-500">Chưa có sơ đồ ghế nào.</td></tr>
            ) : paginated.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="p-4 font-bold text-slate-900">{item.name || 'Chưa cập nhật'}</td>
                <td className="p-4"><div className="font-semibold">{item.boatName || 'Chưa cập nhật'}</div><div className="text-xs font-mono text-blue-600">{item.boatCode}</div></td>
                <td className="p-4 font-mono text-xs">v{item.version}</td>
                <td className="p-4">{item.decks}</td>
                <td className="p-4 font-semibold">{item.seats}</td>
                <td className="p-4">{item.status === 'active' ? <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 size={12} /> Đang áp dụng</span> : <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"><XCircle size={12} /> Tạm ngưng</span>}</td>
                <td className="p-4 text-right space-x-1">
                  <Link to={'/seat-maps/$seatMapId/edit' as any} params={{ seatMapId: item.id } as any} className="p-1.5 inline-flex rounded-md hover:bg-slate-100 text-blue-600" title="Chỉnh sửa sơ đồ ghế"><Edit size={16} /></Link>
                  <button type="button" onClick={() => setDeleteTarget(item)} className="p-1.5 inline-flex rounded-md hover:bg-rose-50 text-rose-600" title="Xóa sơ đồ ghế"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PaginationBar currentPage={currentPage} totalItems={filtered.length} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
      <ConfirmModal open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)} title="Xóa sơ đồ ghế" description={deleteTarget ? `Bạn chắc chắn muốn xóa sơ đồ ghế "${deleteTarget.name}"? Backend sẽ lưu snapshot audit trước khi xóa.` : ''} confirmLabel="Xóa sơ đồ" loading={deleting} variant="destructive" onConfirm={executeDelete} />
    </div>
  );
}
