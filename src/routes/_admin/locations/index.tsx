import React, { useEffect, useMemo, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { MapPin, Plus, Edit, Trash2, Search, CheckCircle2, XCircle, RefreshCw, AlertTriangle, Columns3, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { deleteLocation, getAdminLocations } from '@/apis/journeys';
import { Location } from '@/types';
import { PaginationBar } from '@/components/common/PaginationBar';
import { ConfirmModal } from '@/components/common/ConfirmModal';

export const Route = createFileRoute('/_admin/locations/')({
  component: LocationsPage,
});

type LocationStatus = 'active' | 'inactive';
type LocationRow = {
  id: string;
  code: string;
  name: string;
  status: LocationStatus;
  created_at?: string;
  updated_at?: string;
};

const columnStorageKey = 'superdong_locations_columns';
const defaultVisibleColumns = {
  code: true,
  name: true,
  status: true,
  updated_at: true,
  actions: true,
};
type VisibleColumns = typeof defaultVisibleColumns;

const normalizeStatus = (location: Location): LocationStatus => {
  if (location.status === 'inactive' || location.is_active === false) return 'inactive';
  return 'active';
};

const normalizeLocation = (location: Location): LocationRow => ({
  id: String(location.id),
  code: location.code || '',
  name: location.name || '',
  status: normalizeStatus(location),
  created_at: location.created_at,
  updated_at: location.updated_at,
});

const formatDateTime = (value?: string) => {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';
  return date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
};

function LocationsPage() {
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | LocationStatus>('all');
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
    localStorage.setItem(columnStorageKey, JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, pageSize]);

  const filteredLocations = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return locations.filter((location) => {
      const matchesSearch = !keyword || location.name.toLowerCase().includes(keyword) || location.code.toLowerCase().includes(keyword);
      const matchesStatus = statusFilter === 'all' || location.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [locations, searchTerm, statusFilter]);

  const paginatedLocations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLocations.slice(start, start + pageSize);
  }, [filteredLocations, currentPage, pageSize]);

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

  return (
    <div className="space-y-4 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <MapPin className="h-6 w-6 text-blue-600" />
              Quản lý bến tàu
            </h1>
            {!apiError && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 size={13} /> Dữ liệu đang đồng bộ
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">Quản lý mã bến, tên bến và trạng thái sử dụng trong mạng lưới tuyến tàu.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLocations}
            disabled={loading}
            className="h-10 px-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>
          <Link
            to={'/locations/create' as any}
            className="h-10 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus size={16} /> Thêm bến tàu
          </Link>
        </div>
      </div>

      {apiError && !loading && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium flex items-start gap-2.5">
          <AlertTriangle size={18} className="shrink-0 text-rose-500" />
          <span>Không tải được dữ liệu bến tàu. {apiError}</span>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="relative w-full lg:w-96">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên bến hoặc mã bến..."
            className="w-full h-10 pl-9 pr-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | LocationStatus)}
            className="h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
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
                  ['code', 'Mã bến'],
                  ['name', 'Tên bến tàu'],
                  ['status', 'Trạng thái'],
                  ['updated_at', 'Cập nhật gần nhất'],
                  ['actions', 'Thao tác'],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 py-1 text-xs text-slate-700 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={visibleColumns[key as keyof VisibleColumns]}
                      onChange={(e) => setVisibleColumns((prev) => ({ ...prev, [key]: e.target.checked }))}
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
              {visibleColumns.code && <th className="p-4">Mã bến</th>}
              {visibleColumns.name && <th className="p-4">Tên bến tàu</th>}
              {visibleColumns.status && <th className="p-4">Trạng thái</th>}
              {visibleColumns.updated_at && <th className="p-4">Cập nhật gần nhất</th>}
              {visibleColumns.actions && <th className="p-4 text-right">Thao tác</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" />
                  Đang tải dữ liệu bến tàu...
                </td>
              </tr>
            ) : paginatedLocations.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  {apiError ? 'Không tải được dữ liệu bến tàu.' : 'Chưa có bến tàu nào.'}
                </td>
              </tr>
            ) : (
              paginatedLocations.map((location) => (
                <tr key={location.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  {visibleColumns.code && (
                    <td className="p-4 font-mono font-bold text-xs text-blue-600 dark:text-blue-400">{location.code || 'Chưa cập nhật'}</td>
                  )}
                  {visibleColumns.name && (
                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <Navigation size={15} className="text-blue-600 shrink-0" />
                        {location.name || 'Chưa cập nhật'}
                      </div>
                    </td>
                  )}
                  {visibleColumns.status && (
                    <td className="p-4">
                      {location.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={12} /> Đang hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle size={12} /> Tạm ngưng
                        </span>
                      )}
                    </td>
                  )}
                  {visibleColumns.updated_at && <td className="p-4 text-xs text-slate-500">{formatDateTime(location.updated_at)}</td>}
                  {visibleColumns.actions && (
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          to={'/locations/$locationId/edit' as any}
                          params={{ locationId: location.id } as any}
                          className="p-1.5 inline-flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 cursor-pointer"
                          title="Chỉnh sửa bến tàu"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(location)}
                          className="p-1.5 inline-flex items-center justify-center rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 cursor-pointer"
                          title="Xóa bến tàu"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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
        totalItems={filteredLocations.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xóa bến tàu?"
        description={
          <span>
            Bến tàu <strong>{deleteTarget?.name || deleteTarget?.code}</strong> sẽ bị xóa khỏi danh mục nếu chưa được tuyến hoặc chuyến nào sử dụng. Nếu đang bị ràng buộc, hệ thống sẽ từ chối và hiển thị rõ dữ liệu đang dính.
          </span>
        }
        confirmLabel="Xóa bến tàu"
        cancelLabel="Hủy bỏ"
        loading={deleting}
        onConfirm={executeDelete}
      />
    </div>
  );
}
