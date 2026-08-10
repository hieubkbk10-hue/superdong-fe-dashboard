import React, { useState, useEffect } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Ship, Plus, Edit, Trash2, Search, CheckCircle2, XCircle, Anchor, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { getBoats, deleteBoat } from '@/apis/boats';
import { Boat } from '@/types';

export const Route = createFileRoute('/_admin/boats/')({
  component: BoatsPage,
});

interface BoatItem {
  id: string;
  code: string;
  name: string;
  capacity: number;
  speed: string;
  is_express: boolean;
  status: 'active' | 'maintenance' | 'inactive';
}

const INITIAL_BOATS: BoatItem[] = [
  { id: '1', code: 'SD-01', name: 'Superdong I', capacity: 275, speed: '28 hải lý/giờ', is_express: true, status: 'active' },
  { id: '2', code: 'SD-02', name: 'Superdong II', capacity: 275, speed: '28 hải lý/giờ', is_express: true, status: 'active' },
  { id: '3', code: 'SD-06', name: 'Superdong VI', capacity: 306, speed: '30 hải lý/giờ', is_express: true, status: 'active' },
  { id: '4', code: 'SD-09', name: 'Superdong IX', capacity: 306, speed: '30 hải lý/giờ', is_express: true, status: 'active' },
  { id: '5', code: 'SD-12', name: 'Superdong XII', capacity: 275, speed: '28 hải lý/giờ', is_express: true, status: 'maintenance' },
  { id: '6', code: 'SD-CD01', name: 'Superdong Côn Đảo I', capacity: 306, speed: '30 hải lý/giờ', is_express: true, status: 'active' },
  { id: '7', code: 'SD-CD02', name: 'Superdong Côn Đảo II', capacity: 306, speed: '30 hải lý/giờ', is_express: true, status: 'active' },
];

function BoatsPage() {
  const navigate = useNavigate();
  const [boats, setBoats] = useState<BoatItem[]>(INITIAL_BOATS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLiveApi, setIsLiveApi] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchBoats = async () => {
      try {
        setIsLoading(true);
        const res = await getBoats();
        if (isMounted && res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          const mapped: BoatItem[] = res.data.map((b: Boat) => ({
            id: String(b.id),
            code: b.code || '',
            name: b.name || '',
            capacity: b.capacity || 0,
            speed: typeof b.speed === 'number' ? `${b.speed} hải lý/giờ` : (b.speed || '28 hải lý/giờ'),
            is_express: b.is_express ?? true,
            status: b.status || 'active',
          }));
          setBoats(mapped);
          setIsLiveApi(true);
          toast.success('Đã tải dữ liệu từ Backend API');
        } else {
          setIsLiveApi(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setIsLiveApi(false);
          // Fall back to initial list if backend API returns 401 or network error
          toast.info('Sử dụng dữ liệu mẫu (Chưa kết nối Backend API hoặc 401)');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchBoats();
    return () => { isMounted = false; };
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
      } catch (err: any) {
        toast.info(`Đã cập nhật giao diện xóa tàu ${name}`);
      }
      setBoats((prev) => prev.filter((b) => b.id !== id));
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Title & Add Button linking to standalone /boats/create page */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Ship className="h-6 w-6 text-blue-600" />
              Quản lý Đội tàu Superdong
            </h1>
            {isLiveApi ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Wifi size={13} className="animate-pulse" /> Live API Backend
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <WifiOff size={13} /> Mock Fallback Mode
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">Danh sách tàu cao tốc vận tải hành khách trên các tuyến biển</p>
        </div>
        <Link
          to={"/boats/create" as any}
          className="h-10 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <Plus size={16} /> Thêm tàu mới
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên tàu hoặc mã tàu (VD: SD-09)..."
            className="w-full h-10 pl-9 pr-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none"
          />
        </div>
      </div>

      {/* Boats Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="p-4">Mã tàu</th>
              <th className="p-4">Tên tàu</th>
              <th className="p-4">Sức chứa</th>
              <th className="p-4">Tốc độ vận hành</th>
              <th className="p-4">Phân loại</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredBoats.map((boat) => (
              <tr key={boat.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <td className="p-4 font-bold text-slate-900 dark:text-white">{boat.code}</td>
                <td className="p-4 font-medium text-slate-900 dark:text-slate-100">{boat.name}</td>
                <td className="p-4 text-slate-600 dark:text-slate-300 font-semibold">{boat.capacity} ghế</td>
                <td className="p-4 text-slate-500">{boat.speed}</td>
                <td className="p-4">
                  {boat.is_express ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      <Anchor size={12} /> Cao Tốc Express
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      Thường
                    </span>
                  )}
                </td>
                <td className="p-4">
                  {boat.status === 'active' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500 text-white">
                      <CheckCircle2 size={12} /> Hoạt động tốt
                    </span>
                  )}
                  {boat.status === 'maintenance' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500 text-white">
                      Bảo trì định kỳ
                    </span>
                  )}
                  {boat.status === 'inactive' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-400 text-white">
                      <XCircle size={12} /> Tạm dừng
                    </span>
                  )}
                </td>
                <td className="p-4 text-right space-x-1">
                  {/* Standalone Edit Link to /boats/$boatId/edit */}
                  <Link
                    to={"/boats/$boatId/edit" as any}
                    params={{ boatId: boat.id } as any}
                    className="p-1.5 inline-flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 cursor-pointer"
                    title="Chỉnh sửa thông tin tàu"
                  >
                    <Edit size={16} />
                  </Link>
                  <button
                    onClick={() => handleDelete(boat.id, boat.name)}
                    className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-500 hover:text-rose-600 cursor-pointer"
                    title="Xóa tàu"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
