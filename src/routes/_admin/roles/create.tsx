import { UnsavedChangesBar } from '@/components/common/UnsavedChangesBar';
import { useFormDirty } from '@/components/common/FormUtilities';
import React, { useEffect, useMemo, useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, RefreshCw, RotateCcw, Save, Shield } from 'lucide-react';
import { toast } from 'sonner';

import { createRole, getPermissions, syncRolePermissions } from '@/apis/users';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Permission } from '@/types';
import { getPermissionGroupLabel, getPermissionLabel, sortPermissionsForAdmin } from '@/helpers/permissionUi';
import { normalizeApiatoCollection } from '@/helpers/roleNormalizer';

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
  const [initialData] = useState(formData);
  const { isDirty } = useFormDirty(initialData, formData);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="space-y-4 w-full font-sans pb-10 text-slate-800 dark:text-slate-200">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Button variant="light" size="icon" className="h-8 w-8" asChild>
            <Link to={'/roles' as any} title="Quay lại danh sách"><ArrowLeft size={16} /></Link>
          </Button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Tạo vai trò mới
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Tạo vai trò nhân viên và gán quyền API được phép truy cập</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="light" size="sm" className="h-8 gap-1.5" onClick={clearForm}>
            <RotateCcw size={14} /> Làm sạch dữ liệu
          </Button>
          <Badge variant="blue" className="px-3 py-1 text-xs">Vai trò mới</Badge>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-5">
        <div className="space-y-3">
          <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-3.5 py-2 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wide border border-blue-100 dark:border-slate-800">I. Thông tin cơ bản</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <Label htmlFor="role-name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Mã vai trò <span className="text-rose-500 font-bold">*</span></Label>
              <Input id="role-name" value={formData.name} onChange={(e) => updateForm({ name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20) })} placeholder="vd: shift_manager" className="text-blue-600 dark:text-blue-400 font-mono font-bold text-sm h-9 rounded-lg" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="role-display-name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tên vai trò <span className="text-rose-500 font-bold">*</span></Label>
              <Input id="role-display-name" value={formData.display_name} onChange={(e) => updateForm({ display_name: e.target.value })} placeholder="vd: Trưởng ca vận hành" className="text-sm h-9 rounded-lg" required />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="role-description" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Mô tả nhiệm vụ</Label>
            <textarea id="role-description" value={formData.description} onChange={(e) => updateForm({ description: e.target.value.slice(0, 255) })} rows={3} placeholder="Mô tả ngắn vai trò này phụ trách việc gì..." className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-sm outline-none focus:border-blue-500" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-3.5 py-2 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wide border border-blue-100 dark:border-slate-800">II. Quyền API được gán</div>
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
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 p-4 text-xs text-slate-500"><RefreshCw size={14} className="animate-spin" /> Đang tải quyền API...</div>
          ) : (
            <div className="space-y-3">
              {Object.entries(groupedPermissions).map(([group, items]) => {
                const allSelected = items.every((item) => selectedPermissionIds.includes(item.id));
                return (
                  <div key={group} className="rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 space-y-3">
                    <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-900 px-3 py-2">
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{group}</div>
                      <button type="button" onClick={() => toggleGroup(items)} className="text-xs font-semibold text-blue-600 hover:underline">{allSelected ? 'Bỏ chọn nhóm' : 'Chọn nhóm'}</button>
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
        </div>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" type="button" asChild className="px-5 h-9 text-xs"><Link to={'/roles' as any}>Hủy Bỏ</Link></Button>
          <Button type="submit" variant="primary" disabled={isSubmitting} className="px-6 h-9 text-xs gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">
            {isSubmitting ? <><RefreshCw size={14} className="animate-spin" /> Đang lưu...</> : <><Save size={14} /> Tạo vai trò</>}
          </Button>
        </div>
      </form>

      <UnsavedChangesBar isDirty={isDirty} isSaving={isSubmitting} onSave={() => handleSubmit({ preventDefault: () => {} } as any)} onReset={() => setFormData(formData)} message="Vai trò chưa được tạo mới" />
    </div>
  );
}
