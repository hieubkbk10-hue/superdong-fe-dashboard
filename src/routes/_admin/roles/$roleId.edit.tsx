import React, { useEffect, useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Lock, RefreshCw, Shield } from 'lucide-react';
import { toast } from 'sonner';

import { findRoleById, getPermissions, syncRolePermissions, updateRole } from '@/apis/users';
import { Badge } from '@/components/common/Badge';
import { Permission } from '@/types';
import { getPermissionGroupLabel, getPermissionLabel, sortPermissionsForAdmin } from '@/helpers/permissionUi';
import { normalizeApiatoCollection, normalizeRoleItem } from '@/helpers/roleNormalizer';
import {
  AdminFormHeader,
  AdminFormCard,
  FormSectionBlock,
  FormField,
  FormInputField,
  UnsavedChangesBar,
  useFormDirty,
} from '@/components/common/FormUtilities';

export const Route = createFileRoute('/_admin/roles/$roleId/edit')({
  component: RoleEditPage,
});

interface RoleFormData {
  name: string;
  display_name: string;
  description: string;
}

const DEFAULT_FORM: RoleFormData = {
  name: '',
  display_name: '',
  description: '',
};

function normalizePermissionList(response: unknown): Permission[] {
  const data = response && typeof response === 'object' ? (response as { data?: unknown }).data : [];
  return normalizeApiatoCollection<Permission>(data).filter((permission) => (permission.guard_name || 'api') === 'api');
}

