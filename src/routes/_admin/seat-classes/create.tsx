import React, { useEffect, useState } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { Layers, ArrowLeft, Save, RotateCcw, WalletCards, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createSeatClass } from '@/apis/boats';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

  // F5 Form Draft Recovery (Rule 6 SKILL.md)
  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) return { ...defaultFormData, ...JSON.parse(saved) };
    } catch (_) {}
    return defaultFormData;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto Save F5 Draft on edit (Rule 6)
  useEffect(() => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(formData));
    } catch (_) {}
  }, [formData]);

  // Rule 3.1: Clear Data Button for Create Page
  const clearForm = () => {
    setFormData(defaultFormData);
    try {
      localStorage.removeItem(draftKey);
    } catch (_) {}
    toast.success('Đã làm sạch dữ liệu nhập');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      toast.error('Vui lòng nhập đầy đủ Mã hạng ghế và Tên hạng ghế!');
      return;
    }

    const cleanPrice = formData.price.replace(/[^0-9]/g, '');
    if (!cleanPrice || Number(cleanPrice) <= 0) {
      toast.error('Vui lòng nhập giá cơ sở hợp lệ (> 0 VNĐ) cho hạng ghế!');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const payload: Record<string, any> = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        price: Number(cleanPrice),
        status: formData.status,
      };
      if (formData.color.trim()) payload.color = formData.color.trim();
      if (formData.reason.trim()) payload.reason = formData.reason.trim();

      await createSeatClass(payload);

      // Clear draft on successful save (Rule 6)
      try {
        localStorage.removeItem(draftKey);
      } catch (_) {}

      toast.success(`Tạo thành công hạng ghế mới: ${formData.name.trim()}`);
      navigate({ to: '/seat-classes' as any });
    } catch (err: any) {
      console.error('Create seat class error:', err);
      const serverMsg = err?.response?.data?.message || err?.message || '';
      toast.error(serverMsg || 'Không thể tạo hạng ghế mới trên Backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 w-full font-sans pb-10 text-slate-800 dark:text-slate-200">
      {/* Top Header Navigation Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Button variant="light" size="icon" className="h-8 w-8" asChild>
            <Link to={'/seat-classes' as any} title="Quay lại danh sách">
              <ArrowLeft size={16} />
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Thêm Hạng Ghế Tàu Mới
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Khai báo giá cơ sở và nhận diện màu sắc cho hạng ghế bán vé Superdong
            </p>
          </div>
        </div>

        {/* Clear Data Button (Rule 3.1 & Rule 4 SKILL.md) */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearForm}
          className="gap-1.5 text-xs text-slate-600 dark:text-slate-300"
        >
          <RotateCcw size={14} />
          Làm sạch dữ liệu
        </Button>
      </div>

      {/* Main Single Card Container matching SKILL.md */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5">
        
        {/* SECTION 1: THÔNG TIN HẠNG GHẾ */}
        <div className="space-y-3">
          <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-3.5 py-2 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wide border border-blue-100 dark:border-slate-800">
            I. Thông tin hạng ghế
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <Label htmlFor="seat-code" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Mã Hạng Ghế (Code) <span className="text-rose-500 font-bold">*</span>
              </Label>
              <Input
                id="seat-code"
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="VD: STANDARD, VIP, BUSINESS"
                className="text-sm font-mono font-bold uppercase h-9 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="seat-name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tên Hạng Ghế <span className="text-rose-500 font-bold">*</span>
              </Label>
              <Input
                id="seat-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Ghế Phổ Thông, Ghế VIP"
                className="text-sm h-9 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                required
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: GIÁ VÉ VÀ NHẬN DIỆN */}
        <div className="space-y-3">
          <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-3.5 py-2 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wide border border-blue-100 dark:border-slate-800">
            II. Giá vé &amp; Nhận diện
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <Label htmlFor="seat-price" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Giá Cơ Sở Hạng Ghế (VNĐ) <span className="text-rose-500 font-bold">*</span>
              </Label>
              <div className="relative">
                <WalletCards size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  id="seat-price"
                  type="text"
                  inputMode="numeric"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value.replace(/[^0-9]/g, '') })}
                  placeholder="VD: 320000"
                  className="text-sm font-mono h-9 pl-9 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="seat-color" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Màu Nhận Diện Sơ Đồ Ghế
              </Label>
              <ColorPickerInput
                value={formData.color}
                onChange={(color) => setFormData({ ...formData, color })}
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: TRẠNG THÁI & GHI CHÚ */}
        <div className="space-y-3">
          <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-3.5 py-2 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wide border border-blue-100 dark:border-slate-800">
            III. Trạng thái &amp; Ghi chú
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <Label htmlFor="seat-status" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Trạng Thái Áp Dụng Mặc Định <span className="text-rose-500 font-bold">*</span>
                </Label>
                <select
                  id="seat-status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full text-sm h-9 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                >
                  <option value="active">Kích hoạt (Đang áp dụng)</option>
                  <option value="inactive">Tạm ngưng (Không áp dụng)</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="seat-reason" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Lý Do Tạo Hạng Ghế <span className="text-slate-400 font-normal">(Không bắt buộc)</span>
                </Label>
                <Input
                  id="seat-reason"
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="VD: Bổ sung hạng ghế thương gia cho tàu mới"
                  className="text-sm h-9 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              try {
                localStorage.removeItem(draftKey);
              } catch (_) {}
              navigate({ to: '/seat-classes' as any });
            }}
          >
            Hủy Bỏ
          </Button>

          <Button type="submit" disabled={isSubmitting} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold">
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Đang tạo...
              </>
            ) : (
              <>
                <Save size={16} /> Lưu Hạng Ghế
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
