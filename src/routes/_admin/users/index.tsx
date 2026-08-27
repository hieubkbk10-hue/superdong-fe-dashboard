import React, { useState, useEffect, useMemo } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import {
  UserCheck,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  Shield,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';

import { User } from '@/types';
import { getUsers, deleteUser, getRoles } from '@/apis/users';
import { Button } from '@/components/common/Button';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { AdminTablePage, ColumnDef, FilterOption } from '@/components/common/TableUtilities';

export interface UsersSearch {
  page?: number;
  search?: string;
  role?: string;
  status?: string;
}

export const Route = createFileRoute('/_admin/users/')({
  validateSearch: (search: Record<string, unknown>): UsersSearch => {
    const result: UsersSearch = {};
    if (Number(search?.page) > 1) result.page = Number(search.page);
    if (typeof search?.search === 'string' && search.search.trim()) result.search = search.search.trim();
    if (typeof search?.role === 'string' && search.role !== 'all') result.role = search.role;
    if (typeof search?.status === 'string' && search.status !== 'all') result.status = search.status;
    return result;
  },
  component: UsersPage,
});

export const normalizeRoleName = (rawName: string): string => {
  if (!rawName) return 'Counter Staff';
  const norm = String(rawName).trim();
  if (norm === 'admin' || norm === 'Administrator' || norm === 'Super Admin') return 'Super Admin';
  if (norm === 'counter_staff' || norm === 'Counter Staff' || norm === 'Nhân viên quầy') return 'Counter Staff';
  if (norm === 'manager' || norm === 'Manager' || norm === 'Quản trị viên') return 'Manager';
  if (norm === 'operations_staff' || norm === 'Operations Staff' || norm === 'Nhân viên điều hành') return 'Operations Staff';
  if (norm === 'checkin_staff' || norm === 'Check-in Staff' || norm === 'Nhân viên soát vé') return 'Check-in Staff';
  return norm;
};

const getUserRoleName = (row: any): string => {
  if (!row) return 'Counter Staff';

  if (row.roles?.data && Array.isArray(row.roles.data) && row.roles.data.length > 0) {
    const apiRole = row.roles.data.find((role: any) => (role.guard_name || 'api') === 'api') || row.roles.data[0];
    return apiRole.display_name || normalizeRoleName(apiRole.name);
  }
  if (row.roles && Array.isArray(row.roles) && row.roles.length > 0) {
    const apiRole = row.roles.find((role: any) => typeof role !== 'string' && (role.guard_name || 'api') === 'api') || row.roles[0];
    return typeof apiRole === 'string' ? normalizeRoleName(apiRole) : (apiRole.display_name || normalizeRoleName(apiRole.name));
  }
  if (row.role_name) {
    return normalizeRoleName(row.role_name);
  }
  return 'Counter Staff';
};

export interface UserRow {
  id: string | number;
  name: string;
  email: string;
  phone: string;
  roleName: string;
  isSuperAdmin: boolean;
  status: 'active' | 'inactive';
}

const statusOptions: FilterOption[] = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Đã vô hiệu hóa' },
];

function UsersPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const searchParams = Route.useSearch();

  const currentPage = searchParams.page || 1;
  const searchTerm = searchParams.search || '';
  const statusFilter = searchParams.status || 'all';
  const roleFilter = searchParams.role || 'all';

  const [users, setUsers] = useState<User[]>([]);
  const [dynamicRoles, setDynamicRoles] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Confirmation Modal state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string | number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await getRoles();
        if (res && res.data && Array.isArray(res.data)) {
          const apiRolesOnly = res.data.filter((r: any) => (r.guard_name || 'api') === 'api');
          const opts = apiRolesOnly.map((r: any) => {
            const display = r.display_name || normalizeRoleName(r.name);
            return { value: display, label: display };
          });
          const uniqueOpts = Array.from(new Map(opts.map((item: any) => [item.value, item])).values()) as { value: string; label: string }[];
          setDynamicRoles(uniqueOpts);
        }
      } catch (_) {}
    };
    fetchRoles();
  }, []);

  const fetchUsersFromApi = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await getUsers();
      if (res && res.data && Array.isArray(res.data)) {
        const mergedUsers = res.data.map((u: any) => {
          const cacheKey = `superdong_user_cache_${u.id}`;
          try {
            const cachedStr = localStorage.getItem(cacheKey);
            if (cachedStr) {
              const cached = JSON.parse(cachedStr);
              return {
                ...u,
                name: cached.name || u.name,
                email: cached.email || u.email,
                phone: cached.phone || u.phone,
                role_name: cached.role_name || u.role_name,
                status: cached.is_active !== undefined ? (cached.is_active ? 'active' : 'inactive') : (u.status || 'active'),
              };
            }
          } catch (_) {}
          return u;
        });
        setUsers(mergedUsers);
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

  const executeDeleteUser = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
      toast.success(`Đã vô hiệu hóa tài khoản ${deleteTarget.name} thành công!`);
      setDeleteTarget(null);
      await fetchUsersFromApi();
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      const serverMsg = err?.response?.data?.message || err?.message || '';
      toast.error(serverMsg || 'Có lỗi xảy ra khi xóa tài khoản trên Backend');
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
      const matchesSearch = !search || name.toLowerCase().includes(search) || email.toLowerCase().includes(search) || phone.includes(search);

      const userRole = getUserRoleName(u);
      const matchesRole = roleFilter === 'all' || userRole === roleFilter;

      const userStatus = u.status || 'active';
      const matchesStatus = statusFilter === 'all' || userStatus === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const mappedData: UserRow[] = useMemo(() => {
    return filteredUsers.map((u: any) => {
      const roleName = getUserRoleName(u);
      const isSuperAdmin = u.email === 'admin@admin.com' || roleName === 'Super Admin';
      const status = u.status === 'inactive' ? 'inactive' : 'active';
      return {
        id: u.id,
        name: u.name || '',
        email: u.email || '',
        phone: u.phone || '',
        roleName,
        isSuperAdmin,
        status,
      };
    });
  }, [filteredUsers]);

  const columns: ColumnDef<UserRow>[] = [
    {
      key: 'name',
      label: 'HỌ VÀ TÊN',
      sortable: true,
      render: (u) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            {u.name}
            {u.isSuperAdmin && (
              <span className="text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-1.5 py-0.2 rounded font-semibold">
                ROOT
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'EMAIL LIÊN HỆ',
      sortable: true,
      render: (u) => (
        <span className="text-slate-600 dark:text-slate-400 font-mono text-xs flex items-center gap-1">
          <Mail size={13} className="text-slate-400" /> {u.email || <span className="text-slate-400 font-sans">Chưa cập nhật</span>}
        </span>
      ),
    },
    {
      key: 'phone',
      label: 'SỐ ĐIỆN THOẠI',
      sortable: true,
      render: (u) => (
        <span className="text-slate-600 dark:text-slate-400 font-mono text-xs flex items-center gap-1">
          <Phone size={13} className="text-slate-400" /> {u.phone || <span className="text-slate-400 font-sans">Chưa cập nhật</span>}
        </span>
      ),
    },
    {
      key: 'roleName',
      label: 'VAI TRÒ VẬN HÀNH',
      sortable: true,
      render: (u) => (
        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
          <Shield size={12} /> {u.roleName}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'TRẠNG THÁI',
      sortable: true,
      render: (u) =>
        u.status === 'active' ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 size={12} /> Hoạt động
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
            <XCircle size={12} /> Vô hiệu hóa
          </span>
        ),
    },
    {
      key: 'actions',
      label: 'THAO TÁC',
      align: 'right',
      render: (u) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 dark:text-blue-400" asChild>
            <Link to={'/users/$userId/edit' as any} params={{ userId: String(u.id) } as any} title="Chỉnh sửa thông tin tài khoản">
              <Edit size={15} />
            </Link>
          </Button>
          {u.isSuperAdmin ? (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 cursor-not-allowed opacity-50" disabled title="Tài khoản Super Admin gốc hệ thống - Không thể xóa">
              <Lock size={15} />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600 hover:text-rose-700 dark:text-rose-400" onClick={() => setDeleteTarget({ id: u.id, name: u.name })} title="Vô hiệu hóa tài khoản">
              <Trash2 size={15} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <AdminTablePage
        title="Quản Lý Tài Khoản & Phân Quyền"
        subtitle="Quản lý tài khoản nhân viên, phân quyền truy cập hệ thống và trạng thái hoạt động"
        icon={UserCheck}
        apiError={apiError}
        searchValue={searchTerm}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Tìm theo tên, email hoặc số điện thoại..."
        filterValue={statusFilter}
        onFilterChange={handleStatusFilterChange}
        filterOptions={statusOptions}
        columns={columns}
        columnStorageKey="superdong_users_columns"
        onRefresh={fetchUsersFromApi}
        refreshing={loading}
        createLink="/users/create"
        createLabel="Thêm Nhân Viên Mới"
        data={mappedData}
        loading={loading}
        emptyText="Chưa có thông tin nhân viên nào phù hợp với bộ lọc."
        keyExtractor={(u) => String(u.id)}
        entityLabel="người dùng"
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Xác nhận vô hiệu hóa tài khoản"
        description={`Bạn có chắc chắn muốn vô hiệu hóa tài khoản "${deleteTarget?.name}"? Tài khoản này sẽ không thể đăng nhập vào hệ thống.`}
        confirmLabel={deleting ? 'Đang xử lý...' : 'Vô hiệu hóa'}
        loading={deleting}
        variant="destructive"
        onConfirm={executeDeleteUser}
      />
    </>
  );
}

