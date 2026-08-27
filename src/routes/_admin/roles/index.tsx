import React, { useEffect, useMemo, useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Shield, Plus, Edit, Trash2, Lock, Users, Key } from 'lucide-react';
import { toast } from 'sonner';

import { deleteRole, getRoles } from '@/apis/users';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { AdminTablePage, ColumnDef } from '@/components/common/TableUtilities';
import { getPermissionLabel, sortPermissionsForAdmin } from './-permission-ui';
import { normalizeRolesResponse } from './-role-normalizer';

export interface RolesSearch {
  page?: number;
  search?: string;
}

export const Route = createFileRoute('/_admin/roles/')({
  validateSearch: (search: Record<string, unknown>): RolesSearch => {
    const result: RolesSearch = {};
    if (Number(search?.page) > 1) result.page = Number(search.page);
    if (typeof search?.search === 'string' && search.search.trim()) result.search = search.search.trim();
    return result;
  },
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
  const navigate = useNavigate({ from: Route.fullPath });
  const searchParams = Route.useSearch();

  const currentPage = searchParams.page || 1;
  const searchTerm = searchParams.search || '';

  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoleItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRoles = async () => {
    setLoading(true);
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
    }
  };

  const executeDeleteRole = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRole(deleteTarget.id);
      toast.success(`Đã xóa vai trò ${deleteTarget.display_name}`, { id: 'role-delete-toast' });
      setDeleteTarget(null);
      await fetchRoles();
    } catch (err: any) {
      console.error('Failed to delete role:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Không thể xóa vai trò trên Backend', { id: 'role-delete-toast' });
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchRoles();
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

  const filteredRoles = useMemo(() => {
    return roles.filter((r) => {
      const s = searchTerm.trim().toLowerCase();
      return (
        !s ||
        r.name.toLowerCase().includes(s) ||
        r.display_name.toLowerCase().includes(s) ||
        r.description.toLowerCase().includes(s)
      );
    });
  }, [roles, searchTerm]);

  const columns: ColumnDef<RoleItem>[] = [
    {
      key: 'name',
      label: 'VAI TRÒ',
      sortable: true,
      render: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="font-bold text-slate-900 dark:text-white">{row.display_name}</span>
            {row.is_system && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                <Lock size={10} /> Hệ thống
              </span>
            )}
          </div>
          <div className="font-mono text-[11px] text-slate-500">{row.name}</div>
        </div>
      ),
    },
    {
      key: 'description',
      label: 'MÔ TẢ',
      render: (row) => (
        <div className="max-w-sm text-xs text-slate-600 dark:text-slate-400">{row.description}</div>
      ),
    },
    {
      key: 'user_count',
      label: 'NHÂN VIÊN',
      align: 'center',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 text-xs">
          <Users size={13} /> {row.user_count}
        </span>
      ),
    },
    {
      key: 'permissions',
      label: 'QUYỀN API GÁN',
      render: (row) => (
        <div className="flex max-w-xl flex-wrap gap-1.5">
          {row.permissions.length > 0 ? (
            row.permissions.slice(0, 6).map((permission, idx) => (
              <Badge key={`${permission.name}-${idx}`} variant="outline" className="text-[11px] font-medium gap-1">
                <Key size={10} className="text-slate-400" />
                {getPermissionLabel(permission)}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-slate-400">Chưa gán quyền API</span>
          )}
          {row.permissions.length > 6 && (
            <Badge variant="secondary" className="text-[11px]">
              +{row.permissions.length - 6} quyền khác
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'THAO TÁC',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-blue-600 hover:text-blue-700 dark:text-blue-400"
            asChild
            title="Chỉnh sửa vai trò"
          >
            <Link to={'/roles/$roleId/edit' as any} params={{ roleId: row.id } as any}>
              <Edit size={15} />
            </Link>
          </Button>
          {row.is_system ? (
            <span
              className="inline-flex h-8 w-8 items-center justify-center text-slate-300 dark:text-slate-700"
              title="Vai trò hệ thống không thể xóa"
            >
              <Lock size={14} />
            </span>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-rose-600 hover:text-rose-700 dark:text-rose-400"
              onClick={() => setDeleteTarget(row)}
              title="Xóa vai trò"
            >
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
        title="Vai Trò &amp; Phân Quyền"
        subtitle="Quản lý vai trò nhân viên và quyền truy cập API trong dashboard Superdong"
        icon={Shield}
        apiError={apiError}
        searchValue={searchTerm}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Tìm vai trò, mô tả..."
        columns={columns}
        columnStorageKey="superdong_roles_columns"
        onRefresh={fetchRoles}
        refreshing={loading}
        createLink="/roles/create"
        createLabel="Tạo Vai Trò"
        data={filteredRoles}
        loading={loading}
        emptyText={apiError ? '⚠️ Không thể lấy dữ liệu từ Backend API.' : 'Không tìm thấy vai trò phù hợp.'}
        keyExtractor={(row) => row.id}
        entityLabel="vai trò"
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xác nhận xóa vai trò"
        description={deleteTarget ? `Bạn có chắc chắn muốn xóa vai trò "${deleteTarget.display_name}"? Thao tác này không thể hoàn tác.` : ''}
        confirmLabel="Xóa vai trò"
        loading={deleting}
        variant="destructive"
        onConfirm={executeDeleteRole}
      />
    </>
  );
}

