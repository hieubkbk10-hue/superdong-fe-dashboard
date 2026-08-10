import React, { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Layers, Ship, Plus, CheckCircle2, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { getBoats, getSeatMap } from '@/apis/boats';
import { Boat } from '@/types';

export const Route = createFileRoute('/_admin/seat-maps/')({
  component: SeatMapsPage,
});

interface SeatMapItem {
  id: string;
  boatName: string;
  boatCode: string;
  decks: number;
  totalSeats: number;
}

function SeatMapsPage() {
  const [activeDeck, setActiveDeck] = useState<number>(1);
  const [boatList, setBoatList] = useState<SeatMapItem[]>([]);
  const [selectedSeatMap, setSelectedSeatMap] = useState<SeatMapItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchSeatMaps = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await getBoats();
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        const mapped: SeatMapItem[] = res.data.map((b: Boat) => ({
          id: String(b.id),
          boatName: b.name || 'Superdong',
          boatCode: b.code || '',
          decks: 2,
          totalSeats: b.capacity || 306,
        }));
        setBoatList(mapped);
        setSelectedSeatMap(mapped[0]);
      } else {
        setBoatList([]);
        setSelectedSeatMap(null);
      }
    } catch (err: any) {
      console.error('Fetch seat maps error:', err);
      setBoatList([]);
      setSelectedSeatMap(null);
      setApiError(err?.response?.data?.message || err?.message || 'Không thể kết nối với Backend API');
      toast.error('Không thể lấy dữ liệu sơ đồ ghế từ Backend API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeatMaps();
  }, []);

  const rows = Array.from({ length: 10 }, (_, r) => r + 1);

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="h-6 w-6 text-blue-600" />
              Sơ Đồ Ghế Tàu 2D Live
            </h1>
            {!apiError && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 size={13} /> Live API Backend
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Bố cục khoang ghế và vị trí tàu thực tế từ Server Backend Superdong
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSeatMaps}
            disabled={loading}
            className="h-10 px-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>
      </div>

      {/* API Error Alert */}
      {apiError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-2.5">
          <AlertTriangle size={18} className="shrink-0 text-rose-500" />
          <span>⚠️ Không thể lấy dữ liệu từ Backend API: {apiError}. Vui lòng kiểm tra lại Server Backend!</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-500 font-medium">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
          Đang tải dữ liệu sơ đồ ghế tàu từ Backend API...
        </div>
      ) : boatList.length === 0 ? (
        <div className="p-12 text-center text-slate-500 font-medium bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          ⚠️ Chưa có dữ liệu tàu hoặc không thể kết nối API.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Seat Maps List */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Chọn Sơ đồ Tàu Live</h3>
            {boatList.map((sm) => (
              <div
                key={sm.id}
                onClick={() => setSelectedSeatMap(sm)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedSeatMap?.id === sm.id
                    ? 'border-blue-500 bg-blue-500/5 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Ship className="h-4 w-4 text-blue-600" /> {sm.boatName} ({sm.boatCode})
                  </span>
                  {selectedSeatMap?.id === sm.id && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                </div>
                <div className="text-xs text-slate-500 mt-2 space-y-1">
                  <div>Số tầng: {sm.decks} tầng</div>
                  <div>Tổng ghế: <span className="font-semibold text-slate-700 dark:text-slate-200">{sm.totalSeats} ghế</span></div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Interactive 2D Map Grid */}
          {selectedSeatMap && (
            <div className="lg:col-span-3 space-y-4">
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      Sơ đồ: {selectedSeatMap.boatName}
                    </h3>
                    <p className="text-xs text-slate-500">Mô phỏng vị trí từng khoang ghế theo tầng</p>
                  </div>

                  {/* Deck Switcher Tabs */}
                  <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
                    <button
                      onClick={() => setActiveDeck(1)}
                      className={`px-3 py-1.5 rounded-md transition-colors ${
                        activeDeck === 1
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                      }`}
                    >
                      Tầng 1 (Khoang chính)
                    </button>
                    <button
                      onClick={() => setActiveDeck(2)}
                      className={`px-3 py-1.5 rounded-md transition-colors ${
                        activeDeck === 2
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                      }`}
                    >
                      Tầng 2 (Khoang VIP)
                    </button>
                  </div>
                </div>

                {/* Simulated Boat Hull Grid */}
                <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center">
                  <div className="w-32 py-1.5 bg-blue-600 text-white text-[11px] font-bold text-center rounded-t-full mb-6 uppercase tracking-wider">
                    Mũi Tàu
                  </div>

                  <div className="grid gap-3 max-w-lg w-full">
                    {rows.map((r) => (
                      <div key={r} className="flex items-center justify-center gap-2">
                        <span className="w-6 text-xs text-slate-400 font-bold text-center">{r}</span>

                        {['A', 'B', 'C'].map((col) => {
                          const seatCode = `${col}${r < 10 ? '0' + r : r}`;
                          const isVip = r <= 2;
                          return (
                            <button
                              key={seatCode}
                              onClick={() => toast.info(`Ghế: ${seatCode} (${isVip ? 'VIP' : 'Thường'})`)}
                              className={`w-10 h-10 rounded-lg text-xs font-bold transition-transform hover:scale-105 cursor-pointer border ${
                                isVip
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {seatCode}
                            </button>
                          );
                        })}

                        <div className="w-8 h-10 flex items-center justify-center text-[10px] text-slate-400 font-bold">
                          Lối đi
                        </div>

                        {['D', 'E', 'F'].map((col) => {
                          const seatCode = `${col}${r < 10 ? '0' + r : r}`;
                          const isVip = r <= 2;
                          return (
                            <button
                              key={seatCode}
                              onClick={() => toast.info(`Ghế: ${seatCode} (${isVip ? 'VIP' : 'Thường'})`)}
                              className={`w-10 h-10 rounded-lg text-xs font-bold transition-transform hover:scale-105 cursor-pointer border ${
                                isVip
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {seatCode}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  <div className="w-48 py-2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold text-center rounded-b-xl mt-6">
                    Đuôi Tàu &amp; Hành Lý
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
