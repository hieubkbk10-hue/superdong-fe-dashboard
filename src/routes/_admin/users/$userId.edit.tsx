import React, { useState, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { UserCheck, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';

import { updateUser, findUserById, getRoles } from '@/apis/users';
import { Badge } from '@/components/common/Badge';
import { DateBox } from '@/components/common/DateBox';
import { Label } from '@/components/ui/label';
import {
  AdminFormHeader,
  AdminFormCard,
  FormSectionBlock,
  FormField,
  FormInputField,
  FormSelectField,
  UnsavedChangesBar,
  useFormDirty,
} from '@/components/common/FormUtilities';
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

  const [dynamicRoles, setDynamicRoles] = useState<Array<{ name: string; display_name: string }>>([]);
  const [loadingRoles, setLoadingRoles] = useState<boolean>(true);

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

  const hydrateUser = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      let cachedData: any = null;
      try {
        const localCached = localStorage.getItem(`superdong_user_cache_${userId}`);
        if (localCached) cachedData = JSON.parse(localCached);
      } catch (_) {}

      const userRes = await findUserById(userId);
      const user: any = userRes?.data || userRes;

      if (!user && !cachedData) {
        throw new Error(`Không tìm thấy người dùng có ID #${userId} trên hệ thống`);
      }

      const rawRole = getUserRoleName(user);
      const roleName = cachedData?.role_name || rawRole || 'Counter Staff';
      const isActive = cachedData?.is_active !== undefined ? cachedData.is_active : (user?.status === 'active' || user?.is_active !== false);

      const serverForm = {
        name: cachedData?.name || user?.name || '',
        email: cachedData?.email || user?.email || '',
        phone: cachedData?.phone || user?.phone || '',
        birthday: user?.birthday || '1995-01-01',
        role_name: roleName,
        status: isActive ? 'active' : 'inactive',
        is_active: isActive,
        notes: user?.notes || '',
      };

      setInitialData(serverForm);
      setFormData(serverForm);
    } catch (err: any) {
      console.error('Fetch user detail error:', err);
      const message = err?.message || 'Không thể tải thông tin người dùng từ server';
      setFetchError(message);
      toast.error(message, { id: 'user-edit-toast' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    hydrateUser();
  }, [userId]);

  const handleReset = () => {
    if (initialData) {
      setFormData(initialData);
      toast.info('Đã khôi phục dữ liệu ban đầu', { id: 'user-edit-toast' });
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Họ và Tên không được để trống!', { id: 'user-edit-toast' });
      return;
    }

    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      toast.error('Email công việc không đúng định dạng!', { id: 'user-edit-toast' });
      return;
    }

    const cleanPhone = formData.phone ? formData.phone.trim().replace(/[^0-9]/g, '') : '';
    if (cleanPhone && (cleanPhone.length < 9 || cleanPhone.length > 11)) {
      toast.error('Số điện thoại không hợp lệ! Vui lòng nhập từ 9 đến 11 chữ số (chỉ bao gồm các số 0-9).', { id: 'user-edit-toast' });
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await updateUser(userId, {
        name: formData.name,
        email: formData.email,
        phone: cleanPhone,
        status: formData.is_active ? 'active' : 'inactive',
      });

      try {
        localStorage.setItem(`superdong_user_cache_${userId}`, JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: cleanPhone,
          role_name: formData.role_name,
          is_active: formData.is_active,
        }));
      } catch (_) {}

      toast.success(`Cập nhật thông tin người dùng ${formData.name} thành công!`, { id: 'user-edit-toast' });
      navigate({ to: '/users' as any });
    } catch (err: any) {
      console.error('Update user error:', err);
      const serverMsg = err?.response?.data?.message || err?.message || '';
      toast.error(serverMsg || 'Có lỗi xảy ra khi cập nhật người dùng trên Backend', { id: 'user-edit-toast' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSuperAdmin = (formData.email || '').toLowerCase() === 'admin@admin.com' || formData.role_name === 'Super Admin';

  const roleOptions = dynamicRoles.length > 0 ? dynamicRoles : [
    { name: 'Super Admin', display_name: 'Super Admin (Administrator - Toàn quyền hệ thống Superdong)' },
    { name: 'Quản trị viên', display_name: 'Quản trị viên (Manager - Quản lý điều hành bến tàu Rạch Giá, Phú Quốc...)' },
    { name: 'Nhân viên quầy', display_name: 'Nhân viên quầy (Counter Staff - Bán vé trực tiếp tại quầy bến tàu)' },
    { name: 'Nhân viên điều hành', display_name: 'Nhân viên điều hành (Operations Staff - Phân công xếp nốt chuyến tàu)' },
    { name: 'Nhân viên soát vé', display_name: 'Nhân viên soát vé (Check-in Staff - Kiểm tra soát vé mã QR tại cổng bến tàu)' },
  ];

  if (loading) {
    return (
      <div className="h-96 w-full flex flex-col items-center justify-center gap-3 font-sans">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <span className="text-xs font-medium text-slate-500">Đang tải hồ sơ người dùng #{userId}...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full font-sans pb-20 text-slate-800 dark:text-slate-200">
      <AdminFormHeader
        icon={UserCheck}
        title={
          <>
            Chỉnh Sửa Hồ Sơ:{' '}
            <span className="text-blue-600 dark:text-blue-400 font-bold">
              {formData.name || 'Người dùng'}
            </span>
          </>
        }
        subtitle="Cập nhật thông tin cá nhân, chức vụ, vai trò và phân quyền tài khoản Superdong"
        backTo="/users"
        badge={
          isSuperAdmin ? (
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
          )
        }
      />

      <AdminFormCard onSubmit={handleSubmit}>
        <FormSectionBlock title="I. Thông tin cá nhân" columns={2}>
          <FormInputField
            id="user-name"
            label="Họ và Tên"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="VD: Nguyễn Văn Thành"
          />

          <FormField id="user-birthday" label="Ngày Sinh">
            <DateBox
              id="user-birthday"
              value={formData.birthday}
              onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
            />
          </FormField>
        </FormSectionBlock>

        <FormSectionBlock title="II. Thông tin tài khoản & Liên hệ" columns={2}>
          <FormInputField
            id="user-email"
            label="Email Công Việc (Tên đăng nhập)"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="VD: thanh.nv@superdong.com.vn"
          />

          <FormInputField
            id="user-phone"
            label="Số Điện Thoại Liên Hệ"
            value={formData.phone}
            onChange={(e) => {
              const digitsOnly = e.target.value.replace(/[^0-9]/g, '');
              setFormData({ ...formData, phone: digitsOnly });
            }}
            placeholder="VD: 0903111222"
            className="font-mono"
            helperText="Chỉ nhập chữ số 0-9 (từ 9 đến 11 số)"
          />
        </FormSectionBlock>

        {/* SECTION 3: PHÂN QUYỀN & VAI TRÒ */}
        <FormSectionBlock title="III. Phân quyền & Vai trò" columns={1}>
          <div className="max-w-xl">
            <FormSelectField
              id="user-role"
              label="Vai Trò Hệ Thống"
              required
              value={formData.role_name}
              onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
              disabled={isSuperAdmin}
              helperText={
                isSuperAdmin
                  ? 'Tài khoản Super Admin gốc hệ thống - Vai trò tối cao không thể hạ cấp.'
                  : loadingRoles
                  ? 'Đang tải vai trò từ API...'
                  : undefined
              }
            >
              {roleOptions.map((role) => (
                <option key={role.name} value={role.name}>
                  {role.display_name}
                </option>
              ))}
            </FormSelectField>
          </div>
        </FormSectionBlock>

        {/* SECTION 4: TRẠNG THÁI & GHI CHÚ */}
        <FormSectionBlock title="IV. Trạng thái & Ghi chú" columns={1}>
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

          <FormInputField
            id="user-notes"
            label="Ghi Chú Vận Hành"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Nhập ghi chú hoặc lý do thay đổi phân quyền..."
            helperText="Tùy chọn bổ sung ghi chú hồ sơ cán bộ"
          />
        </FormSectionBlock>
      </AdminFormCard>

      {/* Floating Action Bar for Unsaved Changes */}
      <UnsavedChangesBar
        isDirty={isDirty}
        isSaving={isSubmitting}
        onSave={() => handleSubmit()}
        onReset={handleReset}
      />
    </div>
  );
}
