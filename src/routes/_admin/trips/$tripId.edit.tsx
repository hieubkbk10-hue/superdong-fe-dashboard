import React, { useState, useEffect } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import {
  Ship,
  ArrowLeft,
  Save,
  Calendar,
  Clock,
  Route as RouteIcon,
  RefreshCw,
  AlertTriangle,
  Play,
  Lock,
  Unlock,
  CheckCheck,
  Ban,
  Phone,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  findTrip,
  changeTripBoat,
  changeTripTime,
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

export const Route = createFileRoute('/_admin/trips/$tripId/edit')({
  component: TripEditPage,
});

function TripEditPage() {
  const { tripId } = Route.useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [routes, setRoutes] = useState<JourneyRoute[]>([]);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Editable fields
  const [selectedBoatId, setSelectedBoatId] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [changeReason, setChangeReason] = useState('Điều chỉnh thông tin chuyến tàu từ dashboard');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hydrateTrip = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const [tripRes, routesRes, boatsRes] = await Promise.all([
        findTrip(tripId).catch(() => null),
        getRoutes({ limit: 100 }),
        getBoats({ limit: 100 }),
      ]);

      if (routesRes?.data && Array.isArray(routesRes.data)) {
        setRoutes(routesRes.data);
      }
      if (boatsRes?.data && Array.isArray(boatsRes.data)) {
        setBoats(boatsRes.data);
      }

      let currentTripData: any = tripRes?.data;
      if (!currentTripData) {
        const cached = localStorage.getItem(`superdong_trip_cache_${tripId}`);
        if (cached) {
          try {
            currentTripData = JSON.parse(cached);
          } catch {}
        }
      }

      if (currentTripData) {
        setTrip(currentTripData);
        setSelectedBoatId(String(currentTripData.boat_id || currentTripData.boat?.id || ''));

        const startAtStr = String(currentTripData.start_at || currentTripData.departure_time || '');
        const endAtStr = String(currentTripData.end_at || currentTripData.arrival_time || '');

        if (startAtStr.includes('T') || startAtStr.includes(' ')) {
          const sep = startAtStr.includes('T') ? 'T' : ' ';
          const parts = startAtStr.split(sep);
          setDepartureDate(parts[0]);
          setDepartureTime(parts[1]?.slice(0, 5) || '08:00');
        } else {
          setDepartureDate(new Date().toISOString().split('T')[0]);
          setDepartureTime('08:00');
        }

        if (endAtStr.includes('T') || endAtStr.includes(' ')) {
          const sep = endAtStr.includes('T') ? 'T' : ' ';
          const parts = endAtStr.split(sep);
          setArrivalDate(parts[0]);
          setArrivalTime(parts[1]?.slice(0, 5) || '10:30');
        } else {
          setArrivalDate(departureDate || new Date().toISOString().split('T')[0]);
          setArrivalTime('10:30');
        }
      } else {
        setApiError('Không tìm thấy thông tin chuyến tàu này.');
      }
    } catch (err: any) {
      console.error('Hydrate trip error:', err);
      setApiError(err?.message || 'Không thể tải thông tin chuyến tàu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    hydrateTrip();
  }, [tripId]);

  // Handle Save / Change Boat & Time
  const handleSaveDisruption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip) return;

    if (!departureDate || !departureTime || !arrivalDate || !arrivalTime) {
      toast.error('Vui lòng chọn đầy đủ ngày giờ xuất bến và cập bến');
      return;
    }

    const newStartAt = `${departureDate} ${departureTime.length === 5 ? departureTime + ':00' : departureTime}`;
    const newEndAt = `${arrivalDate} ${arrivalTime.length === 5 ? arrivalTime + ':00' : arrivalTime}`;

    if (new Date(newStartAt) >= new Date(newEndAt)) {
      toast.error('Giờ khởi hành phải trước giờ cập bến');
      return;
    }

    setIsSubmitting(true);
    const expectedVersion = typeof trip.version === 'number' ? trip.version : 1;

    try {
      // 1. Change Boat if boat changed
      const initialBoatId = String(trip.boat_id || trip.boat?.id || '');
      if (selectedBoatId && selectedBoatId !== initialBoatId) {
        await changeTripBoat(tripId, {
          boat_id: selectedBoatId,
          expected_version: expectedVersion,
          reason: changeReason.trim() || 'Điều động đổi tàu phục vụ chuyến',
        });
        toast.success('Đã cập nhật đổi tàu thành công và đồng bộ sơ đồ ghế mới!');
      }

      // 2. Change Time
      await changeTripTime(tripId, {
        start_at: newStartAt,
        end_at: newEndAt,
        expected_version: expectedVersion,
        reason: changeReason.trim() || 'Điều chỉnh giờ khởi hành/cập bến',
      });
      toast.success('Đã cập nhật giờ chạy chuyến tàu thành công!');

      await hydrateTrip();
    } catch (err: any) {
      console.error('Update trip disruption error:', err);
      const msg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi cập nhật chuyến';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status Action Handler
  const handleStatusChange = async (action: 'open' | 'close' | 'depart' | 'complete' | 'cancel') => {
    if (!trip) return;
    setIsSubmitting(true);
    const expectedVersion = typeof trip.version === 'number' ? trip.version : 1;

    try {
      if (action === 'open') {
        await openTripForSale(tripId, { expected_version: expectedVersion, reason: changeReason });
        toast.success('Đã mở bán vé cho chuyến tàu!');
      } else if (action === 'close') {
        await closeTripForSale(tripId, { expected_version: expectedVersion, reason: changeReason });
        toast.success('Đã khóa sổ bán vé cho chuyến tàu!');
      } else if (action === 'depart') {
        await markTripDeparted(tripId, { expected_version: expectedVersion, reason: changeReason });
        toast.success('Đã xác nhận chuyến tàu xuất bến!');
      } else if (action === 'complete') {
        await completeTrip(tripId, { expected_version: expectedVersion, reason: changeReason });
        toast.success('Đã xác nhận chuyến tàu hoàn tất hải trình!');
      } else if (action === 'cancel') {
        await cancelTrip(tripId, { expected_version: expectedVersion, reason: changeReason });
        toast.success('Đã hủy chuyến tàu!');
      }
      await hydrateTrip();
    } catch (err: any) {
      console.error('Status change error:', err);
      const msg = err?.response?.data?.message || err?.message || 'Lỗi thao tác trạng thái';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 font-sans">
        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
        Đang tải thông tin chi tiết chuyến tàu {tripId}...
      </div>
    );
  }

  const routeName =
    trip?.route?.name ||
    routes.find((r) => String(r.id) === String(trip?.route_id))?.name ||
    'Tuyến hải trình';

  const currentStatus = trip?.status || 'draft';

  return (
    <div className="space-y-6 max-w-4xl font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={'/trips' as any}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Quay lại danh sách chuyến"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Ship className="h-6 w-6 text-blue-600" />
              Điều Hành & Chỉnh Sửa Chuyến Tàu
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Mã chuyến: <span className="font-mono font-bold text-blue-600">TRIP-{String(tripId).slice(0, 6).toUpperCase()}</span> | ID: <span className="font-mono">{tripId}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={hydrateTrip}
          className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer"
          title="Làm mới dữ liệu"
        >
          <RotateCcw size={15} />
        </button>
      </div>

      {apiError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>{apiError}</span>
        </div>
      )}

      {/* Quick Status Control Panel */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Trạng thái hiện tại:</span>
          <span className="font-bold text-xs px-2.5 py-1 rounded-full uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            {currentStatus}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentStatus !== 'selling' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('open')}
              disabled={isSubmitting}
              className="text-xs border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 gap-1.5"
            >
              <Unlock size={13} /> Mở bán vé
            </Button>
          )}

          {currentStatus === 'selling' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('close')}
              disabled={isSubmitting}
              className="text-xs border-amber-500/30 text-amber-600 hover:bg-amber-50 gap-1.5"
            >
              <Lock size={13} /> Khóa bán vé
            </Button>
          )}

          {currentStatus !== 'started' && currentStatus !== 'completed' && currentStatus !== 'cancelled' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('depart')}
              disabled={isSubmitting}
              className="text-xs border-blue-500/30 text-blue-600 hover:bg-blue-50 gap-1.5"
            >
              <Play size={13} /> Xuất bến
            </Button>
          )}

          {currentStatus === 'started' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('complete')}
              disabled={isSubmitting}
              className="text-xs border-purple-500/30 text-purple-600 hover:bg-purple-50 gap-1.5"
            >
              <CheckCheck size={13} /> Cập bến hoàn tất
            </Button>
          )}

          {currentStatus !== 'completed' && currentStatus !== 'cancelled' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('cancel')}
              disabled={isSubmitting}
              className="text-xs border-rose-500/30 text-rose-600 hover:bg-rose-50 gap-1.5"
            >
              <Ban size={13} /> Hủy chuyến
            </Button>
          )}
        </div>
      </div>

      {/* Main Operational Edit Form */}
      <form
        onSubmit={handleSaveDisruption}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Tuyến Hải Trình (Cố định của chuyến)
            </label>
            <input
              type="text"
              value={routeName}
              disabled
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-sm font-semibold cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Tàu Đảm Nhận Phục Vụ (Hỗ trợ Điều Động Đổi Tàu) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Ship size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={selectedBoatId}
                onChange={(e) => setSelectedBoatId(e.target.value)}
                className="w-full h-10 pl-9 pr-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
              >
                {boats.map((b) => (
                  <option key={b.id} value={String(b.id)}>
                    {b.name} {b.code ? `(${b.code})` : ''} - {b.total_capacity || 300} chỗ
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Ngày & Giờ Khởi Hành Mới <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:border-blue-500 outline-none"
                required
              />
              <input
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:border-blue-500 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Ngày & Giờ Cập Bến Mới <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
                className="h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:border-blue-500 outline-none"
                required
              />
              <input
                type="time"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                className="h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:border-blue-500 outline-none"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Lý Do Điều Chỉnh (Bắt buộc theo chuẩn Backend Audit Trail) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={changeReason}
            onChange={(e) => setChangeReason(e.target.value)}
            placeholder="Nhập lý do điều động / đổi giờ..."
            className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
            required
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Link
            to={'/trips' as any}
            className="h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold flex items-center transition-colors"
          >
            Quay Lại
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Save size={16} />
            {isSubmitting ? 'Đang lưu thay đổi...' : 'Lưu Thay Đổi Chuyến Tàu'}
          </Button>
        </div>
      </form>
    </div>
  );
}
