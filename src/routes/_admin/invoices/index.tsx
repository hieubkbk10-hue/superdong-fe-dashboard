import React, { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Printer,
  Download,
  Building,
  User,
  CreditCard,
  X,
  FileCheck,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/_admin/invoices/')({
  component: InvoicesPage,
});

export interface InvoiceItem {
  id: string;
  invoice_number: string;
  booking_code: string;
  customer_name: string;
  company_name?: string;
  tax_code?: string;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  status: 'issued' | 'pending' | 'cancelled';
  issued_at: string;
}

const INITIAL_INVOICES: InvoiceItem[] = [
  {
    id: 'INV-1001',
    invoice_number: 'HD2026-00892',
    booking_code: 'BK-99201',
    customer_name: 'Nguyễn Văn Hùng',
    company_name: 'Công ty TNHH Du Lịch Biển Xanh',
    tax_code: '0314998877',
    subtotal: 600000,
    vat_rate: 10,
    vat_amount: 60000,
    total_amount: 660000,
    status: 'issued',
    issued_at: '2026-08-10 09:30',
  },
  {
    id: 'INV-1002',
    invoice_number: 'HD2026-00893',
    booking_code: 'BK-99203',
    customer_name: 'Phạm Hoàng Nam',
    company_name: 'Tập đoàn Công nghệ NextGen',
    tax_code: '0109887766',
    subtotal: 1100000,
    vat_rate: 10,
    vat_amount: 110000,
    total_amount: 1210000,
    status: 'issued',
    issued_at: '2026-08-09 15:45',
  },
  {
    id: 'INV-1003',
    invoice_number: 'HD2026-00894',
    booking_code: 'BK-99202',
    customer_name: 'Trần Thị Thảo',
    subtotal: 309091,
    vat_rate: 10,
    vat_amount: 30909,
    total_amount: 340000,
    status: 'pending',
    issued_at: '2026-08-10 10:15',
  },
  {
    id: 'INV-1004',
    invoice_number: 'HD2026-00880',
    booking_code: 'BK-99180',
    customer_name: 'Võ Thị Ngọc',
    company_name: 'Công ty CP Vận tải Kiên Giang',
    tax_code: '1700443322',
    subtotal: 454545,
    vat_rate: 10,
    vat_amount: 45455,
    total_amount: 500000,
    status: 'cancelled',
    issued_at: '2026-08-08 16:20',
  },
];

