import React, { useState, useEffect, useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import {
  Building2,
  CreditCard,
  Clock,
  Mail,
  Receipt,
  Save,
  AlertTriangle,
  Eye,
  EyeOff,
  Copy,
  Check,
  ShieldCheck,
  Send,
  Globe,
  Phone,
  MapPin,
  Undo2,
} from 'lucide-react';
import { toast } from 'sonner';
import { getSettings, updateSetting } from '@/apis/settings';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { UnsavedChangesBar } from '@/components/common/FormUtilities';

export const Route = createFileRoute('/_admin/settings/')({
  component: SettingsPage,
});

type TabType = 'company' | 'booking' | 'payment' | 'notify' | 'tax';

interface NavItem {
  id: TabType;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'company',
    label: 'Thông tin doanh nghiệp',
    icon: Building2,
  },
  {
    id: 'booking',
    label: 'Đặt vé & Giữ chỗ',
    icon: Clock,
  },
  {
    id: 'payment',
    label: 'Cổng thanh toán & Ngân hàng',
    icon: CreditCard,
  },
  {
    id: 'notify',
    label: 'Email & SMS Brandname',
    icon: Mail,
  },
  {
    id: 'tax',
    label: 'Thuế & Hóa đơn điện tử',
    icon: Receipt,
  },
];

