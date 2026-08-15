import React, { useState, useEffect } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import {
  Ship,
  ArrowLeft,
  Save,
  RefreshCw,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  Play,
  CheckCheck,
  Ban,
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
import { getBoats } from '@/apis/boats';
import { getRoutes } from '@/apis/journeys';
import { Boat, Route as JourneyRoute, Trip, TripStatus } from '@/types';
import { Button } from '@/components/common/Button';

export const Route = createFileRoute('/_admin/trips/$tripId/edit')({
  component: TripEditPage,
});

interface TripEditFormData {
  selectedBoatId: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
}

const emptyForm: TripEditFormData = {
  selectedBoatId: '',
  departureDate: '',
  departureTime: '08:00',
  arrivalDate: '',
  arrivalTime: '10:30',
};

const STATUS_LABELS: Record<string, { label: string; badgeClass: string }> = {
  draft: {
    label: 'Bản nháp',
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  },
  selling: {
    label: 'Đang mở bán',
    badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  },
  closed: {
    label: 'Đã khóa sổ',
    badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  },
  started: {
    label: 'Đã xuất bến',
    badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  },
  completed: {
    label: 'Hoàn thành',
    badgeClass: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  },
  cancelled: {
    label: 'Đã hủy',
    badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  },
};

function TripEditPage() {
  const { tripId } = Route.useParams();
  const draftKey = `superdong_trip_draft_edit_${tripId}`;
  const cacheKey = `superdong_trip_cache_${tripId}`;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [routes, setRoutes] = useState<JourneyRoute[]>([]);
  const [formData, setFormData] = useState<TripEditFormData>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hydrateTrip = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const [tripRes, boatsRes, routesRes] = await Promise.all([
        findTrip(tripId),
        getBoats({ limit: 100 }).catch(() => null),
        getRoutes({ limit: 100 }).catch(() => null),
      ]);

      const t = tripRes?.data || tripRes;
      if (!t) {
        throw new Error('Không tìm thấy thông tin chuyến tàu');
      }

      setTrip(t);
      if (boatsRes?.data && Array.isArray(boatsRes.data)) setBoats(boatsRes.data);
      if (routesRes?.data && Array.isArray(routesRes.data)) setRoutes(routesRes.data);

      const startRaw = t.start_at || t.departure_time || '';
      const endRaw = t.end_at || t.arrival_time || '';

      const sParts = startRaw.includes('T') ? startRaw.split('T') : startRaw.split(' ');
      const eParts = endRaw.includes('T') ? endRaw.split('T') : endRaw.split(' ');

      const serverForm: TripEditFormData = {
        selectedBoatId: String(t.boat_id || t.boat?.id || ''),
        departureDate: sParts[0] || '',
        departureTime: sParts[1] ? sParts[1].slice(0, 5) : '08:00',
        arrivalDate: eParts[0] || sParts[0] || '',
        arrivalTime: eParts[1] ? eParts[1].slice(0, 5) : '10:30',
      };

      let nextForm = serverForm;
      try {
        const draft = JSON.parse(localStorage.getItem(draftKey) || 'null');
        if (draft) nextForm = { ...serverForm, ...draft };
      } catch {}

      setFormData(nextForm);
      localStorage.setItem(cacheKey, JSON.stringify({ id: String(tripId), ...serverForm }));
    } catch (err: any) {
      console.error('Fetch trip error:', err);
      const msg = err?.response?.data?.message || err?.message || 'Không thể tải thông tin chuyến tàu';
      setApiError(msg);
      toast.error(`Không thể tải dữ liệu chuyến tàu. ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    hydrateTrip();
  }, [tripId]);

  // Save draft
  useEffect(() => {
    if (!loading && !apiError) {
      try {
        localStorage.setItem(draftKey, JSON.stringify(formData));
      } catch {}
    }
  }, [formData, loading, apiError, draftKey]);

  const updateField = <K extends keyof TripEditFormData>(field: K, value: TripEditFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveDisruption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip || isSubmitting) return;

    if (!formData.departureDate || !formData.departureTime || !formData.arrivalDate || !formData.arrivalTime) {
      toast.error('Vui lòng nhập đầy đủ ngày và giờ khởi hành / cập bến');
      return;
    }

    const newStartAt = `${formData.departureDate} ${formData.departureTime.length === 5 ? formData.departureTime + ':00' : formData.departureTime}`;
    const newEndAt = `${formData.arrivalDate} ${formData.arrivalTime.length === 5 ? formData.arrivalTime + ':00' : formData.arrivalTime}`;

    if (new Date(newStartAt) >= new Date(newEndAt)) {
      toast.error('Thời điểm khởi hành phải trước thời điểm cập bến');
      return;
    }

    setIsSubmitting(true);
    const expectedVersion = typeof trip.version === 'number' ? trip.version : 1;

    try {
      // 1. Change Boat if boat changed
      const initialBoatId = String(trip.boat_id || trip.boat?.id || '');
      if (formData.selectedBoatId && formData.selectedBoatId !== initialBoatId) {
        await changeTripBoat(tripId, {
          boat_id: formData.selectedBoatId,
          expected_version: expectedVersion,
          reason: 'Điều động đổi tàu phục vụ chuyến',
        });
        toast.success('Đã cập nhật đổi tàu thành công và đồng bộ sơ đồ ghế mới!');
      }

      // 2. Change Time
      await changeTripTime(tripId, {
        start_at: newStartAt,
        end_at: newEndAt,
        expected_version: expectedVersion,
        reason: 'Điều chỉnh giờ khởi hành/cập bến từ dashboard',
      });
      toast.success('Đã cập nhật giờ chạy chuyến tàu thành công!');

      localStorage.removeItem(draftKey);
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
    if (!trip || isSubmitting) return;
    setIsSubmitting(true);
    const expectedVersion = typeof trip.version === 'number' ? trip.version : 1;

    try {
      if (action === 'open') {
        await openTripForSale(tripId, { expected_version: expectedVersion, reason: 'Mở bán vé chuyến từ dashboard' });
        toast.success('Đã mở bán vé cho chuyến tàu!');
      } else if (action === 'close') {
        await closeTripForSale(tripId, { expected_version: expectedVersion, reason: 'Khóa bán vé chuyến từ dashboard' });
        toast.success('Đã khóa sổ bán vé cho chuyến tàu!');
      } else if (action === 'depart') {
        await markTripDeparted(tripId, { expected_version: expectedVersion, reason: 'Xác nhận xuất bến từ dashboard' });
        toast.success('Đã xác nhận chuyến tàu xuất bến!');
      } else if (action === 'complete') {
        await completeTrip(tripId, { expected_version: expectedVersion, reason: 'Xác nhận hoàn tất hành trình từ dashboard' });
        toast.success('Đã xác nhận chuyến tàu hoàn tất hải trình!');
      } else if (action === 'cancel') {
        await cancelTrip(tripId, { expected_version: expectedVersion, reason: 'Hủy chuyến tàu từ dashboard' });
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

  const routeName =
    trip?.route?.name ||
    routes.find((r) => String(r.id) === String(trip?.route_id))?.name ||
    'Tuyến hải trình';

  const currentStatus = trip?.status || 'draft';
  const statusInfo = STATUS_LABELS[currentStatus] || STATUS_LABELS.draft;
  const tripDisplayCode = `TRIP-${String(tripId).slice(0, 6).toUpperCase()}`;

  return (
    <div className="space-y-6 w-full font-sans">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to={'/trips' as any}
            onClick={() => localStorage.removeItem(draftKey)}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Quay lại danh sách chuyến"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Ship className="h-6 w-6 text-blue-600" />
                Chỉnh Sửa & Điều Hành Chuyến Tàu
              </h1>
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusInfo.badgeClass}`}>
                {statusInfo.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cập nhật thông tin vận hành, điều động đổi tàu và điều chỉnh giờ khởi hành.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={hydrateTrip}
          disabled={loading}
          className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer disabled:opacity-60"
          title="Làm mới dữ liệu"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {apiError && !loading ? (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium flex items-start gap-2.5">
          <AlertTriangle size={18} className="shrink-0 text-rose-500" />
          <span>Không tải được thông tin chuyến tàu. {apiError}</span>
        </div>
      ) : (
        <form
          onSubmit={handleSaveDisruption}
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden"
        >
          {/* Section I */}
          <div className="px-5 py-3 bg-[#EBF7FA] border-b border-cyan-100 text-sm font-bold text-slate-800 uppercase flex items-center justify-between">
            <span>I. Thông tin chuyến tàu & Phân công tàu</span>
            <span className="text-xs font-mono font-normal text-slate-500 lowercase">
              Mã: {tripDisplayCode}
            </span>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tuyến hải trình (Cố định)
              </label>
              <input
                type="text"
                value={routeName}
                disabled
                className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-sm font-semibold cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tàu đảm nhận phục vụ (Điều động đổi tàu) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Ship size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={formData.selectedBoatId}
                  onChange={(e) => updateField('selectedBoatId', e.target.value)}
                  disabled={loading}
                  className="w-full h-10 pl-9 pr-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none disabled:opacity-60"
                >
                  {boats.map((b) => (
                    <option key={b.id} value={String(b.id)}>
                      {b.name} {b.code ? `(${b.code})` : ''} — {b.total_capacity || 300} chỗ
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section II */}
          <div className="px-5 py-3 bg-[#EBF7FA] border-y border-cyan-100 text-sm font-bold text-slate-800 uppercase">
            II. Lịch trình khởi hành & Cập bến
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Ngày & Giờ khởi hành xuất bến <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={formData.departureDate}
                  onChange={(e) => updateField('departureDate', e.target.value)}
                  className="h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:border-blue-500 outline-none"
                  required
                />
                <input
                  type="time"
                  value={formData.departureTime}
                  onChange={(e) => updateField('departureTime', e.target.value)}
                  className="h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:border-blue-500 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Ngày & Giờ cập bến dự kiến <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={formData.arrivalDate}
                  onChange={(e) => updateField('arrivalDate', e.target.value)}
                  className="h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:border-blue-500 outline-none"
                  required
                />
                <input
                  type="time"
                  value={formData.arrivalTime}
                  onChange={(e) => updateField('arrivalTime', e.target.value)}
                  className="h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:border-blue-500 outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section III */}
          <div className="px-5 py-3 bg-[#EBF7FA] border-y border-cyan-100 text-sm font-bold text-slate-800 uppercase">
            III. Điều hành trạng thái vận hành
          </div>
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-2.5">
              {currentStatus !== 'selling' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('open')}
                  disabled={isSubmitting}
                  className="text-xs border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 gap-1.5"
                >
                  <Unlock size={14} /> Mở bán vé
                </Button>
              )}

              {currentStatus === 'selling' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('close')}
                  disabled={isSubmitting}
                  className="text-xs border-amber-500/30 text-amber-600 hover:bg-amber-50 gap-1.5"
                >
                  <Lock size={14} /> Khóa bán vé
                </Button>
              )}

              {currentStatus !== 'started' && currentStatus !== 'completed' && currentStatus !== 'cancelled' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('depart')}
                  disabled={isSubmitting}
                  className="text-xs border-blue-500/30 text-blue-600 hover:bg-blue-50 gap-1.5"
                >
                  <Play size={14} /> Xuất bến
                </Button>
              )}

              {currentStatus === 'started' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('complete')}
                  disabled={isSubmitting}
                  className="text-xs border-purple-500/30 text-purple-600 hover:bg-purple-50 gap-1.5"
                >
                  <CheckCheck size={14} /> Cập bến hoàn tất
                </Button>
              )}

              {currentStatus !== 'completed' && currentStatus !== 'cancelled' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('cancel')}
                  disabled={isSubmitting}
                  className="text-xs border-rose-500/30 text-rose-600 hover:bg-rose-50 gap-1.5"
                >
                  <Ban size={14} /> Hủy chuyến
                </Button>
              )}
            </div>
          </div>

          {/* Form Action Bar */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Link
              to={'/trips' as any}
              onClick={() => localStorage.removeItem(draftKey)}
              className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Hủy bỏ
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Save size={16} />
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
