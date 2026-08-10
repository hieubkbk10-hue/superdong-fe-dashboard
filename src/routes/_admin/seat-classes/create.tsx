import React, { useState } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { Layers, ArrowLeft, Save, Tag, DollarSign, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { createSeatClass } from '@/apis/boats';

export const Route = createFileRoute('/_admin/seat-classes/create')({
  component: SeatClassCreatePage,
});

function SeatClassCreatePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    priceMultiplier: 1.2,
    fixedSurcharge: 30000,
    amenities: 'Ghế bọc da ngả 45°, Nước uống suối, Khăn lạnh',
    status: 'active' as 'active' | 'inactive',
    note: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      toast.error('Vui lòng nhập đầy đủ Mã Hạng và Tên Hạng Ghế');
      return;
    }

    setIsSubmitting(true);
    try {
      await createSeatClass({
        code: formData.code,
        name: formData.name,
        base_price_multiplier: Number(formData.priceMultiplier),
        description: formData.amenities,
        is_active: formData.status === 'active',
      });
      toast.success(`Tạo thành công hạng ghế mới: ${formData.name}`);
      navigate({ to: '/seat-classes' as any });
    } catch (err: any) {
      console.error('Create seat class error:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Lỗi: Không thể tạo hạng ghế mới trên Backend Server');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl font-sans">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={"/seat-classes" as any}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Quay lại danh sách hạng ghế"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="h-6 w-6 text-blue-600" />
              Thêm Hạng Ghế Tàu Mới
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Khai báo hạng ghế mới, hệ số phụ thu giá vé và tiện ích đi kèm cho hành khách
            </p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Mã Hạng Ghế (Class Code) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="VD: STANDARD, VIP, BUSINESS..."
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm focus:border-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tên Hạng Ghế Hiển Thị <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: Khoang Thương Gia VIP"
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Hệ Số Nhân Giá Vé (Multiplier) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="5.0"
                value={formData.priceMultiplier}
                onChange={(e) => setFormData({ ...formData, priceMultiplier: Number(e.target.value) })}
                className="w-full h-10 pl-9 pr-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
                required
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">VD: 1.0 = Giá chuẩn; 1.3 = Tăng 30% so với vé thường</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Phụ Thu Cố Định Thêm (VNĐ)
            </label>
            <div className="relative">
              <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                step="10000"
                value={formData.fixedSurcharge}
                onChange={(e) => setFormData({ ...formData, fixedSurcharge: Number(e.target.value) })}
                placeholder="VD: 50000"
                className="w-full h-10 pl-9 pr-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Danh Sách Tiện Ích Đi Kèm (Phân cách bằng dấu phẩy)
            </label>
            <div className="relative">
              <Sparkles size={16} className="absolute left-3 top-3 text-slate-400" />
              <textarea
                rows={2}
                value={formData.amenities}
                onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                placeholder="Ghế bọc da ngả 45°, Nước uống + khăn lạnh, TV giải trí..."
                className="w-full pl-9 p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Trạng Thái Áp Dụng
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
            >
              <option value="active">Đang áp dụng</option>
              <option value="inactive">Tạm ngưng áp dụng</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Ghi Chú
            </label>
            <textarea
              rows={2}
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <Link
            to={"/seat-classes" as any}
            className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Hủy bỏ
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save size={16} />
            {isSubmitting ? 'Đang lưu...' : 'Lưu Hạng Ghế Mới'}
          </button>
        </div>
      </form>
    </div>
  );
}
