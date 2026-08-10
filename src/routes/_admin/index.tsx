import React, { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { DollarSign, Ticket, Ship, Users, RefreshCw, AlertTriangle, CheckCircle2, TrendingUp, Anchor } from 'lucide-react';
import { toast } from 'sonner';
import { getTrips, getBookings, getBoats } from '@/apis';

export const Route = createFileRoute('/_admin/')({
  component: DashboardOverview,
});

function DashboardOverview() {
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [revenue, setRevenue] = useState<number>(0);
  const [totalBookings, setTotalBookings] = useState<number>(0);
  const [activeTripsCount, setActiveTripsCount] = useState<number>(0);
  const [totalPassengers, setTotalPassengers] = useState<number>(0);
  const [recentTrips, setRecentTrips] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const [tripsRes, bookingsRes, boatsRes] = await Promise.all([
        getTrips().catch((e) => null),
        getBookings().catch((e) => null),
        getBoats().catch((e) => null),
      ]);

      let hasSuccess = false;

      if (tripsRes && tripsRes.data && Array.isArray(tripsRes.data)) {
        hasSuccess = true;
        setActiveTripsCount(tripsRes.data.length);
        setRecentTrips(tripsRes.data.slice(0, 5));
      } else {
        setRecentTrips([]);
        setActiveTripsCount(0);
      }

      if (bookingsRes && bookingsRes.data && Array.isArray(bookingsRes.data)) {
        hasSuccess = true;
        setTotalBookings(bookingsRes.data.length);
        let calculatedRev = 0;
        let paxCount = 0;
        bookingsRes.data.forEach((b: any) => {
          calculatedRev += Number(b.final_amount || b.total_amount || 0);
          paxCount += b.travelers ? b.travelers.length : 1;
        });
        setRevenue(calculatedRev);
        setTotalPassengers(paxCount);
      } else {
        setTotalBookings(0);
        setRevenue(0);
        setTotalPassengers(0);
      }

      if (!hasSuccess) {
        setApiError('Không thể lấy dữ liệu từ Backend API (https://superdong-be.vitrasau.info.vn/v1)');
        toast.error('Không thể lấy dữ liệu Tổng quan từ Backend API');
      }
    } catch (err: any) {
      console.error('Fetch dashboard error:', err);
      setApiError(err?.message || 'Không thể kết nối API');
      toast.error('Không thể lấy dữ liệu từ Backend API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatVND = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Tổng Quan Vận Hành Superdong
            </h1>
            {!apiError && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 size={13} /> Live API Backend
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">Báo cáo doanh thu, vé xuất bến và hoạt động các tuyến tàu</p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="h-10 px-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Làm mới dữ liệu
        </button>
      </div>

      {/* API Error Alert */}
      {apiError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-2.5">
          <AlertTriangle size={18} className="shrink-0 text-rose-500" />
          <span>⚠️ Không thể lấy dữ liệu từ Backend API: {apiError}. Vui lòng kiểm tra lại Server Backend!</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng Doanh Thu</span>
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
              {loading ? '...' : formatVND(revenue)}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng Đơn Vé</span>
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Ticket size={20} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
              {loading ? '...' : `${totalBookings} đơn`}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Chuyến Hoạt Động</span>
            <div className="h-9 w-9 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Ship size={20} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
              {loading ? '...' : `${activeTripsCount} chuyến`}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hành Khách</span>
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
              {loading ? '...' : `${totalPassengers} người`}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Trips Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Anchor size={18} className="text-blue-600" /> Chuyến Tàu Gần Đây từ Backend API
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Mã Chuyến</th>
                <th className="p-3">Tuyến Hải Trình</th>
                <th className="p-3">Giờ Xuất Bến</th>
                <th className="p-3">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-500">Đang tải...</td>
                </tr>
              ) : recentTrips.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-500">
                    {apiError ? '⚠️ Không thể lấy dữ liệu từ Backend API.' : 'Không có chuyến nào.'}
                  </td>
                </tr>
              ) : (
                recentTrips.map((t: any) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-blue-600">TRIP-{t.id}</td>
                    <td className="p-3 font-medium">
                      {t.route?.origin_location?.name ? `${t.route.origin_location.name} ➔ ${t.route.destination_location?.name}` : 'Tuyến hải trình'}
                    </td>
                    <td className="p-3 font-mono text-xs text-slate-500">{t.departure_time || '07:30 AM'}</td>
                    <td className="p-3">
                      <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs px-2 py-0.5 rounded-full font-semibold">
                        {t.status || 'Mở bán'}
                      </span>
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
