import React, { useState, useEffect, useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  FileText,
  CreditCard,
  Ship,
  Ticket,
  User,
  Eye,
  Check,
  X,
  Copy,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Ban,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { BookingChange } from '@/types';
import { getBookingChangeQueue, reviewBookingChange } from '@/apis/booking-changes';
import { PageHeader, TableToolbar } from '@/components/common/TableUtilities';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';

export const Route = createFileRoute('/_admin/booking-changes/')({
  component: BookingChangesPage,
});

// Format tiền tệ VNĐ
const formatVND = (amount?: number) => {
  if (amount == null) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// Format ngày giờ
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

// Helper tính khoảng thời gian tương đối
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

// Helper mapping Change Type
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

// Helper mapping Status
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
  const [changes, setChanges] = useState<BookingChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedChange, setSelectedChange] = useState<BookingChange | null>(null);

  // Review Modal State
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

  // Lọc dữ liệu thông minh
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

      const matchesType = typeFilter === 'all' || (item.type || '').toLowerCase().includes(typeFilter.toLowerCase());

      const s = (item.status || '').toLowerCase();
      let matchesStatus = true;
      if (statusFilter === 'pending') matchesStatus = s === 'pending' || s === 'manual_review';
      else if (statusFilter === 'done') matchesStatus = s === 'done' || s === 'approved';
      else if (statusFilter === 'rejected') matchesStatus = s === 'rejected';

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [changes, searchTerm, typeFilter, statusFilter]);

  // Thống kê nhanh KPI
  const stats = useMemo(() => {
    const total = changes.length;
    const pendingCount = changes.filter((c) => {
      const s = (c.status || '').toLowerCase();
      return s === 'pending' || s === 'manual_review';
    }).length;
    const doneCount = changes.filter((c) => {
      const s = (c.status || '').toLowerCase();
      return s === 'done' || s === 'approved';
    }).length;
    const rejectedCount = changes.filter((c) => (c.status || '').toLowerCase() === 'rejected').length;

    return { total, pendingCount, doneCount, rejectedCount };
  }, [changes]);

  // Xử lý gửi duyệt / từ chối
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

  return (
    <div className="space-y-4 w-full font-sans pb-12">
      {/* Header */}
      <PageHeader
        title="Quản Lý Yêu Cầu Đổi / Hủy Vé (Booking Changes & Refunds)"
        subtitle="Hàng đợi tiếp nhận và phê duyệt yêu cầu đổi vé, đổi tàu/chuyến, hoàn hủy vé từ khách hàng và nhân viên quầy."
        icon={RotateCcw}
        onRefresh={fetchQueue}
        refreshing={loading}
      />

      {/* API Error Alert */}
      {apiError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={18} className="shrink-0 text-rose-500" />
            <span>⚠️ Không thể kết nối lấy danh sách: {apiError}. Vui lòng kiểm tra lại Backend Server.</span>
          </div>
          <Button size="sm" variant="outline" onClick={fetchQueue} className="h-7 text-xs border-rose-300 dark:border-rose-800">
            Thử lại
          </Button>
        </div>
      )}

      {/* Toolbar Filter */}
      <TableToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm theo mã SD..., tên khách, SĐT, lý do..."
      >
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter Loại Thay Đổi */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-slate-100 outline-none cursor-pointer focus:border-blue-500 font-medium"
          >
            <option value="all">Tất cả loại yêu cầu</option>
            <option value="cancel">Hủy vé &amp; Hoàn tiền (Cancel)</option>
            <option value="change_trip">Đổi chuyến tàu (Change Trip)</option>
            <option value="change_seat">Đổi chỗ ngồi (Change Seat)</option>
          </select>

          {/* Filter Trạng Thái */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-slate-100 outline-none cursor-pointer focus:border-blue-500 font-medium"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ phê duyệt</option>
            <option value="done">Đã chấp thuận</option>
            <option value="rejected">Đã từ chối</option>
          </select>
        </div>
      </TableToolbar>

      {/* Main Table */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200/60 dark:border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Mã Yêu Cầu &amp; Ngày Gửi</th>
                <th className="py-3 px-4">Đơn Vé Liên Quan</th>
                <th className="py-3 px-4">Loại Thay Đổi</th>
                <th className="py-3 px-4 min-w-[260px]">Người Gửi &amp; Lý Do</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Thao Tác Xử Lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <span className="font-medium">Đang tải hàng đợi yêu cầu từ Backend Server...</span>
                  </td>
                </tr>
              ) : filteredChanges.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">
                    <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                      <Ticket size={24} />
                    </div>
                    <div className="font-semibold text-slate-700 dark:text-slate-300">Không có yêu cầu đổi / hủy vé nào</div>
                    <div className="text-[11px] text-slate-400 mt-1">Hàng đợi hiện tại đang trống hoặc không có bản ghi khớp bộ lọc</div>
                  </td>
                </tr>
              ) : (
                filteredChanges.map((item) => {
                  const typeMeta = getChangeTypeMeta(item.type);
                  const statusMeta = getStatusMeta(item.status);
                  const TypeIcon = typeMeta.icon;
                  const bookingCode = item.booking_code || item.booking?.booking_code || `BK-${item.booking_id}`;
                  const bookerName = item.booking?.booker_name || 'Khách đặt vé';
                  const bookerPhone = item.booking?.booker_phone || '';
                  const totalAmount = item.booking?.total_amount_vnd;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Mã Yêu Cầu & Thời Gian */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                          <span>#{String(item.id).slice(-8)}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Clock size={10} />
                          <span>{timeAgo(item.created_at)}</span>
                          <span>· {formatDateTime(item.created_at)}</span>
                        </div>
                      </td>

                      {/* Đơn Vé Liên Quan */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            onClick={() => copyToClipboard(bookingCode)}
                            className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs hover:underline cursor-pointer flex items-center gap-1"
                            title="Bấm để sao chép mã đơn vé"
                          >
                            <Ticket size={13} />
                            {bookingCode}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                          {bookerName} {bookerPhone ? `(${bookerPhone})` : ''}
                        </div>
                        {totalAmount != null && (
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            Giá trị: {formatVND(totalAmount)}
                          </div>
                        )}
                      </td>

                      {/* Loại Thay Đổi */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${typeMeta.badgeClass}`}>
                          <TypeIcon size={12} />
                          <span>{typeMeta.label}</span>
                        </span>
                        {item.payload?.refund_amount_vnd != null && (
                          <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold font-mono mt-1">
                            Hoàn: {formatVND(item.payload.refund_amount_vnd)}
                          </div>
                        )}
                      </td>

                      {/* Người Gửi & Lý Do */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                          <User size={12} className="text-slate-400" />
                          <span>{item.requested_by_type === 'staff' ? 'Nhân viên quầy gửi' : 'Khách hàng gửi online'}</span>
                        </div>
                        <div className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                          {item.reason || 'Yêu cầu thay đổi thông tin chuyến'}
                        </div>
                      </td>

                      {/* Trạng Thái */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {statusMeta.badge}
                      </td>

                      {/* Thao Tác Xử Lý */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Nút Xem Chi Tiết */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedChange(item)}
                            className="h-8 px-2.5 text-xs font-semibold gap-1"
                            title="Xem đầy đủ chi tiết yêu cầu"
                          >
                            <Eye size={13} />
                            <span>Chi tiết</span>
                          </Button>

                          {/* Action Buttons nếu đang chờ duyệt */}
                          {statusMeta.isPending && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setReviewTarget({ item, decision: 'approve' });
                                  setReviewReason('Chấp thuận yêu cầu thay đổi theo chính sách');
                                }}
                                className="h-8 px-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-xs"
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
                                className="h-8 px-2.5 text-xs font-semibold border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:hover:bg-rose-950/30 gap-1"
                                title="Từ chối yêu cầu"
                              >
                                <X size={13} />
                                <span>Từ chối</span>
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Action Confirmation Modal */}
      {reviewTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
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
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
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
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 text-xs"
                  required
                />
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50/80 dark:bg-slate-800/60 border-t border-slate-200/80 dark:border-slate-800 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReviewTarget(null)}
                className="h-8 text-xs font-semibold"
                disabled={isSubmittingReview}
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmReview}
                disabled={isSubmittingReview}
                className={`h-8 px-4 text-xs font-semibold text-white shadow-xs ${
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

      {/* Details Drawer / Modal */}
      {selectedChange && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center border border-blue-200/60 dark:border-blue-800/60">
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
              {/* Summary Info */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
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

              {/* Reason */}
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Lý do yêu cầu:</span>
                <p className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-800 dark:text-slate-200 font-medium">
                  {selectedChange.reason || 'Không có lý do chi tiết'}
                </p>
              </div>

              {/* Payload Breakdown */}
              {selectedChange.payload && (
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Chi tiết xử lý / Hoàn tiền:</span>
                  <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto">
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
                className="h-8 text-xs font-semibold"
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
