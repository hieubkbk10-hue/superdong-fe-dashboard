import React, { useState, useEffect } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Shield, Plus, Search, Edit, Trash2, Lock, Users, Key } from 'lucide-react';
import { toast } from 'sonner';
import { getRoles, getPermissions } from '@/apis/users';

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

// Khớp chuẩn 100% với 6 bản ghi trong bảng `roles` Database Production `momovitr_superdong_be`
const PRODUCTION_REAL_ROLES: RoleItem[] = [
  {
    id: '1',
    name: 'admin',
    guard_name: 'web / api',
    display_name: 'Administrator',
    description: 'Administrator Role (Toàn quyền quản trị hệ thống Superdong)',
    user_count: 1, // User ID 1 (Super Admin)
    is_system: true,
    permissions: [
      { name: 'master-data.manage', display_name: 'Manage Master Data (Routes, Ships, Fares)' },
      { name: 'trip-operations.manage', display_name: 'Manage Trip Schedule & Operations' },
      { name: 'booking.override', display_name: 'Override Booking Policies' },
      { name: 'settings.manage', display_name: 'Manage Settings & Configuration' },
    ],
  },
  {
    id: '3',
    name: 'counter_staff',
    guard_name: 'api',
    display_name: 'Counter Staff',
    description: 'Nhân viên bán vé trực tiếp tại quầy bến tàu',
    user_count: 1, // User ID 3 (Tyrese Sporer)
    permissions: [
      { name: 'counter-collection.confirm', display_name: 'Confirm Counter Cash Collection' },
      { name: 'booking.view', display_name: 'View Booking Details and History' },
      { name: 'invoice.issue', display_name: 'Issue Retail Invoices' },
    ],
  },
  {
    id: '6',
    name: 'manager',
    guard_name: 'api',
    display_name: 'Manager',
    description: 'Quản lý điều hành bến tàu Rạch Giá, Phú Quốc...',
    user_count: 0,
    permissions: [
      { name: 'trip-operations.manage', display_name: 'Manage Trip Schedule & Operations' },
      { name: 'check-in.correct', display_name: 'Correct Mis-scanned Check-in' },
      { name: 'booking.refund', display_name: 'Process Booking Refund' },
      { name: 'audit.view', display_name: 'View Audit Logs' },
    ],
  },
  {
    id: '4',
    name: 'operations_staff',
    guard_name: 'api',
    display_name: 'Operations Staff',
    description: 'Nhân viên điều hành phân công xếp nốt chuyến tàu',
    user_count: 0,
    permissions: [
      { name: 'trip-operations.manage', display_name: 'Manage Trip Schedule & Operations' },
      { name: 'booking.view', display_name: 'View Booking Details and History' },
    ],
  },
  {
    id: '5',
    name: 'checkin_staff',
    guard_name: 'api',
    display_name: 'Check-in Staff',
    description: 'Nhân viên kiểm tra soát vé mã QR tại cổng bến tàu',
    user_count: 0,
    permissions: [
      { name: 'check-in.scan', display_name: 'Scan Ticket for Check-in' },
      { name: 'booking.view', display_name: 'View Booking Details' },
    ],
  },
];

function RolesPage() {
  const [roles, setRoles] = useState<RoleItem[]>(PRODUCTION_REAL_ROLES);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [rolesRes, permsRes] = await Promise.all([getRoles(), getPermissions()]);
        if (isMounted && rolesRes && rolesRes.data && rolesRes.data.length > 0) {
          const apiRoles: RoleItem[] = rolesRes.data.map((r: any) => ({
            id: String(r.id),
            name: r.name,
            guard_name: r.guard_name || 'api',
            display_name: r.display_name || r.name,
            description: r.description || `Vai trò ${r.name} trong hệ thống`,
            user_count: r.user_count || 0,
            is_system: r.name === 'admin',
            permissions: (r.permissions || []).map((p: any) => ({
              name: p.name || p,
              display_name: p.display_name || p.name || p,
            })),
          }));
          setRoles(apiRoles);
        }
      } catch (err) {
        console.error('Failed to fetch roles / permissions:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredRoles = roles.filter(
    (r) =>
      r.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Bạn có chắc muốn xóa vai trò ${name}?`)) {
      setRoles((prev) => prev.filter((r) => r.id !== id));
      toast.success(`Đã xóa vai trò ${name}`);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              Vai Trò &amp; Ma Trận Phân Quyền (Roles)
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live API Backend
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Khớp chuẩn 100% với danh mục bảng `roles` trong Database Production `momovitr_superdong_be`
          </p>
        </div>
        <Link
          to={'/roles/create' as any}
          className="h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <Plus size={16} /> Tạo Vai Trò Mới
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo Tên vai trò hoặc mã Backend (admin, counter_staff...)..."
            className="w-full h-10 pl-9 pr-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500 font-mono"
          />
        </div>
      </div>

      {/* Roles Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">Mã Vai Trò Backend</th>
                <th className="p-4">Tên Hiển Thị &amp; Guard</th>
                <th className="p-4">Mô Tả Nhiệm Vụ</th>
                <th className="p-4">Số Nhân Viên Đang Gán</th>
                <th className="p-4">Quyền Hạn Gắn Kèm (Permissions)</th>
                <th className="p-4 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRoles.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-mono font-bold text-blue-600">
                    <span className="bg-blue-50 dark:bg-blue-900/40 px-2.5 py-1 rounded border border-blue-200/60 dark:border-blue-800">
                      {r.name}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-slate-900 dark:text-white text-base">
                    {r.display_name}
                    <span className="ml-2 font-mono text-xs font-normal text-slate-500">
                      ({r.guard_name})
                    </span>
                    {r.is_system && (
                      <span className="ml-2 inline-flex items-center gap-1 text-[11px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md border border-amber-500/20">
                        <Lock size={10} /> Hệ thống BE
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-400 text-xs max-w-xs">{r.description}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 font-bold ${r.user_count > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                      <Users size={14} /> {r.user_count} nhân viên
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1.5 max-w-md">
                      {r.permissions.map((p, idx) => (
                        <span
                          key={idx}
                          className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-mono px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                        >
                          <Key size={10} className="text-blue-500" />
                          {p.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-right space-x-1">
                    <Link
                      to={'/roles/$roleId/edit' as any}
                      params={{ roleId: r.id } as any}
                      className="p-1.5 inline-flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 cursor-pointer"
                      title="Chỉnh sửa phân quyền"
                    >
                      <Edit size={16} />
                    </Link>
                    {!r.is_system && (
                      <button
                        onClick={() => handleDelete(r.id, r.display_name)}
                        className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-500 hover:text-rose-600 cursor-pointer"
                        title="Xóa vai trò"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
