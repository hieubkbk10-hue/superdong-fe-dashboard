import { useEffect, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { findRoute } from '@/apis/journeys';
import { Route as JourneyRoute } from '@/types';
import { RouteForm } from '@/components/routes/RouteForm';

export const Route = createFileRoute('/_admin/routes/$routeId/edit')({
  component: RouteEditPage,
});

function RouteEditPage() {
  const { routeId } = Route.useParams();
  const [route, setRoute] = useState<JourneyRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const loadRoute = async () => {
      setLoading(true);
      setApiError(null);
      try {
        const found = await findRoute(routeId);
        if (!found) {
          setApiError('Dữ liệu có thể đã bị xóa hoặc ID không còn tồn tại.');
          return;
        }
        setRoute(found);
      } catch (err: any) {
        const message = err?.response?.data?.message || err?.message || 'Không thể tải luồng tuyến';
        setApiError(message);
        toast.error(`Không tải được luồng tuyến. ${message}`);
      } finally {
        setLoading(false);
      }
    };

    loadRoute();
  }, [routeId]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" />
        Đang tải dữ liệu luồng tuyến...
      </div>
    );
  }

  if (apiError || !route) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium flex items-start gap-2.5">
          <AlertTriangle size={18} className="shrink-0 text-rose-500" />
          <span>Không tải được dữ liệu luồng tuyến. {apiError || 'Dữ liệu không tồn tại.'}</span>
        </div>
        <Link to={'/routes' as any} className="inline-flex h-10 px-4 items-center rounded-lg bg-blue-600 text-white text-sm font-semibold">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return <RouteForm mode="edit" routeId={routeId} initialRoute={route} />;
}
