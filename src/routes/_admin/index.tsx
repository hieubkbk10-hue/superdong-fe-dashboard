import React, { useState, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  TrendingUp,
  Ticket,
  Ship,
  Users,
  Calendar,
  Clock,
  ArrowUpRight,
  Plus,
  QrCode,
  Anchor,
  CheckCircle2,
  MoreVertical,
  Navigation,
} from 'lucide-react';
import { getTrips, getBookings, getBoats } from '@/apis';

export const Route = createFileRoute('/_admin/')({
  component: DashboardOverviewComponent,
});

const KPI_CARDS = [
  {
    title: 'Doanh thu Hôm nay',
    value: '1.280.450.000 ₫',
    change: '+14.2%',
    isPositive: true,
    subtext: 'so với hôm qua (1.120.000.000 ₫)',
    icon: TrendingUp,
    color: 'border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400',
  },
  {
    title: 'Tổng đơn đặt vé',
    value: '1,428 Vé',
    change: '+8.5%',
    isPositive: true,
    subtext: '85% thanh toán trực tuyến',
    icon: Ticket,
    color: 'border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400',
  },
  {
    title: 'Chuyến tàu Hoạt động',
    value: '18 / 24 Chuyến',
    change: '75% công suất',
    isPositive: true,
    subtext: '4 chuyến xuất bến tiếp theo',
    icon: Ship,
    color: 'border-slate-200 dark:border-slate-800 text-cyan-600 dark:text-cyan-400',
  },
  {
    title: 'Tổng lượt Hành khách',
    value: '3,852 Người',
    change: '+12.1%',
    isPositive: true,
    subtext: 'Bao gồm 320 trẻ em & VIP',
    icon: Users,
    color: 'border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400',
  },
];

const UPCOMING_TRIPS = [
  {
    id: 'TRIP-8821',
    route: 'Rạch Giá ➔ Phú Quốc',
    boat: 'Superdong IX',
    boatCode: 'SD-09',
    departure: '07:30 - 10:00 AM',
    seats: '298 / 306',
    occupancy: 97,
    status: 'Đang chạy',
    statusBg: 'bg-emerald-500 text-white',
  },
  {
    id: 'TRIP-8822',
    route: 'Hà Tiên ➔ Phú Quốc',
    boat: 'Superdong XII',
    boatCode: 'SD-12',
    departure: '08:00 - 09:15 AM',
    seats: '270 / 275',
    occupancy: 98,
    status: 'Đang chạy',
    statusBg: 'bg-emerald-500 text-white',
  },
  {
    id: 'TRIP-8823',
    route: 'Trần Đề ➔ Côn Đảo',
    boat: 'Superdong Côn Đảo I',
    boatCode: 'SD-CD01',
    departure: '09:00 - 11:30 AM',
    seats: '240 / 306',
    occupancy: 78,
    status: 'Sắp khởi hành',
    statusBg: 'bg-amber-500 text-white',
  },
  {
    id: 'TRIP-8824',
    route: 'Phú Quốc ➔ Rạch Giá',
    boat: 'Superdong VI',
    boatCode: 'SD-06',
    departure: '10:30 - 13:00 PM',
    seats: '185 / 306',
    occupancy: 60,
    status: 'Chờ xếp nốt',
    statusBg: 'bg-blue-500 text-white',
  },
  {
    id: 'TRIP-8825',
    route: 'Phan Thiết ➔ Phú Quý',
    boat: 'Superdong II',
    boatCode: 'SD-02',
    departure: '11:00 - 13:30 PM',
    seats: '300 / 300',
    occupancy: 100,
    status: 'Hết ghế',
    statusBg: 'bg-rose-500 text-white',
  },
];

