import React, { useState, useEffect, useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import {
  FileCode2,
  Clock,
  X,
  Database,
  RefreshCw,
  AlertTriangle,
  ShieldAlert,
  UserCheck,
  Users,
  Layers,
  Copy,
  Check,
  FileDiff,
  Tag,
  Ship,
  Calendar,
  Ticket,
  User as UserIcon,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import { AuditRecord } from '@/types';
import { getAuditRecords } from '@/apis/audits';
import { PageHeader, TableToolbar } from '@/components/common/TableUtilities';
import { Button } from '@/components/common/Button';

export const Route = createFileRoute('/_admin/audit-logs/')({
  component: AuditLogsPage,
});

// Helper định dạng thời gian thân thiện
function formatDateTime(isoStr?: string) {
  if (!isoStr) return '--:-- --/--/----';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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

// Helper mapping Icon & Color cho từng phân hệ Aggregate
function getAggregateMeta(aggregateType?: string) {
  const type = (aggregateType || '').toLowerCase();
  switch (type) {
    case 'booking':
      return { label: 'Đơn Vé', icon: Ticket, badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800' };
    case 'trip':
      return { label: 'Chuyến Tàu', icon: Ship, badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' };
    case 'boat':
      return { label: 'Đội Tàu', icon: Ship, badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800' };
    case 'schedule':
      return { label: 'Lịch Chạy', icon: Calendar, badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800' };
    case 'coupon':
      return { label: 'Khuyến Mãi', icon: Tag, badgeClass: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-400 dark:border-pink-800' };
    case 'user':
      return { label: 'Tài Khoản', icon: UserIcon, badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800' };
    default:
      return { label: aggregateType || 'Hệ Thống', icon: Layers, badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' };
  }
}

// Helper mapping Action Badge
function getActionMeta(action?: string) {
  const act = (action || '').toLowerCase();
  if (act.includes('create')) {
    return { label: 'Tạo mới', bgClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
  }
  if (act.includes('boat') || act.includes('change') || act.includes('seat')) {
    return { label: 'Đổi cấu hình', bgClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' };
  }
  if (act.includes('update')) {
    return { label: 'Cập nhật', bgClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' };
  }
  if (act.includes('delete') || act.includes('cancel')) {
    return { label: 'Xóa / Hủy', bgClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' };
  }
  return { label: action || 'Thao tác', bgClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' };
}

// Helper mapping Actor Type
function getActorMeta(actorType?: string) {
  const actor = (actorType || '').toLowerCase();
  switch (actor) {
    case 'staff':
    case 'admin':
      return { label: 'Quản trị viên', icon: UserCheck, class: 'text-blue-600 dark:text-blue-400 font-bold' };
    case 'guest':
      return { label: 'Khách hàng', icon: Users, class: 'text-amber-600 dark:text-amber-400 font-medium' };
    default:
      return { label: 'Hệ thống tự động', icon: Activity, class: 'text-purple-600 dark:text-purple-400 font-medium' };
  }
}

function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [actorFilter, setActorFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await getAuditRecords({ limit: 100 });
      if (res && res.data && Array.isArray(res.data)) {
        setLogs(res.data);
      } else {
        setLogs([]);
      }
    } catch (err: any) {
      console.error('Fetch audit logs error:', err);
      setLogs([]);
      const msg = err?.response?.data?.message || err?.message || 'Không thể kết nối với Backend API';
      setApiError(msg);
      toast.error(`Không thể lấy nhật ký hệ thống: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Lọc thông minh
  const filteredLogs = useMemo(() => {
    return logs.filter((record) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        String(record.id).toLowerCase().includes(term) ||
        String(record.aggregate_id || '').toLowerCase().includes(term) ||
        (record.aggregate_type && record.aggregate_type.toLowerCase().includes(term)) ||
        (record.reason && record.reason.toLowerCase().includes(term)) ||
        (record.action && record.action.toLowerCase().includes(term)) ||
        (record.actor_type && record.actor_type.toLowerCase().includes(term));

      const matchesModule = moduleFilter === 'all' || (record.aggregate_type || '').toLowerCase() === moduleFilter.toLowerCase();
      const matchesActor = actorFilter === 'all' || (record.actor_type || '').toLowerCase() === actorFilter.toLowerCase();
      const matchesAction = actionFilter === 'all' || (record.action || '').toLowerCase().includes(actionFilter.toLowerCase());

      return matchesSearch && matchesModule && matchesActor && matchesAction;
    });
  }, [logs, searchTerm, moduleFilter, actorFilter, actionFilter]);

  // Thống kê nhanh KPI
  const stats = useMemo(() => {
    const total = logs.length;
    const staffCount = logs.filter((l) => (l.actor_type || '').toLowerCase() === 'staff' || (l.actor_type || '').toLowerCase() === 'admin').length;
    const guestCount = logs.filter((l) => (l.actor_type || '').toLowerCase() === 'guest').length;
    const tripOpsCount = logs.filter((l) => (l.aggregate_type || '').toLowerCase() === 'trip' || (l.aggregate_type || '').toLowerCase() === 'boat').length;

    return { total, staffCount, guestCount, tripOpsCount };
  }, [logs]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Đã sao chép vào clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-4 w-full font-sans pb-12">
      {/* Header */}
      <PageHeader
        title="Nhật Ký Thao Tác Hệ Thống (Audit Trail & Activity Logs)"
        subtitle="Theo dõi toàn diện lịch sử biến động dữ liệu, phân hệ và tác nhân thao tác thời gian thực từ Backend API."
        icon={FileCode2}
        onRefresh={fetchLogs}
        refreshing={loading}
      />

      {/* API Error Alert */}
      {apiError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={18} className="shrink-0 text-rose-500" />
            <span>⚠️ Không thể kết nối lấy nhật ký: {apiError}. Vui lòng kiểm tra lại Backend Server.</span>
          </div>
          <Button size="sm" variant="outline" onClick={fetchLogs} className="h-7 text-xs border-rose-300 dark:border-rose-800">
            Thử lại
          </Button>
        </div>
      )}

      {/* Filter Bar */}
      <TableToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm theo mã ID, phân hệ, lý do nghiệp vụ..."
      >
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter Phân Hệ */}
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-slate-100 outline-none cursor-pointer focus:border-blue-500 font-medium"
          >
            <option value="all">Tất cả Phân hệ</option>
            <option value="Booking">Đơn vé (Booking)</option>
            <option value="Trip">Chuyến tàu (Trip)</option>
            <option value="Boat">Đội tàu (Boat)</option>
            <option value="Schedule">Lịch chạy (Schedule)</option>
            <option value="Coupon">Mã giảm giá (Coupon)</option>
            <option value="User">Tài khoản (User)</option>
          </select>

          {/* Filter Tác Nhân */}
          <select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            className="h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-slate-100 outline-none cursor-pointer focus:border-blue-500 font-medium"
          >
            <option value="all">Tất cả Tác nhân</option>
            <option value="staff">Quản trị viên (Staff/Admin)</option>
            <option value="guest">Khách đặt vé (Guest)</option>
            <option value="system">Hệ thống ngầm (System)</option>
          </select>

          {/* Filter Hành Động */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-slate-100 outline-none cursor-pointer focus:border-blue-500 font-medium"
          >
            <option value="all">Tất cả Hành động</option>
            <option value="create">Tạo mới (Created)</option>
            <option value="boat">Đổi tàu / Ghế (Boat Change)</option>
            <option value="update">Cập nhật (Updated)</option>
            <option value="status">Đổi trạng thái (Status Change)</option>
          </select>
        </div>
      </TableToolbar>

      {/* Audit Logs Table */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200/60 dark:border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Thời Gian &amp; ID</th>
                <th className="py-3 px-4">Phân Hệ (Entity)</th>
                <th className="py-3 px-4">Hành Động</th>
                <th className="py-3 px-4">Tác Nhân</th>
                <th className="py-3 px-4 min-w-[280px]">Mô Tả Nghiệp Vụ / Lý Do</th>
                <th className="py-3 px-4 text-right">Biến Động Dữ Liệu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <span className="font-medium">Đang tải nhật ký thao tác từ Backend Server...</span>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">
                    <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                      <FileCode2 size={24} />
                    </div>
                    <div className="font-semibold text-slate-700 dark:text-slate-300">Không tìm thấy bản ghi nhật ký phù hợp</div>
                    <div className="text-[11px] text-slate-400 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh lại bộ lọc phân hệ</div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((record) => {
                  const aggMeta = getAggregateMeta(record.aggregate_type);
                  const actMeta = getActionMeta(record.action);
                  const actorMeta = getActorMeta(record.actor_type);
                  const AggIcon = aggMeta.icon;
                  const ActorIcon = actorMeta.icon;

                  const hasDiff = Boolean(record.before_json || record.after_json);

                  return (
                    <tr key={record.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Thời gian */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-medium text-slate-900 dark:text-slate-100 text-xs">
                          {formatDateTime(record.occurred_at || record.created_at)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Clock size={10} />
                          <span>{timeAgo(record.occurred_at || record.created_at)}</span>
                          <span className="font-mono opacity-60">· #{String(record.id).slice(-6)}</span>
                        </div>
                      </td>

                      {/* Phân hệ Entity */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${aggMeta.badgeClass}`}>
                          <AggIcon size={12} />
                          <span>{aggMeta.label} #{record.aggregate_id || 'N/A'}</span>
                        </span>
                      </td>

                      {/* Hành động */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border font-mono ${actMeta.bgClass}`}>
                          {actMeta.label}
                        </span>
                      </td>

                      {/* Tác nhân */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <ActorIcon size={13} className={actorMeta.class} />
                          <span className={`text-xs ${actorMeta.class}`}>
                            {actorMeta.label}
                            {record.actor_id ? ` (${String(record.actor_id).slice(-4)})` : ''}
                          </span>
                        </div>
                      </td>

                      {/* Mô tả / Lý do */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                          {record.reason || record.description || 'Thao tác nghiệp vụ hệ thống'}
                        </div>
                        {record.tracking_id && (
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            Trace: {record.tracking_id}
                          </div>
                        )}
                      </td>

                      {/* Nút Xem Biến Động Diff */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {hasDiff ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRecord(record)}
                            className="h-8 px-2.5 text-xs font-semibold gap-1.5 border-blue-200/80 bg-blue-50/40 hover:bg-blue-100/80 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300"
                            title="So sánh chi tiết thay đổi dữ liệu Before vs After"
                          >
                            <FileDiff size={14} className="text-blue-600 dark:text-blue-400" />
                            <span>So sánh Diff</span>
                          </Button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Không có payload</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual JSON Diff Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center border border-blue-200/60 dark:border-blue-800/60">
                  <Database size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <span>Biến Động Dữ Liệu: {selectedRecord.aggregate_type} #{selectedRecord.aggregate_id}</span>
                  </h3>
                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>Hành động: <strong className="font-mono text-slate-700 dark:text-slate-300">{selectedRecord.action}</strong></span>
                    <span>·</span>
                    <span>{formatDateTime(selectedRecord.occurred_at || selectedRecord.created_at)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto font-sans text-xs">
              {/* Business Reason Box */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 font-bold block mb-1 uppercase tracking-wider text-[10px]">Lý do &amp; Mô tả nghiệp vụ:</span>
                <p className="text-slate-800 dark:text-slate-200 font-medium text-xs">
                  {selectedRecord.reason || selectedRecord.description || 'Thao tác trực tiếp từ giao diện quản trị'}
                </p>
              </div>

              {/* Side-by-side JSON Diff Visualizer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Before Snapshot */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-rose-500" />
                      Dữ Liệu Trước (Before Snapshot)
                    </span>
                    {selectedRecord.before_json && (
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(selectedRecord.before_json, null, 2), 'before')}
                        className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1 font-mono cursor-pointer"
                      >
                        {copiedKey === 'before' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        <span>Copy</span>
                      </button>
                    )}
                  </div>
                  <pre className="p-3.5 bg-rose-50/40 dark:bg-rose-950/20 text-rose-950 dark:text-rose-200 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto border border-rose-200/60 dark:border-rose-900/40 min-h-[140px]">
                    {selectedRecord.before_json
                      ? JSON.stringify(selectedRecord.before_json, null, 2)
                      : '// Không có dữ liệu cũ (Bản ghi khởi tạo mới)'}
                  </pre>
                </div>

                {/* After Snapshot */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Dữ Liệu Sau (After Snapshot)
                    </span>
                    {selectedRecord.after_json && (
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(selectedRecord.after_json, null, 2), 'after')}
                        className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1 font-mono cursor-pointer"
                      >
                        {copiedKey === 'after' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        <span>Copy</span>
                      </button>
                    )}
                  </div>
                  <pre className="p-3.5 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-200 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto border border-emerald-200/60 dark:border-emerald-900/40 min-h-[140px]">
                    {selectedRecord.after_json
                      ? JSON.stringify(selectedRecord.after_json, null, 2)
                      : '// Đã bị xóa hoàn toàn'}
                  </pre>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50/80 dark:bg-slate-800/60 border-t border-slate-200/80 dark:border-slate-800 flex justify-between items-center">
              <div className="text-[11px] text-slate-400 font-mono">
                Log ID: {selectedRecord.id}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRecord(null)}
                className="h-8 text-xs font-semibold"
              >
                Đóng cửa sổ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
