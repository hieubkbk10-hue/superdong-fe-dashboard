import React, { useEffect, useMemo, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Layers, Plus, Edit, Search, CheckCircle2, XCircle, RefreshCw, AlertTriangle, Ban, Columns3, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { deactivateSeatClass, deleteSeatClass, getSeatClasses } from '@/apis/boats';
import { SeatClass } from '@/types';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { PaginationBar } from '@/components/common/PaginationBar';

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

const columnStorageKey = 'superdong_seat_classes_columns';
const defaultVisibleColumns = {
  code: true,
  name: true,
  price: true,
  color: true,
  status: true,
  actions: true,
};
type VisibleColumns = typeof defaultVisibleColumns;

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
  status: sc.status === 'inactive' || sc.is_active === false ? 'inactive' : 'active',
});

function SeatClassesPage() {
  const [seatClasses, setSeatClasses] = useState<SeatClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showColumns, setShowColumns] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>(() => {
    try {
      return { ...defaultVisibleColumns, ...JSON.parse(localStorage.getItem(columnStorageKey) || '{}') };
    } catch {
      return defaultVisibleColumns;
    }
  });
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

  useEffect(() => {
    localStorage.setItem(columnStorageKey, JSON.stringify(visibleColumns));
  }, [visibleColumns]);

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

  const paginatedSeatClasses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSeatClasses.slice(start, start + pageSize);
  }, [filteredSeatClasses, currentPage, pageSize]);

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

  return (
    <div className="space-y-4 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="h-6 w-6 text-blue-600" />
              Quản lý hạng ghế
            </h1>
            {!apiError && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 size={13} /> Dữ liệu đang đồng bộ
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">Thiết lập hạng ghế, giá cơ sở và trạng thái áp dụng cho bán vé.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSeatClasses}
            disabled={loading}
            className="h-10 px-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>
          <Link
            to={'/seat-classes/create' as any}
            className="h-10 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus size={16} /> Thêm hạng ghế
          </Link>
        </div>
      </div>

      {apiError && !loading && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium flex items-start gap-2.5">
          <AlertTriangle size={18} className="shrink-0 text-rose-500" />
          <span>Không tải được dữ liệu hạng ghế. {apiError}</span>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="relative w-full lg:w-96">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên hạng hoặc mã hạng ghế..."
            className="w-full h-10 pl-9 pr-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang áp dụng</option>
            <option value="inactive">Tạm ngưng</option>
          </select>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColumns((value) => !value)}
              className="h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2"
            >
              <Columns3 size={15} /> Cột
            </button>
            {showColumns && (
              <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setVisibleColumns(defaultVisibleColumns)}
                  className="mb-2 text-xs font-semibold text-blue-600 hover:underline"
                >
                  Mặc định
                </button>
                {[
                  ['code', 'Mã hạng'],
                  ['name', 'Tên hạng ghế'],
                  ['price', 'Giá cơ sở'],
                  ['color', 'Màu nhận diện'],
                  ['status', 'Trạng thái'],
                  ['actions', 'Thao tác'],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 py-1 text-xs text-slate-700 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={visibleColumns[key as keyof typeof visibleColumns]}
                      onChange={(e) => setVisibleColumns((prev: VisibleColumns) => ({ ...prev, [key]: e.target.checked }))}
                    />
                    {label}
                  </label>
                ))}
              </div>
            )}
          </div>

          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>{size} dòng/trang</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F9FAFB] dark:bg-slate-800 text-slate-600 font-bold uppercase text-xs border-b border-slate-200 dark:border-slate-800">
            <tr>
              {visibleColumns.code && <th className="p-4">Mã hạng</th>}
              {visibleColumns.name && <th className="p-4">Tên hạng ghế</th>}
              {visibleColumns.price && <th className="p-4">Giá cơ sở</th>}
              {visibleColumns.color && <th className="p-4">Màu nhận diện</th>}
              {visibleColumns.status && <th className="p-4">Trạng thái</th>}
              {visibleColumns.actions && <th className="p-4 text-right">Thao tác</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" />
                  Đang tải dữ liệu hạng ghế...
                </td>
              </tr>
            ) : paginatedSeatClasses.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  {apiError ? 'Không tải được dữ liệu hạng ghế.' : 'Chưa có hạng ghế nào.'}
                </td>
              </tr>
            ) : (
              paginatedSeatClasses.map((sc) => (
                <tr key={sc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  {visibleColumns.code && (
                    <td className="p-4 font-mono font-bold text-xs text-blue-600 dark:text-blue-400">{sc.code || 'Chưa cập nhật'}</td>
                  )}
                  {visibleColumns.name && (
                    <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers size={15} className="text-blue-600 shrink-0" />
                      {sc.name || <span className="text-slate-400 font-medium">Chưa cập nhật</span>}
                    </td>
                  )}
                  {visibleColumns.price && (
                    <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(sc.price)}</td>
                  )}
                  {visibleColumns.color && (
                    <td className="p-4">
                      {sc.color ? (
                        <span className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                          <span className="h-4 w-4 rounded-full border border-slate-200" style={{ backgroundColor: sc.color }} />
                          {sc.color}
                        </span>
                      ) : (
                        <span className="text-slate-400">Chưa cập nhật</span>
                      )}
                    </td>
                  )}
                  {visibleColumns.status && (
                    <td className="p-4">
                      {sc.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={12} /> Đang áp dụng
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle size={12} /> Tạm ngưng
                        </span>
                      )}
                    </td>
                  )}
                  {visibleColumns.actions && (
                    <td className="p-4 text-right space-x-1">
                      <Link
                        to={'/seat-classes/$classId/edit' as any}
                        params={{ classId: sc.id } as any}
                        className="p-1.5 inline-flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 cursor-pointer"
                        title="Chỉnh sửa hạng ghế"
                      >
                        <Edit size={16} />
                      </Link>
                      <button
                        type="button"
                        disabled={sc.status === 'inactive'}
                        onClick={() => setDeactivateTarget(sc)}
                        className="p-1.5 inline-flex items-center justify-center rounded-md hover:bg-rose-50 text-rose-600 disabled:text-slate-300 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                        title={sc.status === 'inactive' ? 'Hạng ghế đã tạm ngưng' : 'Tạm ngưng hạng ghế'}
                      >
                        <Ban size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(sc)}
                        className="p-1.5 inline-flex items-center justify-center rounded-md hover:bg-rose-50 text-rose-600 cursor-pointer"
                        title="Xóa cứng hạng ghế"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PaginationBar
        currentPage={currentPage}
        totalItems={filteredSeatClasses.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      <ConfirmModal
        open={Boolean(deactivateTarget)}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
        title="Tạm ngưng hạng ghế"
        description={deactivateTarget ? `Bạn chắc chắn muốn tạm ngưng hạng ghế "${deactivateTarget.name}"? Hạng ghế đang được dùng trong chuyến mở bán có thể bị hệ thống từ chối.` : ''}
        confirmLabel="Tạm ngưng"
        loading={deactivating}
        variant="destructive"
        onConfirm={executeDeactivate}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xóa cứng hạng ghế"
        description={deleteTarget ? `Bạn chắc chắn muốn xóa cứng hạng ghế "${deleteTarget.name}"? Hệ thống sẽ lưu snapshot audit trước khi xóa. Nếu hạng ghế đang được sơ đồ ghế sử dụng, Backend có thể từ chối để tránh hỏng dữ liệu vận hành.` : ''}
        confirmLabel="Xóa cứng"
        loading={deleting}
        variant="destructive"
        onConfirm={executeDelete}
      />
    </div>
  );
}
