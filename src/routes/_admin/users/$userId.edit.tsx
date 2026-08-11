import React, { useState, useEffect } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { UserCheck, ArrowLeft, Save, RefreshCw, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

import { updateUser, findUserById } from '@/apis/users';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { DateBox } from '@/components/common/DateBox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const Route = createFileRoute('/_admin/users/$userId/edit')({
  component: UserEditPage,
});

function UserEditPage() {
  const { userId } = Route.useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: 'Nguyễn Văn Thành',
    email: 'thanh.nv@superdong.com.vn',
    phone: '0903111222',
    birthday: '1992-05-15',
    role_name: 'Quản trị viên',
    status: 'active',
    is_active: true,
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      const res = await findUserById(userId);
      if (res && res.data) {
        const user = res.data;
        setFormData((prev) => ({
          ...prev,
          name: user.name || prev.name,
          email: user.email || prev.email,
          phone: user.phone || prev.phone,
          is_active: user.status ? user.status === 'active' : true,
        }));
      }
    } catch (err: any) {
      console.warn('Fetch user details error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchUserDetails();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Vui lòng điền Họ tên và Email nhân viên!', { id: 'user-edit-toast' });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateUser(userId, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        status: formData.is_active ? 'active' : 'inactive',
      });
      toast.success(`Đã cập nhật thông tin tài khoản ${formData.name} thành công!`, { id: 'user-edit-toast' });

      // LOGIC CHUẨN COUPON: Tự động re-fetch dữ liệu mới nhất từ Server Backend để đồng bộ state
      if (userId) {
        try {
          const fresh = await findUserById(userId);
          if (fresh && fresh.data) {
            const user = fresh.data;
            setFormData((prev) => ({
              ...prev,
              name: user.name || prev.name,
              email: user.email || prev.email,
              phone: user.phone || prev.phone,
              is_active: user.status ? user.status === 'active' : true,
            }));
          }
        } catch (_) {}
      }
    } catch (err: any) {
      console.error('Update user error:', err);
      const serverMsg = err?.response?.data?.message || err?.message || '';
      toast.error(serverMsg || 'Có lỗi xảy ra khi cập nhật thông tin nhân viên', { id: 'user-edit-toast' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = () => {
    toast.success(`Đã gửi email hướng dẫn khôi phục mật khẩu tới ${formData.email}`, { id: 'user-edit-toast' });
  };

  return (
    <div className="space-y-4 w-full font-sans pb-10 text-slate-800 dark:text-slate-200">
      {/* Top Header Navigation Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Button variant="light" size="icon" className="h-8 w-8" asChild>
            <Link to={'/users' as any} title="Quay lại danh sách">
              <ArrowLeft size={16} />
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Chỉnh sửa tài khoản nhân viên: {loading ? '...' : formData.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ID nhân viên hệ thống: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">#{userId}</span>
            </p>
          </div>
        </div>

        <div>
          {formData.is_active ? (
            <Badge variant="success" className="px-3 py-1 text-xs">
              Kích hoạt
            </Badge>
          ) : (
            <Badge variant="danger" className="px-3 py-1 text-xs">
              Đã khóa
            </Badge>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5">
        
        {/* SECTION 1: THÔNG TIN CÁ NHÂN */}
        <div className="space-y-3">
          <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-3.5 py-2 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wide border border-blue-100 dark:border-slate-800">
            I. Thông tin cá nhân
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <Label htmlFor="user-name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Họ và Tên Nhân Viên <span className="text-rose-500 font-bold">*</span>
              </Label>
              <Input
                id="user-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Nguyễn Văn Thành"
                className="text-sm h-9 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="user-birthday" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ngày Sinh
              </Label>
              <DateBox
                id="user-birthday"
                value={formData.birthday}
                onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: THÔNG TIN TÀI KHOẢN & LIÊN HỆ */}
        <div className="space-y-3">
          <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-3.5 py-2 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wide border border-blue-100 dark:border-slate-800">
            II. Thông tin tài khoản &amp; Liên hệ
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <Label htmlFor="user-email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email Công Việc (Tên đăng nhập) <span className="text-rose-500 font-bold">*</span>
              </Label>
              <Input
                id="user-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="VD: thanh.nv@superdong.com.vn"
                className="text-sm h-9 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="user-phone" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Số Điện Thoại Liên Hệ
              </Label>
              <Input
                id="user-phone"
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="VD: 0903111222"
                className="text-sm h-9 font-mono rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: PHÂN QUYỀN & VAI TRÒ */}
        <div className="space-y-3">
          <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-3.5 py-2 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wide border border-blue-100 dark:border-slate-800">
            III. Phân quyền &amp; Vai trò
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <Label htmlFor="user-role" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Vai Trò Hệ Thống
              </Label>
              <select
                id="user-role"
                value={formData.role_name}
                onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
                className="w-full h-9 px-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm outline-none cursor-pointer focus:border-blue-500"
              >
                <option value="Super Admin">Super Admin (Toàn quyền hệ thống)</option>
                <option value="Quản trị viên">Quản trị viên bến tàu / tuyến</option>
                <option value="Nhân viên quầy">Nhân viên bán vé tại quầy POS</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="reset-pwd-btn" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Khôi Phục Mật Khẩu
              </Label>
              <div>
                <Button
                  id="reset-pwd-btn"
                  type="button"
                  variant="light"
                  onClick={handleResetPassword}
                  className="h-9 text-xs gap-1.5 text-slate-700 w-full justify-start"
                >
                  <KeyRound size={14} className="text-blue-600" />
                  Gửi email cấp lại mật khẩu mới
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: TRẠNG THÁI & GHI CHÚ */}
        <div className="space-y-3">
          <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-3.5 py-2 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wide border border-blue-100 dark:border-slate-800">
            IV. Trạng thái &amp; Ghi chú
          </div>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="user-notes" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ghi chú điều chỉnh <span className="text-slate-400 font-normal">(tùy chọn)</span>
              </Label>
              <Input
                id="user-notes"
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="VD: Điều chuyển nhân sự sang bến tàu Phú Quốc..."
                className="text-sm h-9 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <input
                id="is-active-toggle"
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <Label htmlFor="is-active-toggle" className="text-xs font-semibold cursor-pointer text-slate-800 dark:text-slate-200">
                Cho phép tài khoản đăng nhập hệ thống
              </Label>
            </div>
          </div>
        </div>

        {/* Bottom Right Floating Action Bar */}
        <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" type="button" asChild className="px-5 h-9 text-xs">
            <Link to={'/users' as any}>Hủy Bỏ</Link>
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="px-6 h-9 text-xs gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Đang Lưu...
              </>
            ) : (
              <>
                <Save size={14} />
                Lưu thay đổi
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
