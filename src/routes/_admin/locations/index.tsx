import React, { useState, useEffect } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { MapPin, Plus, Edit, Trash2, Search, CheckCircle2, XCircle, Phone, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { getLocations } from '@/apis/journeys';
import { Location } from '@/types';

export const Route = createFileRoute('/_admin/locations/')({
  component: LocationsPage,
});

export interface LocationItem {
  id: string;
  code: string;
  name: string;
  province: string;
  address: string;
  phone: string;
  status: 'active' | 'maintenance' | 'inactive';
}

export const INITIAL_LOCATIONS: LocationItem[] = [
  {
    id: 'loc-1',
    code: 'RG',
    name: 'Bến tàu Rạch Giá',
    province: 'Kiên Giang',
    address: 'Đường Nguyễn Công Trứ, Phường Vĩnh Thanh, Thành phố Rạch Giá',
    phone: '0297 3877 742',
    status: 'active',
  },
  {
    id: 'loc-2',
    code: 'PQ',
    name: 'Bến tàu Phú Quốc (Bãi Vòng)',
    province: 'Kiên Giang',
    address: 'Cảng Bãi Vòng, Xã Hàm Ninh, TP. Phú Quốc',
    phone: '0297 3980 111',
    status: 'active',
  },
  {
    id: 'loc-3',
    code: 'HT',
    name: 'Bến tàu Hà Tiên',
    province: 'Kiên Giang',
    address: 'Đường Kim Dự, Phường Đông Hồ, TP. Hà Tiên',
    phone: '0297 3955 933',
    status: 'active',
  },
  {
    id: 'loc-4',
    code: 'TD',
    name: 'Bến tàu Trần Đề',
    province: 'Sóc Trăng',
    address: 'Ấp Đầu Giồng, Thị trấn Trần Đề, Huyện Trần Đề',
    phone: '0299 3843 888',
    status: 'active',
  },
  {
    id: 'loc-5',
    code: 'CD',
    name: 'Bến tàu Côn Đảo (Bến Đầm)',
    province: 'Bà Rịa - Vũng Tàu',
    address: 'Vịnh Bến Đầm, Huyện Côn Đảo',
    phone: '0254 3830 555',
    status: 'active',
  },
  {
    id: 'loc-6',
    code: 'PT',
    name: 'Bến tàu Phan Thiết',
    province: 'Bình Thuận',
    address: 'Đường Phạm Văn Đồng, Phường Hưng Long, TP. Phan Thiết',
    phone: '0252 3817 595',
    status: 'maintenance',
  },
  {
    id: 'loc-7',
    code: 'PQY',
    name: 'Bến tàu Phú Quý',
    province: 'Bình Thuận',
    address: 'Cảng Phú Quý, Xã Ngũ Phụng, Huyện Phú Quý',
    phone: '0252 3765 888',
    status: 'active',
  },
];

function LocationsPage() {
  const [locations, setLocations] = useState<LocationItem[]>(INITIAL_LOCATIONS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    let isMounted = true;
    const fetchLocations = async () => {
      try {
        const res = await getLocations();
        if (isMounted && res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          const mapped: LocationItem[] = res.data.map((loc: Location) => ({
            id: String(loc.id),
            code: loc.code || '',
            name: loc.name || '',
            province: loc.city || 'Kiên Giang',
            address: loc.address || '',
            phone: '0297 3877 742',
            status: loc.is_active ? 'active' : 'inactive',
          }));
          setLocations(mapped);
          toast.success('Đã tải danh sách bến tàu từ Backend API');
        }
      } catch (err) {
        // Fallback state
      }
    };
    fetchLocations();
    return () => { isMounted = false; };
  }, []);

  const filteredLocations = locations.filter((loc) => {
    const matchesSearch =
      loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.province.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.address.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || loc.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Bạn có chắc muốn xóa bến tàu ${name}?`)) {
      setLocations((prev) => prev.filter((item) => item.id !== id));
      toast.success(`Đã xóa bến tàu ${name}`);
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <MapPin className="h-6 w-6 text-blue-600" />
            Bến tàu &amp; Cảng đón trả khách
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý thông tin địa điểm xuất phát, địa chỉ bến và hotline tiếp nhận khách hàng trên toàn hệ thống Superdong
          </p>
        </div>
        <Link
          to={"/locations/create" as any}
          className="h-10 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus size={16} /> Thêm bến tàu mới
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
            placeholder="Tìm theo tên bến, mã cảng (RG, PQ...), địa phương..."
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
            <option value="active">Đang hoạt động</option>
            <option value="maintenance">Bảo trì / Sửa chữa</option>
            <option value="inactive">Tạm ngưng</option>
          </select>
        </div>
      </div>

      {/* Locations Data Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="p-4">Mã cảng</th>
              <th className="p-4">Tên Bến Tàu</th>
              <th className="p-4">Địa phương / Tỉnh thành</th>
              <th className="p-4">Địa chỉ bến</th>
              <th className="p-4">Hotline tiếp nhận</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredLocations.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Không tìm thấy bến tàu nào phù hợp với từ khóa search
                </td>
              </tr>
            ) : (
              filteredLocations.map((loc) => (
                <tr key={loc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700">
                      {loc.code}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <Navigation size={15} className="text-blue-600 shrink-0" />
                      {loc.name}
                    </div>
                  </td>
                  <td className="p-4 font-medium text-slate-700 dark:text-slate-300">{loc.province}</td>
                  <td className="p-4 text-slate-500 max-w-xs truncate" title={loc.address}>
                    {loc.address}
                  </td>
                  <td className="p-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Phone size={13} className="text-emerald-600 shrink-0" />
                      {loc.phone}
                    </div>
                  </td>
                  <td className="p-4">
                    {loc.status === 'active' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500 text-white">
                        <CheckCircle2 size={12} /> Đang hoạt động
                      </span>
                    )}
                    {loc.status === 'maintenance' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500 text-white">
                        Đang nâng cấp bến
                      </span>
                    )}
                    {loc.status === 'inactive' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-400 text-white">
                        <XCircle size={12} /> Tạm ngưng
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-1">
                    <Link
                      to={"/locations/$locationId/edit" as any}
                      params={{ locationId: loc.id } as any}
                      className="p-1.5 inline-flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 cursor-pointer"
                      title="Chỉnh sửa bến tàu"
                    >
                      <Edit size={16} />
                    </Link>
                    <button
                      onClick={() => handleDelete(loc.id, loc.name)}
                      className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-500 hover:text-rose-600 cursor-pointer"
                      title="Xóa bến tàu"
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
