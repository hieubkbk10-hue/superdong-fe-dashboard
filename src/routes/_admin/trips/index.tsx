import React, { useState, useEffect } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Ship, Plus, Edit, Trash2, Search, CheckCircle2, XCircle, CheckCheck, Clock, Users, ArrowRight, Anchor } from 'lucide-react';
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

export const INITIAL_TRIPS: TripItem[] = [
  {
    id: 'trip-1',
    code: 'TRIP-8821',
    journey: 'Rạch Giá ➔ Phú Quốc',
    boatName: 'Superdong IX (SD-09)',
    departureTime: '07:30 AM',
    departureDate: '2026-08-10',
    soldSeats: 298,
    totalCapacity: 306,
    status: 'open',
  },
  {
    id: 'trip-2',
    code: 'TRIP-8822',
    journey: 'Hà Tiên ➔ Phú Quốc',
    boatName: 'Superdong XII (SD-12)',
    departureTime: '08:00 AM',
    departureDate: '2026-08-10',
    soldSeats: 270,
    totalCapacity: 275,
    status: 'departed',
  },
  {
    id: 'trip-3',
    code: 'TRIP-8823',
    journey: 'Trần Đề ➔ Côn Đảo',
    boatName: 'Superdong Côn Đảo I (SD-CD01)',
    departureTime: '08:00 AM',
    departureDate: '2026-08-10',
    soldSeats: 306,
    totalCapacity: 306,
    status: 'departed',
  },
  {
    id: 'trip-4',
    code: 'TRIP-8824',
    journey: 'Phan Thiết ➔ Phú Quý',
    boatName: 'Superdong I (SD-01)',
    departureTime: '07:30 AM',
    departureDate: '2026-08-10',
    soldSeats: 215,
    totalCapacity: 275,
    status: 'completed',
  },
  {
    id: 'trip-5',
    code: 'TRIP-8825',
    journey: 'Rạch Giá ➔ Phú Quốc',
    boatName: 'Superdong VI (SD-06)',
    departureTime: '13:00 PM',
    departureDate: '2026-08-10',
    soldSeats: 180,
    totalCapacity: 306,
    status: 'open',
  },
  {
    id: 'trip-6',
    code: 'TRIP-8826',
    journey: 'Rạch Giá ➔ Nam Du',
    boatName: 'Superdong II (SD-02)',
    departureTime: '07:30 AM',
    departureDate: '2026-08-11',
    soldSeats: 0,
    totalCapacity: 275,
    status: 'cancelled',
  },
];