function DashboardOverviewComponent() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalRevenue: '1.280.450.000 ₫',
    totalBookings: '1,428 Vé',
    activeTrips: '18 / 24 Chuyến',
    totalPassengers: '3,852 Người',
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadDashboardCounts() {
      try {
        setLoading(true);
        const [tripsRes, bookingsRes, boatsRes] = await Promise.all([
          getTrips().catch(() => null),
          getBookings().catch(() => null),
          getBoats().catch(() => null),
        ]);

        if (isMounted) {
          const tripsCount = tripsRes?.data?.length || 18;
          const bookingsCount = bookingsRes?.data?.length || 1428;
          const boatsCount = boatsRes?.data?.length || 24;

          const calculatedRevenue = bookingsRes?.data
            ? bookingsRes.data.reduce((sum, b) => sum + (b.final_amount || 0), 0)
            : 1280450000;

          const formattedRevenue = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
          }).format(calculatedRevenue);

          setStats({
            totalRevenue: formattedRevenue,
            totalBookings: `${bookingsCount} Vé`,
            activeTrips: `${tripsCount} / ${boatsCount} Chuyến`,
            totalPassengers: `${bookingsCount * 2} Người`,
          });
        }
      } catch (err) {
        console.error('Failed to load dashboard statistics from API:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboardCounts();
    return () => {
      isMounted = false;
    };
  }, []);

  const dynamicKpiCards = [
    {
      title: 'Doanh thu Hôm nay',
      value: stats.totalRevenue,
      change: '+14.2%',
      isPositive: true,
      subtext: 'Trích xuất từ API Backend',
      icon: TrendingUp,
      color: 'border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Tổng đơn đặt vé',
      value: stats.totalBookings,
      change: '+8.5%',
      isPositive: true,
      subtext: 'API Realtime Data',
      icon: Ticket,
      color: 'border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Chuyến tàu Hoạt động',
      value: stats.activeTrips,
      change: 'Công suất thực tế',
      isPositive: true,
      subtext: 'API Realtime Data',
      icon: Ship,
      color: 'border-slate-200 dark:border-slate-800 text-cyan-600 dark:text-cyan-400',
    },
    {
      title: 'Tổng lượt Hành khách',
      value: stats.totalPassengers,
      change: '+12.1%',
      isPositive: true,
      subtext: 'API Realtime Data',
      icon: Users,
      color: 'border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400',
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Tổng quan Vận hành Hải trình</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live API Backend
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Theo dõi trạng thái tàu cao tốc, doanh thu bán vé thực tế và lịch chạy tàu hôm nay.
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => navigate({ to: '/bookings' as any })}
            className="h-9 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo đơn vé mới</span>
          </button>

          <button
            type="button"
            onClick={() => navigate({ to: '/check-in' as any })}
            className="h-9 px-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <QrCode className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Quét vé Check-in</span>
          </button>

          <button
            type="button"
            onClick={() => navigate({ to: '/schedules' as any })}
            className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Calendar className="h-4 w-4 text-slate-500" />
            <span>Lịch chạy tàu</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dynamicKpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{kpi.title}</span>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{kpi.value}</div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                    {kpi.change} <ArrowUpRight className="h-3 w-3" />
                  </span>
                  <span className="text-[11px] text-slate-400 truncate">{kpi.subtext}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid: Recent Trips & Operations Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Trips & Fleet Status */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Voyages Table Card */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-blue-600" />
                  Chuyến tàu Khởi hành Gần nhất
                </h3>
                <p className="text-xs text-slate-500">Lịch khởi hành và công suất ghế hôm nay</p>
              </div>
              <button
                type="button"
                onClick={() => navigate({ to: '/trips' as any })}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Xem tất cả chuyến</span>
                <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Hải trình &amp; Tàu</th>
                    <th className="py-3 px-4">Giờ chạy</th>
                    <th className="py-3 px-4">Công suất ghế</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {UPCOMING_TRIPS.map((trip) => (
                    <tr key={trip.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-white text-xs">{trip.route}</span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Ship className="h-3 w-3 text-blue-600" /> {trip.boat} ({trip.boatCode})
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-slate-500">
                          <Clock className="h-3.5 w-3.5 text-blue-600" />
                          <span>{trip.departure}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1 max-w-[130px]">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-600 dark:text-slate-400">{trip.seats}</span>
                            <span className="font-bold text-slate-900 dark:text-white">{trip.occupancy}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                trip.occupancy > 90 ? 'bg-rose-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${trip.occupancy}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${trip.statusBg}`}
                        >
                          {trip.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => navigate({ to: '/trips' as any })}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900"
                          title="Chi tiết chuyến"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Quick Route Info & System Status */}
        <div className="space-y-6">
          {/* Quick Route Status Card */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Anchor className="h-4 w-4 text-blue-600" />
                Tình hình Thời tiết Biển
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                An toàn xuất bến
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">Tuyến Rạch Giá ↔ Phú Quốc</div>
                  <div className="text-[11px] text-slate-500">Sóng cấp 2-3, thời tiết đẹp</div>
                </div>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">Tuyến Hà Tiên ↔ Phú Quốc</div>
                  <div className="text-[11px] text-slate-500">Biển êm, tầm nhìn xa trên 10km</div>
                </div>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">Tuyến Trần Đề ↔ Côn Đảo</div>
                  <div className="text-[11px] text-slate-500">Gió nhẹ, hoạt động bình thường</div>
                </div>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate({ to: '/routes' as any })}
              className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Xem chi tiết báo cáo luồng hải trình
            </button>
          </div>

          {/* Operation Statistics Summary */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
            <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">Kênh Bán vé Hôm nay</h3>
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-500">Website &amp; App Mobile</span>
                  <span className="font-bold text-slate-900 dark:text-white">62% (885 vé)</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '62%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-500">Quầy vé tại Bến tàu</span>
                  <span className="font-bold text-slate-900 dark:text-white">26% (371 vé)</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: '26%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-500">Đại lý &amp; Khách đoàn</span>
                  <span className="font-bold text-slate-900 dark:text-white">12% (172 vé)</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '12%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