function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>(INITIAL_INVOICES);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.booking_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.company_name && inv.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (inv.tax_code && inv.tax_code.includes(searchTerm));

    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleIssueInvoice = (id: string, number: string) => {
    setInvoices((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'issued' } : item))
    );
    toast.success(`Đã phát hành thành công hóa đơn VAT điện tử ${number}`);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            Quản Lý Hóa Đơn VAT Điện Tử (E-Invoices)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi, phát hành và xuất hóa đơn giá trị gia tăng (VAT) truyền dữ liệu cơ quan Thuế cho vé tàu Superdong
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600">
            <FileCheck size={22} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Đã Phát Hành Hóa Đơn</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {invoices.filter((i) => i.status === 'issued').length} hóa đơn
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-amber-600">
            <Clock size={22} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Chờ Khách Yêu Cầu Xuất</div>
            <div className="text-xl font-bold text-amber-600">
              {invoices.filter((i) => i.status === 'pending').length} hóa đơn
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600">
            <CreditCard size={22} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Tổng Thuế VAT Đã Kê Khai</div>
            <div className="text-xl font-bold text-emerald-600 font-mono">
              {formatCurrency(
                invoices
                  .filter((i) => i.status === 'issued')
                  .reduce((sum, i) => sum + i.vat_amount, 0)
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex flex-col md:flex-row gap-3 justify-between">
        <div className="relative max-w-md w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo Số hóa đơn, Mã đơn vé, Tên công ty, MST..."
            className="w-full h-10 pl-9 pr-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500 font-mono"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 outline-none cursor-pointer"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="issued">Đã phát hành VAT</option>
          <option value="pending">Chờ phát hành</option>
          <option value="cancelled">Đã hủy hóa đơn</option>
        </select>
      </div>

      {/* Invoices Data Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">Số Hóa Đơn</th>
                <th className="p-4">Mã Đơn Vé</th>
                <th className="p-4">Khách Hàng / Đơn Vị Mua</th>
                <th className="p-4">Doanh Thu Chưa Thuế</th>
                <th className="p-4">Thuế VAT (10%)</th>
                <th className="p-4">Tổng Tiền Đã Gồm VAT</th>
                <th className="p-4">Trạng Thái</th>
                <th className="p-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Không tìm thấy hóa đơn nào phù hợp với bộ lọc
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {inv.invoice_number}
                    </td>
                    <td className="p-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {inv.booking_code}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {inv.company_name || inv.customer_name}
                      </div>
                      {inv.tax_code && (
                        <div className="text-xs font-mono text-slate-500 mt-0.5">
                          MST: {inv.tax_code}
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-medium text-slate-600 dark:text-slate-400">
                      {formatCurrency(inv.subtotal)}
                    </td>
                    <td className="p-4 font-semibold text-amber-600 dark:text-amber-400">
                      {formatCurrency(inv.vat_amount)}
                    </td>
                    <td className="p-4 font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(inv.total_amount)}
                    </td>
                    <td className="p-4">
                      {inv.status === 'issued' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500 text-white">
                          <CheckCircle2 size={12} /> Đã phát hành
                        </span>
                      )}
                      {inv.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500 text-white">
                          <Clock size={12} /> Chờ phát hành
                        </span>
                      )}
                      {inv.status === 'cancelled' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500 text-white">
                          <XCircle size={12} /> Đã hủy hóa đơn
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-1">
                      {inv.status === 'pending' && (
                        <button
                          onClick={() => handleIssueInvoice(inv.id, inv.invoice_number)}
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer shadow-2xs"
                        >
                          Phát hành VAT
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="p-1.5 inline-flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 cursor-pointer"
                        title="Xem hóa đơn PDF điện tử"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Preview Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                Hóa Đơn Giá Trị Gia Tăng (VAT): {selectedInvoice.invoice_number}
              </h3>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 font-sans text-xs">
              <div className="text-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="font-extrabold text-sm uppercase text-slate-900 dark:text-white">
                  CÔNG TY CỔ PHẦN TÀU CAO TỐC SUPERDONG - KIÊN GIANG
                </h2>
                <p className="text-slate-500">Mã số thuế: 1700554433 - Hotline: 0297.3980.111</p>
                <p className="text-slate-500">Đ/c: Số 10 Đường 3/2, P. Vĩnh Bảo, TP. Rạch Giá, Kiên Giang</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-slate-700 dark:text-slate-300">
                <div>
                  <span className="text-slate-400 block text-[11px]">Đơn vị mua hàng:</span>
                  <strong className="text-slate-900 dark:text-white text-sm">
                    {selectedInvoice.company_name || selectedInvoice.customer_name}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Mã số thuế buyer:</span>
                  <span className="font-mono font-bold">{selectedInvoice.tax_code || 'Khách lẻ'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Mã đơn vé tàu:</span>
                  <span className="font-mono font-bold text-blue-600">{selectedInvoice.booking_code}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Ngày phát hành:</span>
                  <span>{selectedInvoice.issued_at}</span>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden mt-4">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-400 border-b">
                    <tr>
                      <th className="p-2.5">Tên dịch vụ</th>
                      <th className="p-2.5 text-right">Tiền trước thuế</th>
                      <th className="p-2.5 text-right">VAT (10%)</th>
                      <th className="p-2.5 text-right">Tổng tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2.5">Vé tàu cao tốc hành khách Superdong</td>
                      <td className="p-2.5 text-right">{formatCurrency(selectedInvoice.subtotal)}</td>
                      <td className="p-2.5 text-right">{formatCurrency(selectedInvoice.vat_amount)}</td>
                      <td className="p-2.5 text-right font-bold">{formatCurrency(selectedInvoice.total_amount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="pt-2 text-right space-y-1">
                <div className="text-slate-500">Tổng thanh toán (Đã gồm VAT 10%):</div>
                <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
                  {formatCurrency(selectedInvoice.total_amount)}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => toast.success(`Đã tải file PDF hóa đơn ${selectedInvoice.invoice_number}`)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-100 cursor-pointer"
              >
                <Download size={14} /> Tải PDF
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-5 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
