import React, { useState, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { findBooking, updateBooking } from '@/apis/bookings';
import { Badge } from '@/components/common/Badge';
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

export const Route = createFileRoute('/_admin/bookings/$bookingId/edit')({
  component: BookingEditPage,
});

function BookingEditPage() {
  const { bookingId } = Route.useParams();
  const navigate = useNavigate();

  const [initialData, setInitialData] = useState<any>(null);
  const [formData, setFormData] = useState({
    booking_code: 'BK-99201',
    booker_name: 'Nguyễn Văn Hùng',
    booker_phone: '0903.123.456',
    booker_email: 'hung.nguyen@gmail.com',
    booker_id: '079088123456',
    status: 'confirmed',
    payment_status: 'paid',
    payment_method: 'vnpay',
    coupon_code: 'SUMMER2026',
    total_amount: 680000,
    discount_amount: 50000,
    final_amount: 630000,
    notes: 'Khách hàng đặt vé đi du lịch gia đình',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isDirty } = useFormDirty(initialData, formData);

  const hydrateBooking = async () => {
    try {
      const res = await findBooking(bookingId);
      if (res && res.data) {
        const b = res.data;
        const loadedData = {
          booking_code: b.booking_code || 'BK-99201',
          booker_name: b.booker?.name || '',
          booker_phone: b.booker?.phone || '',
          booker_email: b.booker?.email || '',
          booker_id: b.booker?.id_card || '',
          status: b.status || 'confirmed',
          payment_status: b.payment_status || 'paid',
          payment_method: 'vnpay',
          coupon_code: b.coupon_code || '',
          total_amount: b.total_amount || 0,
          discount_amount: b.discount_amount || 0,
          final_amount: b.final_amount || 0,
          notes: 'Khách hàng đặt vé đi du lịch gia đình',
        };
        setInitialData(loadedData);
        setFormData(loadedData);
      }
    } catch (err) {
      console.warn('Booking not found in backend API, using initial state:', err);
    }
  };

  useEffect(() => {
    hydrateBooking();
  }, [bookingId]);

  const handleReset = () => {
    if (initialData) {
      setFormData(initialData);
      toast.info('Đã khôi phục dữ liệu ban đầu');
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateBooking(bookingId, {
        status: formData.status as any,
        payment_status: formData.payment_status as any,
        booker: {
          name: formData.booker_name,
          phone: formData.booker_phone,
          email: formData.booker_email,
          id_card: formData.booker_id,
        },
      });
      toast.success(`Đã cập nhật thông tin đơn vé ${formData.booking_code}`);
      navigate({ to: '/bookings' as any });
    } catch (err: any) {
      console.error('Failed to update booking:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi cập nhật đơn vé trên Backend Server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="space-y-4 w-full font-sans pb-20 text-slate-800 dark:text-slate-200">
      {/* Top Header Navigation Bar */}
      <AdminFormHeader
        icon={ShoppingCart}
        title={
          <>
            Chỉnh Sửa Đơn Đặt Vé:{' '}
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
              {formData.booking_code}
            </span>
          </>
        }
        subtitle={
          <>
            Mã định danh hệ thống: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">#{bookingId}</span>
          </>
        }
        backTo="/bookings"
        badge={
          <Badge
            variant={formData.status === 'confirmed' ? 'success' : formData.status === 'pending' ? 'blue' : 'danger'}
            className="px-3 py-1 text-xs uppercase font-bold"
          >
            {formData.status}
          </Badge>
        }
      />

      {/* Main Single Card Form */}
      <AdminFormCard onSubmit={handleSubmit}>
        {/* SECTION 1: THÔNG TIN NGƯỜI ĐẠI DIỆN */}
        <FormSectionBlock title="I. Thông tin người đại diện đặt vé" columns={2}>
          <FormInputField
            id="booking-code"
            label="Mã Đơn Vé"
            required
            value={formData.booking_code}
            onChange={(e) => setFormData({ ...formData, booking_code: e.target.value })}
            className="font-mono font-bold text-blue-600 dark:text-blue-400"
            disabled
          />

          <FormInputField
            id="booker-name"
            label="Họ và Tên Người Đặt"
            required
            value={formData.booker_name}
            onChange={(e) => setFormData({ ...formData, booker_name: e.target.value })}
          />

          <FormInputField
            id="booker-phone"
            label="Số Điện Thoại Liên Hệ"
            required
            type="tel"
            value={formData.booker_phone}
            onChange={(e) => setFormData({ ...formData, booker_phone: e.target.value })}
          />

          <FormInputField
            id="booker-email"
            label="Email Liên Hệ"
            type="email"
            value={formData.booker_email}
            onChange={(e) => setFormData({ ...formData, booker_email: e.target.value })}
          />

          <FormInputField
            id="booker-id"
            label="Số CMND / CCCD"
            value={formData.booker_id}
            onChange={(e) => setFormData({ ...formData, booker_id: e.target.value })}
            className="font-mono"
          />
        </FormSectionBlock>

        {/* SECTION 2: TRẠNG THÁI & THANH TOÁN */}
        <FormSectionBlock title="II. Trạng thái & Hình thức thanh toán" columns={3}>
          <FormSelectField
            id="booking-status"
            label="Trạng Thái Đơn Vé"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: 'confirmed', label: 'Xác nhận (Confirmed)' },
              { value: 'pending', label: 'Chờ xử lý (Pending)' },
              { value: 'cancelled', label: 'Đã hủy (Cancelled)' },
            ]}
          />

          <FormSelectField
            id="booking-payment-status"
            label="Trạng Thái Thanh Toán"
            value={formData.payment_status}
            onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
            options={[
              { value: 'paid', label: 'Đã thanh toán (Paid)' },
              { value: 'unpaid', label: 'Chưa thanh toán (Unpaid)' },
              { value: 'refunded', label: 'Đã hoàn tiền (Refunded)' },
            ]}
          />

          <FormSelectField
            id="booking-payment-method"
            label="Phương Thức Thanh Toán"
            value={formData.payment_method}
            onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
            options={[
              { value: 'vnpay', label: 'VNPAY Online' },
              { value: 'cash', label: 'Tiền mặt tại quầy' },
              { value: 'office_bank_transfer', label: 'Chuyển khoản Ngân hàng' },
              { value: 'momo', label: 'Ví MoMo' },
            ]}
          />

          <div className="md:col-span-2">
            <FormField id="booking-notes" label="Ghi Chú Đơn Hàng">
              <textarea
                id="booking-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full p-3 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 outline-none focus:border-blue-500"
              />
            </FormField>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Tổng tiền vé:</span>
              <span className="font-semibold">{formatCurrency(formData.total_amount)}</span>
            </div>
            <div className="flex justify-between text-xs text-emerald-600">
              <span>Giảm giá (Voucher):</span>
              <span>-{formatCurrency(formData.discount_amount)}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="font-bold text-slate-900 dark:text-white text-sm">Tổng thanh toán:</span>
              <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
                {formatCurrency(formData.final_amount)}
              </span>
            </div>
          </div>
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

