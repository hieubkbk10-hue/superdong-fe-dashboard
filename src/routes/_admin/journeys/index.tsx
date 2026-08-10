import React, { useState, useEffect } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Route as RouteIcon, Plus, Edit, Trash2, Search, CheckCircle2, XCircle, ArrowRight, Clock, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { getJourneys } from '@/apis/journeys';
import { Journey } from '@/types';

export const Route = createFileRoute('/_admin/journeys/')({
  component: JourneysPage,
});

export interface JourneyItem {
  id: string;
  code: string;
  name: string;
  origin: string;
  destination: string;
  distance: string;
  duration: string;
  status: 'active' | 'inactive';
}

export const INITIAL_JOURNEYS: JourneyItem[] = [
  {
    id: 'j-1',
    code: 'J-RGPQ',
    name: 'Rạch Giá ↔ Phú Quốc',
    origin: 'Bến tàu Rạch Giá (RG)',
    destination: 'Bến tàu Phú Quốc (PQ)',
    distance: '65 hải lý',
    duration: '2 tiếng 30 phút',
    status: 'active',
  },
  {
    id: 'j-2',
    code: 'J-HTPQ',
    name: 'Hà Tiên ↔ Phú Quốc',
    origin: 'Bến tàu Hà Tiên (HT)',
    destination: 'Bến tàu Phú Quốc (PQ)',
    distance: '24 hải lý',
    duration: '1 tiếng 15 phút',
    status: 'active',
  },
  {
    id: 'j-3',
    code: 'J-TDCD',
    name: 'Trần Đề ↔ Côn Đảo',
    origin: 'Bến tàu Trần Đề (TD)',
    destination: 'Bến tàu Côn Đảo (CD)',
    distance: '45 hải lý',
    duration: '2 tiếng 15 phút',
    status: 'active',
  },
  {
    id: 'j-4',
    code: 'J-PTPQY',
    name: 'Phan Thiết ↔ Phú Quý',
    origin: 'Bến tàu Phan Thiết (PT)',
    destination: 'Bến tàu Phú Quý (PQY)',
    distance: '56 hải lý',
    duration: '2 tiếng 30 phút',
    status: 'active',
  },
  {
    id: 'j-5',
    code: 'J-RGNT',
    name: 'Rạch Giá ↔ Nam Du',
    origin: 'Bến tàu Rạch Giá (RG)',
    destination: 'Bến tàu Nam Du (ND)',
    distance: '48 hải lý',
    duration: '2 tiếng',
    status: 'active',
  },
];

function JourneysPage() {
  const [journeys, setJourneys] = useState<JourneyItem[]>(INITIAL_JOURNEYS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    let isMounted = true;
    const fetchJourneys = async () => {
      try {
        const res = await getJourneys();
        if (isMounted && res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          const mapped: JourneyItem[] = res.data.map((j: Journey) => ({
            id: String(j.id),
            code: j.code || '',
            name: j.name || '',
            origin: j.origin_location?.name || 'Bến tàu Rạch Giá (RG)',
            destination: j.destination_location?.name || 'Bến tàu Phú Quốc (PQ)',
            distance: `${j.distance_km || 65} hải lý`,
            duration: `${j.estimated_duration_minutes ? Math.floor(j.estimated_duration_minutes / 60) + ' tiếng ' + (j.estimated_duration_minutes % 60) + ' phút' : '2 tiếng 30 phút'}`,
            status: j.is_active ? 'active' : 'inactive',
          }));
          setJourneys(mapped);
          toast.success('Đã tải danh sách tuyến hải trình từ Backend API');
        }
      } catch (err) {
        // Fallback state
      }
    };
    fetchJourneys();
    return () => { isMounted = false; };
  }, []);

  const filteredJourneys = journeys.filter((j) => {
    const matchesSearch =
      j.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.destination.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || j.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Bạn có chắc muốn xóa tuyến hải trình ${name}?`)) {
      setJourneys((prev) => prev.filter((item) => item.id !== id));
      toast.success(`Đã xóa tuyến hải trình ${name}`);
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <RouteIcon className="h-6 w-6 text-blue-600" />
            Tuyến Hải Trình
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Cấu hình các luồng hải trình kết nối giữa 2 cảng bến, khoảng cách hải lý và thời gian di chuyển chuẩn
          </p>
        </div>
        <Link
          to={"/journeys/create" as any}
          className="h-10 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus size={16} /> Thêm tuyến hải trình
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
            placeholder="Tìm theo tên tuyến, mã tuyến (J-RGPQ...)..."
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
            <option value="active">Đang khai thác</option>
            <option value="inactive">Tạm ngưng khai thác</option>
          </select>
        </div>
      </div>

      {/* Journeys Data Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="p-4">Mã tuyến</th>
              <th className="p-4">Tên Tuyến Đường Biển</th>
              <th className="p-4">Bến Xuất Phát ➔ Bến Đích</th>
              <th className="p-4">Khoảng cách</th>
              <th className="p-4">Thời gian chạy</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredJourneys.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Không tìm thấy tuyến hải trình nào phù hợp
                </td>
              </tr>
            ) : (
              filteredJourneys.map((j) => (
                <tr key={j.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700">
                      {j.code}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-slate-900 dark:text-white">{j.name}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                      <span>{j.origin}</span>
                      <ArrowRight size={14} className="text-blue-600 shrink-0" />
                      <span>{j.destination}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">
                    <div className="flex items-center gap-1">
                      <Navigation size={13} className="text-slate-400" />
                      {j.distance}
                    </div>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">
                    <div className="flex items-center gap-1">
                      <Clock size={13} className="text-blue-500" />
                      {j.duration}
                    </div>
                  </td>
                  <td className="p-4">
                    {j.status === 'active' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500 text-white">
                        <CheckCircle2 size={12} /> Đang khai thác
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-400 text-white">
                        <XCircle size={12} /> Tạm ngưng
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-1">
                    <Link
                      to={"/journeys/$journeyId/edit" as any}
                      params={{ journeyId: j.id } as any}
                      className="p-1.5 inline-flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 cursor-pointer"
                      title="Chỉnh sửa tuyến"
                    >
                      <Edit size={16} />
                    </Link>
                    <button
                      onClick={() => handleDelete(j.id, j.name)}
                      className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-500 hover:text-rose-600 cursor-pointer"
                      title="Xóa tuyến"
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
