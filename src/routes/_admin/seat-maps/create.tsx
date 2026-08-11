import React, { useEffect, useState } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { ArrowLeft, Layers, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { createSeatMap, getBoats, getSeatClasses } from '@/apis/boats';
import { Boat, SeatClass } from '@/types';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
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
              Thêm sơ đồ ghế mới
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Khai báo tầng, khu vực, ghế và tiện ích theo dữ liệu vận hành thực tế
            </p>
          </div>
        </div>

        <div>
          <Badge variant="blue" className="px-3 py-1 text-xs">
            Tạo mới sơ đồ
          </Badge>
        </div>
      </div>

      <SeatMapForm
        mode="create"
        boats={boats}
        seatClasses={seatClasses}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
