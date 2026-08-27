import React, { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { QrCode, CheckCircle2, Search, RotateCcw, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { resolveQr, checkInTravelers, reverseCheckIn } from '@/apis/ticketing';
import { Button } from '@/components/common/Button';

export const Route = createFileRoute('/_admin/check-in/')({
  component: CheckInPage,
});

function CheckInPage() {
  const [ticketCode, setTicketCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentCheckIns, setRecentCheckIns] = useState<Array<{ code: string; time: string; id?: string | number }>>([]);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketCode.trim()) return;

    setIsSubmitting(true);
    try {
      await resolveQr(ticketCode);
      const res = await checkInTravelers([ticketCode]);
      const checkInRecord = res.data?.[0] || { id: Date.now(), ticket_code: ticketCode, status: 'checked_in' };

      setRecentCheckIns((prev) => [
        { code: ticketCode, time: new Date().toLocaleTimeString('vi-VN'), id: checkInRecord.id },
        ...prev.slice(0, 4),
      ]);
      toast.success(`Xác nhận Check-in thành công cho vé: ${ticketCode}`);
      setTicketCode('');
    } catch (err: any) {
      console.error('Check-in error:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Lỗi soát vé: Không thể xác thực từ Backend API');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReverse = async (checkInId?: string | number, code?: string) => {
    try {
      if (checkInId) {
        await reverseCheckIn(checkInId, 'Hủy bởi soát vé viên tại quầy');
      }
      toast.info(`Đã đảo ngược / Hủy lượt check-in cho vé ${code || ''}`);
      setRecentCheckIns((prev) => prev.filter((item) => item.code !== code));
    } catch (err: any) {
      console.error('Reverse check-in error:', err);
      toast.error(`Lỗi hủy check-in: ${err?.message || 'Không thể hủy'}`);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto font-sans pb-16">
      {/* Title Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex p-3 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-2xl mb-1">
          <QrCode size={28} />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Soát Vé &amp; Check-in Hành Khách
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Quét mã QR trên vé điện tử hoặc nhập Mã vé / Số điện thoại để xác nhận lên tàu
        </p>
      </div>

      {/* Check-in Form Card */}
      <form onSubmit={handleCheckIn} className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Mã Vé QR Hoặc Số Điện Thoại
          </label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={ticketCode}
              onChange={(e) => setTicketCode(e.target.value)}
              placeholder="VD: TK-99201-A04 hoặc 0903123456..."
              className="w-full h-11 pl-10 pr-4 text-xs font-mono border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-600 transition-colors"
              autoFocus
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <RefreshCw size={15} className="animate-spin" /> Đang Xác Thực Vé...
            </>
          ) : (
            <>
              <CheckCircle2 size={15} /> Xác Nhận Cho Lên Tàu
            </>
          )}
        </Button>
      </form>

      {/* Recent Check-in Logs Card */}
      {recentCheckIns.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs space-y-3">
          <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-500" />
            Lịch Sử Soát Vé Vừa Thực Hiện
          </h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentCheckIns.map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{item.code}</span>
                  <span className="text-slate-400">{item.time}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleReverse(item.id, item.code)}
                  className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 font-medium cursor-pointer transition-colors"
                >
                  <RotateCcw size={12} /> Hủy Check-in
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
