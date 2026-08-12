import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, GripVertical, Plus, RotateCcw, Save, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { createRoute, findRoute, getAdminLocations, updateRoute } from '@/apis/journeys';
import { Location, Route as JourneyRoute } from '@/types';
import { normalizeRouteStops } from '@/helpers/journeyRoutes';

type RouteFormData = {
  code: string;
  name: string;
  status: 'active' | 'inactive';
  stops: Array<{ location_id: string; stop_order: number }>;
};

const emptyForm: RouteFormData = {
  code: '',
  name: '',
  status: 'active',
  stops: [
    { location_id: '', stop_order: 1 },
    { location_id: '', stop_order: 2 },
  ],
};

const normalizeStatus = (route?: JourneyRoute | null): RouteFormData['status'] => {
  if (route?.status === 'inactive' || route?.is_active === false) return 'inactive';
  return 'active';
};

const normalizeForm = (route: JourneyRoute | null, locationsById: Map<string, Location>): RouteFormData => {
  if (!route) return emptyForm;
  const stops = normalizeRouteStops(route, locationsById).map((stop, index) => ({
    location_id: String(stop.location_id),
    stop_order: index + 1,
  }));

  return {
    code: route.code || '',
    name: route.name || '',
    status: normalizeStatus(route),
    stops: stops.length >= 2 ? stops : emptyForm.stops,
  };
};

const buildPayload = (formData: RouteFormData) => ({
  code: formData.code.trim().toUpperCase(),
  name: formData.name.trim(),
  status: formData.status,
  stops: formData.stops.map((stop, index) => ({
    location_id: stop.location_id,
    stop_order: index + 1,
  })),
});

