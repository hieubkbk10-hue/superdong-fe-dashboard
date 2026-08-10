import React, { useState, useEffect } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Users, Plus, Search, Edit, Trash2, CheckCircle2, XCircle, Info, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { TravelerType } from '@/types';
import { getTravelerTypes } from '@/apis/pricing';

export const Route = createFileRoute('/_admin/traveler-types/')({
  component: TravelerTypesPage,
});

function TravelerTypesPage() {
  const [types, setTypes] = useState<TravelerType[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTypes = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await getTravelerTypes();
      if (res && res.data && Array.isArray(res.data)) {
        setTypes(res.data);
      } else {
        setTypes([]);
      }
    } catch (err: any) {
      console.error('Fetch traveler types error:', err);
      setTypes([]);
      setApiError(err?.response?.data?.message || err?.message || 'Không thể kết nối với Backend API');
      toast.error('Không thể lấy dữ liệu phân loại hành khách từ Backend API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const filteredTypes = types.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-600" />
              Phân Loại Hành Khách Live
            </h1>
            {!apiError && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 size={13} /> Live API Backend
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Nối trực tiếp API endpoint `/v1/traveler-types` từ Server Backend Superdong
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTypes}
            disabled={loading}
            className="h-10 px-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>
          <Link
            to={'/traveler-types/create' as any}
            className="h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Plus size={16} /> Thêm Phân Loại Mới
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
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" />
                    Đang tải dữ liệu loại hành khách từ Backend API...
                  </td>
                </tr>
              ) : filteredTypes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    {apiError ? '⚠️ Không thể lấy dữ liệu từ Backend API.' : 'Không có phân loại hành khách nào.'}
                  </td>
                </tr>
              ) : (
                filteredTypes.map((t) => (
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
                        <span>{t.description || 'N/A'}</span>
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
