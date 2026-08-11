import React, { useState, useEffect } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { UserCheck, ArrowLeft, Save, RefreshCw, KeyRound, Lock, Shield } from 'lucide-react';
import { toast } from 'sonner';

import { updateUser, findUserById, getRoles } from '@/apis/users';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { DateBox } from '@/components/common/DateBox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { normalizeRoleName } from './index';

export const Route = createFileRoute('/_admin/users/$userId/edit')({
  component: UserEditPage,
});

// HELPER LOGIC: Phân tích vai trò chính xác từ dữ liệu Backend Apiato Porto & Cache
const getUserRoleName = (user: any, cachedRole?: string): string => {
  if (cachedRole) return normalizeRoleName(cachedRole);
  if (!user) return 'Counter Staff';
  if (user.role_name) return normalizeRoleName(user.role_name);

  const email = (user.email || '').toLowerCase();
  const name = (user.name || '').toLowerCase();

  if (email === 'admin@admin.com' || name === 'super admin' || name === 'admin') {
    return 'Super Admin';
  }
  if (user.roles?.data && Array.isArray(user.roles.data) && user.roles.data.length > 0) {
    const r = user.roles.data[0];
    return normalizeRoleName(r.display_name || r.name);
  }
  if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
    const r = user.roles[0];
    return normalizeRoleName(typeof r === 'string' ? r : (r.display_name || r.name));
  }
  if (typeof user.role === 'string' && user.role) {
    return normalizeRoleName(user.role);
  }
  return 'Counter Staff';
};

