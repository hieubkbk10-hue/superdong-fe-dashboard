import React, { useEffect, useState } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { ArrowLeft, Layers, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { findSeatMapForEdit, getBoats, getSeatClasses, updateSeatMap } from '@/apis/boats';
import { Boat, SeatClass } from '@/types';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { mapSeatMapToPayload, SeatMapForm, SeatMapPayload } from './-seat-map-form';

export const Route = createFileRoute('/_admin/seat-maps/$seatMapId/edit')({ component: SeatMapEditPage });

function SeatMapEditPage() {
  const { seatMapId } = Route.useParams() as any;
  const navigate = useNavigate();
  const [boats, setBoats] = useState<Boat[]>([]);
  const [seatClasses, setSeatClasses] = useState<SeatClass[]>([]);
  const [initial, setInitial] = useState<SeatMapPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [detailRes, boatsRes, classesRes] = await Promise.all([findSeatMapForEdit(seatMapId), getBoats(), getSeatClasses()]);
      setInitial(mapSeatMapToPayload(detailRes.data));
      setBoats(Array.isArray(boatsRes.data) ? boatsRes.data : []);
      setSeatClasses(Array.isArray(classesRes.data) ? classesRes.data : []);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không tải được sơ đồ ghế';
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [seatMapId]);

  const handleSubmit = async (payload: SeatMapPayload) => {
    setSubmitting(true);
    try {
      await updateSeatMap(seatMapId, payload);
      toast.success('Đã cập nhật sơ đồ ghế');
      navigate({ to: '/seat-maps' as any });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể cập nhật sơ đồ ghế');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400">
        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600 dark:text-blue-400" />
        <span className="text-xs font-semibold">Đang tải sơ đồ ghế...</span>
      </div>
    );
  }

  if (loadError || !initial) {
    return (
      <div className="space-y-4 font-sans">
        <Link to={'/seat-maps' as any} className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
          <ArrowLeft size={16} /> Quay lại danh sách sơ đồ ghế
        </Link>
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs text-rose-700 dark:text-rose-400 flex items-start gap-2">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Không tải được sơ đồ ghế</p>
            <p>{loadError || 'Không tìm thấy thông tin sơ đồ ghế trên hệ thống'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full font-sans pb-10 text-slate-800 dark:text-slate-200">
      {/* Top Header Navigation Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Button variant="light" size="icon" className="h-8 w-8" asChild>
            <Link to={'/seat-maps' as any} title="Quay lại danh sách sơ đồ ghế">
              <ArrowLeft size={16} />
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Chỉnh sửa sơ đồ ghế
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cập nhật cấu hình tầng, khu vực, ghế và tiện ích từ dữ liệu hệ thống
            </p>
          </div>
        </div>

        <div>
          <Badge variant="blue" className="px-3 py-1 text-xs">
            Chỉnh sửa #{seatMapId}
          </Badge>
        </div>
      </div>

      <SeatMapForm
        mode="edit"
        boats={boats}
        seatClasses={seatClasses}
        initial={initial}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
