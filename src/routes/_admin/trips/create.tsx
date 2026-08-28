import React, { useState, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Ship, Layers, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { createTrip, getSchedules } from '@/apis/trips';
import { getRoutes } from '@/apis/journeys';
import { getBoats } from '@/apis/boats';
import { Boat, Route as JourneyRoute, Schedule, TripStatus } from '@/types';
import {
  AdminFormHeader,
  AdminFormCard,
  FormSectionBlock,
  FormField,
  FormInputField,
  FormSelectField,
  AdminFormActionBar,
  useFormDirty,
} from '@/components/common/FormUtilities';

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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

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
    <div className="space-y-4 w-full font-sans pb-20 text-slate-800 dark:text-slate-200">
      {/* Top Header Navigation Bar */}
      <AdminFormHeader
        icon={Ship}
        title="Khởi Tạo Chuyến Tàu Mới"
        subtitle="Thiết lập thông tin chuyến tàu thực tế, luồng tuyến và phân công tàu vận hành"
        backTo="/trips"
        onClear={handleClearData}
        clearLabel="Làm sạch"
      />

      {/* Main Single Card Form */}
      <AdminFormCard onSubmit={handleSubmit}>
        {/* Section I: Phương thức & Tuyến hải trình */}
        <FormSectionBlock title="I. Hình thức & Tuyến hải trình" columns={1}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
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
                  <div className="font-bold text-xs text-slate-900 dark:text-white">Tạo chuyến tàu độc lập</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Tự chọn tuyến hải trình, tàu và khung giờ cụ thể</div>
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
                  <div className="font-bold text-xs text-slate-900 dark:text-white">Theo lịch mẫu định kỳ</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Kế thừa tuyến, tàu và khung giờ cố định từ Lịch mẫu</div>
                </div>
              </button>
            </div>
          </div>

          {/* Schedule or Manual selector */}
          {formData.createMode === 'schedule' ? (
            <FormSelectField
              id="trip-schedule"
              label="Chọn Lịch Mẫu Cố Định"
              required
              value={formData.selectedScheduleId}
              onChange={(e) => handleScheduleChange(e.target.value)}
              disabled={loadingData}
            >
              {schedules.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name} (Khởi hành: {s.start_time?.slice(0, 5)} ➔ {s.end_time?.slice(0, 5)})
                </option>
              ))}
            </FormSelectField>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormSelectField
                id="trip-route"
                label="Tuyến Hải Trình Khai Thác"
                required
                value={formData.selectedRouteId}
                onChange={(e) => updateField('selectedRouteId', e.target.value)}
                disabled={loadingData}
              >
                <option value="">-- Chọn tuyến hải trình --</option>
                {routes.map((r) => (
                  <option key={r.id} value={String(r.id)}>
                    {r.name || r.code} {r.code ? `(${r.code})` : ''}
                  </option>
                ))}
              </FormSelectField>

              <FormSelectField
                id="trip-boat"
                label="Tàu Đảm Nhận Phục Vụ"
                required
                value={formData.selectedBoatId}
                onChange={(e) => updateField('selectedBoatId', e.target.value)}
                disabled={loadingData}
              >
                <option value="">-- Chọn tàu phục vụ --</option>
                {boats.map((b) => (
                  <option key={b.id} value={String(b.id)}>
                    {b.name} {b.code ? `(${b.code})` : ''} — {b.total_capacity || 300} chỗ
                  </option>
                ))}
              </FormSelectField>
            </div>
          )}
        </FormSectionBlock>

        {/* Section II: Lịch trình khởi hành & Cập bến */}
        <FormSectionBlock title="II. Lịch trình khởi hành & Cập bến" columns={2}>
          <FormField id="departure-datetime" label="Ngày & Giờ khởi hành xuất bến" required>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={formData.departureDate}
                onChange={(e) => updateField('departureDate', e.target.value)}
                className="w-full h-9 text-xs px-3 rounded-lg border bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 focus:border-blue-600 outline-none font-mono"
                required
              />
              <input
                type="time"
                value={formData.departureTime}
                onChange={(e) => updateField('departureTime', e.target.value)}
                className="w-full h-9 text-xs px-3 rounded-lg border bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 focus:border-blue-600 outline-none font-mono"
                required
              />
            </div>
          </FormField>

          <FormField id="arrival-datetime" label="Ngày & Giờ cập bến dự kiến" required>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={formData.arrivalDate}
                onChange={(e) => updateField('arrivalDate', e.target.value)}
                className="w-full h-9 text-xs px-3 rounded-lg border bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 focus:border-blue-600 outline-none font-mono"
                required
              />
              <input
                type="time"
                value={formData.arrivalTime}
                onChange={(e) => updateField('arrivalTime', e.target.value)}
                className="w-full h-9 text-xs px-3 rounded-lg border bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 focus:border-blue-600 outline-none font-mono"
                required
              />
            </div>
          </FormField>
        </FormSectionBlock>

        {/* Section III: Thiết lập vận hành & Liên hệ */}
        <FormSectionBlock title="III. Thiết lập vận hành & Liên hệ" columns={2}>
          <FormSelectField
            id="trip-status"
            label="Trạng Thái Mở Bán Ban Đầu"
            required
            value={formData.status}
            onChange={(e) => updateField('status', e.target.value as TripStatus)}
            options={[
              { value: 'selling', label: 'Đang mở bán (Bán vé ngay)' },
              { value: 'draft', label: 'Bản nháp (Chưa bán vé)' },
              { value: 'closed', label: 'Đã khóa sổ (Tạm khóa bán)' },
            ]}
          />

          <FormInputField
            id="shuttle-phone"
            label="Hotline / SĐT Xe Trung Chuyển"
            optional
            leftIcon={<Phone size={14} />}
            value={formData.shuttlePhone}
            onChange={(e) => updateField('shuttlePhone', e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="VD: 0948066514"
            maxLength={15}
          />
        </FormSectionBlock>

        {/* Master Action Bar */}
        <AdminFormActionBar
          mode="create"
          isSubmitting={isSubmitting}
          cancelTo="/trips"
          submitLabel="Khởi tạo chuyến tàu"
          onClear={handleClearData}
          clearLabel="Làm sạch"
        />
      </AdminFormCard>
    </div>
  );
}
