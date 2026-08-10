import React, { useState, useEffect } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Calendar, Plus, Edit, Trash2, Search, CheckCircle2, XCircle, Clock, Ship, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { getSchedules } from '@/apis/trips';
import { Schedule } from '@/types';

export const Route = createFileRoute('/_admin/schedules/')({
  component: SchedulesPage,
});

export interface ScheduleItem {
  id: string;
  code: string;
  journey: string;
  departureTime: string;
  boatName: string;
  operatingDays: string;
  status: 'active' | 'inactive';
}

function SchedulesPage() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchSchedules = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await getSchedules();
      if (res && res.data && Array.isArray(res.data)) {
        const mapped: ScheduleItem[] = res.data.map((s: Schedule) => ({
          id: String(s.id),
          code: `SCH-${s.id}`,
          journey: s.journey?.name || (s.route?.origin_location?.name ? `${s.route.origin_location.name} ➔ ${s.route.destination_location?.name}` : 'Tuyến hải trình'),
          departureTime: s.departure_time || '07:30 sáng',
          boatName: s.boat?.name ? `${s.boat.name} (${s.boat.code})` : 'Tàu Superdong',
          operatingDays: s.recurrence === 'daily' ? 'Tất cả các ngày trong tuần' : 'Thứ 2 - Chủ Nhật',
          status: s.is_active ? 'active' : 'inactive',
        }));
        setSchedules(mapped);
      } else {
        setSchedules([]);
      }
    } catch (err: any) {
      console.error('Fetch schedules error:', err);
      setSchedules([]);
      setApiError(err?.response?.data?.message || err?.message || 'Không thể kết nối với Backend API');
      toast.error('Không thể lấy dữ liệu lịch chạy từ Backend API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const filteredSchedules = schedules.filter((sch) => {
    const matchesSearch =
      sch.journey.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sch.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sch.boatName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sch.departureTime.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || sch.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4 font-sans">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-blue-600" />
              Lịch Chạy Tàu Định Kỳ Live
            </h1>
            {!apiError && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 size={13} /> Live API Backend
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý khung giờ xuất bến định kỳ kết nối từ Server Backend API Superdong
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSchedules}
            disabled={loading}
            className="h-10 px-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>
          <Link
            to={'/schedules/create' as any}
            className="h-10 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus size={16} /> Tạo lịch chạy mới
          </Link>
        </div>
      </div>

      {/* API Error Alert */}
      {apiError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-2.5">
          <AlertTriangle size={18} className="shrink-0 text-rose-500" />
          <span>⚠️ Không thể lấy dữ liệu từ Backend API: {apiError}. Vui lòng kiểm tra lại Server Backend!</span>
        </div>
      )}

      {/* Search and Filter */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tuyến, mã lịch, tên tàu..."
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
            <option value="active">Đang áp dụng</option>
            <option value="inactive">Tạm ngưng áp dụng</option>
          </select>
        </div>
      </div>

      {/* Schedules Data Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="p-4">Mã Lịch</th>
              <th className="p-4">Tuyến Hải Trình</th>
              <th className="p-4">Giờ Xuất Bến</th>
              <th className="p-4">Tàu Phân Công Mặc Định</th>
              <th className="p-4">Tần Suất Khai Thác</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" />
                  Đang tải dữ liệu lịch chạy từ Backend API...
                </td>
              </tr>
            ) : filteredSchedules.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">
                  {apiError ? '⚠️ Không thể lấy dữ liệu từ Backend API.' : 'Không có lịch chạy định kỳ nào.'}
                </td>
              </tr>
            ) : (
              filteredSchedules.map((sch) => (
                <tr key={sch.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700">
                      {sch.code}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-slate-900 dark:text-white">{sch.journey}</td>
                  <td className="p-4 font-bold text-blue-600 dark:text-blue-400">
                    <div className="flex items-center gap-1.5">
                      <Clock size={15} />
                      {sch.departureTime}
                    </div>
                  </td>
                  <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Ship size={15} className="text-slate-400" />
                      {sch.boatName}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs px-2.5 py-1 rounded-md font-semibold inline-block">
                      {sch.operatingDays}
                    </span>
                  </td>
                  <td className="p-4">
                    {sch.status === 'active' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500 text-white">
                        <CheckCircle2 size={12} /> Đang áp dụng
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-400 text-white">
                        <XCircle size={12} /> Tạm ngưng
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-1">
                    <Link
                      to={'/schedules/$scheduleId/edit' as any}
                      params={{ scheduleId: sch.id } as any}
                      className="p-1.5 inline-flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 cursor-pointer"
                      title="Chỉnh sửa lịch"
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
  );
}
