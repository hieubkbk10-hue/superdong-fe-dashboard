import React, { useState, useEffect, useMemo } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Tag, Edit, Trash2, CheckCircle2, XCircle, Percent } from 'lucide-react';
import { toast } from 'sonner';

import { Coupon } from '@/types';
import { getCoupons, deleteCoupon } from '@/apis/pricing';
import { Button } from '@/components/common/Button';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { AdminTablePage, ColumnDef, FilterOption } from '@/components/common/TableUtilities';

export interface CouponsSearch {
  page?: number;
  search?: string;
  status?: string;
}

export const Route = createFileRoute('/_admin/coupons/')({
  validateSearch: (search: Record<string, unknown>): CouponsSearch => {
    const result: CouponsSearch = {};
    if (Number(search?.page) > 1) result.page = Number(search.page);
    if (typeof search?.search === 'string' && search.search.trim()) result.search = search.search.trim();
    if (typeof search?.status === 'string' && search.status !== 'all') result.status = search.status;
    return result;
  },
  component: CouponsPage,
});

export interface CouponRow {
  id: string | number;
  code: string;
  name: string;
  type: string;
  valueDisplay: string;
  minBookingDisplay: string;
  usageDisplay: string;
  validToDisplay: string;
  status: 'active' | 'inactive';
}

const statusOptions: FilterOption[] = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Đang áp dụng' },
  { value: 'inactive', label: 'Tạm ngưng' },
];

function CouponsPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const searchParams = Route.useSearch();

  const currentPage = searchParams.page || 1;
  const searchTerm = searchParams.search || '';
  const statusFilter = searchParams.status || 'all';

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Confirmation Modal state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string | number; code: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await getCoupons();
      if (res && res.data && Array.isArray(res.data)) {
        res.data.forEach((c: any) => {
          localStorage.setItem(`superdong_coupon_cache_${c.id}`, JSON.stringify(c));
        });
        setCoupons(res.data);
      } else {
        setCoupons([]);
      }
    } catch (err: any) {
      console.error('Fetch coupons error:', err);
      setCoupons([]);
      setApiError(err?.response?.data?.message || err?.message || 'Không thể kết nối với Backend API');
      toast.error('Không thể lấy dữ liệu mã khuyến mãi từ Backend API');
    } finally {
      setLoading(false);
    }
  };

  const executeDeleteCoupon = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await deleteCoupon(deleteTarget.id);
      toast.success(`Đã xóa vĩnh viễn mã khuyến mãi ${deleteTarget.code} thành công!`);
      setDeleteTarget(null);
      await fetchCoupons();
    } catch (err: any) {
      console.error('Failed to delete coupon:', err);
      const serverMsg = err?.response?.data?.message || err?.message || '';
      toast.error(serverMsg || 'Có lỗi xảy ra khi xóa mã khuyến mãi trên Backend');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
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

  const handleStatusFilterChange = (value: string) => {
    navigate({
      search: (prev: any) => {
        const next: any = { ...prev };
        if (value && value !== 'all') {
          next.status = value;
        } else {
          delete next.status;
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

  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      const code = c.code || '';
      const name = c.name || '';
      const search = searchTerm.toLowerCase().trim();
      const matchesSearch = !search || code.toLowerCase().includes(search) || name.toLowerCase().includes(search);

      const isActive = c.status ? c.status === 'active' : Boolean(c.is_active);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && isActive) ||
        (statusFilter === 'inactive' && !isActive);

      return matchesSearch && matchesStatus;
    });
  }, [coupons, searchTerm, statusFilter]);

  const mappedData: CouponRow[] = useMemo(() => {
    return filteredCoupons.map((c) => {
      const isActive = c.status ? c.status === 'active' : Boolean(c.is_active);
      const isPercent = (c as any).type === 'percent' || c.type === 'percentage' || c.discount_type === 'percentage';
      const val = c.value ?? c.discount_value ?? 0;
      const usageCount = c.usage_count ?? (c as any).used_count ?? 0;
      const validTo = c.valid_until || c.effective_to || (c as any).valid_to;

      return {
        id: c.id,
        code: c.code || '',
        name: c.name || '',
        type: isPercent ? 'percent' : 'fixed',
        valueDisplay: isPercent ? `${val}%` : `${Number(val).toLocaleString('vi-VN')} VNĐ`,
        minBookingDisplay: c.min_booking_amount
          ? `${Number(c.min_booking_amount).toLocaleString('vi-VN')} VNĐ`
          : 'Không giới hạn',
        usageDisplay: `${usageCount} / ${c.usage_limit || '∞'}`,
        validToDisplay: validTo ? new Date(validTo).toLocaleDateString('vi-VN') : 'Không thời hạn',
        status: isActive ? 'active' : 'inactive',
      };
    });
  }, [filteredCoupons]);

  const columns: ColumnDef<CouponRow>[] = [
    {
      key: 'code',
      label: 'MÃ COUPON',
      sortable: true,
      render: (c) => (
        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 uppercase bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
          {c.code}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'TÊN CHƯƠNG TRÌNH',
      sortable: true,
      render: (c) => <span className="font-bold text-slate-900 dark:text-white">{c.name}</span>,
    },
    {
      key: 'valueDisplay',
      label: 'LOẠI & MỨC GIẢM',
      sortable: true,
      render: (c) => (
        <span className="font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1">
          {c.type === 'percent' && <Percent size={13} className="text-amber-500" />}
          {c.valueDisplay}
        </span>
      ),
    },
    {
      key: 'minBookingDisplay',
      label: 'ĐIỀU KIỆN ĐƠN',
      sortable: true,
      render: (c) => <span className="text-slate-600 dark:text-slate-400 font-medium">{c.minBookingDisplay}</span>,
    },
    {
      key: 'usageDisplay',
      label: 'LƯỢT SỬ DỤNG',
      sortable: true,
      render: (c) => <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{c.usageDisplay}</span>,
    },
    {
      key: 'validToDisplay',
      label: 'HẠN HIỆU LỰC',
      sortable: true,
      render: (c) => <span className="text-slate-600 dark:text-slate-400 text-xs font-medium">{c.validToDisplay}</span>,
    },
    {
      key: 'status',
      label: 'TRẠNG THÁI',
      sortable: true,
      render: (c) =>
        c.status === 'active' ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 whitespace-nowrap shrink-0">
            <CheckCircle2 size={12} className="shrink-0" /> Đang áp dụng
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800 whitespace-nowrap shrink-0">
            <XCircle size={12} className="shrink-0" /> Tạm ngưng
          </span>
        ),
    },
    {
      key: 'actions',
      label: 'THAO TÁC',
      align: 'right',
      render: (c) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 dark:text-blue-400" asChild>
            <Link to={'/coupons/$couponId/edit' as any} params={{ couponId: String(c.id) } as any} title="Chỉnh sửa mã khuyến mãi">
              <Edit size={15} />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600 hover:text-rose-700 dark:text-rose-400" onClick={() => setDeleteTarget({ id: c.id, code: c.code })} title="Xóa mã khuyến mãi">
            <Trash2 size={15} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <AdminTablePage
        title="Quản Lý Mã Khuyến Mãi (Coupons)"
        subtitle="Thiết lập danh mục voucher, mã giảm giá và điều kiện áp dụng mua vé Superdong"
        icon={Tag}
        apiError={apiError}
        searchValue={searchTerm}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Tìm theo mã coupon hoặc tên chương trình..."
        filterValue={statusFilter}
        onFilterChange={handleStatusFilterChange}
        filterOptions={statusOptions}
        columns={columns}
        columnStorageKey="superdong_coupons_columns"
        onRefresh={fetchCoupons}
        refreshing={loading}
        createLink="/coupons/create"
        createLabel="Thêm Coupon Mới"
        data={mappedData}
        loading={loading}
        emptyText="Chưa có mã khuyến mãi nào phù hợp với bộ lọc."
        keyExtractor={(c) => String(c.id)}
        entityLabel="mã khuyến mãi"
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Xác nhận xóa mã khuyến mãi"
        description={`Bạn có chắc chắn muốn xóa vĩnh viễn mã khuyến mãi "${deleteTarget?.code}"? Hệ thống sẽ lưu Audit Snapshot trước khi xóa. Thao tác này không thể hoàn tác.`}
        confirmLabel={deleting ? 'Đang xóa...' : 'Xóa mã khuyến mãi'}
        loading={deleting}
        variant="destructive"
        onConfirm={executeDeleteCoupon}
      />
    </>
  );
}

