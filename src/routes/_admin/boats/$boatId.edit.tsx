import React, { useState, useEffect } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { Ship, ArrowLeft, Save, Loader2, Anchor } from 'lucide-react';
import { toast } from 'sonner';

import { updateBoat, findBoatById } from '@/apis/boats';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const Route = createFileRoute('/_admin/boats/$boatId/edit')({
  component: BoatEditPage,
});

function BoatEditPage() {
  const { boatId } = Route.useParams();
  const navigate = useNavigate();

  const draftKey = `superdong_boat_draft_edit_${boatId}`;

  // NO FAKE FALLBACK DATA IN INITIAL STATE (Rule 10 SKILL.md)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    capacity: '',
    speed: '',
    is_express: true,
    status: 'active' as 'active' | 'maintenance' | 'inactive',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // HYDRATE REAL BOAT DETAILS + F5 DRAFT PERSISTENCE (Rule 6 & 10 SKILL.md)
  useEffect(() => {
    let isMounted = true;
    const fetchBoatDetails = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const res = await findBoatById(boatId);
        if (isMounted && res && res.data) {
          const boat = res.data;
          const serverData = {
            code: boat.code || '',
            name: boat.name || '',
            capacity: boat.capacity && boat.capacity > 0 ? String(boat.capacity) : '',
            speed: typeof boat.speed === 'number' ? `${boat.speed} hải lý/giờ` : (boat.speed || ''),
            is_express: boat.is_express ?? true,
            status: (boat.status || 'active') as 'active' | 'maintenance' | 'inactive',
            notes: (boat as any).notes || '',
          };

          // Recover F5 draft if draft exists
          let finalData = serverData;
          try {
            const draftStr = localStorage.getItem(draftKey);
            if (draftStr) {
              finalData = { ...serverData, ...JSON.parse(draftStr) };
            }
          } catch (_) {}

          setFormData(finalData);
        } else {
          if (isMounted) setFetchError('Không tìm thấy dữ liệu tàu từ hệ thống Backend.');
        }
      } catch (err: any) {
        console.warn('Fetch boat details error:', err);
        const serverMsg = err?.response?.data?.message || err?.message || 'Không thể tải thông tin tàu từ Backend API.';
        if (isMounted) setFetchError(serverMsg);
        toast.error(serverMsg);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (boatId) fetchBoatDetails();
    return () => { isMounted = false; };
  }, [boatId, draftKey]);

  // Save F5 Draft on form change after initial load (Rule 6)
  useEffect(() => {
    if (!loading && !fetchError && formData.code) {
      try {
        localStorage.setItem(draftKey, JSON.stringify(formData));
      } catch (_) {}
    }
  }, [formData, loading, fetchError, draftKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.code.trim() || !formData.name.trim()) {
      toast.error('Vui lòng điền đầy đủ Mã tàu và Tên tàu!');
      return;
    }

    const cleanCapacity = formData.capacity.replace(/[^0-9]/g, '');
    if (!cleanCapacity || Number(cleanCapacity) <= 0) {
      toast.error('Vui lòng nhập sức chứa thực tế hợp lệ của tàu (số ghế > 0)!');
      return;
    }

    setIsSubmitting(true);

    try {
      await updateBoat(boatId, {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        capacity: Number(cleanCapacity),
        speed: formData.speed.trim(),
        is_express: formData.is_express,
        status: formData.status,
      });

      // Clear draft on successful save (Rule 6)
      try {
        localStorage.removeItem(draftKey);
      } catch (_) {}

      toast.success(`Đã lưu thay đổi cho tàu ${formData.name} thành công!`);
      navigate({ to: '/boats' as any });
    } catch (err: any) {
      console.error('Update boat error:', err);
      const serverMsg = err?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin tàu.';
      toast.error(serverMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 w-full flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <span className="text-sm font-medium text-slate-500">Đang tải thông tin tàu cao tốc...</span>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium">
          {fetchError}
        </div>
        <Button variant="outline" asChild>
          <Link to={'/boats' as any}>Quay lại danh sách Đội tàu</Link>
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
            <Link to={'/boats' as any} title="Quay lại danh sách">
              <ArrowLeft size={16} />
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Ship className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Chỉnh Sửa Tàu: <span className="text-blue-600 dark:text-blue-400 font-bold">{formData.name || formData.code}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Mã quản lý hệ thống: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">#{boatId}</span>
            </p>
          </div>
        </div>

        <div>
          {formData.status === 'active' ? (
            <Badge variant="success" className="px-3 py-1 text-xs">
              Hoạt động tốt
            </Badge>
          ) : formData.status === 'maintenance' ? (
            <Badge variant="warning" className="px-3 py-1 text-xs">
              Bảo trì định kỳ
            </Badge>
          ) : (
            <Badge variant="danger" className="px-3 py-1 text-xs">
              Tạm dừng vận hành
            </Badge>
          )}
        </div>
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
                placeholder="VD: SD-01, SD-09"
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
                placeholder="VD: Superdong I"
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
                Tốc Độ Vận Hành <span className="text-slate-400 font-normal">(Không bắt buộc)</span>
              </Label>
              <Input
                id="boat-speed"
                type="text"
                value={formData.speed}
                onChange={(e) => setFormData({ ...formData, speed: e.target.value })}
                placeholder="VD: 28 hải lý/giờ"
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
                  Trạng Thái Vận Hành Tàu <span className="text-rose-500 font-bold">*</span>
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
