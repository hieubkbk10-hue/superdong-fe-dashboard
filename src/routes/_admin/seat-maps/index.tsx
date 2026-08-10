import React, { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Layers, Ship, Plus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { getSeatMap } from '@/apis/boats';

export const Route = createFileRoute('/_admin/seat-maps/')({
  component: SeatMapsPage,
});

interface SeatMapItem {
  id: string;
  boatName: string;
  boatCode: string;
  decks: number;
  totalSeats: number;
  updatedAt: string;
}

const MOCK_SEAT_MAPS: SeatMapItem[] = [
  { id: 'sm-1', boatName: 'Superdong IX', boatCode: 'SD-09', decks: 2, totalSeats: 306, updatedAt: '10/08/2026' },
  { id: 'sm-2', boatName: 'Superdong XII', boatCode: 'SD-12', decks: 2, totalSeats: 275, updatedAt: '09/08/2026' },
  { id: 'sm-3', boatName: 'Superdong Côn Đảo I', boatCode: 'SD-CD01', decks: 2, totalSeats: 306, updatedAt: '05/08/2026' },
];

function SeatMapsPage() {
  const [activeDeck, setActiveDeck] = useState<number>(1);
  const [selectedSeatMap, setSelectedSeatMap] = useState<SeatMapItem>(MOCK_SEAT_MAPS[0]);

  useEffect(() => {
    let isMounted = true;
    const fetchMap = async () => {
      try {
        const res = await getSeatMap(selectedSeatMap.id);
        if (isMounted && res && res.data) {
          toast.success(`Đã tải sơ đồ ghế trực tuyến cho ${selectedSeatMap.boatName}`);
        }
      } catch (err) {
        // Mock fallback view preserved
      }
    };
    fetchMap();
    return () => { isMounted = false; };
  }, [selectedSeatMap.id]);

  // Demo grid 10 rows x 6 seats
  const rows = Array.from({ length: 10 }, (_, r) => r + 1);
  const seatCols = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="h-6 w-6 text-blue-600" />
            Sơ đồ ghế tàu 2D (Visual Seat Map)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Thiết lập bố cục khoang ghế, tầng tàu, lối đi và vị trí ghế dành cho việc xếp chỗ hành khách
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toast.info('Tạo phiên bản sơ đồ ghế mới')}
            className="h-10 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Plus size={16} /> Tạo sơ đồ ghế mới
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Seat Maps List */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Chọn Sơ đồ Tàu</h3>
          {MOCK_SEAT_MAPS.map((sm) => (
            <div
              key={sm.id}
              onClick={() => setSelectedSeatMap(sm)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                selectedSeatMap.id === sm.id
                  ? 'border-blue-500 bg-blue-500/5 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Ship className="h-4 w-4 text-blue-600" /> {sm.boatName} ({sm.boatCode})
                </span>
                {selectedSeatMap.id === sm.id && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
              </div>
              <div className="text-xs text-slate-500 mt-2 space-y-1">
                <div>Số tầng: {sm.decks} tầng</div>
                <div>Tổng ghế: <span className="font-semibold text-slate-700 dark:text-slate-200">{sm.totalSeats} ghế</span></div>
                <div className="text-[11px] text-slate-400">Cập nhật: {sm.updatedAt}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Interactive 2D Map Grid */}
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
                  Tầng 2 (Khoang VIP & Ngoài trời)
                </button>
              </div>
            </div>

            {/* Seat Map Legend */}
            <div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500" />
                <span>Ghế Thường</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-amber-500/20 border border-amber-500" />
                <span>Ghế VIP</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-blue-500/20 border border-blue-500" />
                <span>Ghế Thương Gia</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700" />
                <span>Lối đi / WC</span>
              </div>
            </div>

            {/* Simulated Boat Hull Grid */}
            <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center">
              <div className="w-32 py-1.5 bg-blue-600 text-white text-[11px] font-bold text-center rounded-t-full mb-6 uppercase tracking-wider">
                Mũi Tàu (Khung Điều Hành)
              </div>

              <div className="grid gap-3 max-w-lg w-full">
                {rows.map((r) => (
                  <div key={r} className="flex items-center justify-center gap-2">
                    <span className="w-6 text-xs text-slate-400 font-bold text-center">{r}</span>

                    {/* Left seats A, B, C */}
                    {['A', 'B', 'C'].map((col) => {
                      const seatCode = `${col}${r < 10 ? '0' + r : r}`;
                      const isVip = r <= 2;
                      return (
                        <button
                          key={seatCode}
                          onClick={() => toast.info(`Thông tin ghế: ${seatCode} (${isVip ? 'VIP' : 'Thường'})`)}
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

                    {/* Aisle Space */}
                    <div className="w-8 h-10 flex items-center justify-center text-[10px] text-slate-400 font-bold">
                      Lối đi
                    </div>

                    {/* Right seats D, E, F */}
                    {['D', 'E', 'F'].map((col) => {
                      const seatCode = `${col}${r < 10 ? '0' + r : r}`;
                      const isVip = r <= 2;
                      return (
                        <button
                          key={seatCode}
                          onClick={() => toast.info(`Thông tin ghế: ${seatCode} (${isVip ? 'VIP' : 'Thường'})`)}
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
                Đuôi Tàu &amp; Khu Vực Hành Lý
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
