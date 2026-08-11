import React, { useState, useEffect } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Ship, Plus, Edit, Trash2, Search, CheckCircle2, XCircle, Anchor, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { getBoats, deleteBoat } from '@/apis/boats';
import { Boat } from '@/types';

export const Route = createFileRoute('/_admin/boats/')({
  component: BoatsPage,
});

export interface BoatItem {
  id: string;
  code: string;
  name: string;
  capacity: number;
  speed: string;
  is_express: boolean;
  status: 'active' | 'maintenance' | 'inactive';
}

function BoatsPage() {
  const [boats, setBoats] = useState<BoatItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchBoats = async () => {
    try {
      setIsLoading(true);
      setApiError(null);
      const res = await getBoats();
      if (res && res.data && Array.isArray(res.data)) {
        const mapped: BoatItem[] = res.data.map((b: Boat) => ({
          id: String(b.id),
          code: b.code || '',
          name: b.name || '',
          capacity: b.capacity || 0,
          speed: typeof b.speed === 'number' ? `${b.speed} hải lý/giờ` : (b.speed || ''),
          is_express: b.is_express ?? true,
          status: (b.status as any) || 'active',
        }));
        setBoats(mapped);
      } else {
        setBoats([]);
      }
    } catch (err: any) {
      console.error('Fetch boats error:', err);
      setBoats([]);
      setApiError(err?.response?.data?.message || err?.message || 'Không thể kết nối với Backend API');
      toast.error('Không thể lấy dữ liệu đội tàu từ Backend API');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBoats();
  }, []);

  const filteredBoats = boats.filter(
    (b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Bạn có chắc muốn xóa/ngừng hoạt động tàu ${name}?`)) {
      try {
        await deleteBoat(id);
        toast.success(`Đã xóa tàu ${name} thành công`);
        fetchBoats();
      } catch (err: any) {
        toast.error(`Lỗi xóa tàu: ${err?.message || 'Không thể thực hiện'}`);
      }
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Title & Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Ship className="h-6 w-6 text-blue-600" />
              Quản lý Đội tàu Superdong
            </h1>
            {!apiError && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 size={13} /> Live API Backend
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">Danh sách tàu cao tốc vận tải hành khách trên các tuyến biển</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchBoats}
            disabled={isLoading}
            className="h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Làm mới
          </button>
          <Link
            to={'/boats/create' as any}
            className="h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Plus size={16} /> Thêm Tàu Mới
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

      {/* Search Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo Mã tàu hoặc Tên tàu..."
            className="w-full h-10 pl-9 pr-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500 font-mono"
          />
        </div>
      </div>

      {/* Boats Data Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">Mã Tàu</th>
                <th className="p-4">Tên Tàu</th>
                <th className="p-4">Sức Chứa (Ghế)</th>
                <th className="p-4">Tốc Độ Vận Hành</th>
                <th className="p-4">Loại Tàu</th>
                <th className="p-4">Trạng Thái</th>
                <th className="p-4 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" />
                    Đang tải danh sách đội tàu từ Backend API...
                  </td>
                </tr>
              ) : filteredBoats.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    {apiError ? '⚠️ Không thể lấy dữ liệu từ Backend API.' : 'Chưa có thông tin tàu.'}
                  </td>
                </tr>
              ) : (
                filteredBoats.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-blue-600">{b.code}</td>
                    <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Anchor size={16} className="text-slate-400" /> {b.name}
                    </td>
                    <td className="p-4 font-medium text-slate-700 dark:text-slate-300">
                      {b.capacity > 0 ? `${b.capacity} hành khách` : <span className="text-slate-400">Chưa cập nhật</span>}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 font-mono text-xs">
                      {b.speed || <span className="font-sans text-slate-400">Chưa cập nhật</span>}
                    </td>
                    <td className="p-4">
                      {b.is_express ? (
                        <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                          Tàu Cao Tốc
                        </span>
                      ) : (
                        <span className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                          Tàu Phà Thường
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {b.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 size={12} /> Đang hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                          <XCircle size={12} /> Đang bảo trì
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-1">
                      <Link
                        to={'/boats/$boatId/edit' as any}
                        params={{ boatId: b.id } as any}
                        className="p-1.5 inline-flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 cursor-pointer"
                        title="Chỉnh sửa thông tin tàu"
                      >
                        <Edit size={16} />
                      </Link>
                      <button
                        onClick={() => handleDelete(b.id, b.name)}
                        className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-500 hover:text-rose-600 cursor-pointer"
                        title="Xóa tàu"
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
    </div>
  );
}
