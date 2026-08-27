import React, { useState, useEffect, useMemo } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import {
  Users,
  Edit,
  Tag,
  Armchair,
  Baby,
  Sparkles,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { TravelerType } from '@/types';
import { getTravelerTypes } from '@/apis/pricing';
import { AdminTablePage, ColumnDef, FilterOption } from '@/components/common/TableUtilities';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';

export interface TravelerTypesSearch {
  page?: number;
  search?: string;
  discount?: string;
}

export const Route = createFileRoute('/_admin/traveler-types/')({
  validateSearch: (search: Record<string, unknown>): TravelerTypesSearch => {
    const result: TravelerTypesSearch = {};
    if (Number(search?.page) > 1) result.page = Number(search.page);
    if (typeof search?.search === 'string' && search.search.trim()) result.search = search.search.trim();
    if (typeof search?.discount === 'string' && search.discount !== 'all') result.discount = search.discount;
    return result;
  },
  component: TravelerTypesPage,
});

const discountOptions: FilterOption[] = [
  { value: 'all', label: 'Tất cả mức giá' },
  { value: 'standard', label: 'Giá tiêu chuẩn (0% giảm)' },
  { value: 'discounted', label: 'Có giảm giá (1% - 99%)' },
  { value: 'free', label: 'Miễn phí 100% (0 ₫)' },
];

function getTravelerTypeName(t: TravelerType): string {
  return t.display_name || t.name || t.code || 'Phân loại khách';
}

function getDiscountPercent(t: TravelerType): number {
  return t.discount_percent ?? t.discount_percentage ?? 0;
}

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
  const navigate = useNavigate({ from: Route.fullPath });
  const searchParams = Route.useSearch();

  const currentPage = searchParams.page || 1;
  const searchTerm = searchParams.search || '';
  const discountFilter = searchParams.discount || 'all';

  const [types, setTypes] = useState<TravelerType[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

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

  const handleSearchChange = (value: string) => {
    navigate({
      search: (prev: any) => {
        const next: any = { ...prev };
        if (value && value.trim()) {
          next.search = value.trim();
        } else {
          delete next.search;
        }
        delete next.page;
        return next;
      },
    });
  };

  const handleDiscountFilterChange = (value: string) => {
    navigate({
      search: (prev: any) => {
        const next: any = { ...prev };
        if (value && value !== 'all') {
          next.discount = value;
        } else {
          delete next.discount;
        }
        delete next.page;
        return next;
      },
    });
  };

  const handlePageChange = (page: number) => {
    navigate({
      search: (prev: any) => {
        const next: any = { ...prev };
        if (page > 1) {
          next.page = page;
        } else {
          delete next.page;
        }
        return next;
      },
    });
  };

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

      return matchesSearch && matchesDiscount;
    });
  }, [types, searchTerm, discountFilter]);

  const columns: ColumnDef<TravelerType>[] = [
    {
      key: 'code',
      label: 'MÃ ĐỐI TƯỢNG',
      sortable: true,
      render: (t) => (
        <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
          {t.code ? t.code.toUpperCase() : 'N/A'}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'TÊN PHÂN LOẠI',
      sortable: true,
      render: (t) => {
        const IconComp = getTravelerTypeIcon(t.code);
        return (
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200/50 dark:border-blue-800/50">
              <IconComp size={15} />
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">{getTravelerTypeName(t)}</div>
              {t.description && (
                <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 max-w-xs">{t.description}</div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'discount_percent',
      label: 'MỨC GIẢM GIÁ',
      sortable: true,
      render: (t) => {
        const discount = getDiscountPercent(t);
        if (discount === 0) {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              100% Giá gốc
            </span>
          );
        }
        if (discount === 100) {
          return (
            <Badge variant="success" className="gap-1 text-xs">
              <Sparkles size={12} /> Miễn phí 100% (0 ₫)
            </Badge>
          );
        }
        return (
          <Badge variant="warning" className="gap-1 text-xs font-mono">
            <Tag size={12} /> Giảm {discount}%
          </Badge>
        );
      },
    },
    {
      key: 'requires_seat',
      label: 'QUY ĐỊNH CHỖ NGỒI',
      sortable: true,
      render: (t) => {
        if (t.requires_seat !== false) {
          return (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
              <Armchair size={14} className="text-blue-600 dark:text-blue-400" />
              Bắt buộc giữ ghế riêng
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 italic font-medium">
            <Baby size={14} className="text-amber-500" />
            Ngồi chung người lớn
          </span>
        );
      },
    },
    {
      key: 'status',
      label: 'TRẠNG THÁI',
      sortable: true,
      render: (t) => {
        const isActive = t.status === 'active' || t.is_active !== false;
        return isActive ? (
          <Badge variant="success">Hoạt động</Badge>
        ) : (
          <Badge variant="secondary">Tạm ngưng</Badge>
        );
      },
    },
    {
      key: 'actions',
      label: 'THAO TÁC',
      align: 'right',
      render: (t) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-blue-600 hover:text-blue-700 dark:text-blue-400"
          asChild
          title="Chỉnh sửa phân loại hành khách"
        >
          <Link to={`/traveler-types/${t.id}/edit` as any}>
            <Edit size={15} />
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <AdminTablePage
      title="Phân Loại Hành Khách &amp; Chính Sách Giảm Giá"
      subtitle="Quản lý các nhóm đối tượng hành khách, tỷ lệ ưu đãi giảm giá vé và điều kiện giữ chỗ ngồi"
      icon={Users}
      apiError={apiError}
      searchValue={searchTerm}
      onSearchChange={handleSearchChange}
      searchPlaceholder="Tìm theo tên đối tượng, mã ADULT, CHILD, SENIOR..."
      filterValue={discountFilter}
      onFilterChange={handleDiscountFilterChange}
      filterOptions={discountOptions}
      columns={columns}
      columnStorageKey="superdong_traveler_types_columns"
      onRefresh={fetchTypes}
      refreshing={loading}
      createLink="/traveler-types/create"
      createLabel="Thêm Phân Loại Mới"
      data={filteredTypes}
      loading={loading}
      emptyText={apiError ? '⚠️ Không thể lấy dữ liệu từ Backend API.' : 'Không tìm thấy phân loại hành khách nào.'}
      keyExtractor={(t) => String(t.id)}
      entityLabel="đối tượng khách"
      currentPage={currentPage}
      onPageChange={handlePageChange}
    />
  );
}