export function RouteForm({
  mode,
  routeId,
  initialRoute,
}: {
  mode: 'create' | 'edit';
  routeId?: string;
  initialRoute?: JourneyRoute | null;
}) {
  const navigate = useNavigate();
  const draftKey = mode === 'create' ? 'superdong_routes_draft_create' : `superdong_routes_draft_edit_${routeId}`;
  const cacheKey = routeId ? `superdong_route_cache_${routeId}` : '';

  const [locations, setLocations] = useState<Location[]>([]);
  const [formData, setFormData] = useState<RouteFormData>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const locationsById = useMemo(() => new Map(locations.map((location) => [String(location.id), location])), [locations]);
  const selectedLocationIds = useMemo(() => new Set(formData.stops.map((stop) => stop.location_id).filter(Boolean)), [formData.stops]);

  const hydrate = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const locationsRes = await getAdminLocations({ status: 'all', limit: 100, page: 1 });
      const locationRows = locationsRes.data || [];
      const nextLocationsById = new Map(locationRows.map((location) => [String(location.id), location]));
      const serverForm = normalizeForm(initialRoute || null, nextLocationsById);
      let nextForm = mode === 'edit' ? serverForm : emptyForm;
      try {
        const draft = JSON.parse(localStorage.getItem(draftKey) || 'null');
        if (draft) nextForm = { ...nextForm, ...draft };
      } catch {}

      setLocations(locationRows);
      setFormData(nextForm);
      if (mode === 'edit' && cacheKey) localStorage.setItem(cacheKey, JSON.stringify({ id: routeId, ...serverForm }));
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không thể tải dữ liệu bến tàu';
      setApiError(message);
      toast.error(`Không tải được dữ liệu cấu hình luồng tuyến. ${message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    hydrate();
  }, [routeId, initialRoute]);

  useEffect(() => {
    if (!loading && !apiError) localStorage.setItem(draftKey, JSON.stringify(formData));
  }, [formData, loading, apiError, draftKey]);

  const updateField = <K extends keyof RouteFormData>(field: K, value: RouteFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateStop = (index: number, locationId: string) => {
    setFormData((prev) => ({
      ...prev,
      stops: prev.stops.map((stop, stopIndex) => (stopIndex === index ? { ...stop, location_id: locationId } : stop)),
    }));
  };

  const addStop = () => {
    setFormData((prev) => ({
      ...prev,
      stops: [...prev.stops, { location_id: '', stop_order: prev.stops.length + 1 }],
    }));
  };

  const removeStop = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      stops: prev.stops.filter((_, stopIndex) => stopIndex !== index).map((stop, stopIndex) => ({ ...stop, stop_order: stopIndex + 1 })),
    }));
  };

  const moveStop = (index: number, direction: -1 | 1) => {
    setFormData((prev) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.stops.length) return prev;
      const stops = [...prev.stops];
      [stops[index], stops[nextIndex]] = [stops[nextIndex], stops[index]];
      return { ...prev, stops: stops.map((stop, stopIndex) => ({ ...stop, stop_order: stopIndex + 1 })) };
    });
  };

  const clearDraft = () => {
    setFormData(emptyForm);
    localStorage.removeItem(draftKey);
    toast.success('Đã làm sạch dữ liệu nhập luồng tuyến');
  };

  const validateForm = () => {
    if (!formData.code.trim()) {
      toast.error('Vui lòng nhập mã luồng tuyến');
      return false;
    }
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên luồng tuyến');
      return false;
    }
    if (formData.stops.length < 2) {
      toast.error('Luồng tuyến phải có ít nhất 2 điểm dừng');
      return false;
    }
    if (formData.stops.some((stop) => !stop.location_id)) {
      toast.error('Vui lòng chọn đầy đủ bến tàu cho từng điểm dừng');
      return false;
    }
    if (new Set(formData.stops.map((stop) => stop.location_id)).size !== formData.stops.length) {
      toast.error('Một bến tàu chỉ được xuất hiện một lần trong cùng luồng tuyến');
      return false;
    }
    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting || !validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = buildPayload(formData);
      const response = mode === 'create' ? await createRoute(payload) : await updateRoute(routeId!, payload);
      const saved = response.data;
      localStorage.removeItem(draftKey);
      if (mode === 'edit' && cacheKey) {
        const freshRoute = await findRoute(routeId!);
        const freshForm = normalizeForm(freshRoute || saved, locationsById);
        setFormData(freshForm);
        localStorage.setItem(cacheKey, JSON.stringify({ id: routeId, ...freshForm }));
        localStorage.removeItem(draftKey);
      }
      toast.success(mode === 'create' ? `Đã tạo luồng tuyến ${payload.name}` : `Đã cập nhật luồng tuyến ${payload.name}`);
      navigate({ to: mode === 'create' ? '/routes' as any : '/routes/$routeId/edit' as any, params: mode === 'edit' ? { routeId } as any : undefined });
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không thể lưu luồng tuyến';
      toast.error(`${mode === 'create' ? 'Tạo' : 'Cập nhật'} luồng tuyến thất bại. ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 w-full font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to={'/routes' as any}
            onClick={() => localStorage.removeItem(draftKey)}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Quay lại danh sách luồng tuyến"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{mode === 'create' ? 'Thêm luồng tuyến' : 'Chỉnh sửa luồng tuyến'}</h1>
            <p className="text-xs text-slate-500 mt-0.5">Khai báo tuyến gồm nhiều bến theo thứ tự khai thác thật. Hành trình bán vé sẽ chọn cặp bến từ luồng tuyến này.</p>
          </div>
        </div>
        {mode === 'create' ? (
          <button
            type="button"
            onClick={clearDraft}
            className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
          >
            <RotateCcw size={14} /> Làm sạch dữ liệu
          </button>
        ) : (
          <button
            type="button"
            onClick={hydrate}
            disabled={loading}
            className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 disabled:opacity-60"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Đồng bộ
          </button>
        )}
      </div>

      {apiError && !loading ? (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium flex items-start gap-2.5">
          <AlertTriangle size={18} className="shrink-0 text-rose-500" />
          <span>Không tải được dữ liệu cấu hình luồng tuyến. {apiError}</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
          <div className="px-5 py-3 bg-[#EBF7FA] border-b border-cyan-100 text-sm font-bold text-slate-800 uppercase">I. Thông tin luồng tuyến</div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Mã luồng tuyến <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => updateField('code', e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 32))}
                placeholder="VD: RG-PQ"
                disabled={loading}
                className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm focus:border-blue-500 outline-none disabled:opacity-60"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tên luồng tuyến <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value.slice(0, 255))}
                placeholder="VD: Rạch Giá → Phú Quốc"
                disabled={loading}
                className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none disabled:opacity-60"
                required
              />
            </div>
          </div>

          <div className="px-5 py-3 bg-[#EBF7FA] border-y border-cyan-100 text-sm font-bold text-slate-800 uppercase">II. Thứ tự điểm dừng</div>
          <div className="p-6 space-y-3">
            {formData.stops.map((stop, index) => (
              <div key={index} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <GripVertical size={16} />
                  {index + 1}
                </div>
                <select
                  value={stop.location_id}
                  onChange={(e) => updateStop(index, e.target.value)}
                  disabled={loading}
                  className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none disabled:opacity-60"
                >
                  <option value="">Chọn bến tàu</option>
                  {locations.map((location) => {
                    const id = String(location.id);
                    const disabled = selectedLocationIds.has(id) && id !== stop.location_id;
                    return (
                      <option key={id} value={id} disabled={disabled}>
                        {location.name || 'Chưa cập nhật'} {location.code ? `(${location.code})` : ''}
                      </option>
                    );
                  })}
                </select>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => moveStop(index, -1)} disabled={index === 0} className="h-9 px-2 rounded-md border border-slate-200 text-xs font-semibold disabled:opacity-40">Lên</button>
                  <button type="button" onClick={() => moveStop(index, 1)} disabled={index === formData.stops.length - 1} className="h-9 px-2 rounded-md border border-slate-200 text-xs font-semibold disabled:opacity-40">Xuống</button>
                  <button type="button" onClick={() => removeStop(index)} disabled={formData.stops.length <= 2} className="h-9 w-9 inline-flex items-center justify-center rounded-md text-rose-600 hover:bg-rose-50 disabled:opacity-40">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addStop}
              disabled={formData.stops.length >= 50}
              className="h-10 px-4 rounded-lg border border-dashed border-blue-300 bg-blue-50 text-blue-700 text-sm font-semibold flex items-center gap-2 hover:bg-blue-100 disabled:opacity-60"
            >
              <Plus size={16} /> Thêm điểm dừng
            </button>
          </div>

          <div className="px-5 py-3 bg-[#EBF7FA] border-y border-cyan-100 text-sm font-bold text-slate-800 uppercase">III. Trạng thái sử dụng</div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Trạng thái</label>
              <select
                value={formData.status}
                onChange={(e) => updateField('status', e.target.value as RouteFormData['status'])}
                disabled={loading}
                className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none disabled:opacity-60"
              >
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Tạm ngưng</option>
              </select>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Link
              to={'/routes' as any}
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
              {isSubmitting ? 'Đang lưu...' : mode === 'create' ? 'Lưu luồng tuyến' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
