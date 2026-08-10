import React, { useState, useEffect } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Calendar, Plus, Edit, Trash2, Search, CheckCircle2, XCircle, Clock, Ship, ArrowRight } from 'lucide-react';
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

export const INITIAL_SCHEDULES: ScheduleItem[] = [
  {
    id: 'sch-1',
    code: 'SCH-RG-01',
    journey: 'Rạch Giá ➔ Phú Quốc',
    departureTime: '07:30 sáng',
    boatName: 'Superdong IX (SD-09)',
    operatingDays: 'Tất cả các ngày trong tuần',
    status: 'active',
  },
  {
    id: 'sch-2',
    code: 'SCH-RG-02',
    journey: 'Rạch Giá ➔ Phú Quốc',
    departureTime: '08:10 sáng',
    boatName: 'Superdong VI (SD-06)',
    operatingDays: 'Tất cả các ngày trong tuần',
    status: 'active',
  },
  {
    id: 'sch-3',
    code: 'SCH-HT-01',
    journey: 'Hà Tiên ➔ Phú Quốc',
    departureTime: '08:00 sáng',
    boatName: 'Superdong XII (SD-12)',
    operatingDays: 'Thứ 2 - Chủ Nhật',
    status: 'active',
  },
  {
    id: 'sch-4',
    code: 'SCH-TD-01',
    journey: 'Trần Đề ➔ Côn Đảo',
    departureTime: '08:00 sáng',
    boatName: 'Superdong Côn Đảo I (SD-CD01)',
    operatingDays: 'Thứ 6, Thứ 7, Chủ Nhật',
    status: 'active',
  },
  {
    id: 'sch-5',
    code: 'SCH-PT-01',
    journey: 'Phan Thiết ➔ Phú Quý',
    departureTime: '07:30 sáng',
    boatName: 'Superdong I (SD-01)',
    operatingDays: 'Tất cả các ngày trong tuần',
    status: 'active',
  },
  {
    id: 'sch-6',
    code: 'SCH-RG-03',
    journey: 'Rạch Giá ➔ Nam Du',
    departureTime: '07:30 sáng',
    boatName: 'Superdong II (SD-02)',
    operatingDays: 'Thứ 2, Thứ 4, Thứ 6, Chủ Nhật',
    status: 'inactive',
  },
];

function SchedulesPage() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>(INITIAL_SCHEDULES);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    let isMounted = true;
    const fetchSchedules = async () => {
      try {
        const res = await getSchedules();
        if (isMounted && res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          const mapped: ScheduleItem[] = res.data.map((s: Schedule) => ({
            id: String(s.id),
            code: `SCH-${s.id}`,
            journey: s.journey?.name || (s.route?.origin_location?.name ? `${s.route.origin_location.name} ➔ ${s.route.destination_location?.name}` : 'Rạch Giá ➔ Phú Quốc'),
            departureTime: s.departure_time || '07:30 sáng',
            boatName: s.boat?.name ? `${s.boat.name} (${s.boat.code})` : 'Superdong IX (SD-09)',
            operatingDays: s.recurrence === 'daily' ? 'Tất cả các ngày trong tuần' : 'Thứ 2 - Chủ Nhật',
            status: s.is_active ? 'active' : 'inactive',
          }));
          setSchedules(mapped);
          toast.success('Đã tải lịch chạy định kỳ từ Backend API');
        }
      } catch (err) {
        // Fallback state
      }
    };
    fetchSchedules();
    return () => { isMounted = false; };
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

  const handleDelete = (id: string, code: string) => {
    if (confirm(`Bạn có chắc muốn xóa lịch chạy định kỳ ${code}?`)) {
      setSchedules((prev) => prev.filter((item) => item.id !== id));
      toast.success(`Đã xóa lịch chạy ${code}`);
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            Lịch chạy tàu định kỳ (Recurring Schedules)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Cấu hình khung giờ khởi hành mặc định hàng tuần và phân công tàu dự kiến cho từng tuyến hải trình
          </p>
        </div>
        <Link
          to={"/schedules/create" as any}
          className="h-10 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus size={16} /> Tạo lịch chạy mới
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tuyến, mã lịch (SCH-RG-01), tên tàu..."
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
            {filteredSchedules.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Không tìm thấy lịch chạy định kỳ nào phù hợp
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
                      to={"/schedules/$scheduleId/edit" as any}
                      params={{ scheduleId: sch.id } as any}
                      className="p-1.5 inline-flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 cursor-pointer"
                      title="Chỉnh sửa lịch"
                    >
                      <Edit size={16} />
                    </Link>
                    <button
                      onClick={() => handleDelete(sch.id, sch.code)}
                      className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-500 hover:text-rose-600 cursor-pointer"
                      title="Xóa lịch"
                    >
                      <Trash2 size={16} />
                    </button>
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
