import React, { useState, useEffect, useMemo } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  Ship,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Lock,
  Unlock,
  CheckCheck,
  Ban,
  AlertTriangle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  getTrips,
  deleteTrip,
  openTripForSale,
  closeTripForSale,
  markTripDeparted,
  completeTrip,
  cancelTrip,
} from '@/apis/trips';
import { getRoutes } from '@/apis/journeys';
import { getBoats } from '@/apis/boats';
import { Trip, TripStatus, Boat, Route as JourneyRoute } from '@/types';
import { Button } from '@/components/common/Button';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { AdminTablePage, ColumnDef } from '@/components/common/TableUtilities';

export const Route = createFileRoute('/_admin/trips/')({
  component: TripsPage,
});

export interface TripRowItem {
  id: string;
  code: string;
  route_id: string;
  routeName: string;
  boat_id: string;
  boatName: string;
  start_at: string;
  end_at: string;
  departureTimeText: string;
  departureDateText: string;
  status: TripStatus;
  version: number;
  shuttle_phone?: string | null;
  raw: Trip;
}

const STATUS_LABELS: Record<string, { label: string; colorClass: string; icon: any }> = {
  draft: {
    label: 'Bản nháp',
    colorClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    icon: Clock,
  },
  selling: {
    label: 'Đang mở bán',
    colorClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    icon: CheckCircle2,
  },
  closed: {
    label: 'Đã khóa sổ',
    colorClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    icon: Lock,
  },
  started: {
    label: 'Đã xuất bến',
    colorClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    icon: Play,
  },
  completed: {
    label: 'Hoàn thành',
    colorClass: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    icon: CheckCheck,
  },
  cancelled: {
    label: 'Đã hủy chuyến',
    colorClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    icon: XCircle,
  },
};

function formatTime(isoStr?: string) {
  if (!isoStr) return '--:--';
  try {
    const d = new Date(isoStr);
    if (Number.isNaN(d.getTime())) return isoStr.slice(11, 16) || '--:--';
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--:--';
  }
}

function formatDate(isoStr?: string) {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (Number.isNaN(d.getTime())) return isoStr.slice(0, 10);
    return d.toLocaleDateString('vi-VN');
  } catch {
    return '';
  }
}

