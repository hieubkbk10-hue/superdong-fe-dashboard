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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { Coupon } from '@/types';
import { getCoupons, deleteCoupon } from '@/apis/pricing';

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
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

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
    { key: 'code', label: 'Mã Coupon', essential: true },
    { key: 'name', label: 'Tên Chương Trình', essential: true },
    { key: 'value', label: 'Loại & Mức Giảm', essential: true },
    { key: 'min_booking', label: 'Điều Kiện Đơn', essential: false },
    { key: 'usage', label: 'Lượt Sử Dụng', essential: false },
    { key: 'valid_to', label: 'Hạn Hiệu Lực', essential: false },
    { key: 'status', label: 'Trạng Thái', essential: true },
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

  const handleDeleteCoupon = async (id: string | number, code: string) => {
    if (
      !window.confirm(
        `XÁC NHẬN XÓA CỨNG MÃ KHUYẾN MÃI: ${code}?\n\nHệ thống sẽ tự động lưu bản chụp Snapshot vào Nhật ký Kiểm toán (Audit Trail) trước khi xóa vĩnh viễn khỏi cơ sở dữ liệu.`
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteCoupon(id);
      toast.success(`Đã xóa vĩnh viễn mã khuyến mãi ${code} thành công (Đã lưu Audit Snapshot)!`, {
        id: 'coupon-delete-toast',
      });
      await fetchCoupons();
    } catch (err: any) {
      console.error('Failed to delete coupon:', err);
      const serverMsg = err?.response?.data?.message || err?.message || '';
      toast.error(serverMsg || 'Có lỗi xảy ra khi xóa mã khuyến mãi trên Backend', { id: 'coupon-delete-toast' });
    } finally {
      setDeletingId(null);
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

      const isActive = c.status ? c.status === 'active' : c.is_active;
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
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCoupons = sortedCoupons.slice(startIndex, startIndex + pageSize);

  // LOGIC: Click phát 1 -> tăng dần, phát 2 -> giảm dần, phát 3 -> trở về như cũ
  const handleSort = (field: SortField) => {
    if (sortField !== field) {
      setSortField(field);
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

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field || sortOrder === 'none') {
      return <ArrowUpDown size={13} className="text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp size={13} className="text-blue-600 dark:text-blue-400 font-bold" />
    ) : (
      <ArrowDown size={13} className="text-blue-600 dark:text-blue-400 font-bold" />
    );
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  // Compute total visible columns for colSpan
  const visibleColCount = Object.values(visibleColumns).filter(Boolean).length + 1;

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Ticket className="h-6 w-6 text-blue-600" />
            Mã Khuyến Mãi
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCoupons}
            disabled={loading}
            className="h-10 px-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>
          <Link
            to={'/coupons/create' as any}
            className="h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Plus size={16} /> Tạo Mã Mới
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

      {/* Filter & Column Toggle Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
        <div className="relative max-w-md w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo Mã voucher hoặc tên chương trình..."
            className="w-full h-10 pl-9 pr-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 outline-none cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Kích hoạt</option>
            <option value="inactive">Đã khóa</option>
          </select>

          {/* UI: Nút Cột (Column Toggle Dropdown) */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowColumnDropdown((prev) => !prev)}
              className="h-10 px-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Ẩn / Hiện các cột trong bảng"
            >
              <SlidersHorizontal size={14} className="text-blue-600 dark:text-blue-400" />
              <span>Cột</span>
            </button>

            {showColumnDropdown && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-3 space-y-1.5">
                <div className="flex items-center justify-end border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  <button
                    onClick={resetColumns}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                  >
                    Mặc định
                  </button>
                </div>

                <div className="space-y-1 max-h-56 overflow-y-auto pt-0.5">
                  {columnOptions.map((col) => (
                    <label
                      key={col.key}
                      className="flex items-center justify-between text-xs px-2 py-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer select-none"
                    >
                      <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2 font-medium">
                        <input
                          type="checkbox"
                          checked={!!visibleColumns[col.key]}
                          onChange={() => toggleColumn(col.key)}
                          className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
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

      {/* UI: Cấu hình colgroup và table-layout: fixed cho bảng mật độ dữ liệu cao theo quy chuẩn công ty */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm table-fixed">
            <colgroup>
              {visibleColumns.code && <col className="w-[160px]" />}
              {visibleColumns.name && <col className="w-[220px]" />}
              {visibleColumns.value && <col className="w-[150px]" />}
              {visibleColumns.min_booking && <col className="w-[150px]" />}
              {visibleColumns.usage && <col className="w-[120px]" />}
              {visibleColumns.valid_to && <col className="w-[180px]" />}
              {visibleColumns.status && <col className="w-[140px]" />}
              <col className="w-[100px]" />
            </colgroup>
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800 text-xs">
              <tr>
                {visibleColumns.code && (
                  <th
                    onClick={() => handleSort('code')}
                    className="p-3.5 cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      Mã Coupon {renderSortIcon('code')}
                    </div>
                  </th>
                )}

                {visibleColumns.name && (
                  <th
                    onClick={() => handleSort('name')}
                    className="p-3.5 cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      Tên Chương Trình {renderSortIcon('name')}
                    </div>
                  </th>
                )}

                {visibleColumns.value && (
                  <th
                    onClick={() => handleSort('value')}
                    className="p-3.5 cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      Loại &amp; Mức Giảm {renderSortIcon('value')}
                    </div>
                  </th>
                )}

                {visibleColumns.min_booking && (
                  <th
                    onClick={() => handleSort('min_booking')}
                    className="p-3.5 cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      Điều Kiện Đơn {renderSortIcon('min_booking')}
                    </div>
                  </th>
                )}

                {visibleColumns.usage && <th className="p-3.5">Lượt Sử Dụng</th>}

                {visibleColumns.valid_to && (
                  <th
                    onClick={() => handleSort('valid_to')}
                    className="p-3.5 cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      Hạn Hiệu Lực {renderSortIcon('valid_to')}
                    </div>
                  </th>
                )}

                {visibleColumns.status && (
                  <th
                    onClick={() => handleSort('status')}
                    className="p-3.5 cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      Trạng Thái {renderSortIcon('status')}
                    </div>
                  </th>
                )}

                <th className="p-3.5 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={visibleColCount} className="p-8 text-center text-slate-500">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" />
                    Đang tải dữ liệu từ Backend API...
                  </td>
                </tr>
              ) : paginatedCoupons.length === 0 ? (
                <tr>
                  <td colSpan={visibleColCount} className="p-8 text-center text-slate-500">
                    {apiError ? '⚠️ Không thể lấy dữ liệu từ Backend API.' : 'Không có mã khuyến mãi nào phù hợp.'}
                  </td>
                </tr>
              ) : (
                paginatedCoupons.map((c: any) => {
                  const isActive = c.status ? c.status === 'active' : c.is_active;
                  const discountVal = c.discount_value || c.value || 0;
                  const isPercent = c.discount_type === 'percentage' || c.type === 'percentage';
                  const minBooking = c.min_booking_amount_vnd || c.min_booking_amount || 0;
                  const validFrom = c.effective_from ? c.effective_from.substring(0, 10) : c.valid_from || '';
                  const validTo = c.effective_to ? c.effective_to.substring(0, 10) : c.valid_until || '';

                  return (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      {visibleColumns.code && (
                        <td className="p-3.5 font-mono font-bold text-blue-600 text-sm truncate">
                          <span className="bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded-md border border-blue-200/60 dark:border-blue-800">
                            {c.code}
                          </span>
                        </td>
                      )}

                      {visibleColumns.name && (
                        <td className="p-3.5 font-medium text-slate-900 dark:text-white truncate" title={c.name || 'Mã ưu đãi'}>
                          {c.name || 'Mã ưu đãi'}
                        </td>
                      )}

                      {visibleColumns.value && (
                        <td className="p-3.5">
                          {isPercent ? (
                            <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-white">
                              <Percent size={14} className="text-amber-500" /> Giảm {discountVal}%
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                              <DollarSign size={14} /> Giảm {formatCurrency(discountVal)}
                            </div>
                          )}
                        </td>
                      )}

                      {visibleColumns.min_booking && (
                        <td className="p-3.5 text-slate-600 dark:text-slate-300 truncate">
                          {minBooking > 0 ? (
                            <span>Đơn từ {formatCurrency(minBooking)}</span>
                          ) : (
                            <span className="text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 font-medium">
                              Mọi đơn hàng
                            </span>
                          )}
                        </td>
                      )}

                      {visibleColumns.usage && (
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {c.usage_count || 0} / {c.usage_limit || '∞'} lượt
                          </div>
                        </td>
                      )}

                      {visibleColumns.valid_to && (
                        <td className="p-3.5 text-[11px] text-slate-500 font-medium font-mono truncate">
                          <div className="flex items-center gap-1">
                            <Calendar size={12} /> {validFrom || 'Tự do'} ➔ {validTo || 'Vĩnh viễn'}
                          </div>
                        </td>
                      )}

                      {visibleColumns.status && (
                        <td className="p-3.5">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                              <CheckCircle2 size={12} className="shrink-0" /> Kích hoạt
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 whitespace-nowrap">
                              <XCircle size={12} className="shrink-0" /> Đã khóa
                            </span>
                          )}
                        </td>
                      )}

                      <td className="p-3.5 text-right space-x-1">
                        <Link
                          to={'/coupons/$couponId/edit' as any}
                          params={{ couponId: c.id } as any}
                          className="p-1.5 inline-flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 cursor-pointer"
                          title="Chỉnh sửa mã"
                        >
                          <Edit size={15} />
                        </Link>
                        <button
                          onClick={() => handleDeleteCoupon(c.id, c.code || '')}
                          disabled={deletingId === c.id}
                          className="p-1.5 inline-flex items-center justify-center rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 cursor-pointer disabled:opacity-50"
                          title="Xóa vĩnh viễn (Lưu Snapshot Audit Log)"
                        >
                          {deletingId === c.id ? <RefreshCw size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {!loading && totalItems > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span>Hiển thị <strong>{startIndex + 1}</strong> - <strong>{Math.min(startIndex + pageSize, totalItems)}</strong> trong tổng số <strong>{totalItems}</strong> mã</span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <div className="flex items-center gap-1.5">
                <span>Số dòng/trang:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="h-7 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs outline-none cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                title="Trang đầu"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                title="Trang trước"
              >
                <ChevronLeft size={16} />
              </button>
              
              <span className="px-3 font-semibold text-slate-900 dark:text-slate-100">
                Trang {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                title="Trang sau"
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                title="Trang cuối"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
