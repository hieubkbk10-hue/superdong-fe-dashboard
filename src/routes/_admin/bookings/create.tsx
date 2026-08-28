import React, { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ShoppingCart, Plus, Trash2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { createBooking } from '@/apis/bookings';
import {
  AdminFormHeader,
  AdminFormCard,
  FormSectionBlock,
  FormField,
  FormInputField,
  FormSelectField,
  AdminFormActionBar,
} from '@/components/common/FormUtilities';

export const Route = createFileRoute('/_admin/bookings/create')({
  component: BookingCreatePage,
});

interface TravelerRow {
  full_name: string;
  id_number: string;
  traveler_type: string;
  seat_code: string;
  price: number;
}

function BookingCreatePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Booker info
  const [booker, setBooker] = useState({
    name: '',
    phone: '',
    email: '',
    id_card: '',
    address: '',
  });

  // Trip selection
  const [routeSelect, setRouteSelect] = useState('RG-PQ');
  const [departureDate, setDepartureDate] = useState('2026-08-15');
  const [tripTime, setTripTime] = useState('07:30 - Superdong IX');

  // Coupon & Payment
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentStatus, setPaymentStatus] = useState('paid');

  // Travelers list
  const [travelers, setTravelers] = useState<TravelerRow[]>([
    { full_name: '', id_number: '', traveler_type: 'adult', seat_code: 'A01', price: 340000 },
  ]);

  const handleClear = () => {
    setBooker({
      name: '',
      phone: '',
      email: '',
      id_card: '',
      address: '',
    });
    setCouponCode('');
    setDiscountAmount(0);
    setTravelers([
      { full_name: '', id_number: '', traveler_type: 'adult', seat_code: 'A01', price: 340000 },
    ]);
    toast.success('Đã làm sạch dữ liệu nhập');
  };

  const handleAddTraveler = () => {
    const nextSeatNum = travelers.length + 1;
    const padNum = nextSeatNum < 10 ? `0${nextSeatNum}` : `${nextSeatNum}`;
    setTravelers((prev) => [
      ...prev,
      { full_name: '', id_number: '', traveler_type: 'adult', seat_code: `A${padNum}`, price: 340000 },
    ]);
  };

  const handleRemoveTraveler = (index: number) => {
    if (travelers.length <= 1) {
      toast.error('Đơn đặt vé phải có ít nhất 1 hành khách!');
      return;
    }
    setTravelers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTravelerChange = (index: number, field: keyof TravelerRow, value: any) => {
    setTravelers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'traveler_type') {
        if (value === 'child') updated[index].price = 250000;
        else if (value === 'senior') updated[index].price = 290000;
        else updated[index].price = 340000;
      }
      return updated;
    });
  };

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === 'SUMMER2026') {
      setDiscountAmount(50000);
      toast.success('Đã áp dụng mã SUMMER2026: Giảm 50.000 ₫');
    } else if (couponCode.trim() !== '') {
      toast.error('Mã khuyến mãi không hợp lệ hoặc đã hết hạn!');
    }
  };

  const totalAmount = travelers.reduce((sum, t) => sum + (t.price || 0), 0);
  const finalAmount = Math.max(0, totalAmount - discountAmount);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!booker.name || !booker.phone) {
      toast.error('Vui lòng điền đầy đủ họ tên và số điện thoại người đặt vé!', { id: 'booking-create-toast' });
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await createBooking({
        booker: booker as any,
        travelers: travelers as any,
        total_amount: totalAmount,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        coupon_code: couponCode || undefined,
        payment_status: paymentStatus as any,
        status: 'confirmed',
      });
      toast.success(`Đã tạo thành công đơn đặt vé cho khách ${booker.name}!`, { id: 'booking-create-toast' });
      navigate({ to: '/bookings' as any });
    } catch (error: any) {
      console.error('Failed to create booking:', error);
      const serverMsg = error?.response?.data?.message || error?.message || '';
      toast.error(serverMsg || 'Lỗi: Không thể tạo đơn đặt vé trên Backend Server', { id: 'booking-create-toast' });
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
        title="Tạo Đơn Đặt Vé Mới"
        subtitle="Đặt vé tàu cho hành khách tại quầy vé hoặc qua kênh tổng đài Superdong"
        backTo="/bookings"
        onClear={handleClear}
        clearLabel="Làm sạch dữ liệu"
      />

      {/* Main Single Card Form */}
      <AdminFormCard onSubmit={handleSubmit}>
        {/* SECTION 1: THÔNG TIN NGƯỜI ĐẶT VÉ */}
        <FormSectionBlock title="I. Thông tin người đại diện đặt vé" columns={2}>
          <FormInputField
            id="booker-name"
            label="Họ và Tên Người Đặt"
            required
            value={booker.name}
            onChange={(e) => setBooker({ ...booker, name: e.target.value })}
            placeholder="VD: Nguyễn Văn Hùng"
          />

          <FormInputField
            id="booker-phone"
            label="Số Điện Thoại Liên Hệ"
            required
            type="tel"
            value={booker.phone}
            onChange={(e) => setBooker({ ...booker, phone: e.target.value })}
            placeholder="VD: 0903123456"
          />

          <FormInputField
            id="booker-email"
            label="Địa Chỉ Email (Nhận vé điện tử)"
            type="email"
            value={booker.email}
            onChange={(e) => setBooker({ ...booker, email: e.target.value })}
            placeholder="VD: customer@gmail.com"
          />

          <FormInputField
            id="booker-id-card"
            label="Số CMND / CCCD / Hộ Chiếu"
            value={booker.id_card}
            onChange={(e) => setBooker({ ...booker, id_card: e.target.value })}
            placeholder="VD: 079088123456"
            className="font-mono"
          />
        </FormSectionBlock>

        {/* SECTION 2: HẢI TRÌNH & CHUYẾN TÀU */}
        <FormSectionBlock title="II. Chọn hải trình & Chuyến tàu" columns={3}>
          <FormSelectField
            id="trip-route"
            label="Tuyến Hải Trình"
            value={routeSelect}
            onChange={(e) => setRouteSelect(e.target.value)}
            options={[
              { value: 'RG-PQ', label: 'Rạch Giá ➔ Phú Quốc' },
              { value: 'HT-PQ', label: 'Hà Tiên ➔ Phú Quốc' },
              { value: 'TD-CD', label: 'Trần Đề ➔ Côn Đảo' },
              { value: 'RG-ND', label: 'Rạch Giá ➔ Nam Du' },
            ]}
          />

          <FormInputField
            id="trip-date"
            label="Ngày Khởi Hành"
            type="date"
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
          />

          <FormSelectField
            id="trip-time"
            label="Giờ Chạy & Tàu Cao Tốc"
            value={tripTime}
            onChange={(e) => setTripTime(e.target.value)}
            options={[
              { value: '07:30 - Superdong IX', label: '07:30 AM - Superdong IX (Còn 45 ghế)' },
              { value: '08:00 - Superdong II', label: '08:00 AM - Superdong II (Còn 12 ghế)' },
              { value: '13:00 - Superdong VI', label: '13:00 PM - Superdong VI (Còn 80 ghế)' },
            ]}
          />
        </FormSectionBlock>

        {/* SECTION 3: DANH SÁCH HÀNH KHÁCH */}
        <FormSectionBlock title={`III. Danh sách hành khách (${travelers.length} người)`} columns={1}>
          <div className="flex justify-end pb-1">
            <button
              type="button"
              onClick={handleAddTraveler}
              className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus size={14} /> Thêm Hành Khách
            </button>
          </div>

          <div className="space-y-3">
            {travelers.map((t, index) => (
              <div
                key={index}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
              >
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Hành khách #{index + 1}
                  </label>
                  <input
                    type="text"
                    value={t.full_name}
                    onChange={(e) => handleTravelerChange(index, 'full_name', e.target.value)}
                    placeholder="Họ và tên hành khách"
                    className="w-full h-9 px-3 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                    required
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Số CMND / CCCD</label>
                  <input
                    type="text"
                    value={t.id_number}
                    onChange={(e) => handleTravelerChange(index, 'id_number', e.target.value)}
                    placeholder="Nhập số giấy tờ"
                    className="w-full h-9 px-3 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Loại vé</label>
                  <select
                    value={t.traveler_type}
                    onChange={(e) => handleTravelerChange(index, 'traveler_type', e.target.value)}
                    className="w-full h-9 px-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="adult">Người lớn (340k)</option>
                    <option value="child">Trẻ em (250k)</option>
                    <option value="senior">Người cao tuổi (290k)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Mã ghế</label>
                  <input
                    type="text"
                    value={t.seat_code}
                    onChange={(e) => handleTravelerChange(index, 'seat_code', e.target.value)}
                    className="w-full h-9 px-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-blue-600 font-mono font-bold outline-none"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-4">
                  <span className="font-bold text-slate-900 dark:text-white text-xs">
                    {formatCurrency(t.price)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTraveler(index)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </FormSectionBlock>

        {/* SECTION 4: THANH TOÁN & MÃ KHUYẾN MÃI */}
        <FormSectionBlock title="IV. Thanh toán & Mã khuyến mãi" columns={2}>
          <div className="space-y-4">
            <FormField id="coupon-box" label="Mã Giảm Giá / Voucher">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="coupon-box"
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Nhập mã (VD: SUMMER2026)"
                    className="w-full h-9 pl-9 pr-3 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 uppercase font-mono outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-4 h-9 rounded-lg bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white text-xs font-bold cursor-pointer"
                >
                  Áp Dụng
                </button>
              </div>
            </FormField>

            <FormSelectField
              id="payment-method"
              label="Hình Thức Thanh Toán"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              options={[
                { value: 'cash', label: 'Tiền mặt tại quầy bán vé' },
                { value: 'office_bank_transfer', label: 'Chuyển khoản Ngân hàng / QR Code' },
                { value: 'vnpay', label: 'Thanh toán VNPAY-QR' },
                { value: 'momo', label: 'Ví điện tử MoMo' },
              ]}
            />

            <FormSelectField
              id="payment-status"
              label="Trạng Thái Thanh Toán"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              options={[
                { value: 'paid', label: 'Đã thanh toán đủ' },
                { value: 'unpaid', label: 'Chưa thanh toán (Giữ ghế)' },
              ]}
            />
          </div>

          {/* Total calculation box */}
          <div className="bg-slate-50 dark:bg-slate-900/80 rounded-xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Tạm tính ({travelers.length} vé):</span>
                <span className="font-semibold">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-600 font-semibold">
                <span>Giảm giá khuyến mãi:</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="font-bold text-slate-900 dark:text-white text-sm">Tổng Tiền Thanh Toán:</span>
                <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
                  {formatCurrency(finalAmount)}
                </span>
              </div>
            </div>
          </div>
        </FormSectionBlock>

        {/* Master Action Bar */}
        <AdminFormActionBar
          mode="create"
          isSubmitting={isSubmitting}
          cancelTo="/bookings"
          submitLabel="Xác nhận & Xuất đơn vé"
          onClear={handleClear}
          clearLabel="Làm sạch dữ liệu"
        />
      </AdminFormCard>
    </div>
  );
}

