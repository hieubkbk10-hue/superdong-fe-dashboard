import React, { useState, useEffect } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Users, Plus, Search, Edit, Trash2, CheckCircle2, XCircle, Percent, Info } from 'lucide-react';
import { toast } from 'sonner';
import { TravelerType } from '@/types';
import { getTravelerTypes, createTravelerType, updateTravelerType } from '@/apis/pricing';

export const Route = createFileRoute('/_admin/traveler-types/')({
  component: TravelerTypesPage,
});

const INITIAL_TYPES: TravelerType[] = [
  {
    id: '1',
    name: 'Người lớn',
    code: 'ADULT',
    discount_percentage: 0,
    description: 'Hành khách từ 12 tuổi đến 59 tuổi. Áp dụng 100% giá vé chuẩn.',
    is_active: true,
  },
  {
    id: '2',
    name: 'Trẻ em',
    code: 'CHILD',
    discount_percentage: 25,
    description: 'Trẻ em từ 6 đến 11 tuổi (Tính theo năm sinh trên CCCD/Giấy khai sinh).',
    is_active: true,
  },
  {
    id: '3',
    name: 'Em bé (Dưới 6 tuổi)',
    code: 'INFANT',
    discount_percentage: 100,
    description: 'Trẻ em dưới 6 tuổi ngồi chung ghế với người lớn, miễn phí 100%.',
    is_active: true,
  },
  {
    id: '4',
    name: 'Người cao tuổi',
    code: 'SENIOR',
    discount_percentage: 15,
    description: 'Công dân Việt Nam từ 60 tuổi trở lên (Cần xuất trình CCCD khi làm thủ tục).',
    is_active: true,
  },
  {
    id: '5',
    name: 'Thương binh / Khuyết tật',
    code: 'DISABLED',
    discount_percentage: 25,
    description: 'Thương binh, bệnh binh, người khuyết tật nặng theo quy định ưu đãi nhà nước.',
    is_active: true,
  },
];

function TravelerTypesPage() {
  const [types, setTypes] = useState<TravelerType[]>(INITIAL_TYPES);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const res = await getTravelerTypes();
        if (isMounted && res && res.data && res.data.length > 0) {
          setTypes(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch traveler types:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredTypes = types.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Bạn có chắc muốn xóa loại hành khách ${name}?`)) {
      setTypes((prev) => prev.filter((item) => item.id !== id));
      toast.success(`Đã xóa phân loại ${name}`);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-600" />
              Phân Loại Hành Khách
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live API Backend
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cấu hình các đối tượng hành khách, mức miễn giảm giá vé theo độ tuổi &amp; đối tượng chính sách
          </p>
        </div>
        <Link
          to={'/traveler-types/create' as any}
          className="h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <Plus size={16} /> Thêm Phân Loại Mới
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo Tên hoặc Mã phân loại (ADULT, CHILD...)..."
            className="w-full h-10 pl-9 pr-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">Mã Đối Tượng</th>
                <th className="p-4">Tên Phân Loại Hành Khách</th>
                <th className="p-4">Mức Giảm Giá Vé</th>
                <th className="p-4">Mô Tả &amp; Điều Kiện Áp Dụng</th>
                <th className="p-4">Trạng Thái</th>
                <th className="p-4 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTypes.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-mono font-bold text-blue-600">
                    <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700">
                      {t.code}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-slate-900 dark:text-white text-base">{t.name}</td>
                  <td className="p-4">
                    {t.discount_percentage === 0 ? (
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        100% Giá chuẩn (Vé gốc)
                      </span>
                    ) : t.discount_percentage === 100 ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full text-xs">
                        Miễn phí 100%
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full text-xs">
                        Giảm {t.discount_percentage}%
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-400 max-w-md">
                    <div className="flex items-start gap-1.5 text-xs">
                      <Info size={14} className="text-slate-400 shrink-0 mt-0.5" />
                      <span>{t.description}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    {t.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 size={12} /> Đang áp dụng
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-400/10 text-slate-500 border border-slate-400/20">
                        <XCircle size={12} /> Ngừng áp dụng
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-1">
                    <Link
                      to={'/traveler-types/$typeId/edit' as any}
                      params={{ typeId: t.id } as any}
                      className="p-1.5 inline-flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 cursor-pointer"
                      title="Chỉnh sửa phân loại"
                    >
                      <Edit size={16} />
                    </Link>
                    <button
                      onClick={() => handleDelete(String(t.id), t.name)}
                      className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-500 hover:text-rose-600 cursor-pointer"
                      title="Xóa phân loại"
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
    </div>
  );
}
