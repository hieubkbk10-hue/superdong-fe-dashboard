import React, { useState } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { UserCheck, ArrowLeft, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { createUser } from '@/apis/users';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { DateBox } from '@/components/common/DateBox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const Route = createFileRoute('/_admin/users/create')({
  component: UserCreatePage,
});

function UserCreatePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    birthday: '1995-01-01',
    password: '',
    role_name: 'Nhân viên quầy',
    is_active: true,
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Vui lòng điền Họ tên và Email tài khoản!', { id: 'user-create-toast' });
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await createUser({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password || undefined,
        status: formData.is_active ? 'active' : 'inactive',
      } as any);
      toast.success(`Đã tạo tài khoản ${formData.name} thành công trên Backend`, { id: 'user-create-toast' });
      navigate({ to: '/users' as any });
    } catch (err: any) {
      console.error('Create user error:', err);
      const serverMsg = err?.response?.data?.message || err?.message || '';
      toast.error(serverMsg || 'Không thể tạo tài khoản trên Backend API', { id: 'user-create-toast' });
    } finally {
      setIsSubmitting(false);
    }
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
              Tạo tài khoản người dùng mới
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Khởi tạo tài khoản và cấp quyền truy cập hệ thống Superdong
            </p>
          </div>
        </div>

        <div>
          <Badge variant="blue" className="px-3 py-1 text-xs">
            Tài khoản mới
          </Badge>
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
                Họ và Tên <span className="text-rose-500 font-bold">*</span>
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

        {/* SECTION 3: PHÂN QUYỀN & MẬT KHẨU */}
        <div className="space-y-3">
          <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-3.5 py-2 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wide border border-blue-100 dark:border-slate-800">
            III. Phân quyền &amp; Mật khẩu khởi tạo
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
              <Label htmlFor="user-password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Mật Khẩu Ban Đầu <span className="text-slate-400 font-normal">(để trống sẽ dùng mặc định)</span>
              </Label>
              <Input
                id="user-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="text-sm h-9 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
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
                Ghi chú bổ sung <span className="text-slate-400 font-normal">(tùy chọn)</span>
              </Label>
              <Input
                id="user-notes"
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="VD: Cán bộ phòng vé Rạch Giá..."
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
                Kích hoạt sử dụng tài khoản ngay lập tức
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
                Đang Tạo...
              </>
            ) : (
              <>
                <Save size={14} />
                Tạo tài khoản mới
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
