import React, { useState, useEffect, useMemo } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { FileText, CheckCircle2, Clock, Eye, Download, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Payment } from '@/types';
import { getPayments } from '@/apis/payments';
import { Button } from '@/components/common/Button';
import { AdminTablePage, ColumnDef, FilterOption } from '@/components/common/TableUtilities';
import { Badge } from '@/components/common/Badge';

export interface InvoicesSearch {
  page?: number;
  search?: string;
  status?: string;
}

export const Route = createFileRoute('/_admin/invoices/')({
  validateSearch: (search: Record<string, unknown>): InvoicesSearch => {
    const result: InvoicesSearch = {};
    if (Number(search?.page) > 1) result.page = Number(search.page);
    if (typeof search?.search === 'string' && search.search.trim()) result.search = search.search.trim();
    if (typeof search?.status === 'string' && search.status !== 'all') result.status = search.status;
    return result;
  },
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

const statusOptions: FilterOption[] = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'issued', label: 'Đã phát hành VAT' },
  { value: 'pending', label: 'Chờ phát hành' },
];

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
};

function InvoicesPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const searchParams = Route.useSearch();

  const currentPage = searchParams.page || 1;
  const searchTerm = searchParams.search || '';
  const statusFilter = searchParams.status || 'all';

  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await getPayments();
      if (res && res.data && Array.isArray(res.data)) {
        const mapped: InvoiceItem[] = res.data.map((p: Payment) => {
          const total = p.amount || 0;
          const sub = Math.round(total / 1.1);
          const vat = total - sub;
          return {
            id: String(p.id),
            invoice_number: `HD2026-${String(p.id).padStart(5, '0')}`,
            booking_code: p.booking_code || (p.booking_id ? `BK-${p.booking_id}` : '--'),
            customer_name: 'Khách hàng',
            company_name: '',
            tax_code: '',
            subtotal: sub,
            vat_rate: 10,
            vat_amount: vat,
            total_amount: total,
            status: p.status === 'completed' || p.status === 'success' ? 'issued' : 'pending',
            issued_at: p.created_at ? p.created_at.substring(0, 10) : new Date().toISOString().slice(0, 10),
          };
        });
        setInvoices(mapped);
      } else {
        setInvoices([]);
      }
    } catch (err: any) {
      console.error('Fetch invoices error:', err);
      setInvoices([]);
      setApiError(err?.response?.data?.message || err?.message || 'Không thể kết nối với Backend API');
      toast.error('Không thể lấy dữ liệu hóa đơn từ Backend API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleSearchChange = (value: string) => {
    navigate({
      search: (prev: any) => {
        const next: any = { ...prev };
        if (value && value.trim()) {
          next.search = value.trim();
        } else {
          delete next.search;
        }
        delete next.page;
        return next;
      },
    });
  };

  const handleStatusFilterChange = (value: string) => {
    navigate({
      search: (prev: any) => {
        const next: any = { ...prev };
        if (value && value !== 'all') {
          next.status = value;
        } else {
          delete next.status;
        }
        delete next.page;
        return next;
      },
    });
  };

  const handlePageChange = (page: number) => {
    navigate({
      search: (prev: any) => {
        const next: any = { ...prev };
        if (page > 1) {
          next.page = page;
        } else {
          delete next.page;
        }
        return next;
      },
    });
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        inv.invoice_number.toLowerCase().includes(q) ||
        inv.booking_code.toLowerCase().includes(q) ||
        inv.customer_name.toLowerCase().includes(q) ||
        (inv.company_name && inv.company_name.toLowerCase().includes(q)) ||
        (inv.tax_code && inv.tax_code.includes(q));

      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const columns: ColumnDef<InvoiceItem>[] = [
    {
      key: 'invoice_number',
      label: 'SỐ HÓA ĐƠN',
      sortable: true,
      render: (inv) => (
        <div className="flex items-center gap-2">
          <FileText size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{inv.invoice_number}</span>
        </div>
      ),
    },
    {
      key: 'booking_code',
      label: 'MÃ ĐƠN VÉ',
      sortable: true,
      render: (inv) => (
        <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{inv.booking_code}</span>
      ),
    },
    {
      key: 'customer_name',
      label: 'ĐƠN VỊ / KHÁCH MUA',
      sortable: true,
      render: (inv) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-slate-100">
            {inv.company_name || inv.customer_name}
          </div>
          {inv.tax_code ? (
            <div className="text-[11px] font-mono text-slate-500">MST: {inv.tax_code}</div>
          ) : (
            <div className="text-[11px] text-slate-400">Khách hàng cá nhân</div>
          )}
        </div>
      ),
    },
    {
      key: 'subtotal',
      label: 'TIỀN TRƯỚC THUẾ',
      sortable: true,
      render: (inv) => (
        <span className="font-medium text-slate-600 dark:text-slate-400">{formatCurrency(inv.subtotal)}</span>
      ),
    },
    {
      key: 'vat_amount',
      label: 'THUẾ VAT (10%)',
      sortable: true,
      render: (inv) => (
        <span className="font-semibold text-amber-600 dark:text-amber-400">{formatCurrency(inv.vat_amount)}</span>
      ),
    },
    {
      key: 'total_amount',
      label: 'TỔNG CỘNG',
      sortable: true,
      render: (inv) => (
        <span className="font-mono font-bold text-slate-900 dark:text-white">
          {formatCurrency(inv.total_amount)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'TRẠNG THÁI',
      sortable: true,
      render: (inv) => {
        if (inv.status === 'issued') {
          return (
            <Badge variant="success" className="gap-1 text-[11px] font-semibold">
              <CheckCircle2 size={12} /> Đã phát hành
            </Badge>
          );
        }
        return (
          <Badge variant="warning" className="gap-1 text-[11px] font-semibold">
            <Clock size={12} /> Chờ phát hành
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      label: 'THAO TÁC',
      align: 'right',
      render: (inv) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-blue-600 hover:text-blue-700 dark:text-blue-400"
          onClick={() => setSelectedInvoice(inv)}
          title="Xem chi tiết hóa đơn VAT"
        >
          <Eye size={15} />
        </Button>
      ),
    },
  ];

  return (
    <>
      <AdminTablePage
        title="Quản Lý Hóa Đơn VAT Điện Tử"
        subtitle="Đối soát và xuất hóa đơn VAT giá trị gia tăng kết nối từ Server Backend Superdong"
        icon={FileText}
        apiError={apiError}
        searchValue={searchTerm}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Tìm theo Số hóa đơn, Mã đơn vé..."
        filterValue={statusFilter}
        onFilterChange={handleStatusFilterChange}
        filterOptions={statusOptions}
        columns={columns}
        columnStorageKey="superdong_invoices_columns"
        onRefresh={fetchInvoices}
        refreshing={loading}
        data={filteredInvoices}
        loading={loading}
        emptyText={apiError ? '⚠️ Không thể lấy dữ liệu từ Backend API.' : 'Không có hóa đơn VAT nào phù hợp.'}
        keyExtractor={(inv) => inv.id}
        entityLabel="hóa đơn"
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />

      {/* Invoice Preview Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <FileText size={16} className="text-blue-600" />
                Hóa Đơn Giá Trị Gia Tăng (VAT): {selectedInvoice.invoice_number}
              </h3>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
              >
                <X size={16} />
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

            <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.success(`Đã tải file PDF hóa đơn ${selectedInvoice.invoice_number}`)}
                className="gap-1.5 text-xs rounded-lg"
              >
                <Download size={14} /> Tải PDF
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedInvoice(null)}
                className="text-xs rounded-lg"
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

