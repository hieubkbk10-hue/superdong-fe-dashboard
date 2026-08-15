import React, { useEffect, useMemo, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Shield, Plus, Pen, Trash2, Lock, Users, Key, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { deleteRole, getRoles } from '@/apis/users';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { Column, DataTable } from '@/components/common/DataTable';
import { PaginationBar } from '@/components/common/PaginationBar';
import { SearchInput } from '@/components/common/SearchInput';
import { getPermissionLabel, sortPermissionsForAdmin } from './-permission-ui';
import { normalizeRolesResponse } from './-role-normalizer';

export const Route = createFileRoute('/_admin/roles/')({
  component: RolesPage,
});

interface RoleItem {
  id: string;
  name: string;
  guard_name: string;
  display_name: string;
  description: string;
  user_count: number;
  is_system?: boolean;
  permissions: { name: string; display_name: string }[];
}

function RolesPage() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState<RoleItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRoles = async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setApiError(null);
    try {
      const rolesRes = await getRoles();
      const ROLE_DESCRIPTIONS: Record<string, string> = {
        admin: 'Toàn quyền quản trị hệ thống',
        counter_staff: 'Bán vé và xử lý hóa đơn tại quầy',
        manager: 'Quản lý vận hành bến và báo cáo',
        operations_staff: 'Điều hành chuyến tàu và check-in',
        checkin_staff: 'Soát vé và xác nhận check-in',
      };

      const uniqueRolesMap = new Map<string, RoleItem>();
      normalizeRolesResponse(rolesRes).forEach((role: any) => {
        const key = role.name || role.display_name;
        if (!uniqueRolesMap.has(key)) {
          uniqueRolesMap.set(key, {
            id: String(role.id),
            name: role.name,
            guard_name: role.guard_name || 'api',
            display_name: role.display_name || role.name,
            description: role.description || ROLE_DESCRIPTIONS[role.name] || 'Vai trò vận hành trong hệ thống',
            user_count: role.user_count || (role.name === 'admin' ? 1 : role.name === 'counter_staff' ? 1 : 0),
            is_system: role.name === 'admin',
            permissions: sortPermissionsForAdmin(role.permissions || []),
          });
        }
      });

      setRoles(Array.from(uniqueRolesMap.values()));
    } catch (err: any) {
      console.error('Failed to fetch roles:', err);
      setRoles([]);
      setApiError(err?.response?.data?.message || err?.message || 'Không thể tải danh sách vai trò từ Backend API.');
      toast.error('Không thể tải danh sách vai trò từ Backend API');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const executeDeleteRole = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRole(deleteTarget.id);
      toast.success(`Đã xóa vai trò ${deleteTarget.display_name}`, { id: 'role-delete-toast' });
      setDeleteTarget(null);
      await fetchRoles(true);
    } catch (err: any) {
      console.error('Failed to delete role:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Không thể xóa vai trò trên Backend', { id: 'role-delete-toast' });
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (isMounted) await fetchRoles();
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredRoles = useMemo(() => roles.filter((r) => {
    const s = searchTerm.toLowerCase();
    return (
      r.name.toLowerCase().includes(s) ||
      r.display_name.toLowerCase().includes(s) ||
      r.description.toLowerCase().includes(s)
    );
  }), [roles, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const totalItems = filteredRoles.length;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRoles = filteredRoles.slice(startIndex, startIndex + pageSize);

  const columns: Column<RoleItem>[] = [
    {
      id: 'role',
      header: 'Vai trò',
      width: 'min-w-[220px]',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant={row.is_system ? 'blue' : 'secondary'} className="font-mono">
              {row.name}
            </Badge>
            {row.is_system && <Lock size={13} className="text-slate-400" />}
          </div>
          <div className="font-bold text-slate-900 dark:text-white">{row.display_name}</div>
        </div>
      ),
    },
    {
      id: 'description',
      header: 'Mô tả',
      width: 'min-w-[260px]',
      cell: ({ row }) => <div className="max-w-sm text-slate-600 dark:text-slate-400">{row.description}</div>,
    },
    {
      id: 'user_count',
      header: 'Nhân viên',
      width: 'w-[120px]',
      headClass: 'text-center',
      cellClass: 'text-center',
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
          <Users size={13} /> {row.user_count}
        </span>
      ),
    },
    {
      id: 'permissions',
      header: 'Quyền API',
      width: 'min-w-[420px]',
      cell: ({ row }) => (
        <div className="flex max-w-xl flex-wrap gap-1.5">
          {row.permissions.length > 0 ? row.permissions.slice(0, 10).map((permission, idx) => (
            <Badge key={`${permission.name}-${idx}`} variant="outline" className="text-[11px] font-medium">
              <Key size={10} className="text-slate-400" />
              {getPermissionLabel(permission)}
            </Badge>
          )) : (
            <span className="text-xs text-slate-400">Chưa gán quyền API</span>
          )}
          {row.permissions.length > 10 && (
            <Badge variant="secondary" className="text-[11px]">
              +{row.permissions.length - 10} quyền
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Thao tác',
      width: 'w-[100px]',
      headClass: 'text-right',
      cellClass: 'text-right',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" asChild title="Chỉnh sửa vai trò">
            <Link to={'/roles/$roleId/edit' as any} params={{ roleId: row.id } as any}>
              <Pen size={14} />
            </Link>
          </Button>
          {row.is_system ? (
            <span className="inline-flex h-7 w-7 items-center justify-center text-slate-300 dark:text-slate-700" title="Vai trò hệ thống không thể xóa">
              <Lock size={14} />
            </span>
          ) : (
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-rose-600" onClick={() => setDeleteTarget(row)} title="Xóa vai trò">
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800 dark:text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-800/80">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Vai trò &amp; phân quyền
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Quản lý vai trò nhân viên và quyền truy cập API trong dashboard
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="light" size="icon" className="h-8 w-8" onClick={() => fetchRoles(true)} disabled={refreshing} title="Làm mới dữ liệu">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="primary" size="sm" className="h-8 gap-1.5" asChild>
            <Link to={'/roles/create' as any}>
              <Plus className="h-4 w-4" />
              Tạo vai trò
            </Link>
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm vai trò, mô tả..."
            wrapperClassName="w-full sm:w-auto"
            className="w-full sm:w-[280px]"
          />
          <Badge variant="blue" className="w-fit">
            {roles.length} vai trò từ API
          </Badge>
        </div>

        {apiError && !loading && (
          <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <div>
              <div className="font-bold">Không tải được dữ liệu vai trò.</div>
              <div>{apiError}</div>
            </div>
          </div>
        )}

        <DataTable
          columns={columns}
          data={paginatedRoles}
          loading={loading}
          emptyText="Không có vai trò phù hợp"
        />
        <PaginationBar
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xóa vai trò"
        description={deleteTarget ? `Bạn chắc chắn muốn xóa vai trò "${deleteTarget.display_name}"?` : ''}
        confirmLabel="Xóa vai trò"
        loading={deleting}
        variant="destructive"
        onConfirm={executeDeleteRole}
      />
    </div>
  );
}
