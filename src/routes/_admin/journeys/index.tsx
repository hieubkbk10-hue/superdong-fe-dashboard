import React, { useEffect, useMemo, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Route as RouteIcon, Plus, Edit, Search, CheckCircle2, XCircle, ArrowRight, RefreshCw, AlertTriangle, Columns3, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { deactivateJourney, getJourneys } from '@/apis/journeys';
import { Journey, Location, Route as JourneyRoute } from '@/types';
import { PaginationBar } from '@/components/common/PaginationBar';
import { ConfirmModal } from '@/components/common/ConfirmModal';

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

const columnStorageKey = 'superdong_journeys_columns';
const defaultVisibleColumns = {
  route: true,
  direction: true,
  status: true,
  updated_at: true,
  actions: true,
};
type VisibleColumns = typeof defaultVisibleColumns;

const unwrapData = <T,>(value: T | { data?: T } | undefined): T | undefined => {
  if (!value) return undefined;
  if (typeof value === 'object' && value !== null && 'data' in value) return (value as { data?: T }).data;
  return value as T;
};

const normalizeJourney = (journey: Journey): JourneyRow => {
  const route = unwrapData<JourneyRoute>(journey.route);
  const fromLocation = unwrapData<Location>(journey.from_location);
  const toLocation = unwrapData<Location>(journey.to_location);

  return {
    id: String(journey.id),
    routeCode: route?.code || '',
    routeName: route?.name || '',
    fromName: fromLocation?.name || '',
    toName: toLocation?.name || '',
    status: journey.status === 'inactive' || journey.is_active === false ? 'inactive' : 'active',
    updated_at: journey.updated_at,
  };
};

const formatDateTime = (value?: string) => {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';
  return date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
};

function JourneysPage() {
  const [journeys, setJourneys] = useState<JourneyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | JourneyStatus>('all');
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
  const [deactivateTarget, setDeactivateTarget] = useState<JourneyRow | null>(null);
  const [deactivating, setDeactivating] = useState(false);

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
    localStorage.setItem(columnStorageKey, JSON.stringify(visibleColumns));
  }, [visibleColumns]);

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

  const paginatedJourneys = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredJourneys.slice(start, start + pageSize);
  }, [filteredJourneys, currentPage, pageSize]);

  const executeDeactivate = async () => {
    if (!deactivateTarget || deactivating) return;
    setDeactivating(true);
    try {
      await deactivateJourney(deactivateTarget.id);
      toast.success(`Đã tạm ngưng hành trình ${deactivateTarget.fromName || 'Chưa cập nhật'} → ${deactivateTarget.toName || 'Chưa cập nhật'}`);
      setDeactivateTarget(null);
      await fetchJourneys();
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không thể tạm ngưng hành trình';
      toast.error(`Tạm ngưng hành trình thất bại. ${message}`);
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <div className="space-y-4 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <RouteIcon className="h-6 w-6 text-blue-600" />
              Quản lý hành trình
            </h1>
            {!apiError && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 size={13} /> Dữ liệu đang đồng bộ
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">Cấu hình cặp bến đi, bến đến hợp lệ trên từng luồng tuyến đang khai thác.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchJourneys}
            disabled={loading}
            className="h-10 px-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>
          <Link
            to={'/journeys/create' as any}
            className="h-10 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus size={16} /> Thêm hành trình
          </Link>
        </div>
      </div>

      {apiError && !loading && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium flex items-start gap-2.5">
          <AlertTriangle size={18} className="shrink-0 text-rose-500" />
          <span>Không tải được dữ liệu hành trình. {apiError}</span>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="relative w-full lg:w-96">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tuyến, bến đi hoặc bến đến..."
            className="w-full h-10 pl-9 pr-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | JourneyStatus)}
            className="h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang khai thác</option>
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
                <button type="button" onClick={() => setVisibleColumns(defaultVisibleColumns)} className="mb-2 text-xs font-semibold text-blue-600 hover:underline">
                  Mặc định
                </button>
                {[
                  ['route', 'Luồng tuyến'],
                  ['direction', 'Bến đi → bến đến'],
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
              {visibleColumns.route && <th className="p-4">Luồng tuyến</th>}
              {visibleColumns.direction && <th className="p-4">Bến đi → bến đến</th>}
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
                  Đang tải dữ liệu hành trình...
                </td>
              </tr>
            ) : paginatedJourneys.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  {apiError ? 'Không tải được dữ liệu hành trình.' : 'Chưa có hành trình nào.'}
                </td>
              </tr>
            ) : (
              paginatedJourneys.map((journey) => (
                <tr key={journey.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  {visibleColumns.route && (
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white">{journey.routeName || 'Chưa cập nhật'}</div>
                      <div className="mt-1 font-mono text-xs text-blue-600 dark:text-blue-400">{journey.routeCode || 'Chưa cập nhật'}</div>
                    </td>
                  )}
                  {visibleColumns.direction && (
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                        <span>{journey.fromName || 'Chưa cập nhật'}</span>
                        <ArrowRight size={14} className="text-blue-600 shrink-0" />
                        <span>{journey.toName || 'Chưa cập nhật'}</span>
                      </div>
                    </td>
                  )}
                  {visibleColumns.status && (
                    <td className="p-4">
                      {journey.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={12} /> Đang khai thác
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle size={12} /> Tạm ngưng
                        </span>
                      )}
                    </td>
                  )}
                  {visibleColumns.updated_at && <td className="p-4 text-xs text-slate-500">{formatDateTime(journey.updated_at)}</td>}
                  {visibleColumns.actions && (
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          to={'/journeys/$journeyId/edit' as any}
                          params={{ journeyId: journey.id } as any}
                          className="p-1.5 inline-flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 cursor-pointer"
                          title="Chỉnh sửa hành trình"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeactivateTarget(journey)}
                          disabled={journey.status === 'inactive'}
                          className="p-1.5 inline-flex items-center justify-center rounded-md hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-600 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          title={journey.status === 'inactive' ? 'Hành trình đã tạm ngưng' : 'Tạm ngưng hành trình'}
                        >
                          <Ban size={16} />
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
        totalItems={filteredJourneys.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      <ConfirmModal
        open={Boolean(deactivateTarget)}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
        title="Tạm ngưng hành trình?"
        description={
          <span>
            Hành trình <strong>{deactivateTarget?.fromName || 'Chưa cập nhật'} → {deactivateTarget?.toName || 'Chưa cập nhật'}</strong> sẽ chuyển sang trạng thái tạm ngưng theo contract backend hiện có.
          </span>
        }
        confirmLabel="Tạm ngưng"
        cancelLabel="Hủy bỏ"
        loading={deactivating}
        onConfirm={executeDeactivate}
      />
    </div>
  );
}
