import React, { useState, useEffect, useMemo } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Ship,
  Ticket,
  User,
  Eye,
  Check,
  X,
  Ban,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { BookingChange } from '@/types';
import { getBookingChangeQueue, reviewBookingChange } from '@/apis/booking-changes';
import { AdminTablePage, ColumnDef, FilterOption } from '@/components/common/TableUtilities';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';

export interface BookingChangesSearch {
  page?: number;
  search?: string;
  status?: string;
}

export const Route = createFileRoute('/_admin/booking-changes/')({
  validateSearch: (search: Record<string, unknown>): BookingChangesSearch => {
    const result: BookingChangesSearch = {};
    if (Number(search?.page) > 1) result.page = Number(search.page);
    if (typeof search?.search === 'string' && search.search.trim()) result.search = search.search.trim();
    if (typeof search?.status === 'string' && search.status !== 'all') result.status = search.status;
    return result;
  },
  component: BookingChangesPage,
});

const statusOptions: FilterOption[] = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ phê duyệt (Pending)' },
  { value: 'done', label: 'Đã chấp thuận (Done)' },
  { value: 'rejected', label: 'Đã từ chối (Rejected)' },
];

const formatVND = (amount?: number) => {
  if (amount == null) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

function formatDateTime(isoStr?: string) {
  if (!isoStr) return '--:-- --/--/----';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${time} ${date}`;
  } catch {
    return isoStr;
  }
}

function timeAgo(isoStr?: string) {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 60) return 'Vừa xong';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
    return `${Math.floor(diffSec / 86400)} ngày trước`;
  } catch {
    return '';
  }
}

function getChangeTypeMeta(type?: string) {
  const t = (type || '').toLowerCase();
  switch (t) {
    case 'cancel':
    case 'cancellation':
      return {
        label: 'Hủy vé & Hoàn tiền',
        icon: Ban,
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
      };
    case 'change_trip':
    case 'reschedule':
      return {
        label: 'Đổi Chuyến Tàu',
        icon: Ship,
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800',
      };
    case 'change_seat':
      return {
        label: 'Đổi Chỗ Ngồi',
        icon: Ticket,
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800',
      };
    default:
      return {
        label: type || 'Thay đổi vé',
        icon: FileText,
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      };
  }
}

function getStatusMeta(status?: string) {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'pending':
    case 'manual_review':
      return {
        label: 'Chờ phê duyệt',
        badge: <Badge variant="warning">Chờ phê duyệt</Badge>,
        isPending: true,
      };
    case 'done':
    case 'approved':
      return {
        label: 'Đã chấp thuận',
        badge: <Badge variant="success">Đã chấp thuận</Badge>,
        isPending: false,
      };
    case 'rejected':
      return {
        label: 'Đã từ chối',
        badge: <Badge variant="danger">Đã từ chối</Badge>,
        isPending: false,
      };
    default:
      return {
        label: status || 'Không rõ',
        badge: <Badge variant="secondary">{status}</Badge>,
        isPending: false,
      };
  }
}

function BookingChangesPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const searchParams = Route.useSearch();

  const currentPage = searchParams.page || 1;
  const searchTerm = searchParams.search || '';
  const statusFilter = searchParams.status || 'all';

  const [changes, setChanges] = useState<BookingChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedChange, setSelectedChange] = useState<BookingChange | null>(null);

  const [reviewTarget, setReviewTarget] = useState<{ item: BookingChange; decision: 'approve' | 'reject' } | null>(null);
  const [reviewReason, setReviewReason] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchQueue = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await getBookingChangeQueue({ limit: 100, status: 'all' });
      if (res && res.data && Array.isArray(res.data)) {
        setChanges(res.data);
      } else {
        setChanges([]);
      }
    } catch (err: any) {
      console.error('Fetch booking changes queue error:', err);
      setChanges([]);
      const msg = err?.response?.data?.message || err?.message || 'Không thể kết nối với Backend API';
      setApiError(msg);
      toast.error(`Không thể lấy danh sách yêu cầu: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleConfirmReview = async () => {
    if (!reviewTarget) return;
    if (!reviewReason.trim()) {
      toast.error('Vui lòng nhập lý do / ghi chú xử lý');
      return;
    }

    setIsSubmittingReview(true);
    try {
      await reviewBookingChange(reviewTarget.item.id, reviewTarget.decision, reviewReason.trim());
      toast.success(
        reviewTarget.decision === 'approve'
          ? 'Đã chấp thuận yêu cầu thay đổi thành công!'
          : 'Đã từ chối yêu cầu thay đổi.'
      );
      setReviewTarget(null);
      setReviewReason('');
      await fetchQueue();
    } catch (err: any) {
      console.error('Review booking change error:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi xử lý duyệt yêu cầu');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép: ${text}`);
  };

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

  const filteredChanges = useMemo(() => {
    return changes.filter((item) => {
      const term = searchTerm.toLowerCase().trim();
      const code = (item.booking_code || item.booking?.booking_code || '').toLowerCase();
      const booker = (item.booking?.booker_name || '').toLowerCase();
      const phone = (item.booking?.booker_phone || '').toLowerCase();
      const reason = (item.reason || '').toLowerCase();
      const idStr = String(item.id).toLowerCase();

      const matchesSearch =
        !term ||
        idStr.includes(term) ||
        code.includes(term) ||
        booker.includes(term) ||
        phone.includes(term) ||
        reason.includes(term);

      const s = (item.status || '').toLowerCase();
      let matchesStatus = true;
      if (statusFilter === 'pending') matchesStatus = s === 'pending' || s === 'manual_review';
      else if (statusFilter === 'done') matchesStatus = s === 'done' || s === 'approved';
      else if (statusFilter === 'rejected') matchesStatus = s === 'rejected';

      return matchesSearch && matchesStatus;
    });
  }, [changes, searchTerm, statusFilter]);

  const columns: ColumnDef<BookingChange>[] = [
    {
      key: 'id',
      label: 'MÃ YÊU CẦU & NGÀY GỬI',
      sortable: true,
      render: (item) => (
        <div>
          <div className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
            #{String(item.id).slice(-8)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
            <Clock size={10} />
            <span>{timeAgo(item.created_at)}</span>
            <span>· {formatDateTime(item.created_at)}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'booking_code',
      label: 'ĐƠN VÉ LIÊN QUAN',
      sortable: true,
      render: (item) => {
        const bookingCode = item.booking_code || item.booking?.booking_code || `BK-${item.booking_id}`;
        const bookerName = item.booking?.booker_name || 'Khách đặt vé';
        const bookerPhone = item.booking?.booker_phone || '';
        const totalAmount = item.booking?.total_amount_vnd;
        return (
          <div>
            <span
              onClick={() => copyToClipboard(bookingCode)}
              className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs hover:underline cursor-pointer flex items-center gap-1"
              title="Bấm để sao chép mã đơn vé"
            >
              <Ticket size={13} />
              {bookingCode}
            </span>
            <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium mt-0.5">
              {bookerName} {bookerPhone ? `(${bookerPhone})` : ''}
            </div>
            {totalAmount != null && (
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                Giá trị: {formatVND(totalAmount)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'type',
      label: 'LOẠI THAY ĐỔI',
      sortable: true,
      render: (item) => {
        const typeMeta = getChangeTypeMeta(item.type);
        const TypeIcon = typeMeta.icon;
        return (
          <div>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${typeMeta.badgeClass}`}>
              <TypeIcon size={12} />
              <span>{typeMeta.label}</span>
            </span>
            {item.payload?.refund_amount_vnd != null && (
              <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold font-mono mt-1">
                Hoàn: {formatVND(item.payload.refund_amount_vnd)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'reason',
      label: 'NGƯỜI GỬI & LÝ DO',
      render: (item) => (
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
            <User size={12} className="text-slate-400" />
            <span>{item.requested_by_type === 'staff' ? 'Nhân viên quầy gửi' : 'Khách hàng gửi online'}</span>
          </div>
          <div className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
            {item.reason || 'Yêu cầu thay đổi thông tin chuyến'}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'TRẠNG THÁI',
      sortable: true,
      render: (item) => getStatusMeta(item.status).badge,
    },
    {
      key: 'actions',
      label: 'THAO TÁC XỬ LÝ',
      align: 'right',
      render: (item) => {
        const statusMeta = getStatusMeta(item.status);
        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedChange(item)}
              className="h-8 px-2.5 text-xs font-semibold gap-1 rounded-lg"
              title="Xem đầy đủ chi tiết yêu cầu"
            >
              <Eye size={13} />
              <span>Chi tiết</span>
            </Button>

            {statusMeta.isPending && (
              <>
                <Button
                  size="sm"
                  onClick={() => {
                    setReviewTarget({ item, decision: 'approve' });
                    setReviewReason('Chấp thuận yêu cầu thay đổi theo chính sách');
                  }}
                  className="h-8 px-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-xs rounded-lg"
                  title="Chấp thuận yêu cầu"
                >
                  <Check size={13} />
                  <span>Duyệt</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReviewTarget({ item, decision: 'reject' });
                    setReviewReason('Từ chối do không đáp ứng điều kiện hoàn đổi vé');
                  }}
                  className="h-8 px-2.5 text-xs font-semibold border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:hover:bg-rose-950/30 gap-1 rounded-lg"
                  title="Từ chối yêu cầu"
                >
                  <X size={13} />
                  <span>Từ chối</span>
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <AdminTablePage
        title="Quản Lý Yêu Cầu Đổi / Hủy Vé (Booking Changes &amp; Refunds)"
        subtitle="Hàng đợi tiếp nhận và phê duyệt yêu cầu đổi vé, đổi tàu/chuyến, hoàn hủy vé từ khách hàng và nhân viên quầy"
        icon={RotateCcw}
        apiError={apiError}
        searchValue={searchTerm}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Tìm theo mã SD..., tên khách, SĐT, lý do..."
        filterValue={statusFilter}
        onFilterChange={handleStatusFilterChange}
        filterOptions={statusOptions}
        columns={columns}
        columnStorageKey="superdong_booking_changes_columns"
        onRefresh={fetchQueue}
        refreshing={loading}
        data={filteredChanges}
        loading={loading}
        emptyText={apiError ? '⚠️ Không thể lấy dữ liệu từ Backend API.' : 'Không có yêu cầu đổi / hủy vé nào phù hợp.'}
        keyExtractor={(item) => String(item.id)}
        entityLabel="yêu cầu"
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />

      {/* Review Action Confirmation Modal */}
      {reviewTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/60">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                {reviewTarget.decision === 'approve' ? (
                  <>
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    <span>Xác Nhận Phê Duyệt Yêu Cầu</span>
                  </>
                ) : (
                  <>
                    <XCircle size={18} className="text-rose-600" />
                    <span>Xác Nhận Từ Chối Yêu Cầu</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => setReviewTarget(null)}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-sans">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                <div className="text-[11px] text-slate-500">
                  Đơn vé liên kết: <strong className="text-blue-600 dark:text-blue-400 font-mono">{reviewTarget.item.booking_code || reviewTarget.item.booking?.booking_code}</strong>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Loại yêu cầu: <strong className="text-slate-800 dark:text-slate-200">{getChangeTypeMeta(reviewTarget.item.type).label}</strong>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Lý do / Ghi chú xử lý <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  placeholder="Nhập ghi chú phản hồi cho khách hàng..."
                  rows={3}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 text-xs"
                  required
                />
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50/80 dark:bg-slate-800/60 border-t border-slate-200/80 dark:border-slate-800 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReviewTarget(null)}
                className="h-8 text-xs font-semibold rounded-lg"
                disabled={isSubmittingReview}
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmReview}
                disabled={isSubmittingReview}
                className={`h-8 px-4 text-xs font-semibold text-white shadow-xs rounded-lg ${
                  reviewTarget.decision === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isSubmittingReview ? (
                  <RefreshCw size={13} className="animate-spin mr-1" />
                ) : reviewTarget.decision === 'approve' ? (
                  <Check size={13} className="mr-1" />
                ) : (
                  <X size={13} className="mr-1" />
                )}
                {reviewTarget.decision === 'approve' ? 'Chấp thuận' : 'Từ chối'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedChange && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center border border-blue-200/60 dark:border-blue-800/60">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Chi Tiết Yêu Cầu #{String(selectedChange.id).slice(-8)}
                  </h3>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Đơn vé: <span className="font-mono font-bold text-blue-600">{selectedChange.booking_code || selectedChange.booking?.booking_code}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedChange(null)}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto font-sans text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <span className="text-slate-400 block text-[11px]">Người liên hệ:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {selectedChange.booking?.booker_name || 'Khách vãng lai'}
                  </span>
                  <div className="text-slate-500 text-[11px] font-mono mt-0.5">
                    {selectedChange.booking?.booker_phone}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Trạng thái &amp; Loại:</span>
                  <div className="mt-1 flex items-center gap-2">
                    {getStatusMeta(selectedChange.status).badge}
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {getChangeTypeMeta(selectedChange.type).label}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Lý do yêu cầu:</span>
                <p className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-800 dark:text-slate-200 font-medium">
                  {selectedChange.reason || 'Không có lý do chi tiết'}
                </p>
              </div>

              {selectedChange.payload && (
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Chi tiết xử lý / Hoàn tiền:</span>
                  <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-lg font-mono text-[11px] leading-relaxed overflow-x-auto">
                    {JSON.stringify(selectedChange.payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="px-6 py-3.5 bg-slate-50/80 dark:bg-slate-800/60 border-t border-slate-200/80 dark:border-slate-800 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedChange(null)}
                className="h-8 text-xs font-semibold rounded-lg"
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

