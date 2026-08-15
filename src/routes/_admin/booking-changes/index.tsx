import React, { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { RefreshCw, Search, CheckCircle2, XCircle, Clock, Calendar, Eye, Check, X, User, RefreshCw as SpinIcon, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { BookingChange } from '@/types';
import { getBookingChangeQueue, reviewBookingChange } from '@/apis/booking-changes';

export const Route = createFileRoute('/_admin/booking-changes/')({
  component: BookingChangesPage,
});

function BookingChangesPage() {
  const [changes, setChanges] = useState<BookingChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [activeModal, setActiveModal] = useState<{
    type: 'approve' | 'reject' | 'view';
    item: BookingChange;
  } | null>(null);

  const [adminNote, setAdminNote] = useState('');

  const fetchQueueData = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await getBookingChangeQueue();
      if (res && res.data && Array.isArray(res.data)) {
        setChanges(res.data);
      } else {
        setChanges([]);
      }
    } catch (err: any) {
      console.error('Fetch booking change queue error:', err);
      setChanges([]);
      setApiError(err?.response?.data?.message || err?.message || 'Không thể kết nối với Backend API');
      toast.error('Không thể lấy hàng đợi đổi vé từ Backend API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData();
  }, []);

  const filteredChanges = changes.filter((item) => {
    const matchesSearch =
      (item.booking_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.requested_by && item.requested_by.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === 'all' || item.change_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleConfirmAction = async () => {
    if (!activeModal) return;
    const { type, item } = activeModal;

    try {
      await reviewBookingChange(item.id, type === 'approve' ? 'approve' : 'reject', adminNote);
      toast.success(`Đã xử lý thành công yêu cầu ${item.id}`);
      fetchQueueData();
    } catch (err: any) {
      toast.error(`Lỗi duyệt yêu cầu: ${err?.message || 'Không thể thực hiện'}`);
    }

    setActiveModal(null);
    setAdminNote('');
  };

  const renderTypeBadge = (type: string) => {
    switch (type) {
      case 'reschedule':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Calendar size={12} /> Đổi lịch chuyến
          </span>
        );
      case 'cancellation':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle size={12} /> Hủy vé / Hoàn tiền
          </span>
        );
      case 'seat_change':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <RefreshCw size={12} /> Đổi vị trí ghế
          </span>
        );
      default:
        return <span className="text-xs text-slate-500">{type}</span>;
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <RefreshCw className="h-6 w-6 text-blue-600" />
              Yêu Cầu Đổi / Hủy Vé Live
            </h1>
            {!apiError && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 size={13} /> Live API Backend
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Hàng đợi tiếp nhận phê duyệt đổi / hủy vé kết nối từ Server Backend Superdong
          </p>
        </div>
        <button
          onClick={fetchQueueData}
          disabled={loading}
          className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer shadow-xs"
          title="Làm mới dữ liệu"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* API Error Alert */}
      {apiError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-2.5">
          <AlertTriangle size={18} className="shrink-0 text-rose-500" />
          <span>⚠️ Không thể lấy dữ liệu từ Backend API: {apiError}. Vui lòng kiểm tra lại Server Backend!</span>
        </div>
      )}

      {/* Filter bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo Mã yêu cầu (CHG-...), Mã đơn vé..."
            className="w-full h-10 pl-9 pr-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 outline-none cursor-pointer"
          >
            <option value="all">Tất cả loại yêu cầu</option>
            <option value="reschedule">Đổi lịch chuyến</option>
            <option value="cancellation">Hủy vé &amp; Hoàn tiền</option>
            <option value="seat_change">Đổi vị trí ghế</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 outline-none cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã chấp thuận</option>
            <option value="rejected">Đã từ chối</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">Mã Yêu Cầu</th>
                <th className="p-4">Đơn Vé Liên Quan</th>
                <th className="p-4">Loại Thay Đổi</th>
                <th className="p-4">Người Yêu Cầu &amp; Lý Do</th>
                <th className="p-4">Ngày Gửi</th>
                <th className="p-4">Trạng Thái</th>
                <th className="p-4 text-right">Thao Tác Duyệt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" />
                    Đang tải dữ liệu từ Backend API...
                  </td>
                </tr>
              ) : filteredChanges.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    {apiError ? '⚠️ Không thể lấy dữ liệu từ Backend API.' : 'Không có yêu cầu đổi/hủy vé nào.'}
                  </td>
                </tr>
              ) : (
                filteredChanges.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">{item.id}</td>
                    <td className="p-4 font-mono font-bold text-blue-600">{item.booking_code}</td>
                    <td className="p-4">{renderTypeBadge(item.change_type)}</td>
                    <td className="p-4 max-w-xs">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{item.requested_by || 'Khách hàng'}</div>
                      <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">{item.reason}</div>
                    </td>
                    <td className="p-4 text-xs text-slate-500 font-medium">{item.created_at}</td>
                    <td className="p-4">
                      {item.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500 text-white">
                          <Clock size={12} /> Chờ phê duyệt
                        </span>
                      )}
                      {item.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500 text-white">
                          <CheckCircle2 size={12} /> Đã chấp thuận
                        </span>
                      )}
                      {item.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500 text-white">
                          <XCircle size={12} /> Đã từ chối
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-1">
                      <button
                        onClick={() => setActiveModal({ type: 'view', item })}
                        className="p-1.5 inline-flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                        title="Xem chi tiết lý do"
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
    </div>
  );
}
