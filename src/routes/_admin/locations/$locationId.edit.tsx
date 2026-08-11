import React, { useEffect, useState } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { MapPin, ArrowLeft, Save, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { findAdminLocation, updateLocation } from '@/apis/journeys';

export const Route = createFileRoute('/_admin/locations/$locationId/edit')({
  component: LocationEditPage,
});

type LocationFormData = {
  code: string;
  name: string;
  status: 'active' | 'inactive';
};

const emptyForm: LocationFormData = {
  code: '',
  name: '',
  status: 'active',
};

function normalizeForm(data: any): LocationFormData {
  return {
    code: data?.code || '',
    name: data?.name || '',
    status: data?.status === 'inactive' || data?.is_active === false ? 'inactive' : 'active',
  };
}

function LocationEditPage() {
  const { locationId } = Route.useParams();
  const navigate = useNavigate();
  const draftKey = `superdong_locations_draft_edit_${locationId}`;
  const cacheKey = `superdong_location_cache_${locationId}`;

  const [formData, setFormData] = useState<LocationFormData>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hydrateLocation = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await findAdminLocation(locationId);
      const serverForm = normalizeForm(res?.data);
      let nextForm = serverForm;
      try {
        const draft = JSON.parse(localStorage.getItem(draftKey) || 'null');
        if (draft) nextForm = { ...serverForm, ...draft };
      } catch {}
      setFormData(nextForm);
      localStorage.setItem(cacheKey, JSON.stringify({ id: String(locationId), ...serverForm }));
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không thể tải dữ liệu bến tàu';
      setApiError(message);
      toast.error(`Không tải được bến tàu. ${message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    hydrateLocation();
  }, [locationId]);

  useEffect(() => {
    if (!loading && !apiError) {
      localStorage.setItem(draftKey, JSON.stringify(formData));
    }
  }, [formData, loading, apiError, draftKey]);

  const updateField = <K extends keyof LocationFormData>(field: K, value: LocationFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.code.trim()) {
      toast.error('Vui lòng nhập mã bến tàu');
      return false;
    }
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên bến tàu');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !validateForm()) return;

    setIsSubmitting(true);
    try {
      const res = await updateLocation(locationId, {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        status: formData.status,
      });
      const serverForm = normalizeForm(res?.data);
      setFormData(serverForm);
      localStorage.removeItem(draftKey);
      localStorage.setItem(cacheKey, JSON.stringify({ id: String(locationId), ...serverForm }));
      toast.success(`Đã cập nhật bến tàu ${serverForm.name || serverForm.code}`);
      await hydrateLocation();
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không thể cập nhật bến tàu';
      toast.error(`Cập nhật bến tàu thất bại. ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 w-full font-sans">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to={'/locations' as any}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Quay lại danh sách bến tàu"
            onClick={() => localStorage.removeItem(draftKey)}
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="h-6 w-6 text-blue-600" />
              Chỉnh sửa bến tàu
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Cập nhật mã bến, tên bến và trạng thái sử dụng bằng dữ liệu thật từ hệ thống.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={hydrateLocation}
          disabled={loading}
          className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 disabled:opacity-60"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Đồng bộ
        </button>
      </div>

      {apiError && !loading ? (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium flex items-start gap-2.5">
          <AlertTriangle size={18} className="shrink-0 text-rose-500" />
          <span>Không tải được dữ liệu bến tàu. {apiError}</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
          <div className="px-5 py-3 bg-[#EBF7FA] border-b border-cyan-100 text-sm font-bold text-slate-800 uppercase">
            I. Thông tin cơ bản
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Mã bến tàu <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => updateField('code', e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 32))}
                disabled={loading}
                className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm focus:border-blue-500 outline-none disabled:opacity-60"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tên bến tàu <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value.slice(0, 120))}
                disabled={loading}
                className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none disabled:opacity-60"
                required
              />
            </div>
          </div>

          <div className="px-5 py-3 bg-[#EBF7FA] border-y border-cyan-100 text-sm font-bold text-slate-800 uppercase">
            II. Trạng thái sử dụng
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Trạng thái</label>
              <select
                value={formData.status}
                onChange={(e) => updateField('status', e.target.value as LocationFormData['status'])}
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
              to={'/locations' as any}
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
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
