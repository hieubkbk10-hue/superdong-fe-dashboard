import React, { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  Users,
  Armchair,
  Baby,
  Sparkles,
  Tag,
} from 'lucide-react';
import { toast } from 'sonner';
import { createTravelerType } from '@/apis/pricing';
import { Label } from '@/components/ui/label';
import {
  AdminFormHeader,
  AdminFormCard,
  FormSectionBlock,
  FormField,
  FormInputField,
  AdminFormActionBar,
} from '@/components/common/FormUtilities';

export const Route = createFileRoute('/_admin/traveler-types/create')({
  component: TravelerTypeCreatePage,
});

interface TravelerTypeCreateFormData {
  code: string;
  display_name: string;
  requires_seat: boolean;
  discount_percent: number;
  description: string;
  is_active: boolean;
}

const DEFAULT_TRAVELER_TYPE: TravelerTypeCreateFormData = {
  code: '',
  display_name: '',
  requires_seat: true,
  discount_percent: 0,
  description: '',
  is_active: true,
};

function TravelerTypeCreatePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<TravelerTypeCreateFormData>(DEFAULT_TRAVELER_TYPE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClear = () => {
    setFormData(DEFAULT_TRAVELER_TYPE);
    toast.success('Đã làm sạch dữ liệu');
  };

  const handleSeatRuleChange = (requiresSeat: boolean) => {
    setFormData((prev) => ({
      ...prev,
      requires_seat: requiresSeat,
      discount_percent: !requiresSeat ? 100 : (prev.discount_percent === 100 ? 50 : prev.discount_percent),
    }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!formData.display_name.trim() || !formData.code.trim()) {
      toast.error('Vui lòng điền Tên và Mã phân loại hành khách!');
      return;
    }

    if (!formData.requires_seat && formData.discount_percent !== 100) {
      toast.error('Đối tượng không giữ ghế riêng bắt buộc phải có tỷ lệ giảm giá 100% (miễn phí)!');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await createTravelerType({
        code: formData.code.toUpperCase().trim(),
        display_name: formData.display_name.trim(),
        name: formData.display_name.trim(),
        requires_seat: formData.requires_seat,
        discount_percent: Number(formData.discount_percent),
        discount_percentage: Number(formData.discount_percent),
        description: formData.description,
        is_active: formData.is_active,
        status: formData.is_active ? 'active' : 'inactive',
      });
      toast.success(`Đã tạo phân loại hành khách ${formData.display_name} thành công!`, { id: 'traveler-type-create-toast' });
      navigate({ to: '/traveler-types' as any });
    } catch (err: any) {
      console.error('Failed to create traveler type:', err);
      const serverMsg = err?.response?.data?.message || err?.message || '';
      toast.error(serverMsg || 'Không thể tạo phân loại hành khách trên Backend Server', { id: 'traveler-type-create-toast' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 w-full font-sans pb-20 text-slate-800 dark:text-slate-200">
      {/* Top Header Navigation Bar */}
      <AdminFormHeader
        icon={Users}
        title="Tạo Phân Loại Hành Khách Mới"
        subtitle="Cấu hình đối tượng áp dụng mức miễn giảm giá vé và điều kiện chiếm ghế tàu"
        backTo="/traveler-types"
        onClear={handleClear}
        clearLabel="Làm sạch dữ liệu"
      />

      {/* Main Single Card Form */}
      <AdminFormCard onSubmit={handleSubmit}>
        {/* SECTION 1: THÔNG TIN PHÂN LOẠI */}
        <FormSectionBlock title="I. Thông tin phân loại & Quy định vé" columns={2}>
          <FormInputField
            id="traveler-code"
            label="Mã Phân Loại (CODE)"
            required
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="VD: STUDENT, MONK, POLICE..."
            className="font-mono font-bold uppercase text-blue-600 dark:text-blue-400"
            helperText="Dùng để nhận diện trong mã vé và hệ thống API"
          />

          <FormInputField
            id="traveler-name"
            label="Tên Đối Tượng / Phân Loại"
            required
            value={formData.display_name}
            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
            placeholder="VD: Học sinh - Sinh viên, Tu sĩ..."
            helperText="Tên hiển thị cho khách hàng và nhân viên khi chọn loại vé"
          />

          {/* Quy định chỗ ngồi */}
          <div className="md:col-span-2 space-y-2">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Armchair size={14} className="text-blue-500" />
              Quy định Chỗ Ngồi &amp; Chiếm Ghế Tàu <span className="text-rose-500">*</span>
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => handleSeatRuleChange(true)}
                className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                  formData.requires_seat
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <div
                  className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                    formData.requires_seat ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {formData.requires_seat && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Armchair size={13} className="text-blue-600 dark:text-blue-400" />
                    Bắt buộc giữ ghế riêng
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Hành khách được phân bổ 1 vị trí ghế riêng biệt trên sơ đồ tàu (Áp dụng cho Người lớn, Trẻ em, Học sinh...).
                  </p>
                </div>
              </div>

              <div
                onClick={() => handleSeatRuleChange(false)}
                className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                  !formData.requires_seat
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <div
                  className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                    !formData.requires_seat ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {!formData.requires_seat && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Baby size={13} className="text-amber-500" />
                    Ngồi chung với người lớn
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Không chiếm ghế riêng trên tàu, đi kèm vé người lớn và bắt buộc miễn phí vé 100% (Áp dụng cho Em bé dưới 6 tuổi).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mức giảm giá vé */}
          <div className="space-y-1.5">
            <Label htmlFor="traveler-discount" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Tag size={13} className="text-blue-500" />
              Mức Giảm Giá Vé (%) <span className="text-rose-500">*</span>
            </Label>
            <div className="relative flex items-center">
              <input
                id="traveler-discount"
                type="number"
                min={0}
                max={100}
                disabled={!formData.requires_seat}
                required
                value={formData.discount_percent}
                onChange={(e) => setFormData({ ...formData, discount_percent: Math.min(100, Math.max(0, Number(e.target.value))) })}
                className="w-full h-9 px-3 pr-10 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-500"
              />
              <span className="absolute right-3 text-xs font-bold text-slate-400 pointer-events-none">%</span>
            </div>
            <div className="text-[11px] mt-1">
              {formData.discount_percent === 0 && (
                <span className="text-slate-500 font-medium">➡️ 100% Giá vé gốc (Không giảm)</span>
              )}
              {formData.discount_percent === 100 && (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <Sparkles size={11} /> Miễn phí vé 100% (Giá vé 0 ₫)
                </span>
              )}
              {formData.discount_percent > 0 && formData.discount_percent < 100 && (
                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                  ➡️ Giảm {formData.discount_percent}% so với giá vé gốc (Khách thanh toán {100 - formData.discount_percent}%)
                </span>
              )}
            </div>
          </div>

          {/* Kích hoạt áp dụng */}
          <div className="flex flex-col justify-center pt-2">
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
              <input
                type="checkbox"
                id="is_active_type"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <Label htmlFor="is_active_type" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                Kích hoạt áp dụng phân loại này khi đặt vé
              </Label>
            </div>
          </div>

          {/* Mô tả & Điều kiện */}
          <div className="md:col-span-2">
            <FormField id="traveler-desc" label="Mô Tả & Quy Định Giấy Tờ Cần Xuất Trình">
              <textarea
                id="traveler-desc"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="VD: Áp dụng cho học sinh, sinh viên các trường ĐH, CĐ chính quy có thẻ sinh viên còn hiệu lực..."
                className="w-full p-3 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 outline-none focus:border-blue-500 placeholder:text-slate-400"
              />
            </FormField>
          </div>
        </FormSectionBlock>

        {/* Master Action Bar */}
        <AdminFormActionBar
          mode="create"
          isSubmitting={isSubmitting}
          cancelTo="/traveler-types"
          submitLabel="Tạo phân loại"
          onClear={handleClear}
          clearLabel="Làm sạch dữ liệu"
        />
      </AdminFormCard>
    </div>
  );
}