function TripsPage() {
  const [trips, setTrips] = useState<TripRowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Status Action Modal State
  const [actionTarget, setActionTarget] = useState<{
    trip: TripRowItem;
    actionType: 'open-sale' | 'close-sale' | 'depart' | 'complete' | 'cancel' | 'delete';
    title: string;
    description: string;
  } | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const fetchTripsData = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const [tripsRes, routesRes, boatsRes] = await Promise.all([
        getTrips({ limit: 100 }),
        getRoutes({ limit: 100 }),
        getBoats({ limit: 100 }),
      ]);

      const routesMap = new Map<string, JourneyRoute>(
        (routesRes?.data || []).map((r: any) => [String(r.id), r])
      );
      const boatsMap = new Map<string, Boat>(
        (boatsRes?.data || []).map((b: any) => [String(b.id), b])
      );

      if (tripsRes && tripsRes.data && Array.isArray(tripsRes.data)) {
        const mapped: TripRowItem[] = tripsRes.data.map((t: any, idx: number) => {
          const route = t.route || (t.route_id ? routesMap.get(String(t.route_id)) : null);
          const boat = t.boat || (t.boat_id ? boatsMap.get(String(t.boat_id)) : null);

          const routeName = route?.name || (route?.code ? `Tuyến ${route.code}` : 'Tuyến hải trình');
          const boatName = boat?.name ? (boat.code ? `${boat.name} (${boat.code})` : boat.name) : 'Tàu Superdong';

          const startAt = t.start_at || t.departure_time || '';
          const endAt = t.end_at || t.arrival_time || '';

          // Cache for Edit page
          localStorage.setItem(`superdong_trip_cache_${t.id}`, JSON.stringify({
            ...t,
            routeName,
            boatName,
          }));

          return {
            id: String(t.id),
            code: `TRIP-${String(t.id).slice(0, 6).toUpperCase()}`,
            route_id: String(t.route_id || ''),
            routeName,
            boat_id: String(t.boat_id || ''),
            boatName,
            start_at: startAt,
            end_at: endAt,
            departureTimeText: `${formatTime(startAt)} - ${formatTime(endAt)}`,
            departureDateText: formatDate(startAt),
            status: (t.status || 'draft') as TripStatus,
            version: typeof t.version === 'number' ? t.version : 1,
            shuttle_phone: t.shuttle_phone,
            raw: t,
          };
        });
        setTrips(mapped);
      } else {
        setTrips([]);
      }
    } catch (err: any) {
      console.error('Fetch trips error:', err);
      setTrips([]);
      setApiError(err?.response?.data?.message || err?.message || 'Không thể tải danh sách chuyến tàu từ Backend');
      toast.error('Không thể lấy dữ liệu chuyến tàu từ Backend API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripsData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, pageSize]);

  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      const keyword = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !keyword ||
        t.code.toLowerCase().includes(keyword) ||
        t.routeName.toLowerCase().includes(keyword) ||
        t.boatName.toLowerCase().includes(keyword) ||
        t.departureDateText.includes(keyword);

      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [trips, searchTerm, statusFilter]);

  const handleExecuteStatusAction = async () => {
    if (!actionTarget) return;

    setIsProcessingAction(true);
    const { trip, actionType } = actionTarget;

    try {
      if (actionType === 'open-sale') {
        await openTripForSale(trip.id, {
          expected_version: trip.version,
          reason: `Mở bán vé chuyến ${trip.code} từ dashboard`,
        });
        toast.success(`Đã mở bán vé cho chuyến ${trip.code} thành công!`);
      } else if (actionType === 'close-sale') {
        await closeTripForSale(trip.id, {
          expected_version: trip.version,
          reason: `Khóa sổ bán vé chuyến ${trip.code} từ dashboard`,
        });
        toast.success(`Đã khóa bán vé cho chuyến ${trip.code}!`);
      } else if (actionType === 'depart') {
        await markTripDeparted(trip.id, {
          expected_version: trip.version,
          reason: `Xác nhận chuyến ${trip.code} đã xuất bến`,
        });
        toast.success(`Chuyến ${trip.code} đã xuất bến!`);
      } else if (actionType === 'complete') {
        await completeTrip(trip.id, {
          expected_version: trip.version,
          reason: `Xác nhận chuyến ${trip.code} đã cập bến hoàn tất`,
        });
        toast.success(`Chuyến ${trip.code} đã hoàn thành hành trình!`);
      } else if (actionType === 'cancel') {
        await cancelTrip(trip.id, {
          expected_version: trip.version,
          reason: `Hủy chuyến ${trip.code} do yêu cầu điều hành`,
        });
        toast.success(`Đã hủy chuyến ${trip.code}!`);
      } else if (actionType === 'delete') {
        await deleteTrip(trip.id, {
          reason: `Xóa chuyến nháp ${trip.code}`,
        });
        toast.success(`Đã xóa chuyến ${trip.code} thành công!`);
      }

      setActionTarget(null);
      await fetchTripsData();
    } catch (err: any) {
      console.error('Trip status action error:', err);
      const msg = err?.response?.data?.message || err?.message || 'Thao tác không thành công';
      toast.error(`Lỗi: ${msg}`);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'draft', label: 'Bản nháp' },
    { value: 'selling', label: 'Đang mở bán' },
    { value: 'closed', label: 'Đã khóa sổ' },
    { value: 'started', label: 'Đã xuất bến' },
    { value: 'completed', label: 'Hoàn thành' },
    { value: 'cancelled', label: 'Đã hủy' },
  ];

  const columns: ColumnDef<TripRowItem>[] = [
    {
      key: 'code',
      label: 'MÃ CHUYẾN',
      sortable: true,
      render: (t) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 whitespace-nowrap">
          {t.code}
        </span>
      ),
    },
    {
      key: 'routeName',
      label: 'TUYẾN HẢI TRÌNH',
      sortable: true,
      render: (t) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white whitespace-nowrap">{t.routeName}</p>
          {t.shuttle_phone && (
            <p className="text-[11px] text-slate-500">Xe đón: {t.shuttle_phone}</p>
          )}
        </div>
      ),
    },
    {
      key: 'boatName',
      label: 'TÀU ĐẢM NHẬN',
      sortable: true,
      render: (t) => (
        <span className="text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5 whitespace-nowrap">
          <Ship size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
          {t.boatName}
        </span>
      ),
    },
    {
      key: 'departureTimeText',
      label: 'GIỜ CHẠY / NGÀY',
      sortable: true,
      render: (t) => (
        <div>
          <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 whitespace-nowrap font-mono text-xs">
            <Clock size={14} className="shrink-0" />
            {t.departureTimeText}
          </span>
          <span className="text-xs text-slate-500 font-mono">{t.departureDateText}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'TRẠNG THÁI',
      sortable: true,
      render: (t) => {
        const meta = STATUS_LABELS[t.status] || STATUS_LABELS.draft;
        const IconComponent = meta.icon;
        return (
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${meta.colorClass}`}>
            <IconComponent size={12} /> {meta.label}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'ĐIỀU HÀNH CHUYẾN',
      align: 'right',
      render: (t) => (
        <div className="flex items-center justify-end gap-1">
          {/* Status Quick Operations */}
          {t.status === 'draft' && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-[11px] font-semibold border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 gap-1"
              onClick={() =>
                setActionTarget({
                  trip: t,
                  actionType: 'open-sale',
                  title: 'Xác nhận mở bán vé chuyến tàu',
                  description: `Bạn có chắc chắn muốn mở bán vé cho chuyến ${t.code} (${t.routeName})?`,
                })
              }
              title="Mở bán vé cho chuyến này"
            >
              <Unlock size={12} /> Mở bán
            </Button>
          )}

          {t.status === 'selling' && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-[11px] font-semibold border-amber-500/30 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 gap-1"
              onClick={() =>
                setActionTarget({
                  trip: t,
                  actionType: 'close-sale',
                  title: 'Xác nhận đóng bán vé chuyến tàu',
                  description: `Bạn có muốn khóa sổ bán vé cho chuyến ${t.code}?`,
                })
              }
              title="Đóng / Khóa bán vé"
            >
              <Lock size={12} /> Khóa bán
            </Button>
          )}

          {t.status === 'closed' && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-[11px] font-semibold border-blue-500/30 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 gap-1"
              onClick={() =>
                setActionTarget({
                  trip: t,
                  actionType: 'depart',
                  title: 'Xác nhận tàu xuất bến',
                  description: `Xác nhận chuyến ${t.code} đã rời cảng để bắt đầu hải trình?`,
                })
              }
              title="Xác nhận xuất bến"
            >
              <Play size={12} /> Xuất bến
            </Button>
          )}

          {t.status === 'started' && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-[11px] font-semibold border-purple-500/30 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 gap-1"
              onClick={() =>
                setActionTarget({
                  trip: t,
                  actionType: 'complete',
                  title: 'Xác nhận chuyến tàu hoàn thành',
                  description: `Xác nhận chuyến ${t.code} đã cập bến an toàn và hoàn tất chuyến đi?`,
                })
              }
              title="Hoàn tất chuyến"
            >
              <CheckCheck size={12} /> Hoàn tất
            </Button>
          )}

          {/* Edit / Detail */}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 dark:text-blue-400" asChild>
            <Link to={'/trips/$tripId/edit' as any} params={{ tripId: t.id } as any} title="Chỉnh sửa / Đổi tàu / Đổi giờ">
              <Edit size={15} />
            </Link>
          </Button>

          {/* Cancel or Delete */}
          {t.status !== 'completed' && t.status !== 'cancelled' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-rose-600 hover:text-rose-700 dark:text-rose-400"
              onClick={() => {
                if (t.status === 'draft') {
                  setActionTarget({
                    trip: t,
                    actionType: 'delete',
                    title: 'Xóa chuyến tàu nháp',
                    description: `Bạn có chắc muốn xóa chuyến nháp ${t.code}?`,
                  });
                } else {
                  setActionTarget({
                    trip: t,
                    actionType: 'cancel',
                    title: 'Hủy chuyến tàu',
                    description: `Cảnh báo: Hủy chuyến ${t.code} sẽ cấp quyền đổi vé cho các khách hàng đã đặt! Bạn có chắc chắn muốn hủy?`,
                  });
                }
              }}
              title={t.status === 'draft' ? 'Xóa chuyến' : 'Hủy chuyến'}
            >
              {t.status === 'draft' ? <Trash2 size={15} /> : <Ban size={15} />}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <AdminTablePage
        title="Quản lý chuyến tàu thực tế"
        subtitle="Danh sách các chuyến tàu thực tế khởi hành trong ngày, kiểm soát trạng thái bán vé và điều hành chuyến Superdong"
        icon={Ship}
        apiError={apiError}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm theo mã chuyến (TRIP-...), tuyến hoặc tàu..."
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        filterOptions={statusOptions}
        columns={columns}
        columnStorageKey="superdong_trips_visible_columns"
        onRefresh={fetchTripsData}
        refreshing={loading}
        createLink="/trips/create"
        createLabel="Mở Chuyến Mới"
        data={filteredTrips}
        loading={loading}
        emptyText="Chưa có chuyến tàu nào phù hợp với bộ lọc."
        keyExtractor={(t) => String(t.id)}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      {/* Confirmation Modal for Status Actions */}
      <ConfirmModal
        open={!!actionTarget}
        onOpenChange={(open) => {
          if (!open) setActionTarget(null);
        }}
        title={actionTarget?.title || 'Xác nhận thao tác'}
        description={actionTarget?.description || ''}
        confirmLabel={
          isProcessingAction
            ? 'Đang xử lý...'
            : actionTarget?.actionType === 'cancel' || actionTarget?.actionType === 'delete'
              ? 'Xác nhận hủy/xóa'
              : 'Xác nhận thực hiện'
        }
        loading={isProcessingAction}
        variant={actionTarget?.actionType === 'cancel' || actionTarget?.actionType === 'delete' ? 'destructive' : 'default'}
        onConfirm={handleExecuteStatusAction}
      />
    </>
  );
}
