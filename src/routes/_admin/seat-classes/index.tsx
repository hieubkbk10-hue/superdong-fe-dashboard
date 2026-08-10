import React, { useState, useEffect } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Layers, Plus, Edit, Trash2, Search, CheckCircle2, XCircle, Tag, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { getSeatClasses } from '@/apis/boats';
import { SeatClass } from '@/types';

export const Route = createFileRoute('/_admin/seat-classes/')({
  component: SeatClassesPage,
});

export interface SeatClassItem {
  id: string;
  code: string;
  name: string;
  priceMultiplier: number;
  fixedSurcharge: number;
  amenities: string[];
  status: 'active' | 'inactive';
}

function SeatClassesPage() {
  const [seatClasses, setSeatClasses] = useState<SeatClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchSeatClasses = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await getSeatClasses();
      if (res && res.data && Array.isArray(res.data)) {
        const mapped: SeatClassItem[] = res.data.map((sc: SeatClass) => ({
          id: String(sc.id),
          code: sc.code || '',
          name: sc.name || '',
          priceMultiplier: sc.base_price_multiplier ?? 1.0,
          fixedSurcharge: 0,
          amenities: sc.description ? sc.description.split(',').map((s) => s.trim()) : ['Ghế tiêu chuẩn'],
          status: sc.is_active ?? true ? 'active' : 'inactive',
        }));
        setSeatClasses(mapped);
      } else {
        setSeatClasses([]);
      }
    } catch (err: any) {
      console.error('Fetch seat classes error:', err);
      setSeatClasses([]);
      setApiError(err?.response?.data?.message || err?.message || 'Không thể kết nối với Backend API');
      toast.error('Không thể lấy dữ liệu hạng ghế từ Backend API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeatClasses();
  }, []);

  const filteredSeatClasses = seatClasses.filter((sc) => {
    const matchesSearch =
      sc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sc.amenities.some((a) => a.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || sc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4 font-sans">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="h-6 w-6 text-blue-600" />
              Hạng Ghế Tàu Live
            </h1>
            {!apiError && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 size={13} /> Live API Backend
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý phân loại hạng ghế kết nối từ Server Backend API Superdong
          </p>
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
            <Plus size={16} /> Thêm hạng ghế mới
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

      {/* Filter and Search Bar */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên hạng, mã (STANDARD, VIP...)..."
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
            <option value="inactive">Tạm ngưng</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="p-4">Mã Hạng</th>
              <th className="p-4">Tên Hạng Ghế</th>
              <th className="p-4">Hệ Số Nhân Giá</th>
              <th className="p-4">Phụ Thu Cố Định</th>
              <th className="p-4">Tiện Ích Đi Kèm</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" />
                  Đang tải dữ liệu hạng ghế từ Backend API...
                </td>
              </tr>
            ) : filteredSeatClasses.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">
                  {apiError ? '⚠️ Không thể lấy dữ liệu từ Backend API.' : 'Không có hạng ghế nào.'}
                </td>
              </tr>
            ) : (
              filteredSeatClasses.map((sc) => (
                <tr key={sc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-mono font-bold text-xs">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400">
                      {sc.code}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Tag size={15} className="text-blue-600 shrink-0" />
                    {sc.name}
                  </td>
                  <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">
                    {sc.priceMultiplier}x
                    {sc.priceMultiplier === 1.0 && <span className="text-xs text-slate-400 font-normal ml-1">(Gốc)</span>}
                  </td>
                  <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                    {sc.fixedSurcharge > 0 ? `+${sc.fixedSurcharge.toLocaleString('vi-VN')} VNĐ` : '0 VNĐ'}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {sc.amenities.map((item, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          <Sparkles size={10} className="text-amber-500" />
                          {item}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    {sc.status === 'active' ? (
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
                      to={'/seat-classes/$classId/edit' as any}
                      params={{ classId: sc.id } as any}
                      className="p-1.5 inline-flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 cursor-pointer"
                      title="Chỉnh sửa hạng ghế"
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
