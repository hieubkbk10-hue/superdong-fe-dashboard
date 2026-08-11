import React, { useEffect, useState } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { ArrowLeft, Layers, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { findSeatMapForEdit, getBoats, getSeatClasses, updateSeatMap } from '@/apis/boats';
import { Boat, SeatClass } from '@/types';
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

  useEffect(() => { loadData(); }, [seatMapId]);

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

  if (loading) return <div className="p-8 text-center text-slate-500"><RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" />Đang tải sơ đồ ghế...</div>;
  if (loadError || !initial) return <div className="space-y-4"><Link to={'/seat-maps' as any} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600"><ArrowLeft size={16} /> Quay lại danh sách</Link><div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-start gap-2"><AlertTriangle size={18} />{loadError || 'Không có dữ liệu sơ đồ ghế'}</div></div>;

  return <div className="space-y-6 w-full font-sans"><Header title="Chỉnh sửa sơ đồ ghế" /><SeatMapForm mode="edit" boats={boats} seatClasses={seatClasses} initial={initial} submitting={submitting} onSubmit={handleSubmit} /></div>;
}

function Header({ title }: { title: string }) {
  return <div className="flex items-center gap-3"><Link to={'/seat-maps' as any} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"><ArrowLeft size={18} /></Link><div><h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Layers className="h-6 w-6 text-blue-600" />{title}</h1><p className="text-xs text-slate-500 mt-0.5">Cập nhật dữ liệu sơ đồ ghế thật từ backend.</p></div></div>;
}
