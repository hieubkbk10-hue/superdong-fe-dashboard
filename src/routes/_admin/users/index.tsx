import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  UserCheck,
  Plus,
  Pen,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
  SlidersHorizontal,
  Mail,
  Phone,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';

import { User } from '@/types';
import { getUsers, deleteUser } from '@/apis/users';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { SearchInput } from '@/components/common/SearchInput';
import { DataTable, Column } from '@/components/common/DataTable';
import { PaginationBar } from '@/components/common/PaginationBar';
import { ConfirmModal } from '@/components/common/ConfirmModal';

export const Route = createFileRoute('/_admin/users/')({
  component: UsersPage,
});

type SortField = 'id' | 'name' | 'email' | 'phone' | 'role' | 'status' | null;
type SortOrder = 'asc' | 'desc' | 'none';

function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Confirmation Modal state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string | number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 3-State Sorting
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('none');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // STORAGE KEY: Persistent Column Visibility in localStorage
  const STORAGE_KEY_COLUMNS = 'superdong_users_visible_columns';
  const DEFAULT_COLUMNS: Record<string, boolean> = {
    id: true,
    user_info: true,
    phone: true,
    role: true,
    status: true,
  };

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COLUMNS);
      if (saved) {
        return { ...DEFAULT_COLUMNS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load column visibility from localStorage:', e);
    }
    return DEFAULT_COLUMNS;
  });
  const [showColumnDropdown, setShowColumnDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const columnOptions = [
    { key: 'id', label: 'ID Nhân Viên' },
    { key: 'user_info', label: 'Họ Tên & Email' },
    { key: 'phone', label: 'Số Điện Thoại' },
    { key: 'role', label: 'Vai Trò / Phân Quyền' },
    { key: 'status', label: 'Trạng Thái' },
  ];

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(STORAGE_KEY_COLUMNS, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const resetColumns = () => {
    setVisibleColumns(DEFAULT_COLUMNS);
    try {
      localStorage.setItem(STORAGE_KEY_COLUMNS, JSON.stringify(DEFAULT_COLUMNS));
    } catch (e) {}
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowColumnDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUsersFromApi = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await getUsers();
      if (res && res.data && Array.isArray(res.data)) {
        setUsers(res.data);
      } else {
        setUsers([]);
      }
    } catch (err: any) {
      console.error('API Error:', err);
      setUsers([]);
      setApiError(err?.response?.data?.message || err?.message || 'Không thể kết nối với Backend API');
      toast.error('Không thể lấy dữ liệu người dùng từ Backend API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersFromApi();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter, pageSize]);

  const executeDeleteUser = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
      toast.success(`Đã vô hiệu hóa vĩnh viễn tài khoản ${deleteTarget.name} thành công (Đã lưu Audit Log)!`, {
        id: 'user-delete-toast',
      });
      setDeleteTarget(null);
      await fetchUsersFromApi();
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      const serverMsg = err?.response?.data?.message || err?.message || '';
      toast.error(serverMsg || 'Có lỗi xảy ra khi xóa tài khoản trên Backend', { id: 'user-delete-toast' });
    } finally {
      setDeleting(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const name = u.name || '';
      const email = u.email || '';
      const phone = u.phone || '';
      const search = searchTerm.toLowerCase().trim();
      const matchesSearch = name.toLowerCase().includes(search) || email.toLowerCase().includes(search) || phone.includes(search);

      const userRole = u.roles?.[0]?.name || (u as any).role || '';
      const matchesRole = roleFilter === 'all' || userRole === roleFilter;

      const userStatus = u.status || 'active';
      const matchesStatus = statusFilter === 'all' || userStatus === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const sortedUsers = useMemo(() => {
    if (!sortField || sortOrder === 'none') {
      return filteredUsers;
    }

    return [...filteredUsers].sort((a: any, b: any) => {
      let aVal: any = '';
      let bVal: any = '';

      switch (sortField) {
        case 'id':
          aVal = Number(a.id) || 0;
          bVal = Number(b.id) || 0;
          break;
        case 'name':
          aVal = (a.name || '').toLowerCase();
          bVal = (b.name || '').toLowerCase();
          break;
        case 'email':
          aVal = (a.email || '').toLowerCase();
          bVal = (b.email || '').toLowerCase();
          break;
        case 'phone':
          aVal = a.phone || '';
          bVal = b.phone || '';
          break;
        case 'role':
          aVal = (a.roles?.[0]?.name || a.role || '').toLowerCase();
          bVal = (b.roles?.[0]?.name || b.role || '').toLowerCase();
          break;
        case 'status':
          aVal = a.status === 'active' ? 1 : 0;
          bVal = b.status === 'active' ? 1 : 0;
          break;
        default:
          aVal = a.id;
          bVal = b.id;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredUsers, sortField, sortOrder]);

  const totalItems = sortedUsers.length;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedUsers = sortedUsers.slice(startIndex, startIndex + pageSize);

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

  const columns: Column<User>[] = [
    {
      id: 'id',
      header: 'ID Nhân Viên',
      accessor: 'id',
      width: 'w-[120px]',
      sortable: true,
      visible: visibleColumns.id,
      cell: ({ row }) => (
        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
          <span className="bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800/80">
            #{row.id}
          </span>
        </span>
      ),
    },
    {
      id: 'user_info',
      header: 'Họ Tên & Email',
      accessor: 'name',
      width: 'w-[260px]',
      sortable: true,
      visible: visibleColumns.user_info,
      cell: ({ row }) => {
        const initials = row.name
          ? row.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
          : 'NV';
        return (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs font-mono">
              {initials}
            </div>
            <div className="flex flex-col truncate">
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">
                {row.name || 'Cán bộ nhân viên'}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                <Mail size={12} className="shrink-0 text-slate-400" /> {row.email || 'N/A'}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      id: 'phone',
      header: 'Số Điện Thoại',
      accessor: 'phone',
      width: 'w-[160px]',
      sortable: true,
      visible: visibleColumns.phone,
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-mono text-xs">
          <Phone size={13} className="text-slate-400" />
          {row.phone || 'Chưa cập nhật'}
        </div>
      ),
    },
    {
      id: 'role',
      header: 'Vai Trò / Phân Quyền',
      accessor: 'role',
      width: 'w-[180px]',
      sortable: true,
      visible: visibleColumns.role,
      cell: ({ row }: { row: any }) => {
        const roleName = row.roles?.[0]?.name || row.role || 'Nhân viên';
        let variant: any = 'secondary';
        if (roleName.toLowerCase().includes('admin') || roleName.toLowerCase().includes('super')) {
          variant = 'blue';
        } else if (roleName.toLowerCase().includes('quản lý') || roleName.toLowerCase().includes('manager')) {
          variant = 'warning';
        }
        return (
          <Badge variant={variant} className="gap-1">
            <Shield size={12} className="shrink-0" /> {roleName}
          </Badge>
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
        const isActive = row.status ? row.status === 'active' : true;
        return isActive ? (
          <Badge variant="success">
            <CheckCircle2 size={12} className="shrink-0 text-emerald-600 dark:text-emerald-400" /> Kích hoạt
          </Badge>
        ) : (
          <Badge variant="danger">
            <XCircle size={12} className="shrink-0 text-rose-600 dark:text-rose-400" /> Đã khóa
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
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50"
            asChild
          >
            <Link
              to={'/users/$userId/edit' as any}
              params={{ userId: row.id } as any}
              title="Chỉnh sửa thông tin"
            >
              <Pen size={14} />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
            onClick={() => setDeleteTarget({ id: row.id, name: row.name || '' })}
            title="Vô hiệu hóa tài khoản (Lưu Audit Trail)"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col bg-white dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs font-sans text-slate-800 dark:text-slate-200 space-y-4">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-800/80">
        <h1 className="text-lg font-bold capitalize flex items-center gap-2 text-slate-900 dark:text-white">
          <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Danh sách tài khoản &amp; phân quyền
        </h1>
        
        <div className="flex items-center gap-2">
          <Button
            variant="light"
            size="sm"
            onClick={fetchUsersFromApi}
            disabled={loading}
            className="h-8 gap-1.5 text-[13px]"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </Button>
          
          <Button
            variant="primary"
            size="sm"
            asChild
            className="h-8 gap-1.5 text-[13px]"
          >
            <Link to={'/users/create' as any}>
              <Plus className="h-4 w-4" />
              Tạo tài khoản mới
            </Link>
          </Button>
        </div>
      </div>

      {/* API Error Alert */}
      {apiError && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0 text-rose-500" />
          <span>⚠️ Không thể lấy dữ liệu từ Backend API: {apiError}. Vui lòng kiểm tra lại Server Backend!</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex w-full flex-wrap items-center gap-2">
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm tên, email hoặc SĐT nhân viên..."
        />

        {/* Role Filter Select */}
        <div className="flex items-center gap-1.5 text-[13px]">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 px-3 text-[13px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-md text-slate-800 dark:text-slate-200 outline-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-700"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="Super Admin">Super Admin</option>
            <option value="Quản trị viên">Quản trị viên</option>
            <option value="Nhân viên quầy">Nhân viên quầy</option>
          </select>
        </div>

        {/* Status Filter Select */}
        <div className="flex items-center gap-1.5 text-[13px]">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 text-[13px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-md text-slate-800 dark:text-slate-200 outline-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-700"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Kích hoạt</option>
            <option value="inactive">Đã khóa</option>
          </select>
        </div>

        {/* Column Toggle Dropdown */}
        <div className="relative ml-auto" ref={dropdownRef}>
          <Button
            variant="light"
            size="sm"
            onClick={() => setShowColumnDropdown((prev) => !prev)}
            className="h-9 gap-1.5 text-[13px]"
            title="Ẩn / Hiện các cột trong bảng"
          >
            <SlidersHorizontal size={14} className="text-blue-600 dark:text-blue-400" />
            <span>Cột</span>
          </Button>

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
                    className="flex items-center justify-between text-xs px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer select-none"
                  >
                    <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2 font-medium">
                      <input
                        type="checkbox"
                        checked={!!visibleColumns[col.key]}
                        onChange={() => toggleColumn(col.key)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
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

      {/* Reusable DataTable Component */}
      <DataTable
        columns={columns}
        data={paginatedUsers}
        loading={loading}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
        emptyText={apiError ? '⚠️ Không thể lấy dữ liệu từ Backend API.' : 'Không có nhân viên nào phù hợp.'}
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

      {/* Reusable ConfirmModal for User Deletion */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Vô hiệu hóa tài khoản ${deleteTarget?.name}?`}
        description="Tài khoản này sẽ bị khóa quyền truy cập hệ thống và lưu bản chụp Snapshot vào Audit Trail."
        confirmLabel="Xác nhận vô hiệu hóa"
        cancelLabel="Bỏ qua"
        loading={deleting}
        onConfirm={executeDeleteUser}
      />
    </div>
  );
}