function TripsPage() {
  const [trips, setTrips] = useState<TripItem[]>(INITIAL_TRIPS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    let isMounted = true;
    const fetchTrips = async () => {
      try {
        const res = await getTrips();
        if (isMounted && res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          const mapped: TripItem[] = res.data.map((t: Trip) => ({
            id: String(t.id),
            code: `TRIP-${t.id}`,
            journey: t.route?.origin_location?.name ? `${t.route.origin_location.name} ➔ ${t.route.destination_location?.name}` : 'Rạch Giá ➔ Phú Quốc',
            boatName: t.boat?.name ? `${t.boat.name} (${t.boat.code})` : 'Superdong IX (SD-09)',
            departureTime: t.departure_time || '07:30 AM',
            departureDate: t.created_at ? t.created_at.substring(0, 10) : '2026-08-10',
            soldSeats: (t.total_seats || 306) - (t.available_seats || 10),
            totalCapacity: t.total_seats || 306,
            status: t.status || 'open',
          }));
          setTrips(mapped);
          toast.success('Đã tải danh sách chuyến tàu từ Backend API');
        }
      } catch (err) {
        // Fallback state
      }
    };
    fetchTrips();
    return () => { isMounted = false; };
  }, []);

  const filteredTrips = trips.filter((t) => {
    const matchesSearch =
      t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.journey.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.boatName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.departureDate.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDepart = (id: string, code: string) => {
    setTrips((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'departed' } : t))
    );
    toast.success(`Đã cập nhật chuyến ${code} cho xuất bến!`);
  };

  const handleComplete = (id: string, code: string) => {
    setTrips((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'completed' } : t))
    );
    toast.success(`Đã hoàn tất chuyến tàu ${code}!`);
  };

  const handleDelete = (id: string, code: string) => {
    if (confirm(`Bạn có chắc muốn hủy/xóa chuyến tàu ${code}?`)) {
      setTrips((prev) => prev.filter((t) => t.id !== id));
      toast.success(`Đã xóa chuyến tàu ${code}`);
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Ship className="h-6 w-6 text-blue-600" />
            Danh sách Chuyến Tàu Thực Tế (Live Trips)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý các chuyến tàu đang mở bán vé, điều hành xuất bến và hoàn tất lịch trình trong ngày
          </p>
        </div>
        <Link
          to={"/trips/create" as any}
          className="h-10 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus size={16} /> Mở chuyến tàu mới
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã chuyến (TRIP-8821), tuyến, tên tàu..."
            className="w-full h-10 pl-9 pr-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="open">Đang mở bán vé</option>
            <option value="departed">Đã xuất bến</option>
            <option value="completed">Đã hoàn tất</option>
            <option value="cancelled">Đã hủy chuyến</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="p-4">Mã Chuyến</th>
              <th className="p-4">Tuyến &amp; Tàu Khai Thác</th>
              <th className="p-4">Thời Gian Khởi Hành</th>
              <th className="p-4">Số Ghế Đã Bán / Sức Chứa</th>
              <th className="p-4">Trạng Thái Bán Vé</th>
              <th className="p-4 text-right">Thao Tác Vận Hành</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTrips.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  Không tìm thấy chuyến tàu nào phù hợp
                </td>
              </tr>
            ) : (
              filteredTrips.map((trip) => {
                const fillPercentage = Math.round((trip.soldSeats / trip.totalCapacity) * 100);

                return (
                  <tr key={trip.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400">
                        {trip.code}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{trip.journey}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Anchor size={12} className="text-slate-400" />
                        {trip.boatName}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <Clock size={14} />
                        {trip.departureTime}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">{trip.departureDate}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Users size={14} className="text-slate-400" />
                        {trip.soldSeats} / {trip.totalCapacity} ghế
                        <span className="text-xs font-medium text-slate-500">({fillPercentage}%)</span>
                      </div>
                      <div className="w-32 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${
                            fillPercentage >= 90 ? 'bg-emerald-500' : fillPercentage >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${fillPercentage}%` }}
                        />
                      </div>
                    </td>
                    <td className="p-4">
                      {trip.status === 'open' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500 text-white">
                          <CheckCircle2 size={12} /> Đang mở bán
                        </span>
                      )}
                      {trip.status === 'departed' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-600 text-white">
                          <Ship size={12} /> Đã xuất bến
                        </span>
                      )}
                      {trip.status === 'completed' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500 text-white">
                          <CheckCheck size={12} /> đã hoàn tất
                        </span>
                      )}
                      {trip.status === 'cancelled' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500 text-white">
                          <XCircle size={12} /> Đã hủy chuyến
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-1.5">
                      {trip.status === 'open' && (
                        <button
                          onClick={() => handleDepart(trip.id, trip.code)}
                          className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-2xs"
                        >
                          Cho xuất bến
                        </button>
                      )}
                      {trip.status === 'departed' && (
                        <button
                          onClick={() => handleComplete(trip.id, trip.code)}
                          className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-2xs"
                        >
                          Hoàn tất
                        </button>
                      )}

                      <Link
                        to={"/trips/$tripId/edit" as any}
                        params={{ tripId: trip.id } as any}
                        className="p-1.5 inline-flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 cursor-pointer"
                        title="Chỉnh sửa chuyến"
                      >
                        <Edit size={16} />
                      </Link>
                      <button
                        onClick={() => handleDelete(trip.id, trip.code)}
                        className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-500 hover:text-rose-600 cursor-pointer"
                        title="Hủy chuyến"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
