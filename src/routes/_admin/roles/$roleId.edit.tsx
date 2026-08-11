import React, { useEffect, useMemo, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft, Lock, RefreshCw, Save, Shield } from 'lucide-react';
import { toast } from 'sonner';

import { findRoleById, getPermissions, syncRolePermissions, updateRole } from '@/apis/users';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Permission } from '@/types';
import { normalizeApiatoCollection, normalizeRoleItem } from './-role-normalizer';

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
  const draftKey = `superdong_role_draft_edit_${roleId}`;
  const [formData, setFormData] = useState<RoleFormData>(DEFAULT_FORM);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Array<string | number>>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

      let nextForm = serverForm;
      try {
        const saved = localStorage.getItem(draftKey);
        if (saved) nextForm = { ...serverForm, ...JSON.parse(saved) };
      } catch (_) {}

      setFormData(nextForm);
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
        if (isMounted) setPermissions(normalizePermissionList(res));
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

  useEffect(() => {
    if (!loading) localStorage.setItem(draftKey, JSON.stringify(formData));
  }, [draftKey, formData, loading]);

  const groupedPermissions = useMemo(() => {
    return permissions.reduce<Record<string, Permission[]>>((groups, permission) => {
      const groupName = (permission.name || '').split('-')[0] || 'khac';
      groups[groupName] = groups[groupName] || [];
      groups[groupName].push(permission);
      return groups;
    }, {});
  }, [permissions]);

  const togglePermission = (id: string | number) => {
    if (isSystemRole) return;
    setSelectedPermissionIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  };

  const toggleGroup = (items: Permission[]) => {
    if (isSystemRole) return;
    const ids = items.map((item) => item.id);
    const allSelected = ids.every((id) => selectedPermissionIds.includes(id));
    setSelectedPermissionIds((prev) => allSelected
      ? prev.filter((id) => !ids.includes(id))
      : Array.from(new Set([...prev, ...ids])));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const roleName = formData.name.trim().toLowerCase();
    if (!roleName || !formData.display_name.trim()) {
      toast.error('Vui lòng nhập mã vai trò và tên vai trò', { id: 'role-edit-toast' });
      return;
    }
    if (!/^[a-z0-9_]+$/.test(roleName)) {
      toast.error('Mã vai trò chỉ dùng chữ thường, số và dấu gạch dưới', { id: 'role-edit-toast' });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateRole(roleId, {
        name: roleName,
        display_name: formData.display_name.trim(),
        description: formData.description.trim(),
      } as any);

      if (!isSystemRole) {
        await syncRolePermissions(roleId, selectedPermissionIds);
      }

      localStorage.removeItem(draftKey);
      toast.success(`Đã lưu vai trò ${formData.display_name.trim()} thành công`, { id: 'role-edit-toast' });
      await hydrateRole();
    } catch (err: any) {
      console.error('Failed to update role:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Không thể cập nhật vai trò trên Backend API', { id: 'role-edit-toast' });
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
              Chỉnh sửa vai trò: {loading ? '...' : formData.display_name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Cập nhật thông tin vai trò và quyền API được phép truy cập</p>
          </div>
        </div>
        {isSystemRole ? <Badge variant="blue" className="px-3 py-1 text-xs"><Lock size={12} /> Vai trò hệ thống</Badge> : <Badge variant="secondary" className="px-3 py-1 text-xs">Có thể chỉnh sửa</Badge>}
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5">
        <div className="space-y-3">
          <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-3.5 py-2 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wide border border-blue-100 dark:border-slate-800">I. Thông tin cơ bản</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <Label htmlFor="role-name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Mã vai trò <span className="text-rose-500 font-bold">*</span></Label>
              <Input id="role-name" value={formData.name} disabled={isSystemRole || loading} onChange={(e) => updateForm({ name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20) })} className="text-blue-600 dark:text-blue-400 font-mono font-bold text-sm h-9 rounded-lg disabled:opacity-70" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="role-display-name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tên vai trò <span className="text-rose-500 font-bold">*</span></Label>
              <Input id="role-display-name" value={formData.display_name} disabled={loading} onChange={(e) => updateForm({ display_name: e.target.value })} className="text-sm h-9 rounded-lg" required />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="role-description" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Mô tả nhiệm vụ</Label>
            <textarea id="role-description" value={formData.description} disabled={loading} onChange={(e) => updateForm({ description: e.target.value.slice(0, 255) })} rows={3} className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-sm outline-none focus:border-blue-500 disabled:opacity-70" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-3.5 py-2 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wide border border-blue-100 dark:border-slate-800">II. Quyền API được gán</div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-slate-500">Chỉ hiển thị quyền guard API, quyền web của Backend không dùng cho dashboard.</p>
            <Badge variant="blue">Đã chọn {selectedPermissionIds.length}</Badge>
          </div>
          {loadingPermissions || loading ? (
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 p-4 text-xs text-slate-500"><RefreshCw size={14} className="animate-spin" /> Đang tải quyền API...</div>
          ) : (
            <div className="space-y-3">
              {Object.entries(groupedPermissions).map(([group, items]) => {
                const allSelected = items.every((item) => selectedPermissionIds.includes(item.id));
                return (
                  <div key={group} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 space-y-3">
                    <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-900 px-3 py-2">
                      <div className="text-sm font-bold capitalize text-slate-900 dark:text-white">{group.replace(/_/g, ' ')}</div>
                      <button type="button" disabled={isSystemRole} onClick={() => toggleGroup(items)} className="text-xs font-semibold text-blue-600 hover:underline disabled:text-slate-400 disabled:no-underline">{allSelected ? 'Bỏ chọn nhóm' : 'Chọn nhóm'}</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                      {items.map((permission) => {
                        const checked = selectedPermissionIds.includes(permission.id);
                        return (
                          <label key={permission.id} className={`flex items-start gap-2 rounded-lg border p-2.5 text-xs transition-all ${isSystemRole ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'} ${checked ? 'border-blue-300 bg-blue-50/70 dark:border-blue-800 dark:bg-blue-950/30' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950'}`}>
                            <input type="checkbox" disabled={isSystemRole} checked={checked} onChange={() => togglePermission(permission.id)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed" />
                            <span>
                              <span className="block font-semibold text-slate-800 dark:text-slate-100">{permission.display_name || permission.name}</span>
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
          <Button type="submit" variant="primary" disabled={isSubmitting || loading} className="px-6 h-9 text-xs gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">
            {isSubmitting ? <><RefreshCw size={14} className="animate-spin" /> Đang lưu...</> : <><Save size={14} /> Lưu thay đổi</>}
          </Button>
        </div>
      </form>
    </div>
  );
}
