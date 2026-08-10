import React, { useState, useEffect } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { Ship, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { updateBoat, findBoatById } from '@/apis/boats';

export const Route = createFileRoute('/_admin/boats/$boatId/edit')({
  component: BoatEditPage,
});

function BoatEditPage() {
  const { boatId } = Route.useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    capacity: 0,
    speed: '',
    is_express: true,
    status: 'active' as 'active' | 'maintenance' | 'inactive',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchBoatDetails = async () => {
      setLoading(true);
      try {
        const res = await findBoatById(boatId);
        if (isMounted && res && res.data) {
          const boat = res.data;
          setFormData({
            code: boat.code || '',
            name: boat.name || '',
            capacity: boat.capacity || 0,
            speed: typeof boat.speed === 'number' ? `${boat.speed} hải lý/giờ` : (boat.speed || ''),
            is_express: boat.is_express ?? true,
            status: boat.status || 'active',
          });
        }
      } catch (err: any) {
        toast.error('Không thể tải thông tin tàu từ Backend API');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    if (boatId) fetchBoatDetails();
    return () => { isMounted = false; };
  }, [boatId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await updateBoat(boatId, {
        code: formData.code,
        name: formData.name,
        capacity: Number(formData.capacity),
        speed: formData.speed,
        is_express: formData.is_express,
        status: formData.status,
      });
      toast.success(`Đã lưu thay đổi cho tàu ${formData.name}`, { id: 'boat-edit-toast' });
      navigate({ to: '/boats' as any });
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message || err?.message || '';
      toast.error(serverMsg || 'Có lỗi xảy ra khi cập nhật tàu', { id: 'boat-edit-toast' });
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
            to={"/boats" as any}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Quay lại danh sách"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Ship className="h-6 w-6 text-blue-600" />
              Chỉnh Sửa Tàu: {loading ? '...' : (formData.name || formData.code)}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">ID Tàu trong cơ sở dữ liệu: <span className="font-mono">{boatId}</span></p>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Mã Định Danh Tàu (Boat Code) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm focus:border-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tên Tàu Cao Tốc <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Sức Chứa (Tổng số ghế) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tốc Độ Vận Hành
            </label>
            <input
              type="text"
              value={formData.speed}
              onChange={(e) => setFormData({ ...formData, speed: e.target.value })}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Trạng Thái Vận Hành
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
            >
              <option value="active">Hoạt động tốt</option>
              <option value="maintenance">Bảo trì định kỳ</option>
              <option value="inactive">Tạm dừng vận hành</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id="is_express_edit"
              checked={formData.is_express}
              onChange={(e) => setFormData({ ...formData, is_express: e.target.checked })}
              className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="is_express_edit" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              Tàu Cao Tốc Express
            </label>
          </div>
        </div>

        {/* Action buttons */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <Link
            to={"/boats" as any}
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
            {isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
          </button>
        </div>
      </form>
    </div>
  );
}
