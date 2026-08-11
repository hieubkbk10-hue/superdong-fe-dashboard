import React, { useEffect, useState } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { Layers, ArrowLeft, Save, Palette, WalletCards, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { findSeatClassById, updateSeatClass } from '@/apis/boats';
import { SeatClass } from '@/types';

export const Route = createFileRoute('/_admin/seat-classes/$classId/edit')({
  component: SeatClassEditPage,
});

type FormData = {
  code: string;
  name: string;
  price: string;
  color: string;
  status: 'active' | 'inactive';
  reason: string;
  version: number;
};

const emptyFormData: FormData = {
  code: '',
  name: '',
  price: '',
  color: '',
  status: 'active',
  reason: '',
  version: 1,
};

const mapSeatClassToForm = (seatClass: SeatClass): FormData => ({
  code: seatClass.code || '',
  name: seatClass.name || '',
  price: typeof seatClass.price === 'number' && seatClass.price > 0 ? String(seatClass.price) : '',
  color: seatClass.color || '',
  status: seatClass.status === 'inactive' || seatClass.is_active === false ? 'inactive' : 'active',
  reason: '',
  version: seatClass.version || 1,
});

function SeatClassEditPage() {
  const { classId } = Route.useParams();
  const navigate = useNavigate();
  const draftKey = `superdong_seat_class_draft_edit_${classId}`;
  const [formData, setFormData] = useState<FormData>(emptyFormData);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftReady, setDraftReady] = useState(false);

  const loadSeatClass = async (preferDraft = true) => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await findSeatClassById(classId);
      const serverForm = mapSeatClassToForm(response.data);
      let nextForm = serverForm;
      if (preferDraft) {
        try {
          const draft = JSON.parse(localStorage.getItem(draftKey) || '{}');
          nextForm = { ...serverForm, ...draft, version: serverForm.version };
        } catch {
          nextForm = serverForm;
        }
      }
      setFormData(nextForm);
      setDraftReady(true);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Dữ liệu có thể đã bị xóa hoặc API chi tiết chưa sẵn sàng';
      setLoadError(message);
      toast.error(`Không tải được hạng ghế. ${message}`, { id: 'seat-class-edit-toast' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeatClass();
  }, [classId]);

  useEffect(() => {
    if (draftReady) {
      localStorage.setItem(draftKey, JSON.stringify({ ...formData, reason: formData.reason }));
    }
  }, [formData, draftReady, draftKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      toast.error('Vui lòng nhập đầy đủ mã hạng ghế và tên hạng ghế', { id: 'seat-class-edit-toast' });
      return;
    }
    if (!formData.price || Number(formData.price) < 0) {
      toast.error('Vui lòng nhập giá cơ sở hợp lệ cho hạng ghế', { id: 'seat-class-edit-toast' });
      return;
    }
    if (!formData.reason.trim()) {
      toast.error('Vui lòng nhập lý do chỉnh sửa để lưu vết vận hành', { id: 'seat-class-edit-toast' });
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const payload: Record<string, any> = {
        code: formData.code.trim().toLowerCase(),
        name: formData.name.trim(),
        price: Number(formData.price),
        status: formData.status,
        color: formData.color.trim() || null,
        expected_version: formData.version,
        reason: formData.reason.trim(),
      };

      await updateSeatClass(classId, payload);
      localStorage.removeItem(draftKey);
      toast.success(`Đã lưu thay đổi cho hạng ghế ${formData.name.trim()}`, { id: 'seat-class-edit-toast' });
      await loadSeatClass(false);
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message || err?.message || '';
      toast.error(serverMsg || 'Không thể cập nhật hạng ghế', { id: 'seat-class-edit-toast' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" />
        Đang tải dữ liệu hạng ghế...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4 font-sans">
        <Link to={'/seat-classes' as any} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
          <ArrowLeft size={16} /> Quay lại danh sách hạng ghế
        </Link>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-start gap-2">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div>
            <div className="font-bold">Không tải được hạng ghế.</div>
            <div>{loadError}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={'/seat-classes' as any}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Quay lại danh sách hạng ghế"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="h-6 w-6 text-blue-600" />
              Chỉnh sửa hạng ghế: {formData.name || 'Chưa cập nhật'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Cập nhật thông tin hạng ghế từ dữ liệu đang lưu trên hệ thống.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        <div className="bg-[#EBF7FA] px-6 py-3 text-xs font-bold uppercase tracking-wide text-slate-700">I. Thông tin hạng ghế</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Mã hạng ghế <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
              placeholder="VD: standard, vip, business"
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm focus:border-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tên hạng ghế <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: Phổ thông, VIP, Thương gia"
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
              required
            />
          </div>
        </div>

        <div className="bg-[#EBF7FA] px-6 py-3 text-xs font-bold uppercase tracking-wide text-slate-700">II. Giá vé và nhận diện</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Giá cơ sở hạng ghế (VNĐ) <span className="text-red-500">*</span></label>
            <div className="relative">
              <WalletCards size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                inputMode="numeric"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value.replace(/[^0-9]/g, '') })}
                placeholder="VD: 320000"
                className="w-full h-10 pl-9 pr-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Màu nhận diện</label>
            <div className="relative">
              <Palette size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="VD: #0284c7"
                className="w-full h-10 pl-9 pr-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-[#EBF7FA] px-6 py-3 text-xs font-bold uppercase tracking-wide text-slate-700">III. Trạng thái và lý do lưu vết</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Trạng thái áp dụng</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
            >
              <option value="active">Đang áp dụng</option>
              <option value="inactive">Tạm ngưng áp dụng</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Lý do chỉnh sửa <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="VD: Cập nhật giá cơ sở theo quyết định vận hành"
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
              required
            />
          </div>
        </div>

        <div className="p-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <Link to={'/seat-classes' as any} className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Hủy bỏ
          </Link>
          <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-70">
            <Save size={16} />
            {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </div>
  );
}
