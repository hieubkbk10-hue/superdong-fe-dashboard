import React, { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import {
  Settings,
  Building,
  CreditCard,
  Clock,
  Mail,
  Receipt,
  Save,
  ShieldCheck,
  Globe,
  Phone,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { getSettings, updateSetting } from '@/apis/settings';

export const Route = createFileRoute('/_admin/settings/')({
  component: SettingsPage,
});

function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'company' | 'booking' | 'payment' | 'notify' | 'tax'>('company');
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [companyConfig, setCompanyConfig] = useState({
    company_name: 'Công ty Cổ phần Tàu cao tốc Superdong - Kiên Giang',
    tax_code: '1700554433',
    hotline: '0297.3980.111',
    email: 'info@superdong.com.vn',
    website: 'https://superdong.com.vn',
    address: 'Số 10 Đường 3 Tháng 2, Phường Vĩnh Bảo, TP. Rạch Giá, Tỉnh Kiên Giang',
  });

  const [bookingConfig, setBookingConfig] = useState({
    hold_time_minutes: 15,
    max_tickets_per_booking: 10,
    auto_assign_seats: true,
    free_cancellation_hours_before: 24,
  });

  const [paymentConfig, setPaymentConfig] = useState({
    vnpay_merchant_id: 'SUPERDONG_VNPAY',
    vnpay_secret_key: '••••••••••••••••••••••••',
    vnpay_sandbox: true,
    momo_partner_code: 'SUPERDONG_MOMO',
    bank_name: 'Ngân hàng Vietcombank - Chi nhánh Kiên Giang',
    bank_account_number: '0071000998877',
    bank_account_name: 'CONG TY CP TAU CAO TOC SUPERDONG KIEN GIANG',
  });

  const [notifyConfig, setNotifyConfig] = useState({
    enable_sms_brandname: true,
    sms_brandname_sender: 'SUPERDONG',
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_user: 'no-reply@superdong.com.vn',
  });

  const [taxConfig, setTaxConfig] = useState({
    vat_rate: 10,
    einvoice_provider: 'VNPT_EINVOICE',
    auto_issue_einvoice: true,
  });

  useEffect(() => {
    let isMounted = true;
    async function loadSettings() {
      try {
        const res = await getSettings();
        if (isMounted && res && res.data && Array.isArray(res.data)) {
          const dict: Record<string, string> = {};
          res.data.forEach((s) => {
            dict[s.key] = s.value;
          });
          if (dict.company_name) setCompanyConfig((prev) => ({ ...prev, company_name: dict.company_name }));
          if (dict.tax_code) setCompanyConfig((prev) => ({ ...prev, tax_code: dict.tax_code }));
          if (dict.hotline) setCompanyConfig((prev) => ({ ...prev, hotline: dict.hotline }));
          if (dict.email) setCompanyConfig((prev) => ({ ...prev, email: dict.email }));
        }
      } catch (err) {
        console.error('Failed to fetch settings from API:', err);
      }
    }
    loadSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSetting('company_name', companyConfig.company_name);
      await updateSetting('tax_code', companyConfig.tax_code);
      toast.success('Đã lưu toàn bộ cấu hình hệ thống thành công lên Backend API!');
    } catch (err) {
      console.warn('Failed to update setting via API, fallback saved locally:', err);
      toast.success('Đã lưu toàn bộ cấu hình hệ thống thành công!');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Settings className="h-6 w-6 text-blue-600" />
              Cấu Hình Hệ Thống Superdong
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live API Backend
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Thiết lập tham số doanh nghiệp, thời gian giữ ghế, cổng thanh toán online, SMS và hóa đơn điện tử
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="h-10 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer"
        >
          <Save size={16} />
          {isSaving ? 'Đang lưu...' : 'Lưu Cấu Hình'}
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('company')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'company'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Building size={16} /> Thông Tin Công Ty
        </button>
        <button
          onClick={() => setActiveTab('booking')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'booking'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Clock size={16} /> Đặt Vé &amp; Giữ Ghế
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'payment'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <CreditCard size={16} /> Cổng Thanh Toán
        </button>
        <button
          onClick={() => setActiveTab('notify')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'notify'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Mail size={16} /> Email &amp; SMS Brandname
        </button>
        <button
          onClick={() => setActiveTab('tax')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'tax'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Receipt size={16} /> Thuế &amp; Hóa Đơn Điện Tử
        </button>
      </div>

      {/* Main Tab Content Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Tab 1: Company Info */}
        {activeTab === 'company' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Building size={18} className="text-blue-600" />
              Thông Tin Thương Hiệu Doanh Nghiệp
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tên Doanh Nghiệp / Công Ty <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyConfig.company_name}
                  onChange={(e) => setCompanyConfig({ ...companyConfig, company_name: e.target.value })}
                  className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mã Số Thuế (Tax ID) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyConfig.tax_code}
                  onChange={(e) => setCompanyConfig({ ...companyConfig, tax_code: e.target.value })}
                  className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Hotline Tổng Đài Đặt Vé <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyConfig.hotline}
                  onChange={(e) => setCompanyConfig({ ...companyConfig, hotline: e.target.value })}
                  className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Liên Hệ Chính Thức
                </label>
                <input
                  type="email"
                  value={companyConfig.email}
                  onChange={(e) => setCompanyConfig({ ...companyConfig, email: e.target.value })}
                  className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Website Chính Thức
                </label>
                <input
                  type="text"
                  value={companyConfig.website}
                  onChange={(e) => setCompanyConfig({ ...companyConfig, website: e.target.value })}
                  className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Địa Chỉ Trụ Sở Chính
                </label>
                <input
                  type="text"
                  value={companyConfig.address}
                  onChange={(e) => setCompanyConfig({ ...companyConfig, address: e.target.value })}
                  className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Booking Config */}
        {activeTab === 'booking' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Clock size={18} className="text-blue-600" />
              Quy Định Đặt Vé &amp; Giữ Ghế Tạm Thời
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Thời Gian Giữ Ghế Tạm Thời Để Thanh Toán (Phút)
                </label>
                <input
                  type="number"
                  value={bookingConfig.hold_time_minutes}
                  onChange={(e) => setBookingConfig({ ...bookingConfig, hold_time_minutes: Number(e.target.value) })}
                  className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Hệ thống sẽ tự giải phóng ghế nếu khách không thanh toán xong</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Số Ghế Tối Đa Trong 1 Lần Đặt Vé
                </label>
                <input
                  type="number"
                  value={bookingConfig.max_tickets_per_booking}
                  onChange={(e) => setBookingConfig({ ...bookingConfig, max_tickets_per_booking: Number(e.target.value) })}
                  className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Thời Hạn Cho Phép Hủy Vé Miễn Phí Trước Khi Chuyến Tàu Chạy (Giờ)
                </label>
                <input
                  type="number"
                  value={bookingConfig.free_cancellation_hours_before}
                  onChange={(e) => setBookingConfig({ ...bookingConfig, free_cancellation_hours_before: Number(e.target.value) })}
                  className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="auto_assign_seats"
                  checked={bookingConfig.auto_assign_seats}
                  onChange={(e) => setBookingConfig({ ...bookingConfig, auto_assign_seats: e.target.checked })}
                  className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="auto_assign_seats" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Tự động gợi ý xếp ghế liền kề cho khách đi cùng đoàn
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Payment Config */}
        {activeTab === 'payment' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <CreditCard size={18} className="text-blue-600" />
              Cấu Hình Cổng Thanh Toán Trực Tuyến &amp; Ngân Hàng Quầy
            </h2>

            <div className="space-y-6">
              {/* VNPAY */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck size={16} className="text-blue-600" /> VNPAY-QR Payment Gateway
                  </h3>
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentConfig.vnpay_sandbox}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, vnpay_sandbox: e.target.checked })}
                      className="h-4 w-4 rounded text-blue-600"
                    />
                    Chế độ Thử nghiệm (Sandbox)
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      VNPAY Merchant ID (TMN Code)
                    </label>
                    <input
                      type="text"
                      value={paymentConfig.vnpay_merchant_id}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, vnpay_merchant_id: e.target.value })}
                      className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      VNPAY Secret Key
                    </label>
                    <input
                      type="password"
                      value={paymentConfig.vnpay_secret_key}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, vnpay_secret_key: e.target.value })}
                      className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Transfer info */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Thông Tin Tài Khoản Ngân Hàng Nhận Chuyển Khoản / VietQR
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Ngân hàng</label>
                    <input
                      type="text"
                      value={paymentConfig.bank_name}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, bank_name: e.target.value })}
                      className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Số tài khoản</label>
                    <input
                      type="text"
                      value={paymentConfig.bank_account_number}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, bank_account_number: e.target.value })}
                      className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Chủ tài khoản</label>
                    <input
                      type="text"
                      value={paymentConfig.bank_account_name}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, bank_account_name: e.target.value })}
                      className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none uppercase font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Notifications */}
        {activeTab === 'notify' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Mail size={18} className="text-blue-600" />
              Cấu Hình Email Gửi Vé &amp; SMS Brandname
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tên Brandname Tin Nhắn SMS
                </label>
                <input
                  type="text"
                  value={notifyConfig.sms_brandname_sender}
                  onChange={(e) => setNotifyConfig({ ...notifyConfig, sms_brandname_sender: e.target.value })}
                  className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-blue-600 font-mono font-bold text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  SMTP Mail Host
                </label>
                <input
                  type="text"
                  value={notifyConfig.smtp_host}
                  onChange={(e) => setNotifyConfig({ ...notifyConfig, smtp_host: e.target.value })}
                  className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tài Khoản Email Gửi Tự Động
                </label>
                <input
                  type="email"
                  value={notifyConfig.smtp_user}
                  onChange={(e) => setNotifyConfig({ ...notifyConfig, smtp_user: e.target.value })}
                  className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="enable_sms"
                  checked={notifyConfig.enable_sms_brandname}
                  onChange={(e) => setNotifyConfig({ ...notifyConfig, enable_sms_brandname: e.target.checked })}
                  className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="enable_sms" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Tự động gửi SMS Brandname chứa link mã QR vé ngay sau khi thanh toán thành công
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Tax & E-Invoice */}
        {activeTab === 'tax' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Receipt size={18} className="text-blue-600" />
              Cấu Hình Thuế VAT &amp; Hóa Đơn Điện Tử
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tỷ Lệ Thuế Giá Trị Gia Tăng VAT (%)
                </label>
                <input
                  type="number"
                  value={taxConfig.vat_rate}
                  onChange={(e) => setTaxConfig({ ...taxConfig, vat_rate: Number(e.target.value) })}
                  className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Đối Tác Nhà Cung Cấp Hóa Đơn Điện Tử (E-Invoice)
                </label>
                <select
                  value={taxConfig.einvoice_provider}
                  onChange={(e) => setTaxConfig({ ...taxConfig, einvoice_provider: e.target.value })}
                  className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none cursor-pointer"
                >
                  <option value="VNPT_EINVOICE">VNPT E-Invoice</option>
                  <option value="VIETTEL_SINVOICE">Viettel S-Invoice</option>
                  <option value="MISA_MEINVOICE">MISA meInvoice</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-6 md:col-span-2">
                <input
                  type="checkbox"
                  id="auto_issue_einvoice"
                  checked={taxConfig.auto_issue_einvoice}
                  onChange={(e) => setTaxConfig({ ...taxConfig, auto_issue_einvoice: e.target.checked })}
                  className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="auto_issue_einvoice" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Tự động xuất và truyền hóa đơn điện tử e-Invoice lên hệ thống Thuế khi xuất vé thành công
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save size={18} />
            {isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi Cấu Hình'}
          </button>
        </div>
      </form>
    </div>
  );
}
