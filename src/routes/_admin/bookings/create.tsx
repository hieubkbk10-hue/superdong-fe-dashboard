import React, { useState } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { ShoppingCart, ArrowLeft, Save, Plus, Trash2, User, Ship, CreditCard, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { createBooking } from '@/apis/bookings';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
    <div className="space-y-6 max-w-5xl font-sans pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to={'/bookings' as any}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          title="Quay lại danh sách"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-blue-600" />
            Tạo Đơn Đặt Vé Mới
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Đặt vé cho hành khách tại quầy hoặc qua điện thoại</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Booker Info */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <User className="text-blue-600" size={18} />
            1. Thông Tin Người Đại Diện Đặt Vé
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Họ và Tên Người Đặt <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={booker.name}
                onChange={(e) => setBooker({ ...booker, name: e.target.value })}
                placeholder="VD: Nguyễn Văn Hùng"
                className="w-full h-10 px-3 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Số Điện Thoại Liên Hệ <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={booker.phone}
                onChange={(e) => setBooker({ ...booker, phone: e.target.value })}
                placeholder="VD: 0903123456"
                className="w-full h-10 px-3 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Địa Chỉ Email (Nhận vé điện tử)
              </label>
              <input
                type="email"
                value={booker.email}
                onChange={(e) => setBooker({ ...booker, email: e.target.value })}
                placeholder="VD: customer@gmail.com"
                className="w-full h-10 px-3 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Số CMND / CCCD / Hộ Chiếu
              </label>
              <input
                type="text"
                value={booker.id_card}
                onChange={(e) => setBooker({ ...booker, id_card: e.target.value })}
                placeholder="VD: 079088123456"
                className="w-full h-10 px-3 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Trip Selection */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Ship className="text-blue-600" size={18} />
            2. Chọn Hải Trình &amp; Chuyến Tàu
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tuyến Hải Trình
              </label>
              <select
                value={routeSelect}
                onChange={(e) => setRouteSelect(e.target.value)}
                className="w-full h-10 px-3 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none cursor-pointer"
              >
                <option value="RG-PQ">Rạch Giá ➔ Phú Quốc</option>
                <option value="HT-PQ">Hà Tiên ➔ Phú Quốc</option>
                <option value="TD-CD">Trần Đề ➔ Côn Đảo</option>
                <option value="RG-ND">Rạch Giá ➔ Nam Du</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Ngày Khởi Hành
              </label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-full h-10 px-3 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Giờ Chạy &amp; Tàu Cao Tốc
              </label>
              <select
                value={tripTime}
                onChange={(e) => setTripTime(e.target.value)}
                className="w-full h-10 px-3 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none cursor-pointer font-medium"
              >
                <option value="07:30 - Superdong IX">07:30 AM - Superdong IX (Còn 45 ghế)</option>
                <option value="08:00 - Superdong II">08:00 AM - Superdong II (Còn 12 ghế)</option>
                <option value="13:00 - Superdong VI">13:00 PM - Superdong VI (Còn 80 ghế)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Traveler Roster */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="text-blue-600" size={18} />
              3. Danh Sách Hành Khách ({travelers.length} người)
            </h2>
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
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
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
                    className="w-full h-9 px-3 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
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
                    className="w-full h-9 px-3 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono outline-none"
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
        </div>

        {/* Section 4: Payment & Coupon */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <CreditCard className="text-blue-600" size={18} />
            4. Thanh Toán &amp; Mã Khuyến Mãi
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mã Giảm Giá / Voucher
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Nhập mã (VD: SUMMER2026)"
                      className="w-full h-10 pl-9 pr-3 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-mono outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-4 h-10 rounded-lg bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white text-xs font-bold cursor-pointer"
                  >
                    Áp Dụng
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Hình Thức Thanh Toán
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none cursor-pointer"
                >
                  <option value="cash">Tiền mặt tại quầy bán vé</option>
                  <option value="office_bank_transfer">Chuyển khoản Ngân hàng / QR Code</option>
                  <option value="vnpay">Thanh toán VNPAY-QR</option>
                  <option value="momo">Ví điện tử MoMo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Trạng Thái Thanh Toán
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none cursor-pointer font-bold"
                >
                  <option value="paid">Đã thanh toán đủ</option>
                  <option value="unpaid">Chưa thanh toán (Giữ ghế)</option>
                </select>
              </div>
            </div>

            {/* Total calculation box */}
            <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-5 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                  <span>Tạm tính ({travelers.length} vé):</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm text-emerald-600 font-semibold">
                  <span>Giảm giá khuyến mãi:</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-white text-base">Tổng Tiền Thanh Toán:</span>
                  <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                    {formatCurrency(finalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            to={'/bookings' as any}
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
            {isSubmitting ? 'Đang tạo đơn vé...' : 'Xác Nhận & Xuất Đơn Vé'}
          </button>
        </div>
      </form>
    </div>
  );
}
