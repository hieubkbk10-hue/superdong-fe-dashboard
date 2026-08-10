import React, { useState, useEffect } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Ship, Plus, Edit, Trash2, Search, CheckCircle2, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { getTrips } from '@/apis/trips';
import { Trip } from '@/types';

export const Route = createFileRoute('/_admin/trips/')({
  component: TripsPage,
});

export interface TripItem {
  id: string;
  code: string;
  journey: string;
  boatName: string;
  departureTime: string;
  departureDate: string;
  soldSeats: number;
  totalCapacity: number;
  status: 'open' | 'departed' | 'completed' | 'cancelled' | 'closed';
}

function TripsPage() {
  const [trips, setTrips] = useState<TripItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchTrips = async () => {
    try {
      setIsLoading(true);
      setApiError(null);
      const res = await getTrips();
      if (res && res.data && Array.isArray(res.data)) {
        const mapped: TripItem[] = res.data.map((t: Trip) => ({
          id: String(t.id),
          code: `TRIP-${t.id}`,
          journey: t.route?.origin_location?.name ? `${t.route.origin_location.name} ➔ ${t.route.destination_location?.name}` : 'Tuyến hải trình',
          boatName: t.boat?.name ? `${t.boat.name} (${t.boat.code})` : 'Tàu Superdong',
          departureTime: t.departure_time || '07:30 AM',
          departureDate: t.created_at ? t.created_at.substring(0, 10) : '',
          soldSeats: (t.total_seats || 306) - (t.available_seats || 0),
          totalCapacity: t.total_seats || 306,
          status: t.status || 'open',
        }));
        setTrips(mapped);
      } else {
        setTrips([]);
      }
    } catch (err: any) {
      console.error('Fetch trips error:', err);
      setTrips([]);
      setApiError(err?.response?.data?.message || err?.message || 'Không thể kết nối với Backend API');
      toast.error('Không thể lấy dữ liệu chuyến tàu từ Backend API');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const filteredTrips = trips.filter((t) => {
    const matchesSearch =
      t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.journey.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.boatName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Title Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Ship className="h-6 w-6 text-blue-600" />
              Quản lý Chuyến Tàu Thực Tế Live
            </h1>
            {!apiError && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 size={13} /> Live API Backend
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">Danh sách các chuyến xuất bến trong ngày, tình trạng vé và điều hành chuyến</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTrips}
            disabled={isLoading}
            className="h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Làm mới
          </button>
          <Link
            to={'/trips/create' as any}
            className="h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Plus size={16} /> Mở Chuyến Mới
          </Link>
        </div>
      </div>

      {/* API Error Warning Alert */}
      {apiError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-2.5">
          <AlertTriangle size={18} className="shrink-0 text-rose-500" />
          <span>⚠️ Không thể lấy dữ liệu từ Backend API: {apiError}. Vui lòng kiểm tra lại Server Backend!</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex flex-col md:flex-row gap-3 justify-between">
        <div className="relative max-w-md w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo Mã chuyến (TRIP-...), Tuyến hoặc Tàu..."
            className="w-full h-10 pl-9 pr-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500 font-mono"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 outline-none cursor-pointer"
        >
          <option value="all">Tất cả trạng thái chuyến</option>
          <option value="open">Đang mở bán vé</option>
          <option value="departed">Đã xuất bến</option>
          <option value="completed">Hoàn tất chuyến</option>
          <option value="cancelled">Đã hủy chuyến</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">Mã Chuyến</th>
                <th className="p-4">Tuyến Hải Trình</th>
                <th className="p-4">Tàu Đảm Nhận</th>
                <th className="p-4">Giờ Xuất Bến</th>
                <th className="p-4">Vé Đã Bán / Sức Chứa</th>
                <th className="p-4">Trạng Thái</th>
                <th className="p-4 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" />
                    Đang tải danh sách chuyến tàu từ Backend API...
                  </td>
                </tr>
              ) : filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    {apiError ? '⚠️ Không thể lấy dữ liệu từ Backend API.' : 'Chưa có chuyến tàu nào.'}
                  </td>
                </tr>
              ) : (
                filteredTrips.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-blue-600">{t.code}</td>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">{t.journey}</td>
                    <td className="p-4 text-slate-700 dark:text-slate-300">{t.boatName}</td>
                    <td className="p-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {t.departureTime} ({t.departureDate})
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {t.soldSeats} / {t.totalCapacity}
                      </span>
                    </td>
                    <td className="p-4">
                      {t.status === 'open' && (
                        <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                          Đang mở bán
                        </span>
                      )}
                      {t.status === 'departed' && (
                        <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                          Đã xuất bến
                        </span>
                      )}
                      {t.status === 'completed' && (
                        <span className="bg-slate-500/10 text-slate-600 border border-slate-500/20 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                          Hoàn tất
                        </span>
                      )}
                      {t.status === 'cancelled' && (
                        <span className="bg-rose-500/10 text-rose-600 border border-rose-500/20 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                          Đã hủy
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-1">
                      <Link
                        to={'/trips/$tripId/edit' as any}
                        params={{ tripId: t.id } as any}
                        className="p-1.5 inline-flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 cursor-pointer"
                        title="Chỉnh sửa chuyến"
                      >
                        <Edit size={16} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
