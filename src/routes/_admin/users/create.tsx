import React, { useState, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { UserCheck } from 'lucide-react';
import { toast } from 'sonner';

import { createUser, getRoles } from '@/apis/users';
import { DateBox } from '@/components/common/DateBox';
import { PasswordInput } from '@/components/common/PasswordInput';
import { Label } from '@/components/ui/label';
import {
  AdminFormHeader,
  AdminFormCard,
  FormSectionBlock,
  FormField,
  FormInputField,
  FormSelectField,
  AdminFormActionBar,
} from '@/components/common/FormUtilities';

export const Route = createFileRoute('/_admin/users/create')({
  component: UserCreatePage,
});

const DEFAULT_FORM_DATA = {
  name: 'Trần Mạnh Hiếu',
  email: '',
  phone: '',
  birthday: '1995-01-01',
  password: '',
  role_name: 'Super Admin',
  is_active: true,
  notes: '',
};

function UserCreatePage() {
  const navigate = useNavigate();

  // DYNAMIC ROLES FROM REAL API BACKEND
  const [dynamicRoles, setDynamicRoles] = useState<Array<{ name: string; display_name: string }>>([]);
  const [loadingRoles, setLoadingRoles] = useState<boolean>(true);

  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // DYNAMIC API FETCH: Lấy danh sách Roles trực tiếp từ API `/v1/roles` của Backend & Deduplicate
  useEffect(() => {
    let isMounted = true;
    async function fetchRolesFromApi() {
      setLoadingRoles(true);
      try {
        const res = await getRoles();
        if (isMounted && res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          const uniqueRolesMap = new Map<string, { name: string; display_name: string }>();
          res.data.forEach((r: any) => {
            const raw = (r.display_name || r.name || '').trim();
            const normName = raw === 'admin' || raw === 'Administrator' ? 'Super Admin'
              : raw === 'counter_staff' || raw === 'Counter Staff' ? 'Counter Staff'
              : raw === 'manager' || raw === 'Manager' ? 'Manager'
              : raw === 'operations_staff' || raw === 'Operations Staff' ? 'Operations Staff'
              : raw === 'checkin_staff' || raw === 'Check-in Staff' ? 'Check-in Staff'
              : raw;
            if (normName && !uniqueRolesMap.has(normName)) {
              uniqueRolesMap.set(normName, {
                name: normName,
                display_name: r.description ? `${normName} (${r.description})` : normName,
              });
            }
          });
          setDynamicRoles(Array.from(uniqueRolesMap.values()));
        }
      } catch (err) {
        console.warn('Failed to fetch dynamic roles from API in create page:', err);
      } finally {
        if (isMounted) setLoadingRoles(false);
      }
    }
    fetchRolesFromApi();

    return () => { isMounted = false; };
  }, []);

  const handleResetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      birthday: '',
      password: '',
      role_name: dynamicRoles[0]?.name || 'Super Admin',
      is_active: true,
      notes: '',
    });
    toast.success('Đã làm sạch toàn bộ dữ liệu trên form!', { id: 'user-create-toast' });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Vui lòng điền Họ và Tên!', { id: 'user-create-toast' });
      return;
    }

    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      toast.error('Email công việc không hợp lệ! Ví dụ: user@superdong.com.vn', { id: 'user-create-toast' });
      return;
    }

    const cleanPhone = formData.phone ? formData.phone.trim().replace(/[^0-9]/g, '') : '';
    if (cleanPhone && (cleanPhone.length < 9 || cleanPhone.length > 11)) {
      toast.error('Số điện thoại không hợp lệ! Vui lòng nhập từ 9 đến 11 chữ số (chỉ bao gồm các số 0-9).', { id: 'user-create-toast' });
      return;
    }

    const pwd = formData.password.trim();
    if (pwd) {
      if (
        pwd.length < 8 ||
        !/[a-z]/.test(pwd) ||
        !/[A-Z]/.test(pwd) ||
        !/[0-9]/.test(pwd) ||
        !/[^a-zA-Z0-9]/.test(pwd)
      ) {
        toast.error('Mật khẩu chưa đủ độ mạnh theo yêu cầu Backend! Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt.', {
          id: 'user-create-toast',
        });
        return;
      }
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    const finalPassword = pwd || 'Superdong@2026';

    try {
      const res = await createUser({
        name: formData.name,
        email: formData.email,
        phone: cleanPhone,
        password: finalPassword,
        status: formData.is_active ? 'active' : 'inactive',
      });

      const newId = res?.data?.id || `new_${Date.now()}`;
      try {
        localStorage.setItem(`superdong_user_cache_${newId}`, JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: cleanPhone,
          role_name: formData.role_name,
          is_active: formData.is_active,
        }));
      } catch (_) {}

      toast.success(`Đã khởi tạo tài khoản người dùng ${formData.name} thành công!`, { id: 'user-create-toast' });
      navigate({ to: '/users' as any });
    } catch (err: any) {
      console.error('Create user error:', err);
      const serverMsg = err?.response?.data?.message || err?.message || '';
      toast.error(serverMsg || 'Không thể tạo tài khoản trên Backend API', { id: 'user-create-toast' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions = dynamicRoles.length > 0 ? dynamicRoles : [
    { name: 'Super Admin', display_name: 'Super Admin (Administrator - Toàn quyền hệ thống Superdong)' },
    { name: 'Quản trị viên', display_name: 'Quản trị viên (Manager - Quản lý điều hành bến tàu Rạch Giá, Phú Quốc...)' },
    { name: 'Nhân viên quầy', display_name: 'Nhân viên quầy (Counter Staff - Bán vé trực tiếp tại quầy bến tàu)' },
    { name: 'Nhân viên điều hành', display_name: 'Nhân viên điều hành (Operations Staff - Phân công xếp nốt chuyến tàu)' },
    { name: 'Nhân viên soát vé', display_name: 'Nhân viên soát vé (Check-in Staff - Kiểm tra soát vé mã QR tại cổng bến tàu)' },
  ];

  return (
    <div className="space-y-4 w-full font-sans pb-20 text-slate-800 dark:text-slate-200">
      {/* Top Header Navigation Bar */}
      <AdminFormHeader
        icon={UserCheck}
        title="Tạo Tài Khoản Người Dùng Mới"
        subtitle="Khởi tạo tài khoản và cấp quyền truy cập hệ thống quản trị Superdong"
        backTo="/users"
        onClear={handleResetForm}
        clearLabel="Làm sạch dữ liệu"
      />

      {/* Main Single Card Form */}
      <AdminFormCard onSubmit={handleSubmit}>
        {/* SECTION 1: THÔNG TIN CÁ NHÂN */}
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

        {/* SECTION 2: THÔNG TIN TÀI KHOẢN & LIÊN HỆ */}
        <FormSectionBlock title="II. Thông tin tài khoản & Liên hệ" columns={2}>
          <FormInputField
            id="user-email"
            label="Email Công Việc (Tên đăng nhập)"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="VD: tranmanhhieu10@gmail.com"
          />

          <FormInputField
            id="user-phone"
            label="Số Điện Thoại Liên Hệ"
            value={formData.phone}
            onChange={(e) => {
              const digitsOnly = e.target.value.replace(/[^0-9]/g, '');
              setFormData({ ...formData, phone: digitsOnly });
            }}
            placeholder="VD: 0948066514"
            className="font-mono"
            helperText="Chỉ nhập chữ số 0-9 (từ 9 đến 11 số)"
          />
        </FormSectionBlock>

        {/* SECTION 3: PHÂN QUYỀN & MẬT KHẨU */}
        <FormSectionBlock title="III. Phân quyền & Mật khẩu khởi tạo" columns={2}>
          <FormSelectField
            id="user-role"
            label="Vai Trò Hệ Thống"
            required
            value={formData.role_name}
            onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
            helperText={loadingRoles ? 'Đang tải vai trò từ API...' : undefined}
          >
            {roleOptions.map((r, i) => (
              <option key={i} value={r.name}>
                {r.display_name}
              </option>
            ))}
          </FormSelectField>

          <FormField
            id="user-password"
            label="Mật Khẩu Ban Đầu"
            helperText="Để trống sẽ dùng mặc định: Superdong@2026"
          >
            <PasswordInput
              id="user-password"
              value={formData.password}
              onChange={(val) => setFormData({ ...formData, password: val })}
              placeholder="Nhập mật khẩu (VD: Superdong@2026)"
              showRequirements={true}
            />
          </FormField>
        </FormSectionBlock>

        {/* SECTION 4: TRẠNG THÁI & GHI CHÚ */}
        <FormSectionBlock title="IV. Trạng thái & Ghi chú" columns={1}>
          <FormInputField
            id="user-notes"
            label="Ghi Chú Bổ Sung"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="VD: Cán bộ phòng vé Rạch Giá..."
          />

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
        </FormSectionBlock>

        {/* Master Action Bar */}
        <AdminFormActionBar
          mode="create"
          isSubmitting={isSubmitting}
          cancelTo="/users"
          submitLabel="Tạo tài khoản mới"
          onClear={handleResetForm}
          clearLabel="Làm sạch dữ liệu"
        />
      </AdminFormCard>
    </div>
  );
}

