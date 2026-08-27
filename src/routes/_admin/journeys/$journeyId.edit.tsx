import React, { useEffect, useMemo, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Route as RouteIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { findJourney, getAdminLocations, getRoutes, updateJourney } from '@/apis/journeys';
import { Journey, Location, Route as JourneyRoute } from '@/types';
import { formatRouteOptionLabel, normalizeRouteStops, StopOption, unwrapData } from '@/helpers/journeyRoutes';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import {
  AdminFormHeader,
  AdminFormCard,
  FormSectionBlock,
  FormField,
  FormSelectField,
  useFormDirty,
} from '@/components/common/FormUtilities';
import { UnsavedChangesBar } from '@/components/common/UnsavedChangesBar';

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
  const navigate = useNavigate();
  const draftKey = `superdong_journeys_draft_edit_${journeyId}`;

  const [initialData, setInitialData] = useState<JourneyFormData | null>(null);
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
        throw new Error('Không tìm thấy hành trình. Dữ liệu có thể đã bị xóa hoặc không còn tồn tại.');
      }

      const locationsById = new Map((locationsRes.data || []).map((location) => [String(location.id), location]));
      const routeRows = Array.isArray(routesRes?.data) ? routesRes.data.map((route) => normalizeRoute(route, locationsById)) : [];
      const serverForm = normalizeJourneyForm(journey);

      setRoutes(routeRows);
      setInitialData(serverForm);

      let nextForm = serverForm;
      try {
        const draft = JSON.parse(localStorage.getItem(draftKey) || 'null');
        if (draft) nextForm = { ...serverForm, ...draft };
      } catch {}

      setFormData(nextForm);
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

  const { isDirty } = useFormDirty(initialData, formData);

  useEffect(() => {
    if (!loading && !apiError && isDirty) {
      localStorage.setItem(draftKey, JSON.stringify(formData));
    }
  }, [formData, loading, apiError, draftKey, isDirty]);

  const handleReset = () => {
    if (initialData) {
      setFormData(initialData);
      try {
        localStorage.removeItem(draftKey);
      } catch {}
      toast.info('Đã khôi phục dữ liệu ban đầu');
    }
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
      await updateJourney(journeyId, {
        route_id: formData.route_id,
        from_location_id: formData.from_location_id,
        to_location_id: formData.to_location_id,
        status: formData.status,
      });

      try {
        localStorage.removeItem(draftKey);
      } catch {}

      toast.success('Cập nhật hành trình thành công');
      navigate({ to: '/journeys' as any });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Không thể cập nhật hành trình');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 w-full flex flex-col items-center justify-center gap-3 font-sans">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <span className="text-xs font-medium text-slate-500">Đang tải thông tin hành trình...</span>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="p-8 text-center space-y-4 font-sans">
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 rounded-2xl text-xs font-medium">
          {apiError}
        </div>
        <Button variant="outline" onClick={() => navigate({ to: '/journeys' as any })}>
          Quay lại danh sách hành trình
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full font-sans pb-20 text-slate-800 dark:text-slate-200">
      <AdminFormHeader
        icon={RouteIcon}
        title={
          <>
            Chỉnh Sửa Hành Trình:{' '}
            <span className="text-blue-600 dark:text-blue-400 font-bold">
              {fromStop?.name || '...'} → {toStop?.name || '...'}
            </span>
          </>
        }
        subtitle="Cập nhật luồng tuyến liên kết, điểm đón/trả khách và trạng thái mở bán"
        backTo="/journeys"
        badge={
          formData.status === 'active' ? (
            <Badge variant="success">Hoạt động</Badge>
          ) : (
            <Badge variant="danger">Tạm ngưng</Badge>
          )
        }
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
      />
    </div>
  );
}
