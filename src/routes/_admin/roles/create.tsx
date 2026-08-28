import React, { useEffect, useMemo, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { RefreshCw, Shield } from 'lucide-react';
import { toast } from 'sonner';

import { createRole, getPermissions, syncRolePermissions } from '@/apis/users';
import { Badge } from '@/components/common/Badge';
import { Permission } from '@/types';
import { getPermissionGroupLabel, getPermissionLabel, sortPermissionsForAdmin } from '@/helpers/permissionUi';
import { normalizeApiatoCollection } from '@/helpers/roleNormalizer';
import {
  AdminFormHeader,
  AdminFormCard,
  FormSectionBlock,
  FormField,
  FormInputField,
  AdminFormActionBar,
  useFormDirty,
} from '@/components/common/FormUtilities';

export const Route = createFileRoute('/_admin/roles/create')({
  component: RoleCreatePage,
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

function RoleCreatePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RoleFormData>(DEFAULT_FORM);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Array<string | number>>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    fetchPermissions();

    return () => { isMounted = false; };
  }, []);

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

  const updateForm = (patch: Partial<RoleFormData>) => setFormData((prev) => ({ ...prev, ...patch }));

  const clearForm = () => {
    setFormData(DEFAULT_FORM);
    setSelectedPermissionIds([]);
    toast.success('Đã làm sạch dữ liệu nhập');
  };

  const togglePermission = (id: string | number) => {
    setSelectedPermissionIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  };

  const toggleGroup = (items: Permission[]) => {
    const ids = items.map((item) => item.id);
    const allSelected = ids.every((id) => selectedPermissionIds.includes(id));
    if (allSelected) {
      setSelectedPermissionIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedPermissionIds((prev) => Array.from(new Set([...prev, ...ids])));
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    if (!formData.name.trim() || !formData.display_name.trim()) {
      toast.error('Vui lòng nhập Mã vai trò và Tên hiển thị!', { id: 'role-create-toast' });
      return;
    }

    const roleName = formData.name.trim().toLowerCase().replace(/\s+/g, '-');
    if (roleName.length > 20) {
      toast.error('Mã vai trò tối đa 20 ký tự theo chuẩn Backend', { id: 'role-create-toast' });
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createRole({
        name: roleName,
        display_name: formData.display_name.trim(),
        description: formData.description.trim(),
      } as any);

      const roleId = created.data.id;
      if (selectedPermissionIds.length > 0) {
        await syncRolePermissions(roleId, selectedPermissionIds);
      }

      toast.success(`Đã tạo vai trò ${formData.display_name.trim()} thành công`, { id: 'role-create-toast' });
      navigate({ to: '/roles' as any });
    } catch (err: any) {
      console.error('Failed to create role:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Không thể tạo vai trò trên Backend API', { id: 'role-create-toast' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 w-full font-sans pb-20 text-slate-800 dark:text-slate-200">
      {/* Top Header Navigation Bar */}
      <AdminFormHeader
        icon={Shield}
        title="Tạo Vai Trò Mới"
        subtitle="Tạo vai trò nhân viên và gán quyền API được phép truy cập trên hệ thống Superdong"
        backTo="/roles"
        onClear={clearForm}
        clearLabel="Làm sạch dữ liệu"
      />

      {/* Main Single Card Form */}
      <AdminFormCard onSubmit={handleSubmit}>
        {/* SECTION 1: THÔNG TIN CƠ BẢN */}
        <FormSectionBlock title="I. Thông tin cơ bản" columns={2}>
          <FormInputField
            id="role-name"
            label="Mã Vai Trò"
            required
            value={formData.name}
            onChange={(e) => updateForm({ name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20) })}
            placeholder="VD: shift_manager"
            className="font-mono font-bold text-blue-600 dark:text-blue-400"
            helperText="Tối đa 20 ký tự (chữ thường, số, gạch dưới)"
          />

          <FormInputField
            id="role-display-name"
            label="Tên Hiển Thị Vai Trò"
            required
            value={formData.display_name}
            onChange={(e) => updateForm({ display_name: e.target.value })}
            placeholder="VD: Trưởng ca vận hành"
          />

          <div className="md:col-span-2">
            <FormField id="role-description" label="Mô tả nhiệm vụ">
              <textarea
                id="role-description"
                value={formData.description}
                onChange={(e) => updateForm({ description: e.target.value.slice(0, 255) })}
                rows={3}
                placeholder="Mô tả ngắn vai trò này phụ trách việc gì..."
                className="w-full p-3 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 outline-none focus:border-blue-500"
              />
            </FormField>
          </div>
        </FormSectionBlock>

        {/* SECTION 2: QUYỀN API ĐƯỢC GÁN */}
        <FormSectionBlock title="II. Quyền API được gán" columns={1}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-slate-500">Chỉ hiển thị quyền guard API, quyền web của Backend không dùng cho dashboard.</p>
            <Badge variant="blue">Đã chọn {selectedPermissionIds.length}</Badge>
          </div>

          {selectedPermissions.length > 0 && (
            <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3 dark:border-blue-900 dark:bg-blue-950/30">
              <div className="mb-2 text-xs font-bold text-blue-700 dark:text-blue-300">Quyền sẽ được gán</div>
              <div className="flex flex-wrap gap-1.5">
                {selectedPermissions.map((permission) => (
                  <Badge key={permission.id} variant="blue" className="text-[11px]">
                    {getPermissionLabel(permission)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {loadingPermissions ? (
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
                      <button type="button" onClick={() => toggleGroup(items)} className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer">
                        {allSelected ? 'Bỏ chọn nhóm' : 'Chọn nhóm'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                      {items.map((permission) => {
                        const checked = selectedPermissionIds.includes(permission.id);
                        return (
                          <label key={permission.id} className={`flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 text-xs transition-all ${checked ? 'border-blue-300 bg-blue-50/70 dark:border-blue-800 dark:bg-blue-950/30' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950'}`}>
                            <input type="checkbox" checked={checked} onChange={() => togglePermission(permission.id)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
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

        {/* Master Action Bar */}
        <AdminFormActionBar
          mode="create"
          isSubmitting={isSubmitting}
          cancelTo="/roles"
          submitLabel="Tạo vai trò mới"
          onClear={clearForm}
          clearLabel="Làm sạch dữ liệu"
        />
      </AdminFormCard>
    </div>
  );
}