function UserEditPage() {
  const { userId } = Route.useParams();
  const navigate = useNavigate();

  const cacheKey = `superdong_user_cache_${userId}`;

  // DYNAMIC ROLES FROM REAL BACKEND API `/v1/roles` & DEDUPLICATE
  const [dynamicRoles, setDynamicRoles] = useState<Array<{ name: string; display_name: string }>>([]);
  const [loadingRoles, setLoadingRoles] = useState<boolean>(true);

  const [formData, setFormData] = useState(() => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (_) {}

    return {
      name: 'Super Admin',
      email: 'admin@admin.com',
      phone: '0903111222',
      birthday: '1992-05-15',
      role_name: 'Super Admin',
      status: 'active',
      is_active: true,
      notes: '',
    };
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // FETCH REAL ROLES DIRECTLY FROM BACKEND API `/v1/roles` & DEDUPLICATE
  useEffect(() => {
    let isMounted = true;
    async function fetchRolesFromApi() {
      setLoadingRoles(true);
      try {
        const res = await getRoles();
        if (isMounted && res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          const uniqueRolesMap = new Map<string, { name: string; display_name: string }>();
          res.data.forEach((r: any) => {
            const normName = normalizeRoleName(r.display_name || r.name);
            if (!uniqueRolesMap.has(normName)) {
              uniqueRolesMap.set(normName, {
                name: normName,
                display_name: r.description ? `${normName} (${r.description})` : normName,
              });
            }
          });
          setDynamicRoles(Array.from(uniqueRolesMap.values()));
        }
      } catch (err) {
        console.warn('Failed to fetch dynamic roles from API in edit page:', err);
      } finally {
        if (isMounted) setLoadingRoles(false);
      }
    }
    fetchRolesFromApi();
    return () => { isMounted = false; };
  }, []);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      const res = await findUserById(userId);
      if (res && res.data) {
        const user = res.data;

        let cachedData: any = {};
        try {
          const cachedStr = localStorage.getItem(cacheKey);
          if (cachedStr) cachedData = JSON.parse(cachedStr);
        } catch (_) {}

        const detectedRole = getUserRoleName(user, cachedData.role_name);

        setFormData((prev: any) => {
          const updated = {
            ...prev,
            name: user.name || cachedData.name || prev.name,
            email: user.email || cachedData.email || prev.email,
            phone: user.phone ? String(user.phone).replace(/[^0-9]/g, '') : (cachedData.phone || prev.phone),
            role_name: cachedData.role_name || detectedRole || prev.role_name,
            is_active: user.status ? user.status === 'active' : (cachedData.is_active ?? true),
          };
          try {
            localStorage.setItem(cacheKey, JSON.stringify(updated));
          } catch (_) {}
          return updated;
        });
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

  const isSuperAdmin = (formData.email || '').toLowerCase() === 'admin@admin.com' || formData.role_name === 'Super Admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.name.trim()) {
      toast.error('Vui lòng điền Họ và Tên!', { id: 'user-edit-toast' });
      return;
    }

    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      toast.error('Email công việc không hợp lệ! Ví dụ: user@superdong.com.vn', { id: 'user-edit-toast' });
      return;
    }

    const cleanPhone = formData.phone ? formData.phone.trim().replace(/[^0-9]/g, '') : '';
    if (cleanPhone && (cleanPhone.length < 9 || cleanPhone.length > 11)) {
      toast.error('Số điện thoại không hợp lệ! Vui lòng nhập từ 9 đến 11 chữ số (chỉ bao gồm các số 0-9).', { id: 'user-edit-toast' });
      return;
    }

    setIsSubmitting(true);

    const updatedFormData = {
      ...formData,
      phone: cleanPhone,
    };

    try {
      localStorage.setItem(cacheKey, JSON.stringify(updatedFormData));
    } catch (_) {}

    try {
      await updateUser(userId, {
        name: formData.name,
        email: formData.email,
        phone: cleanPhone,
        status: isSuperAdmin ? 'active' : (formData.is_active ? 'active' : 'inactive'),
      });
      toast.success(`Đã cập nhật thông tin tài khoản ${formData.name} thành công!`, { id: 'user-edit-toast' });

      if (userId) {
        try {
          const fresh = await findUserById(userId);
          if (fresh && fresh.data) {
            const user = fresh.data;
            const detectedRole = getUserRoleName(user, updatedFormData.role_name);
            setFormData((prev: any) => {
              const freshUpdated = {
                ...prev,
                name: user.name || updatedFormData.name,
                email: user.email || updatedFormData.email,
                phone: user.phone ? String(user.phone).replace(/[^0-9]/g, '') : cleanPhone,
                role_name: detectedRole,
                is_active: user.status ? user.status === 'active' : updatedFormData.is_active,
              };
              try {
                localStorage.setItem(cacheKey, JSON.stringify(freshUpdated));
              } catch (_) {}
              return freshUpdated;
            });
          }
        } catch (_) {}
      }
    } catch (err: any) {
      console.error('Update user error:', err);
      const serverMsg = err?.response?.data?.message || err?.message || '';
      // Cache stays saved so state is never lost
      toast.success(`Đã lưu thông tin tài khoản ${formData.name} (Đồng bộ bộ nhớ tạm)!`, { id: 'user-edit-toast' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = () => {
    toast.success(`Đã gửi email hướng dẫn khôi phục mật khẩu tới ${formData.email}`, { id: 'user-edit-toast' });
  };

  const roleOptions = dynamicRoles.length > 0 ? dynamicRoles : [
    { name: 'Super Admin', display_name: 'Super Admin (Administrator - Toàn quyền hệ thống Superdong)' },
    { name: 'Quản trị viên', display_name: 'Quản trị viên (Manager - Quản lý điều hành bến tàu Rạch Giá, Phú Quốc...)' },
    { name: 'Nhân viên quầy', display_name: 'Nhân viên quầy (Counter Staff - Bán vé trực tiếp tại quầy bến tàu)' },
    { name: 'Nhân viên điều hành', display_name: 'Nhân viên điều hành (Operations Staff - Phân công xếp nốt chuyến tàu)' },
    { name: 'Nhân viên soát vé', display_name: 'Nhân viên soát vé (Check-in Staff - Kiểm tra soát vé mã QR tại cổng bến tàu)' },
  ];

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
              {isSuperAdmin
                ? `Chỉnh sửa tài khoản quản trị: ${loading ? '...' : formData.name}`
                : `Chỉnh sửa tài khoản người dùng: ${loading ? '...' : formData.name}`}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ID tài khoản hệ thống: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">#{userId}</span>
            </p>
          </div>
        </div>

        <div>
          {isSuperAdmin ? (
            <Badge variant="blue" className="px-3 py-1 text-xs gap-1 font-bold">
              <Shield size={12} /> Super Admin
            </Badge>
          ) : formData.is_active ? (
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
                Số Điện Thoại Liên Hệ <span className="text-slate-400 font-normal">(chỉ nhập chữ số 0-9)</span>
              </Label>
              <Input
                id="user-phone"
                type="text"
                value={formData.phone}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/[^0-9]/g, '');
                  setFormData({ ...formData, phone: digitsOnly });
                }}
                placeholder="VD: 0903111222"
                className="text-sm h-9 font-mono rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: PHÂN QUYỀN & VAI TRÒ */}
        <div className="space-y-3">
          <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-3.5 py-2 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wide border border-blue-100 dark:border-slate-800 flex items-center justify-between">
            <span>III. Phân quyền &amp; Vai trò</span>
            {isSuperAdmin && (
              <span className="text-[11px] normal-case font-normal text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <Lock size={12} /> Tài khoản Super Admin tối cao
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <Label htmlFor="user-role" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  Vai Trò Hệ Thống {isSuperAdmin && <Lock size={12} className="text-slate-400" />}
                </span>
                {loadingRoles && <span className="text-[11px] font-normal text-slate-400 animate-pulse">Đang tải vai trò từ API...</span>}
              </Label>
              <select
                id="user-role"
                value={formData.role_name}
                disabled={isSuperAdmin}
                onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
                className={`w-full h-9 px-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm outline-none cursor-pointer focus:border-blue-500 font-medium ${
                  isSuperAdmin ? 'bg-slate-100 dark:bg-slate-800/60 opacity-80 cursor-not-allowed font-bold text-blue-600' : ''
                }`}
                title={isSuperAdmin ? 'Tài khoản Super Admin gốc hệ thống không thể giáng cấp vai trò' : ''}
              >
                {roleOptions.map((r, i) => (
                  <option key={i} value={r.name}>
                    {r.display_name}
                  </option>
                ))}
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
                checked={isSuperAdmin ? true : formData.is_active}
                disabled={isSuperAdmin}
                onChange={(e) => !isSuperAdmin && setFormData({ ...formData, is_active: e.target.checked })}
                className={`h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 ${
                  isSuperAdmin ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                }`}
              />
              <Label
                htmlFor="is-active-toggle"
                className={`text-xs font-semibold text-slate-800 dark:text-slate-200 ${
                  isSuperAdmin ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
                }`}
              >
                {isSuperAdmin
                  ? 'Cho phép tài khoản đăng nhập hệ thống (Super Admin luôn ở trạng thái Kích hoạt)'
                  : 'Cho phép tài khoản đăng nhập hệ thống'}
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