function RoleEditPage() {
  const { roleId } = Route.useParams();
  const [initialData, setInitialData] = useState<RoleFormData | null>(null);
  const [formData, setFormData] = useState<RoleFormData>(DEFAULT_FORM);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Array<string | number>>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isDirty } = useFormDirty(initialData, formData);
  const [isSystemRole, setIsSystemRole] = useState(false);

  const updateForm = (patch: Partial<RoleFormData>) => setFormData((prev) => ({ ...prev, ...patch }));

  const hydrateRole = async () => {
    setLoading(true);
    try {
      const res = await findRoleById(roleId);
      const role = normalizeRoleItem(res.data as any);
      const serverForm: RoleFormData = {
        name: role.name,
        display_name: role.display_name,
        description: role.description,
      };

      setInitialData(serverForm);
      setFormData(serverForm);
      setSelectedPermissionIds(role.permissions.map((permission) => permission.id).filter(Boolean));
      setIsSystemRole(role.name === 'admin');
    } catch (err: any) {
      console.error('Failed to fetch role:', err);
      toast.error(err?.response?.data?.message || 'Không thể tải thông tin vai trò');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchPermissions() {
      setLoadingPermissions(true);
      try {
        const res = await getPermissions();
        if (isMounted) setPermissions(sortPermissionsForAdmin(normalizePermissionList(res)));
      } catch (err: any) {
        console.error('Failed to fetch API permissions:', err);
        toast.error(err?.response?.data?.message || 'Không thể tải danh sách quyền API');
      } finally {
        if (isMounted) setLoadingPermissions(false);
      }
    }
    hydrateRole();
    fetchPermissions();

    return () => { isMounted = false; };
  }, [roleId]);

  const groupedPermissions = useMemo(() => {
    return permissions.reduce<Record<string, Permission[]>>((groups, permission) => {
      const groupName = getPermissionGroupLabel(permission.name || '');
      groups[groupName] = groups[groupName] || [];
      groups[groupName].push(permission);
      return groups;
    }, {});
  }, [permissions]);

  const selectedPermissions = useMemo(() => {
    const selectedSet = new Set(selectedPermissionIds.map(String));
    return permissions.filter((permission) => selectedSet.has(String(permission.id)));
  }, [permissions, selectedPermissionIds]);

  const togglePermission = (id: string | number) => {
    if (isSystemRole) return;
    setSelectedPermissionIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  };

  const toggleGroup = (items: Permission[]) => {
    if (isSystemRole) return;
    const ids = items.map((item) => item.id);
    const allSelected = ids.every((id) => selectedPermissionIds.includes(id));
    if (allSelected) {
      setSelectedPermissionIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedPermissionIds((prev) => Array.from(new Set([...prev, ...ids])));
    }
  };

  const handleReset = () => {
    if (initialData) {
      setFormData(initialData);
      toast.info('Đã khôi phục dữ liệu ban đầu');
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    if (!formData.name.trim() || !formData.display_name.trim()) {
      toast.error('Vui lòng nhập Mã vai trò và Tên hiển thị!', { id: 'role-edit-toast' });
      return;
    }

    const roleName = formData.name.trim().toLowerCase().replace(/\s+/g, '-');
    if (roleName.length > 20) {
      toast.error('Mã vai trò tối đa 20 ký tự theo chuẩn Backend', { id: 'role-edit-toast' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (!isSystemRole) {
        await updateRole(roleId, {
          name: roleName,
          display_name: formData.display_name.trim(),
          description: formData.description.trim(),
        } as any);
      }

      if (!isSystemRole) {
        await syncRolePermissions(roleId, selectedPermissionIds);
      }

      toast.success(`Đã cập nhật vai trò ${formData.display_name.trim()} thành công`, { id: 'role-edit-toast' });
      await hydrateRole();
    } catch (err: any) {
      console.error('Failed to update role:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Không thể cập nhật vai trò trên Backend API', { id: 'role-edit-toast' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 w-full font-sans pb-20 text-slate-800 dark:text-slate-200">
      <AdminFormHeader
        icon={Shield}
        title={
          <>
            Chỉnh Sửa Vai Trò:{' '}
            <span className="text-blue-600 dark:text-blue-400 font-bold">
              {loading ? '...' : formData.display_name}
            </span>
          </>
        }
        subtitle="Cập nhật thông tin vai trò và quyền API được phép truy cập trên hệ thống Superdong"
        backTo="/roles"
        badge={
          isSystemRole ? (
            <Badge variant="blue" className="px-3 py-1 text-xs">
              <Lock size={12} /> Vai trò hệ thống
            </Badge>
          ) : (
            <Badge variant="secondary" className="px-3 py-1 text-xs">
              Có thể chỉnh sửa
            </Badge>
          )
        }
      />

      <AdminFormCard onSubmit={handleSubmit}>
        <FormSectionBlock title="I. Thông tin cơ bản" columns={2}>
          <FormInputField
            id="role-name"
            label="Mã Vai Trò"
            required
            value={formData.name}
            disabled={isSystemRole || loading}
            onChange={(e) => updateForm({ name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20) })}
            className="font-mono font-bold text-blue-600 dark:text-blue-400 disabled:opacity-70"
            helperText={isSystemRole ? 'Mã vai trò hệ thống không được sửa đổi' : 'Tối đa 20 ký tự (chữ thường, số, gạch dưới)'}
          />

          <FormInputField
            id="role-display-name"
            label="Tên Hiển Thị Vai Trò"
            required
            value={formData.display_name}
            disabled={loading}
            onChange={(e) => updateForm({ display_name: e.target.value })}
            placeholder="VD: Trưởng ca vận hành"
          />

          <div className="md:col-span-2">
            <FormField id="role-description" label="Mô tả nhiệm vụ">
              <textarea
                id="role-description"
                value={formData.description}
                disabled={loading}
                onChange={(e) => updateForm({ description: e.target.value.slice(0, 255) })}
                rows={3}
                placeholder="Mô tả ngắn vai trò này phụ trách việc gì..."
                className="w-full p-3 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 outline-none focus:border-blue-500 disabled:opacity-70"
              />
            </FormField>
          </div>
        </FormSectionBlock>

        <FormSectionBlock title="II. Quyền API được gán" columns={1}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-slate-500">Chỉ hiển thị quyền guard API, quyền web của Backend không dùng cho dashboard.</p>
            <Badge variant="blue">Đã chọn {selectedPermissionIds.length}</Badge>
          </div>

          {selectedPermissions.length > 0 && (
            <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3 dark:border-blue-900 dark:bg-blue-950/30">
              <div className="mb-2 text-xs font-bold text-blue-700 dark:text-blue-300">Quyền đang gán cho vai trò này</div>
              <div className="flex flex-wrap gap-1.5">
                {selectedPermissions.map((permission) => (
                  <Badge key={permission.id} variant="blue" className="text-[11px]">
                    {getPermissionLabel(permission)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {loadingPermissions || loading ? (
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 p-4 text-xs text-slate-500">
              <RefreshCw size={14} className="animate-spin text-blue-600" /> Đang tải quyền API...
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(groupedPermissions).map(([group, items]) => {
                const allSelected = items.every((item) => selectedPermissionIds.includes(item.id));
                return (
                  <div key={group} className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 space-y-3">
                    <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-900 px-3 py-2">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{group}</div>
                      <button
                        type="button"
                        disabled={isSystemRole}
                        onClick={() => toggleGroup(items)}
                        className="text-xs font-semibold text-blue-600 hover:underline disabled:text-slate-400 disabled:no-underline cursor-pointer"
                      >
                        {allSelected ? 'Bỏ chọn nhóm' : 'Chọn nhóm'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                      {items.map((permission) => {
                        const checked = selectedPermissionIds.includes(permission.id);
                        return (
                          <label
                            key={permission.id}
                            className={`flex items-start gap-2 rounded-lg border p-2.5 text-xs transition-all ${
                              isSystemRole ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                            } ${
                              checked
                                ? 'border-blue-300 bg-blue-50/70 dark:border-blue-800 dark:bg-blue-950/30'
                                : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950'
                            }`}
                          >
                            <input
                              type="checkbox"
                              disabled={isSystemRole}
                              checked={checked}
                              onChange={() => togglePermission(permission.id)}
                              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                            />
                            <span>
                              <span className="block font-semibold text-slate-800 dark:text-slate-100">{getPermissionLabel(permission)}</span>
                              <span className="block font-mono text-[11px] text-slate-400">{permission.name}</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </FormSectionBlock>
      </AdminFormCard>

      <UnsavedChangesBar
        isDirty={isDirty}
        isSaving={isSubmitting}
        onSave={() => handleSubmit()}
        onReset={handleReset}
      />
    </div>
  );
}
