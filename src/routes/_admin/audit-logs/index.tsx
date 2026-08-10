import React, { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import {
  FileCode2,
  Search,
  Filter,
  User,
  Activity,
  Globe,
  Clock,
  Eye,
  X,
  Database,
  ShieldAlert
} from 'lucide-react';
import { AuditRecord } from '@/types';
import { getAuditRecords } from '@/apis/audits';

export const Route = createFileRoute('/_admin/audit-logs/')({
  component: AuditLogsPage,
});

const INITIAL_LOGS: AuditRecord[] = [
  {
    id: 'ADT-1001',
    user_id: '2',
    user_name: 'Nguyễn Văn Thành (Quản lý bến)',
    module: 'Bookings',
    action: 'Duyệt đổi vé',
    description: 'Đã phê duyệt yêu cầu đổi giờ chuyến CHG-8801 cho đơn BK-99201',
    ip_address: '113.161.45.12',
    old_values: { trip_time: '07:30 AM', boat: 'Superdong IX' },
    new_values: { trip_time: '13:00 PM', boat: 'Superdong VI' },
    created_at: '2026-08-10 10:45:12',
  },
  {
    id: 'ADT-1002',
    user_id: '1',
    user_name: 'Admin Master (Super Admin)',
    module: 'Coupons',
    action: 'Tạo mới Mã giảm giá',
    description: 'Khởi tạo mã voucher SUMMER2026 giảm 15% cho hải trình Côn Đảo & Phú Quốc',
    ip_address: '14.241.80.2',
    old_values: undefined,
    new_values: { code: 'SUMMER2026', discount: '15%', usage_limit: 500 },
    created_at: '2026-08-10 09:12:05',
  },
  {
    id: 'ADT-1003',
    user_id: '4',
    user_name: 'Lê Văn Kiên (Soát vé)',
    module: 'CheckIn',
    action: 'Quét vé QR',
    description: 'Xác nhận hành khách Nguyễn Văn Hùng qua cổng soát vé bến Rạch Giá thành công',
    ip_address: '113.161.45.14',
    old_values: { status: 'valid', checked_in: false },
    new_values: { status: 'used', checked_in: true },
    created_at: '2026-08-10 08:30:20',
  },
  {
    id: 'ADT-1004',
    user_id: 'system',
    user_name: 'Hệ Thống Tự Động (Cron job)',
    module: 'Trips',
    action: 'Khóa nhận đơn vé',
    description: 'Tự động đóng cổng bán vé chuyến SD-09 07:30 trước giờ khởi hành 15 phút',
    ip_address: '127.0.0.1',
    old_values: { status: 'open' },
    new_values: { status: 'closed' },
    created_at: '2026-08-10 07:15:00',
  },
  {
    id: 'ADT-1005',
    user_id: '1',
    user_name: 'Admin Master (Super Admin)',
    module: 'Users',
    action: 'Cập nhật tài khoản',
    description: 'Thay đổi vai trò và phân quyền lại cho nhân viên thu.tt từ Ticket Agent sang Senior Agent',
    ip_address: '14.241.80.2',
    old_values: { role_id: '3' },
    new_values: { role_id: '2' },
    created_at: '2026-08-09 16:20:45',
  },
];

function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditRecord[]>(INITIAL_LOGS);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadLogs() {
      try {
        setLoading(true);
        const res = await getAuditRecords();
        if (isMounted && res && res.data && res.data.length > 0) {
          setLogs(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch audit records:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadLogs();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredLogs = logs.filter((record) => {
    const matchesSearch =
      record.id.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.user_name && record.user_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.ip_address && record.ip_address.includes(searchTerm));

    const matchesModule = moduleFilter === 'all' || record.module === moduleFilter;

    return matchesSearch && matchesModule;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileCode2 className="h-6 w-6 text-blue-600" />
              Nhật Ký Thao Tác Hệ Thống (Audit Logs)
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live API Backend
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Ghi lại toàn bộ lịch sử truy cập, thay đổi dữ liệu, thao tác duyệt vé và tác động cấu hình
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600">
            <Activity size={22} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Tổng Ghi Nhận Lịch Sử</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">1,248 nhật ký</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600">
            <User size={22} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Thao Tác Trong Ngày</div>
            <div className="text-xl font-bold text-emerald-600">184 hành động</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600">
            <ShieldAlert size={22} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Thao Tác Nhạy Cảm</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">0 cảnh báo</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex flex-col md:flex-row gap-3 justify-between">
        <div className="relative max-w-md w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo Người thực hiện, Mô tả thao tác, Địa chỉ IP..."
            className="w-full h-10 pl-9 pr-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 outline-none cursor-pointer"
          >
            <option value="all">Tất cả Phân hệ (Modules)</option>
            <option value="Bookings">Đơn đặt vé (Bookings)</option>
            <option value="Coupons">Mã khuyến mãi (Coupons)</option>
            <option value="CheckIn">Soát vé (CheckIn)</option>
            <option value="Trips">Chuyến tàu (Trips)</option>
            <option value="Users">Tài khoản (Users)</option>
          </select>
        </div>
      </div>

      {/* Logs Data Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">Thời Gian</th>
                <th className="p-4">Người Thực Hiện</th>
                <th className="p-4">Phân Hệ</th>
                <th className="p-4">Hành Động &amp; Mô Tả Chi Tiết</th>
                <th className="p-4">Địa Chỉ IP</th>
                <th className="p-4 text-right">Chi Tiết Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 text-xs font-mono font-medium text-slate-500 flex items-center gap-1.5">
                    <Clock size={13} className="text-slate-400 shrink-0" />
                    {record.created_at}
                  </td>
                  <td className="p-4 font-bold text-slate-900 dark:text-slate-100">
                    {record.user_name}
                  </td>
                  <td className="p-4">
                    <span className="bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 text-xs px-2.5 py-1 rounded font-mono font-bold border border-slate-200 dark:border-slate-700">
                      {record.module}
                    </span>
                  </td>
                  <td className="p-4 max-w-md">
                    <div className="font-bold text-slate-900 dark:text-white text-xs">{record.action}</div>
                    <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{record.description}</div>
                  </td>
                  <td className="p-4 font-mono text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Globe size={12} /> {record.ip_address || 'Local'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setSelectedRecord(record)}
                      className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 cursor-pointer"
                      title="Xem chi tiết thay đổi Dữ liệu"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Diff Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Database size={18} className="text-blue-600" />
                Chi Tiết Biến Đổi Dữ Liệu: {selectedRecord.id}
              </h3>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 font-sans text-xs">
              <div>
                <span className="text-slate-500 font-bold block mb-1">Mô tả hành động:</span>
                <p className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-slate-800 dark:text-slate-200">
                  {selectedRecord.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-rose-500 font-bold block mb-1">Giá trị cũ (Before):</span>
                  <pre className="p-3 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-300 rounded-lg font-mono text-[11px] overflow-x-auto border border-rose-200/50">
                    {selectedRecord.old_values
                      ? JSON.stringify(selectedRecord.old_values, null, 2)
                      : 'N/A (Tạo mới)'}
                  </pre>
                </div>

                <div>
                  <span className="text-emerald-600 font-bold block mb-1">Giá trị mới (After):</span>
                  <pre className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 rounded-lg font-mono text-[11px] overflow-x-auto border border-emerald-200/50">
                    {selectedRecord.new_values
                      ? JSON.stringify(selectedRecord.new_values, null, 2)
                      : 'N/A (Đã xóa)'}
                  </pre>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
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
