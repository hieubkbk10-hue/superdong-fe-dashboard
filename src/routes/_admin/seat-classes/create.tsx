import React, { useEffect, useState } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { Layers, ArrowLeft, Save, RotateCcw, WalletCards } from 'lucide-react';
import { toast } from 'sonner';
import { createSeatClass } from '@/apis/boats';
import { ColorPickerInput } from '@/components/common/ColorPickerInput';

export const Route = createFileRoute('/_admin/seat-classes/create')({
  component: SeatClassCreatePage,
});

const draftKey = 'superdong_seat_class_draft_create';
const defaultFormData = {
  code: '',
  name: '',
  price: '',
  color: '',
  status: 'active' as 'active' | 'inactive',
  reason: '',
};

function SeatClassCreatePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(() => {
    try {
      return { ...defaultFormData, ...JSON.parse(localStorage.getItem(draftKey) || '{}') };
    } catch {
      return defaultFormData;
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    localStorage.setItem(draftKey, JSON.stringify(formData));
  }, [formData]);

  const clearForm = () => {
    setFormData(defaultFormData);
    localStorage.removeItem(draftKey);
    toast.success('Đã làm sạch dữ liệu nhập');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      toast.error('Vui lòng nhập đầy đủ mã hạng ghế và tên hạng ghế');
      return;
    }
    if (!formData.price || Number(formData.price) < 0) {
      toast.error('Vui lòng nhập giá cơ sở hợp lệ cho hạng ghế');
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
      };
      if (formData.color.trim()) payload.color = formData.color.trim();
      if (formData.reason.trim()) payload.reason = formData.reason.trim();

      await createSeatClass(payload);
      localStorage.removeItem(draftKey);
      toast.success(`Tạo thành công hạng ghế: ${formData.name.trim()}`, { id: 'seat-class-create-toast' });
      navigate({ to: '/seat-classes' as any });
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message || err?.message || '';
      toast.error(serverMsg || 'Không thể tạo hạng ghế mới', { id: 'seat-class-create-toast' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 w-full font-sans">
      <div className="flex items-center justify-between gap-4">
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
              Thêm hạng ghế mới
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Khai báo giá cơ sở và trạng thái áp dụng cho hạng ghế bán vé.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={clearForm}
          className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw size={14} />
          Làm sạch dữ liệu
        </button>
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
            <ColorPickerInput
              value={formData.color}
              onChange={(color) => setFormData({ ...formData, color })}
            />
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
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Lý do tạo hạng ghế</label>
            <input
              type="text"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Không bắt buộc, VD: Bổ sung hạng ghế cho tuyến mới"
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="p-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <Link to={'/seat-classes' as any} className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Hủy bỏ
          </Link>
          <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-70">
            <Save size={16} />
            {isSubmitting ? 'Đang lưu...' : 'Lưu hạng ghế'}
          </button>
        </div>
      </form>
    </div>
  );
}
