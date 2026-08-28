import React, { useState, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Ship, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { updateBoat, findBoatById } from '@/apis/boats';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Label } from '@/components/ui/label';
import {
  AdminFormHeader,
  AdminFormCard,
  FormSectionBlock,
  FormInputField,
  FormSelectField,
  UnsavedChangesBar,
  useFormDirty,
} from '@/components/common/FormUtilities';

export const Route = createFileRoute('/_admin/boats/$boatId/edit')({
  component: BoatEditPage,
});

type BoatFormData = {
  code: string;
  name: string;
  capacity: string;
  speed: string;
  is_express: boolean;
  status: 'active' | 'maintenance' | 'inactive';
};

const emptyFormData: BoatFormData = {
  code: '',
  name: '',
  capacity: '',
  speed: '',
  is_express: true,
  status: 'active',
};

function BoatEditPage() {
  const { boatId } = Route.useParams();
  const navigate = useNavigate();

  const [initialData, setInitialData] = useState<BoatFormData | null>(null);
  const [formData, setFormData] = useState<BoatFormData>(emptyFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchBoatDetails = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const res = await findBoatById(boatId);
        if (isMounted && res && res.data) {
          const boat = res.data;
          const serverData: BoatFormData = {
            code: boat.code || '',
            name: boat.name || '',
            capacity: boat.capacity && boat.capacity > 0 ? String(boat.capacity) : '',
            speed: typeof boat.speed === 'number' ? `${boat.speed} hải lý/giờ` : (boat.speed || ''),
            is_express: boat.is_express ?? true,
            status: (boat.status || 'active') as 'active' | 'maintenance' | 'inactive',
          };

          setInitialData(serverData);
          setFormData(serverData);
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
  }, [boatId]);

  // Dirty State Detection
  const { isDirty } = useFormDirty(initialData, formData);

  const handleReset = () => {
    if (initialData) {
      setFormData(initialData);
      toast.info('Đã khôi phục dữ liệu ban đầu');
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!isDirty) {
      toast.info('Dữ liệu hiện tại chưa có thay đổi nào cần lưu');
      return;
    }

    if (!formData.code.trim() || !formData.name.trim()) {
      toast.error('Vui lòng điền đầy đủ Mã tàu và Tên tàu!');
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
      await updateBoat(boatId, {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        capacity: Number(cleanCapacity),
        speed: formData.speed.trim(),
        is_express: formData.is_express,
        status: formData.status,
      });

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
        <span className="text-xs font-medium text-slate-500">Đang tải thông tin tàu cao tốc...</span>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 rounded-2xl text-xs font-medium">
          {fetchError}
        </div>
        <Button variant="outline" onClick={() => navigate({ to: '/boats' as any })}>
          Quay lại danh sách Đội tàu
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full font-sans pb-20 text-slate-800 dark:text-slate-200">
      {/* Top Header Navigation Bar */}
      <AdminFormHeader
        icon={Ship}
        title={
          <>
            Chỉnh Sửa Tàu:{' '}
            <span className="text-blue-600 dark:text-blue-400 font-bold">
              {formData.name || formData.code}
            </span>
          </>
        }
        subtitle="Cập nhật thông số kỹ thuật, sức chứa và trạng thái vận hành của tàu"
        backTo="/boats"
        badge={
          formData.status === 'active' ? (
            <Badge variant="success">Hoạt động tốt</Badge>
          ) : formData.status === 'maintenance' ? (
            <Badge variant="warning">Bảo trì định kỳ</Badge>
          ) : (
            <Badge variant="danger">Tạm dừng vận hành</Badge>
          )
        }
      />

      {/* Main Single Card Container */}
      <AdminFormCard onSubmit={handleSubmit}>
        {/* SECTION 1: THÔNG TIN CƠ BẢN */}
        <FormSectionBlock title="I. Thông tin cơ bản">
          <FormInputField
            id="boat-code"
            label="Mã Định Danh Tàu (Boat Code)"
            required
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="VD: SD-01, SD-09"
            className="font-mono font-bold uppercase"
          />
          <FormInputField
            id="boat-name"
            label="Tên Tàu Cao Tốc"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="VD: Superdong I"
          />
        </FormSectionBlock>

        {/* SECTION 2: THÔNG SỐ THIẾT KẾ & SỨC CHỨA */}
        <FormSectionBlock title="II. Thông số thiết kế & Sức chứa">
          <FormInputField
            id="boat-capacity"
            label="Sức Chứa (Tổng số ghế thực tế)"
            required
            inputMode="numeric"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: e.target.value.replace(/[^0-9]/g, '') })}
            placeholder="VD: 306"
            className="font-mono font-bold"
          />
          <FormInputField
            id="boat-speed"
            label="Tốc Độ Vận Hành"
            optional
            value={formData.speed}
            onChange={(e) => setFormData({ ...formData, speed: e.target.value })}
            placeholder="VD: 28 hải lý/giờ"
          />
        </FormSectionBlock>

        {/* SECTION 3: TRẠNG THÁI & VẬN HÀNH */}
        <FormSectionBlock title="III. Trạng thái & Vận hành">
          <FormSelectField
            id="boat-status"
            label="Trạng Thái Vận Hành Tàu"
            required
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            options={[
              { value: 'active', label: 'Hoạt động tốt' },
              { value: 'maintenance', label: 'Bảo trì định kỳ' },
              { value: 'inactive', label: 'Tạm dừng vận hành' },
            ]}
          />

          <div className="flex items-center gap-2 pt-5">
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
        </FormSectionBlock>

      </AdminFormCard>

      {/* Floating Action Bar for Unsaved Changes */}
      <UnsavedChangesBar
        isDirty={isDirty}
        isSaving={isSubmitting}
        onSave={handleSubmit}
        onReset={handleReset}
      />
    </div>
  );
}
