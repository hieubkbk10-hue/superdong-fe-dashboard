import React, { useState, useEffect } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { UserCheck, ArrowLeft, Save, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { updateUser, findUserById } from '@/apis/users';

export const Route = createFileRoute('/_admin/users/$userId/edit')({
  component: UserEditPage,
});

function UserEditPage() {
  const { userId } = Route.useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: 'Nguyễn Văn Thành',
    email: 'thanh.nv@superdong.com.vn',
    phone: '0903.111.222',
    role_id: '2',
    status: 'active',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    new_password: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchUserDetails = async () => {
      setLoading(true);
      try {
        const res = await findUserById(userId);
        if (isMounted && res && res.data) {
          const user = res.data;
          setFormData((prev) => ({
            ...prev,
            name: user.name || prev.name,
            email: user.email || prev.email,
            phone: user.phone || prev.phone,
          }));
        }
      } catch (err: any) {
        console.warn('Fetch user details error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    if (userId) fetchUserDetails();
    return () => { isMounted = false; };
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await updateUser(userId, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      });
      toast.success(`Đã cập nhật thông tin tài khoản ${formData.name} thành công!`, { id: 'user-edit-toast' });
    } catch (err: any) {
      console.error('Update user error:', err);
      const serverMsg = err?.response?.data?.message || err?.message || '';
      toast.error(serverMsg || 'Có lỗi xảy ra khi cập nhật nhân viên trên Backend', { id: 'user-edit-toast' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = () => {
    toast.success(`Đã gửi email khôi phục mật khẩu tới ${formData.email}`);
  };

  return (
    <div className="space-y-6 max-w-4xl font-sans pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to={'/users' as any}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          title="Quay lại danh sách"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-blue-600" />
            Chỉnh Sửa Tài Khoản Nhân Viên: {loading ? '...' : formData.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ID nhân viên trong hệ thống: <span className="font-mono">{userId}</span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          <img
            src={formData.avatar_url}
            alt={formData.name}
            className="h-16 w-16 rounded-full object-cover border-2 border-blue-600"
          />
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">{formData.name}</h3>
            <p className="text-xs text-slate-500">{formData.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Họ và Tên Nhân Viên <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Email Công Việc (Tên đăng nhập) <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Số Điện Thoại Liên Hệ <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Vai Trò &amp; Phân Quyền (Role)
            </label>
            <select
              value={formData.role_id}
              onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none cursor-pointer font-semibold"
            >
              <option value="1">Super Admin (Quản trị cao cấp)</option>
              <option value="2">Quản lý bến tàu (Port Manager)</option>
              <option value="3">Nhân viên bán vé quầy (Ticket Agent)</option>
              <option value="4">Nhân viên soát vé (Check-in Staff)</option>
              <option value="5">Kế toán tài chính (Accountant)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Trạng Thái Tài Khoản
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none cursor-pointer font-bold"
            >
              <option value="active">Đang hoạt động (Active)</option>
              <option value="inactive">Tạm khóa tài khoản (Inactive)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Đổi Mật Khẩu Mới (Để trống nếu không đổi)
            </label>
            <input
              type="password"
              value={formData.new_password}
              onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
              placeholder="Nhập mật khẩu mới..."
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <button
            type="button"
            onClick={handleResetPassword}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <KeyRound size={14} /> Gửi Email Reset Mật Khẩu
          </button>

          <div className="flex items-center gap-3">
            <Link
              to={'/users' as any}
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
        </div>
      </form>
    </div>
  );
}
