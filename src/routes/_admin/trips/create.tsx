import React, { useState, useEffect } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { Ship, ArrowLeft, Save, Calendar, Clock, Route as RouteIcon, Phone, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { createTrip, getSchedules } from '@/apis/trips';
import { getRoutes } from '@/apis/journeys';
import { getBoats } from '@/apis/boats';
import { Boat, Route as JourneyRoute, Schedule, TripStatus } from '@/types';
import { Button } from '@/components/common/Button';

export const Route = createFileRoute('/_admin/trips/create')({
  component: TripCreatePage,
});

function getTodayDateTime() {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  return {
    date: dateStr,
    startTime: '08:00',
    endTime: '10:30',
  };
}

function TripCreatePage() {
  const navigate = useNavigate();
  const init = getTodayDateTime();

  const [createMode, setCreateMode] = useState<'schedule' | 'manual'>('manual');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [routes, setRoutes] = useState<JourneyRoute[]>([]);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form Fields
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [selectedBoatId, setSelectedBoatId] = useState('');
  const [departureDate, setDepartureDate] = useState(init.date);
  const [departureTime, setDepartureTime] = useState(init.startTime);
  const [arrivalDate, setArrivalDate] = useState(init.date);
  const [arrivalTime, setArrivalTime] = useState(init.endTime);
  const [status, setStatus] = useState<TripStatus>('selling');
  const [reason, setReason] = useState('Khởi tạo chuyến tàu vận tải hành khách từ Dashboard');
  const [shuttlePhone, setShuttlePhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [routesRes, boatsRes, schedulesRes] = await Promise.all([
          getRoutes({ limit: 100 }),
          getBoats({ limit: 100 }),
          getSchedules({ limit: 100 }),
        ]);

        if (routesRes?.data && Array.isArray(routesRes.data)) {
          setRoutes(routesRes.data);
          if (routesRes.data.length > 0) {
            setSelectedRouteId(String(routesRes.data[0].id));
          }
        }
        if (boatsRes?.data && Array.isArray(boatsRes.data)) {
          setBoats(boatsRes.data);
          if (boatsRes.data.length > 0) {
            setSelectedBoatId(String(boatsRes.data[0].id));
          }
        }
        if (schedulesRes?.data && Array.isArray(schedulesRes.data)) {
          setSchedules(schedulesRes.data);
          if (schedulesRes.data.length > 0) {
            setSelectedScheduleId(String(schedulesRes.data[0].id));
          }
        }
      } catch (err) {
        console.error('Failed to load metadata for trip creation:', err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  // When Schedule is selected, auto-fill route and boat
  const handleScheduleChange = (schId: string) => {
    setSelectedScheduleId(schId);
    const found = schedules.find((s) => String(s.id) === schId);
    if (found) {
      if (found.route_id) setSelectedRouteId(String(found.route_id));
      if (found.boat_id) setSelectedBoatId(String(found.boat_id));
      if (found.start_time) setDepartureTime(found.start_time.slice(0, 5));
      if (found.end_time) setArrivalTime(found.end_time.slice(0, 5));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (createMode === 'manual' && (!selectedRouteId || !selectedBoatId)) {
      toast.error('Vui lòng chọn Tuyến hải trình và Tàu đảm nhận');
      return;
    }

    if (!departureDate || !departureTime || !arrivalDate || !arrivalTime) {
      toast.error('Vui lòng nhập đầy đủ ngày và giờ khởi hành / cập bến');
      return;
    }

    const startAt = `${departureDate} ${departureTime.length === 5 ? departureTime + ':00' : departureTime}`;
    const endAt = `${arrivalDate} ${arrivalTime.length === 5 ? arrivalTime + ':00' : arrivalTime}`;

    if (new Date(startAt) >= new Date(endAt)) {
      toast.error('Thời điểm khởi hành phải trước thời điểm cập bến');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (createMode === 'schedule') {
        await createTrip({
          schedule_id: selectedScheduleId,
          start_at: startAt,
          end_at: endAt,
          status,
          reason: reason.trim() || 'Tạo chuyến từ lịch chạy cố định',
          shuttle_phone: shuttlePhone.trim() || undefined,
        });
      } else {
        await createTrip({
          route_id: selectedRouteId,
          boat_id: selectedBoatId,
          start_at: startAt,
          end_at: endAt,
          status,
          reason: reason.trim() || 'Tạo chuyến vận tải mới',
          shuttle_phone: shuttlePhone.trim() || undefined,
        });
      }

      toast.success('Đã khởi tạo chuyến tàu mới thành công! Kho ghế đã được tự động kích hoạt.');
      navigate({ to: '/trips' as any });
    } catch (err: any) {
      console.error('Create trip error:', err);
      const serverMsg = err?.response?.data?.message || err?.message || '';
      toast.error(serverMsg || 'Lỗi: Không thể tạo chuyến tàu mới trên Backend Server');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl font-sans">
      {/* Page Header */}
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
              Mở Chuyến Tàu Thực Tế Mới
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Khởi tạo chuyến tàu vận tải hành khách thực tế để bắt đầu mở bán vé trên hệ thống
            </p>
          </div>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="flex rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900 p-1">
        <button
          type="button"
          onClick={() => setCreateMode('manual')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            createMode === 'manual'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Mode 1: Tạo Chuyến Thủ Công (Tùy chọn Tuyến & Tàu)
        </button>
        <button
          type="button"
          onClick={() => setCreateMode('schedule')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            createMode === 'schedule'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Mode 2: Kế Thừa Từ Lịch Chạy Định Kỳ (Schedule)
        </button>
      </div>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6"
      >
        {createMode === 'schedule' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Chọn Lịch Chạy Định Kỳ Mẫu <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedScheduleId}
              onChange={(e) => handleScheduleChange(e.target.value)}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
            >
              {schedules.map((sch) => (
                <option key={sch.id} value={String(sch.id)}>
                  {sch.name || `SCH-${sch.id}`} ({sch.start_time?.slice(0, 5)} - {sch.end_time?.slice(0, 5)})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Tuyến Hải Trình <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <RouteIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={selectedRouteId}
                onChange={(e) => setSelectedRouteId(e.target.value)}
                disabled={createMode === 'schedule'}
                className="w-full h-10 pl-9 pr-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none disabled:opacity-60"
              >
                {routes.map((r) => (
                  <option key={r.id} value={String(r.id)}>
                    {r.name || r.code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Tàu Phân Công Khai Thác <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Ship size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={selectedBoatId}
                onChange={(e) => setSelectedBoatId(e.target.value)}
                disabled={createMode === 'schedule'}
                className="w-full h-10 pl-9 pr-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none disabled:opacity-60"
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
              Ngày Khởi Hành & Giờ Xuất Bến <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={departureDate}
                onChange={(e) => {
                  setDepartureDate(e.target.value);
                  setArrivalDate(e.target.value);
                }}
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
              Ngày & Giờ Cập Bến Dự Kiến <span className="text-red-500">*</span>
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

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Trạng Thái Mở Bán
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
            >
              <option value="selling">Đang mở bán vé (selling)</option>
              <option value="draft">Lưu bản nháp (draft)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Số Điện Thoại Xe Đưa Đón (Tùy chọn)
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={shuttlePhone}
                onChange={(e) => setShuttlePhone(e.target.value)}
                placeholder="VD: 0297.3877.742"
                className="w-full h-10 pl-9 pr-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Lý Do Khởi Tạo Chuyến (Audit Trail) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Nhập lý do tạo chuyến..."
            className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
            required
          />
        </div>

        <div className="bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 p-3.5 rounded-xl flex items-start gap-2.5 text-xs">
          <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
          <span>Hệ thống Backend sẽ tự động gắn sơ đồ ghế active của con tàu được chọn và khởi tạo toàn bộ kho ghế trống (Trip Seat Inventory) để sẵn sàng mở bán ngay lập tức.</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Link
            to={'/trips' as any}
            className="h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold flex items-center transition-colors"
          >
            Hủy Bỏ
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting || loadingData}
            className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Save size={16} />
            {isSubmitting ? 'Đang khởi tạo chuyến...' : 'Xác Nhận Mở Chuyến Tàu'}
          </Button>
        </div>
      </form>
    </div>
  );
}
