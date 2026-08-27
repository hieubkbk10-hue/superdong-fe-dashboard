import { UnsavedChangesBar } from '@/components/common/UnsavedChangesBar';
import { useFormDirty } from '@/components/common/FormUtilities';
import React, { useState, useEffect } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { Ship, ArrowLeft, Save, RotateCcw, Clock, Calendar, Phone, CheckCircle2, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { createTrip, getSchedules } from '@/apis/trips';
import { getRoutes } from '@/apis/journeys';
import { getBoats } from '@/apis/boats';
import { Boat, Route as JourneyRoute, Schedule, TripStatus } from '@/types';

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

interface TripCreateFormData {
  createMode: 'schedule' | 'manual';
  selectedScheduleId: string;
  selectedRouteId: string;
  selectedBoatId: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  status: TripStatus;
  shuttlePhone: string;
}

const emptyForm: TripCreateFormData = {
  createMode: 'manual',
  selectedScheduleId: '',
  selectedRouteId: '',
  selectedBoatId: '',
  departureDate: getTodayDateTime().date,
  departureTime: '08:00',
  arrivalDate: getTodayDateTime().date,
  arrivalTime: '10:30',
  status: 'selling',
  shuttlePhone: '',
};

function TripCreatePage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<TripCreateFormData>(emptyForm);

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [routes, setRoutes] = useState<JourneyRoute[]>([]);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialData] = useState(emptyForm);
  const { isDirty } = useFormDirty(initialData, formData);

  // Dynamic API Fetching
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
          if (!formData.selectedRouteId && routesRes.data.length > 0) {
            setFormData((prev) => ({ ...prev, selectedRouteId: String(routesRes.data[0].id) }));
          }
        }
        if (boatsRes?.data && Array.isArray(boatsRes.data)) {
          setBoats(boatsRes.data);
          if (!formData.selectedBoatId && boatsRes.data.length > 0) {
            setFormData((prev) => ({ ...prev, selectedBoatId: String(boatsRes.data[0].id) }));
          }
        }
        if (schedulesRes?.data && Array.isArray(schedulesRes.data)) {
          setSchedules(schedulesRes.data);
          if (!formData.selectedScheduleId && schedulesRes.data.length > 0) {
            setFormData((prev) => ({ ...prev, selectedScheduleId: String(schedulesRes.data[0].id) }));
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

  const updateField = <K extends keyof TripCreateFormData>(field: K, value: TripCreateFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleClearData = () => {
    const today = getTodayDateTime();
    setFormData({
      ...emptyForm,
      departureDate: today.date,
      arrivalDate: today.date,
      selectedRouteId: routes.length > 0 ? String(routes[0].id) : '',
      selectedBoatId: boats.length > 0 ? String(boats[0].id) : '',
      selectedScheduleId: schedules.length > 0 ? String(schedules[0].id) : '',
    });
    toast.success('Đã làm sạch dữ liệu form tạo chuyến');
  };

  const handleScheduleChange = (schId: string) => {
    const found = schedules.find((s) => String(s.id) === schId);
    setFormData((prev) => ({
      ...prev,
      selectedScheduleId: schId,
      selectedRouteId: found?.route_id ? String(found.route_id) : prev.selectedRouteId,
      selectedBoatId: found?.boat_id ? String(found.boat_id) : prev.selectedBoatId,
      departureTime: found?.start_time ? found.start_time.slice(0, 5) : prev.departureTime,
      arrivalTime: found?.end_time ? found.end_time.slice(0, 5) : prev.arrivalTime,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.createMode === 'manual' && (!formData.selectedRouteId || !formData.selectedBoatId)) {
      toast.error('Vui lòng chọn Tuyến hải trình và Tàu đảm nhận');
      return;
    }

    if (!formData.departureDate || !formData.departureTime || !formData.arrivalDate || !formData.arrivalTime) {
      toast.error('Vui lòng nhập đầy đủ ngày và giờ khởi hành / cập bến');
      return;
    }

    const startAt = `${formData.departureDate} ${formData.departureTime.length === 5 ? formData.departureTime + ':00' : formData.departureTime}`;
    const endAt = `${formData.arrivalDate} ${formData.arrivalTime.length === 5 ? formData.arrivalTime + ':00' : formData.arrivalTime}`;

    if (new Date(startAt) >= new Date(endAt)) {
      toast.error('Thời điểm khởi hành phải trước thời điểm cập bến');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (formData.createMode === 'schedule') {
        await createTrip({
          schedule_id: formData.selectedScheduleId,
          start_at: startAt,
          end_at: endAt,
          status: formData.status,
          reason: 'Khởi tạo chuyến từ lịch chạy cố định',
          shuttle_phone: formData.shuttlePhone.trim() || undefined,
        });
      } else {
        await createTrip({
          route_id: formData.selectedRouteId,
          boat_id: formData.selectedBoatId,
          start_at: startAt,
          end_at: endAt,
          status: formData.status,
          reason: 'Khởi tạo chuyến tàu vận hành mới từ dashboard',
          shuttle_phone: formData.shuttlePhone.trim() || undefined,
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
    <div className="space-y-6 w-full font-sans">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to={'/trips' as any}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Quay lại danh sách chuyến tàu"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Ship className="h-6 w-6 text-blue-600" />
              Khởi Tạo Chuyến Tàu Mới
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Thiết lập thông tin chuyến tàu thực tế, luồng tuyến và phân công tàu vận hành.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClearData}
          disabled={loadingData}
          className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer disabled:opacity-60"
        >
          <RotateCcw size={14} /> Làm sạch dữ liệu
        </button>
      </div>

      {/* Main Single Card Form */}
      <form onSubmit={handleSubmit} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
        {/* Section I */}
        <div className="px-5 py-3 bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200/60 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
          I. Hình thức & Tuyến hải trình
        </div>
        <div className="p-6 space-y-5">
          {/* Mode Selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Phương thức khởi tạo chuyến
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => updateField('createMode', 'manual')}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  formData.createMode === 'manual'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-600'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 shrink-0">
                  <Ship size={18} />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">Tạo chuyến tàu độc lập</div>
                  <div className="text-xs text-slate-500 mt-0.5">Tự chọn tuyến hải trình, tàu và khung giờ cụ thể</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => updateField('createMode', 'schedule')}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  formData.createMode === 'schedule'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-600'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 shrink-0">
                  <Layers size={18} />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">Theo lịch mẫu định kỳ</div>
                  <div className="text-xs text-slate-500 mt-0.5">Kế thừa tuyến, tàu và khung giờ cố định từ Lịch mẫu</div>
                </div>
              </button>
            </div>
          </div>

          {/* Schedule Mode */}
          {formData.createMode === 'schedule' ? (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Chọn Lịch Mẫu Cố Định <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.selectedScheduleId}
                onChange={(e) => handleScheduleChange(e.target.value)}
                disabled={loadingData}
                className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
              >
                {schedules.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name} (Khởi hành: {s.start_time?.slice(0, 5)} ➔ {s.end_time?.slice(0, 5)})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tuyến hải trình khai thác <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.selectedRouteId}
                  onChange={(e) => updateField('selectedRouteId', e.target.value)}
                  disabled={loadingData}
                  className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
                >
                  <option value="">-- Chọn tuyến hải trình --</option>
                  {routes.map((r) => (
                    <option key={r.id} value={String(r.id)}>
                      {r.name || r.code} {r.code ? `(${r.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tàu đảm nhận phục vụ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Ship size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={formData.selectedBoatId}
                    onChange={(e) => updateField('selectedBoatId', e.target.value)}
                    disabled={loadingData}
                    className="w-full h-10 pl-9 pr-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
                  >
                    <option value="">-- Chọn tàu phục vụ --</option>
                    {boats.map((b) => (
                      <option key={b.id} value={String(b.id)}>
                        {b.name} {b.code ? `(${b.code})` : ''} — {b.total_capacity || 300} chỗ
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section II */}
        <div className="px-5 py-3 bg-slate-100/70 dark:bg-slate-800/60 border-y border-slate-200/60 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
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
        <div className="px-5 py-3 bg-slate-100/70 dark:bg-slate-800/60 border-y border-slate-200/60 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
          III. Thiết lập vận hành & Liên hệ
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Trạng thái mở bán ban đầu <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => updateField('status', e.target.value as TripStatus)}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
            >
              <option value="selling">Đang mở bán (Bán vé ngay)</option>
              <option value="draft">Bản nháp (Chưa bán vé)</option>
              <option value="closed">Đã khóa sổ (Tạm khóa bán)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Hotline / Số điện thoại xe trung chuyển
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={formData.shuttlePhone}
                onChange={(e) => updateField('shuttlePhone', e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="VD: 0948066514 (Chỉ nhập chữ số)"
                maxLength={15}
                className="w-full h-10 pl-9 pr-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <Link
            to={'/trips' as any}
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
            {isSubmitting ? 'Đang khởi tạo...' : 'Khởi tạo chuyến tàu'}
          </button>
        </div>
      </form>

      <UnsavedChangesBar isDirty={isDirty} isSaving={isSubmitting} onSave={() => handleSubmit({ preventDefault: () => {} } as any)} onReset={() => setFormData(emptyForm)} message="Chuyến tàu chưa được tạo mới" />
    </div>
  );
}
