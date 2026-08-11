import React, { useEffect, useMemo, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Route as RouteIcon, ArrowLeft, Save, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { findJourney, getAdminLocations, getRoutes, updateJourney } from '@/apis/journeys';
import { Journey, Location, Route as JourneyRoute } from '@/types';
import { formatRouteOptionLabel, normalizeRouteStops, StopOption, unwrapData } from '@/helpers/journeyRoutes';

export const Route = createFileRoute('/_admin/journeys/$journeyId/edit')({
  component: JourneyEditPage,
});

type JourneyFormData = {
  route_id: string;
  from_location_id: string;
  to_location_id: string;
  status: 'active' | 'inactive';
};

type RouteOption = {
  id: string;
  code: string;
  name: string;
  status: 'active' | 'inactive';
  stops: StopOption[];
  label: string;
};

const emptyForm: JourneyFormData = {
  route_id: '',
  from_location_id: '',
  to_location_id: '',
  status: 'active',
};

const normalizeRoute = (route: JourneyRoute, locationsById: Map<string, Location>): RouteOption => {
  const stops = normalizeRouteStops(route, locationsById);
  const normalized = {
    id: String(route.id),
    code: route.code || '',
    name: route.name || '',
    status: (route.status === 'inactive' || route.is_active === false ? 'inactive' : 'active') as RouteOption['status'],
    stops,
  };

  return {
    ...normalized,
    label: formatRouteOptionLabel(normalized),
  };
};

const normalizeJourneyForm = (journey: Journey): JourneyFormData => ({
  route_id: String(journey.route_id || unwrapData<JourneyRoute>(journey.route)?.id || ''),
  from_location_id: String(journey.from_location_id || ''),
  to_location_id: String(journey.to_location_id || ''),
  status: journey.status === 'inactive' || journey.is_active === false ? 'inactive' : 'active',
});

function JourneyEditPage() {
  const { journeyId } = Route.useParams();
  const draftKey = `superdong_journeys_draft_edit_${journeyId}`;
  const cacheKey = `superdong_journey_cache_${journeyId}`;

  const [formData, setFormData] = useState<JourneyFormData>(emptyForm);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedRoute = useMemo(() => routes.find((route) => route.id === formData.route_id) || null, [routes, formData.route_id]);
  const availableStops = selectedRoute?.stops || [];
  const fromStop = availableStops.find((stop) => stop.location_id === formData.from_location_id);
  const toStop = availableStops.find((stop) => stop.location_id === formData.to_location_id);
  const destinationStops = fromStop ? availableStops.filter((stop) => stop.stop_order > fromStop.stop_order) : availableStops;

  const hydrate = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const [routesRes, locationsRes, journey] = await Promise.all([
        getRoutes({ limit: 100, page: 1 }),
        getAdminLocations({ status: 'all', limit: 100, page: 1 }),
        findJourney(journeyId),
      ]);

      if (!journey) {
        throw new Error('Không tìm thấy hành trình. Dữ liệu có thể đã bị xóa hoặc không còn nằm trong trang danh sách hiện tại.');
      }

      const locationsById = new Map((locationsRes.data || []).map((location) => [String(location.id), location]));
      const routeRows = Array.isArray(routesRes?.data) ? routesRes.data.map((route) => normalizeRoute(route, locationsById)) : [];
      const serverForm = normalizeJourneyForm(journey);
      let nextForm = serverForm;
      try {
        const draft = JSON.parse(localStorage.getItem(draftKey) || 'null');
        if (draft) nextForm = { ...serverForm, ...draft };
      } catch {}

      setRoutes(routeRows);
      setFormData(nextForm);
      localStorage.setItem(cacheKey, JSON.stringify({ id: String(journeyId), ...serverForm }));
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không thể tải dữ liệu hành trình';
      setApiError(message);
      toast.error(`Không tải được hành trình. ${message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    hydrate();
  }, [journeyId]);

  useEffect(() => {
    if (!loading && !apiError) {
      localStorage.setItem(draftKey, JSON.stringify(formData));
    }
  }, [formData, loading, apiError, draftKey]);

  const updateField = <K extends keyof JourneyFormData>(field: K, value: JourneyFormData[K]) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'route_id') {
        next.from_location_id = '';
        next.to_location_id = '';
      }
      if (field === 'from_location_id') {
        next.to_location_id = '';
      }
      return next;
    });
  };

  const validateForm = () => {
    if (!formData.route_id) {
      toast.error('Vui lòng chọn luồng tuyến');
      return false;
    }
    if (!formData.from_location_id) {
      toast.error('Vui lòng chọn bến đi');
      return false;
    }
    if (!formData.to_location_id) {
      toast.error('Vui lòng chọn bến đến');
      return false;
    }
    if (formData.from_location_id === formData.to_location_id) {
      toast.error('Bến đi và bến đến không được trùng nhau');
      return false;
    }
    if (fromStop && toStop && fromStop.stop_order >= toStop.stop_order) {
      toast.error('Bến đi phải đứng trước bến đến trong thứ tự điểm dừng của luồng tuyến');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !validateForm()) return;

    setIsSubmitting(true);
    try {
      const res = await updateJourney(journeyId, {
        route_id: formData.route_id,
        from_location_id: formData.from_location_id,
        to_location_id: formData.to_location_id,
        status: formData.status,
      });
      const serverForm = normalizeJourneyForm(res.data);
      setFormData(serverForm);
      localStorage.removeItem(draftKey);
      localStorage.setItem(cacheKey, JSON.stringify({ id: String(journeyId), ...serverForm }));
      toast.success('Đã cập nhật hành trình');
      await hydrate();
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không thể cập nhật hành trình';
      toast.error(`Cập nhật hành trình thất bại. ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 w-full font-sans">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to={'/journeys' as any}
            onClick={() => localStorage.removeItem(draftKey)}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Quay lại danh sách hành trình"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <RouteIcon className="h-6 w-6 text-blue-600" />
              Chỉnh sửa hành trình
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Đồng bộ dữ liệu hành trình từ danh sách API hiện có, không dùng dữ liệu mẫu.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={hydrate}
          disabled={loading}
          className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 disabled:opacity-60"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Đồng bộ
        </button>
      </div>

      {apiError && !loading ? (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium flex items-start gap-2.5">
          <AlertTriangle size={18} className="shrink-0 text-rose-500" />
          <span>Không tải được dữ liệu hành trình. {apiError}</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
          <div className="px-5 py-3 bg-[#EBF7FA] border-b border-cyan-100 text-sm font-bold text-slate-800 uppercase">
            I. Luồng tuyến
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Luồng tuyến <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.route_id}
                onChange={(e) => updateField('route_id', e.target.value)}
                disabled={loading}
                className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none disabled:opacity-60"
              >
                <option value="">Chọn luồng tuyến</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="px-5 py-3 bg-[#EBF7FA] border-y border-cyan-100 text-sm font-bold text-slate-800 uppercase">
            II. Cặp bến khai thác
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Bến đi <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.from_location_id}
                onChange={(e) => updateField('from_location_id', e.target.value)}
                disabled={!selectedRoute || availableStops.length < 2 || loading}
                className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none disabled:opacity-60"
              >
                <option value="">Chọn bến đi</option>
                {availableStops.slice(0, -1).map((stop) => (
                  <option key={`${stop.location_id}-${stop.stop_order}`} value={stop.location_id}>
                    {stop.stop_order}. {stop.name || 'Chưa cập nhật'} {stop.code ? `(${stop.code})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Bến đến <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.to_location_id}
                onChange={(e) => updateField('to_location_id', e.target.value)}
                disabled={!formData.from_location_id || destinationStops.length === 0 || loading}
                className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none disabled:opacity-60"
              >
                <option value="">Chọn bến đến</option>
                {destinationStops.map((stop) => (
                  <option key={`${stop.location_id}-${stop.stop_order}`} value={stop.location_id}>
                    {stop.stop_order}. {stop.name || 'Chưa cập nhật'} {stop.code ? `(${stop.code})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="px-5 py-3 bg-[#EBF7FA] border-y border-cyan-100 text-sm font-bold text-slate-800 uppercase">
            III. Trạng thái khai thác
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Trạng thái</label>
              <select
                value={formData.status}
                onChange={(e) => updateField('status', e.target.value as JourneyFormData['status'])}
                disabled={loading}
                className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none disabled:opacity-60"
              >
                <option value="active">Đang khai thác</option>
                <option value="inactive">Tạm ngưng</option>
              </select>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Link
              to={'/journeys' as any}
              onClick={() => localStorage.removeItem(draftKey)}
              className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Hủy bỏ
            </Link>
            <button
              type="submit"
              disabled={loading || isSubmitting}
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
