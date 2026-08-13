import React, { useState, useEffect } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { Ship, ArrowLeft, Save, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { createBoat } from '@/apis/boats';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const Route = createFileRoute('/_admin/boats/create')({
  component: BoatCreatePage,
});

export function BoatCreatePage() {
  const navigate = useNavigate();
  const draftKey = 'superdong_boat_draft_create';

  const defaultFormData = {
    code: '',
    name: '',
    capacity: '',
    speed: '',
    is_express: true,
    status: 'active' as 'active' | 'maintenance' | 'inactive',
    notes: '',
  };

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
  }, [formData, draftKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Vui lòng nhập đầy đủ Mã định danh và Tên tàu!');
      return;
    }

    const cleanCapacity = formData.capacity.replace(/[^0-9]/g, '');
    if (!cleanCapacity || Number(cleanCapacity) <= 0) {
      toast.error('Vui lòng nhập sức chứa thực tế hợp lệ của tàu (số ghế > 0)!');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const payload: Record<string, any> = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        capacity: Number(cleanCapacity),
        is_express: formData.is_express,
        status: formData.status,
      };

      if (formData.speed.trim()) {
        payload.speed = formData.speed.trim();
      }

      await createBoat(payload);

      // Clear draft on successful create (Rule 6)
      try {
        localStorage.removeItem(draftKey);
      } catch (_) {}

      toast.success(`Tạo thành công tàu mới: ${formData.name}`);
      navigate({ to: '/boats' as any });
    } catch (err: any) {
      console.error('Create boat error:', err);
      const serverMsg = err?.response?.data?.message || err?.message || '';
      toast.error(serverMsg || 'Không thể tạo tàu mới trên Backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rule 3.1: Clear Data Button for Create Page
  const clearForm = () => {
    setFormData(defaultFormData);
    try {
      localStorage.removeItem(draftKey);
    } catch (_) {}
    toast.success('Đã làm sạch dữ liệu nhập');
  };

  return (
    <div className="space-y-4 w-full font-sans pb-10 text-slate-800 dark:text-slate-200">
      {/* Top Header Navigation Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Button variant="light" size="icon" className="h-8 w-8" asChild>
            <Link to={'/boats' as any} title="Quay lại danh sách">
              <ArrowLeft size={16} />
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Ship className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Thêm Tàu Cao Tốc Mới
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Khai báo thông số kỹ thuật và sức chứa ghế cho tàu mới trong đội tàu Superdong
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
        
        {/* SECTION 1: THÔNG TIN CƠ BẢN */}
        <div className="space-y-3">
          <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-3.5 py-2 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wide border border-blue-100 dark:border-slate-800">
            I. Thông tin cơ bản
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <Label htmlFor="boat-code" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Mã Định Danh Tàu (Boat Code) <span className="text-rose-500 font-bold">*</span>
              </Label>
              <Input
                id="boat-code"
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="VD: SD-09, SD-12"
                className="text-sm font-mono font-bold uppercase h-9 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="boat-name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tên Tàu Cao Tốc <span className="text-rose-500 font-bold">*</span>
              </Label>
              <Input
                id="boat-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Superdong IX"
                className="text-sm h-9 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                required
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: THÔNG SỐ THIẾT KẾ & SỨC CHỨA */}
        <div className="space-y-3">
          <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-3.5 py-2 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wide border border-blue-100 dark:border-slate-800">
            II. Thông số thiết kế &amp; Sức chứa
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <Label htmlFor="boat-capacity" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Sức Chứa (Tổng số ghế thực tế) <span className="text-rose-500 font-bold">*</span>
              </Label>
              <Input
                id="boat-capacity"
                type="text"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value.replace(/[^0-9]/g, '') })}
                placeholder="VD: 306"
                className="text-sm font-mono h-9 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="boat-speed" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tốc Độ Vận Hành Dự Kiến <span className="text-slate-400 font-normal">(Không bắt buộc)</span>
              </Label>
              <Input
                id="boat-speed"
                type="text"
                value={formData.speed}
                onChange={(e) => setFormData({ ...formData, speed: e.target.value })}
                placeholder="VD: 30 hải lý/giờ"
                className="text-sm h-9 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: TRẠNG THÁI & VẬN HÀNH */}
        <div className="space-y-3">
          <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-3.5 py-2 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wide border border-blue-100 dark:border-slate-800">
            III. Trạng thái &amp; Vận hành
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <Label htmlFor="boat-status" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Trạng Thái Vận Hành Mặc Định <span className="text-rose-500 font-bold">*</span>
                </Label>
                <select
                  id="boat-status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full text-sm h-9 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                >
                  <option value="active">Hoạt động tốt</option>
                  <option value="maintenance">Bảo trì định kỳ</option>
                  <option value="inactive">Tạm dừng vận hành</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  id="boat-is-express"
                  type="checkbox"
                  checked={formData.is_express}
                  onChange={(e) => setFormData({ ...formData, is_express: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <Label htmlFor="boat-is-express" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Tàu Cao Tốc Express (Ưu tiên lịch chạy nhanh)
                </Label>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="boat-notes" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ghi Chú Vận Hành <span className="text-slate-400 font-normal">(Không bắt buộc)</span>
              </Label>
              <textarea
                id="boat-notes"
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Nhập ghi chú kỹ thuật, lịch bảo dưỡng hoặc ghi chú vận hành..."
                className="w-full text-sm p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500"
              />
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
              navigate({ to: '/boats' as any });
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
                <Save size={16} /> Lưu Tàu Mới
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
