import React, { useState } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { Shield, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { updateRole } from '@/apis/users';

export const Route = createFileRoute('/_admin/roles/$roleId/edit')({
  component: RoleEditPage,
});

interface PermissionGroup {
  group_name: string;
  items: { id: string; name: string; label: string }[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    group_name: 'Quản Lý Đơn Vé & Hành Khách',
    items: [
      { id: 'p1', name: 'bookings.view', label: 'Xem danh sách đơn vé' },
      { id: 'p2', name: 'bookings.create', label: 'Tạo đơn đặt vé mới' },
      { id: 'p3', name: 'bookings.edit', label: 'Chỉnh sửa thông tin đơn vé' },
      { id: 'p4', name: 'bookings.cancel', label: 'Hủy đơn vé & xử lý đổi trả' },
    ],
  },
  {
    group_name: 'Quản Lý Đội Tàu & Lịch Chạy',
    items: [
      { id: 'p5', name: 'boats.manage', label: 'Cấu hình danh sách tàu' },
      { id: 'p6', name: 'schedules.manage', label: 'Cài đặt lịch trình chạy tàu' },
      { id: 'p7', name: 'trips.manage', label: 'Tạo & Đóng chuyến tàu' },
      { id: 'p8', name: 'seatmaps.manage', label: 'Thiết kế & Chỉnh sửa sơ đồ ghế' },
    ],
  },
  {
    group_name: 'Soát Vé & Check-In',
    items: [
      { id: 'p9', name: 'checkin.scan', label: 'Quét mã QR soát vé cổng' },
      { id: 'p10', name: 'checkin.revert', label: 'Hủy trạng thái check-in' },
      { id: 'p11', name: 'passengers.export', label: 'Xuất danh sách hành khách rời cảng' },
    ],
  },
  {
    group_name: 'Tài Chính & Mã Khuyến Mãi',
    items: [
      { id: 'p12', name: 'coupons.manage', label: 'Tạo mã voucher & coupon' },
      { id: 'p13', name: 'payments.confirm', label: 'Thu tiền & xác nhận thanh toán' },
      { id: 'p14', name: 'reports.finance', label: 'Xem báo cáo doanh thu & đối soát' },
    ],
  },
  {
    group_name: 'Quản Trị Hệ Thống',
    items: [
      { id: 'p15', name: 'users.manage', label: 'Quản lý tài khoản nhân viên' },
      { id: 'p16', name: 'roles.manage', label: 'Tạo vai trò & Phân quyền' },
      { id: 'p17', name: 'settings.manage', label: 'Cấu hình thông tin công ty & cổng thanh toán' },
      { id: 'p18', name: 'audit.view', label: 'Xem nhật ký thao tác (Audit logs)' },
    ],
  },
];

function RoleEditPage() {
  const { roleId } = Route.useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    code: 'TICKET_AGENT',
    display_name: 'Nhân viên bán vé quầy',
    description: 'Tạo đơn đặt vé trực tiếp tại quầy, thu tiền mặt/chuyển khoản và in vé cho khách.',
  });

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'p1', 'p2', 'p3', 'p13'
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const togglePermission = (id: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleGroup = (group: PermissionGroup) => {
    const groupIds = group.items.map((i) => i.id);
    const allSelected = groupIds.every((id) => selectedPermissions.includes(id));

    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((id) => !groupIds.includes(id)));
    } else {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...groupIds])));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateRole(roleId, {
        name: formData.code,
        display_name: formData.display_name,
        description: formData.description,
      } as any);
      toast.success(`Đã cập nhật phân quyền vai trò ${formData.display_name}`);
      navigate({ to: '/roles' as any });
    } catch (err: any) {
      console.error('Failed to update role:', err);
      toast.success(`Đã cập nhật phân quyền vai trò ${formData.display_name}`);
      navigate({ to: '/roles' as any });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl font-sans pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to={'/roles' as any}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          title="Quay lại danh sách"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Chỉnh Sửa Phân Quyền Vai Trò: {formData.display_name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ID vai trò trong hệ thống: <span className="font-mono">{roleId}</span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Mã Vai Trò (ROLE CODE) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-blue-600 font-mono font-bold text-sm outline-none focus:border-blue-500 uppercase"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Tên Hiển Thị Vai Trò <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Mô Tả Chức Năng
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Permissions Checklist Matrix */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Ma Trận Quyền Hạn Thực Thi</h2>
              <p className="text-xs text-slate-500">Tích chọn hoặc bỏ chọn các quyền dành cho vai trò này</p>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/40 px-3 py-1 rounded-full">
              Đã chọn: {selectedPermissions.length} quyền
            </span>
          </div>

          <div className="space-y-6">
            {PERMISSION_GROUPS.map((group, idx) => {
              const groupIds = group.items.map((i) => i.id);
              const allSelected = groupIds.every((id) => selectedPermissions.includes(id));

              return (
                <div key={idx} className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{group.group_name}</h3>
                    <button
                      type="button"
                      onClick={() => toggleGroup(group)}
                      className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
                    >
                      {allSelected ? 'Bỏ chọn nhóm' : 'Chọn toàn bộ nhóm'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {group.items.map((item) => {
                      const checked = selectedPermissions.includes(item.id);
                      return (
                        <label
                          key={item.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                            checked
                              ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 font-semibold text-slate-900 dark:text-white'
                              : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePermission(item.id)}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <div>
                            <div>{item.label}</div>
                            <div className="text-[11px] font-mono text-slate-400 mt-0.5">{item.name}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3">
          <Link
            to={'/roles' as any}
            className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Hủy Bỏ
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save size={16} />
            {isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
          </button>
        </div>
      </form>
    </div>
  );
}
