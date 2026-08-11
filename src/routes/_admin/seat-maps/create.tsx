import React, { useEffect, useState } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { ArrowLeft, Layers, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { createSeatMap, getBoats, getSeatClasses } from '@/apis/boats';
import { Boat, SeatClass } from '@/types';
import { SeatMapForm, SeatMapPayload } from './-seat-map-form';

export const Route = createFileRoute('/_admin/seat-maps/create')({ component: SeatMapCreatePage });

function SeatMapCreatePage() {
  const navigate = useNavigate();
  const [boats, setBoats] = useState<Boat[]>([]);
  const [seatClasses, setSeatClasses] = useState<SeatClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([getBoats(), getSeatClasses()])
      .then(([boatsRes, classesRes]) => {
        setBoats(Array.isArray(boatsRes.data) ? boatsRes.data.filter((boat) => boat.status === 'active') : []);
        setSeatClasses(Array.isArray(classesRes.data) ? classesRes.data : []);
      })
      .catch((err: any) => toast.error(err?.response?.data?.message || 'Không tải được dữ liệu tàu và hạng ghế'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (payload: SeatMapPayload) => {
    if (!payload.boat_id) return;
    setSubmitting(true);
    try {
      await createSeatMap(payload.boat_id, payload as any);
      toast.success('Đã tạo sơ đồ ghế');
      navigate({ to: '/seat-maps' as any });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể tạo sơ đồ ghế');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500"><RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" />Đang tải dữ liệu...</div>;

  return <div className="space-y-6 w-full font-sans"><Header title="Thêm sơ đồ ghế" /><SeatMapForm mode="create" boats={boats} seatClasses={seatClasses} submitting={submitting} onSubmit={handleSubmit} /></div>;
}

function Header({ title }: { title: string }) {
  return <div className="flex items-center gap-3"><Link to={'/seat-maps' as any} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"><ArrowLeft size={18} /></Link><div><h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Layers className="h-6 w-6 text-blue-600" />{title}</h1><p className="text-xs text-slate-500 mt-0.5">Khai báo tầng, khu vực, ghế và tiện ích theo dữ liệu vận hành thật.</p></div></div>;
}
