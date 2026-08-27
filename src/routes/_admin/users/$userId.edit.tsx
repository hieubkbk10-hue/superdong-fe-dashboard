import { UnsavedChangesBar } from '@/components/common/UnsavedChangesBar';
import { useFormDirty } from '@/components/common/FormUtilities';
import React, { useState, useEffect } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { UserCheck, ArrowLeft, Save, RefreshCw, KeyRound, Lock, Shield, Loader2 } from 'lucide-react';
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

// HELPER LOGIC: Phân tích vai trò chính xác từ dữ liệu Backend Apiato Porto
const getUserRoleName = (user: any): string => {
  if (!user) return '';
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

  const draftKey = `superdong_user_draft_edit_${userId}`;

  // DYNAMIC ROLES FROM REAL BACKEND API `/v1/roles` & DEDUPLICATE
  const [dynamicRoles, setDynamicRoles] = useState<Array<{ name: string; display_name: string }>>([]);
  const [loadingRoles, setLoadingRoles] = useState<boolean>(true);

  // NO FAKE FALLBACK DATA IN INITIAL STATE (Rule 10 SKILL.md)
  const [initialData, setInitialData] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    birthday: '',
    role_name: '',
    status: 'active',
    is_active: true,
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isDirty } = useFormDirty(initialData, formData, ['notes', 'is_active']);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // FETCH REAL ROLES DIRECTLY FROM BACKEND API `/v1/roles` & DEDUPLICATE (Rule 1 & 13)
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

  // HYDRATE REAL USER DETAILS + F5 DRAFT PERSISTENCE (Rule 6 & 10)
  const fetchUserDetails = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await findUserById(userId);
      if (res && res.data) {
        const user = res.data;
        const detectedRole = getUserRoleName(user);

        const serverData = {
          name: user.name || '',
          email: user.email || '',
          phone: user.phone ? String(user.phone).replace(/[^0-9]/g, '') : '',
          birthday: user.birth ? String(user.birth).split('T')[0] : '',
          role_name: detectedRole || 'Counter Staff',
          status: user.status || 'active',
          is_active: user.status === 'active',
          notes: '',
        };

        // F5 Draft Recovery if draft exists for this userId
        let finalData = serverData;
        try {
          const draftStr = localStorage.getItem(draftKey);
          if (draftStr) {
            finalData = { ...serverData, ...JSON.parse(draftStr) };
          }
        } catch (_) {}

        setInitialData(serverData);
          setFormData(finalData);
      } else {
        setFetchError('Không tìm thấy dữ liệu người dùng từ hệ thống.');
      }
    } catch (err: any) {
      console.warn('Fetch user details error:', err);
      const msg = err?.response?.data?.message || 'Không thể tải thông tin nhân viên từ Backend API.';
      setFetchError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchUserDetails();
  }, [userId]);

  // Save F5 Draft on form change after initial load
  useEffect(() => {
    if (!loading && !fetchError && formData.name) {
      try {
        localStorage.setItem(draftKey, JSON.stringify(formData));
      } catch (_) {}
    }
  }, [formData, loading, fetchError, draftKey]);

  const isSuperAdmin = (formData.email || '').toLowerCase() === 'admin@admin.com' || formData.role_name === 'Super Admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.name.trim()) {
      toast.error('Vui lòng điền Họ và Tên!');
      return;
    }

    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      toast.error('Email công việc không hợp lệ! Ví dụ: user@superdong.com.vn');
      return;
    }

    const cleanPhone = formData.phone ? formData.phone.trim().replace(/[^0-9]/g, '') : '';
    if (cleanPhone && (cleanPhone.length < 9 || cleanPhone.length > 11)) {
      toast.error('Số điện thoại không hợp lệ! Vui lòng nhập từ 9 đến 11 chữ số.');
      return;
    }

    setIsSubmitting(true);

    try {
      await updateUser(userId, {
        name: formData.name,
        email: formData.email,
        phone: cleanPhone,
        status: isSuperAdmin ? 'active' : (formData.is_active ? 'active' : 'inactive'),
      });

      // Clear draft on successful save (Rule 6)
      try {
        localStorage.removeItem(draftKey);
      } catch (_) {}

      toast.success(`Đã cập nhật thông tin tài khoản ${formData.name} thành công!`);
      navigate({ to: '/users' as any });
    } catch (err: any) {
      console.error('Update user error:', err);
      const serverMsg = err?.response?.data?.message || 'Không thể lưu thay đổi tài khoản.';
      toast.error(serverMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions = dynamicRoles.length > 0 ? dynamicRoles : [
    { name: 'Super Admin', display_name: 'Super Admin (Administrator)' },
    { name: 'Quản trị viên', display_name: 'Quản trị viên (Manager)' },
    { name: 'Nhân viên quầy', display_name: 'Nhân viên quầy (Counter Staff)' },
    { name: 'Nhân viên điều hành', display_name: 'Nhân viên điều hành (Operations Staff)' },
    { name: 'Nhân viên soát vé', display_name: 'Nhân viên soát vé (Check-in Staff)' },
  ];

  if (loading) {
    return (
      <div className="h-96 w-full flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <span className="text-sm font-medium text-slate-500">Đang tải thông tin nhân viên...</span>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium">
          {fetchError}
        </div>
        <Button variant="outline" asChild>
          <Link to={'/users' as any}>Quay lại danh sách Nhân viên</Link>
        </Button>
      </div>
    );
  }

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
                ? `Chỉnh sửa tài khoản quản trị: ${formData.name || '...'}`
                : `Chỉnh sửa tài khoản người dùng: ${formData.name || '...'}`}
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

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-5">
        
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
          <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-3.5 py-2 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wide border border-blue-100 dark:border-slate-800">
            III. Phân quyền &amp; Vai trò
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <Label htmlFor="user-role" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Vai Trò Hệ Thống <span className="text-rose-500 font-bold">*</span>
              </Label>
              <select
                id="user-role"
                value={formData.role_name}
                onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
                disabled={isSuperAdmin}
                className="w-full text-sm h-9 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              >
                {roleOptions.map((role) => (
                  <option key={role.name} value={role.name}>
                    {role.display_name}
                  </option>
                ))}
              </select>
              {isSuperAdmin && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1 font-medium">
                  <Lock size={12} /> Tài khoản Super Admin gốc hệ thống - Vai trò tối cao không thể hạ cấp.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 4: TRẠNG THÁI & GHI CHÚ */}
        <div className="space-y-3">
          <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-3.5 py-2 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wide border border-blue-100 dark:border-slate-800">
            IV. Trạng thái &amp; Ghi chú
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                id="user-status"
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                disabled={isSuperAdmin}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
              />
              <Label htmlFor="user-status" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                Kích hoạt tài khoản hoạt động
              </Label>
            </div>

            <div className="space-y-1">
              <Label htmlFor="user-notes" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ghi Chú Vận Hành <span className="text-slate-400 font-normal">(Không bắt buộc)</span>
              </Label>
              <textarea
                id="user-notes"
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Nhập ghi chú hoặc lý do thay đổi phân quyền..."
                className="w-full text-sm p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              try {
                localStorage.removeItem(draftKey);
              } catch (_) {}
              navigate({ to: '/users' as any });
            }}
          >
            Hủy Bỏ
          </Button>

          <Button type="submit" disabled={isSubmitting} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold">
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Đang lưu...
              </>
            ) : (
              <>
                <Save size={16} /> Lưu Thay Đổi
              </>
            )}
          </Button>
        </div>
      </form>

      <UnsavedChangesBar isDirty={isDirty} isSaving={isSubmitting} onSave={() => handleSubmit({ preventDefault: () => {} } as any)} onReset={() => { if (initialData) setFormData(initialData); }} />
    </div>
  );
}
