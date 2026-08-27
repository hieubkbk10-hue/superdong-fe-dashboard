import React, { useEffect, useMemo, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Route as RouteIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createJourney, getAdminLocations, getRoutes } from '@/apis/journeys';
import { Location, Route as JourneyRoute } from '@/types';
import { formatRouteOptionLabel, normalizeRouteStops, StopOption } from '@/helpers/journeyRoutes';
import { Button } from '@/components/common/Button';
import {
  AdminFormHeader,
  AdminFormCard,
  FormSectionBlock,
  FormSelectField,
  useFormDirty,
} from '@/components/common/FormUtilities';
import { UnsavedChangesBar } from '@/components/common/UnsavedChangesBar';

export const Route = createFileRoute('/_admin/journeys/create')({
  component: JourneyCreatePage,
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

const draftKey = 'superdong_journeys_draft_create';

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

function JourneyCreatePage() {
  const navigate = useNavigate();
  const [initialData] = useState(emptyForm);
  const [formData, setFormData] = useState<JourneyFormData>(() => {
    try {
      return { ...emptyForm, ...JSON.parse(localStorage.getItem(draftKey) || '{}') };
    } catch {
      return emptyForm;
    }
  });
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedRoute = useMemo(() => routes.find((route) => route.id === formData.route_id) || null, [routes, formData.route_id]);
  const availableStops = selectedRoute?.stops || [];
  const fromStop = availableStops.find((stop) => stop.location_id === formData.from_location_id);
  const toStop = availableStops.find((stop) => stop.location_id === formData.to_location_id);
  const destinationStops = fromStop ? availableStops.filter((stop) => stop.stop_order > fromStop.stop_order) : availableStops;

  const fetchRoutes = async () => {
    setLoadingRoutes(true);
    setApiError(null);
    try {
      const [routesRes, locationsRes] = await Promise.all([
        getRoutes({ limit: 100, page: 1 }),
        getAdminLocations({ status: 'all', limit: 100, page: 1 }),
      ]);
      const locationsById = new Map((locationsRes.data || []).map((location) => [String(location.id), location]));
      const rows = Array.isArray(routesRes?.data) ? routesRes.data.map((route) => normalizeRoute(route, locationsById)).filter((route) => route.status === 'active') : [];
      setRoutes(rows);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không thể tải danh sách luồng tuyến';
      setRoutes([]);
      setApiError(message);
      toast.error(`Không tải được luồng tuyến. ${message}`);
    } finally {
      setLoadingRoutes(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const { isDirty } = useFormDirty(initialData, formData);

  useEffect(() => {
    if (isDirty) {
      localStorage.setItem(draftKey, JSON.stringify(formData));
    }
  }, [formData, isDirty]);

  const handleReset = () => {
    setFormData(emptyForm);
    try {
      localStorage.removeItem(draftKey);
    } catch {}
    toast.info('Đã làm sạch dữ liệu nhập');
  };

  const updateField = <K extends keyof JourneyFormData>(field: K, value: JourneyFormData[K]) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'route_id') {
        next.from_location_id = '';
        next.to_location_id = '';
      }
      if (field === 'from_location_id') {
        const currentRoute = routes.find((route) => route.id === next.route_id);
        const stops = currentRoute?.stops || [];
        const nextFrom = stops.find((stop) => stop.location_id === value);
        const nextTo = stops.find((stop) => stop.location_id === next.to_location_id);
        if (nextFrom && nextTo && nextTo.stop_order <= nextFrom.stop_order) {
          next.to_location_id = '';
        }
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
      toast.error('Vui lòng chọn điểm khởi hành');
      return false;
    }
    if (!formData.to_location_id) {
      toast.error('Vui lòng chọn điểm đến');
      return false;
    }
    if (fromStop && toStop && toStop.stop_order <= fromStop.stop_order) {
      toast.error('Điểm đến phải nằm sau điểm khởi hành theo thứ tự tuyến');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting || !validateForm()) return;

    setIsSubmitting(true);
    try {
      await createJourney({
        route_id: formData.route_id,
        from_location_id: formData.from_location_id,
        to_location_id: formData.to_location_id,
        status: formData.status,
      });

      try {
        localStorage.removeItem(draftKey);
      } catch {}

      toast.success('Tạo hành trình mới thành công');
      navigate({ to: '/journeys' as any });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Không thể tạo hành trình');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingRoutes) {
    return (
      <div className="h-96 w-full flex flex-col items-center justify-center gap-3 font-sans">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <span className="text-xs font-medium text-slate-500">Đang tải danh sách luồng tuyến...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full font-sans pb-20 text-slate-800 dark:text-slate-200">
      <AdminFormHeader
        icon={RouteIcon}
        title="Thêm Mới Hành Trình Bán Vé"
        subtitle="Thiết lập chặng hành trình từ điểm đón đến điểm trả thuộc luồng tuyến"
        backTo="/journeys"
        onClear={handleReset}
        clearLabel="Làm sạch"
      />

      <AdminFormCard onSubmit={handleSubmit}>
        <FormSectionBlock title="I. Luồng tuyến liên kết" columns={1}>
          <FormSelectField
            id="journey-route"
            label="Thuộc Luồng Tuyến"
            required
            value={formData.route_id}
            onChange={(e) => updateField('route_id', e.target.value)}
          >
            <option value="">-- Chọn luồng tuyến --</option>
            {routes.map((route) => (
              <option key={route.id} value={route.id}>
                {route.label}
              </option>
            ))}
          </FormSelectField>
        </FormSectionBlock>

        <FormSectionBlock title="II. Điểm đón và điểm trả khách">
          <FormSelectField
            id="journey-from"
            label="Điểm Khởi Hành (Bến đón)"
            required
            value={formData.from_location_id}
            onChange={(e) => updateField('from_location_id', e.target.value)}
            disabled={!formData.route_id}
          >
            <option value="">-- Chọn bến khởi hành --</option>
            {availableStops.slice(0, Math.max(0, availableStops.length - 1)).map((stop) => (
              <option key={stop.location_id} value={stop.location_id}>
                #{stop.stop_order} - {stop.name}
              </option>
            ))}
          </FormSelectField>

          <FormSelectField
            id="journey-to"
            label="Điểm Đến (Bến trả)"
            required
            value={formData.to_location_id}
            onChange={(e) => updateField('to_location_id', e.target.value)}
            disabled={!formData.from_location_id}
          >
            <option value="">-- Chọn bến đến --</option>
            {destinationStops.map((stop) => (
              <option key={stop.location_id} value={stop.location_id}>
                #{stop.stop_order} - {stop.name}
              </option>
            ))}
          </FormSelectField>
        </FormSectionBlock>

        <FormSectionBlock title="III. Trạng thái áp dụng" columns={1}>
          <FormSelectField
            id="journey-status"
            label="Trạng Thái Vận Hành & Mở Bán"
            required
            value={formData.status}
            onChange={(e) => updateField('status', e.target.value as JourneyFormData['status'])}
            options={[
              { value: 'active', label: 'Đang mở bán vé' },
              { value: 'inactive', label: 'Tạm ngưng bán' },
            ]}
          />
        </FormSectionBlock>
      </AdminFormCard>

      <UnsavedChangesBar
        isDirty={isDirty}
        isSaving={isSubmitting}
        onSave={() => handleSubmit()}
        onReset={handleReset}
        message="Thông tin hành trình chưa được tạo mới"
      />
    </div>
  );
}
