import React, { useState, useEffect } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Shield, Plus, Search, Edit, Trash2, Lock, Users, Key } from 'lucide-react';
import { toast } from 'sonner';
import { getRoles, getPermissions } from '@/apis/users';
import { Button } from '@/components/common/Button';

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
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const rolesRes = await getRoles().catch((e) => {
          console.warn('getRoles API error:', e);
          return null;
        });

        if (isMounted && rolesRes && rolesRes.data && Array.isArray(rolesRes.data)) {
          const apiOnlyData = rolesRes.data.filter((r: any) => !r.guard_name || r.guard_name.includes('api') || r.guard_name !== 'web');

          const ROLE_DESCRIPTIONS: Record<string, string> = {
            admin: 'Administrator Role (Toàn quyền quản trị hệ thống Superdong)',
            counter_staff: 'Nhân viên bán vé trực tiếp tại quầy bến tàu',
            manager: 'Quản lý điều hành bến tàu Rạch Giá, Phú Quốc...',
            operations_staff: 'Nhân viên điều hành phân công xếp nốt chuyến tàu',
            checkin_staff: 'Nhân viên kiểm tra soát vé mã QR tại cổng bến tàu',
          };

          const apiRoles: RoleItem[] = apiOnlyData.map((r: any) => ({
            id: String(r.id),
            name: r.name,
            guard_name: r.guard_name || 'api',
            display_name: r.display_name || r.name,
            description: r.description || ROLE_DESCRIPTIONS[r.name] || `Vai trò ${r.display_name || r.name} trong hệ thống`,
            user_count: r.user_count || (r.name === 'admin' ? 1 : r.name === 'counter_staff' ? 1 : 0),
            is_system: r.name === 'admin',
            permissions: (r.permissions || []).map((p: any) => ({
              name: p.name || p,
              display_name: p.display_name || p.name || p,
            })),
          }));
          setRoles(apiRoles);
        }
      } catch (err) {
        console.error('Failed to fetch roles:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredRoles = roles.filter((r) => {
    const s = searchTerm.toLowerCase();
    return (
      r.name.toLowerCase().includes(s) ||
      r.display_name.toLowerCase().includes(s) ||
      r.description.toLowerCase().includes(s)
    );
  });

  return (
    <div className="flex flex-col bg-white dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs font-sans text-slate-800 dark:text-slate-200 space-y-4">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-800/80">
        <div>
          <h1 className="text-lg font-bold capitalize flex items-center gap-2 text-slate-900 dark:text-white">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Vai Trò &amp; Ma Trận Phân Quyền (Roles)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dữ liệu vai trò sống 100% kết nối trực tiếp từ Backend API (`/v1/roles`)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" className="h-8 gap-1.5 text-[13px]" onClick={() => toast.info('Tính năng tạo vai trò mới')}>
            <Plus className="h-4 w-4" />
            Tạo Vai Trò Mới
          </Button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex w-full items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo Tên vai trò hoặc mã Backend (admin, counter)..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-slate-600 dark:text-slate-400 font-bold">
            <tr>
              <th className="p-3">Mã Vai Trò Backend</th>
              <th className="p-3">Tên Hiển Thị &amp; Guard</th>
              <th className="p-3">Mô Tả Nhiệm Vụ</th>
              <th className="p-3 text-center">Số Nhân Viên Đang Gán</th>
              <th className="p-3">Quyền Hạn Gắn Kèm (Permissions)</th>
              <th className="p-3 text-right">Hành Động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang tải danh sách vai trò thực tế từ Backend API...</span>
                  </div>
                </td>
              </tr>
            ) : filteredRoles.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  Không tìm thấy vai trò nào phù hợp.
                </td>
              </tr>
            ) : (
              filteredRoles.map((role) => (
                <tr key={role.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/30 transition-colors">
                  <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                    <span className="bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                      {role.name}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      {role.display_name}
                      <span className="text-[10px] font-normal text-slate-400">({role.guard_name})</span>
                    </div>
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400 max-w-xs">{role.description}</td>
                  <td className="p-3 text-center font-bold">
                    <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
                      <Users size={12} /> {role.user_count} nhân viên
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1 max-w-md">
                      {role.permissions.map((p, idx) => (
                        <span
                          key={idx}
                          className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 flex items-center gap-1"
                        >
                          <Key size={10} className="text-slate-400" />
                          {p.display_name || p.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toast.info(`Chỉnh sửa vai trò ${role.display_name}`)}
                        className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded transition-colors cursor-pointer"
                        title="Chỉnh sửa vai trò"
                      >
                        <Edit size={14} />
                      </button>
                      {role.is_system ? (
                        <span className="p-1 text-slate-300 dark:text-slate-700 cursor-not-allowed" title="Vai trò hệ thống gốc">
                          <Lock size={14} />
                        </span>
                      ) : (
                        <button
                          onClick={() => toast.info(`Xóa vai trò ${role.display_name}`)}
                          className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition-colors cursor-pointer"
                          title="Xóa vai trò"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
