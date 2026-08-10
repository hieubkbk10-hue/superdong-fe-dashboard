import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  Ticket,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Percent,
  DollarSign,
  Calendar,
  RefreshCw,
  AlertTriangle,
  SlidersHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';

import { Coupon } from '@/types';
import { getCoupons, deleteCoupon } from '@/apis/pricing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, Column } from '@/components/common/DataTable';
import { PaginationBar } from '@/components/common/PaginationBar';
import { ConfirmModal } from '@/components/common/ConfirmModal';

export const Route = createFileRoute('/_admin/coupons/')({
  component: CouponsPage,
});

type SortField = 'code' | 'name' | 'value' | 'min_booking' | 'valid_to' | 'status' | null;
type SortOrder = 'asc' | 'desc' | 'none';

function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Confirmation Modal state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string | number; code: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // LOGIC: Sắp xếp 3 trạng thái (Phát 1: Tăng dần, Phát 2: Giảm dần, Phát 3: Trở về ban đầu)
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('none');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // LOGIC: Quản lý Ẩn / Hiện Cột (Column Visibility Toggle)
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    code: true,
    name: true,
    value: true,
    min_booking: true,
    usage: true,
    valid_to: true,
    status: true,
  });
  const [showColumnDropdown, setShowColumnDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const columnOptions = [
    { key: 'code', label: 'Mã Coupon' },
    { key: 'name', label: 'Tên Chương Trình' },
    { key: 'value', label: 'Loại & Mức Giảm' },
    { key: 'min_booking', label: 'Điều Kiện Đơn' },
    { key: 'usage', label: 'Lượt Sử Dụng' },
    { key: 'valid_to', label: 'Hạn Hiệu Lực' },
    { key: 'status', label: 'Trạng Thái' },
  ];

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const resetColumns = () => {
    setVisibleColumns({
      code: true,
      name: true,
      value: true,
      min_booking: true,
      usage: true,
      valid_to: true,
      status: true,
    });
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowColumnDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // LOGIC: Nối trực tiếp API endpoint /v1/coupons từ Server Backend Superdong
  const fetchCoupons = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await getCoupons();
      if (res && res.data && Array.isArray(res.data)) {
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
      toast.success(`Đã xóa vĩnh viễn mã khuyến mãi ${deleteTarget.code} thành công (Đã lưu Audit Snapshot)!`, {
        id: 'coupon-delete-toast',
      });
      setDeleteTarget(null);
      await fetchCoupons();
    } catch (err: any) {
      console.error('Failed to delete coupon:', err);
      const serverMsg = err?.response?.data?.message || err?.message || '';
      toast.error(serverMsg || 'Có lỗi xảy ra khi xóa mã khuyến mãi trên Backend', { id: 'coupon-delete-toast' });
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  // Reset về trang 1 khi lọc hoặc tìm kiếm thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, pageSize]);

  // LOGIC: Xử lý Lọc dữ liệu theo Từ khóa & Trạng thái
  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      const code = c.code || '';
      const name = c.name || '';
      const search = searchTerm.toLowerCase().trim();
      const matchesSearch = code.toLowerCase().includes(search) || name.toLowerCase().includes(search);

      const isActive = c.status ? c.status === 'active' : Boolean(c.is_active);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && isActive) ||
        (statusFilter === 'inactive' && !isActive);

      return matchesSearch && matchesStatus;
    });
  }, [coupons, searchTerm, statusFilter]);

  // LOGIC: Sắp xếp theo cột (3-State Sorting: Asc -> Desc -> None)
  const sortedCoupons = useMemo(() => {
    if (!sortField || sortOrder === 'none') {
      return filteredCoupons;
    }

    return [...filteredCoupons].sort((a: any, b: any) => {
      let aVal: any = '';
      let bVal: any = '';

      switch (sortField) {
        case 'code':
          aVal = (a.code || '').toLowerCase();
          bVal = (b.code || '').toLowerCase();
          break;
        case 'name':
          aVal = (a.name || '').toLowerCase();
          bVal = (b.name || '').toLowerCase();
          break;
        case 'value':
          aVal = a.discount_value || a.value || 0;
          bVal = b.discount_value || b.value || 0;
          break;
        case 'min_booking':
          aVal = a.min_booking_amount_vnd || a.min_booking_amount || 0;
          bVal = b.min_booking_amount_vnd || b.min_booking_amount || 0;
          break;
        case 'valid_to':
          aVal = a.effective_to || a.valid_until || '';
          bVal = b.effective_to || b.valid_until || '';
          break;
        case 'status':
          aVal = a.status === 'active' || a.is_active ? 1 : 0;
          bVal = b.status === 'active' || b.is_active ? 1 : 0;
          break;
        default:
          aVal = a.id;
          bVal = b.id;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredCoupons, sortField, sortOrder]);

  // LOGIC: Phân trang dữ liệu (Pagination)
  const totalItems = sortedCoupons.length;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCoupons = sortedCoupons.slice(startIndex, startIndex + pageSize);

  // LOGIC: Click phát 1 -> tăng dần, phát 2 -> giảm dần, phát 3 -> trở về như cũ
  const handleSort = (field: string) => {
    const sField = field as SortField;
    if (sortField !== sField) {
      setSortField(sField);
      setSortOrder('asc');
    } else {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else if (sortOrder === 'desc') {
        setSortField(null);
        setSortOrder('none');
      } else {
        setSortOrder('asc');
      }
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  // Reusable Columns Definition following Company Vibe
  const columns: Column<Coupon>[] = [
    {
      id: 'code',
      header: 'Mã Coupon',
      accessor: 'code',
      width: 'w-[160px]',
      sortable: true,
      visible: visibleColumns.code,
      cell: ({ row }) => (
        <span className="font-mono font-bold text-primary text-sm">
          <span className="bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
            {row.code}
          </span>
        </span>
      ),
    },
    {
      id: 'name',
      header: 'Tên Chương Trình',
      accessor: 'name',
      width: 'w-[220px]',
      sortable: true,
      visible: visibleColumns.name,
      cell: ({ row }) => (
        <span className="font-medium text-foreground truncate block" title={row.name || 'Mã ưu đãi'}>
          {row.name || 'Mã ưu đãi'}
        </span>
      ),
    },
    {
      id: 'value',
      header: 'Loại & Mức Giảm',
      accessor: 'discount_value',
      width: 'w-[150px]',
      sortable: true,
      visible: visibleColumns.value,
      cell: ({ row }: { row: any }) => {
        const discountVal = row.discount_value || row.value || 0;
        const isPercent = row.discount_type === 'percentage' || row.type === 'percentage';
        return isPercent ? (
          <div className="flex items-center gap-1 font-bold text-foreground">
            <Percent size={14} className="text-amber-500" /> Giảm {discountVal}%
          </div>
        ) : (
          <div className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
            <DollarSign size={14} /> Giảm {formatCurrency(discountVal)}
          </div>
        );
      },
    },
    {
      id: 'min_booking',
      header: 'Điều Kiện Đơn',
      accessor: 'min_booking_amount',
      width: 'w-[150px]',
      sortable: true,
      visible: visibleColumns.min_booking,
      cell: ({ row }: { row: any }) => {
        const minBooking = row.min_booking_amount_vnd || row.min_booking_amount || 0;
        return minBooking > 0 ? (
          <span className="text-muted-foreground">Đơn từ {formatCurrency(minBooking)}</span>
        ) : (
          <Badge variant="secondary" className="text-[11px] font-normal">
            Mọi đơn hàng
          </Badge>
        );
      },
    },
    {
      id: 'usage',
      header: 'Lượt Sử Dụng',
      width: 'w-[120px]',
      visible: visibleColumns.usage,
      cell: ({ row }: { row: any }) => (
        <div className="font-semibold text-foreground">
          {row.usage_count || 0} / {row.usage_limit || '∞'} lượt
        </div>
      ),
    },
    {
      id: 'valid_to',
      header: 'Hạn Hiệu Lực',
      accessor: 'effective_to',
      width: 'w-[180px]',
      sortable: true,
      visible: visibleColumns.valid_to,
      cell: ({ row }: { row: any }) => {
        const validFrom = row.effective_from ? row.effective_from.substring(0, 10) : row.valid_from || '';
        const validTo = row.effective_to ? row.effective_to.substring(0, 10) : row.valid_until || '';
        return (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium font-mono truncate">
            <Calendar size={12} /> {validFrom || 'Tự do'} ➔ {validTo || 'Vĩnh viễn'}
          </div>
        );
      },
    },
    {
      id: 'status',
      header: 'Trạng Thái',
      accessor: 'status',
      width: 'w-[140px]',
      sortable: true,
      visible: visibleColumns.status,
      cell: ({ row }: { row: any }) => {
        const isActive = row.status ? row.status === 'active' : Boolean(row.is_active);
        return isActive ? (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 whitespace-nowrap gap-1">
            <CheckCircle2 size={12} className="shrink-0" /> Kích hoạt
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 whitespace-nowrap gap-1">
            <XCircle size={12} className="shrink-0" /> Đã khóa
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Hành Động',
      width: 'w-[100px]',
      headClass: 'text-right',
      cellClass: 'text-right',
      cell: ({ row }: { row: any }) => (
        <div className="space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
            asChild
          >
            <Link
              to={'/coupons/$couponId/edit' as any}
              params={{ couponId: row.id } as any}
              title="Chỉnh sửa mã"
            >
              <Edit size={15} />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setDeleteTarget({ id: row.id, code: row.code || '' })}
            title="Xóa vĩnh viễn (Lưu Snapshot Audit Log)"
          >
            <Trash2 size={15} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Ticket className="h-6 w-6 text-primary" />
            Mã Khuyến Mãi
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCoupons}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </Button>
          <Button asChild size="sm" className="gap-1.5">
            <Link to={'/coupons/create' as any}>
              <Plus size={16} /> Tạo Mã Mới
            </Link>
          </Button>
        </div>
      </div>

      {/* API Error Alert */}
      {apiError && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive font-medium flex items-center gap-2.5">
          <AlertTriangle size={18} className="shrink-0 text-destructive" />
          <span>⚠️ Không thể lấy dữ liệu từ Backend API: {apiError}. Vui lòng kiểm tra lại Server Backend!</span>
        </div>
      )}

      {/* Filter & Column Toggle Bar */}
      <Card className="p-4 border shadow-xs">
        <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
          <div className="relative max-w-md w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo Mã voucher hoặc tên chương trình..."
              className="pl-9 font-mono"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 text-xs bg-background border border-input rounded-md text-foreground outline-none cursor-pointer focus:ring-1 focus:ring-ring"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Kích hoạt</option>
              <option value="inactive">Đã khóa</option>
            </select>

            {/* UI: Nút Cột (Column Toggle Dropdown) */}
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowColumnDropdown((prev) => !prev)}
                className="gap-1.5 text-xs font-semibold"
                title="Ẩn / Hiện các cột trong bảng"
              >
                <SlidersHorizontal size={14} className="text-primary" />
                <span>Cột</span>
              </Button>

              {showColumnDropdown && (
                <div className="absolute right-0 mt-2 w-52 bg-popover border border-border rounded-xl shadow-xl z-50 p-3 space-y-1.5">
                  <div className="flex items-center justify-end border-b border-border pb-1.5">
                    <button
                      onClick={resetColumns}
                      className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
                    >
                      Mặc định
                    </button>
                  </div>

                  <div className="space-y-1 max-h-56 overflow-y-auto pt-0.5">
                    {columnOptions.map((col) => (
                      <label
                        key={col.key}
                        className="flex items-center justify-between text-xs px-2 py-1 rounded-lg hover:bg-muted/60 cursor-pointer select-none"
                      >
                        <span className="text-foreground flex items-center gap-2 font-medium">
                          <input
                            type="checkbox"
                            checked={!!visibleColumns[col.key]}
                            onChange={() => toggleColumn(col.key)}
                            className="rounded border-input text-primary focus:ring-ring h-3.5 w-3.5"
                          />
                          {col.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Reusable Company Vibe DataTable Component */}
      <DataTable
        columns={columns}
        data={paginatedCoupons}
        loading={loading}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
        emptyText={apiError ? '⚠️ Không thể lấy dữ liệu từ Backend API.' : 'Không có mã khuyến mãi nào phù hợp.'}
      />

      {/* Reusable PaginationBar Component */}
      {!loading && (
        <PaginationBar
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      )}

      {/* Reusable ConfirmModal for Hard Deletion */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Xóa vĩnh viễn mã ${deleteTarget?.code}?`}
        description="Hệ thống sẽ tự động chụp bản snapshot lưu vào Audit Trail trước khi xóa cứng khỏi cơ sở dữ liệu."
        confirmLabel="Xác nhận xóa"
        cancelLabel="Bỏ qua"
        loading={deleting}
        onConfirm={executeDeleteCoupon}
      />
    </div>
  );
}