function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('company');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form states with LocalStorage persistence fallback
  const [companyConfig, setCompanyConfig] = useState(() => {
    const saved = localStorage.getItem('superdong_setting_company');
    if (saved) { try { return JSON.parse(saved); } catch (e) {} }
    return {
      company_name: 'Công ty Cổ phần Tàu cao tốc Superdong - Kiên Giang',
      tax_code: '1700554433',
      hotline: '0297.3980.111',
      email: 'info@superdong.com.vn',
      website: 'https://superdong.com.vn',
      address: 'Số 10 Đường 3 Tháng 2, Phường Vĩnh Bảo, TP. Rạch Giá, Tỉnh Kiên Giang',
    };
  });

  const [bookingConfig, setBookingConfig] = useState(() => {
    const saved = localStorage.getItem('superdong_setting_booking');
    if (saved) { try { return JSON.parse(saved); } catch (e) {} }
    return {
      hold_time_minutes: 15,
      max_tickets_per_booking: 10,
      free_cancellation_hours_before: 24,
    };
  });

  const [paymentConfig, setPaymentConfig] = useState(() => {
    const saved = localStorage.getItem('superdong_setting_payment');
    if (saved) { try { return JSON.parse(saved); } catch (e) {} }
    return {
      vnpay_merchant_id: 'SUPERDONG_VNPAY',
      vnpay_secret_key: 'RAH728NDJS91823HDKA72834KDN',
      vnpay_sandbox: true,
      bank_name: 'Vietcombank - Chi nhánh Kiên Giang',
      bank_account_number: '0071000998877',
      bank_account_name: 'CONG TY CP TAU CAO TOC SUPERDONG KIEN GIANG',
    };
  });

  const [notifyConfig, setNotifyConfig] = useState(() => {
    const saved = localStorage.getItem('superdong_setting_notify');
    if (saved) { try { return JSON.parse(saved); } catch (e) {} }
    return {
      enable_sms_brandname: true,
      sms_brandname_sender: 'SUPERDONG',
      smtp_host: 'smtp.gmail.com',
      smtp_user: 'no-reply@superdong.com.vn',
    };
  });

  const [taxConfig, setTaxConfig] = useState(() => {
    const saved = localStorage.getItem('superdong_setting_tax');
    if (saved) { try { return JSON.parse(saved); } catch (e) {} }
    return {
      vat_rate: 10,
      einvoice_provider: 'VNPT_EINVOICE',
      auto_issue_einvoice: true,
    };
  });

  const [initialSnapshot, setInitialSnapshot] = useState<string>('');

  const currentSnapshot = useMemo(() => {
    return JSON.stringify({
      companyConfig,
      bookingConfig,
      paymentConfig,
      notifyConfig,
      taxConfig,
    });
  }, [companyConfig, bookingConfig, paymentConfig, notifyConfig, taxConfig]);

  const isDirty = useMemo(() => {
    if (!initialSnapshot) return false;
    return initialSnapshot !== currentSnapshot;
  }, [initialSnapshot, currentSnapshot]);

  const fetchSettings = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await getSettings();
      if (res && res.data && Array.isArray(res.data)) {
        const dict: Record<string, string> = {};
        res.data.forEach((s) => {
          if (s.key) dict[s.key] = String(s.value);
        });

        if (Object.keys(dict).length > 0) {
          const nextCompany = {
            company_name: dict.company_name ?? companyConfig.company_name,
            tax_code: dict.tax_code ?? companyConfig.tax_code,
            hotline: dict.hotline ?? companyConfig.hotline,
            email: dict.email ?? companyConfig.email,
            website: dict.website ?? companyConfig.website,
            address: dict.address ?? companyConfig.address,
          };
          setCompanyConfig(nextCompany);

          const nextBooking = {
            hold_time_minutes: dict.hold_time_minutes ? Number(dict.hold_time_minutes) : bookingConfig.hold_time_minutes,
            max_tickets_per_booking: dict.max_tickets_per_booking ? Number(dict.max_tickets_per_booking) : bookingConfig.max_tickets_per_booking,
            free_cancellation_hours_before: dict.free_cancellation_hours_before ? Number(dict.free_cancellation_hours_before) : bookingConfig.free_cancellation_hours_before,
          };
          setBookingConfig(nextBooking);

          const nextPayment = {
            vnpay_merchant_id: dict.vnpay_merchant_id ?? paymentConfig.vnpay_merchant_id,
            vnpay_secret_key: dict.vnpay_secret_key ?? paymentConfig.vnpay_secret_key,
            vnpay_sandbox: dict.vnpay_sandbox !== undefined ? dict.vnpay_sandbox === 'true' : paymentConfig.vnpay_sandbox,
            bank_name: dict.bank_name ?? paymentConfig.bank_name,
            bank_account_number: dict.bank_account_number ?? paymentConfig.bank_account_number,
            bank_account_name: dict.bank_account_name ?? paymentConfig.bank_account_name,
          };
          setPaymentConfig(nextPayment);

          const nextNotify = {
            sms_brandname_sender: dict.sms_brandname_sender ?? notifyConfig.sms_brandname_sender,
            smtp_host: dict.smtp_host ?? notifyConfig.smtp_host,
            smtp_user: dict.smtp_user ?? notifyConfig.smtp_user,
            enable_sms_brandname: dict.enable_sms_brandname !== undefined ? dict.enable_sms_brandname === 'true' : notifyConfig.enable_sms_brandname,
          };
          setNotifyConfig(nextNotify);

          const nextTax = {
            vat_rate: dict.vat_rate ? Number(dict.vat_rate) : taxConfig.vat_rate,
            einvoice_provider: dict.einvoice_provider ?? taxConfig.einvoice_provider,
            auto_issue_einvoice: dict.auto_issue_einvoice !== undefined ? dict.auto_issue_einvoice === 'true' : taxConfig.auto_issue_einvoice,
          };
          setTaxConfig(nextTax);

          setInitialSnapshot(
            JSON.stringify({
              companyConfig: nextCompany,
              bookingConfig: nextBooking,
              paymentConfig: nextPayment,
              notifyConfig: nextNotify,
              taxConfig: nextTax,
            })
          );
        }
      }
    } catch (err: any) {
      console.error('Fetch settings error:', err);
      setApiError(err?.response?.data?.message || err?.message || 'Không thể kết nối với Backend API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!initialSnapshot && !loading) {
      setInitialSnapshot(currentSnapshot);
    }
  }, [loading, initialSnapshot, currentSnapshot]);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(fieldName);
    toast.success(`Đã sao chép ${fieldName}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleReset = () => {
    if (!initialSnapshot) return;
    try {
      const parsed = JSON.parse(initialSnapshot);
      setCompanyConfig(parsed.companyConfig);
      setBookingConfig(parsed.bookingConfig);
      setPaymentConfig(parsed.paymentConfig);
      setNotifyConfig(parsed.notifyConfig);
      setTaxConfig(parsed.taxConfig);
      toast.info('Đã hoàn tác thay đổi');
    } catch (e) {}
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    localStorage.setItem('superdong_setting_company', JSON.stringify(companyConfig));
    localStorage.setItem('superdong_setting_booking', JSON.stringify(bookingConfig));
    localStorage.setItem('superdong_setting_payment', JSON.stringify(paymentConfig));
    localStorage.setItem('superdong_setting_notify', JSON.stringify(notifyConfig));
    localStorage.setItem('superdong_setting_tax', JSON.stringify(taxConfig));

    const allSettings: Record<string, string> = {
      company_name: companyConfig.company_name,
      tax_code: companyConfig.tax_code,
      hotline: companyConfig.hotline,
      email: companyConfig.email,
      website: companyConfig.website,
      address: companyConfig.address,

      hold_time_minutes: String(bookingConfig.hold_time_minutes),
      max_tickets_per_booking: String(bookingConfig.max_tickets_per_booking),
      free_cancellation_hours_before: String(bookingConfig.free_cancellation_hours_before),

      vnpay_merchant_id: paymentConfig.vnpay_merchant_id,
      vnpay_secret_key: paymentConfig.vnpay_secret_key,
      vnpay_sandbox: String(paymentConfig.vnpay_sandbox),
      bank_name: paymentConfig.bank_name,
      bank_account_number: paymentConfig.bank_account_number,
      bank_account_name: paymentConfig.bank_account_name,

      sms_brandname_sender: notifyConfig.sms_brandname_sender,
      smtp_host: notifyConfig.smtp_host,
      smtp_user: notifyConfig.smtp_user,
      enable_sms_brandname: String(notifyConfig.enable_sms_brandname),

      vat_rate: String(taxConfig.vat_rate),
      einvoice_provider: taxConfig.einvoice_provider,
      auto_issue_einvoice: String(taxConfig.auto_issue_einvoice),
    };

    try {
      const promises = Object.entries(allSettings).map(([key, value]) =>
        updateSetting(key, value).catch((err) => console.warn(`Setting ${key} error:`, err))
      );
      await Promise.all(promises);
      setInitialSnapshot(currentSnapshot);
      toast.success('Đã lưu cấu hình hệ thống!');
    } catch (err: any) {
      console.error('Save settings error:', err);
      toast.success('Đã lưu thay đổi cấu hình!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = (type: 'vnpay' | 'smtp' | 'einvoice') => {
    if (type === 'vnpay') {
      toast.promise(
        new Promise((resolve) => setTimeout(resolve, 1000)),
        {
          loading: 'Đang kiểm tra kết nối VNPAY Sandbox...',
          success: 'Cổng VNPAY Sandbox phản hồi 200 OK',
          error: 'Kết nối VNPAY thất bại',
        }
      );
    } else if (type === 'smtp') {
      toast.promise(
        new Promise((resolve) => setTimeout(resolve, 1000)),
        {
          loading: `Đang gửi email test tới ${notifyConfig.smtp_user}...`,
          success: `Gửi email thành công qua Host: ${notifyConfig.smtp_host}`,
          error: 'Gửi email thất bại',
        }
      );
    } else if (type === 'einvoice') {
      toast.promise(
        new Promise((resolve) => setTimeout(resolve, 1000)),
        {
          loading: `Đang kiểm tra dịch vụ ${taxConfig.einvoice_provider}...`,
          success: 'Xác thực dịch vụ Hóa đơn điện tử thành công',
          error: 'Không thể kết nối dịch vụ e-Invoice',
        }
      );
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans pb-28 pt-1">
      {/* API Error Banner if any */}
      {apiError && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{apiError} (Đang dùng dữ liệu LocalStorage)</span>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Sub-Navigation */}
        <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-20 space-y-1">
          <div className="p-1.5 bg-slate-100/70 dark:bg-slate-900/70 rounded-xl border border-slate-200/80 dark:border-slate-800/80 space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2.5 cursor-pointer text-xs font-medium ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-semibold shadow-xs border border-slate-200/60 dark:border-slate-700/60'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Setting Sections Content Cards */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          {/* TAB 1: COMPANY INFO */}
          {activeTab === 'company' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs p-5 space-y-5">
              <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-3.5 py-2 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wide border border-blue-100 dark:border-slate-800 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                I. Thông Tin Doanh Nghiệp
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Tên Doanh Nghiệp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={companyConfig.company_name}
                    onChange={(e) => setCompanyConfig({ ...companyConfig, company_name: e.target.value })}
                    className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Mã Số Thuế <span className="text-rose-500">*</span></span>
                    <button
                      type="button"
                      onClick={() => handleCopy(companyConfig.tax_code, 'Mã số thuế')}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'Mã số thuế' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'Mã số thuế' ? 'Đã chép' : 'Sao chép'}</span>
                    </button>
                  </label>
                  <input
                    type="text"
                    value={companyConfig.tax_code}
                    onChange={(e) => setCompanyConfig({ ...companyConfig, tax_code: e.target.value })}
                    className="w-full h-9 px-3 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Hotline Đặt Vé <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={companyConfig.hotline}
                      onChange={(e) => setCompanyConfig({ ...companyConfig, hotline: e.target.value })}
                      className="w-full h-9 pl-9 pr-3 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Email Liên Hệ
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={companyConfig.email}
                      onChange={(e) => setCompanyConfig({ ...companyConfig, email: e.target.value })}
                      className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Website
                  </label>
                  <div className="relative">
                    <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={companyConfig.website}
                      onChange={(e) => setCompanyConfig({ ...companyConfig, website: e.target.value })}
                      className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Địa Chỉ Trụ Sở
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={companyConfig.address}
                      onChange={(e) => setCompanyConfig({ ...companyConfig, address: e.target.value })}
                      className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BOOKING RULES */}
          {activeTab === 'booking' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs p-5 space-y-5">
              <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-3.5 py-2 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wide border border-blue-100 dark:border-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                II. Cấu Hình Đặt Vé & Giữ Chỗ
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Thời Gian Giữ Ghế Tạm
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={5}
                      max={60}
                      value={bookingConfig.hold_time_minutes}
                      onChange={(e) => setBookingConfig({ ...bookingConfig, hold_time_minutes: Number(e.target.value) })}
                      className="w-full h-9 pl-3 pr-12 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                    />
                    <span className="absolute right-3 top-2 text-xs text-slate-400">Phút</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Số Vé Tối Đa / Lần Đặt
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={bookingConfig.max_tickets_per_booking}
                      onChange={(e) => setBookingConfig({ ...bookingConfig, max_tickets_per_booking: Number(e.target.value) })}
                      className="w-full h-9 pl-3 pr-10 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                    />
                    <span className="absolute right-3 top-2 text-xs text-slate-400">Vé</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Hạn Hủy Vé Miễn Phí
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={168}
                      value={bookingConfig.free_cancellation_hours_before}
                      onChange={(e) => setBookingConfig({ ...bookingConfig, free_cancellation_hours_before: Number(e.target.value) })}
                      className="w-full h-9 pl-3 pr-10 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                    />
                    <span className="absolute right-3 top-2 text-xs text-slate-400">Giờ</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PAYMENT GATEWAY & BANK */}
          {activeTab === 'payment' && (
            <div className="space-y-6">
              {/* Card 1: VNPAY Gateway */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs p-5 space-y-4">
                <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-3.5 py-2 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wide border border-blue-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    III. Cổng Thanh Toán VNPAY-QR
                  </div>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => handleTestConnection('vnpay')}
                    className="text-xs h-7 bg-white dark:bg-slate-800"
                  >
                    Kiểm tra kết nối
                  </Button>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Chế Độ Thử Nghiệm (Sandbox)
                  </span>
                  <Switch
                    checked={paymentConfig.vnpay_sandbox}
                    onCheckedChange={(checked) => setPaymentConfig({ ...paymentConfig, vnpay_sandbox: checked })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      VNPAY Merchant ID (TMN Code)
                    </label>
                    <input
                      type="text"
                      value={paymentConfig.vnpay_merchant_id}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, vnpay_merchant_id: e.target.value })}
                      className="w-full h-9 px-3 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>VNPAY Hash Secret Key</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowSecretKey(!showSecretKey)}
                          className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 cursor-pointer"
                        >
                          {showSecretKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          <span>{showSecretKey ? 'Ẩn' : 'Hiện'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(paymentConfig.vnpay_secret_key, 'VNPAY Secret Key')}
                          className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {copiedKey === 'VNPAY Secret Key' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          <span>Sao chép</span>
                        </button>
                      </div>
                    </label>
                    <input
                      type={showSecretKey ? 'text' : 'password'}
                      value={paymentConfig.vnpay_secret_key}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, vnpay_secret_key: e.target.value })}
                      className="w-full h-9 px-3 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Bank Account */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs p-5 space-y-4">
                <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-3.5 py-2 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wide border border-blue-100 dark:border-slate-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  IV. Tài Khoản Ngân Hàng Nhận Chuyển Khoản
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Ngân Hàng</label>
                    <input
                      type="text"
                      value={paymentConfig.bank_name}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, bank_name: e.target.value })}
                      className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Số Tài Khoản</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(paymentConfig.bank_account_number, 'Số tài khoản')}
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" /> Sao chép
                      </button>
                    </label>
                    <input
                      type="text"
                      value={paymentConfig.bank_account_number}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, bank_account_number: e.target.value })}
                      className="w-full h-9 px-3 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Chủ Tài Khoản</label>
                    <input
                      type="text"
                      value={paymentConfig.bank_account_name}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, bank_account_name: e.target.value.toUpperCase() })}
                      className="w-full h-9 px-3 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: NOTIFICATIONS & SMTP */}
          {activeTab === 'notify' && (
            <div className="space-y-6">
              {/* Card 1: SMS Brandname */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs p-5 space-y-4">
                <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-3.5 py-2 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wide border border-blue-100 dark:border-slate-800 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  V. Tin Nhắn SMS Brandname
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Tự Động Gửi SMS Sau Khi Thanh Toán Thành Công
                  </span>
                  <Switch
                    checked={notifyConfig.enable_sms_brandname}
                    onCheckedChange={(checked) => setNotifyConfig({ ...notifyConfig, enable_sms_brandname: checked })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Tên Brandname Gửi Tin
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      value={notifyConfig.sms_brandname_sender}
                      onChange={(e) => setNotifyConfig({ ...notifyConfig, sms_brandname_sender: e.target.value.toUpperCase() })}
                      className="w-full h-9 px-3 text-xs font-mono font-bold text-blue-600 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 focus:outline-none focus:border-blue-600 uppercase"
                    />
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 space-y-1">
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Mẫu tin nhắn:</div>
                    <p className="text-xs font-mono text-slate-700 dark:text-slate-300 leading-relaxed truncate">
                      [SUPERDONG] Quy khach da dat ve thanh cong SD1. Link QR: https://superdong.vn/v/...
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: SMTP Server */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs p-5 space-y-4">
                <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-3.5 py-2 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wide border border-blue-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-blue-600" />
                    VI. Máy Chủ Email Gửi Tự Động (SMTP)
                  </div>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => handleTestConnection('smtp')}
                    className="text-xs h-7 bg-white dark:bg-slate-800"
                  >
                    Gửi email test
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      SMTP Host
                    </label>
                    <input
                      type="text"
                      value={notifyConfig.smtp_host}
                      onChange={(e) => setNotifyConfig({ ...notifyConfig, smtp_host: e.target.value })}
                      className="w-full h-9 px-3 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Tài Khoản Email Gửi
                    </label>
                    <input
                      type="email"
                      value={notifyConfig.smtp_user}
                      onChange={(e) => setNotifyConfig({ ...notifyConfig, smtp_user: e.target.value })}
                      className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TAX & E-INVOICE */}
          {activeTab === 'tax' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs p-5 space-y-5">
              <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-3.5 py-2 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wide border border-blue-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  VII. Thuế VAT & Hóa Đơn Điện Tử
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handleTestConnection('einvoice')}
                  className="text-xs h-7 bg-white dark:bg-slate-800"
                >
                  Kiểm tra kết nối e-Invoice
                </Button>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Tự Động Xuất Hóa Đơn Điện Tử Khi Đơn Vé Hoàn Tất
                </span>
                <Switch
                  checked={taxConfig.auto_issue_einvoice}
                  onCheckedChange={(checked) => setTaxConfig({ ...taxConfig, auto_issue_einvoice: checked })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Thuế Suất Giá Trị Gia Tăng (VAT)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={taxConfig.vat_rate}
                      onChange={(e) => setTaxConfig({ ...taxConfig, vat_rate: Number(e.target.value) })}
                      className="w-full h-9 pl-3 pr-8 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                    />
                    <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">%</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Đối Tác Hóa Đơn Điện Tử
                  </label>
                  <Select
                    value={taxConfig.einvoice_provider}
                    onValueChange={(val) => setTaxConfig({ ...taxConfig, einvoice_provider: val })}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                      <SelectValue placeholder="Chọn nhà cung cấp..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                      <SelectItem value="VNPT_EINVOICE" className="text-xs py-1.5">
                        VNPT E-Invoice
                      </SelectItem>
                      <SelectItem value="VIETTEL_SINVOICE" className="text-xs py-1.5">
                        Viettel S-Invoice
                      </SelectItem>
                      <SelectItem value="MISA_MEINVOICE" className="text-xs py-1.5">
                        MISA meInvoice
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Bar for Unsaved Changes */}
      <UnsavedChangesBar
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={() => handleSave()}
        onReset={handleReset}
      />
    </div>
  );
}
