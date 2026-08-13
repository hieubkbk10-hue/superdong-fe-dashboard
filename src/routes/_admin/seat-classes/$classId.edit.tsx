import React, { useEffect, useState } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { Layers, ArrowLeft, Save, WalletCards, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { findSeatClassById, updateSeatClass } from '@/apis/boats';
import { SeatClass } from '@/types';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ColorPickerInput } from '@/components/common/ColorPickerInput';

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

// NO FAKE FALLBACK DATA IN INITIAL STATE (Rule 10 SKILL.md)
const emptyFormData: FormData = {
  code: '',
  name: '',
  price: '',
  color: '',
  status: 'active',
  reason: '',
  version: 1,
};

function SeatClassEditPage() {
  const { classId } = Route.useParams();
  const navigate = useNavigate();

  const draftKey = `superdong_seat_class_draft_edit_${classId}`;

  const [formData, setFormData] = useState<FormData>(emptyFormData);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // HYDRATE REAL DATA + F5 DRAFT PERSISTENCE (Rule 6 & 10 SKILL.md)
  const loadSeatClass = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await findSeatClassById(classId);
      if (response && response.data) {
        const sc = response.data;
        const serverForm: FormData = {
          code: sc.code || '',
          name: sc.name || '',
          price: typeof sc.price === 'number' && sc.price > 0 ? String(sc.price) : '',
          color: sc.color || '',
          status: sc.status === 'inactive' || (sc as any).is_active === false ? 'inactive' : 'active',
          reason: '',
          version: sc.version || 1,
        };

        // F5 Draft Recovery if draft exists
        let finalData = serverForm;
        try {
          const draftStr = localStorage.getItem(draftKey);
          if (draftStr) {
            finalData = { ...serverForm, ...JSON.parse(draftStr) };
          }
        } catch (_) {}

        setFormData(finalData);
      } else {
        setLoadError('Không tìm thấy dữ liệu Hạng ghế từ hệ thống.');
      }
    } catch (err: any) {
      console.warn('Fetch seat class details error:', err);
      const message = err?.response?.data?.message || err?.message || 'Không thể nạp thông tin Hạng ghế từ Backend API.';
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (classId) loadSeatClass();
  }, [classId]);

  // Auto Save F5 Draft on edit (Rule 6)
  useEffect(() => {
    if (!loading && !loadError && formData.code) {
      try {
        localStorage.setItem(draftKey, JSON.stringify(formData));
      } catch (_) {}
    }
  }, [formData, loading, loadError, draftKey]);

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
        color: formData.color.trim() || null,
        expected_version: formData.version,
      };
      if (formData.reason.trim()) {
        payload.reason = formData.reason.trim();
      }

      await updateSeatClass(classId, payload);

      // Clear draft on successful save (Rule 6)
      try {
        localStorage.removeItem(draftKey);
      } catch (_) {}

      toast.success(`Đã lưu thay đổi cho hạng ghế ${formData.name.trim()} thành công!`);
      navigate({ to: '/seat-classes' as any });
    } catch (err: any) {
      console.error('Update seat class error:', err);
      const serverMsg = err?.response?.data?.message || err?.message || 'Không thể cập nhật hạng ghế.';
      toast.error(serverMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 w-full flex flex-col items-center justify-center gap-3 font-sans">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <span className="text-sm font-medium text-slate-500">Đang tải thông tin hạng ghế...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-8 text-center space-y-4 font-sans">
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium">
          {loadError}
        </div>
        <Button variant="outline" asChild>
          <Link to={'/seat-classes' as any}>Quay lại danh sách Hạng ghế</Link>
        </Button>
      </div>
    );
  }

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
              Chỉnh Sửa Hạng Ghế: <span className="text-blue-600 dark:text-blue-400 font-bold">{formData.name || formData.code}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Mã quản lý hệ thống: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">#{classId}</span>
            </p>
          </div>
        </div>

        <div>
          {formData.status === 'active' ? (
            <Badge variant="success" className="px-3 py-1 text-xs">
              Kích hoạt
            </Badge>
          ) : (
            <Badge variant="danger" className="px-3 py-1 text-xs">
              Tạm ngưng
            </Badge>
          )}
        </div>
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
                  Trạng Thái Áp Dụng <span className="text-rose-500 font-bold">*</span>
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
                  Lý Do Thay Đổi <span className="text-slate-400 font-normal">(Không bắt buộc)</span>
                </Label>
                <Input
                  id="seat-reason"
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="VD: Điều chỉnh giá cơ sở theo quyết định vận hành"
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
                <Loader2 size={16} className="animate-spin" /> Đang lưu...
              </>
            ) : (
              <>
                <Save size={16} /> Lưu Thay Đổi
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
