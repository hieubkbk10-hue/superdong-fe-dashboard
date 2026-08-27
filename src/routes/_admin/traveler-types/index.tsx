import React, { useState, useEffect, useMemo } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  Users,
  Plus,
  Search,
  Edit,
  RefreshCw,
  AlertTriangle,
  Tag,
  ShieldCheck,
  Armchair,
  Baby,
  Percent,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { TravelerType } from '@/types';
import { getTravelerTypes } from '@/apis/pricing';
import { PageHeader, TableToolbar } from '@/components/common/TableUtilities';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';

export const Route = createFileRoute('/_admin/traveler-types/')({
  component: TravelerTypesPage,
});

// Helper lấy tên phân loại an toàn
function getTravelerTypeName(t: TravelerType): string {
  return t.display_name || t.name || t.code || 'Phân loại khách';
}

// Helper lấy mức giảm giá an toàn
function getDiscountPercent(t: TravelerType): number {
  return t.discount_percent ?? t.discount_percentage ?? 0;
}

// Helper Icon theo Code
function getTravelerTypeIcon(code?: string) {
  const c = (code || '').toLowerCase();
  switch (c) {
    case 'infant':
      return Baby;
    case 'child':
      return Users;
    default:
      return Users;
  }
}

function TravelerTypesPage() {
  const [types, setTypes] = useState<TravelerType[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [discountFilter, setDiscountFilter] = useState<string>('all');
  const [seatFilter, setSeatFilter] = useState<string>('all');

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
      const msg = err?.response?.data?.message || err?.message || 'Không thể kết nối với Backend API';
      setApiError(msg);
      toast.error(`Không thể lấy dữ liệu loại hành khách: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  // Lọc thông minh
  const filteredTypes = useMemo(() => {
    return types.filter((t) => {
      const term = searchTerm.toLowerCase().trim();
      const name = getTravelerTypeName(t).toLowerCase();
      const code = (t.code || '').toLowerCase();
      const discount = getDiscountPercent(t);

      const matchesSearch = !term || name.includes(term) || code.includes(term);

      let matchesDiscount = true;
      if (discountFilter === 'standard') matchesDiscount = discount === 0;
      else if (discountFilter === 'discounted') matchesDiscount = discount > 0 && discount < 100;
      else if (discountFilter === 'free') matchesDiscount = discount === 100;

      let matchesSeat = true;
      if (seatFilter === 'required') matchesSeat = t.requires_seat !== false;
      else if (seatFilter === 'not_required') matchesSeat = t.requires_seat === false;

      return matchesSearch && matchesDiscount && matchesSeat;
    });
  }, [types, searchTerm, discountFilter, seatFilter]);

  // KPI Stats
  const stats = useMemo(() => {
    const total = types.length;
    const freeCount = types.filter((t) => getDiscountPercent(t) === 100).length;
    const discountCount = types.filter((t) => {
      const d = getDiscountPercent(t);
      return d > 0 && d < 100;
    }).length;
    const standardCount = types.filter((t) => getDiscountPercent(t) === 0).length;

    return { total, freeCount, discountCount, standardCount };
  }, [types]);

  return (
    <div className="space-y-4 w-full font-sans pb-12">
      {/* Header */}
      <PageHeader
        title="Phân Loại Hành Khách &amp; Chính Sách Giảm Giá (Traveler Types)"
        subtitle="Quản lý các nhóm đối tượng hành khách, tỷ lệ ưu đãi giảm giá vé và điều kiện giữ chỗ ngồi."
        icon={Users}
        onRefresh={fetchTypes}
        refreshing={loading}
        createLink="/traveler-types/create"
        createLabel="Thêm Phân Loại Mới"
      />

      {/* API Error Alert */}
      {apiError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={18} className="shrink-0 text-rose-500" />
            <span>⚠️ Không thể kết nối lấy dữ liệu: {apiError}. Vui lòng kiểm tra lại Backend Server.</span>
          </div>
          <Button size="sm" variant="outline" onClick={fetchTypes} className="h-7 text-xs border-rose-300 dark:border-rose-800">
            Thử lại
          </Button>
        </div>
      )}

      {/* Filter Bar */}
      <TableToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm theo tên đối tượng, mã ADULT, CHILD, SENIOR..."
      >
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter Mức Giảm Giá */}
          <select
            value={discountFilter}
            onChange={(e) => setDiscountFilter(e.target.value)}
            className="h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-slate-100 outline-none cursor-pointer focus:border-blue-500 font-medium"
          >
            <option value="all">Tất cả mức giá</option>
            <option value="standard">Giá tiêu chuẩn (0% giảm)</option>
            <option value="discounted">Có giảm giá (1% - 99%)</option>
            <option value="free">Miễn phí 100% (0đ)</option>
          </select>

          {/* Filter Ghế Ngồi */}
          <select
            value={seatFilter}
            onChange={(e) => setSeatFilter(e.target.value)}
            className="h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-slate-100 outline-none cursor-pointer focus:border-blue-500 font-medium"
          >
            <option value="all">Tất cả quy định ghế</option>
            <option value="required">Bắt buộc giữ ghế riêng</option>
            <option value="not_required">Không cần ghế riêng</option>
          </select>
        </div>
      </TableToolbar>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200/60 dark:border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Mã Đối Tượng</th>
                <th className="py-3 px-4">Tên Phân Loại Hành Khách</th>
                <th className="py-3 px-4">Mức Giảm Giá Vé</th>
                <th className="py-3 px-4">Quy Định Chỗ Ngồi</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <span className="font-medium">Đang tải dữ liệu phân loại hành khách từ Backend Server...</span>
                  </td>
                </tr>
              ) : filteredTypes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">
                    <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                      <Users size={24} />
                    </div>
                    <div className="font-semibold text-slate-700 dark:text-slate-300">Không tìm thấy phân loại hành khách nào</div>
                    <div className="text-[11px] text-slate-400 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc mức giá</div>
                  </td>
                </tr>
              ) : (
                filteredTypes.map((t) => {
                  const name = getTravelerTypeName(t);
                  const discount = getDiscountPercent(t);
                  const IconComp = getTravelerTypeIcon(t.code);
                  const isActive = t.status === 'active' || t.is_active !== false;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Mã code */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                          {t.code ? t.code.toUpperCase() : 'N/A'}
                        </span>
                      </td>

                      {/* Tên phân loại */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200/50 dark:border-blue-800/50">
                            <IconComp size={15} />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">{name}</div>
                            {t.description && (
                              <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 max-w-xs">{t.description}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Mức giảm giá */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {discount === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            100% Giá chuẩn (Vé gốc)
                          </span>
                        ) : discount === 100 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                            <Sparkles size={12} />
                            Miễn phí 100% (0 ₫)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 font-mono">
                            <Tag size={12} />
                            Giảm {discount}% giá vé
                          </span>
                        )}
                      </td>

                      {/* Ghế ngồi */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {t.requires_seat !== false ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                            <Armchair size={14} className="text-blue-600 dark:text-blue-400" />
                            Bắt buộc giữ ghế riêng
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 italic font-medium">
                            <Baby size={14} className="text-amber-500" />
                            Ngồi chung với người lớn
                          </span>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isActive ? (
                          <Badge variant="success">Hoạt động</Badge>
                        ) : (
                          <Badge variant="secondary">Tạm ngưng</Badge>
                        )}
                      </td>

                      {/* Hành động */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="h-8 px-2.5 text-xs font-semibold gap-1"
                        >
                          <Link to={`/traveler-types/${t.id}/edit` as any}>
                            <Edit size={13} />
                            <span>Sửa</span>
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
