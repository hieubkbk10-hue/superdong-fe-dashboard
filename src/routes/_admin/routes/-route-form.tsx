import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Route as RouteIcon, GripVertical, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createRoute, findRoute, getAdminLocations, updateRoute } from '@/apis/journeys';
import { Location, Route as JourneyRoute } from '@/types';
import { normalizeRouteStops } from '@/helpers/journeyRoutes';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import {
  AdminFormHeader,
  AdminFormCard,
  FormSectionBlock,
  FormInputField,
  FormSelectField,
  useFormDirty,
} from '@/components/common/FormUtilities';
import { UnsavedChangesBar } from '@/components/common/UnsavedChangesBar';

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

  const [locations, setLocations] = useState<Location[]>([]);
  const [initialData, setInitialData] = useState<RouteFormData | null>(null);
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

      setLocations(locationRows);
      setInitialData(serverForm);

      let nextForm = mode === 'edit' ? serverForm : emptyForm;
      try {
        const draft = JSON.parse(localStorage.getItem(draftKey) || 'null');
        if (draft) nextForm = { ...nextForm, ...draft };
      } catch {}

      setFormData(nextForm);
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

  const { isDirty } = useFormDirty(initialData, formData);

  useEffect(() => {
    if (!loading && !apiError && isDirty) {
      localStorage.setItem(draftKey, JSON.stringify(formData));
    }
  }, [formData, loading, apiError, draftKey, isDirty]);

  const handleReset = () => {
    const target = initialData || emptyForm;
    setFormData(target);
    try {
      localStorage.removeItem(draftKey);
    } catch {}
    toast.info(mode === 'edit' ? 'Đã khôi phục dữ liệu ban đầu' : 'Đã làm sạch dữ liệu nhập');
  };

  const updateField = <K extends keyof RouteFormData>(field: K, value: RouteFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateStop = (index: number, locationId: string) => {
    setFormData((prev) => {
      const stops = prev.stops.map((stop, idx) => (idx === index ? { ...stop, location_id: locationId } : stop));
      return { ...prev, stops };
    });
  };

  const addStop = () => {
    setFormData((prev) => ({
      ...prev,
      stops: [...prev.stops, { location_id: '', stop_order: prev.stops.length + 1 }],
    }));
  };

  const removeStop = (index: number) => {
    setFormData((prev) => {
      const nextStops = prev.stops.filter((_, idx) => idx !== index).map((stop, idx) => ({ ...stop, stop_order: idx + 1 }));
      return { ...prev, stops: nextStops };
    });
  };

  const moveStop = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= formData.stops.length) return;

    setFormData((prev) => {
      const stops = [...prev.stops];
      const temp = stops[index];
      stops[index] = stops[targetIndex];
      stops[targetIndex] = temp;
      const reordered = stops.map((stop, idx) => ({ ...stop, stop_order: idx + 1 }));
      return { ...prev, stops: reordered };
    });
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
      toast.error('Luồng tuyến phải có tối thiểu 2 điểm dừng');
      return false;
    }
    const hasEmptyStop = formData.stops.some((stop) => !stop.location_id);
    if (hasEmptyStop) {
      toast.error('Vui lòng chọn đầy đủ bến tàu cho tất cả điểm dừng');
      return false;
    }
    const uniqueLocations = new Set(formData.stops.map((stop) => stop.location_id));
    if (uniqueLocations.size !== formData.stops.length) {
      toast.error('Các điểm dừng trong cùng một luồng tuyến không được trùng bến tàu');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting || !validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        status: formData.status,
        stops: formData.stops.map((stop, index) => ({
          location_id: stop.location_id,
          stop_order: index + 1,
        })),
      };

      if (mode === 'create') {
        await createRoute(payload);
        toast.success(`Tạo luồng tuyến '${formData.name}' thành công`);
      } else if (routeId) {
        await updateRoute(routeId, payload);
        toast.success(`Cập nhật luồng tuyến '${formData.name}' thành công`);
      }

      try {
        localStorage.removeItem(draftKey);
      } catch {}

      navigate({ to: '/routes' as any });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Không thể lưu luồng tuyến');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 w-full flex flex-col items-center justify-center gap-3 font-sans">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <span className="text-xs font-medium text-slate-500">Đang tải cấu hình luồng tuyến...</span>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="p-8 text-center space-y-4 font-sans">
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 rounded-2xl text-xs font-medium">
          {apiError}
        </div>
        <Button variant="outline" onClick={() => navigate({ to: '/routes' as any })}>
          Quay lại danh sách luồng tuyến
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full font-sans pb-20 text-slate-800 dark:text-slate-200">
      <AdminFormHeader
        icon={RouteIcon}
        title={
          mode === 'create' ? (
            'Thêm Mới Luồng Tuyến'
          ) : (
            <>
              Chỉnh Sửa Luồng Tuyến:{' '}
              <span className="text-blue-600 dark:text-blue-400 font-bold">
                {formData.name || formData.code}
              </span>
            </>
          )
        }
        subtitle={
          mode === 'create'
            ? 'Khai báo luồng tuyến mới và thiết lập thứ tự các điểm dừng bến tàu'
            : 'Cập nhật mã định danh, tên gọi và thứ tự các điểm dừng bến tàu'
        }
        backTo="/routes"
        badge={
          mode === 'edit' ? (
            formData.status === 'active' ? (
              <Badge variant="success">Hoạt động</Badge>
            ) : (
              <Badge variant="danger">Tạm ngưng</Badge>
            )
          ) : undefined
        }
        onClear={mode === 'create' ? handleReset : undefined}
        clearLabel="Làm sạch"
      />

      <AdminFormCard onSubmit={handleSubmit}>
        <FormSectionBlock title="I. Thông tin cơ bản">
          <FormInputField
            id="route-code"
            label="Mã Luồng Tuyến"
            required
            value={formData.code}
            onChange={(e) => updateField('code', e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 32))}
            placeholder="VD: RG-PQ, HT-PQ"
            className="font-mono font-bold uppercase"
          />
          <FormInputField
            id="route-name"
            label="Tên Luồng Tuyến"
            required
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value.slice(0, 255))}
            placeholder="VD: Rạch Giá → Phú Quốc"
          />
        </FormSectionBlock>

        <div className="space-y-3.5">
          <div className="bg-slate-100/70 dark:bg-slate-800/60 px-3.5 py-2 rounded-xl text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wide border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between">
            <span>II. Thứ tự điểm dừng bến tàu ({formData.stops.length} điểm)</span>
          </div>

          <div className="space-y-2.5">
            {formData.stops.map((stop, index) => (
              <div
                key={index}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 p-2.5"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 pl-1">
                  <GripVertical size={15} className="text-slate-400" />
                  <span>#{index + 1}</span>
                </div>

                <select
                  value={stop.location_id}
                  onChange={(e) => updateStop(index, e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:border-blue-600 outline-none cursor-pointer"
                >
                  <option value="">-- Chọn bến tàu --</option>
                  {locations.map((loc) => {
                    const id = String(loc.id);
                    const disabled = selectedLocationIds.has(id) && id !== stop.location_id;
                    return (
                      <option key={id} value={id} disabled={disabled}>
                        {loc.name || 'Chưa đặt tên'} {loc.code ? `(${loc.code})` : ''}
                      </option>
                    );
                  })}
                </select>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => moveStop(index, -1)}
                    disabled={index === 0}
                    className="h-8 px-2 text-xs"
                  >
                    Lên
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => moveStop(index, 1)}
                    disabled={index === formData.stops.length - 1}
                    className="h-8 px-2 text-xs"
                  >
                    Xuống
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStop(index)}
                    disabled={formData.stops.length <= 2}
                    className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Xóa điểm dừng"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addStop}
              disabled={formData.stops.length >= 50}
              className="gap-1.5 border-dashed border-blue-400 text-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 w-full h-9 rounded-xl text-xs font-semibold"
            >
              <Plus size={14} /> Thêm điểm dừng tiếp theo
            </Button>
          </div>
        </div>

        <FormSectionBlock title="III. Trạng thái sử dụng" columns={1}>
          <FormSelectField
            id="route-status"
            label="Trạng Thái Vận Hành"
            required
            value={formData.status}
            onChange={(e) => updateField('status', e.target.value as RouteFormData['status'])}
            options={[
              { value: 'active', label: 'Đang hoạt động' },
              { value: 'inactive', label: 'Tạm ngưng' },
            ]}
          />
        </FormSectionBlock>
      </AdminFormCard>

      <UnsavedChangesBar
        isDirty={isDirty}
        isSaving={isSubmitting}
        onSave={() => handleSubmit()}
        onReset={handleReset}
        message={mode === 'create' ? 'Luồng tuyến chưa được tạo mới' : 'Thay đổi chưa được lưu'}
      />
    </div>
  );
}
