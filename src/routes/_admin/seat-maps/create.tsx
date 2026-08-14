import React, { useEffect, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Layers, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { createSeatMap, getBoats, getSeatClasses } from '@/apis/boats';
import { Boat, SeatClass } from '@/types';
import { AdminFormHeader } from '@/components/common/FormUtilities';
import { SeatMapForm, SeatMapPayload } from './-seat-map-form';

export const Route = createFileRoute('/_admin/seat-maps/create')({ component: SeatMapCreatePage });

function SeatMapCreatePage() {
  const navigate = useNavigate();
  const [boats, setBoats] = useState<Boat[]>([]);
  const [seatClasses, setSeatClasses] = useState<SeatClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    Promise.all([getBoats(), getSeatClasses()])
      .then(([boatsRes, classesRes]) => {
        setBoats(Array.isArray(boatsRes.data) ? boatsRes.data.filter((boat) => boat.status === 'active') : []);
        setSeatClasses(Array.isArray(classesRes.data) ? classesRes.data : []);
      })
      .catch((err: any) => toast.error(err?.response?.data?.message || 'Không tải được dữ liệu tàu và hạng ghế'))
      .finally(() => setLoading(false));
  }, []);

  const handleClear = () => {
    try {
      localStorage.removeItem('superdong_seatmap_draft_form');
    } catch (_) {}
    setFormKey((k) => k + 1);
    toast.success('Đã làm sạch toàn bộ dữ liệu nhập');
  };

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

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400">
        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600 dark:text-blue-400" />
        <span className="text-xs font-semibold">Đang tải dữ liệu tàu và hạng ghế...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full font-sans pb-10 text-slate-800 dark:text-slate-200">
      {/* Top Header Navigation Bar */}
      <AdminFormHeader
        icon={Layers}
        title="Thêm sơ đồ ghế mới"
        subtitle="Khai báo tầng, khu vực, ghế và tiện ích theo dữ liệu vận hành thực tế"
        backTo="/seat-maps"
        onClear={handleClear}
      />

      <SeatMapForm
        key={formKey}
        mode="create"
        boats={boats}
        seatClasses={seatClasses}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
